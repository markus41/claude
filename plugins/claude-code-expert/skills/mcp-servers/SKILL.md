# MCP Servers in Claude Code

Complete guide to Model Context Protocol server configuration and usage.

## Overview

MCP (Model Context Protocol) allows Claude Code to connect to external servers that provide additional tools, resources, and capabilities. Servers run as separate processes and communicate via stdio or SSE.

## Configuration File

MCP servers are configured in `.mcp.json` at the project root.

```json
{
  "mcpServers": {
    "server-name": {
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

### Configuration Locations
- **Project**: `.mcp.json` in project root (checked into git)
- **User**: `~/.claude/mcp.json` (global, all projects)

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `command` | string | The executable to run |
| `args` | string[] | Arguments to pass |
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
