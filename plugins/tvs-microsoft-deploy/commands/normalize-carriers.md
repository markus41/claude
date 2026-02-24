---
name: tvs:normalize-carriers
description: Carrier normalization sprint for TAIA FMO sale preparation
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Task
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Normalize Carriers

Carrier normalization sprint for TAIA FMO sale preparation. Deduplicates carrier names, normalizes commission structures, and maps agent hierarchies from A3 legacy data.

## Usage

```bash
/tvs:normalize-carriers [--dry-run] [--collection=carriers|commissions|all]
```

## Prerequisites

```bash
# Verify A3 extraction is complete (must run /tvs:extract-a3 first)
python3 plugins/tvs-microsoft-deploy/scripts/api/fabric_request.py "/workspaces/$A3_ARCHIVE_WS_ID/lakehouses" --entity "${TVS_ENTITY:-tvs}" | jq '.value | length'

# Verify carrier data exists in a3_archive lakehouse
echo "Carrier records must be present in a3_archive/ lakehouse"
```

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance

### Phase 1: EXPLORE (2 agents)

**Agent 1: carrier-normalization-agent** (opus)
- Analyze carrier data from a3_archive/ lakehouse
- Identify unique carrier name variations and frequencies
- Map commission structure patterns across carriers

**Agent 2: analytics-agent** (opus)
- Query a3_archive/ lakehouse for carrier statistics
- Generate carrier name frequency distribution
- Report data quality issues (nulls, invalid formats)

### Phase 2: PLAN (1 agent)

**Agent: carrier-normalization-agent** (opus)
- Design normalization mapping table (variant -> canonical name)
- Define commission structure schema (base rate, override, bonus tiers)
- Plan agent hierarchy mapping (upline/downline relationships)
- Define fuzzy matching thresholds (Levenshtein distance, Jaro-Winkler)

### Phase 3: CODE (3 agents)

**Agent 1: carrier-normalization-agent** (opus)
- Implement fuzzy matching algorithm for carrier name deduplication
- Create canonical carrier mapping with confidence scores

**Agent 2: data-agent** (sonnet)
- Create normalized Dataverse tables for carrier master data
- Implement lookup relationships between carriers, commissions, agents

**Agent 3: michelle-scripts-agent** (haiku)
- Generate Excel Office Scripts for manual review of edge cases
- Create pivot table scripts for carrier commission summaries

### Phase 4: TEST (2 agents)

**Agent 1: carrier-normalization-agent** (opus)
- Validate normalization completeness (no orphaned records)
- Verify commission totals match pre-normalization sums
- Check referential integrity

**Agent 2: analytics-agent** (opus)
- Run a3_archive_validate notebook for reconciliation
- Compare record counts pre vs post normalization

### Phase 5: FIX (1 agent)

**Agent: carrier-normalization-agent** (opus)
- Resolve low-confidence fuzzy matches
- Fix broken referential integrity

### Phase 6: DOCUMENT (1 agent)

**Agent: carrier-normalization-agent** (opus)
- Generate carrier normalization report for buyer due diligence
- Document mapping decisions and confidence levels
- Export summary to taia-sale-prep workflow


## Workbook quality gates (required)

Before Phase 4 testing, score workbook quality gates for carrier mapping and commission reconciliation artifacts:

```bash
python scripts/excel/analyze_workbook.py \
  --workbook data/carriers/carrier_mapping.xlsx \
  --profile carrier_mapping \
  --output plugins/tvs-microsoft-deploy/control-plane/out/carrier_mapping.quality.json

python scripts/excel/analyze_workbook.py \
  --workbook data/carriers/commission_reconciliation.xlsx \
  --profile commission_reconciliation \
  --output plugins/tvs-microsoft-deploy/control-plane/out/commission_reconciliation.quality.json
```

Normalize and export only when both workbook scores are >= 90 and all workbook gates pass:

```bash
python scripts/excel/normalize_workbook.py --input data/carriers/carrier_mapping.xlsx --output out/carrier_mapping.normalized.xlsx
python scripts/excel/export_to_dataverse.py --workbook out/carrier_mapping.normalized.xlsx --sheet CarrierMap --table tvs_carriermap --output out/carrier_mapping.dataverse.ndjson
python scripts/excel/export_to_fabric.py --workbook out/carrier_mapping.normalized.xlsx --sheet CarrierMap --output-dir out/fabric_carrier_mapping
```

## Output

```
Carriers Processed:     156
Unique After Merge:     87
Commission Records:     12,450
Agent Hierarchies:      234
Data Quality Score:     94.2%
```

## See Also

- `/tvs:extract-a3` — Must run first to populate a3_archive
- `workflows/taia-sale-prep.md` — Parent workflow for FMO sale

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
/tvs:normalize-carriers --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:normalize-carriers --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:normalize-carriers --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:normalize-carriers --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/normalize-carriers.json --plan-id PLAN-SAFE-001
```

