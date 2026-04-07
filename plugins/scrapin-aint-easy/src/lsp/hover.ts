import pino from 'pino';
import { type SymbolResolver } from './resolver.js';
import { eventBus } from '../core/event-bus.js';

const logger = pino({ name: 'lsp-hover' });

export interface HoverResult {
  contents: {
    kind: 'markdown';
    value: string;
  };
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

interface HoverParams {
  textDocument: { uri: string };
  position: { line: number; character: number };
}

export async function handleHover(
  params: HoverParams,
  resolver: SymbolResolver,
  fileCache: Map<string, string>,
): Promise<HoverResult | null> {
  const { uri } = params.textDocument;
  const { line, character } = params.position;

  const content = fileCache.get(uri);
  if (!content) {
    logger.debug({ uri }, 'File not in cache');
    return null;
  }

  const lines = content.split('\n');
  const lineText = lines[line];
  if (!lineText) {
    return null;
  }

  const wordInfo = extractWordAtPosition(lineText, character);
  if (!wordInfo) {
    return null;
  }

  const imports = extractImportPackages(lines);

  const resolved = imports.length > 0
    ? await resolver.resolveFromImports(wordInfo.word, imports)
    : await resolver.resolve(wordInfo.word);

  await eventBus.emit('lsp:hover', {
    symbol: wordInfo.word,
    found: resolved !== null,
  });

  if (!resolved) {
    logger.debug({ word: wordInfo.word }, 'No resolution for hover');
    return null;
  }

  const markdown = resolver.formatAsMarkdown(resolved);

  return {
    contents: {
      kind: 'markdown',
      value: markdown,
    },
    range: {
      start: { line, character: wordInfo.start },
      end: { line, character: wordInfo.end },
    },
  };
}

interface WordInfo {
  word: string;
  start: number;
  end: number;
}

function extractWordAtPosition(
  lineText: string,
  character: number,
): WordInfo | null {
  // Word boundary: alphanumeric, underscore, dollar sign, dot (for qualified names)
  const wordPattern = /[\w$]+(?:\.[\w$]+)*/g;
  let match: RegExpExecArray | null;

  while ((match = wordPattern.exec(lineText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    if (character >= start && character <= end) {
      return { word: match[0], start, end };
    }
  }

  return null;
}

function extractImportPackages(lines: string[]): string[] {
  const packages: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // ES module imports: import ... from 'package'
    const esImport = parseEsImport(trimmed);
    if (esImport) {
      packages.push(esImport);
      continue;
    }

    // CommonJS requires: const x = require('package')
    const cjsRequire = parseCjsRequire(trimmed);
    if (cjsRequire) {
      packages.push(cjsRequire);
      continue;
    }

    // Python imports: import package / from package import ...
    const pyImport = parsePythonImport(trimmed);
    if (pyImport) {
      packages.push(pyImport);
    }
  }

  return [...new Set(packages)];
}

function parseEsImport(line: string): string | null {
  // Matches: import ... from 'pkg' or import 'pkg'
  const fromMatch = /(?:^import\s.+\sfrom\s+['"])([^'"]+)['"]/.exec(line);
  if (fromMatch?.[1]) return extractPackageName(fromMatch[1]);

  const bareMatch = /^import\s+['"]([^'"]+)['"]/.exec(line);
  if (bareMatch?.[1]) return extractPackageName(bareMatch[1]);

  return null;
}

function parseCjsRequire(line: string): string | null {
  const match = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(line);
  if (match?.[1]) return extractPackageName(match[1]);
  return null;
}

function parsePythonImport(line: string): string | null {
  // from package import ... or import package
  const fromMatch = /^from\s+(\S+)\s+import/.exec(line);
  if (fromMatch?.[1]) return fromMatch[1];

  const importMatch = /^import\s+(\S+)/.exec(line);
  if (importMatch?.[1]) return importMatch[1];

  return null;
}

function extractPackageName(specifier: string): string {
  // For scoped packages like @scope/pkg/sub, return @scope/pkg
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    const scope = parts[0];
    const name = parts[1];
    if (scope && name) return `${scope}/${name}`;
    return specifier;
  }

  // For regular packages like pkg/sub, return pkg
  const slashIndex = specifier.indexOf('/');
  if (slashIndex > 0) return specifier.slice(0, slashIndex);
  return specifier;
}
