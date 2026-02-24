---
name: tvs:identity-attestation
intent: Generate periodic access attestation packets for TAIA transition governance and due diligence
tags:
  - tvs-microsoft-deploy
  - command
  - identity-attestation
inputs: []
risk: medium
cost: medium
description: Generate periodic access attestation packets for TAIA transition governance and due diligence
allowed-tools:
  - Bash
  - Read
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Identity Access Attestation

Generates CSV + JSON audit artifacts for governance review and buyer due diligence.

## Usage

```bash
/tvs:identity-attestation --input exports/role-assignments.json --period 2026-Q1
```

## Command

```bash
python3 plugins/tvs-microsoft-deploy/scripts/generate_access_attestation.py \
  --input "${ROLE_ASSIGNMENT_EXPORT}" \
  --period "${ATTESTATION_PERIOD:-2026-Q1}" \
  --csv-output "${ATTESTATION_CSV:-reports/access-attestation.csv}" \
  --json-output "${ATTESTATION_JSON:-reports/access-attestation.json}"
```

## Outputs

- CSV attestation workbook (`pending` review state for each assignment)
- JSON audit report with TAIA assignment totals and timestamps

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
/tvs:identity-attestation --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:identity-attestation --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:identity-attestation --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:identity-attestation --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/identity-attestation.json --plan-id PLAN-SAFE-001
```

