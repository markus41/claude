---
name: Smart Placement & Pipelines
description: Use when the user asks about Cloudflare Smart Placement (geo-aware Worker placement near origin), Cloudflare Pipelines (managed ingestion to R2), or optimizing latency for origin-bound or write-heavy workloads.
version: 0.1.0
---

# Smart Placement & Pipelines

Two performance / data-movement features that the basic Worker model doesn't cover.

## Smart Placement

By default, a Worker runs at the Cloudflare data center closest to the **end user**. That's optimal for users — but if the Worker spends most of its time talking to a single origin (a managed Postgres in `us-east`, a SaaS API), the user's edge POP may be far from the origin, adding round-trip latency.

**Smart Placement** lets Cloudflare's runtime decide on a per-request basis: run near the user (default), or near the origin (when the Worker would otherwise wait on origin calls).

### Enable

```jsonc
// wrangler.jsonc
{
  "placement": { "mode": "smart" }
}
```

That's it. Cloudflare profiles your Worker over a few minutes and adapts. The dashboard's analytics show placement decisions per request.

### When it helps

- ✅ Worker calls a single origin > 75% of CPU time
- ✅ Origin is concentrated in one region (Postgres, internal API)
- ✅ Workload is write-heavy (response can travel far; the request to origin shouldn't)

### When it doesn't help (and may hurt)

- ❌ Most data lives in Cloudflare-native storage (R2, KV, D1, Vectorize) — they're already global
- ❌ Hyperdrive is already in front of your Postgres (it has its own global pooling)
- ❌ Workload is read-heavy and cacheable — keep it near the user
- ❌ You serve static assets (Smart Placement is for compute paths)

### Inspect

```bash
wrangler deploy
# After traffic, check dashboard → Workers → Settings → Placement
# Decision counts: "near-user" vs "near-origin"
```

If decisions are 100% near-user, Smart Placement isn't kicking in — likely because origin latency is already negligible for your workload.

### Combine with caching

Smart Placement + tiered caching = optimal:
- First request anywhere: near-origin (fetches fresh)
- Cached at edge POPs near users
- Subsequent requests: served from edge cache, no Worker placement matters

## Pipelines

Cloudflare Pipelines is a managed ingestion service. Use it when you need to:

- Capture **high-volume event streams** from clients/servers
- Buffer / batch / partition before writing to R2 or another sink
- Avoid building your own queue + consumer + writer plumbing

### Architecture

```
[Producer Workers / external clients]
                │ HTTP POST (JSON-lines or single events)
                ▼
            [Pipeline]
                │ batches by time + size, optionally transforms
                ▼
              [R2]   (NDJSON, partitioned by date / source)
```

### Create a Pipeline

```bash
wrangler pipelines create lobbi-events \
  --r2-bucket lobbi-events-archive \
  --batch-max-mb 50 \
  --batch-max-seconds 60 \
  --partitioning '{date}/{source}'
```

Returns an ingestion endpoint URL. Send to it from any Worker:

```typescript
await env.EVENTS.send({
  source: 'synth-agent',
  ts: Date.now(),
  tenantId,
  type: 'meeting-synthesized',
  payload: { meetingId, durationMs },
});
```

(Bind in `wrangler.jsonc`:)
```jsonc
"pipelines": [
  { "binding": "EVENTS", "pipeline": "lobbi-events" }
]
```

### Why not Queues + a custom Worker?

- Queues: durable, but consumer code is yours to write/maintain.
- Pipelines: zero-code consumer for the common "buffer + write to R2" path; back-pressure handled.
- For complex per-event processing, still use Queues. Pipelines = "I just want this in R2 partitioned and cheap."

### Sample analysis pattern

```typescript
// Worker that runs nightly via cron
async scheduled(event: ScheduledEvent, env: Env) {
  // Read yesterday's events directly from R2 partition
  const prefix = `2026/04/29/synth-agent/`;
  const list = await env.EVENTS_BUCKET.list({ prefix });

  let totalEvents = 0;
  let perTenant = new Map<string, number>();
  for (const obj of list.objects) {
    const text = await (await env.EVENTS_BUCKET.get(obj.key))!.text();
    for (const line of text.split('\n')) {
      if (!line) continue;
      const e = JSON.parse(line);
      totalEvents++;
      perTenant.set(e.tenantId, (perTenant.get(e.tenantId) ?? 0) + 1);
    }
  }
  // Persist daily aggregate to D1 for queryability
  await env.STATS.prepare('INSERT INTO daily_events (date, tenant, count) VALUES (?, ?, ?)').bind(...).run();
}
```

For ad-hoc analysis without code, point any SQL-on-files engine (DuckDB, Athena, BigQuery external) at the R2 partitioned NDJSON.

## Cron triggers (related)

Cron triggers run a Worker on a schedule — useful for both Smart-Placed batch jobs and Pipeline-aggregation jobs:

```jsonc
"triggers": { "crons": ["0 3 * * *", "*/5 * * * *"] }
```

```typescript
async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  switch (event.cron) {
    case '0 3 * * *':  await rotateSecrets(env); break;
    case '*/5 * * * *': await aggregateStats(env); break;
  }
}
```

## Tail Workers

A "Tail Worker" is a Worker subscribed to the logs of another Worker. Instead of polling logs, you process them as they happen — perfect for sampling Pipelines events into a custom monitoring system or applying transforms before retention.

```jsonc
// wrangler.jsonc of the producer Worker
"tail_consumers": [
  { "service": "log-processor" }
]
```

```typescript
// log-processor Worker
export default {
  async tail(events: TraceItem[], env: Env, ctx: ExecutionContext) {
    for (const e of events) {
      if (e.outcome === 'exception') {
        await env.SLACK_QUEUE.send({ message: `Error in ${e.scriptName}: ${e.exceptions[0]?.message}` });
      }
    }
  }
};
```

## Pitfalls

- **Smart Placement on caches**: defeats the point. Disable for read-heavy paths.
- **Pipelines without partitioning**: dumping all events in one prefix → impossible to query efficiently. Always partition by date + dimension.
- **Sending huge events to Pipelines** (multi-MB): per-event size limits exist. Stash big payloads in R2, send only the key in the event.
- **Not bumping `batch-max-seconds` for low-volume pipelines**: tiny files in R2 = expensive Class A operations. For low volume, allow longer batching windows.
- **Cron + Smart Placement**: scheduled events run wherever Cloudflare runs them — generally near the data they touch. Don't over-think placement for crons.
- **Tail Workers swallowing exceptions**: the tail Worker needs its own error handling; failures in `tail()` don't surface back to the producer.
