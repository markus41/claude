# Fabric pipeline lineage

## Dataset lineage

1. `firebase_extract` + `dataverse_snapshot` + `external_file_drop`
2. Bronze tables (`br_*_raw`)
3. Silver conformed entities (`sv_*`)
4. Gold certified buyer-facing datasets (`gd_*`)

## Notebook-to-pipeline mapping

- `a3_archive_validate.ipynb` -> `pl_a3_archive_ingestion`
- `tvs_curated_transform.ipynb` -> `pl_commission_normalization`
- `consulting_pipeline.ipynb` -> `pl_consulting_alignment`
- `consolidated_rollup.ipynb` -> `pl_consolidated_reporting`

## Failure handling

- Any failed stage emits a failure event to Teams and email distribution from `orchestration.yaml`.
- Downstream pipelines do not execute on upstream failure.
- Readiness state is blocked until quality checks pass in `fabric/quality/`.
