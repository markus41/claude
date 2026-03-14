---
description: "draw.io MCP server configuration, tools reference, and integration patterns"
triggers:
  - drawio mcp
  - mcp server
  - drawio mcp setup
  - diagram mcp
  - mcp tools
globs:
  - .mcp.json
  - "**/mcp*.json"
---

# draw.io MCP Server Integration

## Overview

There are two main MCP server options for draw.io integration:

1. **Official @drawio/mcp** (by jgraph) - The official MCP server from the draw.io team
2. **Community drawio-mcp-server** (by lgazo) - Community-built server with built-in editor

Both enable AI assistants to create, read, update, and manage draw.io diagrams programmatically.

---

## Official @drawio/mcp Server (by jgraph)

The official MCP server operates in multiple modes depending on the deployment context.

### Mode 1: MCP App Server (Hosted)

A hosted MCP endpoint that renders diagrams as interactive iframes directly in AI chat interfaces.

**Endpoint:** `https://mcp.draw.io/mcp`

**Features:**
- Renders diagrams as interactive iframes in chat (Claude.ai, VS Code chat, MCP Apps hosts)
- No installation required
- Diagrams are viewable and editable inline
- Supports all draw.io diagram types

**Configuration for Claude.ai:**
1. Go to Claude.ai Settings > MCP Servers
2. Add server URL: `https://mcp.draw.io/mcp`
3. Diagrams render inline in conversations

**Configuration for VS Code (Copilot Chat):**
```json
// .vscode/settings.json
{
  "mcp": {
    "servers": {
      "drawio": {
        "type": "http",
        "url": "https://mcp.draw.io/mcp"
      }
    }
  }
}
```

### Mode 2: MCP Tool Server (Local)

A locally-run MCP server that opens diagrams in the draw.io editor.

**Installation and Usage:**

```bash
npx @drawio/mcp
```

**Features:**
- Opens diagrams in local draw.io editor (desktop or browser)
- Supports XML, CSV, and Mermaid.js input formats
- Lightbox and dark mode options
- Full draw.io editor capabilities

**Configuration:**

```json
// .mcp.json (project-level)
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

**Claude Desktop config:**

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

### Mode 3: Skill + CLI

Uses draw.io Desktop's command-line interface for generating native `.drawio` files and exporting to image formats.

**Requirements:**
- draw.io Desktop application installed
- `drawio` CLI available in PATH

**Capabilities:**
- Generate native `.drawio` files from XML
- Export to PNG, SVG, PDF with `--embed-diagram` flag for round-trip editing
- Batch export multiple pages
- Headless rendering (with `xvfb-run` on Linux)

**Export Commands:**

```bash
# Export to editable SVG
drawio --export --format svg --embed-diagram --output diagram.drawio.svg diagram.drawio

# Export to editable PNG
drawio --export --format png --embed-diagram --output diagram.drawio.png diagram.drawio

# Export to PDF
drawio --export --format pdf --output diagram.pdf diagram.drawio

# Export specific page
drawio --export --format svg --page-index 2 --output page3.svg diagram.drawio

# Export with custom dimensions
drawio --export --format png --width 1920 --border 10 --output diagram.png diagram.drawio

# Crop to content
drawio --export --format svg --crop --output cropped.svg diagram.drawio
```

### Mode 4: Project Instructions

Zero-installation mode that works by pasting draw.io generation instructions directly into a Claude Project's custom instructions. The AI generates clickable draw.io URLs using Python URL encoding.

**How it works:**
1. Paste the draw.io skill instructions into your Claude Project
2. Ask Claude to create a diagram
3. Claude generates XML and encodes it as a draw.io URL
4. Click the URL to open in draw.io

**URL format:**
```
https://app.diagrams.net/#R<URL-encoded-XML>
```

**Python URL generation:**
```python
import urllib.parse

xml = '''<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Hello" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>'''

encoded = urllib.parse.quote(xml, safe='')
url = f'https://app.diagrams.net/#R{encoded}'
print(url)
```

---

## Community drawio-mcp-server (by lgazo)

An open-source MCP server with a built-in web-based draw.io editor and comprehensive CRUD tools.

### Installation

```bash
# Run directly with npx (recommended)
npx -y drawio-mcp-server --editor

# Or install globally
npm install -g drawio-mcp-server
drawio-mcp-server --editor
```

**Version:** 1.8.0+ (MIT License)

### Built-in Editor

When started with `--editor`, the server launches a web-based draw.io editor:

```
http://localhost:3000/
```

Features:
- Full draw.io editor in the browser
- Real-time sync with MCP tool operations
- No draw.io Desktop installation needed
- Supports all draw.io features (shapes, styles, layers, etc.)

### CLI Options

```bash
drawio-mcp-server [options]

Options:
  --editor          Launch built-in web editor (default port 3000)
  --port <number>   Custom port for the editor
  --file <path>     Open a specific .drawio file on startup
  --help            Show help
```

### MCP Tools Reference

The community server exposes these MCP tools:

#### Shape Operations

| Tool | Description |
|------|-------------|
| `create_shape` | Create a new shape (vertex) |
| `update_shape` | Modify shape properties (position, size, style, label) |
| `delete_shape` | Remove a shape |
| `read_shape` | Get shape details (style, geometry, label) |

**create_shape parameters:**
```json
{
  "label": "API Gateway",
  "x": 100,
  "y": 100,
  "width": 140,
  "height": 60,
  "style": "rounded=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
}
```

**update_shape parameters:**
```json
{
  "id": "cell-id",
  "label": "Updated Label",
  "x": 200,
  "y": 150,
  "style": "fillColor=#d5e8d4;strokeColor=#82b366;"
}
```

#### Edge Operations

| Tool | Description |
|------|-------------|
| `create_edge` | Create a connector between shapes |
| `update_edge` | Modify edge properties (label, style, routing) |
| `delete_edge` | Remove an edge |

**create_edge parameters:**
```json
{
  "source": "source-cell-id",
  "target": "target-cell-id",
  "label": "REST API",
  "style": "edgeStyle=orthogonalEdgeStyle;strokeWidth=2;"
}
```

#### Text Operations

| Tool | Description |
|------|-------------|
| `create_text` | Create a text label element |
| `update_text` | Modify text properties |

#### Diagram Operations

| Tool | Description |
|------|-------------|
| `read_diagram` | Get the full diagram structure |
| `inspect_diagram` | Analyze diagram contents (shapes, edges, layers) |
| `clear_diagram` | Remove all elements |

#### Layer Operations

| Tool | Description |
|------|-------------|
| `create_layer` | Create a new diagram layer |
| `switch_layer` | Change the active layer |
| `list_layers` | List all layers |

### Browser Extension

Available for Chrome and Firefox. Enables the MCP server to interact with draw.io running in a browser tab.

**Chrome Extension:** Search "drawio-mcp" in Chrome Web Store
**Firefox Extension:** Search "drawio-mcp" in Firefox Add-ons

### "Vibe Diagramming" Support

The community server is designed for iterative, conversational diagram creation:

1. Start with a natural language description
2. AI creates shapes and edges via MCP tools
3. View results in the built-in editor
4. Provide refinement instructions
5. AI updates specific elements without regenerating everything

This is more efficient than regenerating full XML because only changed elements are modified.

---

## Configuration Examples

### Project-Level (.mcp.json)

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

Or with the community server:

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "drawio-mcp-server", "--editor"]
    }
  }
}
```

### Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`
Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

### Claude Code CLI

```bash
# Add official server
claude mcp add-json drawio '{"command":"npx","args":["-y","@drawio/mcp"]}'

# Add community server with editor
claude mcp add-json drawio '{"command":"npx","args":["-y","drawio-mcp-server","--editor"]}'
```

### VS Code (Copilot / Continue / Roo)

```json
// .vscode/settings.json
{
  "mcp": {
    "servers": {
      "drawio-app": {
        "type": "http",
        "url": "https://mcp.draw.io/mcp"
      },
      "drawio-local": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@drawio/mcp"]
      }
    }
  }
}
```

### Zed Editor

```json
// ~/.config/zed/settings.json
{
  "context_servers": {
    "drawio": {
      "command": {
        "path": "npx",
        "args": ["-y", "@drawio/mcp"]
      }
    }
  }
}
```

### Cursor

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

### Windsurf

```json
// ~/.codeium/windsurf/mcp_config.json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["-y", "@drawio/mcp"]
    }
  }
}
```

---

## Choosing Between Official and Community Servers

| Feature | Official @drawio/mcp | Community drawio-mcp-server |
|---------|---------------------|---------------------------|
| Maintained by | jgraph (draw.io team) | Community (lgazo) |
| License | Proprietary | MIT |
| Hosted option | Yes (mcp.draw.io) | No |
| Built-in editor | No (opens draw.io app) | Yes (localhost:3000) |
| CRUD MCP tools | Limited | Full (shapes, edges, layers) |
| Inline rendering | Yes (iframes in chat) | No |
| File export | Yes (via CLI) | Via editor |
| Mermaid support | Yes | No |
| CSV import | Yes | No |
| Browser extension | No | Yes |
| Desktop app required | For CLI mode | No |
| Vibe Diagramming | Via chat | Via MCP tools + editor |

**Recommendation:**
- Use **official @drawio/mcp** for Claude.ai inline rendering, VS Code Copilot, or when you need the hosted endpoint
- Use **community drawio-mcp-server** when you need granular CRUD control, a built-in editor, or are building automation workflows

---

## Integration Patterns

### Pattern 1: AI Chat Diagram Creation

```
User: "Create an architecture diagram for my microservices"
  |
  v
AI generates draw.io XML
  |
  v
MCP server renders/opens diagram
  |
  v
User views and refines
```

### Pattern 2: Code-to-Diagram Pipeline

```
Source code analysis
  |
  v
Extract classes/services/dependencies
  |
  v
Generate draw.io XML programmatically
  |
  v
Save as .drawio.svg in repo
  |
  v
Auto-rendered in GitHub README
```

### Pattern 3: Status Dashboard Updates

```
Health check API
  |
  v
Python update script (see conditional-formatting skill)
  |
  v
Update .drawio file with status colors
  |
  v
Export to .drawio.svg
  |
  v
Commit to repo (via CI/CD)
  |
  v
Dashboard page auto-updates
```

### Pattern 4: Documentation-as-Code

```
Developer writes/modifies .drawio file
  |
  v
Git commit triggers CI
  |
  v
CI exports to .drawio.svg (drawio CLI)
  |
  v
SVGs embedded in docs site
  |
  v
Confluence/wiki syncs from Git
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `npx: command not found` | Node.js not installed | Install Node.js v20+ |
| `EACCES permission denied` | npm global dir permissions | Use `npx -y` or fix npm permissions |
| Connection refused on port 3000 | Port already in use | Use `--port 3001` or kill existing process |
| MCP server not detected | Wrong config file location | Verify config path for your client |
| Diagram not rendering | Invalid XML | Run validation script from ai-generation skill |
| `Cannot find module` | npm cache issue | `npm cache clean --force && npx -y ...` |
| Timeout on diagram operations | Large diagram | Increase timeout in MCP client config |
| Editor blank on startup | Browser cache | Clear browser cache, try incognito |

### Node.js Version Requirements

Both servers require Node.js v20 or later:

```bash
node --version  # Must be v20.0.0 or higher

# Install via nvm if needed
nvm install 20
nvm use 20
```

### MCP Client Compatibility

| Client | Official @drawio/mcp | Community drawio-mcp-server |
|--------|---------------------|---------------------------|
| Claude.ai | Yes (hosted) | No |
| Claude Desktop | Yes | Yes |
| Claude Code CLI | Yes | Yes |
| VS Code (Copilot) | Yes (hosted + local) | Yes (local) |
| Cursor | Yes | Yes |
| Zed | Yes | Yes |
| Windsurf | Yes | Yes |
| Continue | Yes | Yes |

### Debugging MCP Connections

```bash
# Test official server
npx @drawio/mcp --help

# Test community server
npx drawio-mcp-server --help

# Check if MCP port is in use
lsof -i :3000

# Run with verbose logging
DEBUG=* npx drawio-mcp-server --editor

# Verify MCP config is valid JSON
python3 -c "import json; json.load(open('.mcp.json'))"
```

### Verifying MCP Server Registration

In Claude Code:
```bash
# List registered MCP servers
claude mcp list

# Test connection
claude mcp test drawio
```
