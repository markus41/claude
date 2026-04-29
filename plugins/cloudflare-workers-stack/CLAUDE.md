# Cloudflare Workers Stack — Plugin Instructions

This plugin helps Claude assist with building production Cloudflare Workers projects, especially multi-app pnpm-workspace monorepos using Durable Objects, D1, KV, R2, Vectorize, Hyperdrive, Workers AI, and AI Gateway.

## When this plugin should activate

- The user mentions Cloudflare Workers, Wrangler, Durable Objects, D1, KV, R2, Vectorize, Hyperdrive, Workers AI, AI Gateway, or Miniflare
- Files like `wrangler.jsonc`, `wrangler.toml`, or imports of `cloudflare:workers` exist in the workspace
- The user is building edge-native APIs, real-time collab backends, RAG pipelines, or OAuth providers on Cloudflare

## Default conventions to assume

| Topic | Default |
|-------|---------|
| Package manager | pnpm with workspaces |
| Wrangler version | 4.20+ |
| Local dev | Miniflare 4 (built into Wrangler) |
| TypeScript | 5.6 strict, ESM, `moduleResolution: "Bundler"` |
| Tests | Vitest 2 + `@cloudflare/vitest-pool-workers` |
| Compatibility date | A single pinned date across the monorepo |
| Compatibility flags | `nodejs_compat` for most apps |
| Auth | OAuth 2.0 / OIDC via a dedicated provider Worker, RS256, JWKS at `/.well-known/jwks.json` |
| LLM gateway | Always route via AI Gateway |
| State primitive | Durable Objects (SQLite-backed) for anything stateful |
| Embeddings | Vectorize, with metadata indexes for tenant/date filtering |

## Hard rules

1. **Compatibility date is mandatory** and must be the same across all Workers in a monorepo unless intentional.
2. **Secrets are Worker secrets**, never `vars`.
3. **Bindings are typed via `wrangler types`** — never hand-write `Env` if a binding exists.
4. **DO classes have a migration tag**, always.
5. **AI Gateway in front of every LLM call.** Never call OpenAI/Anthropic/etc. directly from a Worker.
6. **Vectorize filters need metadata indexes.** Define them up-front.
7. **Hyperdrive uses `prepare: false`** with postgres.js.

## Workflow

EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT

For any change touching bindings, DO migrations, or `compatibility_date`, write a one-paragraph plan first — these are runtime-impacting.

## When to delegate

- Topology and storage choice → `workers-architect` (opus)
- DO implementation / debugging → `durable-objects-engineer`
- Performance / cost audit → `edge-performance-reviewer`

## Reference docs

- `CONTEXT_SUMMARY.md` — bootstrap context (loaded by default)
- `docs/architecture.md` — full reference architecture for a Workers monorepo
- `docs/cheatsheet.md` — bindings / commands quick reference
- `docs/limits-and-pricing.md` — current quotas and how to stay inside them
- `docs/troubleshooting.md` — common errors and fixes
- `skills/*/SKILL.md` — domain-specific patterns (load on demand)
- `commands/*.md` — slash commands

## Don't touch

- `.wrangler/` (local state)
- `node_modules/`
- `dist/` / `build/`
- Any private signing keys (e.g. RSA private JWK for OAuth provider)
