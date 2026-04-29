# Wrangler / Workers Cheatsheet

## Wrangler 4 CLI

### Project
| Command | What |
|---------|------|
| `pnpm create cloudflare@latest` | Scaffold a new Worker |
| `wrangler dev` | Local dev (Miniflare 4) |
| `wrangler dev --remote` | Use real bindings |
| `wrangler dev --env staging` | Env-specific config |
| `wrangler deploy` | Deploy current Worker |
| `wrangler deploy --env production` | Env-specific deploy |
| `wrangler tail` | Stream live logs |
| `wrangler types` | Generate `worker-configuration.d.ts` |
| `wrangler whoami` | Current account |
| `wrangler login` | OAuth login |

### Versions / rollouts
| Command | What |
|---------|------|
| `wrangler versions upload` | Upload without routing |
| `wrangler versions list` | Recent versions |
| `wrangler versions deploy v=10% v2=90%` | Gradual rollout |
| `wrangler rollback --version-id <id>` | Instant rollback |

### KV
```bash
wrangler kv namespace create my-kv
wrangler kv namespace list
wrangler kv key put --binding KV "k" "v"
wrangler kv key get --binding KV "k"
wrangler kv key list --binding KV
wrangler kv bulk put --binding KV data.json
wrangler kv key delete --binding KV "k"
```

### R2
```bash
wrangler r2 bucket create my-bucket
wrangler r2 bucket list
wrangler r2 object put my-bucket/path.bin --file ./local.bin
wrangler r2 object get my-bucket/path.bin --file ./out.bin
wrangler r2 object delete my-bucket/path.bin
wrangler r2 bucket cors put my-bucket --rules-file cors.json
wrangler r2 bucket access-keys create
```

### D1
```bash
wrangler d1 create my-db
wrangler d1 list
wrangler d1 execute DB --command "SELECT 1"
wrangler d1 execute DB --file ./schema.sql --remote
wrangler d1 migrations create DB add_users
wrangler d1 migrations apply DB --local
wrangler d1 migrations apply DB --remote --env production
wrangler d1 backup create DB
```

### Vectorize
```bash
wrangler vectorize create my-index --dimensions 1024 --metric cosine
wrangler vectorize list
wrangler vectorize info my-index
wrangler vectorize create-metadata-index my-index --property-name tenantId --type string
wrangler vectorize insert my-index --file vectors.ndjson
wrangler vectorize delete my-index
```

### Hyperdrive
```bash
wrangler hyperdrive create my-pool --connection-string "postgres://..."
wrangler hyperdrive list
wrangler hyperdrive update my-pool --connection-string "postgres://..."
wrangler hyperdrive delete my-pool
```

### AI
```bash
wrangler ai models                           # list available models
```

### Queues
```bash
wrangler queues create my-queue
wrangler queues list
wrangler queues consumer add my-worker my-queue
```

### Secrets
```bash
wrangler secret put NAME [--env <env>]
wrangler secret list [--env <env>]
wrangler secret bulk < secrets.json
wrangler secret delete NAME [--env <env>]
```

## Common bindings (`wrangler.jsonc` snippets)

```jsonc
"kv_namespaces": [{ "binding": "KV", "id": "..." }]
"r2_buckets":    [{ "binding": "BUCKET", "bucket_name": "my-bucket" }]
"d1_databases":  [{ "binding": "DB", "database_name": "my-db", "database_id": "..." }]
"vectorize":     [{ "binding": "VEC", "index_name": "my-index" }]
"ai":            { "binding": "AI" }
"hyperdrive":    [{ "binding": "PG", "id": "...", "localConnectionString": "postgres://localhost/db" }]
"durable_objects": { "bindings": [{ "name": "AGENT", "class_name": "Agent" }] }
"migrations":    [{ "tag": "v1", "new_sqlite_classes": ["Agent"] }]
"services":      [{ "binding": "AUTH", "service": "oauth-provider" }]
"queues":        {
  "producers": [{ "binding": "JOBS", "queue": "jobs" }],
  "consumers": [{ "queue": "jobs", "max_batch_size": 10, "max_batch_timeout": 5, "max_retries": 3 }]
}
"triggers":      { "crons": ["0 */6 * * *"] }
"assets":        { "directory": "./public", "binding": "ASSETS", "not_found_handling": "single-page-application" }
"observability": { "enabled": true }
```

## Common runtime APIs

```typescript
// KV
await env.KV.put('k', 'v', { expirationTtl: 3600 });
await env.KV.get('k');
await env.KV.delete('k');
await env.KV.list({ prefix: 'user:' });

// R2
await env.BUCKET.put('key', body, { httpMetadata: { contentType: 'application/json' } });
await env.BUCKET.get('key');
await env.BUCKET.delete('key');
await env.BUCKET.list({ prefix: 'tmp/', limit: 100 });

// D1
await env.DB.prepare('SELECT * FROM t WHERE id = ?').bind(id).all();
await env.DB.prepare('INSERT INTO t (x) VALUES (?)').bind(x).run();
await env.DB.batch([stmt1, stmt2]);

// Vectorize
await env.VEC.upsert([{ id, values, metadata, namespace }]);
await env.VEC.query(values, { topK: 5, returnMetadata: 'all', filter: { ... } });

// Workers AI
await env.AI.run('@cf/meta/llama-3.1-70b-instruct', { messages });

// Cache API
const cache = caches.default;
const cached = await cache.match(req);
await cache.put(req, response.clone());

// Cron
async scheduled(event, env, ctx) { ... }

// Queue producer
await env.JOBS.send({ ... });

// Queue consumer
async queue(batch, env, ctx) { for (const m of batch.messages) m.ack(); }
```

## Useful TypeScript

```typescript
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
  VectorizeIndex,
  Hyperdrive,
  Ai,
  DurableObjectNamespace,
  Queue,
  Service,
  Fetcher,
  ScheduledController,
  ExecutionContext,
  MessageBatch
} from '@cloudflare/workers-types';
```
