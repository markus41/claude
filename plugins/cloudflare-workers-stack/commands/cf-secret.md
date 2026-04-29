---
name: cf-secret
intent: Manage Cloudflare Worker secrets per-environment with wrangler secret put / bulk
tags:
  - cloudflare-workers-stack
  - command
  - security
inputs: []
risk: medium
cost: low
description: Manage Cloudflare Worker secrets per-environment with wrangler secret put / bulk
allowed-tools:
  - Bash
  - Read
---

# Worker Secrets

Secrets are encrypted at rest and surface as env vars at runtime. They are **scoped per Worker per environment**.

## Set / update

```bash
# Interactive (prompts for value, doesn't echo)
wrangler secret put OPENAI_API_KEY
wrangler secret put OPENAI_API_KEY --env staging

# Pipe (CI)
echo "$OPENAI_API_KEY" | wrangler secret put OPENAI_API_KEY --env production

# Bulk (JSON object)
wrangler secret bulk < secrets.json
# secrets.json: { "OPENAI_API_KEY": "sk-...", "DEEPGRAM_KEY": "..." }
```

## List / delete

```bash
wrangler secret list
wrangler secret list --env production
wrangler secret delete OPENAI_API_KEY --env staging
```

## Read in code

```typescript
export interface Env {
  OPENAI_API_KEY: string;     // populated at runtime
  STAGE: string;              // public var, defined in wrangler.jsonc `vars`
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return new Response(`stage=${env.STAGE}, has-key=${!!env.OPENAI_API_KEY}`);
  }
};
```

## Per-environment secrets pattern

Different secrets per env (dev / staging / production):

```bash
wrangler secret put DB_URL --env dev
wrangler secret put DB_URL --env staging
wrangler secret put DB_URL --env production
```

`wrangler.jsonc`:
```jsonc
{
  "name": "synth-agent",
  "env": {
    "staging": {
      "vars": { "STAGE": "staging" },
      "kv_namespaces": [{ "binding": "KV", "id": "staging-kv-id" }]
    },
    "production": {
      "vars": { "STAGE": "production" },
      "kv_namespaces": [{ "binding": "KV", "id": "prod-kv-id" }]
    }
  }
}
```

Bindings can also differ by env (different KV namespace ids, R2 buckets, etc.).

## Local dev secrets

Wrangler doesn't read your real secrets locally. Provide them via `.dev.vars`:

```
# .dev.vars (gitignored!)
OPENAI_API_KEY=sk-test-key
DEEPGRAM_KEY=local-mock
```

`wrangler dev` auto-loads `.dev.vars`. **Add `.dev.vars` to `.gitignore`.**

## CI secret rotation

```bash
# rotate-secrets.sh
set -euo pipefail
NEW_KEY=$(get-from-vault openai)
echo "$NEW_KEY" | wrangler secret put OPENAI_API_KEY --env production
```

Run after every key rotation event. Pair with `wrangler tail` to verify nothing is using the old key (look for 401s).

## Audit

```bash
wrangler secret list --env production
```

Returns names only; values are never recoverable via the CLI. If you lose a value, you must rotate.

## Don't

- Don't commit `.dev.vars`
- Don't put secrets in `wrangler.jsonc` `vars` — those are public
- Don't `console.log(env.OPENAI_API_KEY)` — even in dev, `wrangler tail` will echo it
- Don't share an API token with `Workers Secret: Edit` more broadly than needed
