# lobbi-platform-manager

**Version:** 1.0.0 | **License:** MIT
**Author:** Markus Ahling

## Purpose

This plugin streamlines development on the keycloak-alpha platform -- a multi-tenant
MERN stack with Keycloak authentication. It exists because the platform involves 8
interconnected services (Keycloak, MongoDB, PostgreSQL, Redis, API Gateway, Membership,
Payment, Web) that all need to be provisioned, configured, health-checked, and tested
together.

The plugin automates Keycloak realm/client/user provisioning, monitors service health
across all 8 services, validates environment configurations, generates Jest tests from
Express routes, and enforces security hooks to prevent committing secrets.

## Directory Structure

```
lobbi-platform-manager/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 4 agents
  commands/                      # 8 commands
  skills/                        # 3 skills (subdirectories with SKILL.md)
  hooks/                         # Security, health, Keycloak validation hooks
```

## Platform Services

| Service | Port | Purpose |
|---------|------|---------|
| Keycloak | 8080 | Authentication and authorization |
| MongoDB | 27017 | Primary database |
| PostgreSQL | 5432 | Keycloak database |
| Redis | 6379 | Session storage and caching |
| API Gateway | 3000 | Request routing |
| Membership | 3001 | User and organization management |
| Payment | 3002 | Billing and subscription management |
| Web | 3003 | Frontend application |

## Agents

| Agent | Model | Description |
|-------|-------|-------------|
| keycloak-admin | sonnet | Keycloak provisioning, user management, realm config |
| service-orchestrator | sonnet | Health monitoring, dependency validation, service lifecycle |
| test-generator | haiku | Jest test generation from Express routes |
| env-manager | haiku | Environment validation and secret management |

## Commands

| Command | Description |
|---------|-------------|
| `/lobbi:keycloak-setup` | Initialize Keycloak realm, client, and base configuration |
| `/lobbi:keycloak-user` | Create Keycloak users (single or bulk with org_id) |
| `/lobbi:keycloak-theme` | Generate tenant-specific Keycloak themes |
| `/lobbi:health` | Check health of all 8 platform services |
| `/lobbi:env-validate` | Validate .env against platform requirements |
| `/lobbi:env-generate` | Generate .env files for environments (dev, staging, prod) |
| `/lobbi:test-gen` | Auto-generate Jest tests from Express routes |
| `/lobbi:service` | Manage service lifecycle (start, stop, restart, status) |

## Skills

- **keycloak-admin** -- Keycloak Admin API patterns, realm config, multi-tenant setup
- **mern-patterns** -- MERN stack best practices for the keycloak-alpha platform
- **multi-tenant** -- Multi-tenant architecture with org_id-based row-level isolation

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

**Environment variables (optional):**
- `KEYCLOAK_URL` (default: http://localhost:8080)
- `KEYCLOAK_REALM` (default: lobbi)
- `KEYCLOAK_ADMIN_USERNAME`, `KEYCLOAK_ADMIN_PASSWORD`

## Quick Start

```
/lobbi:keycloak-setup                    # Initialize realm and client
/lobbi:keycloak-user --count 10 --org acme-corp
/lobbi:env-generate --environments dev,staging,prod
/lobbi:health                            # Verify all 8 services
/lobbi:test-gen --service membership     # Generate tests
/lobbi:service restart api-gateway       # Manage services
```
