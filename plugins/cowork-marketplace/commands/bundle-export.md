---
name: cowork-marketplace:bundle-export
intent: Export a plugin bundle as a single Cowork-compatible plugin ZIP by merging commands, agents, and skills from multiple source plugins
tags:
  - cowork-marketplace
  - command
  - bundle-export
inputs: []
risk: low
cost: medium
description: Merge multiple Claude Code plugins into a single Cowork plugin ZIP. Copies commands, agents, and skills from each source plugin, generates a unified manifest, CLAUDE.md, and README.md.
---

# Export Plugin Bundle

Merge multiple Claude Code plugins into a single Cowork-compatible plugin ZIP for distribution. This is the key command for turning your Claude Code plugin library into distributable Cowork packages.

## Usage
```
/cowork-marketplace:bundle-export <bundle-id> [--output PATH] [--dry-run]
```

## Options
- `--output` - Output directory for the ZIP file (default: current directory)
- `--dry-run` - Show what would be included without creating the ZIP
- `--exclude-plugin` - Exclude a specific plugin from the bundle
- `--prefix` - Custom command prefix instead of bundle name (e.g., `--prefix devops`)

## Examples

### Export a bundle
```
/cowork-marketplace:bundle-export devops-powerhouse
```
Creates `devops-powerhouse.zip` containing merged assets from aws-eks-helm-keycloak, deployment-pipeline, and team-accelerator.

### Dry run to preview
```
/cowork-marketplace:bundle-export enterprise-workflow-engine --dry-run
```

Output:
```
Bundle: Enterprise Workflow Engine
Source plugins: 3
  jira-orchestrator:  46 commands, 81 agents, 13 skills
  team-accelerator:    8 commands,  6 agents,  4 skills
  deployment-pipeline: 5 commands,  3 agents,  0 skills

Merged totals:
  Commands: 59
  Agents:   90
  Skills:   17

Estimated ZIP size: ~2.1 MB
```

### Export with custom prefix
```
/cowork-marketplace:bundle-export creative-frontend --prefix design
```
Commands become `/design:theme-builder`, `/design:animate`, etc.

## How It Works

1. **Read bundle definition** from `bundles/registry.json`
2. **Collect assets** from each source plugin:
   ```
   For each plugin in bundle.plugins:
     Copy plugins/{plugin}/commands/*.md → {bundle}/commands/
     Copy plugins/{plugin}/agents/*.md   → {bundle}/agents/
     Copy plugins/{plugin}/skills/*/     → {bundle}/skills/
   ```
3. **Rewrite command names** to use the bundle prefix:
   - `aws-eks-helm-keycloak:deploy` → `devops-powerhouse:deploy`
   - Handle name collisions by appending source plugin suffix
4. **Generate manifest** with merged metadata
5. **Generate CLAUDE.md** listing all available commands, agents, and skills
6. **Generate README.md** with installation and usage docs
7. **Create ZIP** with `zip -r`
8. **Validate** structure and size (must be under 50 MB)

## Name Collision Resolution

When multiple plugins have commands with the same name (e.g., both have `deploy.md`):
```
First plugin wins the short name:    deploy.md
Subsequent get prefixed:             deploy-pipeline.md
```

The original command name in the frontmatter is updated to match.

## Output Structure

```
devops-powerhouse/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── index.json
│   ├── deploy.md              (from aws-eks-helm-keycloak)
│   ├── helm-install.md        (from aws-eks-helm-keycloak)
│   ├── start.md               (from deployment-pipeline)
│   ├── rollback.md            (from deployment-pipeline)
│   ├── sprint-plan.md         (from team-accelerator)
│   └── ... (20 total)
├── agents/
│   ├── index.json
│   ├── orchestrator.md        (from deployment-pipeline)
│   ├── validator.md           (from deployment-pipeline)
│   └── ... (13 total)
├── skills/
│   ├── eks-management/SKILL.md
│   ├── helm-operations/SKILL.md
│   └── ... (10 total)
├── CLAUDE.md
└── README.md
```

## Cowork Upload

After export:
1. Open **Claude Desktop** > **Organization Settings** > **Plugins**
2. Click **Add plugins** > **Upload to a new marketplace**
3. Upload the generated ZIP
4. Assign to teams/users

Or for CLI distribution:
```bash
claude plugin install ./devops-powerhouse.zip
```

## Agent Assignment
This command activates the **export-packager** agent.

## Skills Used
- plugin-packaging
- plugin-catalog
