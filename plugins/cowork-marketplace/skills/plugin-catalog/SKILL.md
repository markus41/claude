---
name: plugin-catalog
description: Domain knowledge for the cowork marketplace seed catalog, including all 16 items mapped to 15 installed plugins with their agents, skills, and commands
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
triggers:
  - browse marketplace
  - list cowork items
  - search marketplace
  - find cowork template
  - what plugins are available
  - marketplace catalog
  - cowork items
---

# Plugin Catalog Knowledge

Domain knowledge for browsing and searching the cowork marketplace catalog.

## Use For
- Discovering available marketplace items
- Searching by type, category, plugin, or keyword
- Understanding what each item does and which plugins power it
- Comparing items within a category

## Catalog Structure

The marketplace contains 16 items across 5 types:

### Templates (3)
Quick-start project scaffolds that generate complete project structures.

| Item | Plugin | Agents | Key Capabilities |
|------|--------|--------|-----------------|
| fastapi-scaffold | fastapi-backend | api-designer, db-modeler, test-writer | REST API generation, SQLAlchemy models, pytest suites |
| fullstack-react-fastapi | fullstack-iac, fastapi-backend | api-designer, frontend-architect, infra-planner | Full stack with React frontend + FastAPI backend + IaC |
| home-assistant-setup | home-assistant-architect | ha-core-architect, automation-builder, dashboard-designer, ollama-integration, zigbee-specialist, energy-monitor, security-hardener, backup-manager | Complete HA installation with 8 specialized agents |

### Workflows (4)
Multi-step automated processes that chain agent actions.

| Item | Plugin | Agents | Key Capabilities |
|------|--------|--------|-----------------|
| jira-to-pr | jira-orchestrator | commit-tracker, test-strategist, pr-reviewer | Ticket analysis, branch creation, implementation, PR |
| eks-deploy-pipeline | aws-eks-helm-keycloak, deployment-pipeline | orchestrator, validator, rollback | Full EKS deployment with Helm and validation |
| microsoft-platform-deploy | tvs-microsoft-deploy | identity-agent, platform-agent, data-agent, ingest-agent, azure-agent, github-agent, comms-agent | Microsoft ecosystem deployment across 7 services |
| sprint-planning-automation | jira-orchestrator, team-accelerator | sprint-planner, capacity-analyzer | Automated sprint planning with capacity analysis |

### Agent Configs (3)
Pre-configured agent teams for specific roles.

| Item | Plugin | Agents | Key Capabilities |
|------|--------|--------|-----------------|
| enterprise-code-reviewer | jira-orchestrator, team-accelerator | code-reviewer, security-reviewer, quality-analyzer, commit-tracker, test-strategist | Multi-dimensional code review with security focus |
| nonprofit-exec-director | exec-automator | 11 agents including admin-coordinator, grants-manager, board-liaison | Full nonprofit executive management suite |
| design-system-architect | frontend-design-system | design-tokens-architect, component-library-builder, a11y-specialist, theme-builder, white-label-specialist, documentation-generator | Complete design system creation and management |

### Skill Packs (3)
Bundles of domain expertise and workflows.

| Item | Plugin | Skills | Key Capabilities |
|------|--------|--------|-----------------|
| devops-essentials | aws-eks-helm-keycloak, deployment-pipeline, home-assistant-architect, jira-orchestrator | eks-management, helm-operations, ci-cd-pipeline, monitoring | Cross-platform DevOps toolkit |
| react-animation-toolkit | react-animation-studio | 11 skills including framer-motion, gsap, three-js, lottie | Full animation development suite |
| marketplace-intelligence | marketplace-pro | trust-scoring, composition-engine, federation, developer-studio | Plugin marketplace analytics and management |

### Session Blueprints (3)
End-to-end orchestration plans with multi-agent coordination.

| Item | Plugin | Agents | Key Capabilities |
|------|--------|--------|-----------------|
| enterprise-release | jira-orchestrator, deployment-pipeline | commit-tracker, orchestrator, validator | Full release pipeline with changelog and deploy |
| keycloak-multi-tenant | lobbi-platform-manager, frontend-design-system | keycloak-specialist, tenant-provisioner, theme-builder | Multi-tenant auth with themed portals |
| project-scaffolder | claude-code-templating-plugin | template-scaffolder, config-generator | Universal project scaffolding from templates |

## Search Strategy

When searching the catalog:
1. Match against displayName, description, name, tags first
2. Then match against plugin names in bindings
3. Then match against individual agent/skill/command names
4. Apply type/category/difficulty filters
5. Sort by the requested criteria

## Plugin Binding Reference

Each item has pluginBindings that map to real installed plugins at `plugins/{pluginName}/`. The agents, skills, and commands listed in bindings correspond to actual `.md` files in those plugin directories.
