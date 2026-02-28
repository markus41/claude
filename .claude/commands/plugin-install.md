---
description: Install a Claude Code plugin from name, Git URL, or local path
argument-hint: <plugin-name> [--force] [--prefix <prefix>]
allowed-tools:
  - Bash
---

# Plugin Install

Install a local plugin by name from the `plugins/` directory.

## Execution

Run the installer script with the user's arguments:

```bash
bash .claude/scripts/plugin-install.sh $ARGUMENTS
```

The script validates the plugin manifest, creates command stubs in `.claude/commands/`, and updates `.claude/registry/plugins.index.json`.

## Options

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing stubs and registry entry |
| `--prefix <name>` | Custom command prefix (default: derived from plugin name) |

## Examples

```bash
/plugin-install jira-orchestrator
/plugin-install frontend-design-system --force
/plugin-install aws-eks-helm-keycloak --prefix eks
```
