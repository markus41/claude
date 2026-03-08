# claude-code-templating-plugin

**Version:** 1.0.0 | **License:** MIT | **Callsign:** Architect
**Author:** Markus Ahling (https://thelobbi.io)

## Purpose

This plugin provides a universal templating and Harness expert system for autonomous
project generation, pipeline creation, and deployment automation. It exists because
modern projects require scaffolding from multiple template engines -- Handlebars,
Cookiecutter, Copier, Maven archetypes -- each with its own conventions.

Rather than switching between template tools, this plugin presents a unified interface.
Its agents understand each engine's idioms and can generate projects, pipelines, API
clients, database schemas, and test suites from a single command. The Harness
integration means generated projects come with CI/CD pipelines pre-configured.

## Directory Structure

```
claude-code-templating-plugin/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  src/                           # TypeScript source (orchestrator, engines, MCP)
  agents/                        # 6 agents
  commands/                      # 5 commands
  skills/                        # 3 skills (subdirectories with SKILL.md)
  templates/                     # Bundled project and pipeline templates
```

## Agents

| Agent | Description |
|-------|-------------|
| harness-expert | Harness pipeline YAML, templates, deployment strategies |
| scaffold-agent | Project scaffolding with template selection and validation |
| codegen-agent | API clients, typed models, SDK code from OpenAPI specs |
| database-agent | Database schemas, migration scripts, ORM models |
| archetype-creator | Maven archetype creation and management |
| testing-agent | Test suite generation (unit, integration, e2e) |

## Commands

| Command | Description |
|---------|-------------|
| `/template` | List, search, or generate from available templates |
| `/scaffold` | Scaffold a new project from a template |
| `/harness` | Create Harness pipelines, templates, or input sets |
| `/generate` | Generate API clients, models, or tests from specs |
| `/archetype` | Create or manage Maven archetypes |

## Template Formats Supported

| Format | Config File | Engine |
|--------|-------------|--------|
| Handlebars | `*.hbs` | Handlebars |
| Cookiecutter | `cookiecutter.json` | Nunjucks (Jinja2) |
| Copier | `copier.yml` | Nunjucks (Jinja2) |
| Maven Archetype | `archetype-metadata.xml` | Velocity |
| Harness | `*.yaml` | YAML + Expressions |

## Skills

- **universal-templating** -- Multi-format template processing
- **harness-expert** -- Harness CI/CD platform pipelines and expressions
- **project-scaffolding** -- Project bootstrap patterns with dependency detection

## Prerequisites

```bash
npm ci && npm run build          # Build the TypeScript source
```

**Environment variables:**
- `HARNESS_API_KEY`, `HARNESS_ACCOUNT_ID`, `HARNESS_ORG_ID`, `HARNESS_PROJECT_ID`
- `GITHUB_TOKEN` (optional, for repository operations)

## Quick Start

```
/scaffold fastapi-microservice user-service --harness --env dev,staging,prod
/harness pipeline create ci-cd-standard --service my-service
/generate api-client --spec openapi.yaml --language typescript
/template list                           # Browse available templates
```
