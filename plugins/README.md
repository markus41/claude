# Plugins — authoritative sources

This directory holds the authoritative source of every custom Claude Code plugin Markus owns. Edits here propagate to every consumer on the next session (once the hub cache symlinks are active — see `docs/adr/0002-symlinked-plugin-caches.md`).

## Current roster (33 plugins)

**Core / meta**
- `claude-code-expert` — Claude Code operational manual, memory system, hooks, orchestration patterns.
- `claude-code-templating-plugin` — Universal templating engine (Handlebars, Cookiecutter, Copier, Maven, Harness).
- `marketplace-pro` — Marketplace tooling and devstudio.
- `cowork-marketplace` — Cowork session management.
- `upgrade-suggestion` — Upgrade intelligence council.
- `project-management-plugin` — Project management orchestration.
- `scrapin-aint-easy` — Documentation crawling and knowledge graph.

**Integrations**
- `jira-orchestrator` — Jira workflow orchestration with Confluence, Harness, multi-agent council.
- `drawio-diagramming` — draw.io diagram generation + MCP integration.
- `atlassian` — (lives under `claude-plugins-official`, not here — referenced for context).

**Frontend**
- `frontend-design-system` — 263+ design styles, multi-tenant Keycloak theming.
- `mui-expert` — Material UI component library expertise.
- `react-animation-studio` — React + Framer Motion animations.

**Backend / infra**
- `fastapi-backend` — FastAPI + Mongo/Beanie + Keycloak toolkit.
- `dotnet-blazor` — .NET 8 / Blazor server.
- `fullstack-iac` — Full-stack infra-as-code with Terraform + K8s.
- `aws-eks-helm-keycloak` — AWS EKS + Helm + Keycloak deployments.
- `deployment-pipeline` — Generic deployment orchestration.
- `tvs-microsoft-deploy` — Microsoft stack deployment.

**Lobbi / TAIA business**
- `lobbi-platform-manager` — Lobbi Keycloak platform management.
- `lobbi-bi-reports` — BI reporting.
- `lobbi-compliance-guard` — Compliance enforcement.
- `lobbi-data-migration` — Data migration tooling.
- `lobbi-document-intelligence` — Document intelligence.
- `lobbi-engagement-toolkit` — Member engagement.
- `lobbi-insurance-domain` — Insurance domain logic.
- `lobbi-m365-automator` — M365 automation.
- `lobbi-mortgage-domain` — Mortgage domain logic.
- `lobbi-system-integrator` — System integration.
- `lobbi-workflow-engine` — Workflow engine.

**Microsoft admin**
- `tenant-management-kit` — M365/Entra/Azure tenant kit (published to `claude-m-microsoft` marketplace).

**Exec / automation**
- `exec-automator` — Executive director automation platform.
- `team-accelerator` — Team DevOps toolkit.
- `home-assistant-architect` — Home Assistant platform.

## Layout

Each plugin follows the Claude Code manifest contract:

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json         # Manifest
├── agents/                 # Optional
├── commands/               # Optional
├── skills/                 # Optional
├── hooks/                  # Optional
├── CHANGELOG.md
├── CLAUDE.md
└── README.md
```

## Marketplace membership

A plugin's marketplace membership is defined in `marketplaces/<marketplace-name>/.claude-plugin/marketplace.json`, not here. One plugin can appear in multiple marketplaces (e.g., an internal pre-release + a public stable marketplace).

## Adding a new plugin

```bash
pnpm cchub new-plugin <name> --marketplace claude-orchestration
```

This scaffolds the plugin directory, registers it in the marketplace manifest, and updates `sentinel.schema.json` autocomplete.

## Editing

Edit directly. After Phase 1 cache-symlink (Task 1.9) is live, changes take effect on next session reload — no intermediate sync step.
