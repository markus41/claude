---
name: Cloudflare Workers Stack
description: Production Cloudflare Workers + Durable Objects monorepo plugin
---

# Cloudflare Workers Stack

Multi-app Workers monorepos with every binding type, Wrangler 4.20, Miniflare 4, and an OAuth provider with JWKS / RS256.

## Stack

| Layer | Tech |
|-------|------|
| Compute | Workers, Durable Objects (SQLite) |
| Storage | D1, KV, R2, Vectorize, Hyperdrive |
| AI | Workers AI + AI Gateway |
| Triggers | HTTP, Cron, Queues, Email, RPC |
| Auth | OAuth 2.0 / OIDC Worker, RS256, JWKS |
| Tooling | Wrangler 4.20, Miniflare 4, TS 5.6, Vitest 2 |
| Workspaces | pnpm + `@workspace/*` shared packages |

## Commands

`/cf-scaffold`, `/cf-dev`, `/cf-deploy`, `/cf-binding`, `/cf-durable-object`, `/cf-secret`

## Skills

`wrangler-config`, `durable-objects`, `vectorize-rag`, `workers-ai`, `hyperdrive-postgres`, `r2-presigned-uploads`, `oauth-provider-worker`, `pnpm-workspaces-workers`

## Agents

- `workers-architect` (opus) — Topology, data placement, sharding
- `durable-objects-engineer` (sonnet) — DO state, alarms, RPC
- `edge-performance-reviewer` (sonnet) — CPU/sub-request budgets, cache strategy

## Hard rules

1. **Compatibility date** pinned and identical across the monorepo.
2. **Secrets are Worker secrets**, never `vars`.
3. **DO classes always have a migration tag**.
4. **AI Gateway in front of every LLM call.**
5. **Vectorize filters need metadata indexes**, defined up front.
6. **Hyperdrive uses `prepare: false`** with postgres.js.

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| Topology / data placement | `docs/architecture.md` + `agents/workers-architect.md` | Storage matrix, sharding |
| Adding a binding | `commands/cf-binding.md` | Config + types + usage |
| Durable Object work | `skills/durable-objects/SKILL.md`, `commands/cf-durable-object.md` | Migrations, alarms, RPC |
| RAG / semantic search | `skills/vectorize-rag/SKILL.md` | Embeddings, hybrid retrieval |
| LLM / Whisper / embeddings | `skills/workers-ai/SKILL.md` | Models, AI Gateway |
| Postgres from a Worker | `skills/hyperdrive-postgres/SKILL.md` | postgres.js, pooling |
| File uploads | `skills/r2-presigned-uploads/SKILL.md` | Multipart, presigned |
| OAuth provider | `skills/oauth-provider-worker/SKILL.md` | RS256, JWKS, PKCE |
| Multi-Worker monorepo | `skills/pnpm-workspaces-workers/SKILL.md` | Shared packages, service bindings |
| CLI / runtime quick ref | `docs/cheatsheet.md` | Wrangler + bindings + APIs |
| Cost or quota | `docs/limits-and-pricing.md` | Caps + cost defense |
| Build / runtime error | `docs/troubleshooting.md` | Common failures |
