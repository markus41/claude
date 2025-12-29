---
name: create-component
description: Generate a generic Chakra UI component with TypeScript, variants, and prop interfaces
argument-hint: "[component-name] [base-chakra-element]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a reusable Chakra UI component following these steps:

1. Parse the component name from arguments (convert to PascalCase)
2. Determine the base Chakra element (Box, Flex, Stack, etc.) - default to Box if not specified
3. Generate a TypeScript component file with proper interfaces
4. Include variant system using Chakra's styling props
5. Add forwardRef for ref forwarding
6. Export both component and types

## Component Template

```typescript
import { forwardRef, ComponentProps } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

export interface {ComponentName}Props extends BoxProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  // Add custom props here
}

const variantStyles = {
  primary: {
    bg: 'blue.500',
    color: 'white',
    _hover: { bg: 'blue.600' },
  },
  secondary: {
    bg: 'gray.100',
    color: 'gray.800',
    _hover: { bg: 'gray.200' },
  },
  outline: {
    borderWidth: '1px',
    borderColor: 'gray.300',
    _hover: { borderColor: 'gray.400' },
  },
};

const sizeStyles = {
  sm: { px: 3, py: 2, fontSize: 'sm' },
  md: { px: 4, py: 3, fontSize: 'md' },
  lg: { px: 6, py: 4, fontSize: 'lg' },
};

export const {ComponentName} = forwardRef<HTMLDivElement, {ComponentName}Props>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        {...variantStyles[variant]}
        {...sizeStyles[size]}
        {...props}
      >
        {children}
      </Box>
    );
  }
);

{ComponentName}.displayName = '{ComponentName}';
```

## Customization Based on Arguments

- If base element is specified (e.g., "Flex", "Stack"), replace Box imports and component base
- Adjust variant styles based on component purpose
- Add semantic props (isDisabled, isActive, etc.) if relevant
- Include accessibility props (aria-label, role) when needed

## Variants System

Create variant objects for common patterns:
- Visual variants (primary, secondary, ghost, outline)
- Size variants (xs, sm, md, lg, xl)
- State variants (active, disabled, loading)

## Best Practices

1. Always use forwardRef for component library elements
2. Spread BoxProps or appropriate Chakra props interface
3. Set displayName for better debugging
4. Use Chakra's responsive syntax for sizes
5. Include TypeScript strict mode compatibility
6. Export both component and Props interface
7. Use semantic HTML through Chakra's `as` prop when needed
8. Leverage Chakra's style props for consistency
