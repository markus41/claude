# M365 Automation Modules

This folder defines Microsoft 365 collaboration automation for TAIA deployment/readiness operations.

## Modules

- `teams-channel-provisioning.module.yaml`: Teams channels, posts, and approvals automation.
- `sharepoint-data-room-governance.module.yaml`: SharePoint data-room provisioning and checklist governance.
- `mailbox-lifecycle.module.yaml`: Shared mailbox lifecycle operations for buyer diligence workflows.
- `planner-task-sync.module.yaml`: Planner task synchronization with deployment/readiness state.
- `workflow-triggers.yaml`: Event-to-action trigger map for status/readiness signals.
- `communication-templates.yaml`: Structured TAIA communication templates with owner, SLA, and evidence links.
- `governance-policies.yaml`: Retention labels, sensitivity labels, and access review cadence policies.

## Command integration

`commands/status-check.md` and `commands/taia-readiness.md` should call:

```bash
python plugins/tvs-microsoft-deploy/scripts/m365_operational_update.py \
  --event-type <status-check|taia-readiness> \
  --input <control-plane-json> \
  --json-out <machine-readable-output.json> \
  --ops-out <collaboration-update.md>
```

This emits machine-readable payloads and collaboration-ready updates for Teams/Planner/SharePoint execution engines.
