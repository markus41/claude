---
description: Generate visual snapshot tests for Chakra components
arguments:
  - name: component
    description: Component name or path to test
    required: true
  - name: variants
    description: Comma-separated list of variants to snapshot (solid,outline,ghost)
    required: false
  - name: sizes
    description: Comma-separated list of sizes to snapshot (sm,md,lg)
    required: false
  - name: states
    description: Comma-separated list of states to snapshot (default,hover,focus,disabled)
    required: false
  - name: framework
    description: Testing framework (vitest|jest)
    required: false
---

# Generate Visual Snapshot Tests

Create comprehensive visual snapshot tests for the specified Chakra UI component.

## Component: $ARGUMENTS.component

## Configuration
- **Variants**: ${ARGUMENTS.variants || 'solid,outline,ghost'}
- **Sizes**: ${ARGUMENTS.sizes || 'sm,md,lg'}
- **States**: ${ARGUMENTS.states || 'default,hover,focus,disabled'}
- **Framework**: ${ARGUMENTS.framework || 'vitest'}

## Instructions

Generate a snapshot test file that covers:

### 1. Basic Rendering Snapshots
```typescript
describe('${componentName} Snapshots', () => {
  it('renders default state correctly', () => {
    const { container } = render(<${componentName} />);
    expect(container).toMatchSnapshot();
  });
});
```

### 2. Variant Snapshots
Create snapshots for each variant:
- solid variant
- outline variant
- ghost variant
- Any custom variants

### 3. Size Snapshots
Create snapshots for each size:
- sm (small)
- md (medium)
- lg (large)
- Any custom sizes

### 4. State Snapshots
Create snapshots for interactive states:
- Default state
- Hover state (using fireEvent or userEvent)
- Focus state
- Disabled state
- Loading state (if applicable)

### 5. Color Mode Snapshots
Test both light and dark modes:
```typescript
it('renders correctly in dark mode', () => {
  const { container } = render(
    <ChakraProvider colorModeConfig={{ initialColorMode: 'dark' }}>
      <${componentName} />
    </ChakraProvider>
  );
  expect(container).toMatchSnapshot();
});
```

### 6. Responsive Snapshots
Test responsive behavior at different breakpoints:
- Mobile (320px)
- Tablet (768px)
- Desktop (1024px)

## Output Structure

```
src/__tests__/
└── ${componentName}.snapshot.test.tsx
```

## Testing Framework Configuration

### For Vitest:
```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
```

### For Jest:
```typescript
import { render } from '@testing-library/react';
```

## Best Practices

1. **Inline Snapshots**: Use inline snapshots for small components
2. **External Snapshots**: Use external .snap files for complex components
3. **Selective Matching**: Use `toMatchInlineSnapshot()` with specific queries
4. **Update Strategy**: Document when and why to update snapshots
5. **CI Integration**: Ensure snapshot tests run in CI pipeline

## Component Requirements

Before generating snapshots, ensure:
- Component is properly exported
- ChakraProvider is available in test setup
- All required props have test data
- Theme is consistent across tests
