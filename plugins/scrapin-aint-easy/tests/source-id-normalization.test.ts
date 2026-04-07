import { beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { GraphAdapter } from '../src/core/graph.js';
import { createTools } from '../src/mcp/tools.js';
import { toSourceId } from '../src/core/ids.js';
import { createOpenApiSyncJob } from '../src/scheduler/jobs/openapi-sync.js';

async function makeGraph(): Promise<GraphAdapter> {
  const dataDir = await mkdtemp(join(tmpdir(), 'scrapin-test-data-'));
  const configDir = await mkdtemp(join(tmpdir(), 'scrapin-test-config-'));
  const graph = new GraphAdapter(dataDir, configDir);
  await graph.initialize();
  return graph;
}

describe('source id normalization', () => {
  let graph: GraphAdapter;

  beforeEach(async () => {
    graph = await makeGraph();
  });

  it('supports add source + page creation and diff by raw source key', async () => {
    const tools = createTools(
      graph,
      {
        search: async () => [],
        add: async () => {},
        size: 0,
      } as never,
      {
        emit: async () => {},
      } as never,
      { configDir: '', dataDir: '', projectRoot: '' },
    );

    const addSource = tools.find((tool) => tool.name === 'scrapin_add_source');
    const diff = tools.find((tool) => tool.name === 'scrapin_diff');

    expect(addSource).toBeDefined();
    expect(diff).toBeDefined();

    await addSource!.handler({
      key: 'docs',
      name: 'Docs',
      base_url: 'https://example.com',
      package_aliases: [],
      concurrency: 2,
      rps: 1,
    });

    await graph.upsertNode('Page', {
      id: 'page::docs::intro',
      title: 'Intro',
      url: 'https://example.com/intro',
      source_id: toSourceId('docs'),
      stale: true,
    });

    await graph.upsertEdge('PART_OF', 'page::docs::intro', toSourceId('docs'));

    const source = await graph.getNode(toSourceId('docs'));
    expect(source).toBeDefined();

    const response = await diff!.handler({ source_key: 'docs' });
    const text = response.content[0]?.text ?? '';

    expect(text).toContain('Total pages:** 1');
    expect(text).toContain('Stale pages:** 1');
  });

  it('migrates legacy source/page IDs and keeps diff stale detection stable', async () => {
    await graph.upsertNode('Source', {
      id: 'legacy-docs',
      name: 'Legacy Docs',
      base_url: 'https://example.com',
    });
    await graph.upsertNode('Page', {
      id: 'page::legacy-docs::intro',
      title: 'Intro',
      url: 'https://example.com/intro',
      source_id: 'legacy-docs',
      stale: true,
    });
    await graph.upsertEdge('PART_OF', 'page::legacy-docs::intro', 'legacy-docs');

    const tools = createTools(
      graph,
      {
        search: async () => [],
        add: async () => {},
        size: 0,
      } as never,
      {
        emit: async () => {},
      } as never,
      { configDir: '', dataDir: '', projectRoot: '' },
    );
    const diff = tools.find((tool) => tool.name === 'scrapin_diff');
    expect(diff).toBeDefined();

    const response = await diff!.handler({ source_key: 'legacy-docs' });
    const text = response.content[0]?.text ?? '';
    expect(text).toContain('Total pages:** 1');
    expect(text).toContain('Stale pages:** 1');

    const canonicalSource = await graph.getNode(toSourceId('legacy-docs'));
    const legacySource = await graph.getNode('legacy-docs');
    expect(canonicalSource).toBeDefined();
    expect(legacySource).toBeUndefined();

    const pages = await graph.getNodesByLabel('Page');
    expect(pages[0]?.props['source_id']).toBe(toSourceId('legacy-docs'));

    const edges = await graph.getEdges();
    expect(edges.some((edge) => edge.type === 'PART_OF' && edge.to === toSourceId('legacy-docs'))).toBe(true);
    expect(edges.some((edge) => edge.type === 'PART_OF' && edge.to === 'legacy-docs')).toBe(false);
  });

  it('openapi sync writes normalized source_id and diff finds pages by source key', async () => {
    const configDir = await mkdtemp(join(tmpdir(), 'scrapin-openapi-config-'));
    const dataDir = await mkdtemp(join(tmpdir(), 'scrapin-openapi-data-'));
    const specPath = join(configDir, 'openapi.json');

    await writeFile(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Demo', version: '1.0.0' },
      paths: {
        '/status': {
          get: {
            summary: 'Status',
            responses: {
              '200': { description: 'ok' },
            },
          },
        },
      },
    }), 'utf-8');

    await writeFile(join(configDir, 'sources.yaml'), `sources:\n  demo:\n    name: Demo\n    base_url: https://example.com\n    openapi_spec: ${specPath}\n`, 'utf-8');

    const localGraph = new GraphAdapter(dataDir, configDir);
    await localGraph.initialize();

    const job = createOpenApiSyncJob(
      localGraph,
      {
        add: async () => {},
      } as never,
      configDir,
    );

    await job();

    const pages = await localGraph.getNodesByLabel('Page');
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0]?.props['source_id']).toBe(toSourceId('demo'));

    const tools = createTools(
      localGraph,
      {
        search: async () => [],
        add: async () => {},
        size: 0,
      } as never,
      {
        emit: async () => {},
      } as never,
      { configDir: '', dataDir: '', projectRoot: '' },
    );

    const diff = tools.find((tool) => tool.name === 'scrapin_diff');
    const response = await diff!.handler({ source_key: 'demo' });
    const text = response.content[0]?.text ?? '';

    expect(text).toContain('Total pages:** 1');
  });
});
