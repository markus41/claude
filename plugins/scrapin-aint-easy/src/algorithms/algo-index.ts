/**
 * Algorithm indexer orchestrator. Given source configurations, fetches
 * content (git repos, sitemaps, single pages), extracts algorithm data,
 * and upserts into the graph + vector store.
 */

import { exec } from 'node:child_process';
import { readFile, readdir, rm, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import pino from 'pino';
import { type GraphAdapter } from '../core/graph.js';
import { type VectorStore } from '../core/vector.js';
import { type EventBus } from '../core/event-bus.js';
import { type AlgoSourceConfig } from '../config/loader.js';
import { type AlgoNodeData } from './algo-sources.js';
import { AlgoGraphManager } from './algo-graph.js';
import {
  extractAlgoFromMarkdown,
  extractAlgoFromSourceFile,
} from './pattern-extractor.js';

const execAsync = promisify(exec);
const logger = pino({ name: 'algo-indexer' });

// ── Sitemap parsing helpers ──

interface SitemapEntry {
  loc: string;
}

function parseSitemapXml(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const locRe = /<loc>\s*(.*?)\s*<\/loc>/g;
  let match: RegExpExecArray | null = null;
  while ((match = locRe.exec(xml)) !== null) {
    const loc = match[1];
    if (loc) {
      entries.push({ loc: loc.trim() });
    }
  }
  return entries;
}

// ── File walking ──

async function walkDir(dir: string, patterns: string[]): Promise<string[]> {
  const results: string[] = [];
  const matchers = patterns.map((p) => buildGlobMatcher(p));

  async function recurse(currentDir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      let fileStat;
      try {
        fileStat = await stat(fullPath);
      } catch {
        continue;
      }

      if (fileStat.isDirectory()) {
        // Skip common non-content directories
        if (['node_modules', '.git', '__pycache__', 'venv', '.venv'].includes(entry)) continue;
        await recurse(fullPath);
      } else if (fileStat.isFile()) {
        const relPath = relative(dir, fullPath);
        if (matchers.length === 0 || matchers.some((m) => m(relPath))) {
          results.push(fullPath);
        }
      }
    }
  }

  await recurse(dir);
  return results;
}

/**
 * Minimal glob matcher: supports `*` (any segment chars) and `**` (any
 * depth). Converts glob to regex for matching.
 */
function buildGlobMatcher(pattern: string): (path: string) => boolean {
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  const regex = new RegExp(`^${regexStr}$`);
  return (path: string) => regex.test(path);
}

// ── Language detection ──

function detectLanguage(filePath: string): 'ts' | 'py' | 'md' | null {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.ts':
    case '.tsx':
    case '.js':
    case '.jsx':
      return 'ts';
    case '.py':
      return 'py';
    case '.md':
    case '.mdx':
      return 'md';
    default:
      return null;
  }
}

// ── Indexer class ──

export class AlgoIndexer {
  private readonly manager: AlgoGraphManager;

  constructor(
    graph: GraphAdapter,
    vectors: VectorStore,
    private readonly events: EventBus,
  ) {
    this.manager = new AlgoGraphManager(graph, vectors);
  }

  /**
   * Index a single source. Dispatches to the appropriate strategy based
   * on `source.type`.
   *
   * @returns Number of algos indexed from this source.
   */
  async indexSource(source: AlgoSourceConfig): Promise<number> {
    logger.info({ key: source.key, type: source.type, url: source.url }, 'Indexing source');

    let count: number;
    switch (source.type) {
      case 'github_repo':
        count = await this.indexGithubRepo(source);
        break;
      case 'sitemap_crawl':
        count = await this.indexSitemapCrawl(source);
        break;
      case 'single_page':
        count = await this.indexSinglePage(source);
        break;
      default: {
        const exhaustive: never = source.type;
        logger.warn({ type: exhaustive }, 'Unknown source type, skipping');
        count = 0;
      }
    }

    await this.events.emit('algo:indexed', { sourceKey: source.key, count });
    logger.info({ key: source.key, count }, 'Source indexing complete');
    return count;
  }

  /**
   * Index all configured sources sequentially, then link related algos.
   */
  async indexAllSources(sources: AlgoSourceConfig[]): Promise<void> {
    let total = 0;
    for (const source of sources) {
      try {
        const count = await this.indexSource(source);
        total += count;
      } catch (err) {
        logger.error({ key: source.key, err }, 'Failed to index source');
      }
    }

    // After all sources are indexed, compute relationship edges
    if (total > 0) {
      const edgeCount = await this.manager.linkRelatedAlgos();
      logger.info({ totalAlgos: total, edgeCount }, 'All sources indexed and linked');
    }
  }

  // ── Strategy: GitHub repo ──

  /**
   * Shallow-clone a GitHub repository into a temp directory, iterate
   * files matching the configured path patterns, extract algos from
   * each file, then clean up.
   */
  private async indexGithubRepo(source: AlgoSourceConfig): Promise<number> {
    const cloneDir = join(tmpdir(), `scrapin-algo-${randomUUID()}`);
    let count = 0;

    try {
      // Shallow clone (depth 1) to minimize bandwidth
      const cloneUrl = normalizeGitUrl(source.url);
      logger.debug({ cloneUrl, cloneDir }, 'Shallow cloning repo');
      await execAsync(`git clone --depth 1 "${cloneUrl}" "${cloneDir}"`, {
        timeout: 120_000,
      });

      // Walk the repo for matching files
      const paths = source.paths ?? ['**/*.ts', '**/*.py', '**/*.md'];
      const files = await walkDir(cloneDir, paths);
      logger.debug({ fileCount: files.length }, 'Found matching files');

      for (const filePath of files) {
        try {
          count += await this.indexFile(filePath, source);
        } catch (err) {
          logger.warn({ filePath, err }, 'Failed to index file');
        }
      }
    } finally {
      // Clean up temp clone
      try {
        await rm(cloneDir, { recursive: true, force: true });
      } catch {
        logger.warn({ cloneDir }, 'Failed to clean up clone dir');
      }
    }

    return count;
  }

  // ── Strategy: sitemap crawl ──

  /**
   * Fetch the sitemap URL, parse <loc> entries, fetch each page as
   * text/markdown, and extract algo info.
   */
  private async indexSitemapCrawl(source: AlgoSourceConfig): Promise<number> {
    let count = 0;
    const sitemapUrl = source.url.endsWith('/sitemap.xml')
      ? source.url
      : `${source.url.replace(/\/$/, '')}/sitemap.xml`;

    logger.debug({ sitemapUrl }, 'Fetching sitemap');

    let sitemapXml: string;
    try {
      const response = await fetch(sitemapUrl);
      if (!response.ok) {
        logger.warn({ status: response.status, sitemapUrl }, 'Sitemap fetch failed');
        return 0;
      }
      sitemapXml = await response.text();
    } catch (err) {
      logger.error({ sitemapUrl, err }, 'Failed to fetch sitemap');
      return 0;
    }

    const entries = parseSitemapXml(sitemapXml);
    logger.info({ entryCount: entries.length }, 'Parsed sitemap entries');

    // Crawl each page (sequentially to respect rate limits)
    for (const entry of entries) {
      try {
        const pageCount = await this.fetchAndIndexPage(entry.loc, source);
        count += pageCount;
      } catch (err) {
        logger.warn({ url: entry.loc, err }, 'Failed to index sitemap page');
      }
    }

    return count;
  }

  // ── Strategy: single page ──

  /**
   * Fetch a single page and extract algo information from its content.
   */
  private async indexSinglePage(source: AlgoSourceConfig): Promise<number> {
    return this.fetchAndIndexPage(source.url, source);
  }

  // ── Shared helpers ──

  private async fetchAndIndexPage(url: string, source: AlgoSourceConfig): Promise<number> {
    logger.debug({ url }, 'Fetching page');

    let body: string;
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html, text/markdown, text/plain' },
      });
      if (!response.ok) {
        logger.warn({ url, status: response.status }, 'Page fetch failed');
        return 0;
      }
      body = await response.text();
    } catch (err) {
      logger.error({ url, err }, 'Failed to fetch page');
      return 0;
    }

    // Treat page content as markdown for extraction
    const algos = extractAlgoFromMarkdown(body, url);
    let count = 0;

    for (const algo of algos) {
      // Prefix the id with source key for uniqueness
      const prefixedAlgo: AlgoNodeData = {
        ...algo,
        id: `algo:${source.key}:${algo.id.replace(/^algo:\w+:/, '')}`,
      };
      await this.manager.upsertAlgo(prefixedAlgo);
      count++;
    }

    return count;
  }

  private async indexFile(filePath: string, source: AlgoSourceConfig): Promise<number> {
    const lang = detectLanguage(filePath);
    if (!lang) return 0;

    const content = await readFile(filePath, 'utf-8');
    if (!content.trim()) return 0;

    let algos: AlgoNodeData[];
    if (lang === 'md') {
      algos = extractAlgoFromMarkdown(content, source.url);
    } else {
      algos = extractAlgoFromSourceFile(content, lang, source.url);
    }

    let count = 0;
    for (const algo of algos) {
      const prefixedAlgo: AlgoNodeData = {
        ...algo,
        id: `algo:${source.key}:${algo.id.replace(/^algo:\w+:/, '')}`,
      };
      await this.manager.upsertAlgo(prefixedAlgo);
      count++;
    }

    return count;
  }
}

// ── URL normalization ──

function normalizeGitUrl(url: string): string {
  // Ensure https:// prefix and .git suffix for clone
  let normalized = url.trim();
  if (normalized.startsWith('git@')) {
    // Convert SSH to HTTPS: git@github.com:user/repo.git -> https://github.com/user/repo.git
    normalized = normalized
      .replace('git@', 'https://')
      .replace(':', '/');
  }
  if (!normalized.endsWith('.git')) {
    normalized += '.git';
  }
  return normalized;
}
