---
name: tvs:orchestrate-planner
intent: Full lifecycle Planner orchestration for workflow templates and live plans
tags:
  - tvs-microsoft-deploy
  - command
  - orchestrate-planner
inputs: []
risk: medium
cost: medium
description: Full lifecycle Planner orchestration for workflow templates and live plans
allowed-tools:
  - Bash
  - Read
  - Write
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Orchestrate Planner

Operational command for template-driven Planner orchestration, dependency validation,
blocker tracking, and closeout evidence packaging.

## Usage

```bash
/tvs:orchestrate-planner <operation> --workflow <path> [options]
```

Core runner:

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py <operation> --workflow <path> [...]
```

## Operations

### `init-plan`
Creates a plan, creates one bucket per workflow phase, and seeds phase task templates into Planner.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py init-plan \
  --workflow plugins/tvs-microsoft-deploy/workflows/templates/planner/taia-sale-prep.workflow.json \
  --group-id <m365-group-id> \
  --plan-title "TAIA Sale Prep" \
  --output plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.initialized.json
```

### `sync-workflow`
Pulls live task state from Planner and updates each phase to `pending|in-progress|blocked|completed`.
Also writes dependency validation findings to `metadata.dependencyIssues`.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py sync-workflow \
  --workflow plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.initialized.json \
  --output plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.synced.json
```

### `advance-phase`
Sets the active phase and propagates task lifecycle (`percentComplete` + blocker label handling) across all phase buckets.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py advance-phase \
  --workflow plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.synced.json \
  --phase TEST \
  --output plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.test-phase.json
```

### `blocker-report`
Builds a structured blocker report listing blocked tasks, owning groups/users, and SLA context.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py blocker-report \
  --workflow plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.synced.json \
  --output plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.blockers.json
```

### `closeout-pack`
Generates a delivery closeout pack with phase completion summary, dependency violations,
SLA context, and evidence inventory per phase.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py closeout-pack \
  --workflow plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.synced.json \
  --output plugins/tvs-microsoft-deploy/control-plane/out/taia-sale-prep.closeout.json
```

## Dry-run mode

Use `--dry-run` to validate orchestration flows without modifying Planner.

```bash
python plugins/tvs-microsoft-deploy/scripts/orchestrate_planner.py init-plan \
  --workflow plugins/tvs-microsoft-deploy/workflows/templates/planner/migration-wave.workflow.json \
  --group-id 00000000-0000-0000-0000-000000000000 \
  --plan-title "Migration Wave - Dry Run" \
  --dry-run
```
