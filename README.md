# Claude Code Plugin Marketplace

![License](https://img.shields.io/badge/License-MIT-green)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js)
![Plugins](https://img.shields.io/badge/Plugins-27-blue)

A curated marketplace of Claude Code plugins covering cloud infrastructure, enterprise SaaS, home automation, documentation intelligence, project management, and more. Each plugin ships its own commands, skills, agents, and (where relevant) MCP servers.

## Installation

Install the marketplace and then enable individual plugins through Claude Code:

```bash
# In Claude Code
/plugin install <plugin-name>
```

Or point Claude Code at this repository's `.claude-plugin/marketplace.json`:

```bash
/plugin marketplace add <url-to-this-repo>
```

## Plugins

| Plugin | Description |
|---|---|
| [`aws-eks-helm-keycloak`](./plugins/aws-eks-helm-keycloak) | AWS EKS deployments with Helm, Keycloak authentication, and Harness CI/CD |
| [`claude-code-expert`](./plugins/claude-code-expert) | Second brain for Claude Code — 22-tool MCP server, three-tier memory, orchestration patterns |
| [`claude-code-templating`](./plugins/claude-code-templating-plugin) | Scaffold new Claude Code projects from vetted templates |
| [`cowork-marketplace`](./plugins/cowork-marketplace) | Marketplace bundle for the Cowork platform |
| [`deployment-pipeline`](./plugins/deployment-pipeline) | Generic CI/CD pipeline generator with quality gates |
| [`dotnet-blazor`](./plugins/dotnet-blazor) | .NET and Blazor application development toolkit |
| [`drawio-diagramming`](./plugins/drawio-diagramming) | Generate and edit draw.io diagrams from code or specs |
| [`exec-automator`](./plugins/exec-automator) | Executive-director automation for trade associations and nonprofits |
| [`fastapi-backend`](./plugins/fastapi-backend) | Production FastAPI with MongoDB/Beanie, Keycloak, Docker, K8s |
| [`frontend-design-system`](./plugins/frontend-design-system) | 263+ design styles with multi-tenant Keycloak theming |
| [`fullstack-iac`](./plugins/fullstack-iac) | FastAPI + React + Ansible + Terraform + Kubernetes stack |
| [`home-assistant-architect`](./plugins/home-assistant-architect) | Home Assistant platform with energy, cameras, sensors, local LLM |
| [`jira-orchestrator`](./plugins/jira-orchestrator) | Enterprise Jira orchestration — 81 agents, 46 commands, Atlassian MCP |
| [`lobbi-platform-manager`](./plugins/lobbi-platform-manager) | Development on the-lobbi/keycloak-alpha with service orchestration |
| [`marketplace-pro`](./plugins/marketplace-pro) | Marketplace tooling, federation, and composition engine |
| [`mui-expert`](./plugins/mui-expert) | Material UI component expertise |
| [`project-management-plugin`](./plugins/project-management-plugin) | Interview-first PM with micro-task decomposition across 9 PM platforms |
| [`react-animation-studio`](./plugins/react-animation-studio) | 12 animation skills: GSAP, Framer Motion, 3D, scroll, text, SVG |
| [`scrapin-aint-easy`](./plugins/scrapin-aint-easy) | Documentation intelligence, algorithm library, drift detection |
| [`team-accelerator`](./plugins/team-accelerator) | DevOps, code quality, and workflow automation for teams |
| [`tvs-microsoft-deploy`](./plugins/tvs-microsoft-deploy) | Microsoft Fabric, Dataverse, Power Platform deployments |
| [`upgrade-suggestion`](./plugins/upgrade-suggestion) | Intelligent dependency and framework upgrade recommendations |

Plus six sub-marketplace plugins available under `./.claude/plugins/`: `langgraph-architect`, `code-quality-orchestrator`, `api-integration-helper`, `dev-environment-bootstrap`, `migration-wizard`, `testforge`.

## Repository Layout

```
.
├── .claude-plugin/
│   └── marketplace.json        # Marketplace manifest (27 plugins)
├── plugins/                    # 22 installed plugins
├── .claude/
│   ├── plugins/                # 6 sub-marketplace plugins
│   ├── agents/                 # Platform-level agents
│   ├── skills/                 # Platform-level skills
│   ├── hooks/                  # Lifecycle hook scripts
│   ├── rules/                  # Behavioral rules (always loaded)
│   ├── registry/               # Plugin index and search metadata
│   └── mcp-servers/            # Custom MCP servers
├── scripts/                    # Plugin-dev tooling (validation, indexing)
├── schemas/                    # JSON Schemas for plugins and archetypes
├── docs/                       # Context and architecture documentation
└── examples/                   # Reference archetypes
```

## Plugin Development

Validate and index plugins before committing:

```bash
pnpm install
pnpm check:plugin-schema       # Validate every plugin.json against the schema
pnpm check:plugin-context      # Ensure plugins declare required context entries
pnpm check:hooks               # Lint plugin hook scripts
pnpm generate:plugin-indexes   # Regenerate registry indexes under .claude/registry/
pnpm check:plugin-indexes      # Fail if indexes are out of date
pnpm profile:plugin-context    # Measure per-plugin context overhead
```

See [`plugins/claude-code-expert`](./plugins/claude-code-expert) for in-depth plugin authoring guidance.

## Contributing

1. Scaffold a new plugin with the [`claude-code-templating`](./plugins/claude-code-templating-plugin) generator or copy an existing plugin as a template.
2. Add frontmatter (`description:` at minimum) to every manifest-referenced command, skill, agent, and hook — missing frontmatter produces cache errors.
3. Update `.claude-plugin/marketplace.json` with your plugin entry.
4. Run `pnpm check:plugin-schema && pnpm check:plugin-context` before opening a PR.

## License

MIT — see [LICENSE](./LICENSE).
