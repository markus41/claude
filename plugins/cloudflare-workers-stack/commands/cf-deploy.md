---
name: cf-deploy
intent: Deploy a Worker with versioned uploads, secrets, and gradual rollouts via Wrangler 4
tags:
  - cloudflare-workers-stack
  - command
  - deploy
inputs: []
risk: high
cost: medium
description: Deploy a Worker with versioned uploads, secrets, and gradual rollouts via Wrangler 4
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Deploy Cloudflare Worker

## Standard deploy

```bash
wrangler deploy
wrangler deploy --env staging
wrangler deploy --env production
```

This:
1. Builds (esbuild bundles the worker)
2. Uploads new version
3. Creates a deployment that routes 100% of traffic to the new version
4. Returns the deployment URL

## Versioned uploads (gradual rollout)

```bash
# Upload without routing traffic
wrangler versions upload --tag v1.4.0 --message "Add transcript chunking"

# List recent versions
wrangler versions list

# Deploy a specific version with a percentage split
wrangler versions deploy v1.4.0=10% v1.3.7=90%

# Promote to 100% after observation
wrangler versions deploy v1.4.0=100%

# Roll back instantly
wrangler rollback --version-id <id>
```

## Secrets (per-environment)

```bash
# Add a secret interactively
wrangler secret put OPENAI_API_KEY
wrangler secret put OPENAI_API_KEY --env staging

# Bulk from JSON
echo '{"K1":"v1","K2":"v2"}' | wrangler secret bulk

# List
wrangler secret list

# Delete
wrangler secret delete OPENAI_API_KEY
```

Never commit secrets to `wrangler.jsonc` `vars`. `vars` are public; secrets are encrypted at rest.

## Custom domains and routes

In `wrangler.jsonc`:
```jsonc
{
  "routes": [
    { "pattern": "api.example.com/*", "zone_name": "example.com" }
  ]
}
```
Or attach a custom domain in the dashboard / via API. Routes are pattern-based; custom domains include automatic certificate management.

## CI deploy (GitHub Actions)

```yaml
- name: Deploy
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: ./apps/synth-agent
    command: deploy --env production
```

The API token needs **Workers Scripts: Edit**, plus per-resource scopes (D1, KV, R2, Vectorize) for whatever the worker uses.

## Pre-flight checklist

- [ ] `wrangler.jsonc` `compatibility_date` matches what was tested
- [ ] All secrets set for the target environment
- [ ] DO migrations declared (see `cf-durable-object`)
- [ ] D1 migrations applied: `wrangler d1 migrations apply DB --env production`
- [ ] No `vars` contain credentials
- [ ] Tail logs in one terminal during the rollout: `wrangler tail`

## Rollback playbook

1. `wrangler versions list` → find the last known-good version ID
2. `wrangler rollback --version-id <id>` → 100% traffic to that version
3. Investigate; secrets and bindings revert with the version
