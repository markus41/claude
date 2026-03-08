# Neural Orchestration Platform (Golden Armada)

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

A plugin-based AI agent orchestration platform that combines a visual workflow builder with a deep Claude Code configuration system. Fourteen domain plugins extend the platform across cloud infrastructure, enterprise SaaS, home automation, and more. The root plugin (`claude-orchestration` v4.0.1) ships 137 agents, 55 skills, and 100+ slash commands that activate automatically through a registry-backed keyword system.

The frontend (`@accos/frontend` v1.0.0) is the control surface: a React 18 application where you design, visualize, and manage multi-agent workflows and the plugin marketplace.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Visual Workflow Builder                       │
│          ReactFlow canvas · Zustand state · WebSocket           │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Plugin System Core                         │
│   Discovery · Installation · Validation · Dependency resolution │
│   Health checking · Sandboxing · Federated registry             │
└───────────┬────────────────────────────────┬────────────────────┘
            │                                │
┌───────────▼──────────┐        ┌────────────▼───────────────────┐
│    14 Domain Plugins │        │       Agent Fleet              │
│  jira-orchestrator   │        │  137 agents · 30+ categories   │
│  tvs-microsoft-deploy│        │  55 skills · 100+ commands     │
│  home-assistant-arch │        │  Activated via registry index  │
│  fastapi-backend     │        └────────────────────────────────┘
│  ... and 10 more     │
└───────────┬──────────┘
            │
┌───────────▼──────────────────────────────────────────────────────┐
│                        MCP Servers                               │
│  deploy-intelligence · lessons-learned · project-metrics        │
│  code-quality-gate · workflow-bridge · perplexity · firecrawl   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

### Visual Workflow Builder
- Drag-and-drop ReactFlow canvas with 27 node types (Trigger, Agent, Action, Phase, Control, Terminator)
- Real-time execution tracking over WebSocket
- JSON Schema-driven property forms with Zod validation
- Pre-built workflow templates (Jira dev cycle, member management, theme deployment)

### Claude Code Configuration System
- **137 agents** across 30+ domain categories, invoked via the `Task` tool
- **55 skills** providing reusable procedures activated by keyword triggers
- **100+ slash commands** mapped through a registry quickLookup index
- **11 lifecycle hooks** for safety validation, quality gates, and self-healing
- **5 custom MCP servers** exposing deploy state, code quality, metrics, and workflow pipelines

### Plugin System
- Install plugins from registry, Git URL, or local path
- Automatic semver dependency resolution
- Comprehensive manifest validation against JSON schema
- Supply chain security via Sigstore signing and composite trust scoring
- Sandboxed execution with configurable permission grants
- Plugin CLI for scaffolding, linting, bundling, and diagnosing plugins

## Quick Start

**Prerequisites:** Node.js 18+, pnpm

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
# Opens at http://localhost:5173

# Build for production
pnpm build
```

## Project Structure

```
/
├── src/                        # React frontend application
│   ├── components/             # UI components (Canvas, Nodes, Palette, Properties)
│   ├── stores/                 # Zustand state (workflow, palette)
│   ├── lib/                    # API client, WebSocket, utilities
│   ├── types/                  # TypeScript types (workflow, nodes, plugins)
│   └── hooks/                  # React hooks (usePlugins, useNodeTypes)
├── plugins/                    # 14 installed domain plugins
│   ├── jira-orchestrator/      # Enterprise Jira + Harness orchestration
│   ├── tvs-microsoft-deploy/   # Microsoft Power Platform deployment
│   ├── home-assistant-architect/  # Smart home automation platform
│   └── ...                     # 11 more plugins
├── .claude/                    # Claude Code configuration hub
│   ├── agents/                 # 137 specialized subagents
│   ├── skills/                 # 55 reusable skill procedures
│   ├── rules/                  # 8 behavioral rule files
│   ├── hooks/                  # 11 lifecycle hook scripts
│   ├── mcp-servers/            # 5 custom MCP server implementations
│   ├── plugins/                # 6 available marketplace plugins
│   └── tools/plugin-cli/       # Plugin development CLI (TypeScript)
├── docs/                       # Extended documentation
│   ├── architecture/           # Architecture reviews and roadmaps
│   ├── security/               # Security review reports
│   ├── testing/                # Test strategy and guides
│   └── planning/               # Implementation plans
├── schemas/                    # JSON Schema for plugin manifests
├── .mcp.json                   # MCP server registrations
└── .claude-plugin/plugin.json  # Root plugin manifest (claude-orchestration v4.0.1)
```

## Installed Plugins

These 14 plugins are active and ready to use. Each contributes agents, skills, and slash commands to the platform.

| Plugin | Version | Purpose |
|--------|---------|---------|
| `jira-orchestrator` | 7.5.0 | Enterprise Jira with 77 agents, 16 teams, 45 commands, Atlassian MCP OAuth, Temporal workflows |
| `tvs-microsoft-deploy` | 1.1.0 | Microsoft ecosystem orchestrator: Power Platform, Dataverse, Fabric, Azure, 19 agents, 18 commands |
| `home-assistant-architect` | 2.0.0 | Complete Home Assistant platform with energy, cameras, local LLM (Ollama), Ubuntu deployment |
| `marketplace-pro` | 1.0.0 | Advanced marketplace with intent-based composition, supply chain security, federated registry |
| `exec-automator` | 1.0.0 | AI-powered executive director automation for nonprofits and trade associations (LangGraph) |
| `fullstack-iac` | 1.0.0 | Full-stack IaC: FastAPI + React/Vite + Ansible + Terraform + Kubernetes |
| `fastapi-backend` | 0.1.0 | FastAPI development with MongoDB/Beanie, Keycloak auth, Redis, Celery, observability |
| `aws-eks-helm-keycloak` | 1.0.0 | AWS EKS deployments with Helm, Keycloak OIDC, and Harness CI/CD pipelines |
| `claude-code-templating` | 1.0.0 | Universal templating: Handlebars, Cookiecutter, Copier, Maven archetypes, Harness pipelines |
| `frontend-design-system` | 1.0.0 | 263+ design styles with multi-tenant Keycloak theming |
| `react-animation-studio` | 1.1.0 | Web animations: Framer Motion, GSAP, 3D transforms, scroll, text, particles |
| `team-accelerator` | 1.0.0 | Enterprise DevOps toolkit: code quality, multi-cloud deployments, Playwright, Prometheus |
| `lobbi-platform-manager` | 1.0.0 | Keycloak management, MERN service orchestration, and test generation for keycloak-alpha |
| `deployment-pipeline` | 1.0.0 | Harness CD integration with state-machine workflow orchestration |

## Available Marketplace Plugins

These 6 plugins are ready to install from `.claude/plugins/`.

| Plugin | Version | Purpose |
|--------|---------|---------|
| `langgraph-architect` | 1.0.0 | LangGraph/LangChain agent builder with MCP integration and CLI accessibility |
| `api-integration-helper` | 1.0.0 | Production-grade API integration: typed clients, auth flows, rate limiting from OpenAPI/GraphQL specs |
| `code-quality-orchestrator` | 1.0.0 | Five quality gates (static analysis, coverage, security, complexity, dependency health) |
| `migration-wizard` | 1.0.0 | Framework migrations with codemods, strangler fig patterns, rollback strategies |
| `testforge` | 1.0.0 | Intelligent test generation for Jest, Pytest, Vitest — catches real bugs, not just coverage numbers |
| `dev-environment-bootstrap` | 1.0.0 | Developer onboarding: Docker configs, .env templates, IDE setup, dependency detection |

Install a plugin:

```bash
/plugin-install langgraph-architect
/plugin-install ./path/to/local-plugin --dev
```

## Agent Categories

The 137 agents in `.claude/agents/` are organized into 30+ domain categories.

| Category | Agents | Examples |
|----------|--------|---------|
| `business-sales` | 8 | b2b-project-shipper, customer-success-manager, finance-tracker |
| `cloud` | 1 | pulumi-specialist |
| `data-ai` | 4 | analytics-reporter, experiment-tracker, trend-researcher |
| `design-ux` | 6 | ux-researcher, brand-guardian, visual-storyteller |
| `development` | 11 | code-architect, ai-engineer, graphql-specialist, redis-specialist |
| `devops` | 2 | ansible-specialist, infrastructure-specialist |
| `documentation` | 4 | generate-api-docs, analyze-codebase, context7-docs-fetcher |
| `frontend-theming` | 3 | theme-system-architect, theme-builder, white-label-specialist |
| `github` | 7 | create-pull-request, bug-fix, analyze-issue, create-worktrees |
| `helm` | 3 | helm-chart-developer, helm-release-manager, helm-values-manager |
| `keycloak` | 5 | keycloak-realm-admin, keycloak-auth-flow-designer, keycloak-security-auditor |
| `kubernetes` | 4 | k8s-architect, k8s-debugger, k8s-security-specialist, k8s-resource-optimizer |
| `marketing-growth` | 7 | growth-hacker, content-creator, app-store-optimizer |
| `membership-domain` | 4 | membership-specialist, directory-manager, member-engagement-agent |
| `messaging` | 3 | kafka-specialist, rabbitmq-specialist, event-streaming-architect |
| `migration` | 2 | code-migration-specialist, refactoring-guru |
| `mobile` | 4 | ios-specialist, android-specialist, flutter-specialist, react-native-specialist |
| `mongodb-atlas` | 4 | mongodb-schema-designer, mongodb-query-optimizer, mongodb-aggregation-specialist |
| `multi-tenant` | 2 | multi-tenant-architect, tenant-provisioning-specialist |
| `orchestration` | 7+ | lyra, agent-sdk-dev, model-context-protocol-mcp-expert, feature-dev |
| `security` | 3+ | security-hardening-specialist, compliance-auditor |
| `testing` | 2+ | test-automation-engineer, performance-tester |
| Top-level | 6 | code-reviewer, debugger, doc-writer, docker-ops, k8s-image-auditor |

## Skills

Skills are reusable procedures in `.claude/skills/`. A keyword match in the registry activates the corresponding SKILL.md, which defines tools, steps, and constraints for that domain.

**Reasoning & AI**
`complex-reasoning`, `deep-research`, `deep-analysis`, `extended-thinking`, `llm-integration`, `prompt-caching`, `streaming`, `tool-use`, `vision-multimodal`

**Infrastructure & Cloud**
`aws`, `gcp`, `terraform`, `kubernetes`, `helm-deploy`, `docker-build`, `k8s-image-audit`, `keycloak`, `authentication`

**Development**
`react`, `nextjs`, `fastapi`, `flask-api`, `graphql`, `rest-api`, `database`, `redis`, `mongodb-atlas`, `testing`, `debugging`, `git-workflows`, `batch-processing`

**Project & Team**
`jira`, `jira-branch`, `jira-commit`, `jira-pr`, `jira-work`, `jira-sync`, `jira-triage`, `jira-status`, `jira-review`, `jira-prepare`, `scrum`, `kanban`, `atlassian-api`, `confluence`

**Design & Research**
`design-system`, `citations-retrieval`, `deep-research`, `scrape-docs`, `web-research`

**Payments & Integrations**
`stripe-payments`, `member-management`, `multi-tenant`, `vector-db`

## MCP Servers

### Custom (5)

| Server | Purpose |
|--------|---------|
| `deploy-intelligence` | Docker build history, deployment state, rollback tracking |
| `lessons-learned` | Read/write access to the self-healing lessons-learned database |
| `project-metrics` | Line counts, test coverage stats, plugin inventory |
| `code-quality-gate` | ESLint scores, TypeScript errors, quality gate pass/fail |
| `workflow-bridge` | Pipeline state and workflow orchestration data |

### External (2)

| Server | Purpose |
|--------|---------|
| `perplexity` | Web research and current-events queries via Perplexity API |
| `firecrawl` | Structured scraping of specific URLs |

Configured in `.mcp.json`. API keys are injected via environment variables at startup.

## Hooks and Lifecycle

Eleven hooks in `.claude/hooks/` enforce safety, quality, and self-healing across the session lifecycle.

| Hook Event | Script | Purpose |
|------------|--------|---------|
| `SessionStart` | `session-init.sh` | Load rules, print tool reminders on startup |
| `PreToolUse` (Bash) | `bash-safety-validator.sh` | Block destructive commands before execution |
| `PreToolUse` (Edit/Write) | `protect-critical-files.sh` | Guard manifests and secrets from accidental overwrite |
| `PreToolUse` (Bash) | `helm-deploy-validator.sh` | Validate Helm deployment commands before running |
| `PostToolUse` (Edit/Write) | `post-edit-lint.sh` | Auto-lint changed TypeScript/JavaScript files |
| `PostToolUse` (Bash) | `docker-build-tracker.sh` | Record Docker build outcomes to MCP server |
| `PostToolUseFailure` | `lessons-learned-capture.sh` | Append failures to `rules/lessons-learned.md` |
| `Stop` | prompt hook | Verify task completion; surface uncommitted changes |
| `TeammateIdle` | `teammate-idle-check.sh` | Monitor and report on idle subagent teammates |
| `TaskCompleted` | `task-quality-gate.sh` | Run TypeScript check and merge-conflict scan on completion |
| `SubagentStop` | `subagent-results-log.sh` | Async log of subagent output for audit trail |

## Configuration

| File | Purpose |
|------|---------|
| `.mcp.json` | MCP server registrations (command, args, env vars) |
| `.claude/settings.json` | Model selection, teammate mode, permission allowlist/denylist, hook bindings |
| `.claude/CLAUDE.md` | Primary project instructions: workflow protocol, model routing, key paths |
| `.claude/rules/` | Eight modular rule files (git-workflow, architecture, research, lessons-learned, etc.) |
| `.claude-plugin/plugin.json` | Root plugin manifest (`claude-orchestration` v4.0.1) |
| `schemas/plugin.schema.json` | JSON Schema all plugin manifests validate against |

### Permission model

`settings.json` maintains an explicit allowlist for Bash subcommands (npm, pnpm, git, docker, kubectl, helm, az, terraform, etc.) and a denylist that blocks destructive operations (`rm -rf /`) and prevents reading `.env` files or secrets directories.

## Development

### Scripts

```bash
pnpm dev                        # Start Vite dev server (http://localhost:5173)
pnpm build                      # Type-check + generate plugin indexes + Vite build
pnpm test                       # Run Vitest test suite
pnpm test:ui                    # Vitest with browser UI
pnpm test:e2e                   # Playwright end-to-end tests
pnpm lint                       # ESLint with zero-warnings policy
pnpm type-check                 # tsc --noEmit
pnpm generate:plugin-indexes    # Regenerate plugin index files from manifests
pnpm check:plugin-schema        # Validate all plugin.json files against schema
pnpm check:plugin-context       # Validate plugin context budgets
pnpm check:hooks                # Lint hook scripts for correctness
```

### Plugin CLI

The plugin CLI lives at `.claude/tools/plugin-cli/` and is used to create and maintain plugins.

```bash
# Scaffold a new plugin
node .claude/tools/plugin-cli/bin/plugin-cli.js init my-plugin --type full

# Validate a plugin's structure and manifest
node .claude/tools/plugin-cli/bin/plugin-cli.js validate plugins/my-plugin

# Lint for best practices
node .claude/tools/plugin-cli/bin/plugin-cli.js lint plugins/my-plugin

# Bundle for distribution
node .claude/tools/plugin-cli/bin/plugin-cli.js build plugins/my-plugin -o dist/

# Diagnose common issues
node .claude/tools/plugin-cli/bin/plugin-cli.js doctor plugins/my-plugin
```

Plugin templates: `full`, `agent-pack`, `skill-pack`, `workflow-pack`.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript 5.3 |
| Build | Vite 5 |
| State | Zustand 4 |
| Workflow canvas | ReactFlow 11 |
| Server state | TanStack Query 5 |
| Validation | Zod 3 |
| Animation | Framer Motion 11 |
| Styling | Tailwind CSS 3 |
| Real-time | socket.io-client 4 |
| Code editor | Monaco Editor |
| Testing | Vitest 1, Playwright, Testing Library |

## Documentation

| Directory | Contents |
|-----------|---------|
| `docs/architecture/` | Architecture quality review, improvement roadmap |
| `docs/security/` | Security review report, implementation guide, quick reference |
| `docs/testing/` | Test strategy, implementation guide, execution quick reference |
| `docs/planning/` | Decomposition plans, resource allocation, execution timelines |
| `docs/reference/` | Commands reference, dependency graph, plugin dependency analysis |
| `docs/governance/` | Control matrix |
| `.claude/README.md` | Claude configuration hub — component relationships and data flow |
| `.claude/PLUGIN_SYSTEM.md` | Plugin installation and management reference |

## Contributing

1. Follow the `EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT` workflow defined in `.claude/CLAUDE.md`.
2. Use `pnpm lint` and `pnpm type-check` before committing.
3. Plugin changes must pass `pnpm check:plugin-schema` and `pnpm check:plugin-context`.
4. Commit messages use imperative mood: `type(scope): description` (max 72 chars).
5. Never commit `.env` files, credentials, or secrets.

## License

MIT — see individual plugin manifests for per-plugin license terms.
