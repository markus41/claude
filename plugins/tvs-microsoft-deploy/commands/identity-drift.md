---
name: tvs:identity-drift
description: Detect Entra identity drift and produce remediation recommendations
allowed-tools:
  - Bash
  - Read
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Identity Drift Detection

Runs tenant identity drift scans for stale app credentials, orphaned service principals, and over-privileged Graph scopes.

## Usage

```bash
/tvs:identity-drift --inventory identity-inventory.json --output reports/identity-drift.json
```

## Command

```bash
python3 plugins/tvs-microsoft-deploy/scripts/identity_drift_detect.py \
  --inventory "${IDENTITY_INVENTORY_FILE}" \
  --output "${IDENTITY_DRIFT_REPORT:-reports/identity-drift.json}"
```

## Findings Categories

- `stale_secret`: client secret age exceeds threshold (default 180 days)
- `stale_certificate`: app certificate age exceeds threshold (default 365 days)
- `orphaned_service_principal`: SP has no backing app registration
- `overprivileged_scope`: Graph scopes ending in `.ReadWrite.All`

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
/tvs:identity-drift --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:identity-drift --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:identity-drift --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:identity-drift --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/identity-drift.json --plan-id PLAN-SAFE-001
```

