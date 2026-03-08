# Architecture Rules

- This is a plugin-based orchestration platform
- Plugins live in `plugins/` (installed) and `.claude/plugins/` (available)
- Each plugin has a `.claude-plugin/plugin.json` manifest
- MCP servers are configured in `.mcp.json` at project root
- Skills are in `.claude/skills/` with SKILL.md format
- Custom agents are in `.claude/agents/` with YAML frontmatter
- Hooks are configured in `.claude/settings.json` under the `hooks` key
- Registry metadata is in `.claude/registry/`
- Use subagents for research tasks to preserve main context
