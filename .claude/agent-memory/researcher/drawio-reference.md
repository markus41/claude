---
name: draw.io / diagrams.net Comprehensive Reference
description: Complete research on draw.io covering API, MCP servers, XML format, embed/export, integrations, AI features, VS Code extension, shape libraries, configuration, and URL parameters
type: reference
---

# draw.io / diagrams.net — Complete Reference (researched 2026-03-14)

## Company & Platform Overview

- **URLs**: app.diagrams.net (editor), drawio.com (docs/blog), embed.diagrams.net (embed entry point)
- **License**: Apache 2.0 (source code); icon/stencil libraries prohibit use in Atlassian Marketplace without written permission
- **Company**: draw.io Ltd (renamed from JGraph Ltd, September 2025), also draw.io AG
- **Current version**: v29.6.1+ (888+ releases)
- **GitHub**: github.com/jgraph/drawio (4.1k stars, 716 forks, no external pull requests accepted)
- **Architecture**: Client-side JavaScript, based on mxGraph library (mxClient.js). SVG rendering, no third-party dependencies.
- **Browser support**: Chrome 123+, Firefox 120+, Safari 17.5+, Edge 123+
- **Note**: Does NOT support real-time collaborative editing in the base editor (only in Confluence Cloud integration). Not an SVG editor (SVG export targets web embedding only).

## MCP Servers (Model Context Protocol)

### Official: jgraph/drawio-mcp
- **Repo**: github.com/jgraph/drawio-mcp (1.2k stars, Apache-2.0)
- **npm**: `@drawio/mcp`
- **Quick start**: `npx @drawio/mcp`
- **Four integration approaches**:
  1. **MCP App Server**: Renders diagrams inline in chat (Claude.ai, VS Code); hosted at `https://mcp.draw.io/mcp`; no install; XML only
  2. **MCP Tool Server**: Opens diagrams in editor as new browser tab; `npx @drawio/mcp`; XML, CSV, Mermaid; lightbox + dark mode
  3. **Skill + CLI**: Generates native `.drawio` files; copy skill file + draw.io Desktop; `--embed-diagram` flag for PNG/SVG/PDF export
  4. **Project Instructions**: No install; Claude uses Python to generate draw.io URLs; XML, CSV, Mermaid
- **Key insight**: LLMs corrupt base64 strings when reproducing token-by-token; official approach embeds URL in HTML artifact executed by Python

### Community: lgazo/drawio-mcp-server
- **npm**: `drawio-mcp-server`
- **Quick start**: `npx -y drawio-mcp-server --editor`
- **Requires**: Node.js v20+
- **Tools provided**: Diagram inspection (read shapes/layers/cells), diagram modification (add/edit/delete shapes, edges, labels), layer management (create/switch/organize)
- **Two modes**: Built-in web editor at localhost:3000, or browser extension (Chrome Web Store / Firefox Add-ons)
- **Claude Code config**:
  ```bash
  claude mcp add-json drawio '{"type":"stdio","command":"npx","args":["-y","drawio-mcp-server","--editor"]}'
  ```
- **Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
  ```json
  {"mcpServers": {"drawio": {"command": "npx", "args": ["-y", "drawio-mcp-server", "--editor"]}}}
  ```

### Community: sujimoshi/drawio-mcp
- VSCode-focused; stateless tools operating on `.drawio.svg` files; each operation specifies target file
- Works with VSCode Draw.io extension natively

### Community: JoNilsson/drawio-mcp
- Another community implementation

## XML Format Specification

### File Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="..." version="14.6.13" type="device"
        vars='{"key":"value"}'>
  <diagram name="Page-1" id="unique-id">
    <mxGraphModel dx="946" dy="469" grid="1" gridSize="10" guides="1"
      tooltips="1" connect="1" arrows="1" fold="1" page="1"
      pageScale="1" pageWidth="1100" pageHeight="850"
      background="#ffffff" math="0" shadow="0">
      <root>
        <mxCell id="0" />                    <!-- root container, always present -->
        <mxCell id="1" parent="0" />         <!-- default layer, always present -->
        <!-- shapes and edges go here, parent="1" -->
      </root>
    </mxGraphModel>
  </diagram>
  <!-- additional <diagram> elements for multi-page -->
</mxfile>
```

### mxGraphModel Attributes
dx, dy (scroll offset), grid (0/1), gridSize, guides, tooltips, connect, arrows, fold, page, pageScale, pageWidth, pageHeight, background, math, shadow

### mxCell (Core Element)
- `id`: unique string
- `value`: display label/text (HTML supported with `html=1` style)
- `style`: semicolon-delimited key=value pairs
- `parent`: parent cell ID
- `vertex="1"`: shapes/nodes
- `edge="1"`: connectors
- `source`: source cell ID (edges)
- `target`: target cell ID (edges)

**Vertex example**:
```xml
<mxCell id="2" value="Hello" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
</mxCell>
```

**Edge example**:
```xml
<mxCell id="3" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;"
  edge="1" parent="1" source="2" target="4">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### mxGeometry Attributes
x, y (position), width, height, relative="1" (for edges), as="geometry"

### Style Properties (common)
rounded, whiteSpace=wrap, html=1, fillColor, strokeColor, shape (cylinder/rhombus/ellipse/etc.), edgeStyle, exitX/exitY/entryX/entryY (connection points), fontFamily, fontSize, fontColor, dashed, shadow, opacity

### Object (UserObject) — Metadata Wrapper
```xml
<object label="DB Server" Zone="3" customAttr="value" id="3" placeholders="1">
  <mxCell style="shape=cylinder;whiteSpace=wrap;html=1;" vertex="1" parent="1">
    <mxGeometry x="240" y="830" width="60" height="80" as="geometry"/>
  </mxCell>
</object>
```
Used when adding custom properties/metadata to shapes.

### Placeholder System
- Global vars in `<mxfile vars='{"key":"value"}'>` or URL param `vars=<uri-encoded-json>`
- Reference as `%variableName%` in labels when `placeholders="1"` on object

### Compression
- Default XML is compressed (deflate + Base64) inside `<diagram>` element
- Set `compressXml=false` in config for uncompressed
- For AI generation: always generate uncompressed XML

## Embed Mode (embed.diagrams.net)

Entry point: `https://embed.diagrams.net`

### Key URL Parameters for Embed
- `embed=1`: Enable embed mode
- `configure=1`: Wait for configure action before init
- `proto=json`: JSON postMessage protocol
- `spin=1`: Loading spinner
- `noSaveBtn=1`: Replace Save with "Save and Exit"
- `saveAndExit=1`: Add "Save and Exit" button
- `noExitBtn=1`: Hide Exit button
- `libraries=1`: Enable shape libraries panel
- `dark=0/1/auto`: Dark mode
- `ui=kennedy/min/atlas/dark/sketch/simple`: Theme

### Load Action Parameters
autosave, modified, saveAndExit, noSaveBtn, noExitBtn, title, libs, dark, theme, rough, toSketch, border, background, viewport, rect, minWidth, minHeight, maxFitScale

### PostMessage Events (editor → host)
- `init`: Editor ready, awaits load action
- `autosave`: Diagram changed
- `save`: User saved; includes `xml`; if "Save and Exit" includes `exit:true`
- `exit`: User exited; includes `modified:boolean`
- `openLink`: User clicked link; includes `href`, `target`
- `merge`: Response to merge action
- `prompt`: User response to prompt dialog
- `template`: User selected template
- `draft`: Draft recovery dialog result
- `export`: Exported diagram data
- `textContent`: Diagram text extraction

### PostMessage Actions (host → editor)
- `load`: Provide diagram XML
- `merge`: Merge XML into current diagram
- `dialog`: Show dialog message
- `prompt`: Request user text input
- `template`: Show template selector
- `layout`: Apply arrangement layouts
- `draft`: Show recovery dialog
- `status`: Display status bar message
- `spinner`: Show/hide loading indicator
- `export`: Request diagram export
- `textContent`: Retrieve diagram text
- `viewport`: Set canvas position/scale

## URL Parameters (Complete Reference)

### Settings
| Param | Description |
|-------|-------------|
| `lang` | UI language (en, de, fr, ja, zh, zh-tw, ko, ar, ru, etc.) |
| `libs` | Shape libraries to show (allied_telesis, android, archimate, archimate3, arrows2, atlassian, aws3, aws3d, aws4, azure, basic, bootstrap, bpmn, cabinets, cisco, cisco_safe, citrix, clipart, dfd, eip, electrical, er, floorplan, flowchart, gcp2, general, gmdl, ibm, images, infographic, ios, lean_mapping, mockups, mscae, network, office, pid, rack, signs, sitemap, sysml, uml, veeam, webicons) |
| `clibs` | Custom libraries (file IDs or U-prefixed URLs) |
| `ui` | Theme: kennedy, min, atlas, dark, sketch, simple |
| `sketch` | Sketch style (0/1) |
| `dark` | Dark mode (0/1/auto) |
| `page` | Start page index (0-based) |
| `page-id` | Start page by ID |
| `hide-pages` | Hide page controls in lightbox (1) |
| `splash` | Suppress splash screen (0) |
| `plugins` | Disable plugin loading (0) |
| `format` | Disable format panel (0) |
| `target` | Link open target (auto/self/frame/blank) |
| `highlight` | Link highlight color hex (no #) |
| `nav` | Enable folding in chromeless (1) |
| `layers` | Layer control in chromeless (1) |
| `layer-ids` | Space-separated layer IDs to show |
| `edit` | Edit button URL in chromeless (_blank or url) |
| `lightbox` | Chromeless lightbox mode (1) |
| `transparent` | Transparent background (1) |
| `close` | Close button in chromeless (1) |
| `toolbar` | Disable toolbar in chromeless (0) |
| `border` | Lightbox border width in pixels |
| `p` | Plugin IDs to load (id1;id2;...) |
| `vars` | URI-encoded JSON for global placeholders |
| `base` | Base URL for links |
| `ruler` | Enable ruler (1) |
| `grid` | Enable grid (1) |
| `chrome` | Chromeless read-only viewer (0) |
| `math-output` | Math typesetting output |

### Integration/Mode Params
| Param | Description |
|-------|-------------|
| `gapi` | Google integration (0=disable) |
| `db` | Dropbox (0=disable) |
| `od` | OneDrive (0=disable) |
| `gh` | GitHub (0=disable) |
| `gl` | GitLab (0=disable) |
| `tr` | Trello (0=disable) |
| `mode` | Storage mode (google/onedrive/github/dropbox/device/browser) |
| `stealth` | Disable external web services (1) |
| `lockdown` | Same as stealth (1) |
| `demo` | Demo mode (1) |
| `embed` | Embed mode (1) |
| `configure` | Configure event in embed mode (1) |
| `proto` | Protocol in client mode (json) |
| `client` | Client mode (1) |
| `desc` | CSV import descriptor (compressed-json) |
| `create` | Create from template (url/name/JSON object) |
| `title` | New file title |
| `offline` | PWA registration (1=register, 0=unregister) |
| `pwa` | Disable PWA ability (0) |
| `gitlab` | Custom GitLab path (URL-encoded) |
| `gitlab-id` | Custom GitLab app client ID |

### Lightbox/Viewer Embed
```html
<!-- Static viewer iframe -->
<iframe frameborder="0" style="width:100%;height:400px;"
  src="https://viewer.diagrams.net/?lightbox=1&highlight=0000ff&layers=1&title=Diagram.drawio#<github-url>">
</iframe>

<!-- Open from URL -->
https://app.diagrams.net/?lightbox=1&edit=_blank#U<diagram-url>

<!-- Use as template -->
https://app.diagrams.net/#U<diagram-url>

<!-- Edit from GitHub -->
https://app.diagrams.net/#H<repo-path>
```

## Import Formats

| Format | Details |
|--------|---------|
| `.drawio` / XML | Native format |
| Mermaid (v11.10.1) | Flowcharts, sequence, Gantt, ER, class, state, gitgraph, mindmap, pie, C4Context, requirementDiagram, journey |
| CSV | Custom config + data rows; Insert > Advanced > CSV |
| SVG (with embedded XML) | Extracts embedded diagram data |
| PNG (with embedded XML) | Extracts embedded diagram data |
| Gliffy | Mass migration; used in Confluence |
| Lucidchart | .lucid/.lucidchart files |
| VSDX/VSD | Visio 2013+; import only (export removed v26.1.0) |
| PlantUML | Deprecated/phased out end of 2025; migrate to Mermaid |

**Security**: DOMPurify 3.2.5 sanitizes all imports against XSS

## Export Formats

| Format | Details |
|--------|---------|
| PNG | Transparent bg, DPI scaling, page selection, embedded XML |
| SVG | Embeds fonts/images by default (since v23.0.0); dark mode colors |
| PDF | Internal page links (v24.3.0+), shadows, multi-page; requires server endpoint |
| JPEG | Raster |
| WebP | Added v21.7.3 |
| XML / .drawio | Native; compressed or uncompressed |
| HTML | iframe-compatible embed with dark mode |
| CSV | Node/edge metadata export |
| URL | Share diagrams via URL (data in hash fragment) |

**Note**: PDF, VSDX import, PlantUML, and Gliffy import require server endpoints. draw.io has endpoints in EU (Frankfurt) and US (Northern Virginia). Set preference with `dataGovernance` config.

## AI Features

### Generate Tool (Sparkle Button)
- Located in toolbar (sparkle icon ✨) or template manager in Confluence
- Uses multiple AI engines (picks best for diagram type)
- **Supported types**: Interface mock-ups, infrastructure diagrams, Mermaid diagrams, Gantt charts, ERDs, flowcharts, swimlanes, and more
- **Workflow**: Type prompt → preview → insert or refresh for variations
- **Tip**: Specify diagram type at start of prompt for best engine selection
- **Privacy**: Prompt sent to third-party AI services; data not stored on draw.io servers
- **Admin config (Confluence)**: `"enableAi": true/false` in app configuration
- **Zero Egress**: Available for orgs requiring no data leave Atlassian environment

### Smart Templates
- Available in template library
- Can generate org charts from text, ERDs from entity descriptions, etc.
- Can source actual data (e.g., "royal family tree starting at Queen Victoria")

### AI Configuration Options
```json
{
  "enableAi": true
  // Plus: custom LLM backends, generation actions, default prompts
}
```

## Configuration Options (JSON)

Access via: Extras > Configuration (Classic/Atlas), or Settings > Configuration (Simple/Minimal/Sketch)

### Key Config Properties
```json
{
  // Fonts
  "defaultFonts": ["Arial", {"fontFamily": "MyFont", "fontUrl": "https://..."}],
  "customFonts": [...],
  "fontCss": "@font-face { ... }",

  // Colors
  "presetColors": ["FF0000", "00FF00", ...],
  "customPresetColors": [...],
  "defaultColors": [...],
  "colorNames": {"FF0000": "Red"},
  "defaultColorSchemes": [...],
  "customColorSchemes": [...],

  // Default Styles
  "defaultVertexStyle": {"fontFamily": "Courier New", "fillColor": "#dae8fc"},
  "defaultEdgeStyle": {"edgeStyle": "orthogonalEdgeStyle", "rounded": "1"},
  "defaultTextStyle": {...},

  // Libraries
  "defaultLibraries": "general;uml;er;bpmn;flowchart;basic;arrows2",
  "enabledLibraries": ["general", "uml"],  // null = all
  "libraries": [{...}],
  "defaultCustomLibraries": [...],
  "enableCustomLibraries": true,
  "appendCustomLibraries": false,
  "expandLibraries": true,
  "templateFile": "https://...",

  // Appearance
  "css": "/* custom CSS */",
  "darkColor": "#2A2A2A",
  "defaultAdaptiveColors": "auto",  // auto, simple, none (v26.0.0+)

  // Sidebar
  "thumbWidth": 46, "thumbHeight": 46,
  "sidebarWidth": 200,
  "sidebarTitles": false,

  // Grid/Page
  "defaultGridSize": 10,
  "defaultGridEnabled": true,
  "defaultPageVisible": true,
  "pageFormat": {"width": 1169, "height": 827},
  "zoomFactor": 1.2,
  "zoomWheel": false,

  // Editor
  "simpleLabels": false,
  "pasteAtMousePointer": false,
  "fitDiagramOnLoad": false,
  "enableInlineToolbar": true,
  "enableWindowDocking": true,
  "enableNativeClipboard": true,
  "compressXml": false,
  "globalVars": {"key": "value"},

  // Security
  "lockdown": false,
  "maxImageBytes": 1000000,

  // Export
  "enableExportUrl": true,
  "restrictExport": false,

  // Collaboration
  "shareCursorPosition": true,
  "showRemoteCursors": true,

  // AI
  "enableAi": false,

  // Confluence-specific
  "ui": "atlas",  // kennedy, atlas (default), dark, min
  "inplaceEdits": true,
  "forceSimpleViewer": false,
  "defaultMacroParameters": {
    "border": true, "width": null, "lightbox": true, "simpleViewer": false
  }
}
```

Self-hosted Docker: pass config as `DRAWIO_CONFIG` environment variable

## Shape Libraries (Complete List by Category)

### Cloud - AWS
- aws3, aws3d, aws4 (AWS 2017, 3D, 2019+)

### Cloud - Azure
- azure (includes Power Platform, Dynamics365)

### Cloud - Google Cloud
- gcp2 (GCP Icon library, recently updated)

### Cloud - Other Cloud
- ibm, ibm_cloud
- Alibaba Cloud, OpenStack, Veeam, Citrix

### Networking
- network (Network 2025 with shadow effects, or Network 2018 for 3D)
- cisco, cisco_safe
- Kubernetes
- mscae (Microsoft Cloud and Enterprise)
- rack (rack/server diagrams)

### UML
- uml (UML 2.5 and classic UML)

### Business/Diagrams
- bpmn, flowchart, er, basic, general
- lean_mapping (value stream, business model canvas)
- infographic
- mockups (wireframes)
- arrows2

### Industry/Other
- electrical, pid, floorplan, cabinets
- signs, clipart, webicons
- android, ios, gmdl (Material Design)
- bootstrap, dfd, eip, sitemap, sysml

**Note**: `libs` URL param takes semicolon-separated library keys. `enabledLibraries` config takes array.

## Built-in Plugins

Load with `?p=id1;id2` URL param

| Key | File | Description |
|-----|------|-------------|
| `ex` | explore.js | Explore/navigate diagram connections |
| `sql` | sql.js | Import SQL schema → ERD |
| `props` | props.js | Show/edit shape properties panel |
| `anon` | anonymize.js | Anonymize diagram data |
| `text` | text.js | Extract text content |
| `anim` | animation.js | Animate connectors |
| `number` | number.js | Auto-number shapes |
| `trees` | trees/trees.js | Tree layout algorithms |
| `flow` | flow.js | Flow animation |
| `webcola` | webcola/webcola.js | WebCola layout |
| `replay` | replay.js | Replay diagram creation |
| `import` | import.js | Extended import |
| `update` | update.js | Auto-update from data source |
| `svgdata` | svgdata.js | SVG data handling |
| `tips` | tooltips.js | Tooltip enhancements |
| `voice` | voice.js | Voice input |
| `doors` | doors.js | Doors shape library |
| `multilanglabels` | MultilanguageLabels.js | Multi-language labels |
| `procinterlink` | ProcessInterlink.js | Process interlink |
| `f5` | rackF5.js | F5 rack shapes |
| `flow` | flow.js | Connector flow animation |

## VS Code Extension (hediet.vscode-drawio)

- **Publisher**: Henning Dieterichs (hediet) — unofficial
- **Latest**: v1.9.250226013 (Feb 2025), 47.42 MB
- **Marketplace**: marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio

### Supported File Formats
- `.drawio` — native format (opens in Draw.io editor)
- `.dio` — alias for .drawio
- `.drawio.svg` — valid SVG with embedded diagram data; embeddable in GitHub README with no export
- `.drawio.png` — valid PNG with embedded diagram data

### Key Features
1. **Dual-view editing**: Same `.drawio` file open as both visual editor and XML text simultaneously; synchronized in real-time. Use "View: Reopen Editor With..."
2. **Code Link**: Name node `#MySymbol` → double-click to jump to symbol definition in code. Works with any language implementing VS Code workspace symbol search. Toggle with status bar button.
3. **Live Share collaboration**: Edit/present diagrams with multiple participants; shared cursors visible
4. **Theme**: `"automatic"` matches VS Code theme
5. **Offline mode**: Uses bundled offline draw.io (default); can switch to online
6. **Format conversion**: "Draw.io: Convert To..." command
7. **Custom plugins**: Load via settings with `${workspaceFolder}` variable support
8. **Custom shape libraries**: Extend available shapes
9. **Default styles**: Set default vertex and edge styles for new elements

### Configuration Options
- General Settings: offline mode, zoom factor, code linking
- Plugin Settings: custom plugins and libraries
- Theme and Style Settings: colors, default styles

## Integrations

### Atlassian (Primary)
- **Confluence Cloud**: Forge-only (migrating from Connect/Forge hybrid, deadline Jan 2026); real-time collaborative editing; zero-egress option; diagram stored as page attachment; Atlassian Cloud Fortified certified
- **Confluence Data Center**: Full feature set; mass Gliffy import; revision control; collaborative editing
- **Jira Cloud**: Embed diagrams in issues; embed from Confluence; dark theme auto-alignment
- **Jira Data Center**: v10.0+ support; Gliffy conversion
- **Server endpoints**: EU (Frankfurt) + US (N. Virginia) for PDF/VSDX/PlantUML/Gliffy

### Microsoft
- **Office 365** (Word, Excel, PowerPoint): Free add-in on Microsoft AppSource; works in Office 2013+ Windows, 2016+ Mac, and web versions
- **OneDrive/SharePoint**: Native storage integration
- **Teams**: Integration available

### Google
- **Google Drive**: Native storage; Google Workspace add-on; Google Classroom support
- **Google Docs/Slides**: Export as PNG, drag into documents
- **Google Picker**: File picker integration

### Version Control
- **GitHub**: App-based auth (fine-grained); store diagrams in repos; edit in github.dev; embed in README via .drawio.svg; `#H<repo-path>` URL scheme
- **GitLab**: Native integration in GitLab Wiki (v15.10+); SVG with embedded code; OAuth support

### Documentation
- **Notion**: Chrome extension; embed .drawio.svg in pages; auto-resize
- **BookStack, MediaWiki, XWiki, Wiki.js, Nuclino**: Third-party integrations
- **Confluence**: See Atlassian above

### Dev Tools
- **VS Code**: hediet extension (see above)
- **JupyterLab**: ipydrawio integration
- **ONLYOFFICE**: Plugin available

### Infrastructure/Other
- **Cloudcraft**: Exports AWS architecture to .drawio format with real-time stats
- **Cloudockit**: Auto-generates from AWS/Azure/GCP/VMware
- **Nextcloud**: Real-time collaborative editing
- **Plane.so**: Board and full editor integration
- **WordPress**: Embed SVG versions
- **Lark**: Open-source editor integration
- **Grafana, Growi, FosWiki, Tiki Wiki, Redmine**: Third-party integrations
- **LumApps**: Integration available

### Azure DevOps
- No native official integration (community-requested feature)
- Workaround: "Draw.io View" extension on VS Marketplace
- Workaround: CI/CD pipeline automation to export .drawio → images
- Workaround: Third-party sync (Unito)

## Self-Hosted Docker Deployment

**Docker Hub**: hub.docker.com/r/jgraph/drawio
**Base**: Tomcat 9 + JRE 11

### Quick Start
```bash
docker run -it --rm --name="draw" -p 8080:8080 -p 8443:8443 jgraph/drawio
# Access: http://localhost:8080/?offline=1&https=0
```

### Key Environment Variables
| Variable | Description |
|----------|-------------|
| `DRAWIO_SERVER_URL` | Base URL (e.g., `https://drawio.example.com/`) |
| `DRAWIO_BASE_URL` | Viewer/lightbox/embed URL (no trailing slash) |
| `DRAWIO_CONFIG` | Configuration JSON |
| `DRAWIO_CSP_HEADER` | Custom Content-Security-Policy |
| `DRAWIO_VIEWER_URL` | Hosted viewer.min.js URL |
| `DRAWIO_USE_HTTP` | Insecure HTTP-only mode (1) |
| `LETS_ENCRYPT_ENABLED` | Let's Encrypt cert (true/false) |
| `PUBLIC_DNS` | Domain for cert |
| `DRAWIO_GOOGLE_CLIENT_ID` | Google Drive OAuth |
| `DRAWIO_GOOGLE_CLIENT_SECRET` | Google Drive OAuth |
| `DRAWIO_GOOGLE_APP_ID` | Google App ID |

### Self-Contained (Full Features Without diagrams.net dependency)
Uses docker-compose with main app container + export service container. Supports:
- Offline operation
- Image/PDF export
- Google Drive, OneDrive, GitLab integration
- Custom fonts

## CSV Import Format

Access via: Arrange > Insert > Advanced > CSV (or via URL `?desc=<compressed-json>`)

Format:
```
# Configuration lines start with #
# connect: {"from": "source_col", "to": "target_col"}
# label: %column_name%
# style: shape_style_here
# nodestyle: column=value:style
# edgestyle: value:style

# Data columns
id,name,parent,type
1,Root,,root
2,Child,1,leaf
```

- Config directives: `connect`, `label`, `style`, `nodestyle`, `edgestyle`, `layout`, `width`, `height`, `left`, `top`, `ignore`, `link`, `identity`, `fill`, `stroke`, `gradient`, `shape`, `padding`
- Dialog became resizable in v28.1.2

## Diagram Types Supported

**Software/Architecture**
- UML (class, sequence, activity, component, state, use case, deployment, package, profile, composite structure)
- C4 models (context, container, component, code)
- Entity-Relationship Diagrams (ERD)
- Dependency graphs
- Gitflow diagrams
- Kanban boards
- Mockups/wireframes
- AWS/Azure/GCP/IBM architecture
- Network diagrams, rack diagrams
- Kubernetes architecture
- Attack trees, threat modeling

**Business/Process**
- Flowcharts, BPMN
- Swimlane/cross-functional flowcharts
- Event-driven process chains (EPC)
- Value stream maps, lean mapping
- Process flow diagrams
- Data Flow Diagrams (DFD)
- Business model canvases

**Planning**
- Gantt charts
- PERT charts
- Timelines/roadmaps
- Project plans

**Information**
- Org charts, tree diagrams
- Mind maps
- Concept maps
- Venn diagrams
- Infographics

**Physical/Technical**
- Circuit and logic diagrams
- Floorplans, seating plans
- Sankey diagrams (4 methods)
- Ishikawa/fishbone diagrams

## Recent Updates (2025-2026)

- **Generate Tool** (Sparkle): Upgraded AI feature with multiple AI engines (Dec 2025)
- **Network 2025 Shape Library**: Bold long-shadow styling, per-part color control
- **Multi-color Shapes**: Per-part color customization for complex shapes
- **Mermaid ELK Layout**: Better large flowchart rendering
- **Connector animations**: Animated flow indicators
- **Dark mode enhancements**: Auto-alignment with host platform themes
- **Company renamed**: draw.io Ltd (Sept 2025)
- **Confluence Forge migration**: Deadline Jan 2026
- **PlantUML deprecation**: End of 2025; migrate to Mermaid
- **VSDX export removed**: v26.1.0 (import still available)
- **WebP export**: Added v21.7.3
- **PDF with internal links**: v24.3.0+
- **SVG embeds fonts**: By default since v23.0.0
- **Adaptive colors**: v26.0.0+ (`defaultAdaptiveColors`)
- **Mermaid version**: v11.10.1

## mxGraph JavaScript Library

- **Status**: Development stopped Nov 9, 2020; stable/feature-complete
- **Repo**: github.com/jgraph/mxgraph (archived)
- **Usage**: draw.io uses it internally as `mxClient.js`
- **API Docs**: jgraph.github.io/mxgraph/docs/manual.html
- **Key classes**: mxClient, mxEditor, mxGraph, mxGeometry, mxCell, mxObjectCodec
- **Coordinate system**: x positive right, y positive downward
- **Active forks**: process-analytics/mxgraph (community maintained)
- **For new projects**: Consider yFiles or GoJS instead

## Key Resources

- Documentation: drawio.com/doc/
- FAQ: drawio.com/doc/faq/
- Blog: drawio.com/blog
- Example diagrams: drawio.com/example-diagrams
- Integrations: drawio.com/integrations
- GitHub (app): github.com/jgraph/drawio
- GitHub (MCP official): github.com/jgraph/drawio-mcp
- GitHub (MCP community): github.com/lgazo/drawio-mcp-server
- Docker: hub.docker.com/r/jgraph/drawio
- Docker GitHub: github.com/jgraph/docker-drawio
- VS Code extension: marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio
- VS Code extension GitHub: github.com/hediet/vscode-drawio
- mxGraph API: jgraph.github.io/mxgraph/docs/manual.html
- Shape libraries index: jgraph.github.io/drawio-libs/
- URL parameters: drawio.com/doc/faq/supported-url-parameters
- Embed mode: drawio.com/doc/faq/embed-mode
- Configure editor: drawio.com/doc/faq/configure-diagram-editor
- AI generation: drawio.com/doc/faq/ai-drawio-generation
