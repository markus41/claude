# fastapi-backend

**Version:** 0.1.0 | **License:** MIT
**Author:** Markus Ahling (markus@brooksidebi.com)

## Purpose

This plugin streamlines FastAPI backend development with MongoDB/Beanie ODM, Keycloak
OIDC authentication, Docker/Kubernetes deployment, background tasks, caching,
observability, and real-time features. It exists because standing up a production-grade
async Python API requires integrating many subsystems -- database ODM, auth middleware,
task queues, caching layers, metrics exporters -- and each has its own boilerplate.

The plugin generates complete CRUD endpoints (router, schemas, service, tests) in a
single command, scaffolds projects with domain-driven structure, and provides agents
that review security, optimize performance, and generate test suites.

## Directory Structure

```
fastapi-backend/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 4 agents
  commands/                      # 10 commands
  skills/                        # 8 skills (subdirectories with SKILL.md)
  hooks/                         # Pre-commit, post-endpoint, pre-deploy
```

## Agents

| Agent | Description |
|-------|-------------|
| api-architect | API architecture and design specialist |
| test-generator | Automated pytest test suite generator |
| security-reviewer | OWASP-focused security code reviewer |
| performance-optimizer | Performance analysis and optimization |

## Commands

| Command | Description |
|---------|-------------|
| `/fastapi:scaffold` | Generate complete project structure |
| `/fastapi:endpoint` | Generate CRUD endpoint (router, schemas, service, tests) |
| `/fastapi:model` | Generate Beanie document model with indexes |
| `/fastapi:test` | Generate comprehensive pytest test suite |
| `/fastapi:dev` | Start development server with hot reload |
| `/fastapi:docker` | Build and manage Docker containers |
| `/fastapi:deploy` | Deploy to Kubernetes with Helm |
| `/fastapi:task` | Generate background task (ARQ/Celery/Dramatiq) |
| `/fastapi:ws` | Generate WebSocket endpoint with rooms and auth |
| `/fastapi:migrate` | Run Beanie/MongoDB migrations |

## Skills

- **fastapi-patterns** -- Core async patterns, dependency injection, middleware
- **beanie-odm** -- MongoDB/Beanie ODM, relationships, aggregations
- **keycloak-fastapi** -- Keycloak OIDC integration, JWT validation, RBAC
- **fastapi-k8s** -- Docker multi-stage builds, Kubernetes, Helm charts
- **fastapi-background** -- Background tasks with ARQ, Celery, or Dramatiq
- **fastapi-caching** -- Redis caching patterns and strategies
- **fastapi-observability** -- Structured logging, Prometheus, OpenTelemetry
- **fastapi-realtime** -- WebSocket, S3 file uploads, email, notifications

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.109+ |
| Database | MongoDB + Beanie ODM |
| Auth | Keycloak OIDC |
| Cache | Redis (aioredis) |
| Tasks | ARQ / Celery / Dramatiq |
| Observability | structlog, Prometheus, OpenTelemetry |
| Deployment | Docker, Kubernetes, Helm |
| Testing | pytest, pytest-asyncio, httpx |

## Prerequisites

**Environment variables:**
```bash
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379/0
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=myrealm
KEYCLOAK_CLIENT_ID=myclient
```

## Quick Start

```
/fastapi:scaffold myapp --template full
/fastapi:endpoint users --fields name:str,email:str --auth
/fastapi:dev --port 8000 --reload
/fastapi:test --service users
/fastapi:deploy --namespace production --values values-prod.yaml
```
