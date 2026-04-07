import { describe, expect, it, vi } from 'vitest';
import { createTools, paginateRows } from '../../src/mcp/tools.js';
import type { GraphAdapter } from '../../src/core/graph.js';
import type { VectorStore } from '../../src/core/vector.js';
import { EventBus } from '../../src/core/event-bus.js';

function decodeNextCursor(text: string): string | undefined {
  const match = text.match(/next_cursor: `([^`]+)`/);
  return match?.[1];
}

describe('paginateRows', () => {
  it('generates next_cursor and stable page boundaries', () => {
    const rows = ['a', 'b', 'c', 'd', 'e'];
    const first = paginateRows('scrapin_search', rows, { page_size: 2 }, { query: 'abc' });
    expect(first.rows).toEqual(['a', 'b']);
    expect(first.nextCursor).toBeDefined();

    const second = paginateRows('scrapin_search', rows, { page_size: 2, cursor: first.nextCursor }, { query: 'abc' });
    expect(second.rows).toEqual(['c', 'd']);
    expect(new Set([...first.rows, ...second.rows]).size).toBe(4);

    const third = paginateRows('scrapin_search', rows, { page_size: 2, cursor: second.nextCursor }, { query: 'abc' });
    expect(third.rows).toEqual(['e']);
    expect(third.nextCursor).toBeUndefined();
  });

  it('rejects cursor from another tool', () => {
    const page = paginateRows('scrapin_search', [1, 2, 3], { page_size: 1 }, { query: 'x' });
    expect(() => paginateRows('scrapin_algo_search', [1, 2, 3], { page_size: 1, cursor: page.nextCursor }, { query: 'x' }))
      .toThrow(/Cursor is for tool/);
  });
});

describe('scrapin_search pagination integration', () => {
  it('returns next_cursor and allows fetching the next page with no duplicates', async () => {
    const vector = {
      search: vi.fn().mockResolvedValue([
        { id: 'id-1', label: 'Symbol', text: 'text-1', score: 0.9 },
        { id: 'id-2', label: 'Symbol', text: 'text-2', score: 0.8 },
        { id: 'id-3', label: 'Symbol', text: 'text-3', score: 0.7 },
      ]),
      size: 3,
    } as unknown as VectorStore;

    const graph = {
      search: vi.fn().mockResolvedValue([]),
    } as unknown as GraphAdapter;

    const tools = createTools(graph, vector, new EventBus(), {
      configDir: '/tmp/config',
      dataDir: '/tmp/data',
      projectRoot: '/tmp/project',
    });

    const searchTool = tools.find((t) => t.name === 'scrapin_search');
    expect(searchTool).toBeDefined();
    const tool = searchTool!;

    const first = await tool.handler({ query: 'x', limit: 3, page_size: 2 });
    const firstText = first.content[0]?.text ?? '';
    expect(firstText).toContain('1. **id-1**');
    expect(firstText).toContain('2. **id-2**');

    const nextCursor = decodeNextCursor(firstText);
    expect(nextCursor).toBeDefined();

    const second = await tool.handler({ query: 'x', limit: 3, page_size: 2, cursor: nextCursor });
    const secondText = second.content[0]?.text ?? '';
    expect(secondText).toContain('3. **id-3**');
    expect(secondText).not.toContain('1. **id-1**');
  });

  it('returns error for invalid cursor encoding', async () => {
    const vector = {
      search: vi.fn().mockResolvedValue([{ id: 'id-1', label: 'Symbol', text: 'text-1', score: 0.9 }]),
      size: 1,
    } as unknown as VectorStore;

    const graph = { search: vi.fn().mockResolvedValue([]) } as unknown as GraphAdapter;

    const tools = createTools(graph, vector, new EventBus(), {
      configDir: '/tmp/config',
      dataDir: '/tmp/data',
      projectRoot: '/tmp/project',
    });

    const tool = tools.find((t) => t.name === 'scrapin_search');
    const response = await tool!.handler({ query: 'x', cursor: 'not-base64', page_size: 1 });
    expect(response.isError).toBe(true);
    expect(response.content[0]?.text).toContain('Invalid cursor');
  });
});
