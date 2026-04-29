# Cloudflare Workers Stack

Production-grade plugin for building Cloudflare Workers applications. Models the Lobbi Cloudflare Stack: 9 Workers + 7 shared packages with Durable Objects, D1, KV, R2, Vectorize, Hyperdrive, Workers AI, AI Gateway, and an OAuth provider.

## What's inside

### Commands

| Command | Purpose |
|---------|---------|
| `/cf-scaffold` | Bootstrap a single Worker or a full pnpm-workspaces monorepo |
| `/cf-dev` | Run Wrangler 4 / Miniflare 4 with local D1, KV, R2 simulators |
| `/cf-deploy` | Deploy with versioned uploads, gradual rollouts, and rollback |
| `/cf-binding` | Add a binding (D1, KV, R2, Vectorize, Hyperdrive, AI, queue, service) end-to-end |
| `/cf-durable-object` | Create a DO class with migration, alarm, and tests |
| `/cf-secret` | Manage per-environment secrets with `wrangler secret` |

### Skills

- **wrangler-config** — `wrangler.jsonc`, environments, compat date/flags, observability
- **durable-objects** — DO design, alarms, transactional storage, RPC entrypoints
- **vectorize-rag** — Vectorize index, embeddings, hybrid retrieval, full RAG pipeline
- **workers-ai** — `env.AI.run`, model catalog, Whisper STT, AI Gateway routing
- **hyperdrive-postgres** — Hyperdrive bindings, postgres.js / pg patterns
- **r2-presigned-uploads** — Multipart upload via Worker proxy or presigned URLs
- **oauth-provider-worker** — RS256 OAuth/OIDC provider with JWKS, PKCE, refresh flow
- **pnpm-workspaces-workers** — Multi-app monorepo with `@workspace/*` shared packages

### Agents

- **workers-architect** (opus) — Topology, data placement, DO sharding, monorepo design
- **durable-objects-engineer** (sonnet) — DO state machines, alarms, idempotency, RPC
- **edge-performance-reviewer** (sonnet) — Cold starts, CPU time, sub-request budgets, cache strategy

## Stack baseline

| Component | Default |
|-----------|---------|
| Wrangler | 4.20+ |
| Local dev | Miniflare 4 |
| TypeScript | 5.6 strict, ESM, Bundler resolution |
| Tests | Vitest 2 + `@cloudflare/vitest-pool-workers` |
| Lint / format | ESLint 9 flat + typescript-eslint, Prettier 3 |
| Workspaces | pnpm with `@workspace/*` shared packages |
| Storage | D1 (SQLite), KV, R2, Vectorize, Hyperdrive |
| Compute | Durable Objects (SQLite-backed) |
| AI | Workers AI + AI Gateway |
| Auth | OAuth 2.0 / OIDC provider Worker, RS256, JWKS |

## Reference architecture (Lobbi-style monorepo)

```
apps/
  synth-agent/                    # Durable Object orchestrator
  oauth-provider/                 # OAuth + cron rotation
  methodology-mcp/                # MCP server with KV
  past-meetings-mcp/              # Vectorize-powered semantic search
  engagements-mcp/                # D1-backed engagements API
  roi-models-mcp/                 # D1-backed ROI models
  deliverables-mcp/               # R2 deliverable storage
  r2-upload-proxy/                # R2 multipart upload broker
  stt-fallback-worker/            # Whisper-large-v3-turbo STT fallback
packages/
  shared-auth/                    # JWT verify, JWKS fetch
  shared-llm/                     # AI Gateway client
  shared-r2-helpers/              # R2 multipart helpers
  shared-hyperdrive/              # Hyperdrive client wrapper
  shared-schemas/                 # zod schemas
  shared-deliverable-template/    # PDF/docx templates
  shared-test-fixtures/           # Vitest fixtures
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — Full reference architecture
- [`docs/cheatsheet.md`](docs/cheatsheet.md) — Bindings + commands quick reference
- [`docs/limits-and-pricing.md`](docs/limits-and-pricing.md) — Current quotas and cost drivers
- [`docs/troubleshooting.md`](docs/troubleshooting.md) — Common errors and fixes

## Installation

```
/plugin install cloudflare-workers-stack
```

## License

MIT
