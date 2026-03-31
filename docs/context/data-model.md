# Data Model

## Plugin Manifest Schema

Location: `plugins/<name>/.claude-plugin/plugin.json`

```json
{
  "name": "string",
  "version": "string (semver)",
  "description": "string",
  "commands": [{ "name": "string", "description": "string", "path": "string" }],
  "agents": [{ "name": "string", "path": "string" }],
  "skills": [{ "name": "string", "path": "string" }],
  "hooks": [{ "event": "string", "command": "string" }]
}
```

<!-- Fill in: Full JSON schema or link to validation script -->

## Workflow Node Types

Defined in `src/types/nodes.ts`.

| Type | Description |
|------|-----------|
<!-- Fill in: List node types from the types file (trigger, action, condition, etc.) -->

## Workflow Edge Types

<!-- Fill in: Edge types and their semantics -->

## Agent Definition Format

Agents are markdown files with YAML frontmatter:

```yaml
---
name: agent-name
description: What this agent does
model: opus | sonnet | haiku
tools: [list, of, allowed, tools]
---
# Agent instructions in markdown body
```

## Registry Indexes

| Index File | Purpose |
|-----------|---------|
| `.claude/registry/plugins.index.json` | Plugin metadata and installation status |
<!-- Fill in: Other registry files -->

## Zustand Store Shapes

<!-- Fill in: TypeScript interfaces for workflowStore and paletteStore state -->
