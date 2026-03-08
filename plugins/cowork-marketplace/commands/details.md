---
name: cowork-marketplace:details
intent: Show detailed information about a marketplace item including plugin bindings, trust score, and capabilities
tags:
  - cowork-marketplace
  - command
  - details
inputs: []
risk: low
cost: low
description: Display comprehensive details about a marketplace item including its bound agents, skills, commands, trust score breakdown, and session metrics
---

# Item Details

Show full details about a cowork marketplace item including its plugin bindings, trust score, capabilities, and usage metrics.

## Usage
```
/cowork-marketplace:details <item-name>
```

## Examples

### View item details
```
/cowork-marketplace:details microsoft-platform-deploy
```

Displays:
- **Overview**: Description, type, category, difficulty, version
- **Plugin Bindings**: 2 plugins, 7 agents, 8 skills, 9 commands
- **Trust Score**: Overall 92/100 (Grade A) with factor breakdown
- **Capabilities**: Task analysis, parallel execution, output assembly
- **Session Info**: ~45 min, up to 5 parallel agents, 94% completion rate
- **Reviews**: Average 4.7/5 from verified users

## Output Sections

### Plugin Bindings
Shows exactly which plugins power this item:
```
tvs-microsoft-deploy v1.0.0
  Agents:  identity-agent, platform-agent, data-agent, ingest-agent,
           azure-agent, github-agent, comms-agent
  Skills:  pac-cli, az-cli, fabric-rest, graph-api, power-automate-rest,
           stripe-integration, firebase-extract, dataverse-api
  Commands: deploy-all, deploy-identity, deploy-dataverse, deploy-fabric,
            deploy-portal, deploy-azure, extract-a3, normalize-carriers,
            deploy-teams
```

### Trust Score Breakdown
```
Overall: 92/100 (Grade A)
  Cryptographic Signature  97/100  (25% weight)
  Author Reputation        92/100  (20% weight)
  Code Analysis            94/100  (25% weight)
  Community Score           87/100  (15% weight)
  Freshness                95/100  (15% weight)
```

### Dependencies
Lists required plugins with version and optional/required status.

## Skills Used
- plugin-catalog
