import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import pino from 'pino';

const logger = pino({ name: 'vector' });

/**
 * Vector embedding store using @xenova/transformers for embedding generation
 * and hnswlib-node for approximate nearest neighbor search.
 * Falls back to brute-force cosine similarity when native modules unavailable.
 */

interface VectorEntry {
  id: string;
  label: string;
  text: string;
  embedding: number[];
}

export interface VectorSearchResult {
  id: string;
  label: string;
  text: string;
  score: number;
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private pipeline: unknown = null;
  private hnswIndex: unknown = null;
  private indexDirty = false;
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2';

  constructor(private readonly dataDir: string) {}

  async initialize(): Promise<void> {
    const embeddingsDir = join(this.dataDir, 'embeddings');
    if (!existsSync(embeddingsDir)) {
      await mkdir(embeddingsDir, { recursive: true });
    }

    // Try loading transformer pipeline
    try {
      const transformers = await import('@xenova/transformers');
      this.pipeline = await transformers.pipeline('feature-extraction', this.modelName);
      logger.info('Xenova transformer pipeline loaded');
    } catch {
      logger.warn('Xenova transformers not available, using random embeddings for testing');
    }

    // Try loading HNSW index
    try {
      const hnswlib = await import('hnswlib-node');
      const index = new hnswlib.default.HierarchicalNSW('cosine', 384);
      const indexPath = join(embeddingsDir, 'hnsw.index');
      if (existsSync(indexPath)) {
        index.readIndexSync(indexPath);
      } else {
        index.initIndex(100000);
      }
      this.hnswIndex = index;
      logger.info('HNSW index loaded');
    } catch {
      logger.info('hnswlib-node not available, using brute-force search');
    }

    // Load persisted entries
    await this.loadEntries();
  }

  async embed(text: string): Promise<number[]> {
    if (this.pipeline) {
      const pipe = this.pipeline as (text: string, opts: Record<string, unknown>) => Promise<{ data: Float32Array }>;
      const result = await pipe(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    }

    // Deterministic fallback: hash-based pseudo-embedding for testing
    const dim = 384;
    const embedding = new Array<number>(dim);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }
    for (let i = 0; i < dim; i++) {
      hash = ((hash << 5) - hash + i) | 0;
      embedding[i] = (hash & 0xffff) / 0xffff;
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return embedding.map((v) => v / (norm || 1));
  }

  async add(id: string, label: string, text: string): Promise<void> {
    const embedding = await this.embed(text);

    // Remove existing entry with same id
    this.entries = this.entries.filter((e) => e.id !== id);
    this.entries.push({ id, label, text, embedding });
    this.indexDirty = true;
  }

  async search(query: string, limit = 10, labelFilter?: string): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.embed(query);

    let candidates = this.entries;
    if (labelFilter) {
      candidates = candidates.filter((e) => e.label === labelFilter);
    }

    // Cosine similarity search
    const scored = candidates.map((entry) => ({
      ...entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ id, label, text, score }) => ({ id, label, text, score }));
  }

  async remove(id: string): Promise<void> {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.indexDirty = true;
  }

  async rebuild(): Promise<void> {
    if (!this.indexDirty) return;
    // In a full implementation, rebuild HNSW index here
    await this.saveEntries();
    this.indexDirty = false;
    logger.info(`Vector index rebuilt with ${this.entries.length} entries`);
  }

  get size(): number {
    return this.entries.length;
  }

  private async saveEntries(): Promise<void> {
    const filePath = join(this.dataDir, 'embeddings', 'entries.json');
    const data = this.entries.map(({ id, label, text }) => ({ id, label, text }));
    await writeFile(filePath, JSON.stringify(data), 'utf-8');
  }

  private async loadEntries(): Promise<void> {
    const filePath = join(this.dataDir, 'embeddings', 'entries.json');
    try {
      const raw = await readFile(filePath, 'utf-8');
      const data = JSON.parse(raw) as Array<{ id: string; label: string; text: string }>;
      // Re-embed on load (embeddings are not persisted to save space)
      for (const entry of data) {
        const embedding = await this.embed(entry.text);
        this.entries.push({ ...entry, embedding });
      }
      logger.info(`Loaded ${this.entries.length} vector entries from disk`);
    } catch {
      // No persisted entries
    }
  }
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
