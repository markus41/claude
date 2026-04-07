/**
 * Extract algorithm / pattern information from markdown documentation
 * and source code files. Produces AlgoNodeData entries ready for graph
 * ingestion.
 */

import { ALGO_CATEGORIES, type AlgoCategory, type AlgoNodeData } from './algo-sources.js';

// ── Complexity parsing ──

const BIG_O_RE = /O\s*\(\s*[^)]+\s*\)/g;
const TIME_HINT_RE = /(?:time|runtime|best|worst|average)\s*(?:complexity)?\s*[:=]?\s*(O\s*\([^)]+\))/gi;
const SPACE_HINT_RE = /(?:space|memory|auxiliary)\s*(?:complexity)?\s*[:=]?\s*(O\s*\([^)]+\))/gi;

/**
 * Extract O() notation from free text. Attempts to differentiate time
 * vs space via surrounding keywords; falls back to positional heuristic
 * (first = time, second = space).
 */
export function parseComplexity(text: string): { time: string; space: string } {
  let time = '';
  let space = '';

  const timeMatch = TIME_HINT_RE.exec(text);
  TIME_HINT_RE.lastIndex = 0;
  if (timeMatch) {
    time = normalizeComplexity(timeMatch[1] ?? '');
  }

  const spaceMatch = SPACE_HINT_RE.exec(text);
  SPACE_HINT_RE.lastIndex = 0;
  if (spaceMatch) {
    space = normalizeComplexity(spaceMatch[1] ?? '');
  }

  // Fallback: grab all O(...) tokens positionally
  if (!time || !space) {
    const allMatches = text.match(BIG_O_RE);
    if (allMatches) {
      if (!time && allMatches.length >= 1) {
        time = normalizeComplexity(allMatches[0] ?? '');
      }
      if (!space && allMatches.length >= 2) {
        space = normalizeComplexity(allMatches[1] ?? '');
      }
    }
  }

  return { time: time || 'unknown', space: space || 'unknown' };
}

function normalizeComplexity(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

// ── Category inference ──

const CATEGORY_KEYWORDS: ReadonlyArray<{ category: AlgoCategory; keywords: string[] }> = [
  { category: 'sorting', keywords: ['sort', 'merge sort', 'quick sort', 'heap sort', 'bubble sort', 'insertion sort', 'radix sort', 'counting sort', 'bucket sort', 'tim sort'] },
  { category: 'searching', keywords: ['search', 'binary search', 'linear search', 'bfs', 'dfs', 'breadth-first', 'depth-first', 'a-star', 'a*'] },
  { category: 'graph', keywords: ['graph', 'dijkstra', 'bellman-ford', 'kruskal', 'prim', 'topological', 'shortest path', 'spanning tree', 'adjacency', 'floyd-warshall'] },
  { category: 'tree', keywords: ['tree', 'binary tree', 'bst', 'avl', 'red-black', 'trie', 'b-tree', 'segment tree', 'fenwick', 'heap'] },
  { category: 'dynamic-programming', keywords: ['dynamic programming', 'dp', 'memoization', 'tabulation', 'knapsack', 'longest common', 'fibonacci', 'coin change', 'edit distance'] },
  { category: 'greedy', keywords: ['greedy', 'activity selection', 'huffman', 'fractional knapsack', 'job scheduling'] },
  { category: 'backtracking', keywords: ['backtracking', 'n-queens', 'sudoku', 'permutation', 'combination', 'subset', 'constraint satisfaction'] },
  { category: 'divide-and-conquer', keywords: ['divide and conquer', 'divide-and-conquer', 'merge', 'karatsuba', 'strassen', 'closest pair'] },
  { category: 'data-structures', keywords: ['linked list', 'stack', 'queue', 'hash table', 'hash map', 'set', 'priority queue', 'deque', 'union find', 'disjoint set', 'bloom filter', 'lru cache'] },
  { category: 'string', keywords: ['string', 'kmp', 'rabin-karp', 'boyer-moore', 'regex', 'palindrome', 'anagram', 'suffix', 'levenshtein'] },
  { category: 'math', keywords: ['math', 'gcd', 'lcm', 'prime', 'sieve', 'fibonacci', 'factorial', 'modular arithmetic', 'euclidean', 'matrix'] },
  { category: 'bit-manipulation', keywords: ['bit manipulation', 'bitwise', 'bit mask', 'xor', 'popcount', 'hamming'] },
  { category: 'design-patterns', keywords: ['design pattern', 'singleton', 'factory', 'observer', 'strategy', 'decorator', 'adapter', 'facade', 'proxy', 'builder', 'prototype', 'mediator', 'visitor', 'command pattern', 'iterator pattern', 'template method', 'state pattern', 'chain of responsibility'] },
  { category: 'architectural-patterns', keywords: ['architectural', 'microservice', 'event-driven', 'cqrs', 'saga', 'hexagonal', 'clean architecture', 'layered architecture', 'monolith', 'domain-driven'] },
  { category: 'concurrency', keywords: ['concurrency', 'mutex', 'semaphore', 'deadlock', 'race condition', 'thread', 'lock-free', 'async', 'actor model', 'producer-consumer'] },
  { category: 'system-design', keywords: ['system design', 'load balancer', 'cache', 'cdn', 'database sharding', 'replication', 'rate limiting', 'message queue', 'distributed', 'scalability', 'availability'] },
  { category: 'testing-patterns', keywords: ['testing pattern', 'test double', 'mock', 'stub', 'fixture', 'property-based', 'snapshot test', 'integration test', 'contract test', 'test pyramid'] },
];

/**
 * Heuristic category inference from name, description, and tags.
 * Returns the category with the highest keyword-hit score.
 */
export function inferCategory(name: string, description: string, tags: string[]): AlgoCategory {
  const corpus = [name, description, ...tags].join(' ').toLowerCase();
  let bestCategory: AlgoCategory = 'data-structures';
  let bestScore = 0;

  for (const entry of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (corpus.includes(kw)) {
        // Longer keyword matches are weighted higher
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = entry.category;
    }
  }

  return bestCategory;
}

// ── Markdown extraction ──

const HEADING_RE = /^(#{1,4})\s+(.+)$/gm;
const CODE_BLOCK_RE = /```(\w+)?\n([\s\S]*?)```/g;
const TAG_RE = /(?:tags?|keywords?|topics?)\s*[:=]\s*\[?([^\]\n]+)/gi;

interface MdSection {
  level: number;
  title: string;
  body: string;
  startIndex: number;
}

function splitMarkdownSections(markdown: string): MdSection[] {
  const sections: MdSection[] = [];
  const headings: Array<{ level: number; title: string; index: number }> = [];

  let match: RegExpExecArray | null = null;
  while ((match = HEADING_RE.exec(markdown)) !== null) {
    headings.push({
      level: (match[1] ?? '').length,
      title: (match[2] ?? '').trim(),
      index: match.index,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (!heading) continue;
    const nextIndex = headings[i + 1]?.index ?? markdown.length;
    const body = markdown.slice(heading.index + (heading.title.length + heading.level + 2), nextIndex).trim();
    sections.push({
      level: heading.level,
      title: heading.title,
      body,
      startIndex: heading.index,
    });
  }

  return sections;
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  let match: RegExpExecArray | null = null;
  while ((match = TAG_RE.exec(text)) !== null) {
    const raw = match[1] ?? '';
    const items = raw.split(/[,;|]/).map((t) => t.replace(/["`']/g, '').trim()).filter(Boolean);
    tags.push(...items);
  }
  TAG_RE.lastIndex = 0;
  return [...new Set(tags)];
}

function slugify(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractCodeBlocks(text: string): { ts: string; py: string } {
  let ts = '';
  let py = '';
  let match: RegExpExecArray | null = null;
  while ((match = CODE_BLOCK_RE.exec(text)) !== null) {
    const lang = (match[1] ?? '').toLowerCase();
    const code = match[2] ?? '';
    if (['typescript', 'ts', 'javascript', 'js'].includes(lang) && !ts) {
      ts = code.trim();
    } else if (['python', 'py'].includes(lang) && !py) {
      py = code.trim();
    }
  }
  CODE_BLOCK_RE.lastIndex = 0;
  return { ts, py };
}

/**
 * Parse a markdown document and extract algorithm entries from its sections.
 * Each top-level section that looks like an algorithm description becomes
 * an AlgoNodeData record.
 */
export function extractAlgoFromMarkdown(markdown: string, sourceUrl: string): AlgoNodeData[] {
  const results: AlgoNodeData[] = [];
  const sections = splitMarkdownSections(markdown);
  const globalTags = extractTags(markdown);
  const now = new Date().toISOString();

  for (const section of sections) {
    // Only treat level-1 and level-2 headings as algo boundaries
    if (section.level > 2) continue;
    // Skip generic headings
    if (isGenericHeading(section.title)) continue;

    const name = section.title;
    const fullText = section.body;
    const sectionTags = [...globalTags, ...extractTags(fullText)];
    const complexity = parseComplexity(fullText);
    const { ts, py } = extractCodeBlocks(fullText);
    const description = extractDescription(fullText);
    const category = inferCategory(name, description, sectionTags);

    results.push({
      id: `algo:md:${slugify(name)}`,
      name,
      category,
      complexity_time: complexity.time,
      complexity_space: complexity.space,
      description,
      source_url: sourceUrl,
      code_ts: ts,
      code_py: py,
      tags: sectionTags,
      last_crawled: now,
    });
  }

  return results;
}

function isGenericHeading(title: string): boolean {
  const lower = title.toLowerCase();
  const generic = [
    'table of contents', 'toc', 'introduction', 'overview', 'getting started',
    'installation', 'usage', 'contributing', 'license', 'references', 'resources',
    'acknowledgments', 'changelog', 'readme',
  ];
  return generic.some((g) => lower === g || lower.startsWith(g));
}

function extractDescription(body: string): string {
  // Take first paragraph (non-code, non-heading text)
  const lines = body.split('\n');
  const descLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (line.startsWith('#')) break;
    if (line.startsWith('|')) continue; // table row
    const trimmed = line.trim();
    if (trimmed) {
      descLines.push(trimmed);
    } else if (descLines.length > 0) {
      break; // end of first paragraph
    }
  }

  return descLines.join(' ').slice(0, 500);
}

// ── Source file extraction ──

const TS_FUNCTION_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^\n{]+))?\s*\{/g;
const TS_CLASS_RE = /(?:export\s+)?class\s+(\w+)(?:\s+(?:extends|implements)\s+[^{]+)?\s*\{/g;
const TS_DOCBLOCK_RE = /\/\*\*\s*([\s\S]*?)\s*\*\//g;

const PY_FUNCTION_RE = /def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^\n:]+))?\s*:/g;
const PY_CLASS_RE = /class\s+(\w+)(?:\(([^)]*)\))?\s*:/g;
const PY_DOCSTRING_RE = /"""([\s\S]*?)"""|'''([\s\S]*?)'''/g;

interface ExtractedSymbol {
  name: string;
  docblock: string;
  body: string;
  startLine: number;
}

function extractTsSymbols(code: string): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const lines = code.split('\n');

  // Collect docblocks indexed by end-line
  const docblocks = new Map<number, string>();
  let match: RegExpExecArray | null = null;
  while ((match = TS_DOCBLOCK_RE.exec(code)) !== null) {
    const endOffset = match.index + match[0].length;
    const endLine = code.slice(0, endOffset).split('\n').length;
    docblocks.set(endLine, cleanDocblock(match[1] ?? ''));
  }
  TS_DOCBLOCK_RE.lastIndex = 0;

  // Extract functions
  while ((match = TS_FUNCTION_RE.exec(code)) !== null) {
    const name = match[1] ?? 'anonymous';
    const startLine = code.slice(0, match.index).split('\n').length;
    const docblock = docblocks.get(startLine - 1) ?? docblocks.get(startLine) ?? '';
    const body = extractBracedBody(code, match.index + match[0].length - 1);
    symbols.push({ name, docblock, body, startLine });
  }
  TS_FUNCTION_RE.lastIndex = 0;

  // Extract classes
  while ((match = TS_CLASS_RE.exec(code)) !== null) {
    const name = match[1] ?? 'UnknownClass';
    const startLine = code.slice(0, match.index).split('\n').length;
    const docblock = docblocks.get(startLine - 1) ?? docblocks.get(startLine) ?? '';
    const body = extractBracedBody(code, match.index + match[0].length - 1);
    symbols.push({ name, docblock, body: body.slice(0, 2000), startLine });
  }
  TS_CLASS_RE.lastIndex = 0;

  return symbols;
}

function extractPySymbols(code: string): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];

  let match: RegExpExecArray | null = null;
  while ((match = PY_FUNCTION_RE.exec(code)) !== null) {
    const name = match[1] ?? 'anonymous';
    const startLine = code.slice(0, match.index).split('\n').length;
    const body = extractIndentedBody(code, match.index + match[0].length);
    const docstring = extractLeadingDocstring(body);
    symbols.push({ name, docblock: docstring, body, startLine });
  }
  PY_FUNCTION_RE.lastIndex = 0;

  while ((match = PY_CLASS_RE.exec(code)) !== null) {
    const name = match[1] ?? 'UnknownClass';
    const startLine = code.slice(0, match.index).split('\n').length;
    const body = extractIndentedBody(code, match.index + match[0].length);
    const docstring = extractLeadingDocstring(body);
    symbols.push({ name, docblock: docstring, body: body.slice(0, 2000), startLine });
  }
  PY_CLASS_RE.lastIndex = 0;

  return symbols;
}

function cleanDocblock(raw: string): string {
  return raw
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
}

function extractBracedBody(code: string, openBraceIdx: number): string {
  let depth = 0;
  let i = openBraceIdx;
  const start = i;
  while (i < code.length) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
    i++;
  }
  return code.slice(start, Math.min(start + 2000, code.length));
}

function extractIndentedBody(code: string, colonIdx: number): string {
  const rest = code.slice(colonIdx);
  const lines = rest.split('\n');
  const bodyLines: string[] = [];
  let baseIndent = -1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() === '') {
      bodyLines.push('');
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (baseIndent < 0) {
      baseIndent = indent;
    }
    if (indent < baseIndent && bodyLines.length > 0) break;
    bodyLines.push(line);
  }

  return bodyLines.join('\n').trim();
}

function extractLeadingDocstring(body: string): string {
  const trimmed = body.trimStart();
  let match: RegExpExecArray | null = null;
  PY_DOCSTRING_RE.lastIndex = 0;
  match = PY_DOCSTRING_RE.exec(trimmed);
  PY_DOCSTRING_RE.lastIndex = 0;
  if (match && (match.index ?? 0) < 5) {
    return (match[1] ?? match[2] ?? '').trim();
  }
  return '';
}

/**
 * Parse a source code file and extract algorithm/function entries.
 * Each exported function or class becomes an AlgoNodeData record.
 */
export function extractAlgoFromSourceFile(
  code: string,
  language: 'ts' | 'py',
  sourceUrl: string,
): AlgoNodeData[] {
  const symbols = language === 'ts' ? extractTsSymbols(code) : extractPySymbols(code);
  const now = new Date().toISOString();
  const results: AlgoNodeData[] = [];

  for (const sym of symbols) {
    // Skip private/internal helpers (underscore prefix in Python, very short names)
    if (language === 'py' && sym.name.startsWith('_') && !sym.name.startsWith('__')) continue;
    if (sym.name.length < 2) continue;

    const description = sym.docblock || `${language === 'ts' ? 'TypeScript' : 'Python'} implementation of ${sym.name}`;
    const tags = extractTagsFromSymbol(sym.name, sym.docblock);
    const complexity = parseComplexity(sym.docblock + ' ' + sym.body);
    const category = inferCategory(sym.name, description, tags);

    const entry: AlgoNodeData = {
      id: `algo:src:${slugify(sym.name)}`,
      name: sym.name,
      category,
      complexity_time: complexity.time,
      complexity_space: complexity.space,
      description,
      source_url: sourceUrl,
      code_ts: language === 'ts' ? sym.body : '',
      code_py: language === 'py' ? sym.body : '',
      tags,
      last_crawled: now,
    };

    results.push(entry);
  }

  return results;
}

function extractTagsFromSymbol(name: string, docblock: string): string[] {
  const tags: string[] = [];

  // Split camelCase / PascalCase / snake_case into words
  const words = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  tags.push(...words);

  // Extract tags from docblock keywords
  const docTags = extractTags(docblock);
  tags.push(...docTags);

  return [...new Set(tags)];
}
