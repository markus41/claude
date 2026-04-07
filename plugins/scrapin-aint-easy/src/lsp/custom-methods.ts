import pino from 'pino';

const logger = pino({ name: 'lsp-custom' });

export interface AlgoSearchResponse {
  results: Array<{
    name: string;
    category: string;
    description: string;
    complexity: string;
    sourceKey: string;
  }>;
  total: number;
}

interface RefreshParams {
  symbol: string;
  sourceKey?: string;
}

interface AlgoSearchParams {
  query: string;
  category?: string;
}

/**
 * Crawler interface expected by the refresh handler.
 * Accepts any object with a `crawlSymbol` method.
 */
interface CrawlerLike {
  crawlSymbol(symbol: string, sourceKey?: string): Promise<void>;
}

/**
 * AlgoManager interface expected by the search handler.
 * Accepts any object with a `search` method.
 */
interface AlgoManagerLike {
  search(
    query: string,
    category?: string,
  ): Promise<
    Array<{
      name: string;
      category: string;
      description: string;
      complexity: string;
      sourceKey: string;
    }>
  >;
}

/**
 * Handle $/scrapin/refresh notification.
 * Fires a background crawl for a specific symbol, optionally scoped to a source.
 */
export async function handleScrapinRefresh(
  params: RefreshParams,
  crawler: CrawlerLike,
): Promise<void> {
  const { symbol, sourceKey } = params;

  logger.info({ symbol, sourceKey }, 'Scrapin refresh requested');

  try {
    await crawler.crawlSymbol(symbol, sourceKey);
    logger.info({ symbol, sourceKey }, 'Scrapin refresh completed');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ symbol, sourceKey, error: message }, 'Scrapin refresh failed');
  }
}

/**
 * Handle $/scrapin/algosearch request.
 * Searches the algorithm library with optional category filter.
 */
export async function handleScrapinAlgoSearch(
  params: AlgoSearchParams,
  algoManager: AlgoManagerLike,
): Promise<AlgoSearchResponse> {
  const { query, category } = params;

  logger.info({ query, category }, 'Algo search requested');

  try {
    const results = await algoManager.search(query, category);

    logger.info(
      { query, category, resultCount: results.length },
      'Algo search completed',
    );

    return {
      results,
      total: results.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ query, category, error: message }, 'Algo search failed');

    return {
      results: [],
      total: 0,
    };
  }
}
