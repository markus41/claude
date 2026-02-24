---
name: tvs:identity-drift
description: Detect Entra identity drift and produce remediation recommendations
allowed-tools:
  - Bash
  - Read
---

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
