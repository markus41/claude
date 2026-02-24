# TVS Microsoft Deploy — Consul (Forerunner)

Enterprise Microsoft ecosystem orchestrator for TVS (Trusted Virtual Solutions) multi-entity multi-tenant deployment.

## Overview

12 specialized agents across Entra ID, Dataverse, Power Platform, Fabric, Azure IaC, and A3 Firebase extraction. CLI-first dual control plane with Playwright browser fallback achieving 95-98% automated coverage via pac CLI, az CLI, Graph API, and Fabric REST.

## Entities

| Entity | Status | Tenant | Primary Systems |
|--------|--------|--------|-----------------|
| **TVS** (Trusted Virtual Solutions) | Primary build | Dedicated | Power Pages, Copilot Studio, Stripe billing |
| **TAIA** | Wind-down, FMO sale June 2026 | Dedicated | A3 Firebase (extract), carrier normalization |
| **Lobbi Consulting** | Active | Shared | Dataverse CRM, engagement tracking |
| **Medicare Consulting** | Active | Shared | Dataverse CRM, shared prospects |
| **Media Company** | Planned | Dedicated | Analytics pipeline (Month 3+) |

## Headcount & Licensing

| Role | Count | License | Cost/mo |
|------|-------|---------|---------|
| Markus (#10, Global Admin) | 1 | Business Premium | $22 |
| Stateside staff | 9 | Business Premium | $22 |
| React interns | 2 | Business Basic | $6 |
| PH VAs (YubiKey FIDO2) | 11 | Frontline F3 | $8 |

## Quick Start

```bash
# 1. Copy and populate environment variables
cp .env.template .env
# Edit .env with your tenant IDs, credentials, etc.

# 2. Authenticate CLI tools
pac auth create --url $TVS_DATAVERSE_ENV_URL
az login --tenant $TVS_TENANT_ID

# 3. Run Week 1 critical path
/tvs:extract-a3          # Extract A3 Firebase data (CRITICAL)
/tvs:deploy-azure        # Provision Key Vault + Functions
/tvs:deploy-identity     # Entra baseline + FIDO2

# 4. Check status
/tvs:status-check
```

## Commands (13)

| Command | Description |
|---------|-------------|
| `/tvs:deploy-all` | Full platform deployment across all entities |
| `/tvs:deploy-identity` | Entra ID users, licenses, conditional access, FIDO2 |
| `/tvs:deploy-dataverse` | Dataverse tables for TVS and Consulting |
| `/tvs:deploy-fabric` | Fabric workspaces, lakehouses, notebooks |
| `/tvs:deploy-portal` | Power Pages + Copilot Studio + Stripe |
| `/tvs:deploy-azure` | Bicep IaC: Key Vault, Functions, Static Web Apps |
| `/tvs:extract-a3` | A3 Firebase bulk extraction (Week 1 critical path) |
| `/tvs:normalize-carriers` | Carrier normalization sprint for TAIA sale |
| `/tvs:deploy-teams` | Teams VA workspace with HIPAA config |
| `/tvs:cost-report` | Cost analysis across all Rosa entities |
| `/tvs:status-check` | Health check across all resources |
| `/tvs:taia-readiness` | TAIA wind-down readiness from control-plane overlays |
| `/tvs:browser-fallback` | Playwright fallback for portal operations |

## Agents (12)

| Agent | Model | Responsibility |
|-------|-------|---------------|
| identity-agent | opus | Entra ID, conditional access, FIDO2, licensing |
| platform-agent | sonnet | Power Platform, pac CLI, solution transport |
| data-agent | sonnet | Dataverse schema, tables, relationships |
| ingest-agent | sonnet | Firebase extraction, data imports |
| azure-agent | sonnet | Bicep IaC, Key Vault, Functions, Static Web Apps |
| github-agent | sonnet | Monorepo, Actions, branch policies |
| comms-agent | sonnet | Teams, Exchange, HIPAA-aware config |
| analytics-agent | opus | Fabric, OneLake, notebooks, Power BI |
| carrier-normalization-agent | opus | TAIA carrier data normalization sprint |
| michelle-scripts-agent | haiku | Office Scripts generation for Excel |
| consulting-crm-agent | sonnet | Consulting + Medicare CRM management |
| browser-fallback-agent | haiku | Playwright browser automation fallback |

## Skills (7)

| Skill | Auto-triggers |
|-------|--------------|
| pac-cli | `*.solution`, `dataverse/**`, `pages/**`, `copilot-studio/**` |
| az-cli | `*.bicep`, `infra/**`, `*.arm`, `rg-rosa-*` |
| fabric-rest | `fabric/**`, `*.ipynb`, `onelake/**` |
| graph-api | `identity/**`, `teams/**`, `entra/**` |
| power-automate-rest | `flows/**`, `*.flow.json` |
| stripe-integration | `stripe/**`, `billing/**`, `subscription/**` |
| firebase-extract | `functions/firebase-**`, `a3_archive/**` |

## Hooks (5)

| Hook | Purpose |
|------|---------|
| keyvault-secrets-enforcer | Blocks hardcoded secrets in commits |
| tenant-isolation-validator | Prevents cross-tenant contamination |
| pac-auth-check | Ensures active pac auth before Dataverse ops |
| stripe-webhook-security | Validates Stripe webhook configuration |
| hipaa-config-guard | Requires HIPAA_CONFIRMED for TVS comms changes |

## Workflows (5)

1. **week1-critical-path** — A3 extract, Key Vault, GitHub, Entra baseline, FIDO2, carrier norm start
2. **taia-sale-prep** — Carrier normalization, Office Scripts, buyer report, decommission decision
3. **tvs-foundation** — Dataverse, Fabric, Power Pages, Copilot Studio, flows, Stripe, Teams
4. **full-platform** — Automation flows, React portal, Functions, notebooks, dashboards, Consulting CRM
5. **scale-polish** — Remaining automations, consolidated dashboard, Lobbi API, media, monitoring

## Cost Tiers

| Tier | Monthly Cost | Includes |
|------|-------------|----------|
| Tier 1 | ~$1,349 | M365 licenses + basic Azure + F2 Fabric |
| Tier 2 | ~$2,610 | + Power Pages capacity + additional Functions |
| Tier 3 | ~$5,083 | + Premium connectors + expanded Fabric + monitoring |

## Dependencies

- **Required CLI**: `pac` (Power Platform CLI), `az` (Azure CLI), `gh` (GitHub CLI)
- **Optional**: Playwright (for browser fallback operations)
- **Plugins**: jira-orchestrator (Arbiter) for issue tracking
