# draw.io Diagramming Plugin

## Overview
Intelligent diagramming plugin powered by draw.io / diagrams.net. Generates production-quality diagrams with AI assistance, embeds them across 7+ platforms, and supports conditional formatting linked to live data and statuses.

## Architecture
- **Commands**: 13 slash commands for diagram lifecycle (create, edit, embed, export, analyze, template, style, layers, data-bind, auto-diagram, batch, mcp-setup, enrich)
- **Agents**: 6 specialized agents (diagram-architect, integration-specialist, style-engineer, data-connector, auto-documenter, enrichment-researcher)
- **Skills**: 6 knowledge domains (XML generation, diagram types, platform integrations, conditional formatting, AI generation, MCP integration)

## MCP Server Integration
This plugin supports two draw.io MCP servers:
1. **Official** (`@drawio/mcp`): Opens diagrams in draw.io editor, supports XML/CSV/Mermaid
2. **Community** (`drawio-mcp-server`): CRUD operations on diagram elements, built-in editor

Configure in `.mcp.json`:
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

## Diagram Selection Intelligence
The plugin automatically selects the right diagram type based on context:

| Context | Diagram Type | Why |
|---------|-------------|-----|
| API endpoints | Sequence diagram | Shows request/response flow |
| Database schema | ER diagram | Entity relationships |
| Microservices | C4 Container | Service boundaries |
| CI/CD pipeline | BPMN/Flowchart | Process flow |
| Cloud infra | AWS/Azure/GCP architecture | Cloud-native shapes |
| K8s deployment | Kubernetes diagram | Pod/service topology |
| Class hierarchy | UML Class diagram | Inheritance/composition |
| Decision logic | Flowchart | Branch paths |
| Team structure | Org chart | Reporting lines |
| Sprint planning | Swimlane | Role-based workflow |
| Network topology | Network diagram | Devices and connections |
| State machine | UML State diagram | State transitions |

## XML Generation Rules
1. Always include structural cells: `id="0"` (root) and `id="1" parent="0"` (default layer)
2. Use uncompressed XML — never Base64/deflate
3. Use simplified `<mxGraphModel>` format (no `<mxfile>` wrapper) unless multi-page needed
4. Style strings: semicolon-separated key=value pairs, always end with semicolon
5. Unique IDs for all cells
6. Vertices: `vertex="1"`, Edges: `edge="1"` (mutually exclusive)
7. Coordinates: origin (0,0) is top-left; x→right, y→down

## Platform Embedding
| Platform | Method | Format |
|----------|--------|--------|
| GitHub | `.drawio.svg` in repo, `<img>` in markdown | SVG with embedded XML |
| Confluence | draw.io macro (Marketplace app) | Native integration |
| Jira | draw.io for Jira app, embed from Confluence | Native integration |
| Azure DevOps | Export PNG/SVG, commit to repo, pipeline auto-export | Image + automation |
| Notion | Chrome extension or File > Embed > Notion | `.drawio.svg` embed |
| Teams | OneDrive/SharePoint integration | Shared file link |
| Harness | SVG/PNG in pipeline docs, wiki markdown | Image embed |

## Diagram Enrichment (Firecrawl-Powered)
The plugin can enrich diagrams with deeper analysis at 4 levels:

| Level | Scope | Tools Used |
|-------|-------|-----------|
| 1 - Quick | Add labels, types, basic metadata | Code analysis (Grep, Glob, Read) |
| 2 - Standard | Full code analysis + dependency tracing + framework metadata | Code analysis + AST parsing |
| 3 - Deep | Above + web research + API docs + cloud service details | Firecrawl MCP (search, scrape, map, extract) |
| 4 - Exhaustive | Above + cross-repo analysis + historical git analysis + metrics | All tools + Agent subagents |

Firecrawl tools used for enrichment:
- `firecrawl_search` — Find API documentation, architecture patterns, best practices
- `firecrawl_scrape` — Extract structured API specs (OpenAPI/Swagger endpoints, schemas)
- `firecrawl_map` — Discover all pages of documentation sites before targeted scraping
- `firecrawl_extract` — Pull structured data (configs, pricing, service limits) from docs

Self-editing enrichment loop: generate → analyze gaps → research → enrich → re-analyze → repeat

## Quality Standards
- Use draw.io color themes for consistency (blue, green, yellow, orange, red, purple, gray)
- Apply `shadow=1` and proper spacing for professional appearance
- Use HTML labels (`html=1`) for rich formatting
- Layer complex diagrams (infrastructure, application, data layers)
- Add metadata via `<object>` tags for data binding
- Follow C4 model conventions for architecture diagrams
