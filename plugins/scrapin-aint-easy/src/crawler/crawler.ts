import pino from 'pino';
import { AsyncSemaphore } from '../core/semaphore.js';
import { TokenBucket } from '../core/token-bucket.js';
import { type GraphAdapter } from '../core/graph.js';
import { type VectorStore } from '../core/vector.js';
import { eventBus } from '../core/event-bus.js';
import { type SourceConfig } from '../config/loader.js';
import { type ScrapinConfig } from '../config/defaults.js';
import { FirecrawlAdapter } from './firecrawl-adapter.js';
import { PuppeteerAdapter } from './puppeteer-adapter.js';
import { parseSitemap } from './sitemap-parser.js';
import { parseOpenApiSpec } from './openapi-parser.js';
import { extractSymbols } from './symbol-extractor.js';
import { saveSnapshot, loadSnapshot, diffSnapshots } from './snapshot.js';
import { toSourceId } from '../core/ids.js';

const logger = pino({ name: 'crawler' });

interface CrawlStats {
  pagesProcessed: number;
  pagesSkipped: number;
  symbolsExtracted: number;
  errors: number;
}

/**
 * Create a page ID from a URL by stripping the protocol and normalizing.
 */
function urlToPageId(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._/-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
}

/**
 * Retry an async operation with configurable backoff.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  backoff: 'exponential' | 'linear',
  label: string,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < attempts) {
        const delayMs = backoff === 'exponential'
          ? Math.min(1000 * Math.pow(2, attempt - 1), 30_000)
          : 1000 * attempt;
        logger.warn({ label, attempt, delayMs, error: lastError.message }, 'Retrying');
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError ?? new Error(`Failed after ${attempts} attempts: ${label}`);
}

export class DocCrawler {
  private readonly firecrawl: FirecrawlAdapter;
  private readonly puppeteer: PuppeteerAdapter;
  private firecrawlAvailable = false;
  private puppeteerAvailable = false;

  constructor(
    private readonly graph: GraphAdapter,
    private readonly vectorStore: VectorStore,
    private readonly config: ScrapinConfig,
    private readonly _eventBus = eventBus,
  ) {
    this.firecrawl = new FirecrawlAdapter();
    this.puppeteer = new PuppeteerAdapter();
  }

  async initialize(): Promise<void> {
    try {
      await this.firecrawl.initialize();
      this.firecrawlAvailable = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ error: msg }, 'Firecrawl not available, will use Puppeteer');
    }

    try {
      await this.puppeteer.initialize();
      this.puppeteerAvailable = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn({ error: msg }, 'Puppeteer not available');
    }

    if (!this.firecrawlAvailable && !this.puppeteerAvailable) {
      logger.error('No scraping backend available');
    }
  }

  /**
   * Full crawl of a documentation source: discover URLs, scrape, extract, index.
   */
  async crawlSource(sourceKey: string, sourceConfig: SourceConfig): Promise<CrawlStats> {
    const sourceId = toSourceId(sourceKey);
    const stats: CrawlStats = {
      pagesProcessed: 0,
      pagesSkipped: 0,
      symbolsExtracted: 0,
      errors: 0,
    };

    logger.info({ sourceKey, baseUrl: sourceConfig.base_url }, 'Starting source crawl');

    // Upsert Source node in graph
    await this.graph.upsertNode('Source', {
      id: sourceId,
      name: sourceConfig.name,
      base_url: sourceConfig.base_url,
      last_crawled: new Date().toISOString(),
    });

    // Discover URLs
    const urls = await this.discoverUrls(sourceKey, sourceConfig);
    logger.info({ sourceKey, urlCount: urls.length }, 'URLs discovered');

    // Handle OpenAPI spec if configured
    if (sourceConfig.openapi_spec) {
      await this.processOpenApiSpec(sourceKey, sourceConfig.openapi_spec, stats);
    }

    // Set up concurrency and rate limiting
    const concurrency = sourceConfig.concurrency ?? this.config.crawl.defaultConcurrency;
    const rps = sourceConfig.rps ?? this.config.crawl.defaultRps;
    const semaphore = new AsyncSemaphore(concurrency);
    const bucket = new TokenBucket(rps);

    // Crawl all discovered URLs
    const crawlPromises = urls.map((url) =>
      semaphore.run(async () => {
        await bucket.consume();
        await this.processUrl(url, sourceKey, sourceConfig, stats);
      }),
    );

    await Promise.allSettled(crawlPromises);

    logger.info({
      sourceKey,
      ...stats,
    }, 'Source crawl complete');

    return stats;
  }

  /**
   * Crawl a single URL, scrape it, extract symbols, and index.
   */
  async crawlUrl(url: string, sourceKey: string): Promise<void> {
    const retryAttempts = this.config.crawl.defaultRetryAttempts;
    const backoff = this.config.crawl.defaultBackoff;

    const { markdown, metadata } = await withRetry(
      () => this.scrapeUrl(url),
      retryAttempts,
      backoff,
      url,
    );

    const pageId = urlToPageId(url);

    // Save snapshot and check for changes
    const previousContent = await loadSnapshot(
      sourceKey, pageId, this.config.dataDir,
    );
    await saveSnapshot(sourceKey, pageId, markdown, this.config.dataDir);

    if (previousContent !== null) {
      const diff = diffSnapshots(previousContent, markdown);
      if (!diff.changed) {
        logger.debug({ url }, 'Content unchanged, skipping re-index');
        return;
      }
      logger.info({
        url,
        addedLines: diff.addedLines,
        removedLines: diff.removedLines,
        changedSections: diff.changedSections,
      }, 'Content changed');
    }

    // Upsert Page node
    await this.graph.upsertNode('Page', {
      id: `page::${sourceKey}::${pageId}`,
      name: String(metadata['title'] ?? pageId),
      url,
      source_id: toSourceId(sourceKey),
      last_crawled: new Date().toISOString(),
    });

    await this.graph.upsertEdge(
      'PART_OF',
      `page::${sourceKey}::${pageId}`,
      toSourceId(sourceKey),
    );

    // Extract symbols
    const extraction = extractSymbols(markdown, sourceKey, pageId);

    // Upsert symbol nodes and edges
    for (const symbol of extraction.symbols) {
      await this.graph.upsertNode('Symbol', {
        id: symbol.id,
        name: symbol.name,
        kind: symbol.kind,
        signature: symbol.signature,
        description: symbol.description,
        deprecated: symbol.deprecated,
        deleted: false,
        source_id: toSourceId(sourceKey),
        page_id: `page::${sourceKey}::${pageId}`,
        last_crawled: new Date().toISOString(),
      });

      await this.graph.upsertEdge(
        'DEFINED_IN',
        symbol.id,
        `page::${sourceKey}::${pageId}`,
      );
    }

    // Upsert example nodes
    for (const example of extraction.examples) {
      await this.graph.upsertNode('Example', {
        id: example.id,
        name: example.description,
        language: example.language,
        code: example.code,
        symbol_id: example.symbolId,
      });
    }

    // Upsert relationship edges
    for (const rel of extraction.relationships) {
      await this.graph.upsertEdge(rel.type, rel.from, rel.to);
    }

    // Add to vector store for semantic search
    const vectorText = buildVectorText(markdown, extraction.symbols.length);
    await this.vectorStore.add(
      `page::${sourceKey}::${pageId}`,
      'Page',
      vectorText,
    );

    for (const symbol of extraction.symbols) {
      const symbolText = `${symbol.name} ${symbol.kind}: ${symbol.signature} - ${symbol.description}`;
      await this.vectorStore.add(symbol.id, 'Symbol', symbolText);
    }
  }

  async close(): Promise<void> {
    await this.puppeteer.close();
  }

  // ── Private helpers ──

  private async discoverUrls(
    sourceKey: string,
    sourceConfig: SourceConfig,
  ): Promise<string[]> {
    const urls: string[] = [];

    // Try sitemap first
    if (sourceConfig.sitemap) {
      try {
        const filter = sourceConfig.sitemap_filter
          ? new RegExp(sourceConfig.sitemap_filter)
          : undefined;
        const sitemapUrls = await parseSitemap(sourceConfig.sitemap, filter);
        urls.push(...sitemapUrls);
        logger.info({ sourceKey, count: sitemapUrls.length }, 'URLs from sitemap');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ sourceKey, error: msg }, 'Sitemap parsing failed');
      }
    }

    // Fall back to / supplement with Firecrawl map
    if (urls.length === 0 && this.firecrawlAvailable) {
      try {
        const mapped = await this.firecrawl.mapSite(sourceConfig.base_url);
        urls.push(...mapped);
        logger.info({ sourceKey, count: mapped.length }, 'URLs from Firecrawl map');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ sourceKey, error: msg }, 'Firecrawl map failed');
      }
    }

    // Deduplicate
    return [...new Set(urls)];
  }

  private async scrapeUrl(url: string): Promise<{
    markdown: string;
    metadata: Record<string, unknown>;
  }> {
    // Prefer Firecrawl; fall back to Puppeteer
    if (this.firecrawlAvailable) {
      try {
        return await this.firecrawl.scrape(url);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ url, error: msg }, 'Firecrawl scrape failed, trying Puppeteer');
      }
    }

    if (this.puppeteerAvailable) {
      return await this.puppeteer.scrape(url);
    }

    throw new Error(`No scraping backend available for ${url}`);
  }

  private async processUrl(
    url: string,
    sourceKey: string,
    sourceConfig: SourceConfig,
    stats: CrawlStats,
  ): Promise<void> {
    try {
      await withRetry(
        () => this.crawlUrl(url, sourceKey),
        sourceConfig.retry_attempts ?? this.config.crawl.defaultRetryAttempts,
        sourceConfig.backoff ?? this.config.crawl.defaultBackoff,
        url,
      );
      stats.pagesProcessed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors++;
      logger.error({ url, sourceKey, error: message }, 'Failed to crawl URL');
      await this._eventBus.emit('crawl:error', { sourceKey, url, error: message });
    }
  }

  private async processOpenApiSpec(
    sourceKey: string,
    specUrlOrPath: string,
    stats: CrawlStats,
  ): Promise<void> {
    try {
      const pages = await parseOpenApiSpec(specUrlOrPath);

      for (const page of pages) {
        const pageId = `openapi::${page.method}::${page.path.replace(/\//g, '_')}`;

        await this.graph.upsertNode('Page', {
          id: `page::${sourceKey}::${pageId}`,
          name: `${page.method} ${page.path}`,
          url: specUrlOrPath,
          source_id: toSourceId(sourceKey),
          kind: 'openapi-endpoint',
          last_crawled: new Date().toISOString(),
        });

        await this.graph.upsertEdge(
          'PART_OF',
          `page::${sourceKey}::${pageId}`,
          toSourceId(sourceKey),
        );

        await this.vectorStore.add(
          `page::${sourceKey}::${pageId}`,
          'Page',
          page.markdown,
        );

        stats.pagesProcessed++;
      }

      logger.info({ sourceKey, endpointCount: pages.length }, 'OpenAPI spec processed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      stats.errors++;
      logger.error({ sourceKey, error: message }, 'OpenAPI spec processing failed');
    }
  }
}

/**
 * Build a text suitable for vector embedding from page markdown.
 * Truncates to a reasonable size and adds symbol count context.
 */
function buildVectorText(markdown: string, symbolCount: number): string {
  const maxChars = 8000;
  const truncated = markdown.length > maxChars
    ? markdown.slice(0, maxChars) + '...'
    : markdown;
  return symbolCount > 0
    ? `[${symbolCount} symbols] ${truncated}`
    : truncated;
}
