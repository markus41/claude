---
name: tvs:deploy-dataverse
description: Dataverse schema deployment - tables, columns, relationships for TVS and Consulting environments, solution import
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Dataverse Schema Deployment

Deploys Microsoft Dataverse table schemas, columns, relationships, and managed solutions for both TVS and Consulting environments. Handles the full entity data model including cross-environment SharedProspects linking.

## Usage

```
/tvs:deploy-dataverse [--env tvs|consulting|both] [--tables-only] [--import-solution PATH]
```

## Prerequisites

```bash
# 1. PAC CLI authentication
pac auth list | grep -q "Active" || { echo "FAIL: pac auth required. Run: pac auth create"; exit 1; }

# 2. TVS Dataverse environment URL
[ -z "$TVS_DATAVERSE_ENV_URL" ] && { echo "FAIL: TVS_DATAVERSE_ENV_URL not set"; exit 1; }

# 3. Consulting Dataverse environment URL
[ -z "$CONSULTING_DATAVERSE_ENV_URL" ] && { echo "FAIL: CONSULTING_DATAVERSE_ENV_URL not set"; exit 1; }

# 4. Validate connectivity to both environments
pac org who --environment "$TVS_DATAVERSE_ENV_URL" || { echo "FAIL: Cannot reach TVS Dataverse"; exit 1; }
pac org who --environment "$CONSULTING_DATAVERSE_ENV_URL" || { echo "FAIL: Cannot reach Consulting Dataverse"; exit 1; }

# 5. Verify schema definition files exist
[ -d "plugins/tvs-microsoft-deploy/schemas/" ] || { echo "FAIL: schemas/ directory missing"; exit 1; }
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - TVS Schema Auditor:**
- Connect to TVS Dataverse via `pac org select --environment $TVS_DATAVERSE_ENV_URL`
- List existing custom tables: Accounts, Contacts, Subscriptions, Tasks, TimeEntries, Deliverables, AutomationLog
- Enumerate columns per table, check for schema drift from canonical definitions
- List existing managed/unmanaged solutions
- Check for active Dataverse plugins or workflows that may conflict

**Agent 2 - Consulting Schema Auditor:**
- Connect to Consulting Dataverse via `pac org select --environment $CONSULTING_DATAVERSE_ENV_URL`
- List existing custom tables: Accounts, Contacts, Engagements, Activities, SharedProspects, Implementations
- Verify SharedProspects virtual table configuration points to TVS
- Check solution publisher prefix consistency (`rosa_` expected)
- Identify any tables with data that would be affected by schema changes

### Phase 2: PLAN (1 agent)

**Agent 3 - Schema Planner:**
- Diff current schema against target definitions in `plugins/tvs-microsoft-deploy/schemas/`
- Build migration plan: new tables, new columns, modified relationships, deprecated fields
- TVS table plan:
  - `rosa_account` - Company/org records with tier classification
  - `rosa_contact` - Individual contacts linked to accounts
  - `rosa_subscription` - Stripe subscription mirror (Starter/Basic/Advanced)
  - `rosa_task` - VA task assignments with time tracking
  - `rosa_timeentry` - Billable hours per task per VA
  - `rosa_deliverable` - Completed work products
  - `rosa_automationlog` - Power Automate and function execution records
- Consulting table plan:
  - `rosa_engagement` - Consulting project engagements
  - `rosa_activity` - Meeting/call/email activity log
  - `rosa_sharedprospect` - Cross-entity prospect sharing with TVS
  - `rosa_implementation` - Implementation project tracking
- Plan solution export/import sequence
- Estimate row-level security configuration

### Phase 3: CODE (3 agents)

**Agent 4 - TVS Table Deployer:**
- Create/update TVS tables via PAC CLI or Web API
- Deploy columns with correct data types (Choice, Lookup, Currency, DateTime)
- Create relationships: Account 1:N Contacts, Account 1:N Subscriptions, Task 1:N TimeEntries
- Set up calculated columns: total hours on Task (sum of TimeEntries)
- Configure business rules: Subscription tier sets hourly allocation
- Apply form customizations and views

**Agent 5 - Consulting Table Deployer:**
- Create/update Consulting tables via PAC CLI
- Deploy Engagement lifecycle columns (Status: Active, OnHold, Complete)
- Create SharedProspects with virtual table connection to TVS Accounts
- Set up Activities polymorphic relationship (Meeting, Call, Email types)
- Configure Implementation table with milestone tracking columns
- Apply security roles: Consultant, Manager, Admin

**Agent 6 - Solution Packager:**
- Export current state as unmanaged solution backup
- Package new schema as managed solution `RosaDataverseCore`
- Import solution to TVS environment with `pac solution import`
- Import solution to Consulting environment
- Publish all customizations via `pac solution publish`
- Verify solution component counts match expected

### Phase 4: TEST (2 agents)

**Agent 7 - Schema Validator:**
- Query Web API metadata: `GET /api/data/v9.2/EntityDefinitions`
- Verify all tables exist with correct schema names
- Confirm column types match definitions (no type coercion errors)
- Validate relationships via `GET /api/data/v9.2/RelationshipDefinitions`
- Test CRUD operations: create sample record, read, update, delete
- Verify calculated columns compute correctly

**Agent 8 - Cross-Environment Tester:**
- Create test Account in TVS, verify it appears in Consulting SharedProspects
- Test security roles: Consultant cannot delete Accounts, Admin can
- Verify solution publisher prefix is `rosa_` on all custom components
- Confirm no orphaned components from previous deployments
- Validate business rules fire on record create/update

### Phase 5: FIX (1 agent)

**Agent 9 - Schema Remediator:**
- Fix column type mismatches by recreating with correct type (data migration if needed)
- Resolve relationship conflicts from duplicate schema names
- Handle solution import failures: dependency resolution, component conflicts
- Fix SharedProspects virtual table auth if cross-env connection fails
- Re-publish customizations after fixes
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 10 - Schema Documenter:**
- Generate table/column inventory as markdown report
- Document all relationships with cardinality diagrams
- Record solution version numbers and component counts
- Note any schema drift detected and corrective actions taken
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 6 sub-agents enforced. Dataverse deployment depends on `tvs:deploy-identity` completing first (service principals needed for app-level access).

## Schema Reference

### TVS Dataverse Tables
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| rosa_account | name, tier, status, stripe_customer_id | 1:N Contacts, 1:N Subscriptions |
| rosa_contact | fullname, email, phone, role | N:1 Account |
| rosa_subscription | plan (Starter/Basic/Advanced), hours_allocated, stripe_sub_id | N:1 Account |
| rosa_task | title, assigned_va, status, due_date | N:1 Account, 1:N TimeEntries |
| rosa_timeentry | date, hours, description, billable | N:1 Task, N:1 Contact |
| rosa_deliverable | title, type, status, completed_date | N:1 Task, N:1 Account |
| rosa_automationlog | trigger, action, status, timestamp, duration_ms | N:1 Account |

### Consulting Dataverse Tables
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| rosa_account | name, industry, engagement_status | 1:N Contacts, 1:N Engagements |
| rosa_contact | fullname, email, role, source | N:1 Account |
| rosa_engagement | title, status, start_date, end_date, budget | N:1 Account, 1:N Activities |
| rosa_activity | type (Meeting/Call/Email), subject, date, notes | N:1 Engagement, N:1 Contact |
| rosa_sharedprospect | tvs_account_ref, consulting_account_ref, shared_date | Virtual Table |
| rosa_implementation | project_name, phase, milestone, completion_pct | N:1 Engagement |
