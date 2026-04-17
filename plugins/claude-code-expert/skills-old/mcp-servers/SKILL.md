# MCP Servers in Claude Code

Complete guide to Model Context Protocol server configuration and usage.

## Overview

MCP (Model Context Protocol) allows Claude Code to connect to external servers that provide additional tools, resources, and capabilities. Supports 300+ external tools and services.

## Transport Types

| Transport | Description | Recommended |
|-----------|-------------|-------------|
| `http` | HTTP-based (streamable) | Yes (recommended) |
| `sse` | Server-Sent Events | Deprecated |
| `stdio` | Local process via stdin/stdout | For local servers |

## Adding MCP Servers via CLI

```bash
# HTTP server (recommended)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# SSE server (deprecated)
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Local stdio server
claude mcp add --transport stdio my-db -- npx -y @some/package

# With environment variables
claude mcp add --transport stdio -e AIRTABLE_API_KEY=YOUR_KEY airtable -- npx -y airtable-mcp-server

# With scope
claude mcp add --scope project server-name -- command args

# List configured servers
claude mcp list

# Get server details
claude mcp get server-name

# Remove server
claude mcp remove server-name
```

## Installation Scopes

| Scope | Storage | Shared |
|-------|---------|--------|
| `local` (default) | `~/.claude.json` | No (personal, this project) |
| `project` | `.mcp.json` | Yes (version controlled) |
| `user` | `~/.claude.json` with scope flag | No (personal, all projects) |

## Configuration File

MCP servers are configured in `.mcp.json` at the project root.

### Stdio Server
```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "executable",
      "args": ["arg1", "arg2"],
      "env": {
        "KEY": "value"
      },
      "disabled": false
    }
  }
}
```

### HTTP Server
```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

### Environment Variable Expansion
```json
{
  "mcpServers": {
    "my-server": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api",
      "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
      "env": {
        "API_KEY": "${MY_API_KEY}",
        "PORT": "${PORT:-3000}"
      }
    }
  }
}
```
`${VAR}` expands to env var value. `${VAR:-default}` provides fallback.

### Configuration Locations
- **Local**: `~/.claude.json` (personal, one project)
- **Project**: `.mcp.json` in project root (checked into git)
- **User**: `~/.claude.json` with user scope (personal, all projects)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Transport: `stdio`, `http`, `sse` |
| `command` | string | Executable to run (stdio) |
| `args` | string[] | Arguments to pass (stdio) |
| `url` | string | Server URL (http/sse) |
| `headers` | object | HTTP headers (http/sse) |
| `env` | object | Environment variables |
| `disabled` | boolean | Temporarily disable server |
| `cwd` | string | Working directory for the server |

## Adding MCP Servers via CLI

```bash
# Add server interactively
claude mcp add

# Add with name and command
claude mcp add server-name -- command arg1 arg2

# Add with scope
claude mcp add --scope project server-name -- npx -y @package/server

# Add with environment variables
claude mcp add server-name -e KEY=value -- command args

# List configured servers
claude mcp list

# Remove server
claude mcp remove server-name

# Get server details
claude mcp get server-name
```

## Common MCP Servers

### Filesystem Server
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

### PostgreSQL Server
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/dbname"
      }
    }
  }
}
```

### GitHub Server
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

### Brave Search
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA..."
      }
    }
  }
}
```

### Puppeteer (Browser Automation)
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### Memory (Persistent Knowledge Graph)
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Slack
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-...",
        "SLACK_TEAM_ID": "T..."
      }
    }
  }
}
```

### Sentry
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_..."
      }
    }
  }
}
```

### Firecrawl (Web Scraping)
```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "fc-..."
      }
    }
  }
}
```

### Context7 (Library Docs)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  }
}
```

### Perplexity (AI Search)
```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "perplexity-mcp"],
      "env": {
        "PERPLEXITY_API_KEY": "pplx-..."
      }
    }
  }
}
```

## OAuth MCP Servers

Some MCP servers support OAuth authentication:

```bash
# Add OAuth-enabled server
claude mcp add --transport http \
  --callback-port 8080 \
  --client-id "my-client-id" \
  --client-secret "my-secret" \
  github https://api.githubcopilot.com/mcp/
```

### OAuth Configuration
```json
{
  "mcpServers": {
    "oauth-server": {
      "type": "http",
      "url": "https://api.example.com/mcp/",
      "oauth": {
        "clientId": "your-client-id",
        "clientSecret": "your-client-secret",
        "callbackPort": 8080,
        "scopes": ["read", "write"]
      }
    }
  }
}
```

## Additional CLI Commands

```bash
# Add MCP server from JSON blob
claude mcp add-json my-server '{"command":"node","args":["server.js"]}'

# Import servers from Claude Desktop app
claude mcp add-from-claude-desktop

# Reset MCP server (clear cached state)
claude mcp reset server-name
```

## Tool Naming Convention

MCP tools are exposed to Claude with the naming pattern:
```
mcp__<server-name>__<tool-name>
```

For example:
- `mcp__filesystem__read_file`
- `mcp__postgres__query`
- `mcp__github__create_issue`

## SSE-Based Servers

For remote MCP servers using Server-Sent Events:

```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://my-server.example.com/mcp/sse",
      "headers": {
        "Authorization": "Bearer token123"
      }
    }
  }
}
```

## Building Custom MCP Servers

### TypeScript Server (Recommended)

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "my_tool",
      description: "Does something useful",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "The query" }
        },
        required: ["query"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "my_tool") {
    const { query } = request.params.arguments;
    return {
      content: [{ type: "text", text: `Result for: ${query}` }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python Server

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

server = Server("my-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="my_tool",
            description="Does something useful",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "my_tool":
        return [TextContent(type="text", text=f"Result: {arguments['query']}")]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read, write):
        await server.run(read, write)

import asyncio
asyncio.run(main())
```

## Troubleshooting

### Server Not Starting
```bash
# Check server status
claude mcp list

# Test server manually
echo '{"jsonrpc":"2.0","method":"initialize","params":{"capabilities":{}},"id":1}' | npx -y @package/server

# Check Claude Code logs
claude --verbose
```

### Common Issues
1. **Missing env vars** — Ensure API keys are set in the `env` field
2. **npx cache** — Use `npx -y` to auto-accept package install
3. **Path issues** — Use absolute paths for `command` when needed
4. **Permission denied** — Ensure server executable has execute permission
5. **Port conflicts** — For SSE servers, check port availability

## Security Considerations

- MCP servers run with **full system access** — vet servers carefully
- API keys in `.mcp.json` should be in `.gitignore` or use env var references
- Prefer official `@modelcontextprotocol/server-*` packages
- Review server source code before adding third-party servers
- Use project-scoped config over user-scoped for sensitive servers

## MCP Prompts — The Most Overlooked Primitive

> **Most engineers only use MCP Tools and miss this entirely. MCP Prompts are the highest-leverage primitive in the MCP spec.**

MCP has three primitives: **Tools** (Claude invokes), **Resources** (data sources), and **Prompts** (pre-built conversation starters). Prompts are server-defined templates that prime Claude with everything needed for complex workflows — available via slash commands in the UI or programmatic invocation.

### What Prompts Can Do

A Prompt is a structured message template that a server exposes. When invoked, it injects a complete, expert-quality system message into the conversation. Unlike Tools (which Claude calls to get data), Prompts set up *how Claude should think and act* for the entire workflow.

**Prompts vs Tools:**

| | Prompts | Tools |
|-|---------|-------|
| When invoked | At conversation start or via slash command | During conversation as needed |
| What they provide | Structured messages that prime the agent | Data or action results |
| Best for | Workflow setup, expertise injection, complex multi-step tasks | Data retrieval, actions, side effects |
| Visibility | Appear as `/server:prompt-name` in UI | Called by Claude internally |

### Implementing Prompts in a Custom Server

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { prompts: {}, tools: {} } }  // declare prompts capability
);

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "deploy-checklist",
      description: "Run full pre-deployment verification checklist",
      arguments: [
        {
          name: "environment",
          description: "Target environment (staging/production)",
          required: true
        }
      ]
    },
    {
      name: "security-review",
      description: "Deep security audit of recent changes",
      arguments: []
    }
  ]
}));

// Return prompt messages when invoked
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "deploy-checklist") {
    const env = args?.environment ?? "staging";
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are a deployment safety engineer. Run a complete pre-deployment checklist for the ${env} environment:
1. Check all tests pass
2. Verify no .env files are staged
3. Confirm version bump in package.json
4. Review last 3 commits for accidental secrets
5. Check docker image tags are not :latest
6. Verify rollback plan is documented

Report each item as PASS/FAIL/WARN with a one-line reason.`
          }
        }
      ]
    };
  }

  if (name === "security-review") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are a security engineer. Review the recent git diff for:
- Hardcoded credentials or API keys
- SQL injection vulnerabilities
- XSS attack surfaces
- Insecure deserialization
- Path traversal vulnerabilities
- Missing auth checks on new endpoints

Run git diff HEAD~3 and analyze every changed file.`
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

### Why Prompts Beat Mega-CLAUDE.md

Instead of loading 500 lines of deployment instructions into every session, expose a `deploy-checklist` prompt. It loads zero tokens at session start and activates only when needed.

**Pattern:** One Prompt = one expert persona + one workflow. Keep Prompts focused.

### Real-World Prompt Ideas

| Prompt Name | What It Primes |
|-------------|----------------|
| `deploy-checklist` | Pre-deployment verification workflow |
| `security-audit` | OWASP-aware code review persona |
| `architecture-review` | System design review with ADR output |
| `incident-response` | On-call SRE persona for outage triage |
| `db-migration-review` | Database change safety checklist |
| `api-review` | REST/GraphQL API design reviewer |
| `pr-summary` | Auto-generate PR descriptions from diff |
| `test-strategy` | Test coverage analysis and planning |

### Cost Impact

Prompts inject messages only when invoked. A Prompt with 500 tokens of expert instructions costs nothing until used, vs CLAUDE.md where those tokens load every session.

**Rough math:** 10 Prompts × 500 tokens each = 5,000 tokens available on demand vs 5,000 tokens consumed per session if put in CLAUDE.md.

---

## Per-Tool Result Size Override (v2.1.91)

MCP servers can raise the truncation cap on a specific tool by annotating it in `tools/list`. The default cap is global; per-tool overrides let schema-heavy tools (database schemas, full file trees) return inline results instead of being written to disk with a file reference.

Hard ceiling: **500,000 characters** per tool.

```json
{
  "name": "get_schema",
  "description": "Returns the full database schema",
  "_meta": {
    "anthropic/maxResultSizeChars": 500000
  }
}
```

TypeScript server example:

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_schema",
      description: "Returns the full database schema",
      inputSchema: { type: "object", properties: {} },
      _meta: { "anthropic/maxResultSizeChars": 500000 },
    },
  ],
}));
```

When to use: tools that return database schemas, directory trees, large config files, or any payload that's inherently large but needs to stay in context for Claude to reason about it.
