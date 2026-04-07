import pino from 'pino';
import { type VectorStore } from '../../core/vector.js';

const logger = pino({ name: 'job:embedding-rebuild' });

export function createEmbeddingRebuildJob(vector: VectorStore): () => Promise<void> {
  return async () => {
    logger.info('Starting embedding index rebuild');
    const startTime = Date.now();

    await vector.rebuild();

    const durationMs = Date.now() - startTime;
    logger.info({ durationMs, totalEntries: vector.size }, 'Embedding rebuild completed');
  };
}
