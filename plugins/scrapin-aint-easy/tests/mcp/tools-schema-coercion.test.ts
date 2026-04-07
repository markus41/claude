import { describe, expect, it, vi } from 'vitest';

vi.mock('pino', () => ({
  default: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { createTools } from '../../src/mcp/tools.js';
import { zodToJsonSchema } from '../../src/mcp/zod-json-schema.js';

function makeTools() {
  const graph = {
    search: vi.fn().mockResolvedValue([]),
    traverse: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    siblings: vi.fn().mockResolvedValue([]),
  } as never;

  const vector = {
    search: vi.fn().mockResolvedValue([]),
  } as never;

  const eventBus = {
    emit: vi.fn(),
  } as never;

  const crawlQueue = {
    enqueue: vi.fn().mockReturnValue({ id: 'job-1' }),
  } as never;

  const tools = createTools(graph, vector, eventBus, {
    configDir: '',
    dataDir: '',
    projectRoot: '',
    sources: {
      docs: {
        name: 'Docs',
        base_url: 'https://example.com',
      },
    },
    crawlQueue,
  });

  return { tools, graph, vector, crawlQueue };
}

describe('MCP tool schema + coercion', () => {
  it('ListTools advertises real JSON Schema parameter types', () => {
    const { tools } = makeTools();

    const listToolsResponse = {
      tools: tools.map((tool) => ({
        name: tool.name,
        inputSchema: zodToJsonSchema(tool.inputSchema),
      })),
    };

    const searchTool = listToolsResponse.tools.find((tool) => tool.name === 'scrapin_search');
    const graphTool = listToolsResponse.tools.find((tool) => tool.name === 'scrapin_graph_query');
    const crawlTool = listToolsResponse.tools.find((tool) => tool.name === 'scrapin_crawl_source');

    expect(searchTool?.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
        label_filter: {
          type: 'string',
          enum: ['Source', 'Page', 'Symbol', 'Module', 'Example', 'AlgoNode', 'Pattern', 'AgentDef'],
        },
      },
      required: ['query'],
    });

    expect(graphTool?.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        hops: { type: 'number' },
        include_siblings: { type: 'boolean' },
        edge_types: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    });

    expect(crawlTool?.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        force: { type: 'boolean' },
      },
    });
  });

  it('accepts stringified numeric/boolean tool inputs via coercion', async () => {
    const { tools, graph, vector, crawlQueue } = makeTools();
    const searchTool = tools.find((tool) => tool.name === 'scrapin_search');
    const graphTool = tools.find((tool) => tool.name === 'scrapin_graph_query');
    const crawlTool = tools.find((tool) => tool.name === 'scrapin_crawl_source');

    expect(searchTool).toBeDefined();
    expect(graphTool).toBeDefined();
    expect(crawlTool).toBeDefined();

    await searchTool!.handler({ query: 'auth', limit: '3' });
    await graphTool!.handler({ start_id: 'symbol::auth', hops: '2', include_siblings: 'true' });
    await crawlTool!.handler({ source_key: 'docs', force: 'true' });

    expect(vector.search).toHaveBeenCalledWith('auth', 3, undefined);
    expect(graph.traverse).toHaveBeenCalledWith('symbol::auth', 2, undefined);
    expect(graph.siblings).toHaveBeenCalledWith('symbol::auth');
    expect(crawlQueue.enqueue).toHaveBeenCalledWith(
      'docs',
      { name: 'Docs', base_url: 'https://example.com' },
      true,
    );
  });

  it('rejects invalid coerced values with clear validation errors', async () => {
    const { tools } = makeTools();
    const searchTool = tools.find((tool) => tool.name === 'scrapin_search');
    const graphTool = tools.find((tool) => tool.name === 'scrapin_graph_query');

    await expect(searchTool!.handler({ query: 'auth', limit: '0' })).rejects.toThrow(/greater than or equal to 1/i);
    await expect(graphTool!.handler({ start_id: 'n1', hops: 'not-a-number' })).rejects.toThrow(/number/i);
    await expect(
      searchTool!.handler({ query: 'auth', label_filter: 'TotallyInvalidLabel' }),
    ).rejects.toThrow(/invalid enum value/i);
  });
});
