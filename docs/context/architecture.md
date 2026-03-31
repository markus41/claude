# Architecture

## High-Level Diagram

```
+------------------------------------------------------------------+
|                    Neural Orchestration Platform                   |
+------------------------------------------------------------------+
|  Frontend (@accos/frontend)                                       |
|  React 18 + Vite 5 + Tailwind + ReactFlow Canvas                |
|  +-----------+  +------------+  +-----------+  +---------------+ |
|  | Workflow   |  | Node       |  | Properties|  | Plugin        | |
|  | Builder    |  | Palette    |  | Panel     |  | Marketplace   | |
|  +-----------+  +------------+  +-----------+  +---------------+ |
+------------------------------------------------------------------+
|  State Layer                                                      |
|  Zustand (workflowStore, paletteStore) + TanStack Query          |
+------------------------------------------------------------------+
|  MCP Servers (7)                                                  |
|  perplexity | firecrawl | deploy-intelligence | lessons-learned  |
|  project-metrics | code-quality-gate | workflow-bridge           |
+------------------------------------------------------------------+
|  Plugin Runtime (19 plugins)                                      |
|  Each plugin: manifest + commands + agents + skills + hooks      |
+------------------------------------------------------------------+
```

## Component Inventory

| Component | Path | Responsibility |
|-----------|------|---------------|
| WorkflowBuilder | `src/components/WorkflowBuilder.tsx` | Main canvas orchestration |
| Canvas | `src/components/Canvas/` | ReactFlow wrapper and interaction handlers |
| Nodes | `src/components/Nodes/` | Custom node type renderers |
| Palette | `src/components/Palette/` | Draggable node type list |
| Properties | `src/components/Properties/` | Selected-node config panel |
| Plugins UI | `src/components/plugins/` | Plugin marketplace and management UI |

## Stores

| Store | File | Purpose |
|-------|------|---------|
| workflowStore | `src/stores/workflowStore.ts` | Workflow graph nodes, edges, execution state |
| paletteStore | `src/stores/paletteStore.ts` | Available node types, search, drag state |

## Plugin Structure

Every plugin follows this layout:

```
plugins/<name>/
  .claude-plugin/plugin.json   # Manifest (required)
  commands/                    # Slash command definitions
  agents/                      # Agent markdown files
  skills/                      # SKILL.md capability files
  hooks/                       # Lifecycle hook scripts
```

## Key Dependencies

<!-- Fill in: Inter-component dependency arrows or coupling notes -->
