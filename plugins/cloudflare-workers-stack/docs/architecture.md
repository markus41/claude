# Cloudflare Workers Stack — Reference Architecture

End-to-end edge architecture combining nine Workers, shared TypeScript packages, and every relevant binding type. Modeled on the Lobbi Cloudflare Stack.

## High-level topology

```
                       ┌────────────── User Browser / Desktop App ──────────────┐
                       └────────────────────────┬────────────────────────────────┘
                                                │ HTTPS / WSS
                                                ▼
              ┌─────────────────────── Edge front Worker ──────────────────────┐
              │  Routes, auth, rate-limit (DO ratelimit), CORS                  │
              └──┬─────────────┬─────────────┬─────────────┬─────────────┬─────┘
                 │ service     │ service     │ service     │ service     │ service
                 ▼ binding     ▼ binding     ▼ binding     ▼ binding     ▼ binding
   ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ oauth-provider   │ │ synth-agent  │ │past-meetings │ │ engagements  │ │ deliverables │
   │ KV: sessions     │ │ DO + AI      │ │ Vectorize    │ │ D1           │ │ R2           │
   │ DO: auth-codes   │ │ AI Gateway   │ │ + AI Gateway │ │              │ │              │
   │ Cron: rotate     │ │              │ │              │ │              │ │              │
   └──────────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                              │                 │                                  │
                              ▼                 ▼                                  ▼
                       ┌────────────┐    ┌─────────────┐                  ┌──────────────────┐
                       │ Workers AI │    │ Vectorize   │                  │ R2 (objects)     │
                       │ Llama 70B  │    │ 1024-d      │                  │ deliverables.pdf │
                       │ Whisper    │    │ cosine      │                  │ transcripts/     │
                       └────────────┘    └─────────────┘                  └──────────────────┘
                              │                 │
                              └────── AI Gateway (caching, retries, fallback) ─────┐
                                                                                    │
                                                                                    ▼
                                                                  Anthropic / OpenAI / Replicate
```

## Per-Worker responsibilities

| Worker | Triggers | Bindings |
|--------|---------|----------|
| `oauth-provider` | HTTP, Cron | KV (sessions), DO (auth-codes), secrets (RSA private JWK) |
| `synth-agent` | HTTP, RPC | DO (SynthesisAgent), AI, AI Gateway, R2 (transcripts), Vectorize |
| `methodology-mcp` | HTTP (MCP) | KV (methodology lookup) |
| `past-meetings-mcp` | HTTP (MCP) | Vectorize, AI, R2 |
| `engagements-mcp` | HTTP (MCP) | D1 (`lobbi-engagements-cache`) |
| `roi-models-mcp` | HTTP (MCP) | D1 (`lobbi-roi-models`) |
| `deliverables-mcp` | HTTP (MCP) | R2 (`lobbi-deliverables`) |
| `r2-upload-proxy` | HTTP | R2, Service binding to oauth-provider |
| `stt-fallback-worker` | HTTP, Queue | AI (Whisper-large-v3-turbo) |

## Data placement decisions

| Data | Where | Why |
|------|-------|-----|
| OAuth refresh tokens | KV (`lobbi-oauth-sessions`) | Hot reads, short-ish TTL |
| OAuth auth codes | DO | Single-use atomic delete-on-read |
| Session metadata per agent | DO (SynthesisAgent) | Stateful coordinator |
| Transcripts (raw text) | R2 (`lobbi-transcripts`) | Large, write-once-read-many |
| Synthesis outputs | R2 (`lobbi-syntheses`) | Documents, served via signed URLs |
| Past-meeting embeddings | Vectorize (`lobbi-past-meetings`, 1024d cosine) | Semantic search |
| Deliverable templates | R2 (`lobbi-deliverables`) | Versioned blobs |
| Methodology lookup | KV (`lobbi-methodology`) | Read-only reference data |
| Engagement records | D1 (`lobbi-engagements-cache`) | Relational queries with joins |
| ROI scenarios | D1 (`lobbi-roi-models`) | Relational, transactional |
| Long-lived agent memory | KV (`lobbi-agent-memory`) | Cross-session context |

## Auth flow

```
Desktop App                   oauth-provider Worker             AI Gateway / Resource Worker
     │                                  │                                  │
     │── /authorize?challenge=… ──────▶ │                                  │
     │◀───── 302 with code ──────────── │                                  │
     │                                  │                                  │
     │── /token?code=…&verifier=… ───▶ │ DO: redeem code (single-use)     │
     │◀── { access, refresh, id }       │                                  │
     │                                  │                                  │
     │─── any API call w/ access ───────────────────────────────▶          │
     │                                                          │          │
     │                                                          │── verify via JWKS
     │                                                          │   (RS256)
     │                                                          │── env.AUTH.verify(...)
     │                                                          │   service binding (typed)
```

## Cron jobs

| Worker | Schedule | Purpose |
|--------|----------|---------|
| `oauth-provider` | `0 3 * * *` | Rotate stale sessions, prune expired refresh tokens |

Cron-only Workers can also be the place to:
- Refresh Vectorize indices from a source of truth
- Compact D1 tables / vacuum SQLite
- Push aggregated metrics

## Compatibility

- `compatibility_date`: pinned across all 9 apps to the same date (e.g. `2026-04-15`)
- `compatibility_flags`: `nodejs_compat` everywhere; additional flags only where required

## Observability

Each Worker has `observability.enabled: true`. Use `wrangler tail <worker> --format pretty` for live logs. AI Gateway dashboard for LLM calls. KV/D1/R2/Vectorize have per-binding metrics in the Cloudflare dashboard.

## Failure model

- **AI Gateway falls back** to a secondary provider on primary error
- **stt-fallback-worker** subscribes to a queue; primary STT (Deepgram) failures DLQ here
- **DO alarm retries** on `alarm()` exception with exponential backoff
- **Versioned deploys** allow instant rollback per Worker without coordinated re-deploy

## Local dev

```bash
# All apps
pnpm -r dev      # spawns concurrently per app
# Single app with sibling service binding running on a different port
pnpm --filter synth-agent dev --port 8787
pnpm --filter oauth-provider dev --port 8788
```

Wrangler dev auto-discovers sibling Workers for service bindings.
