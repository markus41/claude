---
name: Microsoft 365 Graph Advanced
description: Use this skill when implementing M365 automation across Planner, Teams, SharePoint, Exchange, and Entra using Microsoft Graph for TAIA/TVS operations.
version: 1.0.0
---

# Microsoft 365 Graph Advanced

## Use Cases
- Provision Planner plans/buckets/tasks from workflow templates.
- Synchronize task state to Teams channels and SharePoint trackers.
- Automate mailbox and group lifecycle tasks during TAIA wind-down.

## Required Scopes (Application)
- `Group.ReadWrite.All`
- `Tasks.ReadWrite.All`
- `User.Read.All`
- `Sites.ReadWrite.All`
- `ChannelMessage.Send`
- `Mail.ReadWrite`

## Planner-Oriented Patterns

```bash
# List plans by group
curl -s -H "Authorization: Bearer $GRAPH_TOKEN" \
  "https://graph.microsoft.com/v1.0/groups/${M365_GROUP_ID}/planner/plans"

# Create plan
curl -s -X POST -H "Authorization: Bearer $GRAPH_TOKEN" \
  -H "Content-Type: application/json" \
  "https://graph.microsoft.com/v1.0/planner/plans" \
  -d '{"owner":"'"${M365_GROUP_ID}"'","title":"TAIA Transition Plan"}'
```

## Guardrails
- Enforce tenant isolation before any write operation.
- Require idempotency key tags in task descriptions for reruns.
- Store `planId`/`bucketId` mapping in plugin state docs under `docs/`.

## Integration Points
- `commands/deploy-planner.md`
- `scripts/create_planner_plan.py`
- `agents/planner-orchestrator-agent.md`
