import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';
import { type VectorStore } from '../../core/vector.js';
import { loadSources } from '../../config/loader.js';

const logger = pino({ name: 'job:full-sweep' });

export function createFullSweepJob(
  graph: GraphAdapter,
  vector: VectorStore,
  configDir: string,
  crawlSource: (key: string, config: Record<string, unknown>) => Promise<void>,
): () => Promise<void> {
  return async () => {
    logger.info('Starting full documentation sweep');
    const sources = await loadSources(configDir);
    let processed = 0;
    let errors = 0;

    for (const [key, config] of Object.entries(sources)) {
      try {
        await crawlSource(key, config as unknown as Record<string, unknown>);
        processed++;
      } catch (err) {
        errors++;
        logger.error({ sourceKey: key, err }, 'Failed to crawl source');
      }
    }

    // Rebuild vector index after full sweep
    await vector.rebuild();

    logger.info({ processed, errors }, 'Full sweep completed');
  };
}
