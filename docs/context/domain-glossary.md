# Domain Glossary

| Term | Definition |
|------|-----------|
| **Plugin** | A self-contained domain package installed under `plugins/`. Contains a `.claude-plugin/plugin.json` manifest declaring its commands, agents, skills, and hooks. |
| **Skill** | A reusable capability defined in a `SKILL.md` file. Activated on demand by agents or commands. Lives in `.claude/skills/` or plugin `skills/` directories. |
| **Agent** | An autonomous AI actor with a specialized persona and toolset, defined in a markdown file with YAML frontmatter. Can be invoked as a subagent. |
| **Hook** | A shell script or Node.js script triggered at lifecycle events (PreToolUse, PostToolUse, SessionStart, etc.). Configured in `.claude/settings.json`. |
| **MCP Server** | A Model Context Protocol server exposing tools to the AI runtime. Configured in `.mcp.json`. This project runs 7 MCP servers. |
| **Command** | A slash command (`/command-name`) that triggers a skill, agent, or workflow. Registered in plugin manifests or the global registry. |
| **Registry** | The metadata index under `.claude/registry/` that maps commands, skills, and agents to their source plugins for fast lookup. |
| **Workflow** | A visual graph of connected nodes representing an automation pipeline. Edited on the ReactFlow canvas and persisted via `workflowStore`. |
| **Node Type** | A category of workflow node (trigger, action, condition, transform, etc.) that can be dragged from the palette onto the canvas. Defined in `src/types/nodes.ts`. |
| **ReactFlow Canvas** | The visual drag-and-drop editor powered by ReactFlow 11 where users compose workflows from nodes and edges. |
| **Zustand Store** | A lightweight state container. The platform uses `workflowStore` (graph state) and `paletteStore` (available node types). |
| **Plugin Manifest** | The `.claude-plugin/plugin.json` file inside each plugin that declares metadata, commands, agents, skills, hooks, and dependencies. |

## Domain-Specific Abbreviations

| Abbreviation | Meaning |
|-------------|---------|
| MCP | Model Context Protocol |
| ADR | Architecture Decision Record |
| CI | Continuous Integration |
<!-- Fill in: Add project-specific abbreviations as they arise -->
