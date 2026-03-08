---
name: Fabric Pipeline Authoring
description: Use this skill when designing or executing ad hoc Fabric data pipelines under fabric/pipelines/** or scripts/fabric/**, including template generation, retry strategy, quality rules, and lineage requirements.
version: 1.0.0
---

> Docs Hub: [Skills Hub](../docs/skills/README.md#skill-index)

# Fabric Pipeline Authoring

## Scope

Use this skill for:

- Building ad hoc pipeline specs in JSON/YAML.
- Generating pipeline specs from curated templates.
- Running ad hoc notebook-based transforms with guarded retries.
- Applying lineage and quality requirements before deployment.

## Authoring Workflow

1. Pick a baseline template from `fabric/pipelines/templates/`.
2. Generate a pipeline file with `scripts/fabric/create_adhoc_pipeline.py`.
3. Verify required sections: `sources`, `transforms`, `sinks`, `schedule`, `quality_rules`, `lineage`.
4. Include notebook `notebook_id` values for executable transforms.
5. Dry-run with `scripts/fabric/run_adhoc_pipeline.py --dry-run`.
6. Execute with `FABRIC_TOKEN` set, then monitor run IDs via Fabric jobs APIs.

## Design Patterns

### 1) TAIA archive import

- Source: ADLS/Firebase export landing path.
- Transform: schema validation notebook first.
- Sink: append-only raw table for replay safety.
- Quality: schema_match + minimum row count.

### 2) Dataverse to lakehouse sync

- Source: Dataverse entities with watermark (`modifiedon`).
- Transform: normalization notebook.
- Sink: merge mode tables keyed on Dataverse IDs.
- Quality: duplicate-rate + freshness SLA.

### 3) Client KPI mart generation

- Source: conformed sales/commission OneLake tables.
- Transform: consolidated rollup notebook.
- Sink: curated gold mart table (overwrite by partition/date).
- Quality: metric coverage + null-rate thresholds.

## Retry Strategy

- Retry on `429` and transient `5xx` only.
- Start at `30-60s` backoff, doubling per attempt.
- Cap backoff at `10-20m`.
- Typical limits:
  - recurring hourly: `max_attempts=4`
  - daily/adhoc heavy jobs: `max_attempts=3`

## Lineage Requirements

Each spec must declare:

- `lineage.owner`: team mailbox or on-call alias.
- `lineage.domain`: business or platform area.
- `lineage.upstream`: all external input systems/tables.
- `lineage.downstream`: marts, semantic models, reports.
- `lineage.tags`: searchable labels (`ad-hoc`, `recurring`, domain tags).

If lineage is incomplete, do not promote the pipeline to recurring schedule.
