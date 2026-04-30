---
name: Observability (Tail, Trace, Logpush)
description: Use when the user asks about Workers observability, Logpush to R2 / Datadog / Splunk, Tail Workers, Trace Events, structured logging, distributed tracing for service-bound Workers, or production monitoring.
version: 0.1.0
---

# Workers Observability — Beyond `console.log`

`wrangler tail` is fine for development. For production, use:

| Tool | What for |
|------|---------|
| `observability.enabled: true` | Dashboard logs (last few hours) |
| **Logpush** | Persistent logs to R2 / S3 / Datadog / Splunk |
| **Tail Workers** | Real-time log processing in another Worker |
| **Trace Events** | Distributed tracing across service-bound Workers |
| **Workers Analytics Engine** | Custom time-series metrics with SQL |

## 1. Built-in observability

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1.0          // 0.0..1.0 — sample fraction of requests
  }
}
```

Enabled = logs/metrics retained in dashboard. Sample below 1.0 for high-volume Workers to control costs.

## 2. Structured logging

```typescript
function log(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ level, event, ts: Date.now(), ...data }));
}

// Inside a handler
log('info', 'request', { method: req.method, path: new URL(req.url).pathname, tenantId });
log('error', 'd1.query.failed', { query: 'SELECT...', err: String(e) });
```

Structured JSON in logs is searchable in the dashboard and in Logpush sinks. **Never log secrets** — `wrangler tail` and Logpush will both surface them.

## 3. Logpush

Logpush ships logs to R2 / S3 / external SIEMs / HTTP endpoints. Configure once in dashboard or:

```bash
wrangler logpush create --destination "r2://lobbi-logs/workers/{date}" \
  --dataset workers_trace_events \
  --enabled true \
  --filter '{"where":{"and":[{"key":"Outcome","operator":"eq","value":"exception"}]}}' \
  --output-options '{"timestampFormat":"unix"}'
```

| Dataset | Records |
|---------|---------|
| `workers_trace_events` | Per-request: requests, responses, exceptions, sub-requests, console logs |
| `workers_invocations` | Per-invocation summary (CPU time, bytes, etc.) |
| `http_requests` | Zone-level HTTP requests (CDN-level) |
| `dns_logs`, `audit_logs`, ... | Other zone/account-level streams |

For a Workers app, `workers_trace_events` is the high-fidelity stream. Use filters to keep volume reasonable.

### Logpush + R2: queryable archive

R2 receives JSON-lines partitioned by date. Query with DuckDB (locally or via a Worker):

```sql
SELECT
  scriptName,
  COUNT(*) AS requests,
  AVG(cpuTimeMs) AS avg_cpu,
  SUM(CASE WHEN outcome = 'exception' THEN 1 ELSE 0 END) AS errors
FROM read_json_auto('s3://lobbi-logs/workers/2026-04-29/*.json.gz')
GROUP BY scriptName
ORDER BY errors DESC;
```

## 4. Tail Workers

Process logs in real time in another Worker — no log shipping latency.

```jsonc
// Producer Worker (synth-agent/wrangler.jsonc)
"tail_consumers": [
  { "service": "log-processor" }
]
```

```typescript
// log-processor Worker
export default {
  async tail(events: TraceItem[], env: Env, ctx: ExecutionContext) {
    for (const e of events) {
      // Sample: alert on any exception
      if (e.outcome === 'exception') {
        await env.SLACK.send({ text: `🚨 ${e.scriptName} threw: ${e.exceptions[0]?.message}` });
      }

      // Sample: count token usage from console.log lines
      for (const log of e.logs) {
        if (log.message[0]?.includes('"event":"ai.tokens"')) {
          const data = JSON.parse(log.message[0]);
          ctx.waitUntil(env.ANALYTICS.writeDataPoint({
            indexes: [data.tenantId],
            blobs: [data.feature],
            doubles: [data.tokens],
          }));
        }
      }
    }
  }
};
```

`TraceItem` shape:
```typescript
interface TraceItem {
  scriptName: string;
  outcome: 'ok' | 'exception' | 'exceededCpu' | 'canceled' | 'unknown' | 'killed';
  eventTimestamp: number;
  event: { request?: { url: string; method: string; ... }; cron?: { ... }; ... };
  exceptions: Array<{ name: string; message: string; stack?: string; timestamp: number }>;
  logs: Array<{ message: unknown[]; level: 'log'|'warn'|'error'|'info'|'debug'; timestamp: number }>;
  diagnosticsChannelEvents: Array<{ ... }>;
  cpuTimeMs?: number;
  wallTimeMs?: number;
}
```

Tail Workers count toward your Worker invocations but pay for themselves vs. polling Logpush.

## 5. Trace Events for distributed tracing

When Worker A calls Worker B via service binding, both have separate trace events. Connect them via a correlation id:

```typescript
// Caller (synth-agent)
const traceId = crypto.randomUUID();
console.log(JSON.stringify({ event: 'rpc.start', traceId, target: 'auth.verify' }));
const verified = await env.AUTH.verify(token);
console.log(JSON.stringify({ event: 'rpc.end', traceId }));

// Callee (oauth-provider) — receive traceId via header or arg
export class OAuthEntrypoint extends WorkerEntrypoint<Env> {
  async verify(token: string, traceId?: string): Promise<...> {
    console.log(JSON.stringify({ event: 'verify.start', traceId }));
    // ...
  }
}
```

Then in Logpush / Tail Worker, join by `traceId` to reconstruct the call tree.

For real OpenTelemetry-style tracing, use `@microlabs/otel-cf-workers` (community) which bridges Workers to an OTLP exporter. Useful when correlating with non-Worker services.

## 6. Workers Analytics Engine

Custom time-series metrics with no schema setup. Bind once:

```jsonc
"analytics_engine_datasets": [
  { "binding": "ANALYTICS", "dataset": "lobbi_events" }
]
```

Write data points:
```typescript
await env.ANALYTICS.writeDataPoint({
  indexes: [tenantId],          // up to 1 indexed string
  blobs: [feature, model],      // up to 20 blob fields
  doubles: [latencyMs, tokens], // up to 20 numeric fields
});
```

Query via the GraphQL Analytics API or SQL-over-HTTPS:
```sql
SELECT
  index1 AS tenantId,
  blob1 AS feature,
  AVG(double1) AS avg_latency_ms,
  SUM(double2) AS total_tokens
FROM lobbi_events
WHERE timestamp > NOW() - INTERVAL '1' HOUR
GROUP BY tenantId, feature;
```

Cheap, fast, fixed schema-less. The right place for product metrics that don't justify a full TSDB.

## 7. Per-request `cf-aig-metadata` for AI Gateway calls

Already covered in the `ai-gateway-advanced` skill, but it's a piece of observability — every LLM call carries searchable `tenantId` / `feature` / `version` metadata in the gateway dashboard.

## End-to-end pattern (production)

```
[Worker] ─── console.log structured JSON ───┐
   │                                          │
   │ env.ANALYTICS.writeDataPoint() ──────────┤
   │                                          │
   ├── ctx.waitUntil(slackOnError) ───────────┤
   │                                          ▼
   ├── tail Worker  ─── parse logs, alert, write metrics
   │                                          │
   └── Logpush  ─── R2 (JSON-lines, partitioned by date)
                                              │
                                              ▼
                                        DuckDB / Spark / external SIEM
```

## Pitfalls

- **`console.log` of objects** in production: Cloudflare auto-JSON-stringifies, but the format is verbose. Pre-stringify yourself for tighter control.
- **Logpush filter too lax**: high-volume Workers + no filter = expensive R2 writes. Filter to `outcome != 'ok'` or sample.
- **Tail Workers throwing**: failures are silent. Add a try/catch around the whole loop and report to a fallback channel.
- **Logging secrets in error stacks**: stack traces of HTTP error wrappers can include the original Authorization header. Sanitize.
- **Analytics Engine confusing types**: indexes are strings (1), blobs are strings (≤20), doubles are numbers (≤20). Putting a number in `blobs` works but is queried as text.
- **Forgetting `wallTimeMs`**: CPU time is what you're billed on, but wall time tells you about external slowness. Log both.
