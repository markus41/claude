import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import pino from 'pino';

const logger = pino({ name: 'vector' });

const EMBEDDING_DIMENSION = 384;
const EMBEDDINGS_DIR = 'embeddings';
const ENTRIES_FILE = 'entries.json';

interface VectorEntry {
  id: string;
  label: string;
  text: string;
  embedding: number[];
}

interface PersistedEntry {
  id: string;
  label: string;
  text: string;
  embedding?: number[];
  embedding_q?: number[];
  embedding_scale?: number;
}

interface EmbeddingProvider {
  readonly name: string;
  embed(text: string): Promise<number[]>;
}

interface HnswIndex {
  initIndex(maxElements: number): void;
  addPoint(point: number[] | Float32Array, id: number): void;
  writeIndexSync(path: string): void;
  readIndexSync(path: string): void;
  searchKnn(query: number[] | Float32Array, k: number): { neighbors: number[]; distances: number[] };
  markDelete?(id: number): void;
  resizeIndex?(size: number): void;
}

interface VectorStoreOptions {
  embeddingProvider?: 'local' | 'remote' | 'test';
  remoteEmbeddingUrl?: string;
  remoteEmbeddingApiKey?: string;
  modelName?: string;
  allowTestProvider?: boolean;
  hnswFactory?: () => Promise<HnswIndex | null>;
  disableHnsw?: boolean;
}

export interface VectorSearchResult {
  id: string;
  label: string;
  text: string;
  score: number;
}

class LocalTransformersProvider implements EmbeddingProvider {
  readonly name = 'local-transformers';
  // Vendor types for @xenova/transformers are fragile across versions; use `any`
  // on the pipeline seam and narrow at the call site via Array.from on .data.
  private pipelinePromise: Promise<unknown> | null = null;

  constructor(private readonly modelName: string) {}

  async embed(text: string): Promise<number[]> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = import('@xenova/transformers').then((transformers) =>
        transformers.pipeline('feature-extraction', this.modelName),
      );
    }
    const pipe = await this.pipelinePromise;
    if (!pipe) throw new Error('LocalTransformersProvider: pipeline not initialized');
    const result = await (pipe as (t: string, o: Record<string, unknown>) => Promise<{ data: ArrayLike<number> }>)(
      text,
      { pooling: 'mean', normalize: true },
    );
    return Array.from(result.data);
  }
}

class RemoteEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'remote';

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string,
  ) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) {
      throw new Error(`Remote embedding provider failed (${res.status} ${res.statusText})`);
    }

    const body = (await res.json()) as { embedding?: number[]; data?: Array<{ embedding?: number[] }> };
    const embedding = body.embedding ?? body.data?.[0]?.embedding;
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      throw new Error('Remote embedding provider response missing embedding array');
    }
    return normalizeVector(embedding);
  }
}

class DeterministicTestProvider implements EmbeddingProvider {
  readonly name = 'deterministic-test';

  async embed(text: string): Promise<number[]> {
    const embedding = new Array<number>(EMBEDDING_DIMENSION);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
      hash = ((hash << 5) - hash + i) | 0;
      embedding[i] = (hash & 0xffff) / 0xffff;
    }
    return normalizeVector(embedding);
  }
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private readonly modelName: string;
  private embeddingProvider: EmbeddingProvider | null = null;
  private hnswIndex: HnswIndex | null = null;
  private readonly idToLabel = new Map<string, number>();
  private readonly labelToId = new Map<number, string>();
  private nextLabel = 1;

  constructor(
    private readonly dataDir: string,
    private readonly options: VectorStoreOptions = {},
  ) {
    this.modelName = options.modelName ?? 'Xenova/all-MiniLM-L6-v2';
  }

  async initialize(): Promise<void> {
    const embeddingsDir = this.getEmbeddingsDir();
    if (!existsSync(embeddingsDir)) {
      await mkdir(embeddingsDir, { recursive: true });
    }

    await this.loadEntries();
    this.embeddingProvider = await this.resolveEmbeddingProvider();
    this.hnswIndex = await this.loadHnswIndex();

    if (this.hnswIndex) {
      this.rebuildHnswFromEntries();
    }

    logger.info(
      {
        entries: this.entries.length,
        embeddingProvider: this.embeddingProvider.name,
        annAvailable: Boolean(this.hnswIndex),
      },
      'Vector store initialized',
    );
  }

  async embed(text: string): Promise<number[]> {
    if (!this.embeddingProvider) {
      throw new Error('Vector store not initialized: embedding provider unavailable');
    }
    return this.embeddingProvider.embed(text);
  }

  async add(id: string, label: string, text: string): Promise<void> {
    const embedding = await this.embed(text);

    const existing = this.entries.find((e) => e.id === id);
    if (existing) {
      await this.remove(id);
    }

    const entry: VectorEntry = { id, label, text, embedding };
    this.entries.push(entry);
    this.addToHnsw(entry);
    await this.saveEntries();
  }

  async search(query: string, limit = 10, labelFilter?: string): Promise<VectorSearchResult[]> {
    const startedAt = Date.now();
    const queryEmbedding = await this.embed(query);

    const annSearch = this.tryAnnSearch(queryEmbedding, limit, labelFilter);
    if (annSearch) {
      logger.info(
        {
          embeddingProvider: this.embeddingProvider?.name,
          searchPath: 'ann',
          queryLatencyMs: Date.now() - startedAt,
          candidates: annSearch.candidateCount,
          limit,
          labelFilter,
        },
        'Vector search completed',
      );
      return annSearch.results;
    }

    let candidates = this.entries;
    if (labelFilter) {
      candidates = candidates.filter((entry) => entry.label === labelFilter);
    }

    const scored = candidates.map((entry) => ({
      ...entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ id, label, text, score }) => ({ id, label, text, score }));

    logger.info(
      {
        embeddingProvider: this.embeddingProvider?.name,
        searchPath: 'brute-force',
        queryLatencyMs: Date.now() - startedAt,
        candidates: candidates.length,
        limit,
        labelFilter,
      },
      'Vector search completed',
    );

    return results;
  }

  async remove(id: string): Promise<void> {
    const existing = this.entries.find((entry) => entry.id === id);
    if (!existing) {
      return;
    }

    this.entries = this.entries.filter((entry) => entry.id !== id);
    this.deleteFromHnsw(id);
    await this.saveEntries();
  }

  async rebuild(): Promise<void> {
    if (this.hnswIndex) {
      this.rebuildHnswFromEntries();
      await this.persistHnswIndex();
    }
    await this.saveEntries();
    logger.info({ entries: this.entries.length }, 'Vector index rebuilt');
  }

  get size(): number {
    return this.entries.length;
  }

  private async resolveEmbeddingProvider(): Promise<EmbeddingProvider> {
    const isTestLikeMode =
      this.options.allowTestProvider ?? (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development');

    const configured = this.options.embeddingProvider ?? (process.env.SCRAPIN_VECTOR_EMBEDDING_PROVIDER as
      | 'local'
      | 'remote'
      | 'test'
      | undefined);

    if (configured && configured !== 'local' && configured !== 'remote' && configured !== 'test') {
      throw new Error(
        `Invalid SCRAPIN_VECTOR_EMBEDDING_PROVIDER value "${configured}". Supported values: local, remote, test.`,
      );
    }

    if (configured === 'test') {
      if (!isTestLikeMode) {
        throw new Error(
          'Deterministic test embedding provider is only allowed in NODE_ENV=test or NODE_ENV=development.',
        );
      }
      return new DeterministicTestProvider();
    }

    if (configured === 'remote') {
      const remoteUrl = this.options.remoteEmbeddingUrl ?? process.env.SCRAPIN_VECTOR_REMOTE_URL;
      if (!remoteUrl) {
        throw new Error('SCRAPIN_VECTOR_REMOTE_URL is required when SCRAPIN_VECTOR_EMBEDDING_PROVIDER=remote.');
      }
      return new RemoteEmbeddingProvider(remoteUrl, this.options.remoteEmbeddingApiKey ?? process.env.SCRAPIN_VECTOR_REMOTE_API_KEY);
    }

    if (configured === 'local') {
      await this.assertLocalProviderAvailable();
      return this.createLocalProvider();
    }

    try {
      await this.assertLocalProviderAvailable();
      return this.createLocalProvider();
    } catch (error) {
      const remoteUrl = this.options.remoteEmbeddingUrl ?? process.env.SCRAPIN_VECTOR_REMOTE_URL;
      if (remoteUrl) {
        return new RemoteEmbeddingProvider(remoteUrl, this.options.remoteEmbeddingApiKey ?? process.env.SCRAPIN_VECTOR_REMOTE_API_KEY);
      }
      if (isTestLikeMode) {
        logger.warn({ err: error }, 'Falling back to deterministic test embedding provider in test/dev mode');
        return new DeterministicTestProvider();
      }
      throw new Error(
        'No valid embedding provider configured. Install @xenova/transformers for local embeddings or configure SCRAPIN_VECTOR_EMBEDDING_PROVIDER=remote with SCRAPIN_VECTOR_REMOTE_URL.',
      );
    }
  }

  private createLocalProvider(): EmbeddingProvider {
    return new LocalTransformersProvider(this.modelName);
  }

  private async assertLocalProviderAvailable(): Promise<void> {
    try {
      await import('@xenova/transformers');
    } catch (error) {
      throw new Error(
        `Local embedding provider unavailable: ${(error as Error).message}. Install @xenova/transformers or configure SCRAPIN_VECTOR_EMBEDDING_PROVIDER=remote.`,
      );
    }
  }

  private async loadHnswIndex(): Promise<HnswIndex | null> {
    if (this.options.disableHnsw) {
      return null;
    }

    if (this.options.hnswFactory) {
      return this.options.hnswFactory();
    }

    try {
      const hnswlib = await import('hnswlib-node');
      const index = new hnswlib.default.HierarchicalNSW('cosine', EMBEDDING_DIMENSION) as HnswIndex;
      // When entries already exist, `rebuildHnswFromEntries` will call
      // `initIndex` with the correct final size. Pre-allocating here would
      // just be abandoned — so only init the empty-corpus fast path.
      if (this.entries.length === 0) {
        index.initIndex(1024);
      }
      return index;
    } catch {
      logger.info('hnswlib-node not available; using brute-force vector search');
      return null;
    }
  }

  private getEmbeddingsDir(): string {
    return join(this.dataDir, EMBEDDINGS_DIR);
  }

  private getEntriesPath(): string {
    return join(this.getEmbeddingsDir(), ENTRIES_FILE);
  }

  private getHnswPath(): string {
    return join(this.getEmbeddingsDir(), 'hnsw.index');
  }

  private async saveEntries(): Promise<void> {
    const filePath = this.getEntriesPath();
    const data: PersistedEntry[] = this.entries.map((entry) => {
      const quantized = quantizeEmbedding(entry.embedding);
      return {
        id: entry.id,
        label: entry.label,
        text: entry.text,
        embedding_q: quantized.values,
        embedding_scale: quantized.scale,
      };
    });

    await writeFile(filePath, JSON.stringify(data), 'utf-8');
    await this.persistHnswIndex();
  }

  private async loadEntries(): Promise<void> {
    const filePath = this.getEntriesPath();
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as PersistedEntry[];
      this.entries = data
        .map((entry) => {
          const embedding = restoreEmbedding(entry);
          if (!embedding) {
            return null;
          }
          return {
            id: entry.id,
            label: entry.label,
            text: entry.text,
            embedding,
          } satisfies VectorEntry;
        })
        .filter((entry): entry is VectorEntry => entry !== null);
      logger.info({ loaded: this.entries.length }, 'Loaded vector entries from disk');
    } catch {
      // No persisted entries yet.
    }
  }

  private rebuildHnswFromEntries(): void {
    if (!this.hnswIndex) {
      return;
    }

    this.idToLabel.clear();
    this.labelToId.clear();
    this.nextLabel = 1;

    this.hnswIndex.initIndex(Math.max(1024, this.entries.length * 2 + 1));
    for (const entry of this.entries) {
      this.addToHnsw(entry);
    }
  }

  private addToHnsw(entry: VectorEntry): void {
    if (!this.hnswIndex) {
      return;
    }

    const label = this.nextLabel++;
    this.idToLabel.set(entry.id, label);
    this.labelToId.set(label, entry.id);
    this.hnswIndex.addPoint(entry.embedding, label);
  }

  private deleteFromHnsw(id: string): void {
    if (!this.hnswIndex) {
      return;
    }

    const label = this.idToLabel.get(id);
    if (label === undefined) {
      return;
    }

    this.idToLabel.delete(id);
    this.labelToId.delete(label);
    this.hnswIndex.markDelete?.(label);
  }

  private tryAnnSearch(
    queryEmbedding: number[],
    limit: number,
    labelFilter?: string,
  ): { results: VectorSearchResult[]; candidateCount: number } | null {
    if (!this.hnswIndex || this.entries.length === 0) {
      return null;
    }

    const requestedCandidates = Math.max(limit * 5, limit);
    const k = Math.min(this.entries.length, requestedCandidates);
    const nearest = this.hnswIndex.searchKnn(queryEmbedding, k);
    const neighbors = nearest.neighbors ?? [];

    const mapped = neighbors
      .map((labelId) => this.labelToId.get(labelId))
      .filter((id): id is string => Boolean(id))
      .map((id) => this.entries.find((entry) => entry.id === id))
      .filter((entry): entry is VectorEntry => entry !== undefined)
      .filter((entry) => !labelFilter || entry.label === labelFilter)
      .map((entry) => ({
        id: entry.id,
        label: entry.label,
        text: entry.text,
        score: cosineSimilarity(queryEmbedding, entry.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      results: mapped,
      candidateCount: neighbors.length,
    };
  }

  private async persistHnswIndex(): Promise<void> {
    if (!this.hnswIndex) {
      return;
    }

    this.hnswIndex.writeIndexSync(this.getHnswPath());
  }
}

function restoreEmbedding(entry: PersistedEntry): number[] | null {
  if (entry.embedding && Array.isArray(entry.embedding)) {
    return normalizeVector(entry.embedding);
  }

  if (entry.embedding_q && entry.embedding_scale) {
    const restored = entry.embedding_q.map((value) => value * entry.embedding_scale!);
    return normalizeVector(restored);
  }

  return null;
}

function quantizeEmbedding(values: number[]): { values: number[]; scale: number } {
  const maxAbs = values.reduce((acc, v) => Math.max(acc, Math.abs(v)), 0);
  const scale = maxAbs > 0 ? maxAbs / 32767 : 1;
  const quantized = values.map((value) => Math.round(value / scale));
  return {
    values: quantized,
    scale,
  };
}

function normalizeVector(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!norm) {
    return values;
  }
  return values.map((value) => value / norm);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
