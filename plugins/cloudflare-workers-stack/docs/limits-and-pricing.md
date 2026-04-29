# Limits & Pricing Cheatsheet

> Always verify against [the live docs](https://developers.cloudflare.com/workers/platform/limits/) before architecting against a number — limits change.

## Workers (per request)

| Limit | Free | Paid (Workers Standard) |
|-------|------|-------------------------|
| CPU time | 10 ms | 30 s (configurable up) |
| Wall time | 30 s for HTTP, 15 min for cron | same |
| Memory per isolate | 128 MB | 128 MB |
| Sub-requests | 50 | 1000 |
| Request body | 100 MB | 500 MB |
| Response body | unbounded (streaming) | unbounded |
| Concurrent isolates | thousands per POP | thousands per POP |

## Workers (per script)

| Limit | Free | Paid |
|-------|------|------|
| Bundle size (compressed) | 3 MB | 10 MB |
| Number of bindings | dozens | hundreds |
| Number of routes | dozens | hundreds |

## KV

| Aspect | Limit |
|--------|-------|
| Value size | 25 MB |
| Key size | 512 bytes |
| Reads | unlimited (cached at edge, per-key cache TTL up to 60 s) |
| Writes | 1 / second / key (eventual consistency, ~60 s global propagation) |
| Storage | unlimited (paid by GB-month) |
| List operation | 1000 keys per page |

## R2

| Aspect | Limit |
|--------|-------|
| Object size | 5 TB max |
| Multipart parts | min 5 MB (except last), max 10000 parts |
| Buckets per account | 1000 |
| Egress within Cloudflare | free |
| Egress to internet | priced (much cheaper than S3) |

## D1

| Aspect | Limit |
|--------|-------|
| DB size | 10 GB |
| Row size | 1 MB |
| Statement timeout | 30 s |
| Statements per request | varies |
| Reads | high; replicated |
| Writes | bottlenecked by primary |

For larger relational workloads, use Postgres via Hyperdrive.

## Vectorize

| Aspect | Limit |
|--------|-------|
| Vector dimensions | up to 1536 |
| topK per query | up to 100 |
| Vectors per index | tiered (millions+) |
| Metadata per vector | 10 KB |
| Metadata indexes | up to 10 per index |

## Durable Objects

| Aspect | Limit |
|--------|-------|
| Storage per instance (KV-style) | 10 GB |
| Storage per instance (SQLite-style) | check current docs (1 GB at announce, expanding) |
| Concurrent in-flight requests | 1000 per instance |
| WebSocket connections | 32 768 per instance |
| Alarm precision | seconds |
| Alarm guarantee | at-least-once |

## Workers AI

Pay-per-token. Smaller models (7B–8B) are 5–10× cheaper than 70B. Embeddings are very cheap (sub-cent per thousand). Whisper is per-minute of audio. Always route via AI Gateway to deduplicate identical requests.

## AI Gateway

- Cache hits are free (don't count toward upstream provider usage)
- Retries / fallbacks count as separate upstream calls if not cached
- Built-in observability dashboard included

## Hyperdrive

- No additional cost for the binding itself
- Caching reduces upstream Postgres load (saves on managed-DB query units)
- The Postgres host is billed separately by its provider (Neon, Supabase, RDS)

## Common cost gotchas

- **AI calls without AI Gateway** — every retry costs you.
- **KV writes in a hot loop** — KV is read-priced; sustained writes burn money.
- **D1 with large indexes scanning per request** — add an index, or move to Vectorize/KV.
- **DOs with millions of distinct names** — `idFromName` creates an instance on first access; pruning later requires explicit `storage.deleteAll()` calls.
- **R2 lifecycle not configured** — abandoned multipart uploads cost storage until you add a rule.

## Cost defense playbook

1. **AI Gateway with cache TTL** — cuts 30–80% off LLM calls in typical workloads
2. **Pre-batch embeddings** — N items per API call, not N calls
3. **Smaller LLMs for narrow tasks** — bge embeddings, llama-8B for routing, 70B only for synthesis
4. **R2 lifecycle rules** — auto-delete `tmp/` after 1 day, abort multipart after 1 day
5. **KV cache TTL tuning** — cache hits at edge are free; tune `cacheTtl` per workload
6. **Don't over-shard DOs** — every instance you create costs storage
