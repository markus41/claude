# tvs-microsoft-deploy

**Version:** 1.1.0 | **License:** MIT | **Callsign:** Consul
**Author:** Markus Ahling (markus@lobbi.io)

## Purpose

Consul is an enterprise Microsoft ecosystem orchestrator built for TVS (Trusted Virtual
Solutions), a multi-entity, multi-tenant organization. It exists because deploying across
Microsoft's Power Platform, Azure, Fabric, Entra ID, and Microsoft 365 involves dozens of
interconnected services that must be provisioned in the correct order with proper tenant
isolation and security guardrails.

This plugin coordinates 19 specialized agents across identity management, data platform
provisioning, analytics deployment, and governance enforcement. It includes 14 lifecycle
hooks that enforce security policies (HIPAA compliance, tenant isolation, Key Vault secret
management) before and after every tool invocation. Five phased workflows guide deployments
from week-one critical path through full-platform scale.

## Directory Structure

```
tvs-microsoft-deploy/
  .claude-plugin/plugin.json
  CLAUDE.md
  CONTEXT_SUMMARY.md
  agents/           (19 agents)
  commands/         (18 commands)
  skills/           (17 skills)
  hooks/            (16 hook scripts)
  workflows/        (5 phased workflows)
  schemas/          (Dataverse, Fabric workspace schemas)
  scripts/          (Provisioning and seed scripts)
```

## Agents

| Agent | Description |
|-------|-------------|
| identity-agent | Entra ID provisioning, app registrations, RBAC |
| platform-agent | Power Platform environment and solution management |
| data-agent | Dataverse schema design and entity deployment |
| ingest-agent | Data ingestion pipelines from external sources |
| azure-agent | Azure resource provisioning (Bicep/ARM) |
| github-agent | GitHub repository and Actions workflow management |
| comms-agent | Teams channels, notifications, and collaboration |
| analytics-agent | Power BI and Fabric analytics deployment |
| carrier-normalization-agent | Insurance carrier data normalization |
| michelle-scripts-agent | Office Scripts and Excel automation |
| consulting-crm-agent | Consulting entity CRM and Dataverse operations |
| browser-fallback-agent | Playwright browser automation for portal tasks |
| power-pages-agent | Power Pages portal deployment and configuration |
| excel-automation-agent | Enterprise Excel automation patterns |
| fabric-pipeline-agent | Fabric data pipeline authoring and orchestration |
| embedded-analytics-agent | Power BI Embedded go-to-market analytics |
| client-solution-architect-agent | Client-facing solution architecture |
| planner-orchestrator-agent | Microsoft Planner task orchestration |
| m365-governance-agent | Microsoft 365 governance, DLP, and compliance |

## Commands

| Command | Description |
|---------|-------------|
| `/deploy-all` | Full platform deployment (all subsystems) |
| `/deploy-identity` | Entra ID and app registration provisioning |
| `/deploy-dataverse` | Dataverse environment and table deployment |
| `/deploy-fabric` | Fabric workspace and pipeline provisioning |
| `/deploy-portal` | Power Pages portal deployment |
| `/deploy-azure` | Azure resource provisioning |
| `/deploy-teams` | Teams channel and connector setup |
| `/extract-a3` | Extract data from A3 legacy systems |
| `/normalize-carriers` | Normalize insurance carrier data |
| `/cost-report` | Azure and platform cost analysis |
| `/quick-start` | Guided onboarding for new deployments |
| `/status-check` | Health check across all deployed services |
| `/taia-readiness` | TAIA sale readiness assessment |
| `/browser-fallback` | Playwright-based portal automation |
| `/identity-attestation` | Identity access attestation review |
| `/identity-drift` | Detect identity configuration drift |
| `/orchestrate-planner` | Orchestrate tasks via Microsoft Planner |
| `/health` | Consolidated health check |

## Skills (17)

| Skill | Domain |
|-------|--------|
| pac-cli | Power Platform CLI operations |
| az-cli | Azure CLI resource management |
| fabric-rest | Fabric REST API patterns |
| graph-api | Microsoft Graph API integration |
| power-automate-rest | Power Automate flow management |
| stripe-integration | Stripe payment processing |
| firebase-extract | Firebase data extraction |
| dataverse-architecture | Dataverse schema design patterns |
| embedded-analytics-go-to-market | Power BI Embedded GTM patterns |
| excel-enterprise-automation | Enterprise Excel automation |
| fabric-engineering | Fabric lakehouse and warehouse engineering |
| fabric-pipeline-authoring | Fabric pipeline design and orchestration |
| microsoft-graph-admin | Graph API administrative operations |
| planner-orchestration | Microsoft Planner task management |
| power-platform-alm | Power Platform ALM and solution management |
| sharepoint-governance | SharePoint site governance |
| teams-operations | Teams administration and automation |

## Hooks (14 active)

**PreToolUse (9 hooks):** keyvault-secrets-enforcer, tenant-isolation-validator,
pac-auth-check, stripe-webhook-security, hipaa-config-guard,
scope-permission-misuse-check, tenant-drift-check, unsafe-destructive-call-check,
audit-metadata-check

**PostToolUse (5 hooks):** audit-pac-operations, audit-graph-api-calls,
audit-fabric-operations, audit-azure-provisioning, audit-dataverse-changes

## Workflows

| Workflow | Phase | Description |
|----------|-------|-------------|
| week1-critical-path | Week 1 | Identity, core Dataverse, initial Fabric |
| taia-sale-prep | Sale prep | TAIA transaction readiness |
| tvs-foundation | Foundation | Multi-entity tenant foundation |
| full-platform | Full deploy | Complete platform provisioning |
| scale-polish | Scale | Performance tuning and governance |

## Prerequisites

**Required CLI tools:**
- `pac` (Power Platform CLI)
- `az` (Azure CLI)
- `gh` (GitHub CLI)

**Optional:**
- `playwright` (browser automation fallback)

**Plugin dependency:** `jira-orchestrator` (for project tracking integration)

**Environment variables:** See `.env.template` in plugin root for required secrets
(Fabric tokens, Graph tokens, Dataverse URLs, Stripe keys, Firebase credentials).

## Quick Start

```
/quick-start                             # Guided onboarding wizard
/deploy-identity                         # Step 1: Provision Entra ID
/deploy-dataverse                        # Step 2: Deploy Dataverse tables
/deploy-fabric                           # Step 3: Provision Fabric workspaces
/deploy-portal                           # Step 4: Deploy Power Pages portal
/status-check                            # Verify all services
/health                                  # Ongoing health monitoring
```
