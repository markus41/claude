import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';

const logger = pino({ name: 'job:missing-doc-scan' });

export function createMissingDocScanJob(graph: GraphAdapter): () => Promise<void> {
  return async () => {
    logger.info('Running missing documentation scan');
    const symbols = await graph.getNodesByLabel('Symbol');
    let missingDocs = 0;

    for (const symbol of symbols) {
      const description = symbol.props['description'] as string | undefined;
      const pageId = symbol.props['page_id'] as string | undefined;

      if (!description && !pageId) {
        missingDocs++;
        logger.debug({ symbolId: symbol.id, name: symbol.props['name'] }, 'Symbol missing documentation');
      }
    }

    logger.info({ totalSymbols: symbols.length, missingDocs }, 'Missing doc scan completed');
  };
}
