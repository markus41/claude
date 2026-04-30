---
name: AI Gateway Advanced
description: Use when the user asks about AI Gateway routing rules, BYO provider keys, evaluations, guardrails, fallback policies, dynamic routing, custom cache keys, real-time logs, or prompt management.
version: 0.1.0
---

# AI Gateway: Beyond `env.AI.run`

AI Gateway is a managed reverse proxy in front of any LLM provider. Beyond caching and observability, it provides:

- **Universal endpoint** — one URL, dispatches to any provider
- **Per-route rate limits**
- **Caching with custom keys** (per-tenant, per-feature)
- **Fallback chains** (primary down → secondary)
- **Evaluations** — auto-judge responses
- **Guardrails** — block / sanitize prompts and responses
- **Real-time logs** with replay
- **Custom metadata** for analytics

## Universal endpoint

Every provider through one URL. URL structure:
```
https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/<provider>/<path>
```

Examples:
```
https://gateway.ai.cloudflare.com/v1/abc/lobbi-prod/openai/chat/completions
https://gateway.ai.cloudflare.com/v1/abc/lobbi-prod/anthropic/v1/messages
https://gateway.ai.cloudflare.com/v1/abc/lobbi-prod/workers-ai/@cf/meta/llama-3.1-70b-instruct
https://gateway.ai.cloudflare.com/v1/abc/lobbi-prod/google-ai-studio/v1beta/models/gemini-2.5-flash:generateContent
```

You pass the provider's API key in `Authorization` (the gateway forwards it). For Workers AI, no key needed — the binding does that.

## Through the binding (recommended for WAI)

```typescript
const out = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', { messages }, {
  gateway: {
    id: 'lobbi-prod',
    skipCache: false,
    cacheTtl: 60,
    cacheKey: `tenant:${tenantId}:meeting:${meetingId}`,
    metadata: {
      tenantId,
      userId,
      feature: 'meeting-synthesis',
    },
  },
});
```

`cacheKey` lets you scope caches by tenant — preventing cross-tenant cache hits for prompts that differ only by user.

## Through fetch (any provider)

```typescript
const url = `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.GATEWAY_ID}/anthropic/v1/messages`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    'x-api-key': env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
    'cf-aig-cache-ttl': '60',
    'cf-aig-cache-key': `tenant:${tenantId}:summary:${docId}`,
    'cf-aig-metadata': JSON.stringify({ tenantId, feature: 'summary' }),
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages,
  }),
});
```

`cf-aig-*` headers control gateway behavior per request.

## Fallback / dynamic routing

Configure in the dashboard, or send a `cf-aig-fallback` header naming the alternate model. With **Universal Routing**, you can declare a route:

```
Route: synthesis-route
  Primary:  anthropic/claude-sonnet-4-6
  Secondary: workers-ai/@cf/meta/llama-3.1-70b-instruct
  Trigger: status >= 500 OR latency > 30s
```

Then in code:
```typescript
const res = await fetch(`https://gateway.ai.cloudflare.com/v1/${acct}/${gw}/route/synthesis-route`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, max_tokens: 1024 }),
});
```

The gateway picks the provider, normalizes the response shape if you opt in, and falls over on the trigger.

## BYO provider keys

Store provider keys in the gateway dashboard once (encrypted). Then your Worker calls the gateway without sending keys per-request. Reduces secret sprawl and centralizes rotation.

## Custom cache keys

Default cache key is a hash of the full request. Override when:
- Same prompt, different tenant should not hit shared cache
- You want a single cache hit for slightly differing prompts (canonicalize first)

Stamp `cf-aig-cache-key` per request:
```
cf-aig-cache-key: tenant:acme:doc:42
```

To **bypass cache** for a single request:
```
cf-aig-skip-cache: true
```

## Caching strategy

| Workload | TTL | Key |
|----------|-----|-----|
| Public OG card generator | 7d | URL hash |
| Tenant-private classification | 1h | `tenant:X:input-hash` |
| Real-time chat (no caching) | bypass | n/a |
| Background re-embedding | 24h | content hash |
| LLM-as-judge evaluation | 1d | candidate-output hash |

## Guardrails

The dashboard supports guardrails that screen prompts and responses for:
- PII (with custom regex / classifier)
- Profanity / abuse
- Custom topic blocklists
- Output length / format

Configure once per gateway. Worker code unchanged. Violations return a structured error you can branch on:

```typescript
if (res.status === 422) {
  const err = await res.json();
  if (err.guardrail) {
    // Log + show user-friendly error
    return { error: 'request blocked by policy' };
  }
}
```

## Evaluations (Evals)

Configure an eval (e.g. "is this output factually grounded?") with a judge LLM. The gateway samples N% of responses, runs the eval, and surfaces results in the dashboard. Use to detect drift across model versions or prompt changes.

## Real-time logs

Every request logged with: prompt, response, tokens, cost, cache hit/miss, latency, metadata. Filter by `metadata.tenantId` for per-tenant audits. Export via Logpush to R2 for retention beyond the dashboard window.

## Prompt management

Centralized prompts with versions; reference by id. The Worker sends a prompt id + variables; the gateway renders the prompt before forwarding:

```
cf-aig-prompt-id: meeting-synthesis-v3
cf-aig-prompt-vars: {"meetingId": "...", "tone": "concise"}
```

Decouples prompt iteration from code deploys.

## Rate limiting

Per-route or per-metadata rate limits. Example: `metadata.tenantId == acme` capped at 60 req/min. Returned `429` is delivered to the Worker; gracefully degrade (return cached, queue, fallback).

## Replay

In the dashboard, click any logged request → "Replay". Useful for debugging prompt changes against a real historical request without involving production traffic.

## End-to-end example

```typescript
async function synthesizeMeeting(env: Env, tenantId: string, meetingId: string, transcript: string) {
  const url = `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCT}/lobbi-prod/route/synthesis-route`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'cf-aig-cache-ttl': '3600',
      'cf-aig-cache-key': `tenant:${tenantId}:meeting:${meetingId}:v3`,
      'cf-aig-metadata': JSON.stringify({ tenantId, meetingId, feature: 'synthesis', version: 'v3' }),
      'cf-aig-prompt-id': 'meeting-synthesis-v3',
      'cf-aig-prompt-vars': JSON.stringify({ meetingId }),
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: '__USE_PROMPT__' },        // ignored when prompt-id present
        { role: 'user', content: transcript },
      ],
      max_tokens: 2048,
    }),
  });

  if (res.status === 429) throw new RateLimitError();
  if (res.status === 422) throw new GuardrailError(await res.json());
  if (!res.ok) throw new Error(`gateway ${res.status}`);

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? data.content?.[0]?.text;   // shape depends on provider; route normalization can unify
}
```

## Pitfalls

- **Caching prompts with PII keyed only by hash**: cache hits could leak across users. Always include user/tenant in `cache-key`.
- **Forgetting `cf-aig-metadata`**: dashboard becomes useless for filtering.
- **Bypass cache for everything**: throws away the gateway's main cost benefit. Always cache idempotent classifiers, embeddings, etc.
- **Hard-coding model names** instead of using a route: when you swap providers, every Worker needs a deploy. Routes let you swap centrally.
- **Storing the BYO provider key in `vars`**: still public. Use the gateway's stored keys.
- **Treating 422 like 500**: 422 is policy/guardrail block. Handle distinctly.
