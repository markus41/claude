---
name: tvs:status-check
description: Health check using control-plane dry-run outputs as the verification source of truth
allowed-tools:
  - Bash
  - Read
  - Grep
  - Task
---

# Status Check

Read-only health validation driven by control-plane outputs.

## Usage

```bash
/tvs:status-check [--env dev|test|prod] [--taia-wind-down]
```

## Control-plane first

```bash
BASE=plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml
OVERLAY=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-dev}.yaml

node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest "$BASE" \
  --overlay "$OVERLAY" \
  ${TAIA_WIND_DOWN:+--overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/taia-wind-down.yaml} \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/status.dry-run.json
```

`status.dry-run.json` defines the exact resource set to check; skip ad hoc/manual discovery.

## Verification sequence

1. Validate all `identity` resources.
2. Validate all `data-platform` resources.
3. Validate all `app-platform` resources.
4. Validate all `collaboration-services` resources.

Report health by resource ID from the plan output so deploy/status use the same contract.
