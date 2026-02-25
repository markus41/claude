# Claude Code Templating Plugin

**Version:** 2.0.0 | **Protocol:** EXPLORE > PLAN > CODE > TEST > FIX > DOCUMENT

## Overview

This plugin establishes a universal templating and Harness expert system that enables fully autonomous project generation, pipeline creation, and deployment automation through a unified template interface. Designed to streamline development workflows and drive measurable outcomes across multi-team environments.

## Quick Reference

| Resource | Path |
|----------|------|
| Entry Point | `src/index.ts` |
| Types | `src/types/` |
| Agents | `agents/` |
| Skills | `skills/` |
| Commands | `commands/` |
| Templates | `templates/` |

## Commands

| Command | Description |
|---------|-------------|
| `/template` | List, search, generate from templates |
| `/scaffold` | Scaffold new projects from templates |
| `/harness` | Create pipelines and templates |
| `/generate` | Generate API clients, models, tests |
| `/archetype` | Create and manage project archetypes |

## Agents

| Agent | Purpose | Model |
|-------|---------|-------|
| `harness-expert` | Harness pipelines/templates | sonnet |
| `scaffold-agent` | Project scaffolding | sonnet |
| `codegen-agent` | Code generation | sonnet |
| `database-agent` | Schema/migrations | sonnet |
| `testing-agent` | Test generation | sonnet |

## Skills

- **universal-templating**: Multi-format template processing
- **harness-expert**: Harness CI/CD platform expertise
- **project-scaffolding**: Project bootstrap patterns

## MCP Servers

| Server | Purpose | Required |
|--------|---------|----------|
| `harness` | Pipeline operations | Yes |
| `scaffold` | Scaffolding tools | Recommended |
| `github` | Repository operations | Recommended |
| `context7` | Library documentation | Optional |

## Environment Variables

**Required:**
```bash
HARNESS_API_KEY=your_api_key
HARNESS_ACCOUNT_ID=your_account
HARNESS_ORG_ID=your_org
HARNESS_PROJECT_ID=your_project
```

**Optional:**
```bash
GITHUB_TOKEN=your_github_token
```

## Template Formats Supported

| Format | Config File | Engine |
|--------|-------------|--------|
| Handlebars | `*.hbs` | Handlebars |
| Cookiecutter | `cookiecutter.json` | Nunjucks (Jinja2) |
| Copier | `copier.yml` | Nunjucks (Jinja2) |
| Maven Archetype | `archetype-metadata.xml` | Velocity |
| Harness | `*.yaml` | YAML + Expressions |

## Usage Examples

### Scaffold a Microservice
```bash
/scaffold fastapi-microservice user-service --harness --env dev,staging,prod
```

### Create Harness Pipeline
```bash
/harness pipeline create ci-cd-standard --service my-service
```

### Create Step Template
```bash
/harness template step database-migration --scope org
```

### Generate API Client
```bash
/generate api-client --spec openapi.yaml --language typescript
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Template Orchestrator                    │
├──────────────┬──────────────┬──────────────────┤
│ Scaffold     │ Harness      │ Codegen          │
│ Agent        │ Expert       │ Agent            │
├──────────────┴──────────────┴──────────────────┤
│              MCP Integration Layer              │
├────────────┬────────────┬─────────────────────┤
│ Harness MCP│ Scaffold   │ GitHub MCP          │
│            │ MCP        │                      │
└────────────┴────────────┴─────────────────────┘
```

## Context Management

- Keep template loading lazy
- Cache resolved templates
- Use streaming for large files
- Minimize API calls through batching
