# Components

UI building blocks for the ACCOS Visual Workflow Builder. The component tree maps directly onto the three-panel layout that users see: a node palette on the left, a workflow canvas in the center, and a properties panel on the right.

## Component hierarchy

```
WorkflowBuilder                  ← top-level layout + tab routing
├── NodePalette                  ← left panel: browsable node type catalog
│   ├── NodeCategory             ← collapsible category section
│   └── DraggableNodeItem        ← single node type dragged to canvas
├── WorkflowCanvas               ← center panel: ReactFlow editing surface
│   └── <custom node renderers>  ← one per NodeCategory (see Nodes/)
├── PropertiesPanel              ← right panel: selected node configuration
│   ├── SchemaForm               ← JSON Schema → form field tree
│   │   └── FieldComponents/     ← leaf field renderers
│   ├── VariablePicker           ← inject workflow variable references
│   └── CodeEditor               ← Monaco editor for code fields
└── PluginMarketplace            ← alternate tab: browse/install plugins
    ├── PluginSearch
    ├── PluginCard
    ├── PluginDetails
    ├── InstalledPlugins
    └── PluginConfigurationModal
```

## Canvas/

`WorkflowCanvas.tsx` — The core editing surface, built on [ReactFlow](https://reactflow.dev/).

Responsibilities:
- Accept drag-and-drop from the palette (HTML5 `onDrop`) and create nodes at the drop position.
- Synchronise ReactFlow's internal node/edge state with `workflowStore` on every change.
- Trigger auto-save via the `onSave` prop callback (default interval: 30 s).
- Expose keyboard shortcuts: Ctrl+Z/Y (undo/redo), Ctrl+C/V/X (copy/paste/cut), Delete (remove selected).
- Render the minimap, zoom controls, and background grid.

Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `workflowId` | `string` | — | ID passed to `onSave` for persistence |
| `onSave` | `(nodes, edges) => void` | — | Called after each auto-save interval |
| `autoSaveInterval` | `number` | `30000` | Milliseconds between auto-saves |
| `readOnly` | `boolean` | `false` | Disables all editing interactions |
| `nodeTypes` | `Record<string, Component>` | — | Override default node renderers |
| `className` | `string` | `''` | Extra CSS classes on the wrapper |

`WorkflowCanvas` wraps itself in a `ReactFlowProvider`. Do not add a second provider above it unless you are intentionally nesting Flow instances.

## Nodes/

One component per node category. Each renderer extends the visual contract established by `BaseNode.tsx`.

| File | Category | Visual style |
|------|----------|-------------|
| `BaseNode.tsx` | — | Shared chrome: border, header, status badge, error/warning display |
| `TriggerNode.tsx` | trigger | Blue — source handle only (no incoming edges) |
| `PhaseNode.tsx` | phase | Green — both handles |
| `AgentNode.tsx` | agent | Purple — both handles |
| `ControlNode.tsx` | control | Amber — multiple output handles (condition branches, loop body) |
| `ActionNode.tsx` | action | Teal — both handles |
| `TerminatorNode.tsx` | terminator | Red — target handle only (no outgoing edges) |

`BaseNode` reads the node's `status` field from its data to render a running/success/failed indicator. When `errors` or `warnings` are present, it renders them inline below the label.

To add a new node type within an existing category, you only need to extend the category's renderer with a type-specific data display. To add an entirely new category, create a new renderer and register it in `index.ts`.

## Palette/

The draggable node catalog displayed in the left panel.

**`NodePalette.tsx`** — Container that fetches node types from the API via `useNodeTypes`, then renders a `NodeCategory` section for each group. Includes the search input and the collapse-all / expand-all controls.

**`NodeCategory.tsx`** — Collapsible section for one category (Triggers, Phases, etc.). Collapse state is persisted via `paletteStore`.

**`DraggableNodeItem.tsx`** — A single node type entry. Sets `event.dataTransfer` with the node type identifier on `dragStart`. The `WorkflowCanvas` reads this on `onDrop` to create the node.

Favorites and recently-used tracking are handled entirely in `paletteStore` — these components read from and write to the store without managing their own state.

## Properties/

The right-panel configuration surface for selected nodes.

**`PropertiesPanel.tsx`** — Reads the selected node ID from `workflowStore`, fetches that node type's `properties_schema` via `useNodeType`, then delegates to `SchemaForm`.

**`SchemaForm.tsx`** — Recursively renders a JSON Schema object as a form. Leaf fields are rendered by the appropriate `FieldComponent`. Validates with Zod (generated from the schema by `utils/schemaToZod.ts`) and reports errors inline.

**`VariablePicker.tsx`** — A popover that lets users insert `{{variable.name}}` references from previous nodes' outputs into any string field. Opened from the input suffix button on `VariableInput` fields.

**`CodeEditor.tsx`** — Monaco editor instance for `code`-format string fields. Configured for the language specified in the schema property's `language` annotation.

### FieldComponents/

| Component | JSON Schema type | Notes |
|-----------|-----------------|-------|
| `TextInput` | `string` | Standard text, also used for `VariableInput` when `x-variable: true` |
| `NumberInput` | `number`, `integer` | Respects `minimum`/`maximum` schema constraints |
| `BooleanInput` | `boolean` | Toggle switch |
| `SelectInput` | `string` with `enum` | Dropdown |
| `ArrayInput` | `array` | Add/remove string items |
| `ObjectInput` | `object` | Key-value pair editor |
| `CodeInput` | `string` with `format: code` | Delegates to Monaco via `CodeEditor` |
| `VariableInput` | `string` with variable picker | `TextInput` + picker button |

### Utilities

`utils/schemaToZod.ts` — Converts a JSON Schema subtree into a Zod validator at runtime. Used by `SchemaForm` for field-level validation before committing data to the store.

`utils/variableParser.ts` — Parses and serialises `{{variable.path}}` expressions within string values.

`hooks/useSchemaForm.ts` — Manages form dirty state, validates on blur, and calls `workflowStore.updateNodeData` on commit.

`hooks/useAutoSave.ts` — Debounced save after each change with configurable delay.

`hooks/useVariablePicker.ts` — Manages the variable picker popover open state and available variable list (derived from upstream nodes in the workflow).

## plugins/

Plugin marketplace components that appear on the "Plugins" tab of `WorkflowBuilder`.

**`PluginMarketplace.tsx`** — Main view. Composes search, featured/popular lists, and detail panel. All data fetching goes through the `usePlugins` hooks.

**`PluginSearch.tsx`** — Filter bar: text query, plugin type tabs, tag multi-select.

**`PluginCard.tsx`** — Compact card used in lists. Shows icon, name, description, rating, and a one-click install/uninstall button.

**`PluginDetails.tsx`** — Expanded view with screenshots, full description, reviews, metrics, and changelog. Opened by clicking a card.

**`InstalledPlugins.tsx`** — Lists installations with enable/disable toggle and uninstall action.

**`PluginConfigurationModal.tsx`** — Modal rendered after install (or from the installed list). Displays a configuration form generated from the plugin's `configuration_schema`.

All install/uninstall/configure mutations are handled by `usePluginInstallation` from `src/hooks/usePlugins.ts`. The components only call the returned action functions (`install`, `uninstall`, `updateConfig`, `setEnabled`).
