---
name: Browser Rendering
description: Use when the user asks about Cloudflare Browser Rendering, headless Puppeteer/Playwright at the edge, screenshot/PDF generation, web scraping with JS execution, or DOM-based extraction at the edge.
version: 0.1.0
---

# Browser Rendering API

Cloudflare's managed headless Chromium runtime. Drive it from a Worker with the `@cloudflare/puppeteer` library — no need to ship Chromium yourself or run a Container for routine rendering.

Use it for:
- Screenshots / PDFs of arbitrary URLs (or your own pages, post-render)
- Scraping JS-heavy sites (the page must execute scripts)
- DOM extraction with full CSS/JS evaluation
- Visual regression testing
- Generating social-card images (OG previews)

## Bind

```bash
pnpm add @cloudflare/puppeteer
```

```jsonc
// wrangler.jsonc
{
  "browser": { "binding": "BROWSER" },
  "compatibility_flags": ["nodejs_compat"]
}
```

```typescript
import puppeteer from '@cloudflare/puppeteer';

export interface Env {
  BROWSER: Fetcher;     // BrowserWorker binding
}
```

## Screenshot

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url).searchParams.get('url');
    if (!url) return new Response('missing url', { status: 400 });

    const browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    const screenshot = await page.screenshot({ type: 'png', fullPage: true });
    await browser.close();

    return new Response(screenshot, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    });
  }
};
```

## PDF

```typescript
const pdf = await page.pdf({
  format: 'A4',
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:10px;width:100%;text-align:center">Discovery Co-Pilot</div>',
  footerTemplate: '<div style="font-size:10px;width:100%;text-align:center"><span class="pageNumber"></span> of <span class="totalPages"></span></div>',
});
return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
```

## Scraping (DOM extraction with JS execution)

```typescript
const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
await page.goto('https://example.com/dynamic', { waitUntil: 'networkidle2' });

const data = await page.evaluate(() => {
  const items = document.querySelectorAll('.product-card');
  return [...items].map((el) => ({
    title: el.querySelector('h3')?.textContent?.trim(),
    price: el.querySelector('.price')?.textContent?.trim(),
    href: el.querySelector('a')?.href,
  }));
});

await browser.close();
return Response.json(data);
```

## Reusable browser sessions

Each `puppeteer.launch` allocates a fresh browser, which has cold-start cost. For higher throughput, reuse sessions across requests with `puppeteer.connect`:

```typescript
import puppeteer from '@cloudflare/puppeteer';

let cachedSession: string | null = null;

async function getBrowser(env: Env) {
  if (cachedSession) {
    try {
      return await puppeteer.connect(env.BROWSER, cachedSession);
    } catch {
      cachedSession = null;
    }
  }
  const browser = await puppeteer.launch(env.BROWSER, { keep_alive: 600000 });   // 10 min
  cachedSession = browser.sessionId();
  return browser;
}
```

Note: this only works within a single Worker isolate. For shared sessions across instances, store `sessionId` in KV and rely on the same routing — usually a Durable Object that owns the session.

## Combine with R2 for caching

```typescript
const cacheKey = `screenshots/${await sha256(url)}.png`;
const cached = await env.BUCKET.get(cacheKey);
if (cached) return new Response(cached.body, { headers: { 'Content-Type': 'image/png' } });

// ... render ...

await env.BUCKET.put(cacheKey, screenshot, {
  httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=86400' },
});
```

A simple cache layer keeps Browser Rendering costs down dramatically for repeated URLs.

## Visual regression workflow

```typescript
const newShot = await renderToPng(env, url);
const previous = await env.BUCKET.get(`baselines/${urlHash}.png`);
if (!previous) {
  await env.BUCKET.put(`baselines/${urlHash}.png`, newShot);
  return Response.json({ status: 'baseline-stored' });
}
const diff = await imageDiff(await previous.arrayBuffer(), newShot);
if (diff.differentPixels > 100) {
  await env.SLACK_QUEUE.send({ url, diffPercent: diff.percentage });
}
return Response.json({ diff });
```

(image-diff via a Container if needed — Browser Rendering produces the screenshots.)

## Rendering your own pages for OG cards

```typescript
const html = `<html><body style="font-family: Inter, sans-serif; padding: 64px;">
  <h1>${title}</h1>
  <p>${subtitle}</p>
</body></html>`;

const browser = await puppeteer.launch(env.BROWSER);
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'networkidle0' });
const png = await page.screenshot({ type: 'png' });
await browser.close();

return new Response(png, {
  headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
});
```

Cache aggressively — these are the same per (title, subtitle) combo.

## Rate limiting and quotas

Browser Rendering is metered per minute of browser time. Common patterns to stay cheap:
- Cache rendered output in R2 with a TTL
- Pre-bake static OG cards in CI for known content
- Sample-based on cache miss only — never on every request

## Pitfalls

- **`waitUntil: 'load'` only**: misses async content. Use `'networkidle0'` for typical SPAs.
- **Long-running scrapes inside a single request**: count against Worker wall time (30s for HTTP). For longer scrapes, push the job to a Queue and have a consumer Worker drive Browser Rendering with multiple requests.
- **Shipping Chromium directly**: don't. The point of Browser Rendering is that Cloudflare hosts it.
- **Forgetting `await browser.close()`**: leaks browser sessions, racks up cost.
- **JS errors in `page.evaluate`**: silent. Add try/catch inside, log to console (which Workers logs capture via tail).
- **CORS issues** when scraping from inside `evaluate`: same-origin policy applies. For cross-origin, use `page.goto` and extract.
