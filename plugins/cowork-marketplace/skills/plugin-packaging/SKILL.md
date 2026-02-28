---
name: plugin-packaging
description: Knowledge for exporting marketplace items as Cowork-compatible plugin ZIPs for distribution via Claude Desktop private marketplaces
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
triggers:
  - export plugin
  - package for cowork
  - create plugin zip
  - distribute plugin
  - upload to marketplace
  - private marketplace
---

# Plugin Packaging Knowledge

Domain knowledge for packaging marketplace items as Cowork-compatible plugins for distribution.

## Use For
- Exporting marketplace items as standalone plugin ZIPs
- Preparing plugins for Claude Desktop private marketplace upload
- Understanding Cowork plugin format requirements
- Validating plugin packages before distribution

## Cowork Plugin Format

Claude Desktop Cowork uses the same plugin format as Claude Code:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: manifest
├── .mcp.json                # Optional: MCP server connections
├── commands/
│   ├── command-name.md      # Slash commands
│   └── index.json           # Command index
├── skills/
│   └── skill-name/
│       └── SKILL.md         # Domain knowledge
├── agents/
│   └── agent-name.md        # Sub-agent definitions
├── CLAUDE.md                # Plugin-level instructions
└── README.md                # User documentation
```

## Manifest Format (plugin.json)

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "One-line description",
  "author": {
    "name": "Author Name",
    "email": "email@example.com"
  },
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"]
}
```

Rules:
- Name must be lowercase kebab-case
- Version follows semver
- Description should be under 100 characters

## Export Process

When exporting a marketplace item:

1. **Collect source files** from bound plugins:
   ```
   For each pluginBinding:
     agents/ → copy referenced agent .md files
     skills/ → copy referenced skill directories
     commands/ → copy referenced command .md files
   ```

2. **Generate manifest** with item metadata:
   - Name: item name (kebab-case)
   - Version: item version
   - Description: item description
   - Keywords: item tags + plugin names

3. **Generate CLAUDE.md** with:
   - Item overview and purpose
   - Available commands list
   - Agent descriptions
   - Configuration options

4. **Create ZIP** under 50 MB (Cowork limit)

5. **Validate** the package:
   - plugin.json exists and is valid JSON
   - All referenced files exist
   - No secrets or .env files included
   - ZIP is under 50 MB

## Distribution Channels

### Claude Desktop Private Marketplace
1. Go to Organization Settings > Plugins
2. Click "Add plugins" > "Upload to a new marketplace"
3. Upload the ZIP file
4. Assign to users/teams

### GitHub Repository
1. Push plugin to a GitHub repo
2. Add marketplace: `claude plugin marketplace add org/repo`
3. Install: `claude plugin install name@marketplace`

### Direct Share
Share the ZIP file directly. Recipients install via:
1. Claude Desktop: drag into Plugins settings
2. CLI: `claude plugin install ./path/to/plugin.zip`

## Validation Checklist

Before distributing:
- [ ] plugin.json has valid name, version, description
- [ ] All command .md files have proper YAML frontmatter
- [ ] All skill SKILL.md files have triggers defined
- [ ] All agent .md files specify model and allowed-tools
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] ZIP is under 50 MB
- [ ] README.md exists with usage instructions
