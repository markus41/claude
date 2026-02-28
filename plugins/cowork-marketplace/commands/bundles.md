---
name: cowork-marketplace:bundles
intent: Browse pre-packaged plugin bundles that combine multiple Claude Code plugins into single Cowork-distributable packages
tags:
  - cowork-marketplace
  - command
  - bundles
inputs: []
risk: low
cost: low
description: List and explore 8 curated bundles that package multiple plugins into single Cowork-compatible plugins for distribution
---

# Browse Plugin Bundles

View pre-packaged bundles that combine multiple Claude Code plugins into single Cowork-distributable packages. Each bundle is a ready-to-export plugin combining related plugins by domain.

## Usage
```
/cowork-marketplace:bundles [bundle-id] [--category CATEGORY]
```

## Options
- `--category` - Filter by category: devops, engineering, operations, design, iot, nonprofit, microsoft, meta

## Examples

### List all bundles
```
/cowork-marketplace:bundles
```
Shows all 8 bundles with plugin counts and highlights.

### View bundle details
```
/cowork-marketplace:bundles creative-frontend
```
Shows the Creative Frontend Studio bundle with its 2 plugins, 20 commands, 12 agents, and 15 skills.

### Filter by category
```
/cowork-marketplace:bundles --category devops
```
Shows DevOps-related bundles.

## Available Bundles

| Bundle | Plugins | Cmds | Agents | Skills | Best For |
|--------|---------|------|--------|--------|----------|
| **DevOps Powerhouse** | 3 | 20 | 13 | 10 | AWS EKS + Helm + deployment pipelines + team tooling |
| **Full Stack Builder** | 3 | 23 | 13 | 13 | FastAPI + React + IaC + universal templating |
| **Enterprise Workflow Engine** | 3 | 59 | 90 | 17 | Jira orchestration (81 agents!) + team + deploy |
| **Creative Frontend Studio** | 2 | 20 | 12 | 15 | 263 design styles + 11 animation skills |
| **Smart Home Pro** | 1 | 9 | 15 | 8 | Complete Home Assistant platform (15 agents) |
| **Nonprofit Command Center** | 2 | 21 | 15 | 3 | Executive director automation + platform mgmt |
| **Microsoft Enterprise Platform** | 1 | 18 | 19 | 0 | Azure + Dataverse + Fabric + Graph (19 agents) |
| **Plugin Marketplace Toolkit** | 2 | 19 | 4 | 8 | Trust scoring + federation + dev studio |

### Total Across All Bundles
- **14 unique plugins** (some appear in multiple bundles)
- **189 commands**, **181 agents**, **74 skills**

## How Bundles Work

A bundle is a pre-configured combination of plugins that get merged into a **single Cowork plugin ZIP**:

```
Bundle "DevOps Powerhouse"
├── aws-eks-helm-keycloak   (7 cmds, 4 agents, 6 skills)
├── deployment-pipeline     (5 cmds, 3 agents, 0 skills)
└── team-accelerator        (8 cmds, 6 agents, 4 skills)
    ↓
    Merged into one Cowork plugin:
    devops-powerhouse/
    ├── .claude-plugin/plugin.json
    ├── commands/  (20 merged commands)
    ├── agents/    (13 merged agents)
    ├── skills/    (10 merged skills)
    ├── CLAUDE.md
    └── README.md
```

## Next Steps

After choosing a bundle, export it:
```
/cowork-marketplace:bundle-export devops-powerhouse
```

## Skills Used
- plugin-catalog
- plugin-packaging
