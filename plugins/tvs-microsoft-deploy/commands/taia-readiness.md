---
name: tvs:taia-readiness
description: TAIA transition readiness check driven by control-plane wind-down overlay
allowed-tools:
  - Bash
  - Read
  - Grep
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# TAIA Readiness

Assesses TAIA wind-down and target-state readiness using the same control-plane manifest model.

## Usage

```bash
/tvs:taia-readiness [--env dev|test|prod]
```

## Plan generation

```bash
BASE=plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml
ENV_OVERLAY=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-prod}.yaml
WIND_DOWN=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/taia-wind-down.yaml

node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest "$BASE" \
  --overlay "$ENV_OVERLAY" \
  --overlay "$WIND_DOWN" \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/taia-readiness.json
```

## Readiness gates

- All resources tagged/affected by wind-down have explicit `pause` or `decommission` operations.
- Non-TAIA core resources remain in planned `create`/`update` operations.
- No dependency cycles or cross-phase violations.

Use `taia-readiness.json` as the readiness artifact for sale-prep reviews.

## Data quality gates

Run TAIA metric reconciliation checks before declaring readiness:

```bash
python plugins/tvs-microsoft-deploy/scripts/taia_readiness_checks.py \
  --metrics plugins/tvs-microsoft-deploy/fabric/quality/current_metrics.json \
  --thresholds plugins/tvs-microsoft-deploy/fabric/quality/taia_thresholds.json
```

The command fails readiness when carrier counts, commission variance, agent hierarchy consistency, workbook quality score, or workbook gate pass-rate breach policy thresholds. The script emits an explicit 0-100 readiness score for review boards.

Workbook gates should be generated first and summarized into metrics:

```bash
python scripts/excel/analyze_workbook.py --workbook data/carriers/commission_reconciliation.xlsx --profile commission_reconciliation --output plugins/tvs-microsoft-deploy/control-plane/out/commission_reconciliation.quality.json
python scripts/excel/analyze_workbook.py --workbook data/carriers/carrier_mapping.xlsx --profile carrier_mapping --output plugins/tvs-microsoft-deploy/control-plane/out/carrier_mapping.quality.json
```

## M365 operational output

After generating `taia-readiness.json`, emit machine-readable and collaboration-ready outputs for automated Teams posts, Planner tasks, approvals, and SharePoint checklist updates:

```bash
python plugins/tvs-microsoft-deploy/scripts/m365_operational_update.py \
  --event-type taia-readiness \
  --input plugins/tvs-microsoft-deploy/control-plane/out/taia-readiness.json \
  --json-out plugins/tvs-microsoft-deploy/control-plane/out/taia-readiness.m365.json \
  --ops-out plugins/tvs-microsoft-deploy/control-plane/out/taia-readiness.ops-update.md
```

Use `taia-readiness.m365.json` for workflow automation and `taia-readiness.ops-update.md` for transition-room collaboration updates.

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
/tvs:taia-readiness --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:taia-readiness --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:taia-readiness --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:taia-readiness --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/taia-readiness.json --plan-id PLAN-SAFE-001
```

