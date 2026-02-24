# Full Platform Deployment

> **Workflow:** tvs-microsoft-deploy / full-platform
> **Duration:** 4-6 weeks
> **Owner:** Markus (#10, Global Admin)
> **Depends on:** tvs-foundation.md (all steps complete)
> **Cost target:** Tier 2 (~$2,610/mo) during build, Tier 3 (~$5,083/mo) at full scale

---

## Dependency Graph

```
tvs-foundation.md (ALL) ──────────────────────┐
                                               │
[1] Automation flows (remaining 15+) ──────────┤
         │                                     │
         ├── blocks [5] dashboards (ops data)  │
         └── parallel with [2] and [3]         │
                                               │
[2] React portal components ───────────────────┤
         │                                     │
         ├── blocks scale-polish.md (API)      │
         └── depends on [3] (webhook handlers) │
                                               │
[3] Azure Functions deployment ────────────────┤
         │                                     │
         ├── blocks [4] Fabric (extract func)  │
         └── blocks [2] (Stripe webhook)       │
                                               │
[4] Fabric notebooks ──────────────────────────┤
         │                                     │
         ├── blocks [5] dashboards (curated)   │
         └── depends on [3] (extract function) │
                                               │
[5] Power BI dashboards ───────────────────────┤
         │                                     │
         └── depends on [1] + [4]              │
                                               │
[6] Consulting CRM ────────────────────────────┘
         │
         ├── parallel with [1]-[5]
         └── blocks scale-polish.md (consulting pipeline)
```

**Parallel tracks:** Steps 1, 2, and 6 can run concurrently. Step 3 should start early
as Steps 2 and 4 depend on deployed functions.

---

## Step 1: Remaining Automation Flows (15+ Beyond Core 5)

**Agent:** platform-agent (FORGE)
**Duration estimate:** 5-8 days
**Depends on:** tvs-foundation.md Step 5 (core 5 flows active)

### Prerequisites
- Core 5 flows operational and tested (from tvs-foundation.md)
- Dataverse tables with production-representative data
- All connection references configured (Outlook, Teams, SharePoint, Stripe)

### Flow Catalog

#### Client Lifecycle Flows (6 flows)
| # | Flow Name | Trigger | Purpose |
|---|-----------|---------|---------|
| 6 | Client Onboarding | `rosa_subscription` created | Welcome email, setup checklist, assign onboarding tasks |
| 7 | Subscription Renewal Reminder | Scheduled (daily) | Email clients 30/14/7 days before renewal |
| 8 | Subscription Cancellation | Stripe `subscription.deleted` | Offboarding tasks, exit survey, data retention |
| 9 | Client Satisfaction Survey | `rosa_deliverable` count = 5 | Trigger NPS survey after every 5th deliverable |
| 10 | Hours Approaching Limit | `rosa_timeentry` created | Alert client at 80%/95%/100% of tier hours |
| 11 | Overage Approval | Hours > tier limit | Request client approval before overage billing |

#### VA Operations Flows (5 flows)
| # | Flow Name | Trigger | Purpose |
|---|-----------|---------|---------|
| 12 | Daily Task Digest | Scheduled (7:00 AM PHT) | Morning summary of assigned tasks per VA |
| 13 | Idle Task Alert | Scheduled (hourly) | Flag tasks with no activity in 24+ hours |
| 14 | Weekly Timesheet Summary | Scheduled (Friday 5:00 PM PHT) | Weekly hours per VA, per client, per task |
| 15 | VA PTO Request | Approval trigger | Route PTO request to supervisor, reassign tasks |
| 16 | Shift Handoff | Scheduled (shift boundaries) | Summarize in-progress work for next VA |

#### Administrative Flows (4+ flows)
| # | Flow Name | Trigger | Purpose |
|---|-----------|---------|---------|
| 17 | Monthly Invoice Generation | Scheduled (1st of month) | Generate invoices from time entries + Stripe data |
| 18 | Paylocity Sync | Scheduled (bi-weekly) | Sync VA hours to Paylocity for payroll |
| 19 | Security Alert Escalation | Entra risk event | Route impossible travel / risky sign-in to Markus |
| 20 | Automation Health Check | Scheduled (daily 6:00 AM EST) | Check all flow run statuses, alert on failures |

### Execution Sequence
1. Deploy client lifecycle flows (6-11) first -- highest business value
2. Deploy VA operations flows (12-16) -- immediate productivity gain
3. Deploy administrative flows (17-20) -- operational efficiency
4. End-to-end testing: simulate full client lifecycle from onboarding to renewal
5. Monitor automation log for 48 hours before declaring stable

### Success Criteria
- All 15+ flows deployed and active
- Client lifecycle test: onboarding through first deliverable completion
- VA operations test: full work day simulation with time entries
- Automation health check flow reporting green for 48 consecutive hours
- Error rate < 2% across all flows

### Rollback Plan
- Turn off individual flows without affecting others
- Flows can be reverted to previous versions via flow history
- Connection references are shared; removing one flow does not break others

---

## Step 2: React Portal Components

**Duration estimate:** 2-3 weeks (2 React interns + senior guidance)
**Depends on:** tvs-foundation.md Step 3 (Power Pages scaffold), Step 3 here (Stripe webhook)

### Prerequisites
- GitHub monorepo `rosa-holdings/platform` with `apps/broker-portal/` scaffold
- Entra app registration `app-broker-portal` for SPA auth
- Stripe publishable key available
- Dataverse OData API accessible via `app-rosa-ingest` service principal

### Component Architecture
```
apps/broker-portal/          # Vite + React + TypeScript
  src/
    components/
      Dashboard/             # Broker dashboard widgets
      Subscriptions/         # Subscription management
      TimeTracking/          # Time tracking viewer
      Commissions/           # Commission statement viewer
      Common/                # Shared UI components
    hooks/
      useDataverse.ts        # Dataverse OData client
      useStripe.ts           # Stripe customer portal hook
      useAuth.ts             # MSAL authentication hook
    pages/
      DashboardPage.tsx
      SubscriptionPage.tsx
      TimeTrackingPage.tsx
      CommissionsPage.tsx
      ProfilePage.tsx
    services/
      dataverse.ts           # Dataverse API service
      stripe.ts              # Stripe integration service
```

### Core Components

#### Broker Dashboard
- Active subscription tier with hours used/remaining gauge
- Recent tasks list with status indicators
- Upcoming deliverables timeline
- Quick actions: submit request, view invoice, contact support

#### Subscription Management
- Current plan display with Stripe Customer Portal link
- Plan comparison table (Starter $360 / Basic $640 / Advanced $1,200)
- Usage history chart (hours consumed per month)
- Upgrade/downgrade flow via Stripe Checkout

#### Time Tracking Viewer
- Tabular view of time entries by task, by VA, by date range
- Hours summary with remaining allocation bar chart
- Export to CSV for client records
- Drill-down: click task to see individual time entries

### Execution Sequence
1. Set up Vite + React + TypeScript scaffold with MSAL auth
2. Implement `useAuth.ts` hook with Entra ID token acquisition
3. Implement `useDataverse.ts` hook for OData CRUD operations
4. Build Dashboard page (highest visibility, validates data flow)
5. Build Subscription page with Stripe integration
6. Build Time Tracking page
7. Build Commissions page (read-only, mirrors Power Pages)
8. Deploy to Azure Static Web Apps with GitHub Actions CI/CD

### Success Criteria
- All 5 pages render with live Dataverse data
- MSAL authentication flows correctly (login, token refresh, logout)
- Stripe Customer Portal link opens correctly
- Lighthouse score > 80 on all pages
- CI/CD pipeline: push to `develop` deploys to staging SWA

### Rollback Plan
- Static Web Apps supports instant rollback to previous deployment
- Dataverse data is read-only from portal (no destructive operations)
- Stripe operations use Customer Portal (Stripe handles rollback)

---

## Step 3: Azure Functions Deployment

**Duration estimate:** 3-5 days
**Depends on:** tvs-foundation.md Step 2 (Key Vault), Step 6 (Stripe wiring tested)

### Prerequisites
- Azure Function App `func-rosa-ingest` provisioned (Consumption plan)
- Key Vault secrets accessible by Function App managed identity
- GitHub monorepo `functions/` directory scaffolded

### Functions to Deploy

#### Firebase Extract Function (`functions/firebase-extract/`)
- **Trigger:** HTTP (manual invocation or scheduled)
- **Purpose:** Re-extract A3 Firebase data on demand (incremental or full)
- **Runtime:** Node.js 20
- **Key dependencies:** `firebase-admin`, `@azure/storage-blob`
- **Config:** Firebase SA key from Key Vault, Blob Storage connection string

#### Stripe Webhook Handler (`functions/stripe-webhook/`)
- **Trigger:** HTTP POST from Stripe
- **Purpose:** Verify Stripe signatures, route events to Power Automate
- **Runtime:** Node.js 20
- **Key dependencies:** `stripe` SDK
- **Events handled:**
  - `checkout.session.completed` -- new subscription
  - `invoice.paid` -- payment confirmation
  - `customer.subscription.updated` -- plan change
  - `customer.subscription.deleted` -- cancellation
- **Config:** Stripe webhook secret from Key Vault

#### Paylocity Sync (`functions/paylocity-sync/`)
- **Trigger:** Timer (bi-weekly, aligned with payroll schedule)
- **Purpose:** Sync VA time entries from Dataverse to Paylocity API
- **Runtime:** Node.js 20
- **Key dependencies:** Paylocity API client (custom)
- **Config:** Paylocity API credentials from Key Vault

### Execution Sequence
1. **Provision Function App**:
   ```bash
   az functionapp create --name func-rosa-ingest \
     --resource-group rg-rosa-holdings \
     --storage-account strosadata \
     --consumption-plan-location eastus2 \
     --runtime node --runtime-version 20 \
     --functions-version 4
   ```
2. Enable managed identity and grant Key Vault Secrets User role
3. Deploy Firebase Extract function and test with single collection
4. Deploy Stripe Webhook handler and register endpoint in Stripe dashboard
5. Deploy Paylocity Sync function with test credentials
6. Configure Application Insights for all functions

### Success Criteria
- All 3 functions deployed and responding to their triggers
- Firebase Extract: successfully re-extracts 1 collection on demand
- Stripe Webhook: processes test events from Stripe CLI
- Paylocity Sync: connects to Paylocity sandbox API
- Application Insights showing telemetry for all functions

### Rollback Plan
- Azure Functions supports deployment slots (swap back to previous)
- Individual functions can be disabled without affecting others
- Managed identity revocation immediately blocks Key Vault access

---

## Step 4: Fabric Notebooks

**Command:** `/tvs:deploy-fabric` (notebooks subset)
**Agent:** platform-agent (FORGE)
**Duration estimate:** 5-8 days
**Depends on:** Step 3 (Firebase extract function), tvs-foundation.md Step 2 (workspace)

### Prerequisites
- Fabric workspace `ws-tvs` with lakehouse `lh-tvs`
- A3 extract data in lakehouse Files/a3-extract/
- Dataverse tables populated with operational data

### Notebooks to Deploy

#### Notebook 1: `tvs_curated_transform`
- **Schedule:** Daily at 2:00 AM EST
- **Purpose:** Transform raw Dataverse sync data into curated lakehouse tables
- **Input:** Dataverse tables via SQL analytics endpoint
- **Output:** Curated Delta tables:
  - `curated_subscriptions` -- Active subscriptions with tier, hours, revenue
  - `curated_time_entries` -- Aggregated time entries by client, VA, week
  - `curated_deliverables` -- Deliverable completion rates and SLA adherence
  - `curated_automation_metrics` -- Flow execution stats, error rates
- **Language:** PySpark

#### Notebook 2: `consulting_pipeline`
- **Schedule:** Daily at 3:00 AM EST
- **Purpose:** Transform consulting CRM data into pipeline analytics
- **Input:** Consulting Dataverse environment tables
- **Output:** Curated Delta tables:
  - `curated_engagements` -- Active consulting engagements with stage
  - `curated_prospects` -- Prospect pipeline with conversion probability
  - `curated_revenue_forecast` -- Monthly revenue forecast by entity
- **Language:** PySpark

#### Notebook 3: `consolidated_rollup`
- **Schedule:** Daily at 4:00 AM EST (after notebooks 1 and 2)
- **Purpose:** Cross-entity rollup for holdings-level reporting
- **Input:** Curated tables from notebooks 1 and 2
- **Output:** Consolidated Delta tables:
  - `consolidated_revenue` -- Revenue across all entities
  - `consolidated_headcount` -- Staff allocation and utilization
  - `consolidated_costs` -- Azure + vendor costs by entity
- **Language:** PySpark

#### Notebook 4: `a3_archive_validate`
- **Schedule:** On-demand (triggered by TAIA decommission decision)
- **Purpose:** Validate A3 archive completeness and data integrity
- **Input:** A3 extract files in lakehouse Files/a3-extract/
- **Output:** Validation report:
  - Row counts vs. source manifest
  - Schema validation per collection
  - Referential integrity checks (broker IDs in commissions exist in brokers)
  - Data quality score per collection
- **Language:** PySpark

### Execution Sequence
1. Develop `tvs_curated_transform` first (most critical for dashboards)
2. Deploy and test with 7-day backfill
3. Develop `consulting_pipeline` (parallel if consulting CRM is ready)
4. Develop `consolidated_rollup` (depends on notebooks 1 and 2)
5. Develop `a3_archive_validate` (on-demand, lower priority)
6. Schedule all notebooks via Fabric Data Factory pipelines

### Success Criteria
- All 4 notebooks execute without error
- Curated tables queryable via SQL analytics endpoint
- Daily schedule runs for 3 consecutive days with < 5% row count variance
- `a3_archive_validate` reports 100% integrity on A3 extract data
- Notebook execution time < 15 minutes each

### Rollback Plan
- Notebooks can be reverted to previous versions in Fabric
- Curated tables are derived data; drop and re-run from source
- Schedule can be paused independently per notebook

---

## Step 5: Power BI Dashboards

**Duration estimate:** 5-8 days
**Depends on:** Step 1 (automation data flowing), Step 4 (curated Fabric tables)

### Prerequisites
- Fabric curated tables populated (from Step 4 notebooks)
- Power BI Pro or Premium Per User licenses for report consumers
- Semantic model refresh configured

### Dashboards to Deploy

#### Dashboard 1: TVS Operations
- **Workspace:** `ws-tvs`
- **Data source:** `curated_subscriptions`, `curated_time_entries`, `curated_deliverables`
- **Pages:**
  - **Active Subscriptions**: Count by tier, MRR, churn rate
  - **VA Utilization**: Hours by VA, by client, utilization % against capacity
  - **Deliverable Tracking**: Completion rate, SLA adherence, aging report
  - **Automation Health**: Flow success rate, error trends, processing volume
- **Refresh:** Every 4 hours via Fabric pipeline

#### Dashboard 2: Consulting Pipeline
- **Workspace:** `ws-tvs` (shared)
- **Data source:** `curated_engagements`, `curated_prospects`, `curated_revenue_forecast`
- **Pages:**
  - **Pipeline Overview**: Prospects by stage, conversion funnel
  - **Revenue Forecast**: Monthly forecast vs. actual, by entity (Lobbi + Medicare)
  - **Engagement Health**: Active engagements, hours consumed, margin
  - **Client Concentration**: Revenue distribution, top client dependency
- **Refresh:** Daily (aligned with `consulting_pipeline` notebook)

#### Dashboard 3: Consolidated Holdings
- **Workspace:** `ws-tvs` (Markus-only initially)
- **Data source:** `consolidated_revenue`, `consolidated_headcount`, `consolidated_costs`
- **Pages:**
  - **Holdings Overview**: Revenue by entity, total headcount, total Azure cost
  - **Entity Comparison**: Side-by-side revenue, margins, growth rates
  - **Cost Analysis**: Azure costs by service, by entity, trend
  - **Workforce**: VA utilization across all entities, capacity planning
- **Refresh:** Daily (aligned with `consolidated_rollup` notebook)
- **Row-level security:** Markus sees all; entity leads see own entity only

### Execution Sequence
1. Build semantic models (star schemas) for each dashboard
2. Build TVS Operations dashboard first (highest operational value)
3. Build Consulting Pipeline dashboard
4. Build Consolidated Holdings dashboard
5. Configure refresh schedules and RLS
6. Publish to Power BI Service and configure workspace access

### Success Criteria
- All 3 dashboards published and accessible in Power BI Service
- Data refreshes on schedule without error for 3 consecutive days
- RLS verified: entity leads cannot see cross-entity data
- Markus sign-off on all 3 dashboards

### Rollback Plan
- Dashboards are visualization layers; no source data impact
- Previous semantic model versions available in Power BI Service
- Individual pages can be hidden while issues are resolved

---

## Step 6: Consulting CRM Deployment

**Command:** `/tvs:deploy-dataverse` (consulting environments)
**Agent:** platform-agent (FORGE)
**Duration estimate:** 3-5 days
**Depends on:** tvs-foundation.md Step 1 (Dataverse pattern established)

### Prerequisites
- Dataverse environments `consulting-prod` and `consulting-dev` provisioned
- PAC CLI authenticated to consulting environments
- ConsultingCore solution designed and developed in `consulting-dev`

### Execution Sequence
1. **Deploy ConsultingCore solution stack**:
   ```bash
   pac auth select --name "consulting-prod"
   pac solution import --path ./solutions/ConsultingCore_managed.zip \
     --activate-plugins true --force-overwrite true
   pac solution import --path ./solutions/ConsultingCRM_managed.zip \
     --activate-plugins true --force-overwrite true
   pac solution import --path ./solutions/ConsultingOps_managed.zip \
     --activate-plugins true --force-overwrite true
   ```
2. **Consulting-specific tables**:
   | Table | Entity | Purpose |
   |-------|--------|---------|
   | `rosa_engagement` | Both | Consulting engagement tracking |
   | `rosa_prospect` | Both | Sales pipeline prospects |
   | `rosa_implementation` | Both | Implementation project tracking |
   | `rosa_sharedprospect` | Shared | Cross-entity prospect sharing |
3. **Lobbi Consulting configuration**:
   - Business unit: Lobbi Consulting
   - Security roles: Consultant, Manager, Admin
   - Views and forms customized for Lobbi branding
4. **Medicare Consulting configuration**:
   - Business unit: Medicare Consulting
   - Additional HIPAA-compliant fields on engagement table
   - Audit logging enabled on all Medicare tables
   - Data retention policy: 7 years
5. **SharedProspects solution**: Enable cross-entity prospect sharing
   - Shared view: prospects visible to both Lobbi and Medicare teams
   - Ownership: prospect stays with originating entity
   - Handoff flow: transfer prospect ownership between entities

### Success Criteria
- All consulting tables deployed in `consulting-prod`
- Lobbi and Medicare business units configured with correct security
- HIPAA audit logging active on Medicare tables
- SharedProspects: prospect created in Lobbi visible to Medicare team
- Solution checker: 0 critical errors

### Rollback Plan
- `pac solution delete` in reverse order (ConsultingOps, ConsultingCRM, ConsultingCore)
- Consulting environments are separate from TVS; no cross-impact
- Business unit configuration can be modified without solution redeployment

---

## Full Platform Exit Criteria

All items must be green before proceeding to scale-polish.md:

- [ ] 20+ Power Automate flows active and healthy for 48 hours
- [ ] React broker portal deployed to Azure Static Web Apps
- [ ] All 3 Azure Functions deployed and processing events
- [ ] 4 Fabric notebooks scheduled and running daily
- [ ] 3 Power BI dashboards published with refresh schedules
- [ ] Consulting CRM deployed for Lobbi and Medicare entities
- [ ] End-to-end data flow: Stripe -> Dataverse -> Fabric -> Power BI
- [ ] Azure costs tracking within Tier 2 budget (~$2,610/mo)

## References

| Resource | Command / Agent |
|----------|----------------|
| Dataverse deployment | `/tvs:deploy-dataverse` / platform-agent (FORGE) |
| Fabric provisioning | `/tvs:deploy-fabric` / platform-agent (FORGE) |
| Identity management | identity-agent (SHIELD) |
| PAC CLI operations | `pac-cli` skill |
| Portal deployment | `/tvs:deploy-portal` |
| Teams configuration | `/tvs:deploy-teams` |
