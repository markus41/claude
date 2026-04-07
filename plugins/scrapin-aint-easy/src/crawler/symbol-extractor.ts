import pino from 'pino';

const logger = pino({ name: 'symbol-extractor' });

// ── Public types ──

export interface SymbolData {
  id: string;
  name: string;
  kind: SymbolKind;
  signature: string;
  description: string;
  deprecated: boolean;
  sourceId: string;
  pageId: string;
  lineHint: number;
}

export type SymbolKind =
  | 'function'
  | 'method'
  | 'class'
  | 'interface'
  | 'type'
  | 'constant'
  | 'enum'
  | 'property'
  | 'module'
  | 'unknown';

export interface ExampleData {
  id: string;
  symbolId: string;
  language: string;
  code: string;
  description: string;
}

export interface RelationshipData {
  from: string;
  to: string;
  type: 'CALLS' | 'INHERITS' | 'IMPLEMENTS' | 'SEE_ALSO' | 'HAS_EXAMPLE';
}

export interface SymbolExtractionResult {
  symbols: SymbolData[];
  examples: ExampleData[];
  relationships: RelationshipData[];
}

// ── Regex patterns ──

const FUNCTION_PATTERNS = [
  // TypeScript / JavaScript: function name(
  /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[(<]/,
  // Arrow: const name = (
  /(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/,
  // Method: name(params): returnType
  /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*\S+)?/,
  // Python: def name(
  /def\s+(\w+)\s*\(/,
  // Rust: fn name(
  /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*[(<]/,
  // Go: func name(  or func (receiver) name(
  /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/,
];

const CLASS_PATTERNS = [
  /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
  /(?:export\s+)?interface\s+(\w+)/,
  /(?:export\s+)?type\s+(\w+)\s*=/,
  /(?:export\s+)?enum\s+(\w+)/,
  /struct\s+(\w+)/,
  /trait\s+(\w+)/,
];

const HEADER_SYMBOL_PATTERN = /^#{2,4}\s+(?:`([^`]+)`|(\w[\w.#]*\w)(?:\s*\(.*\))?)\s*$/;

const DEPRECATED_MARKERS = [
  /deprecated/i,
  /@deprecated/i,
  /\[deprecated\]/i,
  /⚠️\s*deprecated/i,
];

// ── Helpers ──

function makeId(sourceId: string, pageId: string, name: string): string {
  return `${sourceId}::${pageId}::${name}`;
}

function classifyCodeSymbol(line: string): { name: string; kind: SymbolKind } | null {
  for (const pattern of FUNCTION_PATTERNS) {
    const match = pattern.exec(line);
    if (match?.[1]) {
      return { name: match[1], kind: 'function' };
    }
  }

  for (const pattern of CLASS_PATTERNS) {
    const match = pattern.exec(line);
    if (match?.[1]) {
      const kind = classifyClassKind(line);
      return { name: match[1], kind };
    }
  }

  return null;
}

function classifyClassKind(line: string): SymbolKind {
  if (/\binterface\b/.test(line)) return 'interface';
  if (/\btype\b/.test(line)) return 'type';
  if (/\benum\b/.test(line)) return 'enum';
  if (/\bstruct\b/.test(line)) return 'class';
  if (/\btrait\b/.test(line)) return 'interface';
  return 'class';
}

function isDeprecated(context: string): boolean {
  return DEPRECATED_MARKERS.some((re) => re.test(context));
}

function extractSignature(codeBlock: string, symbolName: string): string {
  const lines = codeBlock.split('\n');
  for (const line of lines) {
    if (line.includes(symbolName)) {
      return line.trim();
    }
  }
  return lines[0]?.trim() ?? '';
}

interface CodeBlock {
  language: string;
  code: string;
  lineIndex: number;
}

function parseCodeBlocks(lines: string[]): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let inBlock = false;
  let language = '';
  let blockLines: string[] = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (!inBlock && line.trimStart().startsWith('```')) {
      inBlock = true;
      language = line.trimStart().slice(3).trim();
      blockLines = [];
      startLine = i;
      continue;
    }

    if (inBlock && line.trimStart().startsWith('```')) {
      blocks.push({
        language,
        code: blockLines.join('\n'),
        lineIndex: startLine,
      });
      inBlock = false;
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
    }
  }

  return blocks;
}

interface HeaderInfo {
  level: number;
  text: string;
  lineIndex: number;
}

function parseHeaders(lines: string[]): HeaderInfo[] {
  const headers: HeaderInfo[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const match = /^(#{1,6})\s+(.+)$/.exec(line);
    if (match?.[1] && match[2]) {
      headers.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex: i,
      });
    }
  }
  return headers;
}

function getContextAround(lines: string[], lineIndex: number, radius: number): string {
  const start = Math.max(0, lineIndex - radius);
  const end = Math.min(lines.length, lineIndex + radius + 1);
  return lines.slice(start, end).join('\n');
}

function findNearestHeader(headers: HeaderInfo[], lineIndex: number): HeaderInfo | undefined {
  let nearest: HeaderInfo | undefined;
  for (const h of headers) {
    if (h.lineIndex <= lineIndex) {
      nearest = h;
    } else {
      break;
    }
  }
  return nearest;
}

// ── Main extraction ──

/**
 * Extract symbols, examples, and relationships from markdown documentation.
 */
export function extractSymbols(
  markdown: string,
  sourceId: string,
  pageId: string,
): SymbolExtractionResult {
  const lines = markdown.split('\n');
  const codeBlocks = parseCodeBlocks(lines);
  const headers = parseHeaders(lines);

  const symbols: SymbolData[] = [];
  const examples: ExampleData[] = [];
  const relationships: RelationshipData[] = [];
  const seenNames = new Set<string>();

  // Extract symbols from code blocks
  extractFromCodeBlocks(
    codeBlocks, lines, headers, sourceId, pageId, seenNames, symbols, examples,
  );

  // Extract symbols from headers
  extractFromHeaders(
    headers, lines, sourceId, pageId, seenNames, symbols,
  );

  // Build relationships
  buildRelationships(symbols, examples, relationships);

  logger.debug({
    pageId,
    symbolCount: symbols.length,
    exampleCount: examples.length,
    relationshipCount: relationships.length,
  }, 'Symbol extraction complete');

  return { symbols, examples, relationships };
}

function extractFromCodeBlocks(
  codeBlocks: CodeBlock[],
  lines: string[],
  headers: HeaderInfo[],
  sourceId: string,
  pageId: string,
  seenNames: Set<string>,
  symbols: SymbolData[],
  examples: ExampleData[],
): void {
  for (const block of codeBlocks) {
    const blockLines = block.code.split('\n');
    let foundSymbolInBlock = false;

    for (const codeLine of blockLines) {
      const classified = classifyCodeSymbol(codeLine);
      if (!classified || seenNames.has(classified.name)) continue;

      seenNames.add(classified.name);
      foundSymbolInBlock = true;
      const context = getContextAround(lines, block.lineIndex, 5);
      const nearestHeader = findNearestHeader(headers, block.lineIndex);
      const description = nearestHeader?.text ?? '';
      const id = makeId(sourceId, pageId, classified.name);

      symbols.push({
        id,
        name: classified.name,
        kind: classified.kind,
        signature: extractSignature(block.code, classified.name),
        description,
        deprecated: isDeprecated(context),
        sourceId,
        pageId,
        lineHint: block.lineIndex,
      });
    }

    // If no symbol was found, treat the block as a standalone example
    if (!foundSymbolInBlock && block.code.trim().length > 0) {
      registerExample(block, headers, sourceId, pageId, symbols, examples);
    }
  }
}

function registerExample(
  block: CodeBlock,
  headers: HeaderInfo[],
  sourceId: string,
  pageId: string,
  symbols: SymbolData[],
  examples: ExampleData[],
): void {
  const nearestHeader = findNearestHeader(headers, block.lineIndex);
  const description = nearestHeader?.text ?? 'Example';

  // Try to associate with the most recent symbol
  const parentSymbol = symbols.length > 0 ? symbols[symbols.length - 1] : undefined;
  const symbolId = parentSymbol?.id ?? makeId(sourceId, pageId, '_page');

  examples.push({
    id: `${symbolId}::example-${examples.length}`,
    symbolId,
    language: block.language || 'text',
    code: block.code,
    description,
  });
}

function extractFromHeaders(
  headers: HeaderInfo[],
  lines: string[],
  sourceId: string,
  pageId: string,
  seenNames: Set<string>,
  symbols: SymbolData[],
): void {
  for (const header of headers) {
    if (header.level < 2 || header.level > 4) continue;

    const headerMatch = HEADER_SYMBOL_PATTERN.exec(`${'#'.repeat(header.level)} ${header.text}`);
    if (!headerMatch) continue;

    const name = headerMatch[1] ?? headerMatch[2];
    if (!name || seenNames.has(name)) continue;

    seenNames.add(name);
    const context = getContextAround(lines, header.lineIndex, 3);

    // Determine kind from name patterns
    const kind = inferKindFromName(name);

    symbols.push({
      id: makeId(sourceId, pageId, name),
      name,
      kind,
      signature: name,
      description: extractDescriptionAfterHeader(lines, header.lineIndex),
      deprecated: isDeprecated(context),
      sourceId,
      pageId,
      lineHint: header.lineIndex,
    });
  }
}

function inferKindFromName(name: string): SymbolKind {
  if (name.includes('(') || name.includes('.prototype.')) return 'method';
  if (/^[A-Z][a-z]/.test(name) && !name.includes('.')) return 'class';
  if (name.startsWith('I') && /^I[A-Z]/.test(name)) return 'interface';
  if (name.includes('.')) return 'property';
  return 'unknown';
}

function extractDescriptionAfterHeader(lines: string[], headerLine: number): string {
  const descLines: string[] = [];
  for (let i = headerLine + 1; i < lines.length && i <= headerLine + 5; i++) {
    const line = lines[i] ?? '';
    if (line.startsWith('#') || line.startsWith('```')) break;
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      descLines.push(trimmed);
    } else if (descLines.length > 0) {
      break;
    }
  }
  return descLines.join(' ');
}

function buildRelationships(
  symbols: SymbolData[],
  examples: ExampleData[],
  relationships: RelationshipData[],
): void {
  // Link examples to their parent symbols
  for (const example of examples) {
    if (example.symbolId) {
      relationships.push({
        from: example.symbolId,
        to: example.id,
        type: 'HAS_EXAMPLE',
      });
    }
  }

  // Detect cross-references between symbols
  const symbolNames = new Map(symbols.map((s) => [s.name, s.id]));

  for (const symbol of symbols) {
    // Check if the signature references other known symbols
    for (const [otherName, otherId] of symbolNames) {
      if (otherName === symbol.name) continue;
      if (symbol.signature.includes(otherName)) {
        relationships.push({
          from: symbol.id,
          to: otherId,
          type: 'CALLS',
        });
      }
    }

    // Check for inheritance patterns
    const extendsMatch = /extends\s+(\w+)/.exec(symbol.signature);
    if (extendsMatch?.[1]) {
      const parentId = symbolNames.get(extendsMatch[1]);
      if (parentId) {
        relationships.push({
          from: symbol.id,
          to: parentId,
          type: 'INHERITS',
        });
      }
    }

    const implementsMatch = /implements\s+([\w,\s]+)/.exec(symbol.signature);
    if (implementsMatch?.[1]) {
      const ifaces = implementsMatch[1].split(',').map((s) => s.trim());
      for (const iface of ifaces) {
        const ifaceId = symbolNames.get(iface);
        if (ifaceId) {
          relationships.push({
            from: symbol.id,
            to: ifaceId,
            type: 'IMPLEMENTS',
          });
        }
      }
    }
  }
}
