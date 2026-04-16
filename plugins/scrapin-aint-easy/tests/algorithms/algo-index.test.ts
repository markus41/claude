import { describe, it, expect, vi } from 'vitest';
import {
  extractAlgoFromMarkdown,
  extractAlgoFromSourceFile,
  parseComplexity,
  inferCategory,
} from '../../src/algorithms/pattern-extractor.js';
import type { AlgoNodeData } from '../../src/algorithms/algo-sources.js';

// ── parseComplexity ──

describe('parseComplexity', () => {
  it('should extract time and space complexity from labelled hints', () => {
    const text = 'Time complexity: O(n log n). Space complexity: O(n).';
    const { time, space } = parseComplexity(text);
    expect(time).toContain('O(n log n)');
    expect(space).toContain('O(n)');
  });

  it('should fall back to positional O() tokens when no labels present', () => {
    const text = 'Runs in O(n²) with O(1) extra space.';
    const { time, space } = parseComplexity(text);
    expect(time).toContain('O(n²)');
    expect(space).toContain('O(1)');
  });

  it('should return "unknown" when no O() notation present', () => {
    const { time, space } = parseComplexity('No complexity info here.');
    expect(time).toBe('unknown');
    expect(space).toBe('unknown');
  });

  it('should handle O(1) constant time correctly', () => {
    const { time } = parseComplexity('O(1) lookup in a hash map.');
    expect(time).toContain('O(1)');
  });

  it('should extract worst-case hint for time', () => {
    const text = 'Worst case: O(n²). Best case: O(n log n).';
    const { time } = parseComplexity(text);
    expect(time).toBeDefined();
    expect(time).not.toBe('unknown');
  });
});

// ── inferCategory ──

describe('inferCategory', () => {
  it('should infer "sorting" for names/descriptions containing sort keywords', () => {
    expect(inferCategory('QuickSort', 'Fast sorting algorithm', [])).toBe('sorting');
    expect(inferCategory('merge sort', 'Divide and merge', [])).toBe('sorting');
  });

  it('should infer "graph" for graph-related names', () => {
    expect(inferCategory('Dijkstra', 'Shortest path algorithm', [])).toBe('graph');
  });

  it('should infer "dynamic-programming" for DP keywords', () => {
    expect(inferCategory('Knapsack', 'DP solution for 0/1 knapsack problem', [])).toBe('dynamic-programming');
  });

  it('should infer "data-structures" as default when no keywords match', () => {
    expect(inferCategory('completelyUnknown', 'something obscure', [])).toBe('data-structures');
  });

  it('should use tags in category inference when name/description are weak', () => {
    expect(inferCategory('algo', 'generic', ['bfs', 'breadth-first'])).toBe('searching');
  });

  it('should infer "concurrency" for semaphore-related text', () => {
    const cat = inferCategory('semaphore', 'concurrency primitive', ['mutex', 'lock-free']);
    expect(cat).toBe('concurrency');
  });

  it('should infer "design-patterns" for singleton', () => {
    const cat = inferCategory('Singleton', 'Ensure only one instance exists', ['design pattern']);
    expect(cat).toBe('design-patterns');
  });
});

// ── extractAlgoFromMarkdown ──

describe('extractAlgoFromMarkdown', () => {
  const SOURCE_URL = 'https://example.com/algos';

  it('should return an empty array for empty markdown', () => {
    const results = extractAlgoFromMarkdown('', SOURCE_URL);
    expect(results).toEqual([]);
  });

  it('should skip generic headings like "Introduction" and "Usage"', () => {
    const md = `# Introduction\n\nWelcome.\n\n# Usage\n\nHow to use.\n`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    expect(results).toHaveLength(0);
  });

  it('should extract an algorithm entry from a level-1 heading', () => {
    const md = `
# Binary Search

Efficient search in a sorted array. Time complexity: O(log n). Space: O(1).

\`\`\`typescript
function binarySearch(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid]! < target) lo = mid + 1; else hi = mid - 1;
  }
  return -1;
}
\`\`\`
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const bsEntry = results.find((r) => r.name === 'Binary Search');
    expect(bsEntry).toBeDefined();
  });

  it('should extract complexity from section body', () => {
    const md = `
# Quick Sort

A fast comparison-based sort. Time complexity: O(n log n). Space complexity: O(log n).
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results.find((r) => r.name === 'Quick Sort');
    expect(entry?.complexity_time).toContain('O(n log n)');
    expect(entry?.complexity_space).toContain('O(log n)');
  });

  it('should populate the source_url field', () => {
    const md = `# Merge Sort\n\nA classic divide-and-conquer sort.\n`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results[0];
    expect(entry?.source_url).toBe(SOURCE_URL);
  });

  it('should generate a deterministic slug-based id', () => {
    const md = `# Bubble Sort\n\nSimple sort.\n`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results.find((r) => r.name === 'Bubble Sort');
    expect(entry?.id).toBe('algo:md:bubble-sort');
  });

  it('should extract TypeScript code blocks', () => {
    const md = `
# Insertion Sort

Sort by inserting each element.

\`\`\`typescript
function insertionSort(arr: number[]): number[] { return arr; }
\`\`\`
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results.find((r) => r.name === 'Insertion Sort');
    expect(entry?.code_ts.length).toBeGreaterThan(0);
  });

  it('should extract Python code blocks', () => {
    const md = `
# Selection Sort

Select minimum each pass.

\`\`\`python
def selection_sort(arr):
    for i in range(len(arr)):
        min_idx = i
        for j in range(i + 1, len(arr)):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
\`\`\`
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results.find((r) => r.name === 'Selection Sort');
    expect(entry?.code_py.length).toBeGreaterThan(0);
  });

  it('should infer correct category for sorting algorithms', () => {
    const md = `# Tim Sort\n\nHybrid stable sort.\n`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results[0];
    expect(entry?.category).toBe('sorting');
  });

  it('should set last_crawled to a valid ISO timestamp', () => {
    const md = `# Heap Sort\n\nUsing a max-heap.\n`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results[0];
    expect(() => new Date(entry!.last_crawled)).not.toThrow();
    expect(new Date(entry!.last_crawled).toISOString()).toBe(entry!.last_crawled);
  });

  it('should extract multiple algorithms from a single markdown document', () => {
    const md = `
# BFS

Breadth-first search uses a queue.

# DFS

Depth-first search uses a stack or recursion.
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    expect(results.length).toBeGreaterThanOrEqual(2);
    const names = results.map((r) => r.name);
    expect(names).toContain('BFS');
    expect(names).toContain('DFS');
  });

  it('should extract tags from tags: annotation', () => {
    const md = `
# Floyd-Warshall

All-pairs shortest path. tags: graph, dynamic-programming, shortest-path
`;
    const results = extractAlgoFromMarkdown(md, SOURCE_URL);
    const entry = results.find((r) => r.name === 'Floyd-Warshall');
    expect(entry?.tags.some((t) => t.toLowerCase().includes('graph'))).toBe(true);
  });
});

// ── extractAlgoFromSourceFile — TypeScript ──

describe('extractAlgoFromSourceFile — TypeScript', () => {
  const SOURCE_URL = 'https://github.com/example/algos/blob/main/src/search.ts';

  it('should extract exported functions', () => {
    const code = `
/**
 * Binary search in a sorted array.
 * Time complexity: O(log n). Space complexity: O(1).
 */
export function binarySearch(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    arr[mid]! < target ? lo = mid + 1 : hi = mid - 1;
  }
  return -1;
}
`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'binarySearch');
    expect(entry).toBeDefined();
  });

  it('should use JSDoc comment as description', () => {
    const code = `
/**
 * Computes Fibonacci numbers via memoization.
 */
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'fibonacci');
    expect(entry?.description).toContain('Fibonacci');
  });

  it('should extract classes', () => {
    const code = `
/**
 * Min-heap priority queue.
 */
export class MinHeap {
  private data: number[] = [];
  push(v: number) { this.data.push(v); }
}
`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'MinHeap');
    expect(entry).toBeDefined();
  });

  it('should infer category from the function name', () => {
    const code = `export function quickSort(arr: number[]): number[] { return arr; }\n`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'quickSort');
    expect(entry?.category).toBe('sorting');
  });

  it('should set code_ts to the function body', () => {
    const code = `export function add(a: number, b: number): number { return a + b; }\n`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'add');
    expect(entry?.code_ts.length).toBeGreaterThan(0);
    expect(entry?.code_py).toBe('');
  });

  it('should generate an id in algo:src:<slug> format', () => {
    // slugify() splits camelCase into kebab-case — insertionSort -> insertion-sort
    const code = `export function insertionSort(arr: number[]): number[] { return arr; }\n`;
    const results = extractAlgoFromSourceFile(code, 'ts', SOURCE_URL);
    const entry = results.find((r) => r.name === 'insertionSort');
    expect(entry?.id).toBe('algo:src:insertion-sort');
  });

  it('should return empty array for empty source file', () => {
    const results = extractAlgoFromSourceFile('', 'ts', SOURCE_URL);
    expect(results).toEqual([]);
  });
});

// ── extractAlgoFromSourceFile — Python ──

describe('extractAlgoFromSourceFile — Python', () => {
  const SOURCE_URL = 'https://github.com/example/algos/blob/main/sort.py';

  it('should extract Python functions with docstrings', () => {
    const code = `
def merge_sort(arr):
    """
    Merge sort — divide and conquer.
    Time complexity: O(n log n). Space: O(n).
    """
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)
`;
    const results = extractAlgoFromSourceFile(code, 'py', SOURCE_URL);
    const entry = results.find((r) => r.name === 'merge_sort');
    expect(entry).toBeDefined();
    expect(entry?.description).toContain('Merge sort');
  });

  it('should skip private helper functions (underscore prefix)', () => {
    const code = `
def _helper(x):
    return x * 2

def main_algo(arr):
    """Public algorithm."""
    return [_helper(x) for x in arr]
`;
    const results = extractAlgoFromSourceFile(code, 'py', SOURCE_URL);
    expect(results.find((r) => r.name === '_helper')).toBeUndefined();
    expect(results.find((r) => r.name === 'main_algo')).toBeDefined();
  });

  it('should set code_py to the function body and leave code_ts empty', () => {
    const code = `
def bubble_sort(arr):
    """Simple bubble sort."""
    n = len(arr)
    for i in range(n):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
`;
    const results = extractAlgoFromSourceFile(code, 'py', SOURCE_URL);
    const entry = results.find((r) => r.name === 'bubble_sort');
    expect(entry?.code_py.length).toBeGreaterThan(0);
    expect(entry?.code_ts).toBe('');
  });
});
