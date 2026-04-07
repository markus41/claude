import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';
import { type VectorStore } from '../../core/vector.js';
import { type EventBus } from '../../core/event-bus.js';
import { loadAlgoSources } from '../../config/loader.js';

const logger = pino({ name: 'job:algo-sweep' });

export function createAlgoSweepJob(
  graph: GraphAdapter,
  vector: VectorStore,
  eventBus: EventBus,
  configDir: string,
): () => Promise<void> {
  return async () => {
    logger.info('Starting algorithm source sweep');

    const sources = await loadAlgoSources(configDir);
    if (sources.length === 0) {
      logger.info('No algorithm sources configured');
      return;
    }

    // Dynamic import to avoid circular dependency
    const { AlgoIndexer } = await import('../../algorithms/algo-index.js');
    const indexer = new AlgoIndexer(graph, vector, eventBus);
    await indexer.indexAllSources(sources);

    // Re-link related algos
    const { AlgoGraphManager } = await import('../../algorithms/algo-graph.js');
    const manager = new AlgoGraphManager(graph, vector);
    const linked = await manager.linkRelatedAlgos();

    logger.info({ sources: sources.length, linkedEdges: linked }, 'Algorithm sweep completed');
  };
}
