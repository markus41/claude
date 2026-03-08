# team-accelerator

**Version:** 1.0.0 | **License:** MIT
**Author:** Markus Ahling

## Purpose

This plugin provides an enterprise development toolkit for teams, covering DevOps,
code quality, integrations, workflow automation, documentation, and performance
optimization. It exists because development teams working across multi-cloud and
full-stack platforms need a unified interface for recurring operational tasks --
deployment pipelines, code reviews, integration setup, documentation generation,
and performance analysis -- rather than context-switching between separate tools.

Skills activate automatically based on context keywords, and hooks provide event-
driven automation with configurable strictness (strict vs advisory).

## Directory Structure

```
team-accelerator/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 6 agents
  commands/                      # 8 commands
  skills/                        # 4 skills (subdirectories with SKILL.md)
  hooks/                         # Pre-commit, post-deploy, test, docs hooks
```

## Agents

| Agent | Description |
|-------|-------------|
| devops-engineer | Infrastructure, deployment, container orchestration |
| code-reviewer | Code quality analysis and review |
| integration-specialist | API and service connection patterns |
| workflow-automator | Pipeline automation and process templates |
| documentation-writer | Technical documentation generation |
| performance-engineer | Optimization, monitoring, benchmarking |

## Commands

| Command | Description |
|---------|-------------|
| `/ta:deploy` | Execute deployment pipelines (Azure, AWS, GCP, K8s) |
| `/ta:quality` | Run code quality checks and analysis |
| `/ta:test` | Execute test suites (Playwright, Selenium) |
| `/ta:integrate` | Configure integrations (API, database, webhook) |
| `/ta:workflow` | Execute or create workflow templates |
| `/ta:status` | Team dashboard and progress overview |
| `/ta:docs` | Generate documentation (OpenAPI, Mermaid, README) |
| `/ta:perf` | Performance analysis and benchmarking |

## Skills

- **devops-practices** -- Triggers on: deploy, kubernetes, docker, terraform
- **code-quality** -- Triggers on: lint, test, review, coverage
- **integration-patterns** -- Triggers on: API, database, webhook
- **workflow-automation** -- Triggers on: automate, pipeline, CI/CD

## Technology Support

| Area | Technologies |
|------|-------------|
| CI/CD | GitHub Actions, Harness |
| Cloud | Azure, AWS, GCP, Kubernetes |
| Testing | Playwright, Selenium |
| Docs | OpenAPI, Mermaid, Markdown |
| Monitoring | Prometheus, Grafana |
| IaC | Terraform, Helm |

## Hooks

| Hook | Event | Action |
|------|-------|--------|
| pre-commit-validator | PreToolUse | Validate code quality |
| post-deploy-notifier | PostToolUse | Deployment notifications |
| test-analyzer | Stop | Summarize test results |
| docs-sync | PostToolUse | Auto-update documentation |

## Configuration

Create `.claude/team-accelerator.local.md`:

```yaml
---
hook_strictness: advisory        # strict | advisory
cloud_provider: azure            # azure | aws | gcp | k8s
ci_platform: github-actions      # github-actions | harness
---
```

## Quick Start

```
/ta:status                               # Team dashboard
/ta:deploy --env staging --cloud azure
/ta:quality --full                       # Code quality check
/ta:test --suite e2e --browser chromium
/ta:docs --format openapi               # Generate API docs
/ta:perf --benchmark --report           # Performance analysis
```
