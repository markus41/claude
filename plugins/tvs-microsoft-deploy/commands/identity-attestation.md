---
name: tvs:identity-attestation
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
