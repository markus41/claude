# Properties Panel System

Production-ready node configuration editing for ACCOS Visual Flow Builder with dynamic form generation, auto-save, and comprehensive accessibility.

## Quick Start

```tsx
import { PropertiesPanel } from '@/components/Properties';

function App() {
  return (
    <div className="flex h-screen">
      <Canvas />
      <PropertiesPanel width={400} enableVariables={true} />
    </div>
  );
}
```

## Components

### PropertiesPanel
Main container with responsive design, empty states, and multi-select detection.

```tsx
<PropertiesPanel
  width={400}
  collapsible={true}
  enableVariables={true}
/>
```

### SchemaForm
Dynamic form generator from JSON Schema with auto-save and validation.

```tsx
<SchemaForm
  schema={nodeTypeSchema}
  nodeId="agent-node-1"
  enableAutoSave={true}
/>
```

### VariablePicker
Intelligent autocomplete for workflow variables.

```tsx
<VariablePicker
  inputRef={inputRef}
  currentNodeId={nodeId}
  onSelect={(variable) => console.log(variable)}
/>
```

### CodeEditor
Monaco Editor with syntax highlighting and variable autocomplete.

```tsx
<CodeEditor
  value={code}
  onChange={setCode}
  language="json"
  enableVariables={true}
/>
```

## Hooks

### useAutoSave
Debounced auto-save with error recovery.

```tsx
const { saveStatus, save, lastSaved } = useAutoSave({
  nodeId: 'agent-node-1',
  debounceMs: 500
});
```

### useSchemaForm
React Hook Form + Zod integration with auto-save.

```tsx
const {
  register,
  formState: { errors },
  saveStatus
} = useSchemaForm({
  schema: nodeTypeSchema,
  nodeId: 'agent-node-1'
});
```

### useVariablePicker
Variable autocomplete and insertion.

```tsx
const {
  variables,
  searchVariables,
  insertVariable
} = useVariablePicker({
  currentNodeId: 'agent-node-1'
});
```

## Field Components

8 production-ready field components with validation:

- **TextInput** - Text fields with pattern validation
- **NumberInput** - Number fields with range constraints
- **BooleanInput** - Checkbox/switch toggle
- **SelectInput** - Dropdown select with enum support
- **CodeInput** - Monaco Editor for code/JSON/YAML
- **VariableInput** - Text input with variable autocomplete
- **ArrayInput** - Dynamic list with add/remove
- **ObjectInput** - Nested object editor

## Utilities

### schemaToZod
Convert JSON Schema to Zod schemas with TypeScript inference.

```typescript
import { convertJsonSchemaToZod } from '@/components/Properties/utils';

const zodSchema = convertJsonSchemaToZod(jsonSchema);
type FormData = z.infer<typeof zodSchema>;
```

### variableParser
Parse and validate variable expressions.

```typescript
import { extractVariables, validateVariable } from '@/components/Properties/utils';

const variables = extractVariables('Process {{ task.output }}');
const result = validateVariable(variables[0], context);
```

## Features

### ✅ Dynamic Form Generation
- Automatic field mapping from JSON Schema
- Type-safe validation with Zod
- Nested objects and arrays support
- Enum to select conversion

### ✅ Auto-Save
- 500ms debounce (configurable)
- Optimistic updates with rollback
- Save status indicators
- Error recovery

### ✅ Variable System
- Built-in variables (workflow.*, trigger.*, context.*)
- Node output references
- Autocomplete with search
- Insert at cursor position
- Validation with suggestions

### ✅ Accessibility
- WCAG 2.1 AA compliant
- Full keyboard navigation
- ARIA attributes
- Screen reader support
- Error announcements

### ✅ Monaco Editor
- Syntax highlighting
- Variable autocomplete
- Full-screen mode
- Light/dark themes
- Error markers

## Architecture

```
PropertiesPanel
├── State from Zustand (selectedNodes, updateNodeData)
├── Node Types from API (useNodeTypes hook)
└── SchemaForm
    ├── useSchemaForm (React Hook Form + Zod)
    │   └── useAutoSave (Debounced persistence)
    └── Field Components
        ├── VariablePicker (Autocomplete)
        └── CodeEditor (Monaco)
```

## Testing

- **110 tests** for schemaToZod utility
- **21 tests** for field components
- **Comprehensive coverage** for variableParser
- **Manual testing** required for integration

## Performance

- React.memo optimization on field components
- Debounced validation (500ms)
- Efficient re-renders with React Hook Form
- Monaco Editor lazy loading
- Bundle size optimized

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile responsive

## File Structure

```
Properties/
├── PropertiesPanel.tsx       # Main container
├── SchemaForm.tsx            # Dynamic form generator
├── VariablePicker.tsx        # Autocomplete component
├── CodeEditor.tsx            # Monaco wrapper
├── hooks/
│   ├── useAutoSave.ts        # Auto-save hook
│   ├── useSchemaForm.ts      # Form hook
│   ├── useVariablePicker.ts  # Variable picker hook
│   └── index.ts              # Barrel exports
├── FieldComponents/
│   ├── TextInput.tsx         # 8 field components
│   └── index.ts              # Barrel exports
├── utils/
│   ├── schemaToZod.ts        # Schema conversion
│   ├── variableParser.ts     # Variable parsing
│   ├── validation.ts         # Validation utilities
│   └── index.ts              # Barrel exports
└── index.ts                  # Main barrel export
```

## Configuration Examples

### Agent Node

```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "enum": ["claude-opus-4", "claude-sonnet-4"],
      "default": "claude-opus-4"
    },
    "maxContext": {
      "type": "number",
      "minimum": 10000,
      "maximum": 200000,
      "default": 80000
    },
    "systemPrompt": {
      "type": "string",
      "format": "code",
      "language": "markdown"
    }
  },
  "required": ["model"]
}
```

### Webhook Trigger

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "method": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "DELETE"],
      "default": "POST"
    },
    "timeout": {
      "type": "number",
      "minimum": 1000,
      "maximum": 30000,
      "default": 5000
    }
  },
  "required": ["url"]
}
```

## Dependencies

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "@monaco-editor/react": "^4.x",
  "monaco-editor": "^0.x",
  "@headlessui/react": "^1.x"
}
```

## TypeScript Support

Full TypeScript support with:
- Type inference from Zod schemas
- Strict mode compatible
- Comprehensive type exports
- JSDoc documentation

## License

Part of the ACCOS Visual Flow Builder project.

---

**Status:** Production Ready ✅
**Version:** 1.0.0
**Last Updated:** 2026-01-23
