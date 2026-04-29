---
name: cf-binding
intent: Add a binding (D1, KV, R2, Vectorize, Hyperdrive, AI, queue) end-to-end with config + types + usage
tags:
  - cloudflare-workers-stack
  - command
  - bindings
inputs: []
risk: medium
cost: low
description: Add a binding (D1, KV, R2, Vectorize, Hyperdrive, AI, queue) end-to-end with config + types + usage
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Add a Binding

A "binding" is how a Worker accesses Cloudflare resources. Each binding type has slightly different config + runtime surface.

## D1 (SQLite)

```bash
wrangler d1 create lobbi-roi-models
# → returns database_id; paste it into wrangler.jsonc
```

```jsonc
"d1_databases": [
  { "binding": "DB", "database_name": "lobbi-roi-models", "database_id": "abc123..." }
]
```

```typescript
export interface Env { DB: D1Database }
const { results } = await env.DB.prepare('SELECT * FROM models WHERE id = ?').bind(id).all();
```

Migrations live in `migrations/<NNNN>_name.sql`:
```bash
wrangler d1 migrations create DB add_users_table
wrangler d1 migrations apply DB --local
wrangler d1 migrations apply DB --remote --env production
```

## KV (key-value)

```bash
wrangler kv namespace create lobbi-oauth-sessions
```

```jsonc
"kv_namespaces": [
  { "binding": "SESSIONS", "id": "abc..." }
]
```

```typescript
await env.SESSIONS.put('user:42', JSON.stringify(data), { expirationTtl: 3600 });
const raw = await env.SESSIONS.get('user:42');
```

## R2 (objects)

```bash
wrangler r2 bucket create lobbi-deliverables
```

```jsonc
"r2_buckets": [
  { "binding": "DELIVERABLES", "bucket_name": "lobbi-deliverables" }
]
```

```typescript
await env.DELIVERABLES.put('reports/2026-04.pdf', body, {
  httpMetadata: { contentType: 'application/pdf' },
});
const obj = await env.DELIVERABLES.get('reports/2026-04.pdf');
```

## Vectorize

```bash
wrangler vectorize create lobbi-past-meetings \
  --dimensions=1024 --metric=cosine
```

```jsonc
"vectorize": [
  { "binding": "PAST_MEETINGS", "index_name": "lobbi-past-meetings" }
]
```

```typescript
await env.PAST_MEETINGS.upsert([
  { id: 'meeting-1', values: emb1024, metadata: { date: '2026-04' } }
]);
const matches = await env.PAST_MEETINGS.query(queryEmb, { topK: 5, returnMetadata: 'all' });
```

## Hyperdrive (pooled Postgres)

```bash
wrangler hyperdrive create roi-pool \
  --connection-string="postgres://user:pass@pg.example.com:5432/roi"
```

```jsonc
"hyperdrive": [
  {
    "binding": "PG",
    "id": "abc123",
    "localConnectionString": "postgres://localhost:5432/roi"
  }
]
```

```typescript
import postgres from 'postgres';
const sql = postgres(env.PG.connectionString, { prepare: false });
const rows = await sql`SELECT id FROM tenants WHERE active = true`;
```

`prepare: false` is required — Hyperdrive doesn't yet pool prepared statements.

## Workers AI

```jsonc
"ai": { "binding": "AI" }
```

```typescript
const out = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
  audio: [...uint8Array]
});
```

## Queue (producer)

```bash
wrangler queues create transcription-jobs
```

```jsonc
"queues": {
  "producers": [{ "binding": "JOBS", "queue": "transcription-jobs" }]
}
```

```typescript
await env.JOBS.send({ meetingId: '42' });
```

## Queue (consumer)

```jsonc
"queues": {
  "consumers": [
    {
      "queue": "transcription-jobs",
      "max_batch_size": 10,
      "max_batch_timeout": 5,
      "max_retries": 3,
      "dead_letter_queue": "transcription-jobs-dlq"
    }
  ]
}
```

```typescript
export default {
  async queue(batch: MessageBatch<{ meetingId: string }>, env: Env) {
    for (const msg of batch.messages) {
      try { await process(msg.body, env); msg.ack(); }
      catch (e) { msg.retry(); }
    }
  }
};
```

## Service binding (Worker → Worker RPC)

```jsonc
"services": [{ "binding": "AUTH", "service": "oauth-provider" }]
```

```typescript
const res = await env.AUTH.fetch('https://internal/verify', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

## Generate / regenerate types

```bash
wrangler types        # writes worker-configuration.d.ts
```

Add to `tsconfig.json`:
```json
{ "compilerOptions": { "types": ["@cloudflare/workers-types", "./worker-configuration"] } }
```
