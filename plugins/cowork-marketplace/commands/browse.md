---
name: cowork-marketplace:browse
intent: Browse and search the cowork marketplace catalog of templates, workflows, agent configs, skill packs, and session blueprints
tags:
  - cowork-marketplace
  - command
  - browse
inputs: []
risk: low
cost: low
description: Search and discover cowork items from the seed catalog of 16 items backed by 15 installed plugins
---

# Browse Marketplace

Search and discover cowork marketplace items. Each item is backed by real plugin agents, skills, and commands from the installed plugin ecosystem.

## Usage
```
/cowork-marketplace:browse [query] [--type TYPE] [--category CATEGORY] [--sort SORT]
```

## Options
- `--type` - Filter by item type: template, workflow, agent_config, skill_pack, session_blueprint
- `--category` - Filter by category: engineering, design, operations, devops, security, data, finance, hr, marketing, legal, research, general
- `--sort` - Sort results: relevance, popularity, rating, newest, trending, completion_rate (default: relevance)
- `--collection` - Show items from a specific curated collection
- `--plugin` - Show items backed by a specific plugin name

## Examples

### Browse all items
```
/cowork-marketplace:browse
```
Lists all 16 marketplace items with type, rating, and plugin bindings.

### Search by keyword
```
/cowork-marketplace:browse fastapi
```
Finds items matching "fastapi" across names, descriptions, tags, and plugin names.

### Filter by type
```
/cowork-marketplace:browse --type workflow
```
Shows only workflow items (Jira to PR, EKS Deploy Pipeline, Microsoft Platform Deploy, Sprint Planning).

### Browse collections
```
/cowork-marketplace:browse --collection "DevOps Mastery"
```
Shows all items in the DevOps Mastery curated collection.

## How It Works

1. **Query parsing** - Extracts search terms and filter flags
2. **Catalog search** - Matches against the seed catalog of 16 items sourced from 15 installed plugins
3. **Filter application** - Applies type, category, difficulty, trust grade filters
4. **Sort & display** - Orders results and presents them with:
   - Display name and description
   - Item type badge
   - Rating and install count
   - Plugin bindings (which agents/skills/commands power it)
   - Trust grade (A-F)
   - Difficulty level

## Catalog Contents

The marketplace contains items from these categories:

| Type | Count | Examples |
|------|-------|---------|
| Templates | 3 | FastAPI Scaffold, Fullstack React+FastAPI, Home Assistant Setup |
| Workflows | 4 | Jira to PR, EKS Deploy, Microsoft Platform, Sprint Planning |
| Agent Configs | 3 | Enterprise Code Reviewer, Nonprofit Exec Director, Design System Architect |
| Skill Packs | 3 | DevOps Essentials, React Animation Toolkit, Marketplace Intelligence |
| Blueprints | 3 | Enterprise Release, Keycloak Multi-Tenant, Project Scaffolder |

## Curated Collections

9 collections group items by domain:
1. Startup Launch Kit
2. Enterprise Operations
3. DevOps Mastery
4. Microsoft Ecosystem
5. Design & Frontend
6. Smart Home Automation
7. Nonprofit & Association Management
8. Security & Authentication
9. Plugin Ecosystem Tools

## Skills Used
- plugin-catalog
- cowork-sessions
