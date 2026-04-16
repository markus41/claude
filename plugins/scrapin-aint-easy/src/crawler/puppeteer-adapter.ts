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

  async initialize(): Promise<void> {
    if (this.puppeteer) return;
    this.puppeteer = await loadPuppeteer();
    logger.info('PuppeteerAdapter initialized');
  }

  private async ensureBrowser(): Promise<PuppeteerBrowser> {
    if (!this.puppeteer) {
      throw new Error('PuppeteerAdapter not initialized — call initialize() first');
    }
    if (!this.browser) {
      this.browser = await this.puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      logger.debug('Browser launched');
    }
    return this.browser;
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

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
    } finally {
      await page.close();
    }
  }

  async mapSite(url: string): Promise<string[]> {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

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
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
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
