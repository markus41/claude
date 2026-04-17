---
name: mcp
description: Configure MCP servers for Claude Code — stdio vs HTTP, authentication, Tools/Resources/Prompts distinction, channels (CI webhook, mobile relay, Discord bridge, fakechat), and cost of always-loaded tools. Use this skill whenever adding an MCP server, debugging connection issues, choosing between MCP Tools vs Prompts vs Resources, installing channel servers, or managing .mcp.json. Triggers on: "MCP server", "mcp config", "add Obsidian MCP", "install context7", "channels", "webhook receiver", "mobile approval", "Discord bridge", "mcp not connecting".
---

# MCP

Model Context Protocol servers extend Claude Code with tools, resources, and prompts. This skill covers selection, configuration, and the three server primitives.

## The three primitives

| Primitive | Loaded when | Use for |
|---|---|---|
| **Tools** | Always (metadata in context) | Actions Claude can take (read/write/query) |
| **Resources** | On request | Static content Claude can list and fetch |
| **Prompts** | On request | Pre-composed conversation starters for complex workflows |

**Cost model:** each tool's name + description + JSON schema consumes context every turn. With 30+ tools the drain is measurable. Prefer **MCP Prompts** for heavy reference material Claude loads only when asked.

## Configuration files

| File | Scope | When |
|---|---|---|
| `~/.claude/mcp.json` (or equivalent) | Global | Servers you want in every project |
| `.mcp.json` (in repo root) | Project | Servers specific to this repo |
| `.mcp.local.json` | Personal override | User-local, gitignored |

Project-scoped is almost always better — avoids global context cost when you're not in that project.

## Transports

| Transport | When |
|---|---|
| `stdio` | Local servers; fastest; the default |
| `http` / `sse` | Remote servers; required for cloud-hosted MCPs |

## Top recommendations (every project)

| Server | Why |
|---|---|
| `context7` | Library documentation lookup — always up-to-date |
| `engram` (already global) | Persistent memory across sessions |
| This plugin's MCP (15 docs + 7 KB tools) | Claude Code expertise |

## Recommendations by stack

Use `cc_docs_hook_pack_recommend` / `cc_docs_team_topology_recommend` style logic:

| Stack signal | Server |
|---|---|
| PostgreSQL | `@modelcontextprotocol/server-postgres` |
| GitHub Actions / .github/ | `@modelcontextprotocol/server-github` |
| Playwright config | `@playwright/mcp` |
| Sentry DSN | sentry MCP |
| Slack token | slack MCP |
| Obsidian vault | Obsidian MCP (Local REST API) |

## Obsidian MCP — first-class integration

The user's vault is at `C:/Users/MarkusAhling/obsidian/`. If the Local REST API plugin is installed in Obsidian, expose it via:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "obsidian-mcp-server"],
      "env": { "OBSIDIAN_API_URL": "http://127.0.0.1:27123", "OBSIDIAN_API_KEY": "..." }
    }
  }
}
```

Claude then reads/writes vault notes via `mcp__obsidian__*` tools — used extensively by the memory-consolidator (tier 2 writes).

## Channels (event-driven MCPs)

Channels are MCP servers that receive external events (webhooks, messages) and expose them to Claude. Four patterns:

| Pattern | Use |
|---|---|
| `ci-webhook` | Receive GitHub Actions events via webhook with HMAC verification |
| `mobile-approval` | Telegram-based permission relay (requires Claude Code v2.1.81+) |
| `discord-bridge` | Two-way Discord ↔ Claude with discord_reply tool |
| `fakechat` | Built-in local dev channel for testing channel flows |

Fetch implementation via `cc_kb_channel_server(name)` — returns full TypeScript source.

## Debugging connection issues

1. **Server doesn't start**: check stdin/stdout isn't polluted by logging. MCP servers must write logs to stderr only.
2. **Server crashes silently**: run the command manually (`npx -y server-name`) to see stderr.
3. **Tools not visible to Claude**: check `capabilities.tools` is declared in server init, and `ListToolsRequestSchema` handler exists.
4. **Slow tool calls**: check for synchronous file I/O or network calls in hot paths.

## MCP delegation

| Need | Tool |
|---|---|
| Fetch channel server code | `cc_kb_channel_server(pattern)` |
| Settings schema reference | `cc_docs_settings_schema` |
| General MCP troubleshooting | `cc_docs_troubleshoot("mcp")` |

## Anti-patterns

- 20+ MCP servers globally → 50k+ tokens passive context cost.
- Putting secrets in `.mcp.json` → commits leak keys. Use env vars.
- stdin logging in an MCP server → breaks the protocol framing.
- Same MCP server installed globally AND project-scoped → duplicate tool definitions.
- Skipping HMAC verification on webhook channels → anyone can spam your Claude.
