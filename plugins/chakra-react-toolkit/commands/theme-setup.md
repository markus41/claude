---
name: theme-setup
description: Initialize Chakra theme with design tokens
argument-hint: "[--preset=minimal|complete|tailwind-like] [--output=path]"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# Chakra Theme Setup Command

When this command is invoked, create a comprehensive Chakra UI theme configuration with design tokens, including colors, typography, spacing, and component style overrides.

## Execution Steps

1. **Determine Theme Preset**
   - Use --preset flag if provided (minimal, complete, tailwind-like)
   - Default to "complete" preset if not specified
   - Ask user for confirmation before generating extensive theme

2. **Create Theme Directory Structure**
   - Default location: `src/theme/` or use --output path
   - Structure: foundations/, components/, index.ts
   - Validate directory doesn't already exist or ask to overwrite

3. **Generate Theme Files**
   - Create foundation files (colors, typography, spacing, etc.)
   - Create component style overrides (optional based on preset)
   - Create main theme index file
   - Generate TypeScript types for theme tokens

4. **Update App Configuration**
   - Show instructions to wrap app with ChakraProvider
   - Provide import statement for custom theme
   - Optionally update main app file if user confirms

## Theme Presets

### Preset 1: Minimal (Quick Start)

```typescript
// src/theme/index.ts
import { extendTheme } from '@chakra-ui/react';

/**
 * Minimal Chakra UI theme
 * Includes basic color palette and minimal overrides
 */
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f2ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6',  // Primary brand color
      600: '#005bb3',
      700: '#004480',
      800: '#002d4d',
      900: '#00161a',
    },
  },
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
```

### Preset 2: Complete (Production-Ready)

Directory structure:
```
src/theme/
├── index.ts                 # Main theme export
├── foundations/
│   ├── colors.ts           # Color palette
│   ├── typography.ts       # Fonts, sizes, line heights
│   ├── spacing.ts          # Spacing scale
│   ├── shadows.ts          # Box shadows
│   ├── breakpoints.ts      # Responsive breakpoints
│   └── radii.ts            # Border radius values
├── components/
│   ├── Button.ts           # Button component styles
│   ├── Input.ts            # Input component styles
│   ├── Card.ts             # Card component styles
│   └── index.ts            # Component overrides export
└── types/
    └── theme.d.ts          # TypeScript theme types
```

#### colors.ts
```typescript
/**
 * Color palette with semantic tokens
 *
 * Brand colors: Primary brand identity
 * Semantic colors: Success, error, warning, info states
 * Neutral colors: Text, backgrounds, borders
 */
export const colors = {
  // Brand colors
  brand: {
    50: '#e6f2ff',
    100: '#b3d9ff',
    200: '#80bfff',
    300: '#4da6ff',
    400: '#1a8cff',
    500: '#0073e6',  // Primary
    600: '#005bb3',
    700: '#004480',
    800: '#002d4d',
    900: '#00161a',
  },

  // Semantic colors
  success: {
    50: '#e6f9f0',
    100: '#b3eed4',
    200: '#80e3b8',
    300: '#4dd89c',
    400: '#1acd80',
    500: '#00b366',  // Success green
    600: '#008c50',
    700: '#00663a',
    800: '#004024',
    900: '#001a0e',
  },

  error: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: '#e60000',  // Error red
    600: '#b30000',
    700: '#800000',
    800: '#4d0000',
    900: '#1a0000',
  },

  warning: {
    50: '#fff9e6',
    100: '#ffecb3',
    200: '#ffdf80',
    300: '#ffd24d',
    400: '#ffc51a',
    500: '#e6a800',  // Warning yellow
    600: '#b38300',
    700: '#805e00',
    800: '#4d3900',
    900: '#1a1400',
  },

  // Neutral grays
  gray: {
    50: '#f7f8fa',
    100: '#e4e7eb',
    200: '#cbd2d9',
    300: '#9aa5b1',
    400: '#7b8794',
    500: '#616e7c',
    600: '#52606d',
    700: '#3e4c59',
    800: '#323f4b',
    900: '#1f2933',
  },
};

/**
 * Semantic color tokens mapped to palette
 * Use these for consistent theming
 */
export const semanticTokens = {
  colors: {
    'text.primary': { default: 'gray.900', _dark: 'gray.50' },
    'text.secondary': { default: 'gray.600', _dark: 'gray.400' },
    'text.tertiary': { default: 'gray.500', _dark: 'gray.500' },
    'bg.canvas': { default: 'white', _dark: 'gray.900' },
    'bg.surface': { default: 'gray.50', _dark: 'gray.800' },
    'border.default': { default: 'gray.200', _dark: 'gray.700' },
    'border.muted': { default: 'gray.100', _dark: 'gray.800' },
  },
};
```

#### typography.ts
```typescript
/**
 * Typography system
 * Includes fonts, font sizes, line heights, and letter spacing
 */
export const typography = {
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
    mono: `'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace`,
  },

  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem',     // 128px
  },

  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};
```

#### components/Button.ts
```typescript
import { defineStyleConfig } from '@chakra-ui/react';

/**
 * Button component style overrides
 * Defines variants, sizes, and default styles
 */
export const Button = defineStyleConfig({
  // Base styles applied to all buttons
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    transition: 'all 0.2s',
    _focus: {
      boxShadow: 'outline',
    },
  },

  // Size variants
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 2,
      h: 8,
    },
    md: {
      fontSize: 'md',
      px: 6,
      py: 3,
      h: 10,
    },
    lg: {
      fontSize: 'lg',
      px: 8,
      py: 4,
      h: 12,
    },
  },

  // Style variants
  variants: {
    solid: {
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
        _disabled: {
          bg: 'brand.500',
        },
      },
      _active: {
        bg: 'brand.700',
      },
    },
    outline: {
      borderWidth: '2px',
      borderColor: 'brand.500',
      color: 'brand.500',
      _hover: {
        bg: 'brand.50',
      },
      _active: {
        bg: 'brand.100',
      },
    },
    ghost: {
      color: 'brand.500',
      _hover: {
        bg: 'brand.50',
      },
      _active: {
        bg: 'brand.100',
      },
    },
  },

  // Default values
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
});
```

#### index.ts (Complete preset)
```typescript
import { extendTheme } from '@chakra-ui/react';
import { colors, semanticTokens } from './foundations/colors';
import { typography } from './foundations/typography';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { Card } from './components/Card';

/**
 * Custom Chakra UI theme
 *
 * Extends the default Chakra theme with:
 * - Custom color palette and semantic tokens
 * - Typography system (fonts, sizes, weights)
 * - Component style overrides
 * - Responsive breakpoints
 * - Design tokens for consistent styling
 *
 * @see https://chakra-ui.com/docs/styled-system/customize-theme
 */
const theme = extendTheme({
  // Design tokens
  colors,
  semanticTokens,
  ...typography,

  // Spacing scale (default is fine, but can override)
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },

  // Border radius
  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Box shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '30em',   // 480px
    md: '48em',   // 768px
    lg: '62em',   // 992px
    xl: '80em',   // 1280px
    '2xl': '96em', // 1536px
  },

  // Component style overrides
  components: {
    Button,
    Input,
    Card,
  },

  // Global styles
  styles: {
    global: {
      body: {
        bg: 'bg.canvas',
        color: 'text.primary',
      },
    },
  },

  // Theme configuration
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

export default theme;
```

### Preset 3: Tailwind-like

```typescript
/**
 * Tailwind CSS-inspired Chakra theme
 * Mimics Tailwind's color palette and design tokens
 */
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    // Tailwind color palette
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // ... include full Tailwind palette (gray, zinc, neutral, stone, red, orange, amber, etc.)
  },

  fontFamily: {
    sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    serif: ['ui-serif', 'Georgia', 'serif'],
    mono: ['ui-monospace', 'Menlo', 'monospace'],
  },

  // Tailwind-like spacing (4px base)
  space: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    // ... continue Tailwind spacing scale
  },
});

export default theme;
```

## TypeScript Type Generation

```typescript
// src/theme/types/theme.d.ts
import '@chakra-ui/react';

/**
 * Extend Chakra UI theme types with custom tokens
 * This enables TypeScript autocomplete for custom theme values
 */
declare module '@chakra-ui/react' {
  export interface CustomColors {
    brand: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    // Add other custom color scales
  }
}
```

## App Integration Template

```typescript
// src/App.tsx or src/main.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      {/* Your app components */}
    </ChakraProvider>
  );
}

export default App;
```

## Color Mode Setup

```typescript
// src/components/ColorModeToggle.tsx
import { IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

/**
 * Toggle button for light/dark mode
 * Uses Chakra's built-in color mode management
 */
export function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
}
```

## Usage Examples

```bash
# Initialize with default (complete) preset
claude /theme-setup

# Initialize minimal theme
claude /theme-setup --preset=minimal

# Initialize Tailwind-like theme
claude /theme-setup --preset=tailwind-like

# Custom output directory
claude /theme-setup --output=src/styles/theme
```

## Post-Setup Instructions

After generating theme files, provide user with:

```markdown
# Theme Setup Complete!

Your Chakra UI theme has been created at: `src/theme/`

## Next Steps

1. **Update your app entry point** (e.g., src/main.tsx or src/App.tsx):
   ```typescript
   import { ChakraProvider } from '@chakra-ui/react';
   import theme from './theme';

   <ChakraProvider theme={theme}>
     <App />
   </ChakraProvider>
   ```

2. **Use theme tokens in components**:
   ```typescript
   <Box bg="brand.500" color="white" p={4}>
     Styled with theme tokens
   </Box>
   ```

3. **Extend the theme** as needed:
   ```bash
   claude /theme-extend --component=Badge
   ```

4. **Enable dark mode** (optional):
   - Color mode toggle component created at: src/components/ColorModeToggle.tsx
   - Add to your app layout

## Documentation
- Theme documentation: https://chakra-ui.com/docs/styled-system/customize-theme
- Color mode guide: https://chakra-ui.com/docs/styled-system/color-mode
```
