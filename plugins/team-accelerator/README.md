# Team Accelerator

Enterprise development toolkit for teams - streamline DevOps, code quality, integrations, workflow automation, documentation, and performance optimization across multi-cloud and full-stack platforms.

## Features

### DevOps & Deployment
- Multi-cloud deployments (Azure, AWS, GCP, Kubernetes)
- CI/CD pipeline automation (GitHub Actions, Harness)
- Infrastructure-as-code patterns (Terraform, Helm)
- Container orchestration (Docker, K8s)

### Code Quality
- Automated code reviews
- E2E testing with Playwright/Selenium
- Quality standards enforcement
- Coverage analysis and reporting

### Integration Patterns
- API design and documentation
- Database connectivity patterns
- Webhook and event-driven architectures
- Service mesh configurations

### Workflow Automation
- Pipeline creation and management
- Process automation templates
- Team workflow standardization
- CI/CD orchestration

### Documentation
- OpenAPI/Swagger generation
- Mermaid architecture diagrams
- Auto-generated README and guides
- API specification management

### Performance & Monitoring
- Load testing and benchmarking
- Prometheus/Grafana integration
- Performance optimization recommendations
- Observability patterns

## Installation

```bash
# Option 1: Use as project plugin
cp -r team-accelerator /path/to/your/project/.claude-plugin/

# Option 2: Use with Claude Code CLI
claude --plugin-dir ./team-accelerator
```

## Commands

| Command | Description |
|---------|-------------|
| `/ta:deploy` | Execute deployment pipelines |
| `/ta:quality` | Run code quality checks |
| `/ta:test` | Execute test suites |
| `/ta:integrate` | Configure integrations |
| `/ta:workflow` | Execute/create workflows |
| `/ta:status` | Team dashboard |
| `/ta:docs` | Generate documentation |
| `/ta:perf` | Performance analysis |

## Agents

| Agent | Role |
|-------|------|
| `devops-engineer` | Infrastructure & deployment |
| `code-reviewer` | Quality analysis |
| `integration-specialist` | API & service connections |
| `workflow-automator` | Pipeline automation |
| `documentation-writer` | Technical documentation |
| `performance-engineer` | Optimization & monitoring |

## Skills

Skills activate automatically based on context:

- **devops-practices** - Triggers on: deploy, kubernetes, docker, terraform
- **code-quality** - Triggers on: lint, test, review, coverage
- **integration-patterns** - Triggers on: API, database, webhook
- **workflow-automation** - Triggers on: automate, pipeline, CI/CD
- **documentation-patterns** - Triggers on: document, API spec, diagram
- **performance-optimization** - Triggers on: performance, metrics, benchmark

## Hooks

Event-driven automation with configurable strictness:

| Hook | Event | Action |
|------|-------|--------|
| `pre-commit-validator` | PreToolUse | Validate code quality |
| `post-deploy-notifier` | PostToolUse | Deployment notifications |
| `test-analyzer` | Stop | Summarize test results |
| `docs-sync` | PostToolUse | Auto-update documentation |

## Configuration

Create `.claude/team-accelerator.local.md` for team-specific settings:

```yaml
---
hook_strictness: advisory  # strict | advisory
cloud_provider: azure      # azure | aws | gcp | k8s
ci_platform: github-actions  # github-actions | harness
---

# Team-specific configuration notes here
```

## Technology Support

- **CI/CD**: GitHub Actions, Harness
- **Cloud**: Azure, AWS, GCP, Kubernetes
- **Testing**: Playwright, Selenium
- **Docs**: OpenAPI, Mermaid, Markdown
- **Monitoring**: Prometheus, Grafana

## License

MIT

## Plugin Manifest & Hook Schemas

Plugin authors should validate manifest and hooks files against the canonical repository schemas:

- Manifest: [`schemas/plugin.schema.json`](../../schemas/plugin.schema.json) for `.claude-plugin/plugin.json`
- Hooks: [`schemas/hooks.schema.json`](../../schemas/hooks.schema.json) for `hooks/hooks.json`

Run `npm run check:plugin-schema` from the repository root before submitting changes.
