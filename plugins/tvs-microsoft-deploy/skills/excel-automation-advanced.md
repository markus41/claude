---
name: Advanced Excel Workbook Automation
description: Use this skill for large workbook processing, Office Scripts integration, Graph workbook APIs, and reconciliation pipelines.
version: 1.0.0
---

# Advanced Excel Workbook Automation

## Focus
- Large multi-sheet workbook profiling (>50MB, >100k rows/sheet).
- Formula lineage checks and broken reference detection.
- Controlled transformation + reconciliation before Fabric ingestion.

## Recommended Workflow
1. Profile workbook structure and formulas (`scripts/excel_workbook_profile.py`).
2. Flag high-risk sheets (volatile formulas, external links, hidden tabs).
3. Execute Office Script or Graph workbook operations in chunks.
4. Export normalized datasets to Parquet/CSV for Fabric staging.
5. Attach validation report to TAIA readiness evidence.

## Performance Rules
- Chunk row operations by 2k-10k range.
- Avoid full workbook recalc per operation.
- Persist intermediate snapshots for retry safety.

## References
- `agents/excel-fabric-agent.md`
- `workflows/taia-sale-prep.md`
