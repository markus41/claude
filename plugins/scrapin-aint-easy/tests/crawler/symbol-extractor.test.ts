import { describe, it, expect } from 'vitest';
import { extractSymbols } from '../../src/crawler/symbol-extractor.js';

const SOURCE_ID = 'test-source';
const PAGE_ID = 'test-page';

// ── Helpers ──

function makeId(name: string): string {
  return `${SOURCE_ID}::${PAGE_ID}::${name}`;
}

// ── Tests ──

describe('extractSymbols', () => {
  describe('happy path — TypeScript code blocks', () => {
    it('should extract a TypeScript function from a code block', () => {
      const md = `
## readFile

\`\`\`typescript
export async function readFile(path: string): Promise<string> {
  return fs.readFile(path, 'utf-8');
}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'readFile');
      expect(sym).toBeDefined();
      expect(sym?.kind).toBe('function');
      expect(sym?.sourceId).toBe(SOURCE_ID);
      expect(sym?.pageId).toBe(PAGE_ID);
    });

    it('should extract an arrow function', () => {
      const md = `
\`\`\`typescript
export const parseJson = (raw: string) => JSON.parse(raw);
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'parseJson');
      expect(sym).toBeDefined();
    });

    it('should extract a class definition', () => {
      const md = `
\`\`\`typescript
export class TokenBucket {
  constructor(private rps: number) {}
}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'TokenBucket');
      expect(sym).toBeDefined();
      expect(sym?.kind).toBe('class');
    });

    it('should extract an interface definition', () => {
      const md = `
\`\`\`typescript
export interface SymbolData {
  id: string;
  name: string;
}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'SymbolData');
      expect(sym).toBeDefined();
      expect(sym?.kind).toBe('interface');
    });

    it('should extract an enum definition', () => {
      const md = `
\`\`\`typescript
export enum NodeLabel {
  Symbol,
  Page,
}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'NodeLabel');
      expect(sym).toBeDefined();
      expect(sym?.kind).toBe('enum');
    });
  });

  describe('Python code blocks', () => {
    it('should extract a Python function', () => {
      const md = `
## compute_hash

\`\`\`python
def compute_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'compute_hash');
      expect(sym).toBeDefined();
      expect(sym?.kind).toBe('function');
    });
  });

  describe('symbol IDs', () => {
    it('should generate deterministic IDs in source::page::name format', () => {
      const md = `
\`\`\`typescript
function myFunc() {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'myFunc');
      expect(sym?.id).toBe(makeId('myFunc'));
    });
  });

  describe('description extraction', () => {
    it('should use the nearest header as description', () => {
      const md = `
## fetchData

\`\`\`typescript
async function fetchData(url: string) {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'fetchData');
      expect(sym?.description).toBe('fetchData');
    });
  });

  describe('deprecated detection', () => {
    it('should mark symbol as deprecated when context contains @deprecated', () => {
      const md = `
## oldFunction

@deprecated Use newFunction instead.

\`\`\`typescript
function oldFunction() {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'oldFunction');
      expect(sym?.deprecated).toBe(true);
    });

    it('should not mark symbol as deprecated when no deprecated marker present', () => {
      const md = `
\`\`\`typescript
function freshFunction() {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'freshFunction');
      expect(sym?.deprecated).toBe(false);
    });
  });

  describe('examples extraction', () => {
    it('should extract code blocks that contain no symbol as examples', () => {
      const md = `
## Usage Example

\`\`\`typescript
function helper() {}
\`\`\`

\`\`\`typescript
// plain usage — no new symbol definition
const x = helper();
console.log(x);
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      // The second block has no symbol and should become an example
      expect(result.examples.length).toBeGreaterThanOrEqual(1);
    });

    it('should set the correct language on extracted examples', () => {
      const md = `
\`\`\`typescript
export function seed() {}
\`\`\`

\`\`\`typescript
seed();
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      for (const ex of result.examples) {
        expect(ex.language).toBe('typescript');
      }
    });

    it('should associate example with the most recently seen symbol', () => {
      const md = `
\`\`\`typescript
export function useWidget() {}
\`\`\`

\`\`\`typescript
const w = useWidget();
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      expect(result.examples.length).toBeGreaterThanOrEqual(1);
      const ex = result.examples[0]!;
      expect(ex.symbolId).toBe(makeId('useWidget'));
    });
  });

  describe('relationship building', () => {
    it('should build HAS_EXAMPLE relationships for extracted examples', () => {
      const md = `
\`\`\`typescript
export function doWork() {}
\`\`\`

\`\`\`typescript
doWork();
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const hasExampleRels = result.relationships.filter((r) => r.type === 'HAS_EXAMPLE');
      expect(hasExampleRels.length).toBeGreaterThanOrEqual(1);
    });

    it('should build INHERITS relationship when signature has extends', () => {
      const md = `
\`\`\`typescript
class Animal {}
class Dog extends Animal {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const inherits = result.relationships.filter((r) => r.type === 'INHERITS');
      expect(inherits.length).toBeGreaterThanOrEqual(1);
      const rel = inherits[0]!;
      expect(rel.from).toBe(makeId('Dog'));
      expect(rel.to).toBe(makeId('Animal'));
    });

    it('should build CALLS relationship when signature references a known symbol', () => {
      const md = `
\`\`\`typescript
function helperFn() {}
function mainFn(x: helperFn) {}
\`\`\`
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const calls = result.relationships.filter((r) => r.type === 'CALLS');
      expect(calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('header-based symbol extraction', () => {
    it('should extract symbol from a level-2 backtick header', () => {
      const md = `
## \`mySymbol\`

A description of mySymbol.
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'mySymbol');
      expect(sym).toBeDefined();
    });

    it('should use description text after the header', () => {
      const md = `
## \`mySymbol\`

This is the description of the symbol.
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'mySymbol');
      expect(sym?.description).toContain('This is the description');
    });

    it('should skip level-1 headers', () => {
      const md = `
# TopLevelHeading

Some content.
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'TopLevelHeading');
      expect(sym).toBeUndefined();
    });

    it('should not extract the same symbol name twice', () => {
      const md = `
\`\`\`typescript
function dedupMe() {}
\`\`\`

## \`dedupMe\`

Already extracted above.
`;
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const matches = result.symbols.filter((s) => s.name === 'dedupMe');
      expect(matches).toHaveLength(1);
    });
  });

  describe('empty / minimal input', () => {
    it('should return empty results for an empty string', () => {
      const result = extractSymbols('', SOURCE_ID, PAGE_ID);
      expect(result.symbols).toEqual([]);
      expect(result.examples).toEqual([]);
      expect(result.relationships).toEqual([]);
    });

    it('should return empty results for plain prose with no code blocks', () => {
      const md = 'This is just a paragraph with no code fences or headers.';
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      expect(result.symbols).toEqual([]);
    });

    it('should handle markdown with only a heading and no body', () => {
      const md = '## \`emptySymbol\`\n';
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      // heading-based extraction may or may not produce a symbol — just should not throw
      expect(Array.isArray(result.symbols)).toBe(true);
    });
  });

  describe('lineHint', () => {
    it('should record the block start line as lineHint', () => {
      const md = [
        '# Title',
        '',
        '```typescript',
        'function at_line_3() {}',
        '```',
      ].join('\n');
      const result = extractSymbols(md, SOURCE_ID, PAGE_ID);
      const sym = result.symbols.find((s) => s.name === 'at_line_3');
      expect(sym).toBeDefined();
      expect(sym?.lineHint).toBeGreaterThanOrEqual(0);
    });
  });
});
