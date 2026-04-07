import pino from 'pino';

const logger = pino({ name: 'firecrawl-adapter' });

interface FirecrawlScrapeResult {
  markdown: string;
  metadata: Record<string, unknown>;
}

interface FirecrawlClient {
  scrapeUrl: (url: string, opts: Record<string, unknown>) => Promise<{
    success: boolean;
    markdown?: string;
    metadata?: Record<string, unknown>;
    error?: string;
  }>;
  mapUrl: (url: string, opts?: Record<string, unknown>) => Promise<{
    success: boolean;
    links?: string[];
    error?: string;
  }>;
}

function getApiKey(): string {
  const key = process.env['FIRECRAWL_API_KEY'];
  if (!key) {
    throw new Error(
      'FIRECRAWL_API_KEY environment variable is required for FirecrawlAdapter',
    );
  }
  return key;
}

async function createClient(): Promise<FirecrawlClient> {
  const mod = await import('@mendable/firecrawl-js');
  const FirecrawlApp = mod.default ?? mod;
  const apiKey = getApiKey();
  return new FirecrawlApp({ apiKey }) as unknown as FirecrawlClient;
}

export class FirecrawlAdapter {
  private client: FirecrawlClient | null = null;

  async initialize(): Promise<void> {
    if (this.client) return;
    this.client = await createClient();
    logger.info('FirecrawlAdapter initialized');
  }

  private ensureClient(): FirecrawlClient {
    if (!this.client) {
      throw new Error('FirecrawlAdapter not initialized — call initialize() first');
    }
    return this.client;
  }

  async scrape(url: string): Promise<FirecrawlScrapeResult> {
    const client = this.ensureClient();
    logger.debug({ url }, 'Scraping URL');

    const response = await client.scrapeUrl(url, {
      formats: ['markdown'],
    });

    if (!response.success) {
      const message = response.error ?? 'Unknown scrape error';
      logger.error({ url, error: message }, 'Scrape failed');
      throw new Error(`Firecrawl scrape failed for ${url}: ${message}`);
    }

    const markdown = response.markdown ?? '';
    const metadata = (response.metadata ?? {}) as Record<string, unknown>;

    logger.info({ url, markdownLength: markdown.length }, 'Scrape complete');
    return { markdown, metadata };
  }

  async mapSite(url: string): Promise<string[]> {
    const client = this.ensureClient();
    logger.debug({ url }, 'Mapping site');

    const response = await client.mapUrl(url);

    if (!response.success) {
      const message = response.error ?? 'Unknown map error';
      logger.error({ url, error: message }, 'Map failed');
      throw new Error(`Firecrawl map failed for ${url}: ${message}`);
    }

    const links = response.links ?? [];
    logger.info({ url, linkCount: links.length }, 'Map complete');
    return links;
  }
}
