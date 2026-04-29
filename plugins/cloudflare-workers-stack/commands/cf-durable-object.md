---
name: cf-durable-object
intent: Create a Durable Object class with migration, binding, alarm pattern, and unit tests
tags:
  - cloudflare-workers-stack
  - command
  - durable-objects
inputs: []
risk: medium
cost: medium
description: Create a Durable Object class with migration, binding, alarm pattern, and unit tests
allowed-tools:
  - Read
  - Write
  - Edit
---

# Create a Durable Object

DOs give each instance:
- A **single-threaded** event loop
- **Strongly consistent** transactional storage
- A **stable id** that always routes to the same instance globally
- An **alarm** for delayed/recurring work

## Class skeleton (SQLite-backed, modern API)

```typescript
// src/agents/synthesis-agent.ts
import { DurableObject } from 'cloudflare:workers';

export interface AgentEnv {
  AI: Ai;
  PAST_MEETINGS: VectorizeIndex;
}

interface SessionState {
  meetingId: string;
  startedAt: number;
  transcript: string[];
}

export class SynthesisAgent extends DurableObject<AgentEnv> {
  private state: SessionState | null = null;

  constructor(ctx: DurableObjectState, env: AgentEnv) {
    super(ctx, env);
    // Restore state lazily on first method call.
    ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get<SessionState>('state')) ?? null;
    });
  }

  async start(meetingId: string): Promise<void> {
    this.state = { meetingId, startedAt: Date.now(), transcript: [] };
    await this.ctx.storage.put('state', this.state);
    await this.ctx.storage.setAlarm(Date.now() + 60_000);   // checkpoint every minute
  }

  async appendChunk(chunk: string): Promise<void> {
    if (!this.state) throw new Error('not started');
    this.state.transcript.push(chunk);
    await this.ctx.storage.put('state', this.state);
  }

  async alarm(): Promise<void> {
    if (!this.state) return;
    // Periodic work: flush to R2, embed into Vectorize, etc.
    const text = this.state.transcript.join('\n');
    const emb = await this.env.AI.run('@cf/baai/bge-large-en-v1.5', { text });
    await this.env.PAST_MEETINGS.upsert([{
      id: this.state.meetingId,
      values: emb.data[0],
      metadata: { startedAt: this.state.startedAt }
    }]);
    await this.ctx.storage.setAlarm(Date.now() + 60_000);
  }
}
```

## Wrangler config

```jsonc
{
  "durable_objects": {
    "bindings": [{ "name": "AGENT", "class_name": "SynthesisAgent" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["SynthesisAgent"] }
  ]
}
```

`new_sqlite_classes` enables SQLite storage (faster, transactional, the modern default). Use `new_classes` for legacy KV-style DO storage if you need it.

## Routing to an instance

```typescript
// In your Worker entry
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const meetingId = url.searchParams.get('id')!;
    const id = env.AGENT.idFromName(meetingId);
    const stub = env.AGENT.get(id);
    return stub.fetch(req);    // or call typed methods directly
  }
};
```

For typed RPC (Wrangler 4 supports DO-as-RPC):
```typescript
const stub = env.AGENT.get(env.AGENT.idFromName(meetingId));
await stub.start(meetingId);
await stub.appendChunk('hello');
```

## Storage API

```typescript
// Single key
await ctx.storage.put('key', value);
const v = await ctx.storage.get<T>('key');
await ctx.storage.delete('key');

// Bulk
await ctx.storage.put({ k1: v1, k2: v2 });
const map = await ctx.storage.get<T>(['k1', 'k2']);

// Transactional
await ctx.storage.transaction(async (txn) => {
  const x = (await txn.get<number>('counter')) ?? 0;
  await txn.put('counter', x + 1);
});

// SQLite (with new_sqlite_classes)
ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY)');
```

## Tests with `@cloudflare/vitest-pool-workers`

```typescript
// src/agents/synthesis-agent.test.ts
import { env, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

describe('SynthesisAgent', () => {
  it('appends chunks', async () => {
    const id = env.AGENT.idFromName('test');
    const stub = env.AGENT.get(id);
    await stub.start('test');
    await stub.appendChunk('a');
    await stub.appendChunk('b');
    await runInDurableObject(stub, async (instance, ctx) => {
      const state = await ctx.storage.get('state');
      expect(state.transcript).toEqual(['a', 'b']);
    });
  });
});
```

## Migration tags

| Tag | Field | When |
|-----|-------|------|
| `new_sqlite_classes` | New DO class with SQLite storage | First introduction |
| `new_classes` | New DO class with legacy KV storage | Rare; use SQLite |
| `renamed_classes` | Rename existing class | Refactor |
| `deleted_classes` | Remove a class | Retiring a DO |
| `transferred_classes` | Move between scripts | Splitting workers |

Migrations are applied in tag order on `wrangler deploy`. Once applied, a tag is permanent — never edit a previously-deployed migration.

## Common pitfalls

- **Forgetting `blockConcurrencyWhile` on init** — early concurrent calls can race and re-create state.
- **Holding network requests inside `transaction`** — transactions block subsequent ops; do I/O outside.
- **Routing every request to a single named instance** — that's a bottleneck. Shard by tenant / user / meeting.
- **Forgetting the migration tag** — DO won't be created in prod and routing will 404.
