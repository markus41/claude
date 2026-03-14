---
name: drawio:mcp-setup
intent: Configure draw.io MCP servers for AI-powered diagramming
tags:
  - drawio-diagramming
  - command
  - mcp-setup
inputs: []
risk: low
cost: low
description: Set up and configure draw.io MCP (Model Context Protocol) servers for AI-powered diagramming. Covers the official jgraph MCP server (App Server and Tool Server), the community drawio-mcp-server by lgazo, and configuration for Claude Desktop, Claude Code, VS Code, Zed, and Codex. Includes troubleshooting guides and connection verification steps.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:mcp-setup

Configure draw.io MCP servers for AI-powered diagramming across different clients
and development environments.

## Overview

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--server <name>` | `-s` | string | `tool` | MCP server to configure (app, tool, community) |
| `--client <name>` | `-c` | string | auto-detect | Target client (claude-desktop, claude-code, vscode, zed, codex) |
| `--port <n>` | `-p` | number | varies | Port for local MCP server |
| `--editor` | `-e` | boolean | `false` | Enable built-in editor for community server |
| `--version <ver>` | `-V` | string | `latest` | MCP server version to install |
| `--output <path>` | `-o` | string | `.mcp.json` | Output path for MCP configuration file |
| `--force` | `-f` | boolean | `false` | Overwrite existing configuration |
| `--test` | `-t` | boolean | `false` | Test the MCP server connection after setup |
| `--registry <url>` | | string | `https://registry.npmjs.org` | npm registry URL for package installation |
| `--scale <factor>` | | number | `1.0` | Default scale for MCP server diagram rendering |
| `--export` | `-E` | boolean | `false` | Export current MCP configuration to stdout |
| `--input <path>` | `-i` | string | none | Import MCP configuration from a file |
| `--reset` | `-R` | boolean | `false` | Remove all draw.io MCP configuration |
| `--verbose` | `-v` | boolean | `false` | Show detailed setup steps and connection info |
| `--dry-run` | `-n` | boolean | `false` | Preview configuration changes without writing |

### Flag Details

#### Server Selection Flags
- **`--server <name>`** (`-s`): Choose which MCP server to configure:
  - `app` — Official jgraph App Server (hosted at `mcp.draw.io`). No local installation. Renders diagrams as iframes in chat UI.
  - `tool` — Official jgraph Tool Server (local via npx). Provides create/edit/export tools. Best for editor integration.
  - `community` — Community drawio-mcp-server by lgazo. CRUD operations with built-in editor. Best for direct diagram manipulation.
- **`--client <name>`** (`-c`): Target client application. Auto-detected from the environment when omitted. Each client has a specific configuration file location:
  - `claude-desktop` — `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
  - `claude-code` — `.mcp.json` in project root
  - `vscode` — `.vscode/mcp.json` or VS Code settings
  - `zed` — `~/.config/zed/settings.json`
  - `codex` — `codex-mcp-config.json`

#### Installation Flags
- **`--version <ver>`** (`-V`): Pin a specific MCP server version. Defaults to `latest`. Example: `--version "1.2.0"`.
- **`--port <n>`** (`-p`): Override the default port. The tool server uses stdio by default; the community server defaults to port 3000 when using HTTP transport.
- **`--editor`** (`-e`): Enable the built-in web editor in the community server. Adds `--editor` to the npx args.
- **`--registry <url>`**: Use a custom npm registry for package installation. Useful in corporate environments with private registries.

#### Configuration Management Flags
- **`--output <path>`** (`-o`): Write the generated configuration to a specific file. Defaults to the standard location for the detected client.
- **`--force`** (`-f`): Overwrite existing MCP configuration without prompting. Without this flag, the command merges new entries into existing config.
- **`--export`** (`-E`): Dump the current draw.io MCP configuration to stdout as JSON. Useful for backup or sharing.
- **`--input <path>`** (`-i`): Import MCP configuration from a file. Merges with existing configuration.
- **`--reset`** (`-R`): Remove all draw.io MCP server entries from the configuration file.

#### Validation Flags
- **`--test`** (`-t`): After writing the configuration, attempt to connect to the MCP server and verify it responds correctly. Reports server version, available tools, and connection latency.
- **`--dry-run`** (`-n`): Show the configuration that would be written without modifying any files.
- **`--verbose`** (`-v`): Show installation commands, configuration file paths, and connection details.

#### Examples with Flags

```bash
# Quick setup with community server for Claude Code
drawio:mcp-setup --server community --editor

# Setup official tool server for VS Code
drawio:mcp-setup --server tool --client vscode

# Setup app server for Claude Desktop
drawio:mcp-setup --server app --client claude-desktop

# Test connection after setup
drawio:mcp-setup --server community --test --verbose

# Export current configuration
drawio:mcp-setup --export

# Reset all draw.io MCP config
drawio:mcp-setup --reset --force

# Dry run to preview config
drawio:mcp-setup --server tool --client claude-code --dry-run
```

Draw.io offers two official MCP server options from jgraph (the company behind
draw.io) plus a community-built alternative. Each serves different use cases:

| Server | Provider | Transport | Best For |
|--------|----------|-----------|----------|
| MCP App Server | jgraph (official) | Streamable HTTP | Chat-embedded diagram rendering |
| MCP Tool Server | jgraph (official) | stdio (npx) | Editor integration, file generation |
| drawio-mcp-server | lgazo (community) | stdio (npx) | CRUD operations, built-in editor |

## Official MCP Server (@drawio/mcp from jgraph)

The official draw.io MCP server provides two complementary interfaces.

### MCP App Server (Hosted)

The App Server runs at `https://mcp.draw.io/mcp` and renders diagrams as
interactive iframes directly in the chat UI. No local installation needed.

**Capabilities:**
- Renders draw.io diagrams as embedded iframes in chat responses
- Accepts XML, CSV, and Mermaid syntax as input
- Returns interactive diagram previews that can be opened in the full editor
- Hosted by jgraph, no local setup required

**Configuration:**

```json
{
  "mcpServers": {
    "drawio-app": {
      "url": "https://mcp.draw.io/mcp"
    }
  }
}
```

**Supported input formats:**
- **XML**: Full draw.io XML with mxGraphModel
- **CSV**: Tabular data that draw.io converts to diagrams using its CSV import
- **Mermaid**: Mermaid.js syntax that draw.io converts to native diagrams

**Example usage in chat:**
When connected, the AI can create diagrams that render inline. The App Server
converts the diagram data into an iframe URL pointing to draw.io's viewer.

### MCP Tool Server (Local via npx)

The Tool Server runs locally via `npx @drawio/mcp` and provides tools for
creating and opening diagrams in the draw.io desktop editor.

**Capabilities:**
- Creates `.drawio` files on disk from XML, CSV, or Mermaid input
- Opens diagrams in the draw.io desktop or web editor
- Exports diagrams to PNG, SVG, or PDF
- Operates via stdio transport (launched by the MCP client)

**Prerequisites:**
- Node.js 18+ installed
- draw.io desktop app (optional, for editor integration)

**Installation and verification:**

```bash
# Verify the package exists and check version
npx @drawio/mcp --version

# Test run (will start stdio server)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx @drawio/mcp
```

**Configuration:**

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "transportType": "stdio"
    }
  }
}
```

**Available tools from the Tool Server:**

| Tool | Description |
|------|-------------|
| `create_diagram` | Create a new .drawio file from XML/CSV/Mermaid |
| `open_diagram` | Open an existing .drawio file in the editor |
| `export_diagram` | Export a .drawio file to PNG/SVG/PDF |
| `list_diagrams` | List .drawio files in a directory |

**Using the Skill + CLI approach:**

For environments without MCP support, the draw.io MCP package can also be used
as a CLI tool to generate `.drawio` files with optional export:

```bash
# Generate a diagram from Mermaid syntax
echo "graph LR; A-->B; B-->C;" | npx @drawio/mcp --input mermaid --output diagram.drawio

# Generate and export to PNG
npx @drawio/mcp --input xml --output diagram.drawio --export png --scale 2
```

## Community MCP Server (drawio-mcp-server by lgazo)

A community-built MCP server that provides CRUD operations on diagram elements
and includes a built-in web editor.

**Repository:** github.com/lgazo/drawio-mcp-server

### Installation

```bash
# Run directly via npx (recommended)
npx -y drawio-mcp-server --editor

# Or install globally
npm install -g drawio-mcp-server

# Start with editor enabled
drawio-mcp-server --editor
```

### Features

- **Built-in editor**: Web-based draw.io editor at `http://localhost:3000`
- **CRUD operations**: Create, read, update, delete individual diagram elements
- **Layer management**: Create, rename, reorder, and toggle layer visibility
- **Element manipulation**: Add shapes, connectors, text; modify styles and positions
- **File operations**: Open, save, create new diagrams
- **Browser extension**: Optional Chrome/Firefox extension for direct browser integration

### Available Tools

| Tool | Description |
|------|-------------|
| `create_diagram` | Create a new empty diagram or from template |
| `add_shape` | Add a shape element (rectangle, ellipse, etc.) |
| `add_connector` | Add a connection between two elements |
| `add_text` | Add a text label element |
| `update_element` | Modify an existing element's properties |
| `delete_element` | Remove an element from the diagram |
| `list_elements` | List all elements in the current diagram |
| `create_layer` | Create a new layer |
| `set_layer_visible` | Toggle layer visibility |
| `export_diagram` | Export to SVG/PNG/PDF |
| `get_diagram_xml` | Get the raw XML of the current diagram |

### Configuration

```json
{
  "mcpServers": {
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server", "--editor"],
      "transportType": "stdio"
    }
  }
}
```

### Without Editor (Headless Mode)

For CI/CD or server environments where no browser UI is needed:

```json
{
  "mcpServers": {
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server"],
      "transportType": "stdio"
    }
  }
}
```

## Configuration by Client

### Claude Desktop (claude_desktop_config.json)

Location varies by OS:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drawio-app": {
      "url": "https://mcp.draw.io/mcp"
    },
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "transportType": "stdio"
    },
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server", "--editor"],
      "transportType": "stdio"
    }
  }
}
```

**Choosing which to enable:**
- Enable `drawio-app` for inline diagram previews in chat
- Enable `drawio-tool` for generating and exporting `.drawio` files
- Enable `drawio-community` if you want CRUD element manipulation and the built-in editor
- You can enable multiple servers simultaneously; they provide complementary tools

### Claude Code (.mcp.json)

Place in the project root `.mcp.json`:

```json
{
  "mcpServers": {
    "drawio-app": {
      "url": "https://mcp.draw.io/mcp"
    },
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    },
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server"]
    }
  }
}
```

**Using `claude mcp add-json`:**

```bash
# Add the official App Server
claude mcp add-json drawio-app '{"url":"https://mcp.draw.io/mcp"}'

# Add the official Tool Server
claude mcp add-json drawio-tool '{"command":"npx","args":["@drawio/mcp"]}'

# Add the community server
claude mcp add-json drawio-community '{"command":"npx","args":["-y","drawio-mcp-server","--editor"]}'
```

**Verifying the connection in Claude Code:**

```bash
# List configured MCP servers
claude mcp list

# Check server status
claude mcp status drawio-tool
```

### VS Code

VS Code supports MCP through extensions. Configure in `.vscode/settings.json`
or the workspace settings:

```json
{
  "mcp.servers": {
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "transportType": "stdio"
    },
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server", "--editor"],
      "transportType": "stdio"
    }
  }
}
```

**VS Code with Copilot Chat MCP support:**

If using GitHub Copilot Chat with MCP support, add to your VS Code settings:

```json
{
  "github.copilot.chat.mcp.servers": {
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    }
  }
}
```

**Complementary VS Code extensions:**
- `hediet.vscode-drawio` - Native draw.io editor inside VS Code
- `hediet.vscode-drawio-text` - Text-based draw.io editing

### Zed

Configure in Zed's settings (`.zed/settings.json` or global settings):

```json
{
  "context_servers": {
    "drawio-tool": {
      "command": {
        "path": "npx",
        "args": ["@drawio/mcp"]
      }
    },
    "drawio-community": {
      "command": {
        "path": "npx",
        "args": ["-y", "drawio-mcp-server"]
      }
    }
  }
}
```

### Codex (OpenAI)

For OpenAI Codex or similar platforms that support MCP:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "transport": "stdio"
    }
  }
}
```

### Cursor

Configure in Cursor's MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    },
    "drawio-community": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server", "--editor"]
    }
  }
}
```

### Windsurf

Configure in Windsurf's MCP config (`.windsurf/mcp.json` or settings):

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "transportType": "stdio"
    }
  }
}
```

## Environment Variables

Some MCP servers support configuration via environment variables:

```bash
# Official Tool Server
export DRAWIO_EDITOR_PATH="/usr/bin/drawio"    # Custom path to draw.io desktop
export DRAWIO_EXPORT_FORMAT="svg"               # Default export format
export DRAWIO_EXPORT_SCALE="2"                  # Default export scale

# Community Server
export DRAWIO_MCP_PORT="3000"                   # Editor port (default: 3000)
export DRAWIO_MCP_HOST="localhost"              # Editor host
export DRAWIO_MCP_NO_EDITOR="true"             # Disable built-in editor
```

Pass environment variables in the MCP config:

```json
{
  "mcpServers": {
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {
        "DRAWIO_EXPORT_FORMAT": "svg",
        "DRAWIO_EXPORT_SCALE": "2"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues and Fixes

#### 1. "npx: command not found"

**Cause:** Node.js is not installed or not in PATH.

```bash
# Check Node.js installation
node --version
npx --version

# Install Node.js if missing (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20
nvm use 20
```

#### 2. "Cannot find module @drawio/mcp"

**Cause:** Package not yet published or npm registry issue.

```bash
# Check if package exists
npm view @drawio/mcp version 2>/dev/null || echo "Package not found on npm"

# Try with explicit registry
npx --registry https://registry.npmjs.org @drawio/mcp --version

# Clear npx cache
npx clear-npx-cache
```

#### 3. "Connection refused" or "Server not responding"

**Cause:** The MCP server failed to start or crashed.

```bash
# Test the server manually
npx @drawio/mcp 2>&1 | head -20

# Check if port 3000 is already in use (community server)
lsof -i :3000 2>/dev/null || ss -tlnp | grep 3000

# Try a different port
npx -y drawio-mcp-server --editor --port 3001
```

#### 4. "EACCES permission denied"

**Cause:** npm global directory permissions issue.

```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Retry
npx @drawio/mcp --version
```

#### 5. "draw.io desktop not found" (Tool Server)

**Cause:** The Tool Server cannot find the draw.io desktop application.

```bash
# Check if draw.io is installed
which drawio 2>/dev/null || echo "drawio not in PATH"

# Common locations
ls /usr/bin/drawio 2>/dev/null
ls /Applications/draw.io.app/Contents/MacOS/draw.io 2>/dev/null
ls "$LOCALAPPDATA/Programs/draw.io/draw.io.exe" 2>/dev/null

# Set the path explicitly
export DRAWIO_EDITOR_PATH="/path/to/drawio"
```

#### 6. "Transport error" or "Invalid JSON-RPC"

**Cause:** Protocol version mismatch between client and server.

```bash
# Check supported protocol version
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx @drawio/mcp 2>&1

# Update to latest version
npm cache clean --force
npx @drawio/mcp@latest --version
```

#### 7. "Streamable HTTP connection failed" (App Server)

**Cause:** Network/proxy issue reaching `https://mcp.draw.io/mcp`.

```bash
# Test connectivity
curl -s -o /dev/null -w "%{http_code}" https://mcp.draw.io/mcp

# Check proxy settings
echo "HTTP_PROXY: ${HTTP_PROXY:-not set}"
echo "HTTPS_PROXY: ${HTTPS_PROXY:-not set}"

# Test with explicit proxy bypass
curl --noproxy "mcp.draw.io" https://mcp.draw.io/mcp
```

#### 8. Community server editor not opening

**Cause:** Browser not launching or port conflict.

```bash
# Check if editor is running
curl -s http://localhost:3000 | head -5

# Open manually
xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null

# Specify a custom port
npx -y drawio-mcp-server --editor --port 3001
```

## Verifying MCP Connection

### Quick Verification Script

```bash
#!/usr/bin/env bash
# verify-mcp.sh - Verify draw.io MCP server connectivity

set -euo pipefail

echo "=== Draw.io MCP Server Verification ==="
echo ""

# Check 1: Node.js
echo -n "Node.js: "
if command -v node &>/dev/null; then
    echo "OK ($(node --version))"
else
    echo "MISSING - install Node.js 18+"
fi

# Check 2: npx
echo -n "npx: "
if command -v npx &>/dev/null; then
    echo "OK ($(npx --version))"
else
    echo "MISSING"
fi

# Check 3: Official package
echo -n "@drawio/mcp: "
if npm view @drawio/mcp version 2>/dev/null; then
    echo " (available on npm)"
else
    echo "not found on npm registry"
fi

# Check 4: Community package
echo -n "drawio-mcp-server: "
COMMUNITY_VER=$(npm view drawio-mcp-server version 2>/dev/null)
if [ -n "$COMMUNITY_VER" ]; then
    echo "$COMMUNITY_VER (available on npm)"
else
    echo "not found on npm registry"
fi

# Check 5: draw.io desktop
echo -n "draw.io desktop: "
if command -v drawio &>/dev/null; then
    echo "OK ($(drawio --version 2>/dev/null || echo 'installed'))"
else
    echo "not installed (optional - needed for export)"
fi

# Check 6: App Server connectivity
echo -n "App Server (mcp.draw.io): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://mcp.draw.io/mcp 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ]; then
    echo "REACHABLE (HTTP $HTTP_CODE)"
else
    echo "UNREACHABLE (HTTP $HTTP_CODE)"
fi

# Check 7: Local MCP config
echo ""
echo "--- Configuration Files ---"
for config in \
    ".mcp.json" \
    "$HOME/Library/Application Support/Claude/claude_desktop_config.json" \
    "$HOME/.config/Claude/claude_desktop_config.json" \
    "$APPDATA/Claude/claude_desktop_config.json" \
    ".vscode/settings.json" \
    ".cursor/mcp.json" \
    ".zed/settings.json"; do
    if [ -f "$config" ]; then
        HAS_DRAWIO=$(grep -c "drawio" "$config" 2>/dev/null || echo "0")
        if [ "$HAS_DRAWIO" -gt 0 ]; then
            echo "  FOUND: $config (has drawio config)"
        else
            echo "  FOUND: $config (no drawio config)"
        fi
    fi
done

echo ""
echo "=== Verification Complete ==="
```

### Testing MCP Tools

After configuration, test that tools are available:

```bash
# In Claude Code, list available MCP tools
claude mcp list

# Check if drawio tools appear
claude mcp tools drawio-tool 2>/dev/null

# Test a simple diagram creation (if Tool Server is connected)
# The AI should be able to call create_diagram tool
```

### Automated Health Check

```python
#!/usr/bin/env python3
"""mcp-health.py - Health check for draw.io MCP servers."""

import subprocess
import json
import sys
import os

def check_stdio_server(command, args):
    """Test a stdio MCP server by sending initialize request."""
    init_msg = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "health-check", "version": "1.0"}
        }
    }) + "\n"

    try:
        result = subprocess.run(
            [command] + args,
            input=init_msg,
            capture_output=True,
            text=True,
            timeout=15,
        )

        if result.returncode == 0 or result.stdout:
            try:
                response = json.loads(result.stdout.strip().split('\n')[0])
                if 'result' in response:
                    server_info = response['result'].get('serverInfo', {})
                    print(f"  Server: {server_info.get('name', 'unknown')}")
                    print(f"  Version: {server_info.get('version', 'unknown')}")
                    tools = response['result'].get('capabilities', {}).get('tools', {})
                    print(f"  Tools: {tools}")
                    return True
            except (json.JSONDecodeError, IndexError):
                print(f"  Response: {result.stdout[:200]}")
                return False

        print(f"  Error: {result.stderr[:200]}")
        return False

    except subprocess.TimeoutExpired:
        print("  Timeout (server may be waiting for more input - this is normal for stdio)")
        return True
    except FileNotFoundError:
        print(f"  Command not found: {command}")
        return False

def main():
    print("=== MCP Server Health Check ===\n")

    servers = [
        ("Official Tool Server", "npx", ["@drawio/mcp"]),
        ("Community Server", "npx", ["-y", "drawio-mcp-server"]),
    ]

    for name, cmd, args in servers:
        print(f"[{name}]")
        ok = check_stdio_server(cmd, args)
        status = "HEALTHY" if ok else "UNHEALTHY"
        print(f"  Status: {status}\n")

if __name__ == '__main__':
    main()
```

## Recommended Setup

### For Individual Developers

Use the official Tool Server for file generation and the App Server for previews:

```json
{
  "mcpServers": {
    "drawio-app": {
      "url": "https://mcp.draw.io/mcp"
    },
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    }
  }
}
```

### For Teams with Shared Projects

Add configuration to `.mcp.json` in the project root so all team members get
the same setup:

```json
{
  "mcpServers": {
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {
        "DRAWIO_EXPORT_FORMAT": "svg",
        "DRAWIO_EXPORT_SCALE": "2"
      }
    }
  }
}
```

### For CI/CD Environments

Use headless mode without the editor for automated diagram processing:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server"],
      "env": {
        "DRAWIO_MCP_NO_EDITOR": "true"
      }
    }
  }
}
```

## Security Considerations

- The App Server at `mcp.draw.io` is hosted by jgraph. Diagram data is sent to
  their server for rendering. Do not use for sensitive/proprietary diagrams.
- The Tool Server and Community Server run locally. Diagram data stays on your machine.
- When using the community server's `--editor` flag, the web editor is accessible
  on `localhost:3000`. Ensure this port is not exposed to untrusted networks.
- Review the community server's source code before use in production environments.

## Execution Flow

1. User invokes `drawio:mcp-setup` with optional `--server` flag (official, community, or both)
2. Detect the current environment (Claude Desktop, Claude Code, VS Code, etc.)
3. Check prerequisites (Node.js, npx, draw.io desktop)
4. Generate the appropriate configuration file for the detected environment
5. Test the MCP server connection with a health check
6. Report setup status and available tools
7. Provide next steps for using the configured MCP tools
