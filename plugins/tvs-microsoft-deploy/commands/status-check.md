---
name: tvs:status-check
description: Health check across all deployed Rosa Holdings resources
allowed-tools:
  - Bash
  - Read
  - Grep
  - Task
---

# Status Check

Read-only health check across all deployed Rosa Holdings resources. Verifies Entra, Dataverse, Fabric, Azure, Functions, Static Web Apps, and Teams status.

## Usage

```bash
/tvs:status-check [--entity=tvs|consulting|taia|media|all] [--verbose]
```

## Prerequisites

```bash
# Minimal: az login and Graph token
az account show --query name -o tsv
```

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance
> NOTE: Read-only command — no destructive operations

### Phase 1: EXPLORE (2 agents)

**Agent 1: azure-agent** (sonnet)
- Check Azure resource health (Key Vault, Functions, Static Web Apps, App Insights)
- Verify resource group existence for each entity
- Check Function App status and recent invocation errors

**Agent 2: identity-agent** (opus)
- Verify Entra ID tenant accessibility
- Check license assignment status
- Verify conditional access policy status
- Check app registration health

### Phase 2: PLAN (1 agent)

**Agent: analytics-agent** (opus)
- Compile checklist of all resources to verify
- Define health criteria per resource type

### Phase 3: CODE (2 agents)

**Agent 1: platform-agent** (sonnet)
- Check pac auth status for each Dataverse environment
- Verify Dataverse environment health via API
- Check solution versions deployed

**Agent 2: analytics-agent** (opus)
- Check Fabric workspace status via REST API
- Verify lakehouse accessibility
- Check notebook schedule status

### Phase 4: TEST (2 agents)

**Agent 1: comms-agent** (sonnet)
- Verify Teams workspace accessibility
- Check shared mailbox status

**Agent 2: browser-fallback-agent** (haiku)
- Screenshot key portal dashboards for visual verification

### Phase 5: FIX (1 agent)

**Agent: azure-agent** (sonnet)
- Report issues found (does not auto-fix in status-check mode)
- Suggest remediation commands for each issue

### Phase 6: DOCUMENT (1 agent)

**Agent: analytics-agent** (opus)
- Generate health report with traffic-light indicators
- Output resource inventory with versions

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Rosa Holdings — Platform Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Entra ID
  [OK] TVS tenant accessible
  [OK] Consulting tenant accessible
  [OK] 23/23 licenses assigned
  [OK] Conditional access policies active
  [OK] FIDO2 keys: 11/11 PH VAs registered

Dataverse
  [OK] TVS environment: Online
  [OK] Consulting environment: Online
  [OK] TVS tables: 7/7 deployed
  [OK] Consulting tables: 6/6 deployed

Fabric
  [OK] TVS workspace: Active
  [OK] Consulting workspace: Active
  [OK] a3_archive workspace: Active
  [OK] Consolidated workspace: Active
  [--] Media workspace: Not provisioned
  [OK] Capacity F2: Running

Azure
  [OK] kv-rosa-holdings: Accessible
  [OK] func-rosa-ingest: Running
  [OK] stapp-broker-portal: Deployed
  [OK] appi-rosa-holdings: Collecting

Teams
  [OK] VA Workspace: Active
  [OK] Channels: 6/6
  [OK] Members: 11/11

Overall: 22/23 checks passed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## See Also

- `/tvs:cost-report` — Financial health view
- `/tvs:deploy-all` — Deploy/redeploy components with issues
- `/tvs:taia-readiness` — TAIA sale and wind-down readiness scorecard
- `/tvs:deploy-planner` — Jira-style orchestration boards on Microsoft Planner
- `/tvs:deploy-embedded-analytics` — Fabric + Power Pages embedded analytics rollout
