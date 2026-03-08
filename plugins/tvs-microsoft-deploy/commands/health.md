---
name: tvs:health
intent: Unified health dashboard across all TVS Holdings entities with traffic-light status indicators
tags:
  - tvs-microsoft-deploy
  - command
  - health
inputs: []
risk: medium
cost: medium
description: Unified health dashboard across all TVS Holdings entities with traffic-light status indicators
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Task
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Unified Health Dashboard

Consolidated health view across all 5 TVS Holdings entities (TVS, TAIA, Lobbi Consulting, Medicare Consulting, Media). Produces a traffic-light dashboard aggregating license utilization, compliance posture, capacity, costs, billing, and transition countdown.

## Usage

```bash
/tvs:health [--entity <tvs|taia|consulting|medicare|media|all>] [--format <table|json|markdown>] [--export <path>] [--strict]
```

### Arguments

| Argument | Default | Description |
|----------|---------|-------------|
| `--entity` | `all` | Filter to a specific entity or show all |
| `--format` | `table` | Output format: `table`, `json`, or `markdown` |
| `--export` | _(none)_ | Export results to the specified file path |
| `--strict` | _(off)_ | Exit non-zero if any check returns RED status |

## Prerequisites

```bash
# Microsoft Graph access (delegated or app-only)
az account get-access-token --resource https://graph.microsoft.com --query accessToken -o tsv >/dev/null 2>&1 && echo "Graph API accessible"

# Azure cost access
az consumption usage list --top 1 2>/dev/null && echo "Cost API accessible"

# Fabric REST token
test -n "${FABRIC_TOKEN:-}" && echo "Fabric token set"

# Power Platform CLI
pac auth list 2>/dev/null | head -3 && echo "PAC CLI authenticated"

# Stripe CLI / key
test -n "${STRIPE_SECRET_KEY:-}" && echo "Stripe key set"
```

## Traffic-Light Definitions

| Color | Meaning | Criteria |
|-------|---------|----------|
| GREEN | Healthy | All thresholds within normal range |
| YELLOW | Warning | Approaching limits (>75% utilization) or minor drift detected |
| RED | Critical | Over limit, compliance failure, service degraded, or action overdue |

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance
> NOTE: This command is read-only -- no destructive operations

### Phase 1: EXPLORE (3 agents)

**Agent 1: azure-agent** (sonnet) -- Azure resource and cost data
- Query Azure Cost Management API for current billing period spend
- List resources by resource group per entity (rg-tvs-*, rg-taia-*, rg-consulting-*, rg-medicare-*, rg-media-*)
- Retrieve Azure Service Health status for active subscriptions

**Agent 2: analytics-agent** (opus) -- License and compliance data
- Query Microsoft Graph `/subscribedSkus` for license counts and assigned units per entity
- Query Microsoft Graph `/identity/conditionalAccess/policies` for compliance posture
- Query Dataverse storage via Power Platform admin API

**Agent 3: data-agent** (sonnet) -- Fabric and Stripe data
- Query Fabric REST API for workspace capacity utilization
- Query Stripe API for active subscriptions and billing status
- Pull Stripe balance and upcoming invoice data

### Phase 2: PLAN (1 agent)

**Agent: analytics-agent** (opus)
- Define threshold rules for each health dimension per entity
- Map collected data points to traffic-light status
- Calculate TAIA wind-down countdown (days remaining to 2026-06-30)

### Phase 3: CODE (2 agents)

**Agent 1: analytics-agent** (opus) -- Aggregation engine
- Aggregate all health signals into unified status model
- Apply threshold logic:
  - License utilization: GREEN <75%, YELLOW 75-90%, RED >90%
  - Fabric capacity: GREEN <70%, YELLOW 70-85%, RED >85%
  - Azure burn rate: GREEN <budget, YELLOW >80% budget, RED >100% budget
  - Conditional access: GREEN = all compliant, YELLOW = policies disabled, RED = gap detected
  - TAIA countdown: GREEN >90 days, YELLOW 30-90 days, RED <30 days
  - Stripe billing: GREEN = active/current, YELLOW = past due <7 days, RED = past due >7 days
  - Dataverse storage: GREEN <70%, YELLOW 70-85%, RED >85%
  - Power Platform: GREEN = all solutions imported, YELLOW = version drift, RED = failed import

**Agent 2: azure-agent** (sonnet) -- Entity-level detail
- Build per-entity resource summaries
- Calculate per-entity monthly burn rates

### Phase 4: TEST (1 agent)

**Agent: analytics-agent** (opus)
- Validate all API responses returned successfully
- Cross-check license counts against known entity headcounts
- Verify cost figures against last month baseline for anomaly detection

### Phase 5: FIX (1 agent)

**Agent: analytics-agent** (opus)
- Flag any data gaps as YELLOW with `[DATA UNAVAILABLE]` annotation
- Retry failed API calls once before marking as unavailable
- Log remediation hints for any RED items

### Phase 6: DOCUMENT (1 agent)

**Agent: analytics-agent** (opus)
- Render traffic-light dashboard in requested format
- Generate M365 operational output for Teams channel posting
- Export results if `--export` specified

## Implementation Steps

### Step 1: License Utilization via Graph API

Use `graph-api` skill to pull M365 license data per entity.

```bash
# Fetch subscribed SKUs
curl -s -H "Authorization: Bearer $GRAPH_TOKEN" \
  "https://graph.microsoft.com/v1.0/subscribedSkus" \
  | python3 -c "
import sys, json
skus = json.load(sys.stdin)['value']
for sku in skus:
    total = sku['prepaidUnits']['enabled']
    used = sku['consumedUnits']
    pct = (used / total * 100) if total > 0 else 0
    status = 'GREEN' if pct < 75 else ('YELLOW' if pct < 90 else 'RED')
    print(f'{status:6s} | {sku[\"skuPartNumber\"]:30s} | {used}/{total} ({pct:.0f}%)')
"
```

### Step 2: Entra Conditional Access Compliance

Use `graph-api` skill to check CA policy status across tenants.

```bash
# Check conditional access policies
curl -s -H "Authorization: Bearer $GRAPH_TOKEN" \
  "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies" \
  | python3 -c "
import sys, json
policies = json.load(sys.stdin)['value']
enabled = [p for p in policies if p['state'] == 'enabled']
disabled = [p for p in policies if p['state'] == 'disabled']
report_only = [p for p in policies if p['state'] == 'enabledForReportingButNotEnforced']
status = 'GREEN' if not disabled else ('YELLOW' if len(disabled) <= 2 else 'RED')
print(f'{status:6s} | Conditional Access | enabled={len(enabled)} disabled={len(disabled)} reportOnly={len(report_only)}')
"
```

### Step 3: Fabric Workspace Capacity Utilization

Use `fabric-rest` skill to query workspace capacity.

```bash
# Check Fabric capacity utilization
curl -s -H "Authorization: Bearer $FABRIC_TOKEN" \
  "https://api.fabric.microsoft.com/v1/capacities" \
  | python3 -c "
import sys, json
caps = json.load(sys.stdin).get('value', [])
for cap in caps:
    state = cap.get('state', 'Unknown')
    sku = cap.get('sku', 'N/A')
    status = 'GREEN' if state == 'Active' else ('YELLOW' if state == 'Paused' else 'RED')
    print(f'{status:6s} | Fabric {sku:6s} | {cap[\"displayName\"]:30s} | state={state}')
"
```

### Step 4: Azure Resource Costs (Current Month Burn Rate)

Use `az-cli` skill for Azure cost data.

```bash
# Current month cost by resource group
START_DATE=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)

az cost management query \
  --type ActualCost \
  --timeframe Custom \
  --time-period start="$START_DATE" end="$END_DATE" \
  --dataset-aggregation '{"totalCost":{"name":"Cost","function":"Sum"}}' \
  --dataset-grouping name="ResourceGroupName" type="Dimension" \
  2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
# Map resource groups to entities and calculate burn rates
ENTITY_MAP = {
    'rg-tvs': 'TVS',
    'rg-taia': 'TAIA',
    'rg-consulting': 'Consulting',
    'rg-medicare': 'Medicare',
    'rg-media': 'Media',
}
# Monthly budget thresholds per entity
BUDGETS = {'TVS': 500, 'TAIA': 200, 'Consulting': 300, 'Medicare': 150, 'Media': 100}
# Process and emit status per entity
"
```

### Step 5: TAIA Wind-Down Countdown

Calculate days remaining to the June 2026 deadline.

```bash
python3 -c "
from datetime import date
today = date.today()
deadline = date(2026, 6, 30)
remaining = (deadline - today).days
if remaining < 0:
    status = 'RED'
    label = f'OVERDUE by {abs(remaining)} days'
elif remaining < 30:
    status = 'RED'
    label = f'{remaining} days remaining -- CRITICAL'
elif remaining < 90:
    status = 'YELLOW'
    label = f'{remaining} days remaining -- approaching deadline'
else:
    status = 'GREEN'
    label = f'{remaining} days remaining'
print(f'{status:6s} | TAIA Wind-Down Countdown | {label} (deadline: 2026-06-30)')
"
```

### Step 6: Power Platform Solution Deployment Status

Use `pac-cli` skill to check solution status.

```bash
# Check Power Platform solutions per environment
for ENV_URL in "$TVS_DATAVERSE_ENV_URL" "$CONSULTING_DATAVERSE_ENV_URL"; do
    pac solution list --environment "$ENV_URL" 2>/dev/null | python3 -c "
import sys
lines = sys.stdin.readlines()
# Parse pac CLI table output for solution status
for line in lines[2:]:  # skip header
    cols = [c.strip() for c in line.split('|') if c.strip()]
    if len(cols) >= 3:
        name, version, managed = cols[0], cols[1], cols[2] if len(cols) > 2 else ''
        status = 'GREEN' if managed.lower() == 'true' else 'YELLOW'
        print(f'{status:6s} | {name:35s} | v{version} | managed={managed}')
"
done
```

### Step 7: Stripe Billing Status

Use `stripe-integration` skill for billing data.

```bash
# Check Stripe subscription status for TVS VA platform
curl -s -u "$STRIPE_SECRET_KEY:" \
  "https://api.stripe.com/v1/subscriptions?limit=10&status=all" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for sub in data.get('data', []):
    sid = sub['id'][:20]
    sub_status = sub['status']
    if sub_status == 'active':
        status = 'GREEN'
    elif sub_status in ('past_due', 'unpaid'):
        status = 'RED'
    elif sub_status == 'trialing':
        status = 'YELLOW'
    else:
        status = 'YELLOW'
    amount = sub.get('plan', {}).get('amount', 0) / 100
    print(f'{status:6s} | Stripe {sid:20s} | status={sub_status:12s} | \${amount:.2f}/mo')
"
```

### Step 8: Dataverse Storage Utilization

Use `pac-cli` skill for Dataverse storage metrics.

```bash
# Check Dataverse storage consumption
pac admin list-storage 2>/dev/null | python3 -c "
import sys
lines = sys.stdin.readlines()
for line in lines:
    if 'Database' in line or 'File' in line or 'Log' in line:
        parts = line.split()
        # Parse storage type, used, available
        # Apply thresholds: GREEN <70%, YELLOW 70-85%, RED >85%
        print(line.strip())
"
```

## Dashboard Aggregation

### Step 9: Render Traffic-Light Table

Combine all results into the unified dashboard.

```
===================================================================
  TVS HOLDINGS UNIFIED HEALTH DASHBOARD
  Generated: 2026-02-24 UTC
===================================================================

ENTITY          CHECK                         STATUS    DETAIL
------          -----                         ------    ------
ALL             M365 License Utilization      GREEN     18/23 assigned (78%)
ALL             Entra Conditional Access      GREEN     12 policies enabled, 0 disabled
TVS             Fabric Capacity (F2)          GREEN     Active, 45% utilized
TVS             Azure Burn Rate               GREEN     $387/$500 budget (77%)
TVS             Stripe Billing                GREEN     2 active subscriptions
TVS             Power Platform Solutions      GREEN     All managed, current version
TVS             Dataverse Storage             YELLOW    72% utilized (approaching limit)
TAIA            TAIA Wind-Down Countdown      GREEN     126 days remaining
TAIA            Azure Burn Rate               GREEN     $89/$200 budget (44%)
TAIA            A3 Firebase Extract           GREEN     Last sync: 2026-02-23
CONSULTING      Azure Burn Rate               GREEN     $142/$300 budget (47%)
CONSULTING      Power Platform Solutions      GREEN     All managed, current version
CONSULTING      Dataverse Storage             GREEN     54% utilized
MEDICARE        Azure Burn Rate               GREEN     $67/$150 budget (45%)
MEDIA           Azure Burn Rate               GREEN     $23/$100 budget (23%)

===================================================================
SUMMARY: 15 checks | 14 GREEN | 1 YELLOW | 0 RED
===================================================================
```

### JSON Output (--format json)

```json
{
  "timestamp": "2026-02-24T00:00:00Z",
  "summary": {
    "total_checks": 15,
    "green": 14,
    "yellow": 1,
    "red": 0,
    "overall": "GREEN"
  },
  "checks": [
    {
      "entity": "ALL",
      "check": "M365 License Utilization",
      "status": "GREEN",
      "detail": "18/23 assigned (78%)",
      "metric": 78.0,
      "threshold": { "green": 75, "yellow": 90 }
    }
  ]
}
```

### Markdown Output (--format markdown)

Produces a GitHub-flavored markdown table suitable for Teams channel posting or SharePoint pages.

## M365 Operational Output

After generating the dashboard, emit collaboration-ready outputs:

```bash
python plugins/tvs-microsoft-deploy/scripts/m365_operational_update.py \
  --event-type health-dashboard \
  --input plugins/tvs-microsoft-deploy/control-plane/out/health.json \
  --json-out plugins/tvs-microsoft-deploy/control-plane/out/health.m365.json \
  --ops-out plugins/tvs-microsoft-deploy/control-plane/out/health.ops-update.md
```

Use `health.m365.json` for Teams/Planner automation and `health.ops-update.md` for channel posting.

## Strict Mode

When `--strict` is passed, the command exits with code 1 if any check returns RED status. This enables CI/CD gating:

```bash
/tvs:health --entity all --strict --export plugins/tvs-microsoft-deploy/control-plane/out/health.json
# Exit code 0 = all GREEN/YELLOW
# Exit code 1 = at least one RED
```

## See Also

- `/tvs:status-check` -- Control-plane driven resource health validation
- `/tvs:cost-report` -- Detailed cost analysis with tier projections
- `/tvs:taia-readiness` -- TAIA-specific transition readiness assessment
- `/tvs:identity-drift` -- Entra identity compliance drift detection
- `skills/graph-api.md` -- Microsoft Graph API skill reference
- `skills/az-cli.md` -- Azure CLI skill reference
- `skills/fabric-rest.md` -- Fabric REST API skill reference
- `skills/pac-cli.md` -- Power Platform CLI skill reference
- `skills/stripe-integration.md` -- Stripe billing skill reference

## Unified Command Contract

### Contract
- **Schema:** `../cli/command.schema.json`
- **Required shared arguments:** `--entity`, `--tenant`
- **Optional shared safety arguments:** `--strict`, `--dry-run`, `--export-json`, `--plan-id`
- **Error catalog:** `../cli/error-codes.json`
- **Operator remediation format:** `../cli/operator-remediation.md`

### Shared argument patterns
```text
--entity <tvs|consulting|taia|medicare|media|all>
--tenant <tenant-id>
--strict
--dry-run
--export-json <path>
--plan-id <plan-id>
```

### Unified examples
```bash
# TVS only
/tvs:health --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# TAIA countdown focus
/tvs:health --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Consulting
/tvs:health --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# Medicare
/tvs:health --entity medicare --tenant medicare-prod --plan-id PLAN-MEDICARE-001

# Media
/tvs:health --entity media --tenant media-prod --plan-id PLAN-MEDIA-001

# Cross-entity strict mode with export
/tvs:health --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/health.json --plan-id PLAN-SAFE-001

# Markdown report for Teams posting
/tvs:health --entity all --format markdown --export plugins/tvs-microsoft-deploy/control-plane/out/health-report.md

# JSON for automation pipelines
/tvs:health --entity all --format json --export plugins/tvs-microsoft-deploy/control-plane/out/health.json
```
