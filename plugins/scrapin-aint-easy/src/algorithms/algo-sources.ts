/**
 * Known algorithm source definitions, categories, and the canonical
 * AlgoNodeData shape stored in the knowledge graph.
 */

// ── Categories ──

export const ALGO_CATEGORIES = [
  'sorting', 'searching', 'graph', 'tree', 'dynamic-programming', 'greedy',
  'backtracking', 'divide-and-conquer', 'data-structures', 'string',
  'math', 'bit-manipulation', 'design-patterns', 'architectural-patterns',
  'concurrency', 'system-design', 'testing-patterns',
] as const;

export type AlgoCategory = typeof ALGO_CATEGORIES[number];

// ── Node data stored in graph + vector store ──

export interface AlgoNodeData {
  /** Deterministic id, e.g. `algo:<source>:<slugified-name>` */
  id: string;
  /** Human-readable algorithm / pattern name */
  name: string;
  /** Broad category bucket */
  category: AlgoCategory;
  /** Big-O time complexity, e.g. "O(n log n)" */
  complexity_time: string;
  /** Big-O space complexity, e.g. "O(n)" */
  complexity_space: string;
  /** One-paragraph description */
  description: string;
  /** Canonical URL this was extracted from */
  source_url: string;
  /** TypeScript reference implementation (may be empty) */
  code_ts: string;
  /** Python reference implementation (may be empty) */
  code_py: string;
  /** Free-form tags for similarity linking */
  tags: string[];
  /** ISO-8601 timestamp of last crawl / extraction */
  last_crawled: string;
}

// ── Source definition (static catalog of well-known repos / sites) ──

export interface AlgoSourceDef {
  /** Short unique key, e.g. "trekhleb-js-algos" */
  key: string;
  /** Display name */
  name: string;
  /** Root URL (github repo or website) */
  url: string;
  /** Type discriminator for the indexer */
  type: 'github_repo' | 'sitemap_crawl' | 'single_page';
  /** Glob patterns for files to inspect (github_repo only) */
  paths: string[];
  /** Primary language of code samples in the source */
  language: 'ts' | 'py' | 'mixed';
  /** Which categories this source is known to cover */
  categories: AlgoCategory[];
}

// ── Well-known algorithm source catalog ──

export const DEFAULT_ALGO_CATEGORIES: ReadonlyArray<AlgoSourceDef> = [
  {
    key: 'trekhleb-js-algos',
    name: 'JavaScript Algorithms and Data Structures',
    url: 'https://github.com/trekhleb/javascript-algorithms',
    type: 'github_repo',
    paths: ['src/**/*.js', 'src/**/*.md'],
    language: 'mixed',
    categories: [
      'sorting', 'searching', 'graph', 'tree', 'dynamic-programming',
      'greedy', 'backtracking', 'divide-and-conquer', 'data-structures',
      'string', 'math', 'bit-manipulation',
    ],
  },
  {
    key: 'thealgorithms-ts',
    name: 'The Algorithms - TypeScript',
    url: 'https://github.com/TheAlgorithms/TypeScript',
    type: 'github_repo',
    paths: ['**/*.ts'],
    language: 'ts',
    categories: [
      'sorting', 'searching', 'graph', 'tree', 'dynamic-programming',
      'data-structures', 'math', 'string',
    ],
  },
  {
    key: 'thealgorithms-py',
    name: 'The Algorithms - Python',
    url: 'https://github.com/TheAlgorithms/Python',
    type: 'github_repo',
    paths: ['**/*.py'],
    language: 'py',
    categories: [
      'sorting', 'searching', 'graph', 'tree', 'dynamic-programming',
      'greedy', 'backtracking', 'data-structures', 'string', 'math',
      'bit-manipulation',
    ],
  },
  {
    key: 'refactoring-guru',
    name: 'Refactoring Guru - Design Patterns',
    url: 'https://refactoring.guru/design-patterns',
    type: 'sitemap_crawl',
    paths: [],
    language: 'mixed',
    categories: ['design-patterns', 'architectural-patterns'],
  },
  {
    key: 'system-design-primer',
    name: 'System Design Primer',
    url: 'https://github.com/donnemartin/system-design-primer',
    type: 'github_repo',
    paths: ['**/*.md'],
    language: 'mixed',
    categories: ['system-design', 'concurrency', 'architectural-patterns'],
  },
] as const;
