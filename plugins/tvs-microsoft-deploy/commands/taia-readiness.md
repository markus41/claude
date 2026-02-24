---
name: tvs:taia-readiness
description: TAIA wind-down and FMO sale readiness scorecard
allowed-tools:
  - Bash
  - Read
  - Write
  - Task
---

# TAIA Readiness

Purpose-built readiness check for TAIA sale prep, identity wind-down, and archive completion.

## Usage

```bash
/tvs:taia-readiness [--strict] [--export-md] [--export-json]
```

## Preconditions

```bash
# 1) Ensure TAIA tenant context
[ "$AZURE_TENANT_ID" = "$TAIA_TENANT_ID" ] || {
  echo "FAIL: Switch to TAIA tenant context first"; exit 1;
}

# 2) Required tokens
[ -n "$GRAPH_TOKEN" ] || { echo "FAIL: GRAPH_TOKEN missing"; exit 1; }
[ -n "$FABRIC_TOKEN" ] || { echo "FAIL: FABRIC_TOKEN missing"; exit 1; }

# 3) Optional but recommended
az account show --query name -o tsv >/dev/null || echo "WARN: az login not active"
```

## Scorecard Areas

1. **Identity Wind-down**
   - All non-breakglass TAIA user accounts disabled or migration-tagged
   - Legacy app consents revoked
   - Shared mailbox retention/export complete

2. **Data Archive Completeness**
   - A3 Firebase extraction complete
   - Archive validation notebook passed (`a3_archive_validate.ipynb`)
   - Carrier normalization final export produced

3. **Buyer Package Readiness**
   - Buyer report published
   - Reconciliation workbook signed off
   - Data room permissions restricted to approved principals

4. **Operational Safety**
   - Decommission runbook approved
   - Backout checkpoint documented
   - Support transition draft complete

## Execution

Prefer script mode when available:

```bash
bash plugins/tvs-microsoft-deploy/scripts/taia_readiness_check.sh --entity taia --format table
```

Then produce a concise summary with:
- Overall score (0-100)
- Red/yellow/green for each area
- Top 5 blockers and owners
- Recommended next 72-hour action plan

## Outputs

- `plugins/tvs-microsoft-deploy/reports/taia-readiness-<timestamp>.md`
- `plugins/tvs-microsoft-deploy/reports/taia-readiness-<timestamp>.json` (optional)

## See Also

- `/tvs:extract-a3`
- `/tvs:normalize-carriers`
- `workflows/taia-sale-prep.md`
- `workflows/taia-day0-day30.md`
