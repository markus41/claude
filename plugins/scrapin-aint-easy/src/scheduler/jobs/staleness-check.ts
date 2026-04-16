import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';

const logger = pino({ name: 'job:staleness-check' });

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createStalenessCheckJob(graph: GraphAdapter): () => Promise<void> {
  return async () => {
    logger.info('Running staleness check');
    const pages = await graph.getNodesByLabel('Page');
    let staleCount = 0;

    for (const page of pages) {
      const lastCrawled = page.props['last_crawled'] as string | undefined;
      if (!lastCrawled) {
        await graph.markStale(page.id);
        staleCount++;
        continue;
      }

      const crawlTime = new Date(lastCrawled).getTime();
      if (Date.now() - crawlTime > STALE_THRESHOLD_MS) {
        await graph.markStale(page.id);
        staleCount++;
      }
    }

    logger.info({ totalPages: pages.length, staleCount }, 'Staleness check completed');
  };
}
