---
name: tvs:deploy-portal
description: Power Pages and Copilot Studio deployment - broker portal, Stripe billing widget, conversational bots
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Power Pages + Copilot Studio Deployment

Deploys the TVS broker portal on Power Pages with integrated Stripe billing widget for subscription management (Starter $360/20hrs, Basic $640/40hrs, Advanced $1200/80hrs). Deploys Copilot Studio conversational bots for broker self-service and VA task intake.

## Usage

```
/tvs:deploy-portal [--component portal|copilot|stripe|all] [--env dev|staging|prod]
```

## Prerequisites

```bash
# 1. PAC CLI authentication
pac auth list | grep -q "Active" || { echo "FAIL: pac auth required"; exit 1; }

# 2. Stripe API key for billing widget
[ -z "$STRIPE_SECRET_KEY" ] && { echo "FAIL: STRIPE_SECRET_KEY not set"; exit 1; }

# 3. Validate Stripe key works
curl -sf -u "$STRIPE_SECRET_KEY:" "https://api.stripe.com/v1/products" > /dev/null \
  || { echo "FAIL: Stripe API key invalid"; exit 1; }

# 4. Verify Stripe products exist for TVS tiers
PRODUCTS=$(curl -s -u "$STRIPE_SECRET_KEY:" "https://api.stripe.com/v1/products?active=true" \
  | jq -r '.data[].name')
for tier in "Starter" "Basic" "Advanced"; do
  echo "$PRODUCTS" | grep -q "$tier" || echo "WARN: Stripe product '$tier' not found - will create"
done

# 5. Dataverse environment accessible (portal reads from Dataverse)
[ -z "$TVS_DATAVERSE_ENV_URL" ] && { echo "FAIL: TVS_DATAVERSE_ENV_URL required for portal data"; exit 1; }
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Portal Auditor:**
- Check for existing Power Pages sites via `pac pages list`
- Enumerate existing portal web roles, entity permissions, web templates
- Verify Dataverse tables required by portal (tvs_account, tvs_subscription, tvs_contact) exist
- Check for existing portal custom JavaScript and CSS assets
- Identify any active portal that would conflict with new deployment

**Agent 2 - Copilot + Stripe Auditor:**
- List existing Copilot Studio bots in the environment
- Check Stripe subscription products and pricing configuration:
  - Starter: $360/month, 20 VA hours
  - Basic: $640/month, 40 VA hours
  - Advanced: $1,200/month, 80 VA hours
- Verify Stripe webhook endpoint exists for subscription events
- Check for existing Stripe billing portal configuration
- Verify `stapp-broker-*` static web app exists for widget hosting

### Phase 2: PLAN (1 agent)

**Agent 3 - Portal Planner:**
- Design portal page hierarchy:
  - Home / Dashboard (subscription status, hours remaining, recent tasks)
  - My Tasks (task list, status tracking, deliverable downloads)
  - Billing (Stripe subscription management, plan comparison, invoices)
  - Support (Copilot Studio bot embed, knowledge base articles)
  - Account Settings (contact info, notification preferences)
- Plan Copilot Studio bot topics:
  - Greeting and authentication
  - Task creation and status inquiry
  - Billing questions and plan changes
  - Escalation to human support
- Design Stripe integration flow: portal widget embeds Stripe Customer Portal
- Plan web roles: Broker (read own data), Admin (read all, manage subscriptions)

### Phase 3: CODE (2 agents)

**Agent 4 - Portal Deployer:**
- Create Power Pages site via `pac pages create` or PAC CLI
- Deploy web templates for each page (HTML/Liquid templates)
- Configure entity permissions: tvs_account (read own), tvs_task (read/create own), tvs_subscription (read own)
- Set up web roles: Broker, BrokerAdmin
- Deploy custom JavaScript for Stripe widget embed:
  ```javascript
  // Embed Stripe billing portal link
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    body: JSON.stringify({ customer_id: currentUser.stripeCustomerId })
  });
  ```
- Configure site settings: authentication (Entra ID), theme, branding
- Deploy CSS customizations for TVS branding

**Agent 5 - Copilot + Stripe Deployer:**
- Create Copilot Studio bot via Power Virtual Agents APIs
- Configure bot authentication with Entra ID SSO
- Build conversation topics:
  - Task Status: queries tvs_task by logged-in contact, returns status summary
  - Create Task: collects title, description, priority; creates tvs_task record
  - Billing Inquiry: fetches tvs_subscription, reports hours used vs. allocated
  - Plan Upgrade: triggers Stripe checkout session for plan change
- Create/verify Stripe products and prices if missing
- Deploy Azure Function `func-tvs-ingest` endpoint for Stripe webhooks
- Configure Stripe webhook to call function on `customer.subscription.updated` events
- Embed Copilot bot iframe in portal Support page

### Phase 4: TEST (2 agents)

**Agent 6 - Portal Functional Tester:**
- Verify portal loads at configured URL without errors
- Test authentication flow: Entra ID login redirects to portal dashboard
- Confirm dashboard shows subscription data from Dataverse
- Test task list page renders tvs_task records for logged-in broker
- Verify Stripe billing widget loads and displays current plan
- Test entity permissions: Broker cannot see other brokers' data

**Agent 7 - Bot + Payment Tester:**
- Interact with Copilot Studio bot: send test messages for each topic
- Verify bot retrieves correct task status from Dataverse
- Test task creation via bot, confirm record appears in Dataverse
- Send test Stripe webhook event, verify tvs_subscription updates in Dataverse
- Test Stripe Customer Portal link generation and redirect
- Confirm billing page shows correct tier pricing

### Phase 5: FIX (1 agent)

**Agent 8 - Portal Remediator:**
- Fix entity permission errors causing blank pages (missing web role assignments)
- Resolve Copilot bot authentication failures (token relay misconfiguration)
- Fix Stripe widget embedding issues (CSP headers, CORS)
- Handle Stripe webhook signature validation failures
- Fall back to `tvs:browser-fallback` for portal configurations that lack API support
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 9 - Portal Documenter:**
- Generate portal deployment report: pages, web roles, entity permissions
- Document Copilot Studio bot topics and conversation flows
- Record Stripe product IDs, price IDs, webhook endpoint URL
- List all portal URLs and access credentials for testing
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 5 sub-agents enforced. Portal deployment depends on `tvs:deploy-identity` (Entra ID auth) and `tvs:deploy-dataverse` (tables for portal entity lists).

## Stripe Tier Reference

| Plan | Monthly | VA Hours | Stripe Product |
|------|---------|----------|----------------|
| Starter | $360 | 20 hrs | prod_tvs_starter |
| Basic | $640 | 40 hrs | prod_tvs_basic |
| Advanced | $1,200 | 80 hrs | prod_tvs_advanced |
