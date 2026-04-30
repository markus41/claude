---
name: Containers on Workers
description: Use when the user asks about Cloudflare Containers, running container workloads at the edge, the Container class, sidecar binaries that need a full Linux runtime (ffmpeg, headless browsers, ML models too big for Workers AI), or workloads that exceed Worker isolate limits.
version: 0.1.0
---

# Containers on Workers

Cloudflare Containers (GA in 2024–2025) lets you run Docker containers triggered by Workers, controlled from a Worker, and routed via Workers infrastructure. Use it when you need:

- A real Linux process / filesystem (not a V8 isolate)
- CPU > 30s or memory > 128MB per request
- A binary that won't fit in a Worker (ffmpeg, headless Chromium, custom ML frameworks)
- Native dependencies that don't compile to Wasm

It's the right answer for the slice of your stack that doesn't fit Workers — without giving up Workers' routing, auth, and binding model.

## Architecture

```
[Request] → Worker → env.MY_CONTAINER (binding)
                        ↓
                   spawns / routes to a container instance
                        ↓
                   container handles the heavy work, returns
                        ↓
                   Worker returns result
```

Each container is identified the same way DOs are: `idFromName(...)` returns a stable id, `get(id)` returns a stub. Lifecycle is managed by the platform — containers idle out and warm up on demand.

## Wrangler config

```jsonc
{
  "name": "synthesis-render-worker",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-15",
  "containers": [
    {
      "class_name": "PdfRenderer",
      "image": "./Dockerfile",
      "max_instances": 50,
      "instance_type": "standard"      // or "basic", "premium" depending on resource needs
    }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "PDF", "class_name": "PdfRenderer" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["PdfRenderer"] }
  ]
}
```

(Containers piggyback on the DO migration system to register the class; the actual runtime is the container, not a JS isolate.)

## Container class

```typescript
import { Container } from '@cloudflare/containers';

export class PdfRenderer extends Container {
  // The port the container listens on
  defaultPort = 8080;

  // How long to keep the container warm after the last request
  sleepAfter = '60 seconds';

  // Hooks
  override onStart() {
    console.log('PDF renderer container started');
  }

  override onStop() {
    console.log('PDF renderer container stopped');
  }
}
```

## Dockerfile (example: HTML-to-PDF render)

```dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

The container exposes a regular HTTP server. Workers proxy to it.

## Inside the container (HTTP server)

```typescript
// container/server.ts
import express from 'express';
import { chromium } from 'playwright';

const app = express();
app.use(express.json({ limit: '20mb' }));

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
async function getBrowser() {
  if (!browser) browser = await chromium.launch({ args: ['--no-sandbox'] });
  return browser;
}

app.post('/render', async (req, res) => {
  const { html } = req.body as { html: string };
  const ctx = await (await getBrowser()).newContext();
  const page = await ctx.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4' });
  await ctx.close();
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

app.listen(Number(process.env.PORT ?? 8080));
```

## Calling a container from a Worker

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const { html, tenantId } = await req.json<{ html: string; tenantId: string }>();

    // Shard by tenant for warm-instance reuse
    const id = env.PDF.idFromName(`pdf:${tenantId}`);
    const stub = env.PDF.get(id);

    return await stub.fetch(new Request('http://container/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    }));
  }
};
```

## When containers beat Workers AI

| Need | Container | Workers AI |
|------|-----------|-----------|
| Custom model not in WAI catalog | ✓ | ✗ |
| Specific framework version | ✓ | ✗ |
| Stable warm-cache between requests | ✓ (per shard) | partial (no per-tenant) |
| GPU access | partial (`premium` instance types) | ✓ for catalog models |
| Cost on light load | higher | lower (per-call) |
| Cold start | seconds | ~tens of ms |

For the Discovery Co-Pilot stack: Whisper / embeddings via WAI; PDF rendering, video transcoding, custom ASR fine-tunes via Container.

## Sharding strategies

- `idFromName('global')` — single warm instance, queue-style routing. Good for light load.
- `idFromName('tenant:' + tenantId)` — warm per tenant. Good when work is bursty per tenant.
- `idFromName('shard:' + (Math.floor(Math.random() * N)))` — N warm instances spread across requests.

## Auto-scaling with `max_instances`

`max_instances` caps concurrent containers. Above the cap, `stub.fetch` returns 503 (or queues, depending on instance class). Pair with a Queue producer to absorb bursts:

```typescript
// On overflow, drop into queue
const stub = env.PDF.get(id);
try {
  return await stub.fetch(req);
} catch (e) {
  if (e.message.includes('overloaded')) {
    await env.PDF_QUEUE.send({ html, tenantId });
    return new Response('queued', { status: 202 });
  }
  throw e;
}
```

A queue consumer Worker can then re-attempt by enqueuing onto a fresher container shard.

## Pitfalls

- **Storing state in the container filesystem**: ephemeral. Use R2 for persistence and treat the container as stateless.
- **Long-running connections** (websockets) inside the container: complicated by the warm/sleep cycle. Prefer DO + Worker for those.
- **Massive cold starts**: if your image is 2GB, first hit is slow. Trim images aggressively, multi-stage Dockerfile, prune dev deps.
- **Routing all tenants to one shard**: bottleneck. Always shard.
- **Not setting `sleepAfter`**: idles too quickly = cold start every few minutes. Tune to traffic shape.
- **Container egress costs**: same as Worker egress. Same network model.
- **Ignoring the local dev story**: Wrangler 4 supports container dev locally via Docker. Run `wrangler dev` and the container builds/starts on first request.
