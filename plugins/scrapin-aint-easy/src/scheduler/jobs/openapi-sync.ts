import pino from 'pino';
import { type GraphAdapter } from '../../core/graph.js';
import { type VectorStore } from '../../core/vector.js';
import { loadSources } from '../../config/loader.js';

const logger = pino({ name: 'job:openapi-sync' });

export function createOpenApiSyncJob(
  graph: GraphAdapter,
  vector: VectorStore,
  configDir: string,
): () => Promise<void> {
  return async () => {
    logger.info('Starting OpenAPI spec sync');
    const sources = await loadSources(configDir);
    let synced = 0;

    for (const [key, config] of Object.entries(sources)) {
      if (!config.openapi_spec) continue;

      try {
        // Dynamic import to avoid circular dependency
        const { parseOpenApiSpec } = await import('../../crawler/openapi-parser.js');
        const pages = await parseOpenApiSpec(config.openapi_spec);

        for (const page of pages) {
          const pageId = `${key}:api:${page.method}:${page.path}`;
          await graph.upsertNode('Page', {
            id: pageId,
            url: `${config.base_url}${page.path}`,
            title: `${page.method.toUpperCase()} ${page.path}`,
            content_md: page.markdown,
            source_id: key,
            last_crawled: new Date().toISOString(),
            stale: false,
          });

          await vector.add(pageId, 'Page', `${page.method} ${page.path} ${page.summary} ${page.description}`);
        }

        synced++;
        logger.info({ sourceKey: key, endpoints: pages.length }, 'OpenAPI spec synced');
      } catch (err) {
        logger.error({ sourceKey: key, err }, 'Failed to sync OpenAPI spec');
      }
    }

    logger.info({ synced }, 'OpenAPI sync completed');
  };
}
