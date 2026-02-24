# TVS Platform Foundation Build

> **Workflow:** tvs-microsoft-deploy / tvs-foundation
> **Duration:** 2-3 weeks
> **Owner:** Markus (#10, Global Admin)
> **Primary entity:** TVS (Trusted Virtual Solutions)
> **Depends on:** week1-critical-path.md (all steps complete)

---

## Dependency Graph

```
week1-critical-path.md ──┐
                          │
[1] Dataverse schema ─────┤
         │                │
         ├── blocks [3] Power Pages (tables must exist for portal)
         ├── blocks [4] Copilot Studio (topics reference Dataverse)
         ├── blocks [5] Power Automate (flows CRUD Dataverse rows)
         └── blocks [6] Stripe wiring (subscription table required)
                          │
[2] Fabric workspace ─────┤   (parallel with Step 1)
         │                │
         └── blocks full-platform.md (notebooks need lakehouse)
                          │
[3] Power Pages v1 ───────┤
         │                │
         └── blocks [6] Stripe wiring (portal hosts subscription UI)
                          │
[4] Copilot Studio v1 ────┤   (parallel with Step 3)
         │                │
         └── blocks [5] Power Automate (bot triggers flows)
                          │
[5] Power Automate core ──┤
         │                │
         └── blocks [6] Stripe wiring (subscription flow required)
                          │
[6] Stripe wiring ────────┤
         │                │
         └── blocks full-platform.md (portal billing active)
                          │
[7] Teams VA workspace ───┘   (parallel with Steps 3-6)
         │
         └── blocks full-platform.md (VA collaboration active)
```

**Parallel tracks:** Steps 1+2 run concurrently. Steps 3+4+7 run concurrently after Step 1.

---

## Step 1: Dataverse Schema Deployment

**Command:** `/tvs:deploy-dataverse`
**Agent:** platform-agent (FORGE)
**Duration estimate:** 2-3 days
**Depends on:** week1-critical-path.md Step 4 (Entra app registrations exist)

### Prerequisites
- Entra app registration `app-rosa-ingest` with Dataverse permissions
- PAC CLI authenticated to `tvs-prod` environment
- Dataverse environment `tvs-prod` provisioned (1 GB initial capacity)

### Execution Sequence
1. **Authenticate PAC CLI**:
   ```bash
   pac auth create --name "tvs-prod" \
     --environment "https://tvs-prod.crm.dynamics.com" \
     --tenant "rosa-holdings.onmicrosoft.com" --kind Admin
   ```
2. **Deploy TVSCore solution** with tables:
   | Table | Display Name | Purpose |
   |-------|-------------|---------|
   | `rosa_broker` | Broker | Agent/broker records from A3 migration |
   | `rosa_carrier` | Carrier | Canonical carrier table from normalization |
   | `rosa_commission` | Commission | Commission transaction records |
   | `rosa_subscription` | Subscription | TVS client subscriptions (Stripe-linked) |
   | `rosa_task` | Task | VA task assignments and tracking |
   | `rosa_timeentry` | Time Entry | VA time tracking per task |
   | `rosa_deliverable` | Deliverable | Client deliverable tracking |
   | `rosa_automationlog` | Automation Log | Power Automate execution log |
   | `rosa_contact` | Contact | Extended contact records |
   | `rosa_activity` | Activity | CRM activities and notes |
3. **Deploy TVS solution stack**:
   ```bash
   pac solution import --path ./solutions/TVSCore_managed.zip \
     --activate-plugins true --force-overwrite true --async true
   pac solution import --path ./solutions/TVSAccounts_managed.zip \
     --activate-plugins true --force-overwrite true --async true
   pac solution import --path ./solutions/TVSOperations_managed.zip \
     --activate-plugins true --force-overwrite true --async true
   ```
4. **Configure security roles**:
   - TVS Admin: Full CRUD on all tables
   - TVS Broker: Read on broker/carrier/commission; Create on activity
   - TVS VA: CRUD on task/timeentry/deliverable; Read on subscription
5. **Set environment variables** referencing Key Vault:
   - `rosa_keyvault_url` = `https://kv-rosa-holdings.vault.azure.net/`
   - `rosa_ingest_func_url` = `https://func-rosa-ingest.azurewebsites.net/api/`
   - `stripe_webhook_secret` = Key Vault reference

### Success Criteria
- All 10 tables visible in Dataverse with correct columns and relationships
- Solution checker: 0 critical errors, 0 high warnings
- Security roles assigned to test users; permission matrix verified
- Environment variables resolve correctly from Key Vault

### Rollback Plan
- `pac solution delete --solution-name "TVSOperations"` (reverse import order)
- Dataverse retains data even after solution delete; explicit table delete required for full rollback
- Environment variables can be updated in-place without redeployment

---

## Step 2: Fabric Workspace Provisioning

**Command:** `/tvs:deploy-fabric`
**Agent:** platform-agent (FORGE)
**Duration estimate:** 1 day
**Depends on:** week1-critical-path.md Step 4 (Fabric service principal registered)

### Prerequisites
- Entra app registration `app-fabric-pipeline` with Fabric permissions
- Fabric capacity allocated (F2 minimum for development)
- Markus has Fabric admin role

### Execution Sequence
1. **Create workspace**: `ws-tvs` in Fabric portal
2. **Create lakehouse**: `lh-tvs` within `ws-tvs`
   - Tables layer: structured data from Dataverse sync
   - Files layer: raw extracts, CSVs, JSON archives
3. **Folder structure** in lakehouse Files:
   ```
   Files/
     a3-extract/          # Raw A3 Firebase exports (from Week 1)
     carrier-normalized/  # Canonical carrier data
     commission-raw/      # Raw commission extracts
     commission-curated/  # Transformed commission data
     archive/             # Historical snapshots
   ```
4. **Create SQL analytics endpoint** for direct Power BI connectivity
5. **Configure workspace access**:
   - Markus: Admin
   - `app-fabric-pipeline`: Contributor
   - Analytics team: Viewer
6. **Copy A3 extracts** from `strosadata/a3-extract/` to lakehouse Files/a3-extract/

### Success Criteria
- Workspace `ws-tvs` visible in Fabric portal
- Lakehouse `lh-tvs` created with folder structure
- A3 extract files copied and accessible
- SQL analytics endpoint active and queryable
- Service principal can read/write via API

### Rollback Plan
- Delete workspace (removes all child items)
- A3 extract source data remains in Azure Blob Storage
- Fabric capacity can be reassigned to different workspace

---

## Step 3: Power Pages v1 -- Broker Portal Scaffold

**Agent:** platform-agent (FORGE)
**Duration estimate:** 3-5 days
**Depends on:** Step 1 (Dataverse tables must exist for portal binding)

### Prerequisites
- TVSCore solution deployed with broker, carrier, commission tables
- Entra app registration `app-broker-portal` for SPA authentication
- Power Pages license allocated

### Execution Sequence
1. **Create Power Pages site**: `tvs-broker-portal`
   ```bash
   pac pages create --name "tvs-broker-portal" \
     --template "Starter Portal" \
     --language "en-us"
   ```
2. **Configure authentication**:
   - Provider: Entra ID (B2C recommended for external brokers)
   - Redirect URI: `https://tvs-broker-portal.powerappsportals.com`
   - Self-registration: Enabled with admin approval
3. **Core pages**:
   - **Home**: Welcome, quick stats, recent activity
   - **My Carriers**: List of broker's carrier appointments
   - **Commissions**: Commission statement viewer (read-only)
   - **Profile**: Broker profile editor (limited fields)
   - **Support**: Contact form linked to Dataverse activity
4. **Table permissions**:
   - `rosa_broker`: Read own record (self-scope)
   - `rosa_carrier`: Read all (global scope, filtered by broker relationship)
   - `rosa_commission`: Read own commissions (account scope)
   - `rosa_activity`: Create (self-scope), Read own (account scope)
5. **Web roles**:
   - `Broker`: Standard access to own data
   - `BrokerAdmin`: Access to all brokers in downline
6. **Download for source control**:
   ```bash
   pac pages download --path "./pages/tvs-broker-portal/" --overwrite true
   ```

### Success Criteria
- Portal loads at assigned URL with Entra authentication
- Broker can sign in and see own carrier appointments
- Commission page displays data from Dataverse (test with sample records)
- Table permissions prevent cross-broker data access
- Portal source committed to GitHub monorepo

### Rollback Plan
- Delete Power Pages site and recreate from source control
- Dataverse data is not affected by portal operations
- Authentication config stored in Entra (separate from portal)

---

## Step 4: Copilot Studio v1 -- VA Assistant Bot

**Agent:** platform-agent (FORGE)
**Duration estimate:** 2-3 days
**Depends on:** Step 1 (Dataverse tables for bot topic data)

### Prerequisites
- Dataverse tables deployed (Step 1)
- Copilot Studio license allocated
- Teams channel for bot deployment (see Step 7)

### Execution Sequence
1. **Create bot**: `TVS VA Assistant` in Copilot Studio
2. **Core topics**:
   - **Task lookup**: "What tasks are assigned to me?" -- queries `rosa_task`
   - **Time entry**: "Log 2 hours on task X" -- creates `rosa_timeentry` row
   - **Deliverable status**: "What deliverables are due this week?" -- queries `rosa_deliverable`
   - **Client info**: "Show me client X details" -- queries `rosa_subscription`
   - **Escalation**: "I need help with..." -- creates activity + notifies supervisor
3. **Entities**:
   - `TaskName`: Populated from `rosa_task` active tasks
   - `ClientName`: Populated from `rosa_subscription` active subscriptions
   - `TimeAmount`: Number extraction (hours/minutes)
4. **Power Automate connectors**:
   - Create time entry flow (triggered from bot)
   - Task status update flow (triggered from bot)
5. **Deploy to Teams**: Publish bot to TVS Teams workspace

### Success Criteria
- Bot responds correctly to all 5 core topics
- Time entry topic creates valid `rosa_timeentry` records
- Task lookup returns correct data scoped to requesting VA
- Bot deployed and accessible in Teams VA channels

### Rollback Plan
- Unpublish bot from Teams (immediate, no data loss)
- Bot topics can be edited and republished within minutes
- Dataverse records created by bot are standard rows (deletable)

---

## Step 5: Core Power Automate Flows (Top 5)

**Agent:** platform-agent (FORGE)
**Duration estimate:** 3-5 days
**Depends on:** Step 1 (Dataverse), Step 4 (bot triggers some flows)

### Prerequisites
- Dataverse schema deployed with all TVS tables
- Key Vault secrets accessible by flow connections
- Stripe API key in Key Vault (test mode initially)

### The 5 Core Flows

#### Flow 1: New Subscription
**Trigger:** Stripe webhook (via Azure Function) creates `rosa_subscription` row
**Actions:**
1. Receive webhook payload from `func-stripe-webhook`
2. Create `rosa_subscription` record in Dataverse
3. Create initial `rosa_task` records from subscription template
4. Notify assigned VA team via Teams adaptive card
5. Log to `rosa_automationlog`

#### Flow 2: Task Assignment
**Trigger:** `rosa_task` row created or `assignedto` field modified
**Actions:**
1. Notify assigned VA via Teams (adaptive card with accept/decline)
2. If declined: Reassign to supervisor queue
3. Update task status to "Assigned" or "Pending Reassignment"
4. Log to `rosa_automationlog`

#### Flow 3: Time Entry
**Trigger:** `rosa_timeentry` row created (from bot or manual)
**Actions:**
1. Validate time entry (non-negative, within business hours, task exists)
2. Update `rosa_task` total hours
3. Check if task hours exceed subscription allocation
4. If over allocation: notify supervisor with hours summary
5. Log to `rosa_automationlog`

#### Flow 4: Deliverable Completion
**Trigger:** `rosa_deliverable` status changed to "Complete"
**Actions:**
1. Notify client via email (template with deliverable summary)
2. Update related `rosa_task` status to "Delivered"
3. Create satisfaction survey activity
4. Log to `rosa_automationlog`

#### Flow 5: Automation Log
**Trigger:** Scheduled (daily 6:00 AM EST)
**Actions:**
1. Aggregate previous day `rosa_automationlog` entries
2. Generate daily digest: flows run, errors, processing time
3. Post digest to Teams `#ops-automation` channel
4. If error count > 5: notify Markus directly

### Success Criteria
- All 5 flows deployed and active in `tvs-prod` environment
- End-to-end test: Stripe test webhook triggers Flow 1 through Flow 5
- Error rate < 1% over 24-hour test period
- Automation log captures all flow executions

### Rollback Plan
- Individual flows can be turned off without affecting others
- Dataverse rows created by flows are standard records (correctable)
- Flow history retained for 28 days for debugging

---

## Step 6: Stripe Wiring

**Command:** `/tvs:deploy-portal` (subset: Stripe integration)
**Duration estimate:** 2-3 days
**Depends on:** Steps 1, 3, and 5 (Dataverse, portal, and subscription flow)

### Stripe Tier Configuration

| Tier | Name | Monthly Price | Hours Included | Overage Rate |
|------|------|--------------|----------------|--------------|
| Starter | TVS Starter | $360/mo | 20 hours | $20/hr |
| Basic | TVS Basic | $640/mo | 40 hours | $18/hr |
| Advanced | TVS Advanced | $1,200/mo | 80 hours | $16/hr |

### Azure Cost Context

| Cost Tier | Monthly Azure | Included Services |
|-----------|--------------|-------------------|
| Tier 1 | ~$1,349/mo | Entra + Dataverse + basic Fabric |
| Tier 2 | ~$2,610/mo | + Power Pages + Functions + expanded Fabric |
| Tier 3 | ~$5,083/mo | Full platform: all services at scale |

### Execution Sequence
1. **Create Stripe products and prices**:
   - Product: "TVS Virtual Assistant Services"
   - Price: 3 recurring monthly prices matching tier table above
   - Metadata: `tier=starter|basic|advanced`, `hours=20|40|80`
2. **Deploy Stripe webhook handler** (`functions/stripe-webhook/`):
   - Events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Verify webhook signature using secret from Key Vault
   - On `checkout.session.completed`: trigger Flow 1 (new subscription)
   - On `invoice.paid`: update `rosa_subscription` payment status
   - On subscription change: update tier and hours allocation
3. **Broker portal integration**:
   - Add Stripe Checkout session creation to Power Pages subscription page
   - Display current tier and usage in broker dashboard
   - Show upgrade/downgrade options with Stripe Customer Portal link
4. **Test end-to-end** (Stripe test mode):
   - Create test subscription via portal
   - Verify webhook fires and Flow 1 executes
   - Verify Dataverse `rosa_subscription` row created with correct tier

### Success Criteria
- 3 Stripe products/prices created matching tier table
- Webhook handler deployed and receiving test events
- Portal subscription page renders Stripe Checkout
- End-to-end test: signup -> webhook -> Dataverse -> VA notification
- All Stripe secrets stored in Key Vault (never in code)

### Rollback Plan
- Stripe test mode: no real charges; delete test products if needed
- Webhook handler is a standalone Azure Function (redeploy independently)
- Portal Stripe integration is a single page (revert via `pac pages upload`)

---

## Step 7: Teams VA Workspace

**Command:** `/tvs:deploy-teams`
**Agent:** identity-agent (SHIELD)
**Duration estimate:** 1-2 days
**Depends on:** week1-critical-path.md Step 5 (VAs have FIDO2 access)

### Prerequisites
- All 11 Philippines VAs have active Entra accounts with FIDO2
- Teams licensing included in Frontline F3
- HIPAA compliance configuration (Medicare Consulting entity)

### Execution Sequence
1. **Create Teams team**: `TVS Operations` (private)
2. **Channels per entity**:
   | Channel | Purpose | Members |
   |---------|---------|---------|
   | `#general` | Company-wide announcements | All staff |
   | `#taia-operations` | TAIA wind-down tasks | TAIA-assigned VAs + Markus |
   | `#tvs-clients` | TVS client work | TVS-assigned VAs + Markus |
   | `#lobbi-consulting` | Lobbi project coordination | Consulting VAs + Markus |
   | `#medicare-consulting` | Medicare project coordination | Medicare VAs + Markus |
   | `#media-company` | Media company tasks | Media-assigned VAs + Markus |
   | `#ops-automation` | Automation log digests | All VAs + Markus |
   | `#escalations` | Supervisor escalation queue | Supervisors + Markus |
3. **HIPAA configuration** (Medicare Consulting channels):
   - Disable guest access on medicare-consulting channel
   - Enable message encryption
   - Disable third-party app integrations in HIPAA channels
   - Retention policy: 7 years for Medicare-related messages
4. **Install apps**:
   - TVS VA Assistant bot (from Step 4)
   - Planner (task boards per entity)
   - Approvals (for deliverable sign-off)
5. **Configure notifications**:
   - Adaptive card templates for task assignment, time entry alerts, escalations
   - Quiet hours: respect Philippines timezone (UTC+8)

### Success Criteria
- Teams team created with all 8 channels
- All 11 PH VAs + Markus + stateside staff can access appropriate channels
- HIPAA compliance settings verified on Medicare channels
- TVS VA Assistant bot responds in Teams
- Notification adaptive cards render correctly

### Rollback Plan
- Teams team can be archived (preserves data) or deleted
- Channel configuration changes are immediate
- Bot can be unpublished from Teams without affecting bot definition

---

## TVS Foundation Exit Criteria

All items must be green before proceeding to full-platform.md:

- [ ] Dataverse: 10 TVS tables deployed with security roles
- [ ] Fabric: Workspace `ws-tvs` with lakehouse and A3 data copied
- [ ] Power Pages: Broker portal accessible with Entra auth
- [ ] Copilot Studio: VA bot responding to 5 core topics
- [ ] Power Automate: 5 core flows active and tested
- [ ] Stripe: 3 tiers wired, webhook handler deployed
- [ ] Teams: 8 channels configured, HIPAA verified, bot installed
- [ ] End-to-end: New subscription flows from Stripe to VA notification

## Cost Tracking (Post-Foundation)

After TVS foundation is complete, the running Azure cost profile should align with:

| Component | Monthly Cost | Cost Tier |
|-----------|-------------|-----------|
| Entra ID (23 users) | ~$290 | Tier 1 |
| Dataverse (2 environments) | ~$400 | Tier 1 |
| Fabric (F2 capacity) | ~$260 | Tier 1 |
| Power Pages (1 site) | ~$200 | Tier 2 |
| Azure Functions (consumption) | ~$20 | Tier 1 |
| Key Vault | ~$5 | Tier 1 |
| **Total (foundation)** | **~$1,175** | **Tier 1** |

Full Tier 2 costs (~$2,610/mo) expected after full-platform.md completion.
