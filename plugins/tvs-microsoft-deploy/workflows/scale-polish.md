# Scale, Polish, and Consolidation

**Phase:** Month 4+ | **Prerequisites:** Full Platform Deployment complete | **Priority:** P2-P3

## Overview

Final phase: remaining automations, consolidated holdings dashboard, Lobbi platform API integration, media company analytics, husband entity onboarding, and production monitoring.

## Agent Assignment by Phase

| Phase | Primary Agent | Supporting Agents | Exit Handoff |
|---|---|---|---|
| Step 1: Remaining automation flows | planner-orchestrator-agent | platform-agent, client-solution-architect-agent | Automation operations baseline |
| Step 2: Consolidated dashboard | embedded-analytics-agent | analytics-agent, fabric-pipeline-agent | Published dashboard + RLS test |
| Step 3: Lobbi platform API integration | client-solution-architect-agent | azure-agent, embedded-analytics-agent | API contract + auth decision record |
| Step 4: Media company analytics | fabric-pipeline-agent | embedded-analytics-agent, analytics-agent | Media ingestion and model runbook |
| Step 5: Husband entity onboarding | client-solution-architect-agent | m365-governance-agent, planner-orchestrator-agent | Entity onboarding checklist |
| Step 6: Monitoring + alerting | azure-agent | m365-governance-agent, planner-orchestrator-agent | Alert routing matrix |
| Step 7: Security hardening | m365-governance-agent | identity-agent, client-solution-architect-agent | Compliance closure memo |

### Future Client-Delivery Rule
- Reuse this phase-assignment pattern when creating any new client-delivery workflow in `workflows/`.

## Dependency Graph

```
full-platform (complete)
  ├── 1. Remaining Automations (P1)
  ├── 2. Consolidated Dashboard (P1)
  ├── 3. Lobbi Platform API (P2)
  ├── 4. Media Analytics (P3)
  ├── 5. Husband Entities (P3)
  ├── 6. App Insights Monitoring (P2)
  └── 7. Security Hardening (P1)
```

## Steps

### Step 1: Remaining Automation Flows (P1)

**Agent:** platform-agent (sonnet)

Deploy schedule-based, event-driven, and approval chain flows:

- **Schedule-based:** Monthly reporting, quarterly reviews, annual compliance checks
- **Event-driven:** Dataverse record changes trigger downstream updates
- **Approval chains:** Multi-level approval for engagements > $50K, production deployments
- **Integration flows:** Paylocity bi-directional sync, Stripe reconciliation

### Step 2: Consolidated Holdings Dashboard (P1)

**Agent:** analytics-agent (opus)
**Command:** `/tvs:deploy-fabric` (consolidated subset)

Build the cross-entity Fabric rollup:
- Revenue by entity (TVS subscriptions, consulting engagements)
- Headcount and cost allocation per entity
- Entity health scores (automation coverage, data quality, user adoption)
- Burn rate and runway projections

Power BI report published to consolidated/ workspace, accessible to TVS board.

### Step 3: Lobbi Platform API Integration (P2)

**Agent:** azure-agent (sonnet), github-agent (sonnet)

Expose consolidated TVS data to lobbi.io platform:
- REST API endpoints for entity metrics
- OAuth 2.0 authentication via Entra app registration
- Rate limiting and API key management via Azure API Management
- Webhook notifications for significant events

### Step 4: Media Company Analytics (P3)

**Agent:** analytics-agent (opus)
**Due:** Month 3+

Basic metrics pipeline for Media Company entity:
- Provision media/ Fabric workspace and lakehouse
- Connect media data sources (TBD — depends on Jira decision: media metrics sources)
- Basic engagement and audience metrics
- Cross-entity cost allocation

### Step 5: Husband Entity Onboarding (P3)

**Agent:** identity-agent (opus), consulting-crm-agent (sonnet)
**Due:** Month 4+

Onboard additional entities (Lighthouse, others TBD):
- Entra ID tenant setup or shared tenant provisioning
- Dataverse environment if CRM needed
- Fabric workspace for analytics
- Teams channel in VA workspace
- Cost allocation in consolidated dashboard

Depends on Jira decision: husband entity count and Lighthouse onboarding timeline.

### Step 6: App Insights Monitoring + Alerting (P2)

**Agent:** azure-agent (sonnet)
**Command:** `/tvs:deploy-azure` (monitoring subset)

Production monitoring across all Azure resources:
- Function failure alerts (> 5% error rate → PagerDuty/Teams)
- Static Web App 5xx alerts
- Key Vault access anomaly detection
- Fabric capacity utilization alerts (> 80% → scale warning)
- Cost anomaly alerts (> 20% increase week-over-week)

### Step 7: Security Hardening (P1)

**Agent:** identity-agent (opus)

Pre-production security review:
- Penetration test preparation and scope definition
- Conditional access policy audit
- Key Vault access review and rotation schedule
- HIPAA compliance checklist completion
- App registration permission audit (least privilege)
- Network security: Private endpoints for Functions and Key Vault

## Completion Criteria

- [ ] All automation flows deployed and monitored
- [ ] Consolidated holdings dashboard live with all entities
- [ ] Lobbi platform API documented and accessible
- [ ] Media company pipeline operational (or deferred per decision)
- [ ] Husband entities onboarded (or timeline confirmed)
- [ ] App Insights alerts configured and tested
- [ ] Security audit completed with no critical findings
- [ ] All 9 Jira architecture decisions resolved

## Post-Completion

With scale-polish complete, TVS Holdings platform is production-ready:
- 5 entities operational in Microsoft ecosystem
- CLI-first automation with 95-98% coverage
- Consolidated analytics across all entities
- HIPAA-compliant TVS configuration
- Monitored and alerting infrastructure
