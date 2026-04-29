---
name: pnpm Workspaces for Workers
description: Use when the user asks about multi-app Cloudflare Workers monorepos, shared packages, pnpm workspaces, workspace:* dependencies, or shared TypeScript types across Workers.
version: 0.1.0
---

# Multi-Worker Monorepo with pnpm Workspaces

Pattern for projects that ship N Workers + M shared packages — the canonical layout for the Lobbi Cloudflare Stack.

## Layout

```
my-platform/
├── apps/
│   ├── synth-agent/                  # Worker (DO)
│   ├── oauth-provider/               # Worker (cron, KV)
│   ├── methodology-mcp/              # Worker (MCP server)
│   ├── past-meetings-mcp/            # Worker (Vectorize)
│   ├── engagements-mcp/              # Worker (D1)
│   ├── roi-models-mcp/               # Worker (D1)
│   ├── deliverables-mcp/             # Worker (R2)
│   ├── r2-upload-proxy/              # Worker (R2 multipart)
│   └── stt-fallback-worker/          # Worker (Workers AI Whisper)
├── packages/
│   ├── shared-auth/                  # JWT verify, JWKS fetch
│   ├── shared-llm/                   # AI Gateway client
│   ├── shared-r2-helpers/            # R2 multipart utils
│   ├── shared-hyperdrive/            # postgres.js client wrapper
│   ├── shared-schemas/               # zod schemas
│   ├── shared-deliverable-template/  # PDF/docx templates
│   └── shared-test-fixtures/         # Vitest fixtures
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── .editorconfig
```

## Root files

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

`package.json` (root):
```json
{
  "name": "@workspace/root",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "pnpm -r typecheck",
    "deploy:staging": "pnpm -r deploy --env staging",
    "deploy:production": "pnpm -r deploy --env production"
  },
  "devDependencies": {
    "wrangler": "^4.20.0",
    "typescript": "^5.6.0",
    "eslint": "^9",
    "prettier": "^3"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["@cloudflare/workers-types"]
  }
}
```

## Shared package shape

`packages/shared-auth/package.json`:
```json
{
  "name": "@workspace/shared-auth",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": { "jose": "^5" },
  "devDependencies": { "vitest": "^2", "@cloudflare/workers-types": "^4" }
}
```

Workers can import the package by its **source TS** because Wrangler bundles via esbuild. No build step needed for shared packages — keep them as source.

## App package shape

`apps/synth-agent/package.json`:
```json
{
  "name": "@workspace/synth-agent",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@workspace/shared-auth": "workspace:*",
    "@workspace/shared-llm": "workspace:*",
    "@workspace/shared-schemas": "workspace:*"
  },
  "devDependencies": {
    "wrangler": "^4.20.0",
    "@cloudflare/workers-types": "^4",
    "@cloudflare/vitest-pool-workers": "^0.5",
    "vitest": "^2",
    "typescript": "^5.6"
  }
}
```

`apps/synth-agent/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types", "./worker-configuration"]
  },
  "include": ["src/**/*", "../../packages/*/src/**/*"]
}
```

The `include` line ensures TS sees shared-package sources during typecheck.

## Cross-Worker calls

Use **service bindings** for Worker-to-Worker RPC instead of HTTP fetch:

```jsonc
// apps/synth-agent/wrangler.jsonc
"services": [
  { "binding": "AUTH", "service": "oauth-provider" },
  { "binding": "MEETINGS", "service": "past-meetings-mcp" }
]
```

```typescript
const verified = await env.AUTH.fetch('https://internal/verify', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

For typed RPC (newer pattern), declare the called Worker as an `WorkerEntrypoint`:
```typescript
// apps/oauth-provider/src/index.ts
import { WorkerEntrypoint } from 'cloudflare:workers';

export class OAuthEntrypoint extends WorkerEntrypoint<Env> {
  async verify(token: string): Promise<{ userId: string } | null> { ... }
}
export default {
  fetch(req, env) { /* HTTP handler */ }
};
```

```typescript
// apps/synth-agent/src/index.ts
const { OAuthEntrypoint } = await import('@workspace/oauth-provider/types');
declare interface Env { AUTH: Service<OAuthEntrypoint> }

const result = await env.AUTH.verify(token);
```

## Common scripts

```bash
# Type-check everything
pnpm -r typecheck

# Test only the changed Worker
pnpm --filter '@workspace/synth-agent' test

# Run two Workers locally with service binding
pnpm --filter synth-agent dev --port 8787 &
pnpm --filter oauth-provider dev --port 8788

# Deploy a single Worker
pnpm --filter synth-agent deploy --env production
```

## Pitfalls

- **`workspace:*` resolves to a tarball if you run `pnpm install --prod`** — keep it dev-only or use `workspace:^`.
- **Shared package imports `@cloudflare/workers-types` as a dependency** — it should be `devDependencies` only; consumers add their own.
- **Bundler can't find a shared dep**: ensure the shared package has `"type": "module"` and the import path includes the `src/` filename or matches `exports`.
- **Different `compatibility_date` per Worker**: hard to reason about. Pin one date in a shared variable, sweep all `wrangler.jsonc` together.
- **`pnpm -r build` order**: pnpm respects `dependsOn` graph; if a Worker depends on a package that has its own build step, the package must declare `build` and the Worker run order will follow.
