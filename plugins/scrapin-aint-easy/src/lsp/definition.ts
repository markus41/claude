import pino from 'pino';
import { type SymbolResolver } from './resolver.js';

const logger = pino({ name: 'lsp-definition' });

export interface DefinitionResult {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

interface DefinitionParams {
  textDocument: { uri: string };
  position: { line: number; character: number };
}

export async function handleDefinition(
  params: DefinitionParams,
  resolver: SymbolResolver,
  fileCache: Map<string, string>,
): Promise<DefinitionResult | null> {
  const { uri } = params.textDocument;
  const { line, character } = params.position;

  const content = fileCache.get(uri);
  if (!content) {
    logger.debug({ uri }, 'File not in cache for definition');
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

  if (!resolved) {
    logger.debug({ word: wordInfo.word }, 'No definition found');
    return null;
  }

  // Build a scrapin:// virtual URI pointing to the canonical documentation
  const virtualUri = buildScrapinUri(resolved.id, resolved.canonicalUrl);

  return {
    uri: virtualUri,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}

function buildScrapinUri(symbolId: string, canonicalUrl: string): string {
  const encoded = encodeURIComponent(symbolId);
  if (canonicalUrl) {
    const encodedUrl = encodeURIComponent(canonicalUrl);
    return `scrapin://${encoded}?url=${encodedUrl}`;
  }
  return `scrapin://${encoded}`;
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

    // ES module imports
    const fromMatch = /(?:^import\s.+\sfrom\s+['"])([^'"]+)['"]/.exec(trimmed);
    if (fromMatch?.[1]) {
      packages.push(extractPackageName(fromMatch[1]));
      continue;
    }

    const bareMatch = /^import\s+['"]([^'"]+)['"]/.exec(trimmed);
    if (bareMatch?.[1]) {
      packages.push(extractPackageName(bareMatch[1]));
      continue;
    }

    // CommonJS requires
    const cjsMatch = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(trimmed);
    if (cjsMatch?.[1]) {
      packages.push(extractPackageName(cjsMatch[1]));
      continue;
    }

    // Python imports
    const pyFrom = /^from\s+(\S+)\s+import/.exec(trimmed);
    if (pyFrom?.[1]) {
      packages.push(pyFrom[1]);
      continue;
    }
    const pyImport = /^import\s+(\S+)/.exec(trimmed);
    if (pyImport?.[1]) {
      packages.push(pyImport[1]);
    }
  }

  return [...new Set(packages)];
}

function extractPackageName(specifier: string): string {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    const scope = parts[0];
    const name = parts[1];
    if (scope && name) return `${scope}/${name}`;
    return specifier;
  }
  const slashIndex = specifier.indexOf('/');
  if (slashIndex > 0) return specifier.slice(0, slashIndex);
  return specifier;
}
