---
name: Wrangler Config
description: Use when the user asks about wrangler.jsonc / wrangler.toml, compatibility flags, environments, observability, or any Cloudflare Worker configuration field.
version: 0.1.0
---

# Wrangler 4 Configuration

`wrangler.jsonc` is the modern format (JSON with comments). `wrangler.toml` still works but new fields land in JSONC first. One config file per Worker.

## Essential fields

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "my-worker",                          // unique within account
  "main": "src/index.ts",                       // entry
  "compatibility_date": "2026-04-15",           // pin a date
  "compatibility_flags": ["nodejs_compat"],     // optional flags
  "account_id": "abc123...",                    // optional; otherwise from API token
  "workers_dev": true,                          // *.workers.dev preview URL
  "observability": { "enabled": true },         // log retention in dashboard
  "minify": true,                               // recommended for prod
  "preserve_file_names": false,
  "no_bundle": false                            // let wrangler bundle (default)
}
```

## `compatibility_date`

Pins the runtime feature set. Bumping it can change behavior (URL parsing, TLS defaults, fetch semantics). For a monorepo, pin the **same date everywhere** and bump in a single PR with tests.

## `compatibility_flags` you'll likely want

| Flag | Why |
|------|-----|
| `nodejs_compat` | Node API polyfills (`Buffer`, `process`, parts of `node:fs`, `crypto`, `path`) |
| `nodejs_als` | `AsyncLocalStorage` (often pulled in by tracing libs) |
| `streams_enable_constructors` | Web `ReadableStream` constructors with full `BYOB` reader |
| `experimental` | Various opt-ins; consult docs before adding |

## Environments

```jsonc
{
  "name": "my-worker",
  "vars": { "STAGE": "dev" },
  "env": {
    "staging": {
      "vars": { "STAGE": "staging" },
      "kv_namespaces": [{ "binding": "KV", "id": "staging-kv-id" }],
      "routes": [{ "pattern": "staging-api.example.com/*", "zone_name": "example.com" }]
    },
    "production": {
      "vars": { "STAGE": "production" },
      "kv_namespaces": [{ "binding": "KV", "id": "prod-kv-id" }],
      "routes": [{ "pattern": "api.example.com/*", "zone_name": "example.com" }]
    }
  }
}
```

Top-level fields are the **default** environment. Each named env **inherits then overrides**. If you set bindings only in one env, the other has none — be explicit.

## Triggers

```jsonc
{
  "triggers": { "crons": ["0 */6 * * *", "0 0 * * 0"] }
}
```

```jsonc
{
  "queues": {
    "producers": [{ "binding": "JOBS", "queue": "transcription-jobs" }],
    "consumers": [{
      "queue": "transcription-jobs",
      "max_batch_size": 10,
      "max_batch_timeout": 5,
      "max_retries": 3,
      "dead_letter_queue": "transcription-jobs-dlq"
    }]
  }
}
```

## Routes vs Custom Domains vs `*.workers.dev`

| Mode | When | Setup |
|------|------|-------|
| `*.workers.dev` | Default preview | `workers_dev: true` |
| Routes | Existing zone | `routes: [{ pattern, zone_name }]` |
| Custom Domain | New CNAME you control | Via dashboard or API; auto-cert |

A single Worker can have multiple routes. Routes are matched by URL pattern; first-match wins per zone.

## Static assets

```jsonc
{
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  }
}
```
Assets are served by Cloudflare's edge before invoking your Worker. Use `binding` if you need to fetch from JS via `env.ASSETS.fetch()`.

## TypeScript types

```bash
wrangler types       # writes worker-configuration.d.ts based on bindings
```

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["@cloudflare/workers-types", "./worker-configuration"]
  }
}
```

## Pitfalls

- **`compatibility_date` in the past, broken behavior**: bump and test. Keep one PR per bump.
- **Forgetting `nodejs_compat`** when a dep imports `node:crypto` or `node:buffer`: deploy will succeed, runtime will throw `Module not found`.
- **Per-env config drift**: routes in one env, missing in another. Use a script to validate.
- **`no_bundle: true`** with multiple files: Workers expects ESM modules; you must bundle externally.
