# /cc-help — Claude Code Documentation Lookup

Interactive documentation lookup for any Claude Code feature.

## Usage
```
/cc-help [topic]
```

## Arguments
- `topic` — The feature, setting, or concept to look up (optional — interactive if omitted)

## Topics

### Core
- `cli` — CLI flags, arguments, and usage
- `config` / `configuration` — All configuration files and settings
- `settings` — settings.json deep dive
- `claude-md` / `instructions` — CLAUDE.md format and hierarchy
- `rules` — Rules system in .claude/rules/

### Features
- `hooks` — Hook system (PreToolUse, PostToolUse, etc.)
- `mcp` — MCP server configuration
- `permissions` / `security` — Permission model and security
- `tools` — Built-in tools reference
- `commands` / `slash-commands` — Slash commands list
- `shortcuts` / `keyboard` — Keyboard shortcuts
- `memory` — Auto-memory and /memory commands
- `context` — Context window management
- `thinking` / `extended-thinking` — Extended thinking modes
- `models` — Model selection and routing

### Development
- `sdk` / `agent-sdk` — Claude Agent SDK
- `agents` / `sub-agents` — Sub-agent types and spawning
- `git` — Git integration features
- `testing` — Testing workflows
- `ide` — IDE integrations
- `ci-cd` — CI/CD integration

### Operations
- `cost` — Cost tracking and optimization
- `teams` — Team features and collaboration
- `enterprise` — Enterprise managed settings
- `troubleshooting` / `debug` — Debugging Claude Code issues
- `env-vars` — Environment variables reference
- `providers` — Bedrock, Vertex, direct API

## Implementation

When invoked:

1. If a topic is provided, load the corresponding skill from this plugin's skills directory
2. Present the relevant documentation section
3. Offer to dive deeper into sub-topics
4. Provide actionable examples

If no topic:
1. Show the topics list above
2. Ask what the user wants to learn about
3. Navigate to the right documentation
