---
name: cowork-marketplace:install
intent: Install a cowork marketplace item and configure its plugin bindings
tags:
  - cowork-marketplace
  - command
  - install
inputs: []
risk: low
cost: low
description: Install a marketplace item by name or ID, linking it to the underlying plugin agents, skills, and commands
---

# Install Marketplace Item

Install a cowork marketplace item to make it available for launching sessions. This links the item to its underlying plugin agents, skills, and commands.

## Usage
```
/cowork-marketplace:install <item-name> [--configure]
```

## Options
- `--configure` - Open interactive configuration after install
- `--dry-run` - Show what would be installed without making changes

## Examples

### Install by name
```
/cowork-marketplace:install fastapi-scaffold
```
Installs the FastAPI Project Scaffold template backed by the fastapi-backend plugin.

### Install with configuration
```
/cowork-marketplace:install enterprise-code-reviewer --configure
```
Installs and opens configuration to customize agent behavior, thresholds, and integrations.

### Dry run
```
/cowork-marketplace:install microsoft-platform-deploy --dry-run
```
Shows the 7 agents, 8 skills, and 9 commands that would be activated.

## How It Works

1. **Resolve item** - Finds the item in the catalog by name or ID
2. **Check dependencies** - Verifies required plugins are installed
3. **Register installation** - Records the installation with configuration
4. **Activate bindings** - Links the item to its plugin agents, skills, and commands
5. **Confirm** - Displays installed capabilities summary

## What Gets Installed

When you install a marketplace item, you get access to:
- **Agents** - Specialized sub-agents from the bound plugins
- **Skills** - Domain knowledge and workflows the agents use
- **Commands** - Slash commands for direct interaction
- **MCP Servers** - External tool connections (if configured)

No new files are created — installations reference existing plugin capabilities.

## Skills Used
- plugin-catalog
- plugin-packaging
