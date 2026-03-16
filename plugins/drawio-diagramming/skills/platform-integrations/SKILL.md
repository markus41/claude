---
description: "Multi-platform diagram embedding guide for GitHub, Confluence, Jira, Azure DevOps, Notion, Teams, and Harness"
triggers:
  - embed diagram
  - github diagram
  - confluence diagram
  - jira diagram
  - azure devops diagram
  - notion diagram
  - teams diagram
  - harness diagram
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
  - "**/*.drawio.png"
---

# Platform Integrations for draw.io Diagrams

## Format Selection

| Format | Editable | Displayable | Best For |
|--------|----------|-------------|----------|
| `.drawio` | Yes (native) | No (needs app) | Source of truth |
| `.drawio.svg` | Yes (embedded XML) | Yes (renders as SVG) | GitHub, web, markdown |
| `.drawio.png` | Yes (embedded XML) | Yes (renders as PNG) | Confluence, Jira, email |
| `.svg` (exported) | No | Yes | Static documentation |
| `.png` (exported) | No | Yes | Universal fallback |
| `.pdf` (exported) | No | Yes | Print, formal docs |

**Recommended default:** Use `.drawio.svg` files. They render as images everywhere SVG is supported while retaining the editable XML inside the SVG metadata. Re-open in draw.io to edit.

---

## GitHub

### Repository Storage

Store diagrams alongside code in `docs/` or `diagrams/` directories:

```
project/
  docs/
    architecture.drawio.svg
    data-flow.drawio.svg
    er-diagram.drawio.svg
  src/
  README.md
```

### Markdown Embedding

Reference `.drawio.svg` files in any markdown file (README, wiki, PR descriptions):

```markdown
## Architecture

![System Architecture](./docs/architecture.drawio.svg)

## Data Flow

![Data Flow](./docs/data-flow.drawio.svg)
```

GitHub renders SVG files inline. Clicking the image shows the full SVG.

### Pull Request Diagrams

Include diagrams in PR descriptions to document changes:

```markdown
## Changes

This PR refactors the authentication flow:

![Auth Flow Before](./docs/auth-flow-before.drawio.svg)
![Auth Flow After](./docs/auth-flow-after.drawio.svg)
```

For PR comments, upload PNG exports directly or link to SVG files in the branch.

### GitHub Wiki

GitHub wikis support the same image syntax:

```markdown
![Diagram](uploads/architecture.drawio.svg)
```

Or reference from the repo:

```markdown
![Diagram](https://raw.githubusercontent.com/org/repo/main/docs/architecture.drawio.svg)
```

### GitHub Actions: Auto-Export on Push

Create `.github/workflows/drawio-export.yml` to automatically convert `.drawio` files to SVG on push:

```yaml
name: Export draw.io Diagrams

on:
  push:
    paths:
      - '**/*.drawio'

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install draw.io Desktop (CLI)
        run: |
          wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
          sudo apt-get install -y ./drawio-amd64-24.7.17.deb
          sudo apt-get install -y xvfb

      - name: Export changed .drawio to .drawio.svg
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- '*.drawio')
          for file in $CHANGED; do
            output="${file}.svg"
            xvfb-run -a drawio --export --format svg --embed-diagram \
              --output "$output" "$file"
            echo "Exported: $output"
          done

      - name: Commit exported SVGs
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add '*.drawio.svg'
          git diff --cached --quiet || git commit -m "chore: auto-export draw.io diagrams"
          git push
```

### GitHub Actions: Using drawio-export Action

Alternatively use the community action:

```yaml
- name: Export draw.io
  uses: rlespinasse/drawio-export-action@v2
  with:
    format: svg
    transparent: true
    embed-diagram: true
    output: docs/
```

### VS Code Integration

Install the **hediet.vscode-drawio** extension:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "hediet.vscode-drawio"
  ]
}
```

This allows editing `.drawio`, `.drawio.svg`, and `.drawio.png` files directly in VS Code with a graphical editor. Files are saved in the draw.io format and render correctly on GitHub.

### GitHub Pages

For interactive diagrams on GitHub Pages, embed the draw.io viewer:

```html
<!-- docs/index.html -->
<div class="mxgraph" data-mxgraph='{"url":"architecture.drawio.svg","highlight":"#0000ff","nav":true,"resize":true}'>
</div>
<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script>
```

Or use an iframe:

```html
<iframe
  src="https://viewer.diagrams.net/?url=https://raw.githubusercontent.com/org/repo/main/docs/architecture.drawio.svg&nav=1"
  width="100%" height="600" frameborder="0">
</iframe>
```

---

## Confluence

### draw.io for Confluence (Marketplace App)

The official draw.io app (by draw.io AG) is the most popular Confluence marketplace app. It adds native diagram capabilities.

#### Insert Diagram

1. Edit a Confluence page
2. Click the `+` button or type `/drawio`
3. Select **draw.io Diagram**
4. Create or edit diagram in the embedded editor
5. Click **Save & Exit** to embed in the page

#### Embed Existing Diagram

Reference a diagram from another Confluence page:

1. Insert macro: **draw.io Diagram** > **Existing Diagram**
2. Select the page containing the source diagram
3. The diagram stays linked and updates when the source changes

#### Board Macro

For whiteboard-style collaborative diagrams:

1. Insert macro: **draw.io Board**
2. Provides an infinite canvas whiteboard
3. Supports real-time collaboration

#### REST API Management

Manage diagrams programmatically via Confluence REST API:

```bash
# Get page content (includes draw.io macro XML)
curl -u user:token \
  "https://your-confluence.atlassian.net/wiki/rest/api/content/PAGE_ID?expand=body.storage" \
  | jq -r '.body.storage.value'

# Update page with new diagram
curl -X PUT -u user:token \
  -H "Content-Type: application/json" \
  "https://your-confluence.atlassian.net/wiki/rest/api/content/PAGE_ID" \
  -d '{
    "version": {"number": NEW_VERSION},
    "title": "Page Title",
    "type": "page",
    "body": {
      "storage": {
        "value": "<ac:structured-macro ac:name=\"drawio\">...</ac:structured-macro>",
        "representation": "storage"
      }
    }
  }'
```

#### Mass Import from Gliffy

draw.io for Confluence includes a Gliffy mass importer:

1. Confluence Admin > draw.io Configuration
2. Select **Gliffy Mass Import**
3. Choose spaces to import
4. Review and confirm migration

#### Confluence Cloud vs Data Center

| Feature | Cloud | Data Center |
|---------|-------|-------------|
| Real-time collaboration | Yes | Yes |
| Custom libraries | Yes | Yes |
| Gliffy import | Yes | Yes |
| Custom colors/fonts | Yes | Yes |
| Lockdown (restrict editing) | Yes | Yes |
| Custom templates | Yes | Yes |
| Revision history | Via page versions | Via page versions |

---

## Jira

### draw.io for Jira (Marketplace App)

#### Attach Diagrams to Issues

1. Open a Jira issue
2. Click the draw.io panel or **Add draw.io diagram** button
3. Create/edit diagram
4. Diagram is stored as an attachment on the issue

#### Embed Confluence Diagrams

If using draw.io for Confluence, reference those diagrams in Jira:

1. In Jira issue description, use the Confluence macro:
   ```
   !confluence-page-url|draw.io diagram!
   ```
2. Or link to the Confluence page containing the diagram

#### Custom Fields for Diagram References

Configure a custom field to store diagram page references:

1. Jira Admin > Custom Fields > Add Custom Field
2. Type: URL
3. Name: "Architecture Diagram"
4. Add to relevant screens

#### Workflow Integration

Link diagrams to workflow statuses:

- Create a diagram per epic showing the feature architecture
- Reference diagrams in story acceptance criteria
- Attach updated diagrams when closing stories

```markdown
## Acceptance Criteria
- [ ] Implementation matches [architecture diagram](confluence-link)
- [ ] Updated sequence diagram reflects API changes
```

---

## Azure DevOps

### Wiki Embedding

Azure DevOps wikis support markdown image syntax. Export diagrams as SVG or PNG and embed:

```markdown
## System Architecture

![Architecture](/.attachments/architecture.drawio.svg)
```

Or reference from the repository:

```markdown
![Architecture](/docs/architecture.drawio.svg)
```

### Pipeline Automation

Create an Azure Pipeline to auto-export `.drawio` files on commit:

```yaml
# azure-pipelines.yml
trigger:
  paths:
    include:
      - '**/*.drawio'

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: Bash@3
    displayName: 'Install draw.io CLI'
    inputs:
      targetType: 'inline'
      script: |
        wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
        sudo apt-get install -y ./drawio-amd64-24.7.17.deb
        sudo apt-get install -y xvfb

  - task: Bash@3
    displayName: 'Export draw.io to SVG'
    inputs:
      targetType: 'inline'
      script: |
        find . -name "*.drawio" -not -path "*/node_modules/*" | while read file; do
          output="${file}.svg"
          xvfb-run -a drawio --export --format svg \
            --embed-diagram --output "$output" "$file"
          echo "Exported: $output"
        done

  - task: Bash@3
    displayName: 'Commit exported files'
    inputs:
      targetType: 'inline'
      script: |
        git config user.name "Azure Pipeline"
        git config user.email "pipeline@dev.azure.com"
        git add '*.drawio.svg'
        git diff --cached --quiet || git commit -m "chore: auto-export draw.io diagrams"
        git push origin HEAD:$(Build.SourceBranchName)

  - task: PublishPipelineArtifact@1
    displayName: 'Publish diagram artifacts'
    inputs:
      targetPath: '$(Build.SourcesDirectory)'
      artifact: 'diagrams'
      publishLocation: 'pipeline'
```

### Work Items

Attach diagram images to work items:

1. Export diagram as PNG: `drawio --export --format png --output diagram.png file.drawio`
2. Attach to work item via UI or REST API:

```bash
curl -X POST \
  -H "Content-Type: application/octet-stream" \
  -H "Authorization: Basic $(echo -n :$PAT | base64)" \
  --data-binary @diagram.png \
  "https://dev.azure.com/org/project/_apis/wit/attachments?fileName=architecture.png&api-version=7.1"
```

### Mermaid Alternative

Azure DevOps wikis natively support Mermaid for simple diagrams:

```markdown
::: mermaid
graph TD
    A[Client] --> B[API Gateway]
    B --> C[Service A]
    B --> D[Service B]
:::
```

Use Mermaid for quick, simple diagrams. Use draw.io for complex architecture diagrams requiring precise layout and cloud icons.

---

## Notion

### draw.io for Notion (Chrome Extension)

Install the **draw.io for Notion** Chrome extension to edit diagrams inline in Notion pages.

### Embed via URL

1. Create diagram in app.diagrams.net
2. File > Embed > Notion
3. Copy the generated URL
4. In Notion: `/embed` > paste URL

### SVG as Page Content

1. Export diagram as `.drawio.svg`
2. Upload to Notion as an image block
3. The SVG renders inline

### Direct Link Embedding

```
https://viewer.diagrams.net/?url=ENCODED_URL_TO_DRAWIO_FILE
```

Paste this URL into a Notion `/embed` block for an interactive viewer.

### Notion API Integration

Upload diagram images programmatically:

```python
import requests

# Upload diagram image to Notion page
notion_api = "https://api.notion.com/v1"
headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# Add image block to page
payload = {
    "children": [
        {
            "object": "block",
            "type": "image",
            "image": {
                "type": "external",
                "external": {
                    "url": "https://raw.githubusercontent.com/org/repo/main/docs/arch.drawio.svg"
                }
            }
        }
    ]
}

response = requests.patch(
    f"{notion_api}/blocks/{PAGE_ID}/children",
    headers=headers,
    json=payload
)
```

---

## Microsoft Teams

### OneDrive / SharePoint Storage

1. Store `.drawio` files in OneDrive or SharePoint
2. Share the file link in a Teams channel
3. Team members can open in draw.io desktop or app.diagrams.net

### Channel Tab

Pin a diagram as a Teams tab:

1. In a Teams channel, click `+` (Add a Tab)
2. Select **Website**
3. Use the draw.io viewer URL:
   ```
   https://viewer.diagrams.net/?url=SHAREPOINT_URL_TO_DRAWIO_FILE&nav=1
   ```
4. Name the tab (e.g., "Architecture Diagram")

### Adaptive Cards

Include diagram thumbnails in Adaptive Cards for bot messages:

```json
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "Architecture Update",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "Image",
      "url": "https://raw.githubusercontent.com/org/repo/main/docs/architecture.png",
      "altText": "Architecture Diagram",
      "size": "Large"
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "Edit in draw.io",
      "url": "https://app.diagrams.net/#Horg/repo/main/docs/architecture.drawio"
    }
  ]
}
```

### Power Automate Integration

Create a Power Automate flow to notify Teams when diagrams are updated:

1. Trigger: When a file is modified in SharePoint (`.drawio` files)
2. Action: Export to PNG (via draw.io API or CLI)
3. Action: Post adaptive card to Teams channel with updated thumbnail

---

## Harness

### Pipeline Documentation

Embed diagram images in Harness pipeline step descriptions:

```yaml
# harness-pipeline.yaml
pipeline:
  name: Deploy Production
  description: |
    Deployment follows this architecture:
    ![Architecture](https://raw.githubusercontent.com/org/repo/main/docs/deploy-arch.drawio.svg)
  stages:
    - stage:
        name: Build
        spec:
          execution:
            steps:
              - step:
                  name: Export Diagrams
                  type: Run
                  spec:
                    shell: Bash
                    command: |
                      # Export draw.io diagrams for documentation
                      for f in docs/*.drawio; do
                        drawio --export --format svg --embed-diagram \
                          --output "${f}.svg" "$f"
                      done
```

### Wiki Pages

Harness documentation pages support markdown with embedded images:

```markdown
# Deployment Architecture

![Production Topology](./diagrams/prod-topology.drawio.svg)

## Network Flow

![Network Flow](./diagrams/network-flow.drawio.svg)
```

### Pipeline-as-Code Diagram Generation

Generate deployment diagrams from pipeline definitions:

```python
#!/usr/bin/env python3
"""Generate a draw.io deployment diagram from a Harness pipeline YAML."""

import yaml
import xml.etree.ElementTree as ET

def pipeline_to_drawio(pipeline_yaml: str) -> str:
    pipeline = yaml.safe_load(pipeline_yaml)
    stages = pipeline.get('pipeline', {}).get('stages', [])

    root = ET.Element('mxGraphModel')
    root_elem = ET.SubElement(root, 'root')
    ET.SubElement(root_elem, 'mxCell', id='0')
    ET.SubElement(root_elem, 'mxCell', id='1', parent='0')

    x, y = 100, 50
    prev_id = None

    for i, stage_wrapper in enumerate(stages):
        stage = stage_wrapper.get('stage', {})
        cell_id = f'stage_{i}'

        cell = ET.SubElement(root_elem, 'mxCell',
            id=cell_id,
            value=stage.get('name', f'Stage {i}'),
            style='rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
            vertex='1', parent='1')
        geo = ET.SubElement(cell, 'mxGeometry',
            x=str(x), y=str(y), width='160', height='60')
        geo.set('as', 'geometry')

        if prev_id:
            edge = ET.SubElement(root_elem, 'mxCell',
                id=f'e_{i}',
                style='edgeStyle=orthogonalEdgeStyle;',
                edge='1', source=prev_id, target=cell_id, parent='1')
            edge_geo = ET.SubElement(edge, 'mxGeometry', relative='1')
            edge_geo.set('as', 'geometry')

        prev_id = cell_id
        y += 100

    return ET.tostring(root, encoding='unicode', xml_declaration=False)
```

### Execution Step Annotations

Add diagram references to execution logs via shell steps:

```bash
echo "##[group]Architecture Reference"
echo "See deployment diagram: https://viewer.diagrams.net/?url=..."
echo "##[endgroup]"
```

---

## draw.io CLI Export Reference

All platform integrations benefit from CLI export. Key commands:

```bash
# Export to SVG with embedded diagram (editable SVG)
drawio --export --format svg --embed-diagram --output out.drawio.svg input.drawio

# Export to PNG with embedded diagram (editable PNG)
drawio --export --format png --embed-diagram --output out.drawio.png input.drawio

# Export to PDF
drawio --export --format pdf --output out.pdf input.drawio

# Export specific page
drawio --export --format svg --page-index 0 --output page1.svg input.drawio

# Export all pages
drawio --export --format svg --all-pages --output output-dir/ input.drawio

# Export with specific dimensions
drawio --export --format png --width 1920 --output out.png input.drawio

# Export with transparent background
drawio --export --format png --transparent --output out.png input.drawio

# Export with border padding
drawio --export --format svg --border 10 --output out.svg input.drawio

# Crop to content (remove whitespace)
drawio --export --format svg --crop --output out.svg input.drawio
```

For headless environments (CI/CD), wrap with `xvfb-run`:

```bash
xvfb-run -a drawio --export --format svg --embed-diagram --output out.svg input.drawio
```

---

## Cross-Platform Workflow

Recommended workflow for teams using multiple platforms:

1. **Source of truth**: `.drawio` files in Git repository
2. **CI/CD**: Auto-export to `.drawio.svg` on push (GitHub Actions / Azure Pipelines)
3. **GitHub**: Reference `.drawio.svg` in README and PR descriptions
4. **Confluence**: Embed via draw.io macro or link to Git-hosted SVGs
5. **Jira**: Link to Confluence pages containing diagrams
6. **Teams**: Share Git URLs or pin viewer tabs
7. **Notion**: Embed viewer URLs or upload exported SVGs

This ensures a single source of truth with automatic distribution to all platforms.
