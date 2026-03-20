---
name: cowork-marketplace:update
intent: Update an installed marketplace item by re-syncing its plugin bindings and registry entry
tags:
  - cowork-marketplace
  - command
  - update
inputs: []
risk: low
cost: low
description: Update a marketplace item's underlying plugin to its latest version, re-sync catalog bindings, and refresh the plugin registry
---

# Update Marketplace Item

Update an installed marketplace item by refreshing its plugin bindings, re-syncing the catalog version, and updating the plugin registry entry.

## Usage
```
/cowork-marketplace:update <item-name|item-id> [--dry-run] [--force] [--all]
```

## Options
- `--dry-run` - Show what would change without applying updates
- `--force` - Force update even if versions match
- `--all` - Update all installed marketplace items

## Examples

### Update a specific item
```
/cowork-marketplace:update claude-code-mastery
```

### Preview changes
```
/cowork-marketplace:update claude-code-mastery --dry-run
```

### Update all marketplace items
```
/cowork-marketplace:update --all
```

## How It Works

1. **Resolve item** - Find the item in `catalog.json` by name or ID
2. **Read current state** - Check `plugins.index.json` for each bound plugin's registered version
3. **Compare versions** - Compare registry version against plugin manifest (`plugin.json`) version
4. **Detect drift** - Identify plugins that exist on disk but are missing from the registry
5. **Sync registry** - Add missing plugins to `plugins.index.json` with correct version and path
6. **Update version** - Bump the registry version to match the plugin manifest version
7. **Re-sync bindings** - Verify all agents, skills, and commands in `pluginBindings` exist on disk
8. **Report** - Display update summary with what changed

## What Gets Updated

### Registry Sync
- Adds missing plugins to `plugins.index.json` `installed` section
- Updates version numbers to match actual `plugin.json` manifests
- Adds missing entries to `registry` metadata section
- Updates `plugins` categorization section
- Refreshes `callsignRegistry` entries
- Recalculates `stats` counts

### Binding Validation
- Verifies each agent listed in `pluginBindings` has a corresponding `.md` file
- Verifies each skill listed has a corresponding skill directory with `SKILL.md`
- Verifies each command listed has a corresponding `.md` file
- Reports broken bindings that reference non-existent files

### Version Drift Detection
Common scenarios this fixes:
- Plugin was installed manually (copied to `plugins/`) but never registered
- Plugin was updated (new version in `plugin.json`) but registry still shows old version
- Plugin was added via marketplace install but registry entry was lost
- Catalog references a plugin that exists on disk but isn't tracked

## Troubleshooting

### "Plugin not found in registry"
The plugin exists on disk but was never registered. This command will add it.

### "Version mismatch"
The registry shows an old version but the plugin manifest has a newer version. This command will sync them.

### "Broken binding"
A catalog item references an agent/skill/command that doesn't exist in the plugin directory. Check the plugin's actual file structure.

## Skills Used
- plugin-catalog
- plugin-packaging
