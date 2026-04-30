---
name: Cloudflare Workers Stack
description: Cloudflare Workers monorepo plugin — DOs, Workflows, Containers, MCP, AI Gateway
---

# Cloudflare Workers Stack

Multi-app Workers monorepos with every binding, MCP-on-Workers, Workflows, Containers, Browser Rendering, Email, AI Gateway, Smart Placement, observability.

## Stack

Workers · DOs (SQLite) · Workflows · Containers · D1/KV/R2/Vectorize/Hyperdrive · Workers AI + AI Gateway · MCP Streamable HTTP · OAuth RS256 · Wrangler 4.20 · Miniflare 4 · TS 5.6 · Vitest 2 + pool-workers · pnpm.

## Commands

`/cf-scaffold` `/cf-dev` `/cf-deploy` `/cf-binding` `/cf-durable-object` `/cf-secret`

## Skills (16)

`wrangler-config`, `pnpm-workspaces-workers`, `workers-rpc-entrypoints`, `durable-objects`, `vectorize-rag`, `hyperdrive-postgres`, `r2-presigned-uploads`, `cloudflare-workflows`, `containers-on-workers`, `browser-rendering`, `email-workers`, `workers-ai`, `ai-gateway-advanced`, `oauth-provider-worker`, `mcp-on-workers`, `smart-placement-and-pipelines`, `observability-tail-trace`, `vitest-coverage-pool-workers`.

## Agents

`workers-architect` (opus), `durable-objects-engineer` (sonnet), `edge-performance-reviewer` (sonnet).

## Hard rules

1. Compat date pinned across monorepo.
2. Secrets are Worker secrets, never `vars`.
3. DO classes always have a migration tag.
4. AI Gateway in front of every LLM call.
5. Vectorize filters need metadata indexes up front.
6. Hyperdrive: `prepare: false`.
7. Internal Worker↔Worker = `WorkerEntrypoint` RPC.

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| Topology / placement | `docs/architecture.md` | storage matrix |
| Add binding | `commands/cf-binding.md` | end-to-end |
| Durable Object | `skills/durable-objects` | migrations, alarms |
| Long multi-step / saga | `skills/cloudflare-workflows` | step.do, wait |
| MCP at edge | `skills/mcp-on-workers` | tools, resources |
| Heavy / native | `skills/containers-on-workers` | Container class |
| Headless browser | `skills/browser-rendering` | Puppeteer |
| Inbound email | `skills/email-workers` | email() handler |
| RAG / search | `skills/vectorize-rag` | hybrid retrieval |
| LLM basic | `skills/workers-ai` | models, streaming |
| Gateway features | `skills/ai-gateway-advanced` | BYO, evals, guardrails |
| Postgres | `skills/hyperdrive-postgres` | pooling |
| Uploads | `skills/r2-presigned-uploads` | multipart, presigned |
| OAuth | `skills/oauth-provider-worker` | RS256, JWKS, PKCE |
| Monorepo | `skills/pnpm-workspaces-workers` | shared pkgs |
| Typed RPC | `skills/workers-rpc-entrypoints` | WorkerEntrypoint |
| Latency / ingest | `skills/smart-placement-and-pipelines` | placement |
| Logs / tracing | `skills/observability-tail-trace` | Logpush, Tail, AE |
| Tests | `skills/vitest-coverage-pool-workers` | DO tests, mocks |
| CLI ref | `docs/cheatsheet.md` | wrangler + APIs |
| Quotas | `docs/limits-and-pricing.md` | caps |
| Errors | `docs/troubleshooting.md` | fixes |
