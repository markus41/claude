# aws-eks-helm-keycloak

**Version:** 1.0.0 | **License:** MIT | **Callsign:** Conduit-Artisan
**Author:** Golden Armada (architect@goldenarmada.io)

## Purpose

This plugin automates AWS EKS deployments with Helm chart management, Keycloak OIDC
authentication, and Harness CI/CD pipelines. It exists because deploying authenticated
microservices to Kubernetes requires coordinating multiple tools -- EKS cluster
provisioning, Helm release management, Keycloak realm/client setup, and pipeline
definitions -- each with its own configuration surface.

The Conduit-Artisan hybrid approach combines pipeline orchestration (Harness as the
source of truth for all deployments) with developer velocity (fast local development
with production parity via Kind + LocalStack). Instead of manually stitching together
AWS CLI, Helm, and Keycloak admin calls, the plugin's agents and commands handle the
full lifecycle from local development through production shipping.

## Directory Structure

```
aws-eks-helm-keycloak/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 4 agents
  commands/                      # 7 commands
  skills/                        # 6 skills (subdirectories with SKILL.md)
  hooks/                         # Pre-deploy validation, Keycloak sync
  templates/                     # Pipeline, chart, and setup templates
  config/                        # Environment and default configs
```

## Agents

| Agent | Description |
|-------|-------------|
| setup-orchestrator | Guides interactive setup of AWS, Harness, Keycloak, and local dev |
| pipeline-architect | Designs Harness pipeline structures with proper stage ordering |
| deployment-strategist | Recommends deployment strategies (rolling, canary, blue-green) |
| dev-assistant | Local development support, hot-reload, troubleshooting |

## Commands

| Command | Description |
|---------|-------------|
| `/eks:setup` | Interactive setup wizard for the entire ecosystem |
| `/eks:dev-up` | Start local development environment (Kind cluster) |
| `/eks:pipeline-scaffold` | Generate a Harness pipeline from templates |
| `/eks:preview` | Create preview environment for a feature branch |
| `/eks:service-onboard` | Onboard a new microservice to Harness + EKS |
| `/eks:ship` | One-command deploy to any environment |
| `/eks:debug` | Smart debugging for deployment issues |

## Skills

- **harness-eks-deployments** -- EKS deployment patterns via Harness CD
- **harness-code-integration** -- Harness Code repository workflows and triggers
- **harness-keycloak-auth** -- Keycloak OIDC integration with Harness-deployed services
- **helm-development** -- Helm chart authoring, values management, dependencies
- **local-eks-development** -- Local Kubernetes with Kind for EKS parity
- **setup-wizard** -- Interactive setup validation and configuration

## Prerequisites

```bash
helm version       # >= 3.0.0
kubectl version    # >= 1.25.0
aws --version      # >= 2.0.0
kind version       # >= 0.20.0 (optional, for local dev)
```

**Environment variables:**
- `AWS_REGION`, `AWS_ACCOUNT_ID` -- AWS configuration
- `HARNESS_API_KEY`, `HARNESS_ACCOUNT_ID`, `HARNESS_ORG_ID`, `HARNESS_PROJECT_ID`
- `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_ADMIN_SECRET`

## Quick Start

```
/eks:setup                               # Run setup wizard (~10 min)
/eks:dev-up                              # Start local Kind cluster
/eks:service-onboard my-api --keycloak-client
/eks:pipeline-scaffold my-api            # Create CI/CD pipeline
/eks:ship staging                        # Deploy to staging
/eks:ship prod                           # Deploy to production
```

## Integration

- **jira-orchestrator** -- Link deployments to Jira issues
- **team-accelerator** -- Code review before deployment
- **fullstack-iac** -- EKS cluster provisioning via Terraform
