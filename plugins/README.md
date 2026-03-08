# Installed Plugins

This directory contains 14 installed plugins that extend Claude Code with domain-specific
capabilities. Each plugin provides specialized agents, commands, skills, and hooks that
Claude can invoke to accomplish tasks ranging from Jira orchestration to smart home automation.

## Why Plugins?

Plugins decompose a monolithic AI assistant into focused, composable units. Each plugin
encapsulates deep expertise in a specific domain -- its own agents understand the domain
vocabulary, its commands expose tested workflows, and its skills encode reusable patterns.
This architecture means you can install only the capabilities you need and extend the
platform without modifying core code.

## Quick Reference

| Plugin | Version | Callsign | Agents | Commands | Description |
|--------|---------|----------|--------|----------|-------------|
| [aws-eks-helm-keycloak](./aws-eks-helm-keycloak/) | 1.0.0 | Conduit-Artisan | 4 | 7 | AWS EKS + Helm + Keycloak + Harness CI/CD |
| [claude-code-templating-plugin](./claude-code-templating-plugin/) | 1.0.0 | - | 6 | 5 | Universal templating + Harness pipelines |
| [deployment-pipeline](./deployment-pipeline/) | 1.0.0 | - | 3 | 5 | State-machine Harness CD pipeline |
| [exec-automator](./exec-automator/) | 1.0.0 | Genesis | 12 | 14 | Nonprofit/association executive automation |
| [fastapi-backend](./fastapi-backend/) | 0.1.0 | - | 5 | 11 | FastAPI + MongoDB + Keycloak + K8s |
| [frontend-design-system](./frontend-design-system/) | 1.0.0 | - | 7 | 9 | 263+ design styles + Keycloak theming |
| [fullstack-iac](./fullstack-iac/) | 1.0.0 | Zenith | 3 | 9 | Full-stack + Terraform/Ansible/K8s IaC |
| [home-assistant-architect](./home-assistant-architect/) | 2.0.0 | - | 15 | 9 | Smart home + Ollama local LLM |
| [jira-orchestrator](./jira-orchestrator/) | 7.5.0 | Arbiter | 82 | 47 | Enterprise Jira/Atlassian DevOps orchestration |
| [lobbi-platform-manager](./lobbi-platform-manager/) | 1.0.0 | - | 5 | 9 | MERN platform + Keycloak management |
| [marketplace-pro](./marketplace-pro/) | 1.0.0 | - | 2 | 13 | Plugin marketplace + supply chain security |
| [react-animation-studio](./react-animation-studio/) | 1.1.0 | - | 7 | 13 | React animations (Framer, GSAP) |
| [team-accelerator](./team-accelerator/) | 1.0.0 | - | 6 | 8 | Enterprise team DevOps toolkit |
| [tvs-microsoft-deploy](./tvs-microsoft-deploy/) | 1.1.0 | Consul | 19 | 18 | Microsoft ecosystem orchestrator |

## Plugin Architecture

Every plugin follows the same directory convention:

```
plugin-name/
  .claude-plugin/
    plugin.json          # Manifest: name, version, author, capabilities
  CLAUDE.md              # Operational guide (auto-loaded by Claude)
  CONTEXT_SUMMARY.md     # Bootstrap context (loaded first for routing)
  agents/                # Specialized AI agents (.md definitions)
    index.json           # Agent registry
  commands/              # User-invocable commands (.md definitions)
    index.json           # Command registry
  skills/                # Reusable knowledge patterns (SKILL.md)
  hooks/                 # Lifecycle hooks (optional)
```

The `.claude-plugin/plugin.json` manifest is the source of truth for plugin metadata.
Claude reads `CONTEXT_SUMMARY.md` first for routing decisions, then loads deeper docs
on demand to stay within context budget.

### How Context Loading Works

1. Claude reads `CONTEXT_SUMMARY.md` to determine if a plugin is relevant to the task.
2. If relevant, it reads command or agent files that match the user's intent.
3. Skill files are loaded lazily -- only when implementation details are needed.
4. Full READMEs are deferred until setup, install, or deep-dive details are required.

This layered approach keeps context usage efficient even with 14 plugins installed.

## Installing and Managing Plugins

**Using marketplace-pro commands:**

```
/mp:quick scan                           # Scan project and recommend plugins
/mp:status                               # Show installed plugins and health
/mp:recommend                            # Get contextual suggestions
/mp:trust <plugin-name>                  # Check trust score
/mp:setup                                # Interactive setup wizard
```

**Using the plugin CLI tool:**

```bash
# Located at .claude/tools/plugin-cli/
npx ts-node .claude/tools/plugin-cli/src/cli.ts install <plugin>
npx ts-node .claude/tools/plugin-cli/src/cli.ts list
```

**Validation:**

```bash
npm run check:plugin-schema              # Validate all plugin.json manifests
npm run check:plugin-context             # Validate context summaries
```

## Available Marketplace Plugins (Not Yet Installed)

Six additional plugins are available in `.claude/plugins/` and can be installed on demand:

| Plugin | Version | Callsign | Description |
|--------|---------|----------|-------------|
| api-integration-helper | 1.0.0 | Connector | Production-ready API integration with typed clients and auth flows |
| code-quality-orchestrator | 1.0.0 | Curator | Unified code quality gates -- static analysis, coverage, security |
| dev-environment-bootstrap | 1.0.0 | Bootstrap | Developer onboarding -- Docker configs, env templates, IDE setup |
| infrastructure-template-generator | 2.0.0 | Forgemaster | Infrastructure templates -- Cookiecutter, Terraform, Harness, GitOps |
| migration-wizard | 1.0.0 | Migrator | Code migrations between frameworks with codemods and rollback |
| testforge | 1.0.0 | TestForge | Intelligent test generation from code analysis |

## Registry

Plugin metadata is tracked in `.claude/registry/plugins.index.json`. The registry maps
callsigns to plugin names, tracks versions and install dates, and organizes plugins by
category (core, frontend, infrastructure, domain, marketplace).

### Callsign Registry

Callsigns provide shorthand identifiers for plugins that are frequently referenced:

| Callsign | Plugin |
|----------|--------|
| Arbiter | jira-orchestrator |
| Conduit-Artisan | aws-eks-helm-keycloak |
| Consul | tvs-microsoft-deploy |
| Genesis | exec-automator |
| Zenith | fullstack-iac |

## Further Reading

- Each plugin has its own `README.md` with detailed agents, commands, skills, and quick start
- Plugin operational guides: `<plugin>/CLAUDE.md` (auto-loaded by Claude for safety rules)
- Plugin schema: `schemas/plugin.schema.json`
- Hooks schema: `schemas/hooks.schema.json`
- Registry index: `.claude/registry/plugins.index.json`
