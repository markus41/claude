# draw.io Diagramming Plugin

## Overview
Intelligent diagramming plugin powered by draw.io / diagrams.net. Generates production-quality diagrams with AI assistance, embeds them across 7+ platforms, and supports conditional formatting linked to live data and statuses.

## Architecture
- **Commands**: 14 slash commands for diagram lifecycle (create, edit, embed, export, **open**, analyze, template, style, layers, data-bind, auto-diagram, batch, mcp-setup, enrich) — each with comprehensive flag system (247+ flags total)
- **Agents**: 6 specialized agents (diagram-architect, integration-specialist, style-engineer, data-connector, auto-documenter, enrichment-researcher)
- **Skills**: 14 knowledge domains (see `skills/INDEX.md` for load order):
  - Core: XML generation, templates, **quality-critique**, diagram types, AI generation, MCP integration
  - Research: **research-agents** (6 agent configs for code/infra/API/web/DB/git research)
  - Extended: **diagram-catalog** (196 diagram types), **wireframes-mockups** (UI/UX), **data-structures** (CS visualizations), **network-software-mapping** (infra/architecture)
  - Integration: platform-integrations, conditional-formatting, **desktop-integration**

## Using Plugin Agents as Subagents

The plugin's agents (diagram-architect, style-engineer, etc.) are markdown instruction
files, NOT built-in Claude Code subagent types. To use them as subagents:

```
# CORRECT: Read the agent file and pass its instructions in the prompt
Agent(
  subagent_type="general-purpose",
  prompt="Follow the instructions in agents/diagram-architect.md to create a [diagram]..."
)

# WRONG: This doesn't work — plugin agents aren't registered subagent_types
Agent(subagent_type="drawio:diagram-architect", ...)
```

**For research-backed diagram creation**, use the research agent configurations in
`skills/research-agents/SKILL.md` which map to proper Claude Code subagent types
(`Explore`, `researcher`, etc.).

## Desktop Support (Claude Code Desktop)

This plugin works on both Claude Code web and Claude Code desktop. On desktop,
the draw.io desktop application (Electron) provides visual editing alongside
AI-powered generation.

### Quick Start (Desktop)

```bash
# Create a diagram and open it in the desktop editor
drawio:create --type c4 --analyze src/ --output docs/architecture.drawio --open

# Open an existing diagram for visual editing
drawio:open --file docs/architecture.drawio

# Export and open the result
drawio:export docs/architecture.drawio --format svg --embed-diagram --open
```

### Desktop App Installation

| Platform | Command |
|----------|---------|
| **macOS** | `brew install --cask drawio` |
| **Linux (snap)** | `sudo snap install drawio` |
| **Linux (deb)** | `sudo dpkg -i drawio-amd64-*.deb` |
| **Windows** | `winget install JGraph.Draw` |

### Iterative AI + Human Workflow

1. AI generates diagram XML → `drawio:create --open`
2. User refines visually in draw.io desktop → saves
3. AI detects changes → `drawio:enrich` or `drawio:edit` to further improve
4. Desktop auto-reloads the updated file

### WSL Support

When running Claude Code in WSL, the plugin detects this and opens diagrams
in the Windows draw.io app automatically.

See `skills/desktop-integration/SKILL.md` for full platform detection, CLI
reference, and troubleshooting.

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
| Data structures | Data Structure diagram | Arrays, trees, graphs, hash tables |
| UI/UX design | Wireframe / Mockup | Lo-fi, mid-fi, hi-fi fidelity |
| iOS/Android app | Mobile Mockup | Platform-specific UI elements |
| Threat analysis | STRIDE Threat Model | DFD with trust boundaries |
| Enterprise layers | ArchiMate 3.0 | Business/app/tech layers |
| Domain boundaries | DDD Context Map | Bounded context relationships |
| JSON/GraphQL API | Schema Diagram | Type system visualization |
| Message patterns | EIP Diagram | Integration flow patterns |
| Manufacturing flow | Value Stream Map | Lean process optimization |
| Security zones | DMZ Architecture | Network security boundaries |

See `skills/diagram-catalog/SKILL.md` for the full 196-type reference catalog.

## XML Generation Rules
1. Always include structural cells: `id="0"` (root) and `id="1" parent="0"` (default layer)
2. Use uncompressed XML — never Base64/deflate
3. **ALWAYS use the full `<mxfile>` wrapper** with `<diagram>` and `<mxGraphModel>` inside — the simplified `<mxGraphModel>`-only format causes blank files in draw.io desktop and many editors
4. Style strings: semicolon-separated key=value pairs, always end with semicolon
5. Unique IDs for all cells
6. Vertices: `vertex="1"`, Edges: `edge="1"` (mutually exclusive)
7. Coordinates: origin (0,0) is top-left; x→right, y→down
8. **Always use layers** — create at least 2-3 semantic layers (e.g., Infrastructure/Application/Data) even for simple diagrams
9. **Edge routing**: Always use `edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;` for clean connections with rounded bends. Add `jumpStyle=arc;jumpSize=16;` when edges may cross. Use explicit `exitX/exitY/entryX/entryY` connection points for precise routing
10. **Professional defaults**: Apply `shadow=1;`, use HTML labels (`html=1`), use containers/groups for related elements, include a title annotation

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
- **Always layer diagrams** — even simple diagrams benefit from layers (e.g., "Main", "Annotations", "Connections")
- Add metadata via `<object>` tags for data binding
- Follow C4 model conventions for architecture diagrams
- **Edge quality**: Use `rounded=1;jettySize=auto;` on all orthogonal edges for clean bends. Specify `exitX/exitY/entryX/entryY` when shapes are not vertically/horizontally aligned to prevent awkward routing. Use `strokeWidth=2;` for primary flows
- **Containers**: Group related elements using `container=1;collapsible=1;` parent cells
- **Title block**: Include a title annotation cell at the top of every diagram
- **Legend**: For diagrams with 3+ color-coded categories, include a legend group
