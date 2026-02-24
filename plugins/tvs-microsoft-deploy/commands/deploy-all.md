---
name: tvs:deploy-all
description: Full platform deployment across all Rosa entities - orchestrates identity, dataverse, fabric, portal, azure, and teams in sequence
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Full Platform Deployment

Orchestrates the complete Rosa Holdings Microsoft platform deployment across all entities (TVS, Lobbi Consulting, Medicare Consulting, Media Company) in dependency order: identity, dataverse, fabric, portal, azure, teams.

## Usage

```
/tvs:deploy-all [--entity tvs|consulting|media|all] [--skip-phase PHASE] [--dry-run]
```

## Prerequisites

Before execution, validate ALL of the following:

```bash
# 1. PAC CLI authentication for both Dataverse environments
pac auth list | grep -q "Active" || { echo "FAIL: No active pac auth"; exit 1; }

# 2. Azure CLI authentication
az account show --query "name" -o tsv || { echo "FAIL: az login required"; exit 1; }

# 3. Required environment variables
REQUIRED_VARS=(
  TVS_TENANT_ID TVS_DATAVERSE_ENV_URL CONSULTING_DATAVERSE_ENV_URL
  GRAPH_TOKEN FABRIC_TOKEN FABRIC_CAPACITY_ID
  AZURE_SUBSCRIPTION_ID STRIPE_SECRET_KEY
  FIREBASE_SERVICE_ACCOUNT TVS_WS_ID
)
for var in "${REQUIRED_VARS[@]}"; do
  [ -z "${!var}" ] && { echo "FAIL: $var not set"; exit 1; }
done

# 4. TAIA wind-down safety (when touching TAIA resources)
# Ensure guard hook is enabled and intent marker is used for destructive operations.
# export TAIA_TENANT_ID=<tenant-guid>

# 5. Fabric token validity
curl -sf -H "Authorization: Bearer $FABRIC_TOKEN" \
  "https://api.fabric.microsoft.com/v1/capacities" > /dev/null || { echo "FAIL: FABRIC_TOKEN expired"; exit 1; }
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Environment Scanner:**
- Query `az account show` for active subscription details
- Run `pac auth list` to confirm Dataverse auth for TVS and Consulting
- Verify Fabric capacity status via REST API
- Check Key Vault `kv-rosa-holdings` accessibility
- Enumerate existing resources to determine delta deployment

**Agent 2 - Dependency Mapper:**
- Read `plugins/tvs-microsoft-deploy/schemas/` for entity relationship maps
- Identify cross-entity dependencies (SharedProspects, consolidated lakehouse)
- Map deployment order constraints: identity must precede dataverse, dataverse before fabric shortcuts
- Check for in-progress deployments or locked resources
- Validate TAIA wind-down status does not block TVS build

### Phase 2: PLAN (1 agent)

**Agent 3 - Deployment Planner:**
- Build sequenced deployment manifest:
  1. Identity (Entra ID users, apps, licenses)
  2. Dataverse (TVS tables, Consulting tables, solutions)
  3. Fabric (workspaces: tvs/, consulting/, lobbi_platform/, media/, a3_archive/, consolidated/)
  4. Portal (Power Pages broker portal, Copilot Studio bots)
  5. Azure (Key Vault, Functions, Static Web Apps, App Insights)
  6. Teams (VA workspace, entity channels, shared mailboxes)
  7. Planner + Embedded Analytics (workflow boards and client analytics packages)
- Calculate estimated cost impact per tier (Tier 1 ~$1,349, Tier 2 ~$2,610, Tier 3 ~$5,083)
- Generate rollback checkpoints between each phase
- Produce deployment manifest JSON at `/tmp/rosa-deploy-manifest.json`

### Phase 3: CODE (3 agents)

**Agent 4 - Identity + Dataverse Deployer:**
- Execute `tvs:deploy-identity` for Entra ID provisioning
- Execute `tvs:deploy-dataverse` for both TVS and Consulting environments
- Wire Dataverse service principals created in identity phase
- Validate cross-environment connections (SharedProspects link)

**Agent 5 - Fabric + Azure Deployer:**
- Execute `tvs:deploy-fabric` for all 6 workspace lakehouses
- Execute `tvs:deploy-azure` for Bicep infrastructure
- Create Dataverse shortcuts in OneLake pointing to deployed tables
- Configure `func-rosa-ingest` with Key Vault references

**Agent 6 - Portal + Teams Deployer:**
- Execute `tvs:deploy-portal` for Power Pages and Copilot Studio
- Execute `tvs:deploy-teams` for workspace and channel provisioning
- Wire Stripe billing widget into broker portal
- Configure Teams shared mailbox routing per entity

**Agent 6b - Planner + Analytics Productizer:**
- Execute `tvs:deploy-planner` for operational workflow orchestration
- Execute `tvs:deploy-embedded-analytics` for client-facing analytics packages
- Validate RLS and embed token handoff to Power Pages

### Phase 4: TEST (2 agents)

**Agent 7 - Integration Tester:**
- Verify Entra ID users can authenticate to Dataverse
- Test Fabric Dataverse shortcuts return data from TVS tables
- Confirm Azure Functions connect to Key Vault secrets
- Validate broker portal loads and Stripe widget renders
- Test Copilot Studio bot responds to sample queries

**Agent 8 - Cross-Entity Validator:**
- Verify SharedProspects flows between TVS and Consulting Dataverse
- Confirm consolidated/ lakehouse receives data from all entity workspaces
- Test Teams channel notifications fire on Dataverse record creation
- Validate RBAC: TVS users cannot access Consulting data and vice versa
- Run `tvs:status-check` for full health verification

### Phase 5: FIX (1 agent)

**Agent 9 - Remediation Agent:**
- Collect all failures from Phase 4 test results
- Categorize by severity: blocking (auth, connectivity) vs. cosmetic (UI, naming)
- Execute targeted fixes: re-run failed sub-deployments with `--force`
- For Fabric shortcut failures, refresh Dataverse connection credentials
- For portal failures, invoke `tvs:browser-fallback` for manual steps
- Re-run failed tests to confirm resolution
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 10 - Documentation Agent:**
- Generate deployment report at `plugins/tvs-microsoft-deploy/reports/deploy-all-{timestamp}.md`
- Include: resources created, cost projections, test results, known issues
- Update entity status in deployment tracking
- Record deployment event via `mcp__deploy-intelligence__deploy_record_build`
- Log session activity via `mcp__project-metrics__metrics_session_log`

## Orchestration Hook

This command is governed by the `orchestration-protocol-enforcer` hook which ensures:
- No phase is skipped without explicit `--skip-phase` flag
- Sub-agent count meets minimum (8 for deploy-all)
- Each phase completes before the next begins
- Failures in Phase 4/5 trigger automatic retry before abort

## Rollback

If any phase fails catastrophically:
1. Stop execution at current phase
2. Run inverse operations for completed phases in reverse order
3. Restore Entra ID to pre-deployment app registrations
4. Delete newly created Dataverse tables (if schema-only, not data)
5. Remove Fabric workspaces created in this run
6. Generate failure report with remediation steps
