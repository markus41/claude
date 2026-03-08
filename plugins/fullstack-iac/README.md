# fullstack-iac

**Version:** 1.0.0 | **License:** MIT | **Callsign:** Zenith
**Author:** Markus Ahling (markus@brooksidebi.com)

## Purpose

Zenith is an enterprise-grade full-stack development and infrastructure automation
plugin. It exists because standing up a production application requires coordinating
frontend (React/Vite), backend (FastAPI), database, container orchestration (Docker/K8s),
infrastructure provisioning (Terraform), configuration management (Ansible), and CI/CD
pipelines -- all of which must work together consistently.

The plugin provides 30+ production-ready templates across 7 categories, supports
multi-cloud deployment (AWS, Azure, GCP), and includes specialized agents that
understand the entire stack. You can scaffold a complete SaaS application, add
Kubernetes deployment, provision cloud infrastructure, and deploy to production --
all through structured commands.

## Directory Structure

```
fullstack-iac/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 2 agents
  commands/                      # 8 commands
  skills/                        # 2 skills (subdirectories with SKILL.md)
  templates/                     # 30+ templates (backend, frontend, infra, pipelines)
  hooks/                         # Pre/post tool-use hooks
```

## Agents

| Agent | Description |
|-------|-------------|
| api-architect | FastAPI backend design, database integration, authentication |
| frontend-builder | React + Vite frontend with TypeScript, Tailwind, routing |

## Commands

| Command | Description |
|---------|-------------|
| `/scaffold-fastapi` | Create FastAPI backend with auth, database, testing |
| `/scaffold-react-vite` | Create React + Vite frontend with TypeScript |
| `/scaffold-fullstack` | Create monorepo with frontend + backend + infra |
| `/scaffold-terraform` | Generate Terraform modules for multi-cloud |
| `/scaffold-kubernetes` | Create K8s manifests and Helm charts |
| `/scaffold-ansible` | Generate Ansible playbooks for server automation |
| `/zenith-deploy` | Orchestrate deployment to cloud environment |
| `/zenith-help` | Show comprehensive help and examples |

## Skills

- **fastapi-patterns** -- FastAPI best practices, async patterns, dependency injection
- **react-vite** -- React hooks, component patterns, Vite config, build optimization

## Template Categories

| Category | Examples |
|----------|---------|
| Backend | fastapi-basic, fastapi-auth, fastapi-full, fastapi-microservice |
| Frontend | vite-basic, vite-dashboard, vite-saas |
| Full-Stack | split, monorepo, microservices |
| Database | postgresql, mongodb, redis |
| Infrastructure | terraform-aws, terraform-azure, terraform-gcp, kubernetes |
| CI/CD | github-actions, gitlab-ci, azure-devops |
| Serverless | aws-lambda, azure-functions, gcp-functions |

## Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 18+ | Yes |
| Python | 3.11+ | Yes |
| Docker | 24+ | Yes |
| Terraform | 1.6+ | Optional |
| kubectl | 1.28+ | Optional |
| Ansible | 2.15+ | Optional |

## Quick Start

```
/scaffold-fullstack --name my-app --frontend vite-saas --backend fastapi-auth
/scaffold-kubernetes --app my-app --namespace production --replicas 3
/scaffold-terraform --provider aws --modules vpc,rds,eks
/zenith-deploy --app my-app --env production --cloud aws
```
