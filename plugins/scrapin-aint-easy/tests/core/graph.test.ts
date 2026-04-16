import { describe, it, expect, beforeEach } from 'vitest';
import { GraphAdapter } from '../../src/core/graph.js';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ── helpers ──
async function makeGraph(): Promise<GraphAdapter> {
  const dataDir = await mkdtemp(join(tmpdir(), 'scrapin-test-'));
  const configDir = await mkdtemp(join(tmpdir(), 'scrapin-config-'));
  const g = new GraphAdapter(dataDir, configDir);
  await g.initialize();
  return g;
}

describe('GraphAdapter', () => {
  let graph: GraphAdapter;

  beforeEach(async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'scrapin-test-'));
    const configDir = await mkdtemp(join(tmpdir(), 'scrapin-config-'));
    graph = new GraphAdapter(dataDir, configDir);
    await graph.initialize();
  });

  it('should upsert and retrieve nodes', async () => {
    await graph.upsertNode('Symbol', {
      id: 'test:useQuery',
      name: 'useQuery',
      kind: 'function',
      description: 'React Query hook for fetching data',
      signature: 'useQuery(options: QueryOptions): QueryResult',
      deprecated: false,
      deleted: false,
      source_id: 'react-query',
      page_id: 'rq:hooks',
      last_crawled: '2024-01-01',
    });

    const node = await graph.getNode('test:useQuery');
    expect(node).toBeDefined();
    expect(node?.props['name']).toBe('useQuery');
    expect(node?.label).toBe('Symbol');
  });

  it('should upsert edges and traverse', async () => {
    await graph.upsertNode('Symbol', { id: 'a', name: 'A' });
    await graph.upsertNode('Symbol', { id: 'b', name: 'B' });
    await graph.upsertNode('Symbol', { id: 'c', name: 'C' });

    await graph.upsertEdge('CALLS', 'a', 'b');
    await graph.upsertEdge('CALLS', 'b', 'c');

    const subgraph = await graph.traverse('a', 2);
    expect(subgraph.nodes.length).toBe(3);
    expect(subgraph.edges.length).toBe(2);
  });

  it('should respect hop limit in traversal', async () => {
    await graph.upsertNode('Symbol', { id: 'a', name: 'A' });
    await graph.upsertNode('Symbol', { id: 'b', name: 'B' });
    await graph.upsertNode('Symbol', { id: 'c', name: 'C' });

    await graph.upsertEdge('CALLS', 'a', 'b');
    await graph.upsertEdge('CALLS', 'b', 'c');

    const subgraph = await graph.traverse('a', 1);
    expect(subgraph.nodes.length).toBe(2); // a and b only
  });

  it('should filter traversal by edge type', async () => {
    await graph.upsertNode('Symbol', { id: 'a', name: 'A' });
    await graph.upsertNode('Symbol', { id: 'b', name: 'B' });
    await graph.upsertNode('Symbol', { id: 'c', name: 'C' });

    await graph.upsertEdge('CALLS', 'a', 'b');
    await graph.upsertEdge('INHERITS', 'a', 'c');

    const callsOnly = await graph.traverse('a', 1, ['CALLS']);
    expect(callsOnly.nodes.length).toBe(2); // a and b
    expect(callsOnly.edges.every((e) => e.type === 'CALLS')).toBe(true);
  });

  it('should find siblings on same page', async () => {
    await graph.upsertNode('Symbol', { id: 's1', name: 'method1', page_id: 'page1' });
    await graph.upsertNode('Symbol', { id: 's2', name: 'method2', page_id: 'page1' });
    await graph.upsertNode('Symbol', { id: 's3', name: 'method3', page_id: 'page2' });

    const siblings = await graph.siblings('s1');
    expect(siblings.length).toBe(1);
    expect(siblings[0]?.name).toBe('method2');
  });

  it('should search nodes by name', async () => {
    await graph.upsertNode('Symbol', { id: 'a', name: 'useQuery', description: 'fetch data' });
    await graph.upsertNode('Symbol', { id: 'b', name: 'useMutation', description: 'mutate data' });
    await graph.upsertNode('Symbol', { id: 'c', name: 'other', description: 'something else' });

    const results = await graph.search('useQuery');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.id).toBe('a');
  });

  it('should mark nodes as stale', async () => {
    await graph.upsertNode('Page', { id: 'p1', title: 'Page 1', stale: false });
    await graph.markStale('p1');

    const node = await graph.getNode('p1');
    expect(node?.props['stale']).toBe(true);
  });

  it('should mark nodes as deleted', async () => {
    await graph.upsertNode('Page', { id: 'p1', title: 'Page 1', deleted: false });
    await graph.markDeleted('p1');

    const node = await graph.getNode('p1');
    expect(node?.props['deleted']).toBe(true);
  });

  it('should return accurate stats', async () => {
    await graph.upsertNode('Symbol', { id: 'a', name: 'A' });
    await graph.upsertNode('Symbol', { id: 'b', name: 'B' });
    await graph.upsertNode('Page', { id: 'p', title: 'P' });
    await graph.upsertEdge('DEFINED_IN', 'a', 'p');

    const stats = await graph.stats();
    expect(stats['Symbol']).toBe(2);
    expect(stats['Page']).toBe(1);
    expect(stats['total_nodes']).toBe(3);
    expect(stats['total_edges']).toBe(1);
  });
});

describe('GraphAdapter — additional edge cases', () => {
  it('should throw when upserting a node with no id', async () => {
    const g = await makeGraph();
    await expect(g.upsertNode('Symbol', { name: 'no-id' })).rejects.toThrow('Node must have an id property');
  });

  it('should overwrite existing node props on upsert', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'sym', name: 'original', kind: 'function' });
    await g.upsertNode('Symbol', { id: 'sym', name: 'updated', kind: 'method' });
    const node = await g.getNode('sym');
    expect(node?.props['name']).toBe('updated');
    expect(node?.props['kind']).toBe('method');
  });

  it('should return undefined for unknown node id', async () => {
    const g = await makeGraph();
    const node = await g.getNode('does-not-exist');
    expect(node).toBeUndefined();
  });

  it('should deduplicate identical edges', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'a', name: 'A' });
    await g.upsertNode('Symbol', { id: 'b', name: 'B' });
    await g.upsertEdge('CALLS', 'a', 'b');
    await g.upsertEdge('CALLS', 'a', 'b');
    const stats = await g.stats();
    expect(stats['total_edges']).toBe(1);
  });

  it('should not traverse past hops=0 (only start node in results)', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'root', name: 'root' });
    await g.upsertNode('Symbol', { id: 'neighbor', name: 'neighbor' });
    await g.upsertEdge('CALLS', 'root', 'neighbor');
    const sg = await g.traverse('root', 0);
    // Only the start node should be returned; the neighbour is queued at depth=1
    // which exceeds hops=0, so it is skipped. The edge is collected speculatively
    // when the start node's edges are scanned (before the depth check prunes it).
    expect(sg.nodes).toHaveLength(1);
    expect(sg.nodes[0]?.id).toBe('root');
    expect(sg.nodes.some((n) => n.id === 'neighbor')).toBe(false);
  });

  it('should prevent infinite loops in cyclic graphs', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'x', name: 'X' });
    await g.upsertNode('Symbol', { id: 'y', name: 'Y' });
    await g.upsertEdge('CALLS', 'x', 'y');
    await g.upsertEdge('CALLS', 'y', 'x');
    const sg = await g.traverse('x', 10);
    const xCount = sg.nodes.filter((n) => n.id === 'x').length;
    expect(xCount).toBe(1);
  });

  it('should return empty siblings for nodes with no page_id', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'orphan', name: 'orphan' });
    const sibs = await g.siblings('orphan');
    expect(sibs).toEqual([]);
  });

  it('should return empty stats for an empty graph', async () => {
    const g = await makeGraph();
    const stats = await g.stats();
    expect(stats['total_nodes']).toBe(0);
    expect(stats['total_edges']).toBe(0);
  });

  it('should return all nodes when getNodesByLabel matches multiple', async () => {
    const g = await makeGraph();
    await g.upsertNode('AlgoNode', { id: 'algo-1', name: 'BFS' });
    await g.upsertNode('AlgoNode', { id: 'algo-2', name: 'DFS' });
    await g.upsertNode('Symbol', { id: 'sym-1', name: 'myFn' });

    const algos = await g.getNodesByLabel('AlgoNode');
    expect(algos).toHaveLength(2);
    const ids = algos.map((n) => n.id);
    expect(ids).toContain('algo-1');
    expect(ids).toContain('algo-2');
  });

  it('search should rank exact name match higher than substring match', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 'exact', name: 'useQuery', description: '' });
    await g.upsertNode('Symbol', { id: 'substring', name: 'useQueryWithOptions', description: '' });

    const results = await g.search('useQuery');
    const exactIdx = results.findIndex((r) => r.id === 'exact');
    const subIdx = results.findIndex((r) => r.id === 'substring');
    expect(exactIdx).toBeGreaterThanOrEqual(0);
    expect(subIdx).toBeGreaterThanOrEqual(0);
    expect(exactIdx).toBeLessThan(subIdx);
  });

  it('search should return empty array when nothing matches', async () => {
    const g = await makeGraph();
    await g.upsertNode('Symbol', { id: 's', name: 'alpha', description: 'hello' });
    const results = await g.search('zzz-no-match-xyz');
    expect(results).toEqual([]);
  });

  it('markStale should be no-op for unknown node id', async () => {
    const g = await makeGraph();
    await expect(g.markStale('ghost')).resolves.toBeUndefined();
  });

  it('markDeleted should be no-op for unknown node id', async () => {
    const g = await makeGraph();
    await expect(g.markDeleted('ghost')).resolves.toBeUndefined();
  });
});
