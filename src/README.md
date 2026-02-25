# ACCOS Frontend — Visual Workflow Builder

The frontend is a React/TypeScript single-page application that provides a drag-and-drop canvas for designing multi-agent workflows. Users compose workflows visually by placing nodes (triggers, phases, agents, actions, terminators) on a canvas and connecting them with edges. The completed workflow definition is persisted to the ACCOS backend via REST API and receives real-time execution updates over WebSocket.

## Architecture

```
src/
├── main.tsx                   # App entry point — React Query + WorkflowBuilder
├── components/
│   ├── WorkflowBuilder.tsx    # Top-level layout: palette + canvas + properties
│   ├── Canvas/                # ReactFlow canvas with undo/redo, auto-save
│   ├── Nodes/                 # 7 category-specific node renderers
│   ├── Palette/               # Draggable node palette with search and favorites
│   ├── Properties/            # Schema-driven properties panel with Monaco editor
│   └── plugins/               # Plugin marketplace UI (browse, install, configure)
├── hooks/
│   ├── useNodeTypes.ts        # Fetch and filter node type catalog from API
│   └── usePlugins.ts          # Plugin marketplace React Query hooks
├── lib/
│   ├── api/                   # Typed REST clients (workflows, templates, plugins, nodeTypes)
│   ├── websocket/             # WebSocket client with heartbeat and auto-reconnect
│   └── utils.ts               # cn() class name helper
├── stores/
│   ├── workflowStore.ts       # Workflow state: nodes, edges, undo/redo, clipboard
│   └── paletteStore.ts        # Palette state: favorites, recents, search (persisted)
├── types/
│   ├── workflow.ts            # Core workflow, node, edge, and execution types
│   ├── nodes.ts               # 27 node data interfaces and NODE_METADATA registry
│   └── plugins.ts             # Plugin marketplace types
└── utils/workflowImporter.ts  # Import workflows from JSON templates
```

### State management

Two Zustand stores handle all client state. Neither store talks to the API directly — that responsibility belongs to React Query hooks and the `lib/api/` layer.

| Store | What it owns | Persisted? |
|-------|-------------|-----------|
| `workflowStore` | Nodes, edges, selection, clipboard, undo/redo history | No |
| `paletteStore` | Favorites, recently used nodes, category collapse, search query | Yes (localStorage) |

The `workflowStore` uses the `immer` middleware so mutations are written as direct assignments. The `past`/`future` stacks are capped at 50 entries. Position drags do **not** push to the history stack to avoid flooding it.

### Data flow

```
User drags node from Palette
  → DraggableNodeItem (onDrop)
  → WorkflowCanvas (handleDrop)
  → workflowStore.addNode()         ← pushes history snapshot

User clicks Save
  → WorkflowCanvas auto-save timer fires
  → onSave callback
  → lib/api/workflows.ts updateWorkflow()
  → ACCOS backend REST API

Backend executes workflow
  → WebSocket pushes NODE_STARTED / NODE_COMPLETED events
  → WorkflowCanvas updates node status in store
```

## Node Types

There are 27 node types across 6 categories. Each type has a corresponding data interface in `src/types/nodes.ts` and a visual renderer in `src/components/Nodes/`.

| Category | Color | Types |
|----------|-------|-------|
| Trigger | Blue | epic, task, webhook, scheduled, manual |
| Phase | Green | explore, plan, code, test, fix, document |
| Agent | Purple | single, multi, specialist |
| Control | Amber | condition, loop, parallel, wait, merge |
| Action | Teal | api_call, file_operation, git_operation, notification |
| Terminator | Red | success, failure, cancel, escalate |

Node type identifiers use dot notation: `trigger.epic`, `phase.code`, `agent.single`, etc.

## Key Components

### WorkflowBuilder

Top-level component rendered by `App`. Composes the three-panel layout: node palette (left), canvas (center), properties panel (right). Manages the active tab (canvas vs. plugin marketplace).

### WorkflowCanvas

The ReactFlow-powered canvas. Handles:
- Drag-and-drop from the palette (HTML5 `onDrop`)
- Node/edge creation, deletion, and reconnection
- Auto-save on a configurable interval (default 30 s)
- Keyboard shortcuts (Ctrl+Z undo, Ctrl+Y redo, Ctrl+C/V/X copy/paste/cut, Delete)
- Read-only mode when `readOnly` prop is set

Wrap with `ReactFlowProvider` if embedding inside another React Flow instance.

### NodePalette

Renders all available node types grouped by category. Supports:
- Full-text search across type name and description
- Favorites (star icon, persisted across sessions)
- Recently used (last 5, persisted across sessions)
- Category collapse/expand (persisted across sessions)

Drag a node from the palette onto the canvas to create it.

### PropertiesPanel

Appears on the right when a node is selected. Displays a `SchemaForm` generated from the selected node type's `properties_schema` (JSON Schema). Includes a Monaco-based code editor for fields of type `code`. Changes auto-save through the `useAutoSave` hook.

### PluginMarketplace

Provides the full plugin install/uninstall/configure flow. Composed of:
- `PluginSearch` — filter bar with type and tag filters
- `PluginCard` — summary card with install action
- `PluginDetails` — detail view with reviews and metrics
- `PluginConfigurationModal` — post-install configuration form
- `InstalledPlugins` — manage currently installed plugins

## API Integration

All backend communication goes through `src/lib/api/`.

```typescript
// REST — typed functions, no React required
import { createWorkflow, updateWorkflow, listWorkflows } from '@/lib/api/workflows';

const workflow = await createWorkflow({
  name: 'My Pipeline',
  nodes: [...],
  edges: [...],
  canvas_settings: { zoom: 1.0, viewport: { x: 0, y: 0 } },
});
```

The base URL is read from `VITE_API_BASE_URL`. In development the Vite dev server proxies `/api` to `http://localhost:8000`.

```typescript
// WebSocket — typed event subscriptions
import { WebSocketClient } from '@/lib/websocket';

const ws = new WebSocketClient({ url: 'ws://localhost:8000/ws/swarm', sessionId, agentId });
ws.on(WSMessageType.NODE_STARTED, (data) => { /* update node status */ });
await ws.connect();
```

The WebSocket client implements a ping/pong heartbeat (30 s interval) and exponential-backoff reconnection.

## Development Guide

### Adding a new node type

1. Add the type identifier to the `NodeType` union in `src/types/nodes.ts`.
2. Create a data interface extending `BaseNodeData` in the same file.
3. Add a `NodeMetadata` entry to `NODE_METADATA` with display name, icon, and category.
4. Create a renderer component in `src/components/Nodes/` (extend `BaseNode`).
5. Register the component in `src/components/Nodes/index.ts`.
6. The palette and properties panel will pick it up automatically from the node type catalog.

### Adding a new API resource

1. Create a file in `src/lib/api/` following the pattern in `workflows.ts`.
2. Use `apiClient.get<T>()` / `.post<T>()` etc. for type-safe requests.
3. Export functions from `src/lib/api/index.ts`.
4. Create a React Query hook in `src/hooks/` that wraps the API functions.

### Adding a new Zustand store

Follow the pattern in `workflowStore.ts`:
- Wrap with `devtools(subscribeWithSelector(immer(...)))`.
- Define the state interface with both state fields and action methods.
- If persistence is needed, add the `persist` middleware (see `paletteStore.ts`).

### Running the app

```bash
pnpm install
pnpm dev       # Vite dev server on :5173
pnpm test      # Vitest unit tests
pnpm build     # Production bundle
```

## Gotchas

- **Node position updates bypass history.** `updateNodePosition` does not call `saveToHistory` to avoid saturating the undo stack during a drag. If you need position changes to be undoable, call `updateNode` instead.
- **Deleting a node cascades to edges.** `deleteNode` / `deleteNodes` remove all connected edges automatically.
- **Updating nodes/edges via the API replaces the entire array.** The backend treats `nodes` and `edges` as complete replacements, not patches.
- **`paletteStore` serializes `Set` to `Array` for localStorage.** The custom `merge` function converts it back on hydration. Do not assume `favorites` is a plain array at runtime — use `state.favorites.has(type)`.
- **ReactFlow requires a `ReactFlowProvider` ancestor.** `WorkflowCanvas` wraps itself, but if you embed it inside an existing React Flow tree you will need to manage the provider yourself.
