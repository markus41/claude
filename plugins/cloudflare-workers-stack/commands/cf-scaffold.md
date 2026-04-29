---
name: cf-scaffold
intent: Bootstrap a new Cloudflare Worker (or a whole pnpm-workspaces monorepo) with shared packages and bindings
tags:
  - cloudflare-workers-stack
  - command
  - scaffold
inputs: []
risk: low
cost: low
description: Bootstrap a new Cloudflare Worker (or a whole pnpm-workspaces monorepo) with shared packages and bindings
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Scaffold Cloudflare Workers Project

## Single Worker

```bash
pnpm create cloudflare@latest my-worker -- \
  --template hello-world \
  --type ts \
  --git \
  --deploy false
cd my-worker
pnpm install
pnpm dev          # http://127.0.0.1:8787
pnpm deploy       # after wrangler login
```

## Monorepo (canonical layout)

For projects with several Workers + shared code:

```
my-platform/
├── apps/
│   ├── synth-agent/                  # Worker with Durable Object
│   ├── oauth-provider/               # Worker with cron + KV
│   ├── methodology-mcp/              # MCP server Worker
│   └── upload-proxy/                 # R2 multipart upload Worker
├── packages/
│   ├── shared-auth/                  # JWT verify, JWKS fetch
│   ├── shared-llm/                   # AI Gateway client wrapper
│   ├── shared-r2-helpers/            # R2 multipart helpers
│   ├── shared-hyperdrive/            # Hyperdrive client + types
│   ├── shared-schemas/               # zod schemas
│   └── shared-test-fixtures/         # Common test fixtures
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Each app's `package.json`:
```json
{
  "name": "@workspace/synth-agent",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "build": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@workspace/shared-auth": "workspace:*",
    "@workspace/shared-llm": "workspace:*"
  },
  "devDependencies": {
    "wrangler": "^4.20.0",
    "@cloudflare/workers-types": "^4",
    "@cloudflare/vitest-pool-workers": "^0.5",
    "vitest": "^2"
  }
}
```

## Per-app `wrangler.jsonc`

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "synth-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-15",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "vars": { "STAGE": "dev" },
  "durable_objects": {
    "bindings": [{ "name": "AGENT", "class_name": "SynthesisAgent" }]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["SynthesisAgent"] }
  ],
  "ai": { "binding": "AI" },
  "vectorize": [
    { "binding": "PAST_MEETINGS", "index_name": "lobbi-past-meetings" }
  ]
}
```

## Verify

```bash
pnpm -r build      # tsc --noEmit across all apps
pnpm -r test
pnpm --filter synth-agent dev
```
