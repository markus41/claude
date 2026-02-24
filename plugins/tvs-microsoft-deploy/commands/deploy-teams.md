---
name: tvs:deploy-teams
intent: Teams workspace provisioning for VAs with HIPAA-aware configuration
tags:
  - tvs-microsoft-deploy
  - command
  - deploy-teams
inputs: []
risk: medium
cost: medium
description: Teams workspace provisioning for VAs with HIPAA-aware configuration
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Task
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Deploy Teams

Provisions Microsoft Teams workspaces for TVS Holdings VAs with entity-specific channels, shared mailboxes, and HIPAA-compliant configuration for TVS tenant.

## Usage

```bash
/tvs:deploy-teams [--entity=tvs|consulting|all] [--dry-run]
```

## Prerequisites

```bash
# Verify Graph API access
python3 plugins/tvs-microsoft-deploy/scripts/api/graph_request.py "/me" --entity "${TVS_ENTITY:-tvs}" | jq .userPrincipalName

# HIPAA confirmation required for TVS tenant
[ "$HIPAA_CONFIRMED" = "true" ] || echo "ERROR: Set HIPAA_CONFIRMED=true for TVS comms config"

# Verify tenant IDs
echo "TVS_TENANT_ID=$TVS_TENANT_ID"
echo "CONSULTING_TENANT_ID=$CONSULTING_TENANT_ID"
```

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance
> Hook: hipaa-config-guard.sh validates HIPAA_CONFIRMED for TVS operations

### Phase 1: EXPLORE (2 agents)

**Agent 1: comms-agent** (sonnet)
- Audit existing Teams structure across tenants
- List current teams, channels, and membership
- Check existing messaging and meeting policies

**Agent 2: identity-agent** (opus)
- Verify user accounts exist for all 11 PH VAs
- Confirm Frontline F3 licenses assigned
- Check Teams-specific license features

### Phase 2: PLAN (1 agent)

**Agent: comms-agent** (sonnet)
- Design Teams structure: one team per entity or shared VA workspace
- Plan channels: General, TVS-Tasks, Consulting-Tasks, Announcements, Training
- Define messaging policies: no external chat for VAs, file sharing restrictions
- Plan shared mailboxes for entity-specific communications

### Phase 3: CODE (2 agents)

**Agent 1: comms-agent** (sonnet)
- Create Teams via Graph API
- Configure channels with entity-specific tabs
- Set messaging policies and meeting policies
- Create shared mailboxes

**Agent 2: identity-agent** (opus)
- Add VA members to appropriate teams
- Configure conditional access for Teams mobile access
- Set up FIDO2 authentication for Teams sign-in

### Phase 4: TEST (2 agents)

**Agent 1: comms-agent** (sonnet)
- Verify all channels created and accessible
- Test messaging policy enforcement
- Validate shared mailbox delivery

**Agent 2: browser-fallback-agent** (haiku)
- Screenshot Teams admin center configuration
- Verify policy assignments in portal

### Phase 5: FIX (1 agent)

**Agent: comms-agent** (sonnet)
- Fix membership or policy issues
- Resolve channel permission problems

### Phase 6: DOCUMENT (1 agent)

**Agent: comms-agent** (sonnet)
- Document Teams structure and policies
- Create VA onboarding guide for Teams
- Record HIPAA compliance configuration

## Teams Structure

```
TVS Holdings VA Workspace
├── General          — Announcements, company-wide
├── TVS-Operations   — TVS task discussions, time tracking
├── Consulting       — Lobbi + Medicare consulting work
├── Training         — Onboarding materials, how-to guides
├── IT-Support       — Technical issues, FIDO2 help
└── Social           — Team building, informal
```

## HIPAA Configuration (TVS Tenant)

- External sharing: Disabled
- Guest access: Disabled
- File sharing: SharePoint only (no OneDrive personal)
- Meeting recording: Disabled for client meetings
- Chat export: Enabled for compliance
- Retention policy: 7 years for TVS-Operations channel

## See Also

- `/tvs:deploy-identity` — Must run first for user accounts
- `workflows/tvs-foundation.md` — Teams is step 7

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
/tvs:deploy-teams --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:deploy-teams --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:deploy-teams --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:deploy-teams --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/deploy-teams.json --plan-id PLAN-SAFE-001
```

