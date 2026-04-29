---
name: Hyperdrive Postgres
description: Use when the user asks about Hyperdrive, connecting Workers to Postgres (Neon, Supabase, RDS), connection pooling, or database access from the edge.
version: 0.1.0
---

# Hyperdrive: Pooled Postgres for Workers

Workers can't open long-lived TCP connections, and a fresh connection per request would crater your DB. Hyperdrive solves both: it pools connections at the edge, hides the real DB behind a Cloudflare-managed endpoint, and caches read queries.

## Create

```bash
wrangler hyperdrive create roi-pool \
  --connection-string="postgres://user:pass@pg.example.com:5432/roi" \
  --caching-disabled=false        # default: cache enabled
```

The credential is stored in Cloudflare; you only reference the Hyperdrive id from your Worker.

## Bind

```jsonc
"hyperdrive": [
  {
    "binding": "PG",
    "id": "abc123...",
    "localConnectionString": "postgres://localhost:5432/roi"
  }
]
```

`localConnectionString` is used in `wrangler dev --local` so you can hit a local Postgres without the Hyperdrive proxy.

## Query (postgres.js)

```bash
pnpm add postgres
```

```typescript
import postgres from 'postgres';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const sql = postgres(env.PG.connectionString, {
      // Hyperdrive doesn't currently support prepared-statement caching:
      prepare: false,
      // One TCP connection per request is fine — Hyperdrive pools upstream
      max: 1
    });

    try {
      const rows = await sql`SELECT id, name FROM tenants WHERE active = true LIMIT 100`;
      return Response.json(rows);
    } finally {
      // Important — release the upstream connection back to the pool
      await sql.end();
    }
  }
};
```

Wrangler:
```jsonc
"compatibility_flags": ["nodejs_compat"]
```
postgres.js needs `nodejs_compat` for `Buffer` and stream APIs.

## Query (node-postgres)

```typescript
import { Client } from 'pg';

const client = new Client({ connectionString: env.PG.connectionString });
await client.connect();
const { rows } = await client.query('SELECT 1 + 1 AS answer');
await client.end();
```

Both `pg` and `postgres` work; `postgres` is leaner for Workers.

## Caching

Hyperdrive caches read queries by hash of the SQL+params. Default TTL: 60s. Disable per query:
```typescript
const sql = postgres(env.PG.connectionString, {
  prepare: false,
  // Per-query: append a hint comment recognized by Hyperdrive
});
const rows = await sql`/*+hyperdrive_no_cache*/ SELECT now()`;
```

## Transactions

Yes — Hyperdrive forwards them. Just be aware that holding a transaction open across multiple Worker requests is impossible (no shared state). Run the whole transaction in one request.

## Schema migrations

Run from your CI / dev box, **not** from a Worker:
```bash
psql $POSTGRES_URL -f migrations/0001_init.sql
```
Or use Drizzle Kit / Prisma migrate / Atlas. Workers don't typically run DDL.

## Choosing a Postgres host

| Host | Notes |
|------|-------|
| Neon | Branching, scale-to-zero — pairs well with Hyperdrive |
| Supabase | Built-in auth + storage; uses Postgres natively |
| AWS RDS / Aurora | Enterprise; ensure publicly reachable or via Cloudflare Tunnel |
| Self-hosted | Tunnel + IP allowlist for Cloudflare's egress |

## Pitfalls

- **`prepare: true`** with postgres.js: each request opens a new prepare; bypasses the pool benefit. Use `prepare: false`.
- **Long-lived connections in DO storage**: don't try to keep a `Client` across requests. Hyperdrive does the pooling.
- **`max > 1`** in `postgres.js` config: one Worker invocation = one logical connection; concurrency comes from many invocations, not many local pool sockets.
- **Forgetting to call `sql.end()` / `client.end()`**: leaks the upstream pool slot.
- **Putting credentials in `vars`** instead of the Hyperdrive config: visible to anyone with read access. Always create via `wrangler hyperdrive create` so the credential lives in Cloudflare's encrypted store.
