---
name: tvs:deploy-planner
description: Deploy and synchronize Planner-based orchestration boards for TAIA workflows
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
---

# Planner Orchestration Deployment

## Usage

```bash
/tvs:deploy-planner --workflow taia-sale-prep --group-id <group-id> [--dry-run]
```

## Steps
1. Validate Graph auth + tenant context.
2. Create or update Planner plan from workflow template.
3. Upsert buckets for standard phases.
4. Upsert tasks/checklists from workflow markdown.
5. Post summary to Teams operations channel.

## Scripted Path

```bash
python plugins/tvs-microsoft-deploy/scripts/create_planner_plan.py \
  --workflow taia-sale-prep \
  --group-id "$M365_GROUP_ID"
```
