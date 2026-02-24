---
name: Fabric Embedded Analytics Delivery
description: Use this skill when building embedded analytics for client-facing portals (Power Pages or custom web apps) using Fabric/Power BI datasets and reports.
version: 1.0.0
---

# Fabric Embedded Analytics Delivery

## Goal
Package reusable embedded analytics patterns so TAIA/TVS can sell analytics modules to clients.

## Architecture Standard
1. Fabric workspace per client (`client-<name>-prod`).
2. Certified semantic model per analytics package.
3. Report bundle with RLS enforced by customer tenant/org.
4. Embed token service (Azure Function) with audit logs.
5. Power Pages embedding component bound to token endpoint.

## Core Steps
- Provision workspace/capacity assignment.
- Deploy semantic model + report artifacts.
- Configure RLS roles and test matrix.
- Configure embed service principal and secrets in Key Vault.
- Publish embed config JSON to Power Pages web template.

## Validation Checklist
- Token generation latency < 500ms p95.
- RLS test users cannot cross-client data.
- Report load < 3s for top landing pages.
- Full audit trail in App Insights + Log Analytics.

## References
- `commands/deploy-embedded-analytics.md`
- `scripts/publish_embedded_analytics.sh`
- `docs/API_CATALOG.md`
