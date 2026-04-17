import pino from 'pino';
import { isSafeFetchUrl } from '../core/url-guard.js';

const logger = pino({ name: 'sitemap-parser' });

/**
 * Extract all text content of a given tag from raw XML.
 * Avoids pulling in an XML parser dependency for simple sitemap structures.
 */
function extractTagValues(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'gi');
  let match = regex.exec(xml);
  while (match) {
    const value = match[1]?.trim();
    if (value) {
      results.push(value);
    }
    match = regex.exec(xml);
  }
  return results;
}

function isSitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex') || xml.includes('<sitemap>');
}

function extractSitemapUrls(xml: string): string[] {
  return extractTagValues(xml, 'loc');
}

async function fetchText(url: string): Promise<string> {
  // SECURITY: A sitemap hosted on a public domain can embed `<loc>` entries
  // pointing at internal networks, loopback, or cloud IMDS. Reject them
  // before the HTTP request so we cannot be steered into SSRF.
  if (!isSafeFetchUrl(url, true)) {
    throw new Error(`Refusing to fetch non-public URL: ${url}`);
  }
  const fetchMod = await import('node-fetch');
  const fetchFn = fetchMod.default;
  const response = await fetchFn(url, {
    headers: {
      'User-Agent': 'scrapin-aint-easy/1.0 sitemap-parser',
      'Accept': 'application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

/**
 * Parse a sitemap XML (or sitemap index) to extract page URLs.
 * Recursively follows sitemap index files that list child sitemaps.
 *
 * @param url       - URL of the sitemap XML
 * @param filter    - Optional regex to keep only matching URLs
 * @param maxDepth  - Maximum recursion depth for sitemap indexes (default 3)
 */
export async function parseSitemap(
  url: string,
  filter?: RegExp,
  maxDepth = 3,
): Promise<string[]> {
  if (maxDepth < 0) {
    logger.warn({ url }, 'Max sitemap recursion depth reached');
    return [];
  }

  logger.debug({ url }, 'Fetching sitemap');
  const xml = await fetchText(url);

  if (isSitemapIndex(xml)) {
    return parseSitemapIndex(xml, filter, maxDepth);
  }

  return parseSitemapUrlset(xml, filter);
}

async function parseSitemapIndex(
  xml: string,
  filter: RegExp | undefined,
  maxDepth: number,
): Promise<string[]> {
  const childSitemapUrls = extractSitemapUrls(xml);
  logger.info({ childCount: childSitemapUrls.length }, 'Sitemap index found');

  const allUrls: string[] = [];

  for (const childUrl of childSitemapUrls) {
    try {
      const childXml = await fetchText(childUrl);
      const urls = parseSitemapUrlset(childXml, filter);
      allUrls.push(...urls);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ childUrl, error: message }, 'Failed to fetch child sitemap');
    }
  }

  // Child sitemaps may themselves be indexes (rare but valid)
  // We already extracted loc values; if they look like sitemap indexes, recurse
  // This is handled by the initial childXml check — but the simple parser
  // above only calls parseSitemapUrlset. For deeper nesting:
  const nestedIndexUrls = childSitemapUrls.filter((u) =>
    u.endsWith('sitemap.xml') || u.includes('sitemap-index'),
  );

  for (const nestedUrl of nestedIndexUrls) {
    try {
      const nestedUrls = await parseSitemap(nestedUrl, filter, maxDepth - 1);
      allUrls.push(...nestedUrls);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ nestedUrl, error: message }, 'Failed nested sitemap');
    }
  }

  return [...new Set(allUrls)];
}

function parseSitemapUrlset(xml: string, filter: RegExp | undefined): string[] {
  const urls = extractTagValues(xml, 'loc');

  const filtered = filter ? urls.filter((u) => filter.test(u)) : urls;

  logger.debug({ total: urls.length, afterFilter: filtered.length }, 'Parsed urlset');
  return filtered;
}
