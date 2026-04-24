---
name: claude-code-automation
description: Universal reference for Claude Code automation surface — hooks, skills, plugins, sub-agents, agent teams, MCP, scheduled tasks, channels, routines, headless/SDK, checkpointing, permissions. Invoke when designing automations that leverage Claude Code features or when user asks "how do I automate X with Claude Code".
---

# Claude Code Automation

Map of automation surfaces in Claude Code and which one to reach for. Internal-only — relies on what the user already has installed.

## Decision matrix — which surface to use

| Need | Surface | Lives in |
|---|---|---|
| Run shell command on every tool event | **Hook** | `settings.json` `hooks:` |
| Encapsulate domain knowledge + workflow | **Skill** | `.claude/skills/<name>/SKILL.md` |
| Deterministic multi-step flow the user invokes | **Slash command** | `.claude/commands/<name>.md` |
| Isolated worker spawned from main agent | **Sub-agent** | `.claude/agents/<name>.md` |
| Coordinated multi-agent pattern | **Agent team** | `.claude/agent-teams/<name>.yaml` |
| External tool surface (APIs, CLIs) | **MCP server** | `.mcp.json` or `settings.json` `mcpServers:` |
| Package the above for reuse | **Plugin** | `plugins/<name>/.claude-plugin/plugin.json` |
| Runs on a cron | **Scheduled task** (Desktop) or **Routine** (CLI) | Desktop MCP `scheduled-tasks` / `~/.claude/routines/` |
| Non-interactive CI run | **Headless mode** | `claude -p "..." --output-format stream-json` |
| Programmatic embed | **Agent SDK** | `@anthropic-ai/claude-agent-sdk` (TS) or `claude-agent-sdk` (Python) |
| Structured cross-session chat | **Channel** | `channels.json` + `channels-reference` |
| Rich in-CLI UI | **Fullscreen mode** | `claude --fullscreen` or TUI extensions |

## Hooks — the three lifecycle events that matter most

- **PreToolUse** — veto or mutate a tool call. `{"decision":"block","reason":"..."}` blocks.
- **PostToolUse** — react to tool results (auto-format, audit logs).
- **Stop / SubagentStop** — cleanup when work concludes.

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": {"tool_name": "Bash"},
      "command": "bash .claude/hooks/protect-sensitive-files.sh"
    }]
  }
}
```

## Skills vs commands vs sub-agents

- **Skills** are knowledge + procedure — auto-invoked by description match. Use for domain expertise.
- **Commands** are deterministic invokable flows — user types `/name`. Use for repeatable operations.
- **Sub-agents** are isolated workers — spawn for parallelism or to protect context window.

## MCP — internal pattern

Prefer MCP tools over shell wrappers when available. Check tool surface first:

```
# From this session
mcp__harness__*           # Harness platform ops
mcp__kubernetes__*        # K8s resources
mcp__9c1c57f5_..._atlassian__*    # Jira + Confluence
mcp__384a610f_..._*       # M365: Outlook, SharePoint, Teams
mcp__MCP_DOCKER__azure_*  # Azure services
mcp__scheduled-tasks__*   # Desktop scheduled tasks
```

## Plugins — what to bundle

A plugin is one coherent outcome: a marketplace item a user can install and get value from. Bundle:
- `.claude-plugin/plugin.json` — metadata.
- `skills/` — auto-invoked knowledge.
- `commands/` — user-invoked flows.
- `agents/` — specialized workers.
- `hooks/` — lifecycle scripts.
- `rules/` — always-loaded instructions.
- `README.md` — what it does + install.

Register in marketplace: edit `<marketplace>/.claude-plugin/marketplace.json`, add a `plugins[]` entry.

## Scheduled tasks (Desktop)

```
mcp__scheduled-tasks__create_scheduled_task
  name: "harness-daily-health"
  cron: "0 9 * * *"
  prompt: "Run /wa-pipeline status for all thelobbi pipelines and post to Slack"
```

## Headless mode — CI pattern

```bash
claude -p "run /wa-report for work-unit-14" \
  --output-format stream-json \
  --allowed-tools "Read,Bash" \
  --max-turns 10
```

Use in Harness CI steps where Claude runs a specific flow without TTY.

## Permissions — the four-mode model

| Mode | When |
|---|---|
| `default` | Interactive — user approves novel calls |
| `acceptEdits` | File edits pre-approved, tools still ask |
| `plan` | Read-only — for analysis |
| `bypassPermissions` | CI / trusted automation only |

Set in `settings.json` `permissions.mode` or per-invocation `--permission-mode`.

## Memory (`memory/` + `MEMORY.md`)

- `MEMORY.md` is the always-loaded index. ≤150 chars per entry, one line.
- Entries written to `memory/<name>.md` with frontmatter (`type: user | feedback | project | reference`).
- Never write memory content into `MEMORY.md` directly.

## Checkpointing

File checkpointing preserves state across sessions. Enable via `settings.json` `"checkpointing": { "enabled": true }`. Use for long-running analyses that must survive restarts.

## Common automation recipes

1. **Auto-format on edit** — PostToolUse hook on Edit/Write + per-language formatter.
2. **Protect secrets** — PreToolUse hook on Bash matching `.env|*.pem|*.pfx|*.key` patterns.
3. **CI gatekeeper** — headless Claude + `--allowed-tools` whitelist + stream-json output parsed by pipeline.
4. **Daily report** — scheduled task runs `/wa-report` + posts to Slack/Teams via MCP.
5. **Work-unit close** — SubagentStop hook emits audit event + triggers report generation.

## Related

- `skills/harness-automation` — CI/CD side.
- `skills/work-unit-protocol` — the reporting contract this automates toward.
- `rules/ultra-mode.md` — constraints every automation respects.
