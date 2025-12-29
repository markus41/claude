---
name: create-theme
description: Set up comprehensive Chakra UI theme with design tokens and component variants
argument-hint: [theme-name]
allowed-tools:
  - Write
  - Read
  - Edit
  - Glob
  - Bash
---

# Create Theme Command

You are being invoked as the `/create-theme` slash command for the frontend-powerhouse plugin.

## Your Task

Create a comprehensive Chakra UI theme with design tokens, component variants, and proper TypeScript typing. Use the **design-system-architect** agent to scaffold the theme structure.

## Arguments

- **theme-name** (optional): Name for the theme. Defaults to "default"

## Instructions

1. **Activate the design-system-architect agent** via the Task tool
2. The agent will create a complete theme structure with:
   - Design tokens (colors, typography, spacing, shadows, etc.)
   - Component variants for all Chakra components
   - Semantic tokens for light/dark mode
   - Custom components and styles
   - TypeScript types for theme
3. Ensure the theme follows Chakra UI best practices
4. Set up theme provider integration

## Expected Output Structure

```
src/theme/
├── index.ts                    # Main theme export
├── foundations/
│   ├── colors.ts              # Color palette
│   ├── typography.ts          # Fonts, sizes, line heights
│   ├── spacing.ts             # Spacing scale
│   ├── shadows.ts             # Shadow tokens
│   ├── borders.ts             # Border styles and radii
│   └── breakpoints.ts         # Responsive breakpoints
├── components/
│   ├── button.ts              # Button variants
│   ├── input.ts               # Input variants
│   ├── card.ts                # Card variants
│   └── index.ts               # Component overrides
├── semantic-tokens/
│   └── colors.ts              # Light/dark mode tokens
├── styles/
│   └── global.ts              # Global styles
└── types/
    └── theme.d.ts             # TypeScript theme types
```

## Theme Features

### Design Tokens
- **Colors**: Primary, secondary, accent, semantic colors (success, error, warning, info)
- **Typography**: Font families, sizes (xs-9xl), weights, line heights
- **Spacing**: Consistent scale (0.5-96)
- **Shadows**: Elevation levels (sm, md, lg, xl)
- **Borders**: Radii (sm, md, lg, full) and widths
- **Breakpoints**: Mobile-first responsive breakpoints

### Component Variants
Each component should have multiple variants:
- Button: solid, outline, ghost, link
- Input: filled, outline, flushed, unstyled
- Card: elevated, outline, filled

### Dark Mode Support
- Semantic color tokens that adapt to color mode
- Proper contrast ratios for accessibility
- Smooth transitions between modes

## Usage Examples

```bash
# Create default theme
/create-theme

# Create named theme
/create-theme marketing

# Create theme for specific brand
/create-theme acme-brand
```

## Example Theme Output

```typescript
// src/theme/foundations/colors.ts
export const colors = {
  brand: {
    50: '#e6f2ff',
    100: '#baddff',
    200: '#8dc8ff',
    300: '#5eb3ff',
    400: '#3a9eff',
    500: '#1a89ff',  // Primary
    600: '#1570d9',
    700: '#1058b3',
    800: '#0c418d',
    900: '#072b67',
  },
  // ... more colors
};

// src/theme/components/button.ts
export const Button = {
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
  },
  sizes: {
    sm: { fontSize: 'sm', px: 4, py: 2 },
    md: { fontSize: 'md', px: 6, py: 3 },
    lg: { fontSize: 'lg', px: 8, py: 4 },
  },
  variants: {
    solid: {
      bg: 'brand.500',
      color: 'white',
      _hover: { bg: 'brand.600' },
    },
    outline: {
      border: '2px solid',
      borderColor: 'brand.500',
      color: 'brand.500',
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
};
```

## Integration Code

The agent should also provide integration instructions:

```tsx
// src/App.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      {/* Your app */}
    </ChakraProvider>
  );
}
```

## Delegation Pattern

```typescript
// Use Task tool to delegate to design-system-architect
task: {
  agent: "design-system-architect",
  prompt: `Create comprehensive Chakra UI theme named "${themeName}" with design tokens and component variants`,
  model: "sonnet"
}
```

## Design Principles

The theme should follow:
- **Consistency**: Unified design language across all components
- **Accessibility**: WCAG AA compliant color contrasts
- **Scalability**: Easy to extend and customize
- **Performance**: No runtime performance impact
- **Type Safety**: Full TypeScript support

After theme creation, generate documentation showing:
1. How to use the theme
2. Available color palettes
3. Component variants with examples
4. Responsive breakpoints
5. Dark mode configuration
