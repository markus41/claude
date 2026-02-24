---
name: tvs:deploy-fabric
description: Fabric workspace provisioning - creates workspaces, lakehouses, deploys notebooks, creates Dataverse shortcuts
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Fabric Workspace Provisioning

Provisions Microsoft Fabric workspaces and OneLake lakehouses for all Rosa entities. Creates the six core workspaces (tvs, consulting, lobbi_platform, media, a3_archive, consolidated), deploys Spark notebooks, and establishes Dataverse shortcuts for real-time data access.

## Usage

```
/tvs:deploy-fabric [--workspace NAME] [--notebooks-only] [--shortcuts-only] [--dry-run]
```

## Prerequisites

```bash
# 1. Fabric API token
[ -z "$FABRIC_TOKEN" ] && { echo "FAIL: FABRIC_TOKEN not set"; exit 1; }

# 2. Fabric capacity ID
[ -z "$FABRIC_CAPACITY_ID" ] && { echo "FAIL: FABRIC_CAPACITY_ID not set"; exit 1; }

# 3. Validate Fabric API access
curl -sf -H "Authorization: Bearer $FABRIC_TOKEN" \
  "https://api.fabric.microsoft.com/v1/capacities/$FABRIC_CAPACITY_ID" > /dev/null \
  || { echo "FAIL: Fabric token invalid or capacity not accessible"; exit 1; }

# 4. Verify Dataverse URLs for shortcut creation
[ -z "$TVS_DATAVERSE_ENV_URL" ] && echo "WARN: TVS_DATAVERSE_ENV_URL not set - shortcuts will be skipped"
[ -z "$CONSULTING_DATAVERSE_ENV_URL" ] && echo "WARN: CONSULTING_DATAVERSE_ENV_URL not set - shortcuts will be skipped"

# 5. Check notebook source files exist
[ -d "plugins/tvs-microsoft-deploy/fabric/" ] || { echo "FAIL: fabric/ directory missing"; exit 1; }
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Capacity Scanner:**
- Query Fabric capacities: `GET /v1/capacities` to verify F-SKU size and region
- List existing workspaces: `GET /v1/workspaces` filtered by `rosa-` prefix
- For each workspace, enumerate items: lakehouses, notebooks, dataflows, semantic models
- Check capacity utilization and CU consumption for the current billing period
- Verify capacity is in Active state (not paused/suspended)

**Agent 2 - Data Source Mapper:**
- Inventory existing OneLake shortcuts across all workspaces
- Verify Dataverse connection credentials are stored in workspace settings
- Map required shortcuts: each TVS Dataverse table needs a shortcut in tvs/ lakehouse
- Check for stale shortcuts pointing to removed Dataverse tables
- Verify service principal from `tvs:deploy-identity` has Fabric.ReadWrite.All permission

### Phase 2: PLAN (1 agent)

**Agent 3 - Workspace Planner:**
- Design workspace topology:
  - `rosa-tvs` - TVS operational data lakehouse (Accounts, Contacts, Subscriptions, Tasks, TimeEntries, Deliverables)
  - `rosa-consulting` - Consulting data lakehouse (Engagements, Activities, SharedProspects, Implementations)
  - `rosa-lobbi-platform` - Lobbi platform analytics and broker data
  - `rosa-media` - Media company content and campaign analytics
  - `rosa-a3-archive` - A3 Firebase extracted data (brokers, commissions, carriers, contacts, activities)
  - `rosa-consolidated` - Cross-entity unified lakehouse with medallion architecture (bronze/silver/gold)
- Plan notebook deployments per workspace (ingestion, transformation, reporting)
- Design Dataverse shortcut mapping: table-to-lakehouse-table correspondence
- Calculate storage estimates per workspace
- Define workspace RBAC: Admin, Member, Contributor, Viewer per entity

### Phase 3: CODE (3 agents)

**Agent 4 - Workspace Creator:**
- Create each workspace via `POST /v1/workspaces` with capacity assignment
- Assign workspace to `$FABRIC_CAPACITY_ID`
- Create lakehouse item in each workspace via `POST /v1/workspaces/{id}/lakehouses`
- Configure workspace identity (service principal access)
- Set workspace-level RBAC roles for entity users
- Enable Git integration if repository is configured

**Agent 5 - Notebook Deployer:**
- Upload Spark notebooks from `plugins/tvs-microsoft-deploy/fabric/notebooks/`
- Deploy ingestion notebooks: `ingest_dataverse_tvs.ipynb`, `ingest_dataverse_consulting.ipynb`
- Deploy transformation notebooks: `transform_bronze_to_silver.ipynb`, `transform_silver_to_gold.ipynb`
- Deploy A3 archive notebooks: `archive_firebase_extract.ipynb`
- Deploy consolidated notebooks: `consolidated_entity_merge.ipynb`, `consolidated_kpi_rollup.ipynb`
- Configure notebook parameters: environment URLs, lakehouse references, schedule triggers

**Agent 6 - Shortcut + Pipeline Builder:**
- Create Dataverse shortcuts in tvs/ lakehouse for all TVS tables:
  - `POST /v1/workspaces/{id}/lakehouses/{id}/shortcuts` with Dataverse connection
  - Tables: rosa_account, rosa_contact, rosa_subscription, rosa_task, rosa_timeentry, rosa_deliverable, rosa_automationlog
- Create Dataverse shortcuts in consulting/ lakehouse for all Consulting tables
- Create cross-workspace shortcuts in consolidated/ pointing to silver layer of each entity
- Build data pipelines for scheduled refresh (daily bronze, hourly silver for active data)
- Configure pipeline failure alerts to Teams channel

### Phase 4: TEST (2 agents)

**Agent 7 - Lakehouse Validator:**
- Verify all 6 workspaces exist and are assigned to correct capacity
- Confirm lakehouses are created with Tables and Files directories
- Test each Dataverse shortcut returns data: query first 10 rows via Spark SQL
- Verify notebooks are present and can be opened without import errors
- Check workspace RBAC: test user in sg-tvs-users can access rosa-tvs but not rosa-consulting

**Agent 8 - Pipeline Tester:**
- Trigger test run of ingestion pipeline for TVS workspace
- Verify bronze layer populates with raw Dataverse data
- Run transformation notebook, verify silver layer output schema
- Check consolidated workspace receives cross-entity data
- Validate shortcut refresh latency is under 15 minutes for Dataverse changes

### Phase 5: FIX (1 agent)

**Agent 9 - Fabric Remediator:**
- Fix shortcut authentication failures by refreshing service principal token
- Resolve capacity throttling by checking CU limits and pausing non-critical workloads
- Handle notebook import errors from missing library dependencies
- Fix pipeline failures from incorrect lakehouse references
- Re-create workspaces that failed capacity assignment
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 10 - Fabric Documenter:**
- Generate workspace inventory report with item counts and storage usage
- Document shortcut mapping: Dataverse table to lakehouse table correspondence
- Record notebook deployment versions and parameter configurations
- List pipeline schedules and alert configurations
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 6 sub-agents enforced. Fabric deployment depends on `tvs:deploy-identity` (service principals) and `tvs:deploy-dataverse` (tables exist for shortcuts).

## Workspace Architecture

```
OneLake/
  rosa-tvs/              -- TVS operational lakehouse
    Tables/              -- Dataverse shortcuts + transformed tables
    Files/               -- Uploaded CSVs, exports
  rosa-consulting/       -- Consulting lakehouse
    Tables/
    Files/
  rosa-lobbi-platform/   -- Lobbi broker analytics
    Tables/
    Files/
  rosa-media/            -- Media content analytics
    Tables/
    Files/
  rosa-a3-archive/       -- A3 Firebase extracted data
    Tables/              -- brokers, commissions, carriers, contacts, activities
    Files/               -- Raw JSON exports from Firebase
  rosa-consolidated/     -- Cross-entity unified view
    bronze/              -- Raw data from all entities
    silver/              -- Cleaned, deduplicated, typed
    gold/                -- KPI rollups, executive dashboards
```
