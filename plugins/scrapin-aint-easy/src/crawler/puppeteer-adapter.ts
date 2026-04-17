import pino from 'pino';

const logger = pino({ name: 'puppeteer-adapter' });

interface ScrapeResult {
  markdown: string;
  metadata: Record<string, unknown>;
}

interface PuppeteerBrowser {
  newPage: () => Promise<PuppeteerPage>;
  close: () => Promise<void>;
}

interface PuppeteerPage {
  goto: (url: string, opts: Record<string, unknown>) => Promise<unknown>;
  title: () => Promise<string>;
  url: () => string;
  evaluate: (fn: string | ((...args: never[]) => unknown)) => Promise<unknown>;
  close: () => Promise<void>;
}

interface PuppeteerModule {
  launch: (opts: Record<string, unknown>) => Promise<PuppeteerBrowser>;
}

async function loadPuppeteer(): Promise<PuppeteerModule> {
  const mod = await import('puppeteer');
  return (mod.default ?? mod) as PuppeteerModule;
}

function htmlToMarkdownLike(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class PuppeteerAdapter {
  private browser: PuppeteerBrowser | null = null;
  private puppeteer: PuppeteerModule | null = null;
  // Pre-warmed page pool — cuts ~50-150ms page-creation overhead per
  // scrape on large crawls. Default size is intentionally small; bump via
  // SCRAPIN_PUPPETEER_POOL if you crawl at high concurrency.
  private readonly maxPoolSize: number = (() => {
    const env = process.env['SCRAPIN_PUPPETEER_POOL'];
    const n = env ? Number(env) : 3;
    return Number.isInteger(n) && n >= 1 && n <= 16 ? n : 3;
  })();
  private readonly idlePages: PuppeteerPage[] = [];
  private readonly pageWaiters: Array<(p: PuppeteerPage) => void> = [];
  private liveCount = 0;

  async initialize(): Promise<void> {
    if (this.puppeteer) return;
    this.puppeteer = await loadPuppeteer();
    logger.info({ poolSize: this.maxPoolSize }, 'PuppeteerAdapter initialized');
  }

  private async acquirePage(): Promise<PuppeteerPage> {
    const idle = this.idlePages.pop();
    if (idle) return idle;
    if (this.liveCount < this.maxPoolSize) {
      const browser = await this.ensureBrowser();
      const page = await browser.newPage();
      this.liveCount += 1;
      return page;
    }
    return new Promise<PuppeteerPage>((resolve) => {
      this.pageWaiters.push(resolve);
    });
  }

  private releasePage(page: PuppeteerPage, errored: boolean): void {
    if (errored) {
      // Don't return a potentially-bad page to the pool — close it and let
      // the next acquire spin up a fresh one.
      this.liveCount = Math.max(0, this.liveCount - 1);
      page.close().catch((err) => logger.warn({ err }, 'Failed to close errored page'));
      return;
    }
    const waiter = this.pageWaiters.shift();
    if (waiter) {
      waiter(page);
      return;
    }
    this.idlePages.push(page);
  }

  private async ensureBrowser(): Promise<PuppeteerBrowser> {
    if (!this.puppeteer) {
      throw new Error('PuppeteerAdapter not initialized — call initialize() first');
    }
    if (!this.browser) {
      // SECURITY: Chromium's sandbox contains renderer compromises. Default to
      // sandbox ON; only disable when the operator explicitly opts in via env
      // (e.g. running as root in a container where user-namespace sandboxing
      // is unavailable). Document this in deployment guides.
      const disableSandbox = process.env['SCRAPIN_PUPPETEER_NO_SANDBOX'] === '1';
      const launchArgs: string[] = disableSandbox
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : [];
      if (disableSandbox) {
        logger.warn('Launching Puppeteer with --no-sandbox per SCRAPIN_PUPPETEER_NO_SANDBOX=1');
      }
      this.browser = await this.puppeteer.launch({
        headless: true,
        args: launchArgs,
      });
      logger.debug('Browser launched');
    }
    return this.browser;
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const page = await this.acquirePage();
    let errored = false;
    try {
      logger.debug({ url }, 'Navigating');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });

      const pageTitle = await page.title();
      const pageUrl = page.url();

      const bodyText = await page.evaluate(`
        (function() {
          var selectors = ['article','main','[role="main"]','.documentation','.content','.markdown-body'];
          for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el) return el.innerText;
          }
          return document.body.innerText;
        })()
      `) as string;

      const markdown = convertToMarkdown(pageTitle, bodyText);

      const metadata: Record<string, unknown> = {
        title: pageTitle,
        url: pageUrl,
        sourceUrl: url,
        engine: 'puppeteer',
      };

      logger.info({ url, markdownLength: markdown.length }, 'Puppeteer scrape complete');
      return { markdown, metadata };
    } catch (err) {
      errored = true;
      throw err;
    } finally {
      this.releasePage(page, errored);
    }
  }

  async mapSite(url: string): Promise<string[]> {
    const page = await this.acquirePage();
    let errored = false;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });

      const links = await page.evaluate(`
        (function() {
          var anchors = Array.from(document.querySelectorAll('a[href]'));
          return anchors
            .map(function(a) { return a.href; })
            .filter(function(href) { return href.startsWith('http'); });
        })()
      `) as string[];

      const baseOrigin = new URL(url).origin;
      const sameOrigin = [...new Set(links.filter((l) => l.startsWith(baseOrigin)))];

      logger.info({ url, linkCount: sameOrigin.length }, 'Puppeteer map complete');
      return sameOrigin;
    } catch (err) {
      errored = true;
      throw err;
    } finally {
      this.releasePage(page, errored);
    }
  }

  async close(): Promise<void> {
    // Close all idle pages first so we don't leave dangling handles when the
    // browser shuts down.
    await Promise.allSettled(this.idlePages.map((p) => p.close()));
    this.idlePages.length = 0;
    this.liveCount = 0;
    this.pageWaiters.length = 0;
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.debug('Browser closed');
    }
  }
}

function convertToMarkdown(title: string, bodyText: string): string {
  const cleaned = htmlToMarkdownLike(bodyText);
  const lines = cleaned.split('\n');
  const markdownLines: string[] = [`# ${title}`, ''];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      markdownLines.push('');
      continue;
    }
    markdownLines.push(trimmed);
  }

  return markdownLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
