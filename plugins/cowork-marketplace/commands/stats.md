---
name: cowork-marketplace:stats
intent: Show marketplace statistics including total items, plugins, agents, skills, and commands
tags:
  - cowork-marketplace
  - command
  - stats
inputs: []
risk: low
cost: low
description: Display aggregated statistics about the marketplace catalog and plugin ecosystem
---

# Marketplace Statistics

Display aggregated statistics about the cowork marketplace catalog and the underlying plugin ecosystem.

## Usage
```
/cowork-marketplace:stats
```

## Output

Shows a summary dashboard:

```
Cowork Marketplace Statistics
═══════════════════════════════

Catalog:
  Total Items:       17
  Templates:          3
  Workflows:          4
  Agent Configs:      3
  Skill Packs:        4
  Session Blueprints: 3

Plugin Ecosystem:
  Bound Plugins:     16
  Total Agents:     137+
  Total Skills:      72+
  Total Commands:   153+

Collections:         10

Top Categories:
  Engineering        5 items
  DevOps             4 items
  Operations         3 items
  Design             2 items
  Security           1 item
  General            1 item
```

## Skills Used
- plugin-catalog
