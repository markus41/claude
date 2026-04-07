import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

vi.mock('pino', () => ({
  default: () => ({
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  }),
}));

class FakeHnswIndex {
  private readonly points = new Map<number, number[]>();

  initIndex(): void {
    this.points.clear();
  }

  addPoint(point: number[] | Float32Array, id: number): void {
    this.points.set(id, Array.from(point));
  }

  writeIndexSync(): void {
    // no-op for test
  }

  readIndexSync(): void {
    // no-op for test
  }

  searchKnn(query: number[] | Float32Array, k: number): { neighbors: number[]; distances: number[] } {
    const queryVector = Array.from(query);
    const scored = [...this.points.entries()]
      .map(([id, point]) => ({ id, score: cosineSimilarity(queryVector, point) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return {
      neighbors: scored.map((row) => row.id),
      distances: scored.map((row) => 1 - row.score),
    };
  }

  markDelete(id: number): void {
    this.points.delete(id);
  }
}

describe('VectorStore', () => {
  let VectorStore: typeof import('../../src/core/vector.js').VectorStore;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalProvider = process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER;

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER = 'test';
    ({ VectorStore } = await import('../../src/core/vector.js'));
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalProvider === undefined) {
      delete process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER;
    } else {
      process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER = originalProvider;
    }
  });

  it('maintains stable ranking behavior across restarts', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'vector-store-restart-'));

    const first = new VectorStore(dataDir);
    await first.initialize();
    await first.add('a', 'Symbol', 'react query useQuery fetching data');
    await first.add('b', 'Symbol', 'react mutation update and invalidate cache');
    await first.add('c', 'Symbol', 'pagination and infinite query patterns');

    const beforeRestart = await first.search('query cache invalidation', 3);

    const second = new VectorStore(dataDir);
    await second.initialize();
    const afterRestart = await second.search('query cache invalidation', 3);

    expect(afterRestart.map((row) => row.id)).toEqual(beforeRestart.map((row) => row.id));
    expect(afterRestart[0]?.score).toBeCloseTo(beforeRestart[0]?.score ?? 0, 5);
  });

  it('returns ANN and brute-force parity on small corpora', async () => {
    const annDataDir = await mkdtemp(join(tmpdir(), 'vector-store-ann-'));
    const bruteDataDir = await mkdtemp(join(tmpdir(), 'vector-store-brute-'));

    const annStore = new VectorStore(annDataDir, {
      hnswFactory: async () => new FakeHnswIndex(),
    });
    const bruteStore = new VectorStore(bruteDataDir, {
      disableHnsw: true,
    });

    await annStore.initialize();
    await bruteStore.initialize();

    const docs = [
      ['doc-1', 'AlgoNode', 'binary search over sorted arrays'],
      ['doc-2', 'AlgoNode', 'depth first search on graph with stack'],
      ['doc-3', 'AlgoNode', 'breadth first search with queue'],
      ['doc-4', 'AlgoNode', 'dynamic programming edit distance'],
    ] as const;

    for (const [id, label, text] of docs) {
      await annStore.add(id, label, text);
      await bruteStore.add(id, label, text);
    }

    const ann = await annStore.search('graph traversal queue', 3);
    const brute = await bruteStore.search('graph traversal queue', 3);

    expect(ann.map((row) => row.id)).toEqual(brute.map((row) => row.id));
  });

  it('rejects invalid embedding backend in production mode', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER = 'test';

    const dataDir = await mkdtemp(join(tmpdir(), 'vector-store-prod-'));
    const store = new VectorStore(dataDir);

    await expect(store.initialize()).rejects.toThrow(/only allowed in NODE_ENV=test or NODE_ENV=development/i);
  });
});

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / Math.sqrt(normA * normB);
}
