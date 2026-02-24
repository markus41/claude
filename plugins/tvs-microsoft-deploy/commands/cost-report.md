---
name: tvs:cost-report
description: Cost analysis across all Rosa Holdings entities with tier projections
allowed-tools:
  - Bash
  - Read
  - Write
  - Grep
  - Task
---

# Cost Report

Calculates current Microsoft 365 + Azure + Fabric costs across all Rosa Holdings entities. Projects costs by tier and generates markdown report.

## Usage

```bash
/tvs:cost-report [--tier=1|2|3|all] [--format=markdown|json|csv]
```

## Prerequisites

```bash
# Azure cost access (read-only)
az account show --query name -o tsv
az consumption usage list --top 5 2>/dev/null && echo "Cost API accessible"
```

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance
> NOTE: This command is read-only — no destructive operations

### Phase 1: EXPLORE (2 agents)

**Agent 1: azure-agent** (sonnet)
- Query Azure Cost Management API for current spend
- List all resources by resource group (rg-rosa-*)
- Identify top cost drivers

**Agent 2: analytics-agent** (opus)
- Query M365 admin center for license counts
- Calculate per-user licensing costs
- Estimate Fabric capacity consumption

### Phase 2: PLAN (1 agent)

**Agent: analytics-agent** (opus)
- Map costs to entities (TVS, TAIA, Consulting, Media)
- Define tier 1/2/3 projections based on feature adoption
- Identify cost optimization opportunities

### Phase 3: CODE (2 agents)

**Agent 1: analytics-agent** (opus)
- Build cost calculation model
- Generate tier comparison matrix
- Calculate ROI projections

**Agent 2: azure-agent** (sonnet)
- Pull actual Azure consumption data
- Calculate Functions execution costs
- Estimate Static Web App bandwidth costs

### Phase 4: TEST (2 agents)

**Agent 1: analytics-agent** (opus)
- Validate totals against known billing
- Cross-check license counts against Entra

**Agent 2: azure-agent** (sonnet)
- Verify Azure cost data accuracy against portal

### Phase 5: FIX (1 agent)

**Agent: analytics-agent** (opus)
- Reconcile any discrepancies
- Adjust projections based on findings

### Phase 6: DOCUMENT (1 agent)

**Agent: analytics-agent** (opus)
- Generate cost report markdown
- Create tier comparison table
- Produce optimization recommendations

## Cost Model

### Microsoft 365 Licensing

| License | Count | Unit Cost | Monthly |
|---------|-------|-----------|---------|
| Business Premium | 10 | $22.00 | $220.00 |
| Business Basic | 2 | $6.00 | $12.00 |
| Frontline F3 | 11 | $8.00 | $88.00 |
| **Subtotal** | **23** | | **$320.00** |

### Tier Projections

| Component | Tier 1 | Tier 2 | Tier 3 |
|-----------|--------|--------|--------|
| M365 Licenses | $320 | $320 | $320 |
| Azure Resources | $150 | $450 | $1,200 |
| Fabric Capacity (F2) | $262 | $262 | $524 |
| Power Pages | $0 | $800 | $1,600 |
| Power Automate | $0 | $150 | $450 |
| Premium Connectors | $0 | $0 | $300 |
| App Insights | $17 | $28 | $89 |
| Stripe Fees (~3%) | $0 | $0 | $0 |
| GitHub (Team) | $0 | $0 | $0 |
| **Total** | **~$1,349** | **~$2,610** | **~$5,083** |

### TAIA Decommission Savings

Post-sale (est. June 2026):
- TAIA tenant licenses: -$176/mo (8 users estimated)
- A3 Firebase: -$50/mo
- Net savings: ~$226/mo

## Output

```
Rosa Holdings Cost Report — February 2026

Current Monthly: $1,349 (Tier 1)
Projected Tier 2: $2,610 (+93%)
Projected Tier 3: $5,083 (+277%)

Top Recommendations:
1. Start at Tier 1, upgrade to Tier 2 when portal launches
2. Use F2 Fabric capacity with auto-pause to minimize idle costs
3. Leverage Azure Functions consumption plan (pay-per-execution)
```

## See Also

- `workflows/scale-polish.md` — Cost monitoring in final phase
- `/tvs:status-check` — Includes resource inventory
