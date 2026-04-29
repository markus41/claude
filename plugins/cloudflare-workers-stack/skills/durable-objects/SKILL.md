---
name: Durable Objects
description: Use when the user asks about Durable Objects, stateful workers, alarms, single-instance routing, transactional storage, or DO migrations.
version: 0.1.0
---

# Durable Objects

A Durable Object is a single-threaded, globally-routable, stateful actor with strongly-consistent storage. Use it whenever you need:

- A coordinator (rate limiter, sequencer, lock)
- Per-entity state (per-meeting, per-tenant, per-user session)
- Transactional in-region writes
- Recurring tasks via alarms

## When NOT to use a DO

- Read-heavy global cache → use KV
- Bulk row queries → use D1
- Large blobs → use R2
- Stateless transforms → use a regular Worker

## SQLite-backed DO (modern default)

```typescript
import { DurableObject } from 'cloudflare:workers';

export class RateLimiter extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    state.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS hits (
        bucket TEXT,
        ts INTEGER,
        PRIMARY KEY (bucket, ts)
      )
    `);
  }

  async hit(bucket: string): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - 60_000;

    this.ctx.storage.sql.exec('DELETE FROM hits WHERE ts < ?', windowStart);
    const { results } = this.ctx.storage.sql.exec(
      'SELECT COUNT(*) AS c FROM hits WHERE bucket = ?', bucket
    );
    const count = (results[0] as any).c as number;

    if (count >= 100) return { allowed: false, remaining: 0 };

    this.ctx.storage.sql.exec(
      'INSERT INTO hits (bucket, ts) VALUES (?, ?)', bucket, now
    );
    return { allowed: true, remaining: 99 - count };
  }
}
```

Wrangler:
```jsonc
"durable_objects": {
  "bindings": [{ "name": "RATE_LIMIT", "class_name": "RateLimiter" }]
},
"migrations": [
  { "tag": "v1", "new_sqlite_classes": ["RateLimiter"] }
]
```

## Routing to a specific instance

```typescript
// idFromName — deterministic, sharded by name
const id = env.RATE_LIMIT.idFromName(`tenant:${tenantId}`);

// newUniqueId — random, you must persist the id elsewhere to find it again
const id = env.RATE_LIMIT.newUniqueId();

// idFromString — round-trip a hex id
const id = env.RATE_LIMIT.idFromString(hex);

const stub = env.RATE_LIMIT.get(id);
const result = await stub.hit('login');     // typed RPC if class methods are public
```

## Storage API summary

```typescript
// Single op
await ctx.storage.put('key', value);
const v = await ctx.storage.get<T>('key');
await ctx.storage.delete('key');

// Multi
await ctx.storage.put({ k1: v1, k2: v2 });
const entries = await ctx.storage.list({ prefix: 'user:', limit: 100 });

// Transactions
await ctx.storage.transaction(async (txn) => {
  const x = (await txn.get<number>('counter')) ?? 0;
  await txn.put('counter', x + 1);
});

// Alarm
await ctx.storage.setAlarm(Date.now() + 60_000);
const next = await ctx.storage.getAlarm();
await ctx.storage.deleteAlarm();
```

## Alarms

```typescript
async alarm(): Promise<void> {
  // Runs at-least-once when the scheduled time arrives.
  await this.flush();
  await this.ctx.storage.setAlarm(Date.now() + 60_000);
}
```

Alarms are **at-least-once** — make `alarm()` idempotent. Failure retries with exponential backoff.

## Concurrency: `blockConcurrencyWhile`

DOs are single-threaded but can have **concurrent in-flight requests**. Use `blockConcurrencyWhile` to serialize critical sections:
```typescript
constructor(state, env) {
  super(state, env);
  state.blockConcurrencyWhile(async () => {
    this.cache = await state.storage.get('cache');
  });
}
```
While the callback runs, all other requests queue.

## Output gates / input gates

The runtime auto-applies an "output gate": no write is observable to other code until storage acks. This protects against weird intermediate states. You can opt into "input gates" — see docs if you have very tight ordering needs.

## RPC entrypoints (Wrangler 4)

Public methods on a DO class are callable directly:
```typescript
const stub = env.AGENT.get(id);
const out = await stub.appendChunk('hello');    // typed!
```

Mark internal methods `private`. RPC bodies and returns must be structured-cloneable (no functions, no DOM).

## Pitfalls

- **Routing every tenant to one DO**: that's a global hotspot. Shard by tenant id.
- **Long-running tasks in `fetch`**: hits CPU limits. Defer to alarm.
- **Forgetting `migrations`**: deploy succeeds, instances 404 because the class isn't registered in the durability layer.
- **Editing a previously-deployed migration tag**: irreversible state corruption. Always add a new tag.
- **Using DO storage for >1 GB per instance**: hard cap. Spill to R2 + index in DO.
