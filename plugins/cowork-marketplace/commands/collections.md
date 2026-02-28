---
name: cowork-marketplace:collections
intent: Browse curated collections of marketplace items grouped by domain and use case
tags:
  - cowork-marketplace
  - command
  - collections
inputs: []
risk: low
cost: low
description: Display curated collections with their items, tags, and descriptions
---

# Browse Collections

View curated collections of cowork marketplace items organized by domain and use case.

## Usage
```
/cowork-marketplace:collections [collection-name]
```

## Examples

### List all collections
```
/cowork-marketplace:collections
```
Shows all 9 curated collections with item counts and descriptions.

### View specific collection
```
/cowork-marketplace:collections "DevOps Mastery"
```
Shows all items in the DevOps Mastery collection with their details and plugin bindings.

## Available Collections

| Collection | Items | Tags |
|-----------|-------|------|
| Startup Launch Kit | 3 | startup, mvp, scaffold, fullstack |
| Enterprise Operations | 3 | enterprise, workflow, operations, jira |
| DevOps Mastery | 3 | devops, kubernetes, deployment, ci-cd |
| Microsoft Ecosystem | 2 | microsoft, azure, dataverse, fabric |
| Design & Frontend | 2 | design, frontend, react, animation |
| Smart Home Automation | 1 | home-assistant, iot, smart-home |
| Nonprofit & Association | 1 | nonprofit, association, management |
| Security & Authentication | 2 | security, keycloak, authentication |
| Plugin Ecosystem Tools | 2 | marketplace, plugins, meta-tools |

## Skills Used
- plugin-catalog
