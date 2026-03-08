---
name: tvs:status-check
intent: Health check using control-plane dry-run outputs as the verification source of truth
tags:
  - tvs-microsoft-deploy
  - command
  - status-check
inputs: []
risk: medium
cost: medium
description: Health check using control-plane dry-run outputs as the verification source of truth
allowed-tools:
  - Bash
  - Read
  - Grep
  - Task
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

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

## M365 operational output

After generating `status.dry-run.json`, emit both machine-readable and collaboration-ready outputs for Teams/Planner/SharePoint automation:

```bash
python plugins/tvs-microsoft-deploy/scripts/m365_operational_update.py \
  --event-type status-check \
  --input plugins/tvs-microsoft-deploy/control-plane/out/status.dry-run.json \
  --json-out plugins/tvs-microsoft-deploy/control-plane/out/status.m365.json \
  --ops-out plugins/tvs-microsoft-deploy/control-plane/out/status.ops-update.md
```

Use `status.m365.json` for system integrations and post `status.ops-update.md` to TAIA transition channels.

## Unified Command Contract

### Contract
- **Schema:** `../cli/command.schema.json`
- **Required shared arguments:** `--entity`, `--tenant`
- **Optional shared safety arguments:** `--strict`, `--dry-run`, `--export-json`, `--plan-id`
- **Error catalog:** `../cli/error-codes.json`
- **Operator remediation format:** `../cli/operator-remediation.md`

### Shared argument patterns
```text
--entity <tvs|consulting|taia|all>
--tenant <tenant-id>
--strict
--dry-run
--export-json <path>
--plan-id <plan-id>
```

### Unified examples
```bash
# TVS
/tvs:status-check --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:status-check --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:status-check --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:status-check --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/status-check.json --plan-id PLAN-SAFE-001
```

