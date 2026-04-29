---
name: Workers AI
description: Use when the user asks about env.AI.run, Cloudflare Workers AI models, edge LLM inference, Whisper STT, embeddings, or AI Gateway routing.
version: 0.1.0
---

# Workers AI

Run LLMs, STT, embeddings, image, classification — all on Cloudflare's GPU edge network — via a single binding.

## Bind

```jsonc
"ai": { "binding": "AI" }
```

```typescript
export interface Env { AI: Ai }
```

## Common models

| Task | Model |
|------|-------|
| Text generation | `@cf/meta/llama-3.1-70b-instruct`, `@cf/meta/llama-3.1-8b-instruct` |
| Embeddings | `@cf/baai/bge-large-en-v1.5` (1024d), `@cf/baai/bge-base-en-v1.5` (768d) |
| Reranking | `@cf/baai/bge-reranker-base` |
| Speech-to-text | `@cf/openai/whisper-large-v3-turbo`, `@cf/openai/whisper` |
| Image generation | `@cf/black-forest-labs/flux-1-schnell` |
| Vision (image → text) | `@cf/llava-hf/llava-1.5-7b-hf`, `@cf/meta/llama-3.2-11b-vision-instruct` |
| Classification | `@cf/huggingface/distilbert-sst-2-int8` |
| Translation | `@cf/meta/m2m100-1.2b` |

Run `wrangler ai models` for the full live catalog.

## Text generation

```typescript
const out = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
  messages: [
    { role: 'system', content: 'You are a concise assistant.' },
    { role: 'user', content: 'Summarize Cloudflare Workers in one sentence.' }
  ],
  max_tokens: 256,
  temperature: 0.3
});
// out.response: string
```

## Streaming

```typescript
const stream = await env.AI.run(
  '@cf/meta/llama-3.1-70b-instruct',
  { messages, stream: true }
) as ReadableStream;

return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
});
```

## Embeddings

```typescript
const { data } = await env.AI.run('@cf/baai/bge-large-en-v1.5', {
  text: ['document one', 'document two']
});
// data: number[][]  — already L2-normalized
```

Pass an array for batch embedding (faster than per-call).

## Whisper STT

```typescript
// Audio is a Uint8Array of WAV/MP3/FLAC/OGG bytes
const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
  audio: [...new Uint8Array(audioBuffer)]
});
// result: { text, words?: [{ word, start, end }], language? }
```

For long audio: chunk client-side or stream via the Realtime API. Workers AI has a per-call payload limit; for files > a few minutes, split.

## Vision

```typescript
const out = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    }
  ]
});
```

## AI Gateway

Sit Workers AI calls behind AI Gateway for caching, retries, rate limiting, and provider-agnostic routing. Configure in dashboard, then:

```typescript
const out = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', { messages }, {
  gateway: {
    id: 'lobbi-prod',
    skipCache: false,
    cacheTtl: 60,
    metadata: { userId: 'u-42' }
  }
});
```

For non-Cloudflare providers via the same gateway:
```typescript
const res = await fetch(
  'https://gateway.ai.cloudflare.com/v1/<account>/lobbi-prod/openai/chat/completions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'gpt-4o', messages })
  }
);
```
The gateway handles caching, fallback to a secondary provider, observability — without changing your code per provider.

## Cost / latency knobs

- **Smaller models** (8B vs 70B) for simple tasks — 10× cheaper, often acceptable.
- **`temperature: 0`** for deterministic outputs and best cache hit rate.
- **`stream: true`** for perceived latency.
- **Batch embeddings** — one call per N docs is much cheaper than N calls.

## Pitfalls

- **Calling `AI.run` outside a Worker context** (e.g. from a build script): no binding, fails. Workers AI is runtime-only.
- **Audio array as `Uint8Array` directly** — must spread to a regular array (`[...uint8]`).
- **Forgetting AI Gateway**: every retry is paid; every cache miss is paid. Always route prod through a gateway.
- **Regional bias**: `env.AI` runs near the request. For deterministic latency tests, route via AI Gateway.
