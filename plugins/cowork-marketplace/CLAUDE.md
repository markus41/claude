# Cowork Marketplace Plugin

Browse, install, launch, and export cowork marketplace items backed by real plugin agents, skills, and commands.

## Available Commands

| Command | Description |
|---------|------------|
| `/cowork-marketplace:browse` | Search and discover marketplace items |
| `/cowork-marketplace:install` | Install an item and activate its plugin bindings |
| `/cowork-marketplace:launch` | Start a cowork session with an installed item |
| `/cowork-marketplace:details` | View full item details, trust score, and plugin bindings |
| `/cowork-marketplace:collections` | Browse 9 curated collections by domain |
| `/cowork-marketplace:stats` | Show marketplace and plugin ecosystem statistics |
| `/cowork-marketplace:export` | Package an item as a Cowork plugin ZIP for distribution |

## Agents

- **marketplace-curator** - Recommends items based on user needs
- **session-orchestrator** - Coordinates multi-agent cowork sessions
- **export-packager** - Creates Cowork-compatible plugin ZIPs

## Skills

- **plugin-catalog** - Catalog knowledge (16 items, 15 plugins, 129+ agents)
- **cowork-sessions** - Session lifecycle and agent coordination
- **plugin-packaging** - Cowork plugin format and distribution

## Catalog

16 items across 5 types, backed by 15 installed plugins:
- 3 Templates (FastAPI, Fullstack, Home Assistant)
- 4 Workflows (Jira-to-PR, EKS Deploy, Microsoft Platform, Sprint Planning)
- 3 Agent Configs (Code Reviewer, Nonprofit Director, Design Architect)
- 3 Skill Packs (DevOps, React Animation, Marketplace Intelligence)
- 3 Blueprints (Enterprise Release, Keycloak Multi-Tenant, Project Scaffolder)

## Dual Compatibility

This plugin works in both:
- **Claude Code** - As an installed plugin with slash commands and agents
- **Claude Desktop Cowork** - Exportable as a plugin ZIP for private marketplaces

The React frontend components in `src/components/cowork/` provide the visual marketplace UI for web applications, while this plugin provides the conversational interface for CLI and Cowork usage.
