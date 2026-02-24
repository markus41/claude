---
name: tvs:deploy-all
description: Full platform deployment orchestrated from control-plane manifests and overlays
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Full Platform Deployment

Deploy all tenant-scoped resources through the control-plane planner (no manual phase sequencing).

## Usage

```bash
/tvs:deploy-all [--env dev|test|prod] [--overlay <path>] [--dry-run] [--taia-wind-down]
```

## Plan generation (required)

```bash
BASE=plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml
ENV_OVERLAY=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-dev}.yaml
TAIA_OVERLAY=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/taia-wind-down.yaml

# Dry-run plan
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest "$BASE" \
  --overlay "$ENV_OVERLAY" \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/deploy.dry-run.json

# Execution plan
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest "$BASE" \
  --overlay "$ENV_OVERLAY" \
  ${TAIA_WIND_DOWN:+--overlay "$TAIA_OVERLAY"} \
  --mode execute \
  --out plugins/tvs-microsoft-deploy/control-plane/out/deploy.execute.json
```

## Identity guardrails (required before phase execution)

```bash
python3 plugins/tvs-microsoft-deploy/scripts/identity_policy_checks.py --json
```

If any deny findings are returned, deployment is blocked by `hooks/identity-policy-engine.sh`.

## Execution contract

Execute strictly in planner phase order:

1. `identity`
2. `data-platform`
3. `app-platform`
4. `collaboration-services`

Each step in `deploy.execute.json` maps to one resource action with explicit dependencies.

## Command wiring

- Identity resources trigger `/tvs:deploy-identity` handlers.
- Data platform resources trigger `/tvs:deploy-azure`, `/tvs:deploy-dataverse`, and `/tvs:deploy-fabric` handlers.
- App platform resources trigger `/tvs:deploy-portal` and automation deployment scripts.
- Collaboration resources trigger `/tvs:deploy-teams` handlers.

Do not run handlers outside resources enumerated by the execution plan.
