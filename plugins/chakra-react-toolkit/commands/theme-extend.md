---
name: theme-extend
description: Extend/customize existing Chakra theme
argument-hint: "[--component=ComponentName] [--foundation=colors|typography|spacing]"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
---

# Theme Extension Command

When this command is invoked, extend an existing Chakra UI theme by adding or modifying component styles, design tokens, or theme foundations.

## Execution Steps

1. **Detect Existing Theme**
   - Search for existing theme directory (src/theme, src/styles/theme, etc.)
   - Read current theme structure and configuration
   - Identify what the user wants to extend (component, foundation, etc.)

2. **Determine Extension Type**
   - Component style override: --component flag
   - Foundation token: --foundation flag
   - Interactive mode: Ask user what to extend if no flags provided

3. **Generate Extension Code**
   - Create new component style file if extending components
   - Update existing foundation files if extending tokens
   - Ensure proper TypeScript typing
   - Maintain existing code style and patterns

4. **Update Theme Index**
   - Add new component override to main theme object
   - Update imports in theme index file
   - Preserve existing theme configuration

## Component Extension Templates

### Button Variants

```typescript
// src/theme/components/Button.ts
import { defineStyleConfig } from '@chakra-ui/react';

/**
 * Extended Button component styles
 * Adds custom variants while preserving Chakra defaults
 */
export const Button = defineStyleConfig({
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'lg',
  },

  sizes: {
    xs: {
      h: 7,
      fontSize: 'xs',
      px: 3,
    },
    sm: {
      h: 8,
      fontSize: 'sm',
      px: 4,
    },
    md: {
      h: 10,
      fontSize: 'md',
      px: 6,
    },
    lg: {
      h: 12,
      fontSize: 'lg',
      px: 8,
    },
    xl: {
      h: 14,
      fontSize: 'xl',
      px: 10,
    },
  },

  variants: {
    // Custom gradient variant
    gradient: {
      bgGradient: 'linear(to-r, brand.400, brand.600)',
      color: 'white',
      _hover: {
        bgGradient: 'linear(to-r, brand.500, brand.700)',
        _disabled: {
          bgGradient: 'linear(to-r, brand.400, brand.600)',
        },
      },
    },

    // Subtle outline variant
    outline: {
      border: '2px solid',
      borderColor: 'brand.500',
      color: 'brand.500',
      _hover: {
        bg: 'brand.50',
        _dark: {
          bg: 'brand.900',
        },
      },
    },

    // Danger variant for destructive actions
    danger: {
      bg: 'red.500',
      color: 'white',
      _hover: {
        bg: 'red.600',
        _disabled: {
          bg: 'red.500',
        },
      },
      _active: {
        bg: 'red.700',
      },
    },
  },

  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
});
```

### Card Component

```typescript
// src/theme/components/Card.ts
import { cardAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

/**
 * Card component multi-part styles
 * Defines container, header, body, and footer styles
 */
const baseStyle = definePartsStyle({
  container: {
    borderRadius: 'xl',
    overflow: 'hidden',
    boxShadow: 'md',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 'lg',
    pb: 2,
  },
  body: {
    py: 4,
  },
  footer: {
    pt: 2,
    borderTopWidth: '1px',
    borderColor: 'border.muted',
  },
});

// Variants
const variants = {
  elevated: definePartsStyle({
    container: {
      boxShadow: 'xl',
      bg: 'bg.surface',
    },
  }),

  outline: definePartsStyle({
    container: {
      borderWidth: '1px',
      borderColor: 'border.default',
      boxShadow: 'none',
    },
  }),

  filled: definePartsStyle({
    container: {
      bg: 'brand.50',
      _dark: {
        bg: 'brand.900',
      },
    },
  }),
};

export const Card = defineMultiStyleConfig({
  baseStyle,
  variants,
  defaultProps: {
    variant: 'elevated',
  },
});
```

### Input/Form Components

```typescript
// src/theme/components/Input.ts
import { inputAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

/**
 * Input component styles
 * Includes field, addon, and element styling
 */
const baseStyle = definePartsStyle({
  field: {
    borderRadius: 'md',
    borderColor: 'border.default',
    _focus: {
      borderColor: 'brand.500',
      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
    },
    _invalid: {
      borderColor: 'red.500',
      boxShadow: '0 0 0 1px var(--chakra-colors-red-500)',
    },
  },
});

const sizes = {
  sm: definePartsStyle({
    field: {
      h: 8,
      fontSize: 'sm',
      px: 3,
    },
  }),
  md: definePartsStyle({
    field: {
      h: 10,
      fontSize: 'md',
      px: 4,
    },
  }),
  lg: definePartsStyle({
    field: {
      h: 12,
      fontSize: 'lg',
      px: 5,
    },
  }),
};

const variants = {
  filled: definePartsStyle({
    field: {
      bg: 'gray.100',
      _dark: {
        bg: 'gray.800',
      },
      _hover: {
        bg: 'gray.200',
        _dark: {
          bg: 'gray.700',
        },
      },
      _focus: {
        bg: 'white',
        _dark: {
          bg: 'gray.900',
        },
      },
    },
  }),
};

export const Input = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants,
  defaultProps: {
    size: 'md',
    variant: 'outline',
  },
});
```

### Modal/Dialog Components

```typescript
// src/theme/components/Modal.ts
import { modalAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(modalAnatomy.keys);

/**
 * Modal component styles
 * Customizes overlay, dialog, header, body, footer
 */
const baseStyle = definePartsStyle({
  overlay: {
    bg: 'blackAlpha.600',
    backdropFilter: 'blur(4px)',
  },
  dialog: {
    borderRadius: 'xl',
    boxShadow: '2xl',
    bg: 'bg.canvas',
  },
  header: {
    fontSize: '2xl',
    fontWeight: 'bold',
    pb: 4,
  },
  body: {
    py: 6,
  },
  footer: {
    pt: 4,
    borderTopWidth: '1px',
    borderColor: 'border.muted',
  },
  closeButton: {
    top: 4,
    right: 4,
  },
});

const sizes = {
  xs: definePartsStyle({
    dialog: { maxW: 'xs' },
  }),
  sm: definePartsStyle({
    dialog: { maxW: 'sm' },
  }),
  md: definePartsStyle({
    dialog: { maxW: 'md' },
  }),
  lg: definePartsStyle({
    dialog: { maxW: 'lg' },
  }),
  xl: definePartsStyle({
    dialog: { maxW: 'xl' },
  }),
  full: definePartsStyle({
    dialog: { maxW: '100vw', minH: '100vh', borderRadius: 0 },
  }),
};

export const Modal = defineMultiStyleConfig({
  baseStyle,
  sizes,
  defaultProps: {
    size: 'md',
  },
});
```

### Menu Component

```typescript
// src/theme/components/Menu.ts
import { menuAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(menuAnatomy.keys);

/**
 * Menu component styles
 * Customizes list, item, groupTitle, command, divider
 */
const baseStyle = definePartsStyle({
  list: {
    borderRadius: 'lg',
    boxShadow: 'xl',
    bg: 'bg.canvas',
    borderWidth: '1px',
    borderColor: 'border.default',
    py: 2,
  },
  item: {
    px: 4,
    py: 2,
    borderRadius: 'md',
    mx: 2,
    _hover: {
      bg: 'brand.50',
      _dark: {
        bg: 'brand.900',
      },
    },
    _focus: {
      bg: 'brand.50',
      _dark: {
        bg: 'brand.900',
      },
    },
  },
  groupTitle: {
    px: 4,
    py: 2,
    fontSize: 'xs',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 'wider',
    color: 'text.secondary',
  },
  command: {
    opacity: 0.6,
    fontSize: 'sm',
  },
  divider: {
    my: 2,
    borderColor: 'border.muted',
  },
});

export const Menu = defineMultiStyleConfig({
  baseStyle,
});
```

## Foundation Extensions

### Adding Custom Colors

```typescript
// src/theme/foundations/colors.ts

// Add new color palette
export const customColors = {
  // Existing colors...

  // New accent color
  accent: {
    50: '#fef5ff',
    100: '#fde6ff',
    200: '#faccff',
    300: '#f7b3ff',
    400: '#f499ff',
    500: '#e066ff',  // Primary accent
    600: '#b852cc',
    700: '#8a3e99',
    800: '#5c2966',
    900: '#2e1533',
  },
};

// Add semantic tokens
export const extendedSemanticTokens = {
  colors: {
    // Existing tokens...

    'accent.primary': { default: 'accent.500', _dark: 'accent.400' },
    'accent.subtle': { default: 'accent.50', _dark: 'accent.900' },
  },
};
```

### Custom Typography Scale

```typescript
// src/theme/foundations/typography.ts

export const customTypography = {
  // Add display font
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
    display: `'Playfair Display', serif`,  // New display font
    mono: `'Fira Code', monospace`,
  },

  // Add custom font sizes
  fontSizes: {
    // Existing sizes...
    '10xl': '10rem',   // Extra large display
    '11xl': '12rem',
  },

  // Custom text styles (reusable combinations)
  textStyles: {
    h1: {
      fontSize: { base: '4xl', md: '5xl', lg: '6xl' },
      fontWeight: 'bold',
      lineHeight: 'tight',
      letterSpacing: 'tight',
    },
    h2: {
      fontSize: { base: '3xl', md: '4xl', lg: '5xl' },
      fontWeight: 'semibold',
      lineHeight: 'tight',
    },
    body: {
      fontSize: 'md',
      lineHeight: 'relaxed',
    },
    caption: {
      fontSize: 'sm',
      color: 'text.secondary',
    },
  },
};
```

### Custom Spacing

```typescript
// src/theme/foundations/spacing.ts

export const customSpacing = {
  // Add custom spacing values
  space: {
    // Existing Chakra spacing...

    // Add custom values
    '4.5': '1.125rem',  // 18px
    '13': '3.25rem',    // 52px
    '15': '3.75rem',    // 60px
    '18': '4.5rem',     // 72px
    '100': '25rem',     // 400px
    '120': '30rem',     // 480px
  },
};
```

## Layer Styles (Reusable Style Objects)

```typescript
// src/theme/foundations/layerStyles.ts

/**
 * Layer styles - reusable style objects
 * Apply with: <Box layerStyle="card">
 */
export const layerStyles = {
  card: {
    bg: 'bg.surface',
    borderRadius: 'xl',
    boxShadow: 'md',
    p: 6,
  },

  cardHover: {
    bg: 'bg.surface',
    borderRadius: 'xl',
    boxShadow: 'md',
    p: 6,
    transition: 'all 0.2s',
    _hover: {
      boxShadow: 'xl',
      transform: 'translateY(-2px)',
    },
  },

  section: {
    py: { base: 16, md: 24 },
    px: { base: 4, md: 8, lg: 12 },
  },

  container: {
    maxW: '7xl',
    mx: 'auto',
    px: { base: 4, md: 8 },
  },
};
```

## Update Theme Index

```typescript
// src/theme/index.ts - Update with new extensions

import { extendTheme } from '@chakra-ui/react';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { Modal } from './components/Modal';
import { Menu } from './components/Menu';
import { customColors } from './foundations/colors';
import { customTypography } from './foundations/typography';
import { layerStyles } from './foundations/layerStyles';

const theme = extendTheme({
  // Foundations
  colors: customColors,
  ...customTypography,

  // Layer styles
  layerStyles,

  // Component overrides
  components: {
    Button,
    Card,
    Input,
    Modal,
    Menu,
    // Add more components as needed
  },

  // ... rest of theme config
});

export default theme;
```

## Usage Examples

```bash
# Extend theme with Button component styles
claude /theme-extend --component=Button

# Add custom color palette
claude /theme-extend --foundation=colors

# Extend typography
claude /theme-extend --foundation=typography

# Interactive mode (ask what to extend)
claude /theme-extend
```

## Component Extension Wizard

If no flags provided, prompt user:

```
What would you like to extend in your Chakra theme?

1. Add/customize a component style
2. Add custom colors
3. Extend typography
4. Add spacing tokens
5. Create layer styles (reusable style objects)
6. Add custom breakpoints

Enter your choice (1-6):
```

## Output Format

```markdown
# Theme Extension Complete!

## Changes Made

### Component: Button
- Added `gradient` variant
- Added `danger` variant
- Updated `outline` variant with dark mode support
- Added `xl` size

**File:** src/theme/components/Button.ts

### Usage Examples

```typescript
// Gradient button
<Button variant="gradient">Click me</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Extra large button
<Button size="xl">Big Action</Button>
```

## Next Steps

1. The theme has been automatically updated
2. Start using the new variants in your components
3. Run tests to ensure no regressions
4. Update your Storybook/documentation if applicable
```
