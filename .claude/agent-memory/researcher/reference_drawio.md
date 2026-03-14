---
name: draw.io / diagrams.net comprehensive reference
description: Complete research on draw.io features including diagram types, integrations, AI, programmatic generation, XML format, CLI, and export options
type: reference
---

## draw.io / diagrams.net — Complete Research Reference (2026-03-14)

### Diagram Types Supported
- **Flowcharts & Swimlane diagrams**
- **UML**: Class, Sequence, Activity, Use Case, Component, Package, Profile, Communication, State, Deployment, Composite Structure (UML 2.5 + UML shape libraries)
- **BPMN / BPMN 2.0** — dedicated shape libraries
- **C4 Model** — system context, container, component, class
- **Cloud**: AWS (2017+), Azure, GCP, IBM, Alibaba Cloud, OpenStack, Dynamics365
- **Network**: Cisco, Network 2025 library (with bold long shadow styling)
- **ER Diagrams** — database modeling
- **Org charts, Mind maps, Floorplans, Infographics**
- **Kanban boards, Gantt charts, PERT charts, Timelines/Roadmaps**
- **Venn diagrams, Wireframes/Mockups, Gitflow diagrams**
- **Science and educational illustrations**
- Import: .vsdx (Visio), Gliffy, Lucidchart files
- Source: https://www.drawio.com/blog/use-cases

### Data-Driven Diagrams & Conditional Formatting
- **No native conditional formatting** (GitHub issue #1706 open since 2020, community request)
- **Custom properties/metadata**: Each shape can store key-value metadata (e.g., Deadline, Assigned To)
- **Data-driven via scripts**: Edit XML, assign unique shape IDs, use external scripts to update shape properties (colors, text, animations) based on live data
- **Grafana + Flowcharting plugin**: Real-time sensor data → diagram shape updates
- **CSV import**: Create infrastructure diagrams from Azure/cloud resource CSV data
- Style editing: Edit > Edit Style (Ctrl+E) for full style control
- Source: https://www.drawio.com/blog/data-driven-diagrams

### GitHub Integration
- Official draw.io GitHub app (OAuth, 1MB file size limit)
- Store/edit diagrams directly in GitHub repos at `https://app.diagrams.net/?mode=github`
- Edit via URL: `https://app.diagrams.net/#H<repo/path>`
- Embed in markdown: save as editable .png or .svg, use `<img>` tags
- GitHub Wikis: require desktop app due to GitHub REST API limitations; no iframe embed
- `drawio-github` repo: edit-diagram.html, nanocms.js for GitHub I/O
- Source: https://github.com/jgraph/drawio-github

### Confluence / Jira Integration
- **#1 rated diagramming app** on Atlassian Marketplace
- Confluence: diagrams embedded via macro, stored as 2 attachments (rendered image + vector)
- Confluence: whiteboarding (Board macro), real-time collaboration, revision history
- Jira: attach diagrams to issues via Actions > Add draw.io diagram
- Jira: embed diagrams from Confluence Cloud into Jira Cloud issues
- Cross-linking: authorize Confluence instance from Jira for embedded diagrams
- Licensing: billed only for Confluence Cloud when using both
- Security: Zero-egress switch (Advanced edition), data stays on Atlassian servers
- Source: https://www.drawio.com/doc/drawio-jira-cloud

### Azure DevOps Integration
- **No native save to Azure Repos** (feature request open)
- VS Marketplace extension "Draw.io view" for viewing .drawio files in Azure DevOps
- Azure Pipelines: automate .drawio → PNG export on file change (headless Linux + drawio CLI)
- Azure infra diagrams from CSV: script scans resources, writes CSV in draw.io format
- Wiki embedding: export + upload manually (no native embed support)
- Source: https://marketplace.visualstudio.com/items?itemName=Hassegawa.azuredevops-drawio-view

### Notion Integration
- Chrome extension "draw.io for Notion" (Chrome, Opera, Edge)
- Extension: Insert diagram button → creates diagram section in Notion page
- Storage format: .drawio.svg (SVG with embedded diagram data)
- Auto-adapts to Notion dark/light theme
- Alternative: File > Embed > Notion in draw.io editor
- Source: https://www.drawio.com/blog/embed-diagrams-notion

### Microsoft Teams Integration
- Had a Teams app (OneDrive/SharePoint backed tabs)
- **Removed from Microsoft Teams marketplace in 2025** (Microsoft's marketplace requirements)
- Workaround: self-host draw.io, add as enterprise app, sideload as custom app
- Known bug (2025): OneDrive file linking fails when adding tab to Teams channel
- Source: https://www.drawio.com/doc/faq/microsoft-teams-support

### XML Format / mxGraph Schema (Programmatic Generation)
Structure hierarchy: `<mxfile>` → `<diagram>` → `<mxGraphModel>` → `<root>` → `<mxCell>`

Mandatory cells:
- `<mxCell id="0"/>` — root container (always required)
- `<mxCell id="1" parent="0"/>` — default layer (always required)

Key rules:
- Use uncompressed XML for programmatic generation (not Base64/deflate compressed)
- Unique IDs for all cells
- Vertices: `vertex="1"`, Edges: `edge="1"`
- Style strings: `"rounded=1;whiteSpace=wrap;html=1;"`
- Non-rectangular shapes need matching `perimeter=` value
- Format has NEVER broken backwards compatibility since 2005
- Schema validation: `mxfile.xsd` XSD file
- Source: https://www.drawio.com/doc/faq/diagram-source-edit

### CLI Export Tool
Built into draw.io Desktop app:
```
drawio -x -f png -o output.png input.drawio
drawio -x -f svg -o out/ diagrams/
drawio -x -f pdf --all-pages -o output.pdf input.drawio
```
Formats: pdf, png, jpg, svg, vsdx
Options: --transparent, --border, --scale, --width, --height, --crop, --page-index, --page-range
Headless Linux: requires Xvfb (`sudo apt install xvfb`, set `drawio_headless: auto`)
Docker: `docker run -it -v $(pwd):/data rlespinasse/drawio-export`
Community CLI wrapper: https://github.com/rlespinasse/drawio-cli
No REST API (feature not natively available)

### AI Features
- **Generate Tool** (sparkle button in toolbar): multi-engine AI generation
- Engines: Gemini, Claude, ChatGPT (admin-configurable)
- Output: draw.io XML or Mermaid syntax
- Best for: flowcharts, sequence diagrams, concept maps, tree diagrams, UI mockups, cloud infra
- Unlimited generations; use Refresh button or edit query to iterate
- Admin: Zero Egress app disables AI if needed
- MCP server: `https://mcp.draw.io/mcp` (hosted, no install) or `npx @drawio/mcp`
- Source: https://github.com/jgraph/drawio-mcp

### draw.io MCP Server (Official)
4 integration approaches:
1. **MCP App Server**: `https://mcp.draw.io/mcp` — renders diagrams inline in Claude.ai (no install)
2. **MCP Tool Server**: `npx @drawio/mcp` — opens diagrams in draw.io editor
3. **Skill + CLI**: Claude Code skill generating .drawio files with PNG/SVG/PDF export
4. **Project Instructions**: Python code generates shareable draw.io URLs (no tools needed)
Source: https://github.com/jgraph/drawio-mcp

### Mermaid Integration
- **Native Mermaid import**: Arrange > Insert > Mermaid (paste code → diagram)
- Two output modes: "Diagram" (editable draw.io shapes) or "Image" (re-editable Mermaid code)
- Mermaid version 10.9.1 with ELK layout support
- **PlantUML being phased out end of 2025** — migrate to Mermaid
- Bidirectional tool (community, 2025): converts between Mermaid, draw.io, Excalidraw
- draw.io → Mermaid: Python AI-assisted converter (March 2025)
- Source: https://www.drawio.com/blog/mermaid-diagrams

### Export Formats
- PNG (with embedded diagram data option), JPEG, SVG, PDF, HTML, XML, VSDX
- SVG: auto-adapts to OS light/dark mode via CSS `light-dark()` function
- Custom fonts must be installed on viewer's device (except PDF)
- Sphinxcontrib-drawio: Python Sphinx extension for doc pipeline integration
- GitHub Action available for CI/CD export automation

### Full Integration Ecosystem
Cloud storage: Google Drive, OneDrive/SharePoint, Dropbox, GitHub, GitLab
Office: Microsoft Office 365 (Word, PowerPoint, Excel), Google Workspace
Wiki/CMS: Confluence, Nextcloud, MediaWiki, BookStack, Tiki Wiki, XWiki, Wiki.js, ownCloud
Project mgmt: Jira, Redmine, Plane.so, Nuclino, Growi, Lark, LumApps
Dev tools: VS Code, JupyterLab, Grafana
Other: ONLYOFFICE, Docstell, Bioicons, Google Classroom
Self-hosted: Docker container deployable
