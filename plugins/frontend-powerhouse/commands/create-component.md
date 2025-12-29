---
name: create-component
description: Generate typed Chakra UI component with variants, tests, and stories
argument-hint: component-name [component-type]
allowed-tools:
  - Write
  - Read
  - Edit
  - Glob
  - Grep
  - Bash
---

# Create Component Command

You are being invoked as the `/create-component` slash command for the frontend-powerhouse plugin.

## Your Task

Generate a fully-typed Chakra UI component with variants, including test files and Storybook stories. Delegate this work to the **react-component-architect** agent.

## Arguments

- **component-name** (required): Name of the component to create (e.g., "Button", "Card", "ProfileCard")
- **component-type** (optional): Type of component - button|card|modal|form|input|etc. Defaults to "generic"

## Instructions

1. **Activate the react-component-architect agent** via the Task tool
2. Pass the component name and type to the agent
3. The agent will create:
   - Component file with TypeScript types and Chakra UI styling
   - Variants using Chakra's variant system
   - Test file with unit tests
   - Storybook story file with all variants
4. Ensure files are created in the appropriate directories:
   - Components: `src/components/{ComponentName}/`
   - Tests: `src/components/{ComponentName}/__tests__/`
   - Stories: `src/components/{ComponentName}/{ComponentName}.stories.tsx`

## Expected Output Structure

```
src/components/{ComponentName}/
├── index.tsx              # Component implementation
├── {ComponentName}.tsx    # Component file
├── types.ts              # TypeScript interfaces
├── __tests__/
│   └── {ComponentName}.test.tsx
└── {ComponentName}.stories.tsx
```

## Usage Examples

```bash
# Create a button component
/create-component Button button

# Create a card component
/create-component ProfileCard card

# Create a modal component
/create-component ConfirmDialog modal

# Create a generic component
/create-component CustomWidget
```

## Quality Requirements

The generated component must:
- Use TypeScript with proper types
- Implement Chakra UI component patterns
- Include accessibility attributes (ARIA)
- Support theming via Chakra tokens
- Include comprehensive tests (>80% coverage)
- Document all props in Storybook

## Delegation Pattern

```typescript
// Use the Task tool to delegate to react-component-architect
task: {
  agent: "react-component-architect",
  prompt: `Create a ${componentType} component named ${componentName}`,
  model: "sonnet"
}
```

After the agent completes, verify all files were created and report the output structure to the user.
