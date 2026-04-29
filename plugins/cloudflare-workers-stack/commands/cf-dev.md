---
name: cf-dev
intent: Run Wrangler dev with Miniflare 4 local D1, KV, R2, Vectorize simulators
tags:
  - cloudflare-workers-stack
  - command
  - dev
inputs: []
risk: low
cost: low
description: Run Wrangler dev with Miniflare 4 local D1, KV, R2, Vectorize simulators
allowed-tools:
  - Bash
  - Read
---

# Local Dev with Wrangler 4 / Miniflare 4

```bash
wrangler dev                                    # current app
wrangler dev --local                            # explicit local-only (no remote bindings)
wrangler dev --port 8788                        # custom port
wrangler dev --remote                           # talk to real bindings (counts toward usage)
wrangler dev --env staging                      # env-specific config
```

## Local resource simulators

Wrangler 4 ships Miniflare 4 — full local simulators for:

- **KV**: in-memory + persisted to `.wrangler/state/v3/kv/`
- **R2**: persisted to `.wrangler/state/v3/r2/`
- **D1**: SQLite file in `.wrangler/state/v3/d1/`
- **Durable Objects**: SQLite-backed, persisted in `.wrangler/state/v3/do/`
- **Cache API, Queues, Email**: simulated
- **Vectorize**: requires `--remote` (no local sim yet)
- **Hyperdrive**: uses `localConnectionString` from `wrangler.jsonc`
- **AI**: requires `--remote` (or mock with `wrangler.jsonc` `ai.experimental_remote: true`)

## Multi-worker dev (service bindings)

When app A calls app B via service binding, run them together:
```bash
# In two terminals
pnpm --filter synth-agent dev --port 8787
pnpm --filter oauth-provider dev --port 8788
```
Then `wrangler.jsonc` of synth-agent:
```jsonc
"services": [{ "binding": "AUTH", "service": "oauth-provider" }]
```
Wrangler dev auto-discovers the sibling worker on `localhost`.

## Cron triggers locally

```bash
wrangler dev --test-scheduled
# In another terminal:
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## Tail logs of deployed worker

```bash
wrangler tail synth-agent --format pretty
wrangler tail synth-agent --status error
wrangler tail synth-agent --search "user_id=42"
```

## Inspecting local state

```bash
wrangler kv key list --binding KV --local
wrangler d1 execute DB --local --command "SELECT * FROM users LIMIT 10"
wrangler r2 object list my-bucket --local
```

## Reset local state

```bash
rm -rf .wrangler/state
```
