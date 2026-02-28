---
name: cowork-marketplace:export
intent: Export a marketplace item as a standalone Cowork plugin ZIP for distribution
tags:
  - cowork-marketplace
  - command
  - export
inputs: []
risk: low
cost: medium
description: Package a marketplace item with its bound plugin agents, skills, and commands into a ZIP file suitable for uploading to Claude Desktop Cowork private marketplaces
---

# Export for Cowork

Package a marketplace item as a standalone Cowork-compatible plugin ZIP file. The exported plugin can be uploaded to Claude Desktop's private marketplace via Organization Settings > Plugins.

## Usage
```
/cowork-marketplace:export <item-name> [--output PATH] [--include-agents] [--include-skills] [--include-commands]
```

## Options
- `--output` - Output directory for the ZIP file (default: current directory)
- `--include-agents` - Include bound agent markdown files in the export (default: true)
- `--include-skills` - Include bound skill files in the export (default: true)
- `--include-commands` - Include bound command files in the export (default: true)
- `--standalone` - Bundle everything needed for a fully self-contained plugin

## Examples

### Export a workflow
```
/cowork-marketplace:export jira-to-pr --output ./exports/
```
Creates `jira-to-pr.zip` containing:
```
jira-to-pr/
├── .claude-plugin/plugin.json
├── commands/
│   ├── start-workflow.md
│   └── check-status.md
├── skills/
│   └── jira-integration/SKILL.md
└── agents/
    ├── commit-tracker.md
    └── test-strategist.md
```

### Export for Desktop upload
```
/cowork-marketplace:export enterprise-code-reviewer --standalone
```
Creates a fully self-contained ZIP ready for upload to Claude Desktop > Organization Settings > Plugins.

## How It Works

1. **Resolve item** - Finds the marketplace item and its plugin bindings
2. **Collect assets** - Gathers bound agents, skills, and commands from source plugins
3. **Generate manifest** - Creates a new plugin.json tailored to the item
4. **Package** - Creates a ZIP file under 50 MB (Cowork limit)
5. **Validate** - Checks the ZIP against Cowork plugin format requirements

## Cowork Upload Instructions

After exporting:
1. Open Claude Desktop
2. Go to **Organization Settings > Plugins**
3. Click **Add plugins** > **Upload to a new marketplace**
4. Drag the exported ZIP file
5. Click **Upload**

The plugin will appear in your organization's private marketplace.

## Agent Assignment
This command activates the **export-packager** agent.

## Skills Used
- plugin-packaging
- plugin-catalog
