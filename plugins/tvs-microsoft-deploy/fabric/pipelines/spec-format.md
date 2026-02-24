# Fabric Ad Hoc Pipeline Specification Format

This document defines the JSON/YAML structure consumed by `scripts/fabric/create_adhoc_pipeline.py` and `scripts/fabric/run_adhoc_pipeline.py`.

## Required root fields

- `pipeline_id`: globally unique id (e.g. `pl_dataverse_daily_sync`)
- `display_name`: human-readable name
- `workspace_id`: Fabric workspace id
- `sources`: list of source objects
- `transforms`: ordered list of transform steps
- `sinks`: list of write destinations
- `schedule`: cadence and runtime constraints
- `quality_rules`: gates that can fail the run
- `lineage`: ownership and upstream/downstream declarations

## YAML example

```yaml
pipeline_id: pl_dataverse_daily_sync
display_name: Dataverse to Lakehouse Daily Sync
workspace_id: ws-tvs-prod-00000001
sources:
  - id: src_account
    type: dataverse
    object: account
    connection_ref: dataverse-prod
    watermark_column: modifiedon
transforms:
  - id: tr_normalize
    type: notebook
    notebook_path: fabric/notebooks/tvs_curated_transform.ipynb
    timeout_minutes: 60
sinks:
  - id: sink_account_delta
    type: lakehouse_table
    lakehouse_id: lh-tvs-raw
    target: Tables/dv_account
    mode: merge
schedule:
  frequency: daily
  cron_utc: "0 3 * * *"
  timezone: UTC
  retry:
    max_attempts: 4
    initial_backoff_seconds: 30
    max_backoff_seconds: 600
quality_rules:
  - id: qr_non_empty
    type: row_count
    operator: ">="
    threshold: 1
    severity: error
  - id: qr_freshness
    type: freshness_minutes
    operator: "<="
    threshold: 180
    severity: warning
lineage:
  owner: dataops@tvs.example
  domain: fabric-platform
  upstream:
    - dataverse/account
  downstream:
    - semantic-model/client360
  tags:
    - ad-hoc
    - dataverse
```

## JSON example

```json
{
  "pipeline_id": "pl_taia_archive_import",
  "display_name": "TAIA Archive Import",
  "workspace_id": "ws-a3archive-prod-00000005",
  "sources": [
    {
      "id": "src_archive",
      "type": "adls_gen2",
      "object": "/a3-archive/exports/",
      "connection_ref": "adls-archive"
    }
  ],
  "transforms": [
    {
      "id": "tr_validate",
      "type": "notebook",
      "notebook_path": "fabric/notebooks/a3_archive_validate.ipynb",
      "timeout_minutes": 90
    }
  ],
  "sinks": [
    {
      "id": "sink_archive_raw",
      "type": "lakehouse_table",
      "lakehouse_id": "lh-a3-archive",
      "target": "Tables/archive_commission_raw",
      "mode": "append"
    }
  ],
  "schedule": {
    "frequency": "adhoc",
    "cron_utc": null,
    "timezone": "UTC",
    "retry": {
      "max_attempts": 3,
      "initial_backoff_seconds": 60,
      "max_backoff_seconds": 900
    }
  },
  "quality_rules": [
    {
      "id": "qr_archive_schema",
      "type": "schema_match",
      "operator": "=",
      "threshold": 1,
      "severity": "error"
    }
  ],
  "lineage": {
    "owner": "taia-ops@tvs.example",
    "domain": "taia-archive",
    "upstream": [
      "firebase/export"
    ],
    "downstream": [
      "lakehouse/archive_commission_raw"
    ],
    "tags": [
      "ad-hoc",
      "archive"
    ]
  }
}
```
