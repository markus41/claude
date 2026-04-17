# /cc-mcp — MCP Server Configuration Manager

Configure, troubleshoot, and manage MCP servers for Claude Code.

## Usage
```
/cc-mcp [action] [server-name]
```

## Actions

### add
Add a new MCP server.
```
/cc-mcp add                       # Interactive
/cc-mcp add filesystem            # Add filesystem server
/cc-mcp add postgres              # Add PostgreSQL server
/cc-mcp add github                # Add GitHub server
/cc-mcp add brave-search          # Add Brave Search
/cc-mcp add memory                # Add Memory server
/cc-mcp add slack                 # Add Slack server
/cc-mcp add puppeteer             # Add Puppeteer server
/cc-mcp add firecrawl             # Add Firecrawl server
/cc-mcp add perplexity            # Add Perplexity server
/cc-mcp add context7              # Add Context7 server
/cc-mcp add custom                # Add custom server
```

### remove
Remove an MCP server.
```
/cc-mcp remove server-name
```

### list
List all configured MCP servers with status.
```
/cc-mcp list
```

### test
Test MCP server connectivity.
```
/cc-mcp test                      # Test all servers
/cc-mcp test server-name          # Test specific server
```

### troubleshoot
Diagnose MCP server issues.
```
/cc-mcp troubleshoot              # Check all servers
/cc-mcp troubleshoot server-name  # Check specific server
```

## Implementation

When invoked:

### For `add`:
1. If known server type, use preconfigured template
2. Ask for required environment variables (API keys, etc.)
3. Add entry to .mcp.json
4. Test the server starts correctly
5. Show available tools from the server

### For `test`:
1. Read .mcp.json
2. For each server, attempt to start and send initialize request
3. List available tools
4. Report status (OK/FAIL)

### For `troubleshoot`:
1. Check .mcp.json syntax
2. Verify server command exists
3. Check env vars are set
4. Attempt server startup
5. Check for common issues (ports, permissions, deps)
6. Provide specific fix recommendations
