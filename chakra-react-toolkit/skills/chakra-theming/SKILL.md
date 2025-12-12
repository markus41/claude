# Chakra UI Theming and Design Tokens

This skill activates when customizing Chakra UI themes, implementing design systems, configuring color modes, extending component styles, or working with design tokens. It provides comprehensive guidance on theme architecture, semantic tokens, global styles, and dark mode implementation for Chakra UI v2 applications.

## Theme Foundation

### Creating a Custom Theme

Use `extendTheme` to customize the default Chakra theme while preserving base functionality:

```tsx
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color mode configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Custom theme object
const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e3f2f9',
      100: '#c5e4f3',
      200: '#a2d4ec',
      300: '#7ac1e4',
      400: '#47a9da',
      500: '#0088cc',
      600: '#007ab8',
      700: '#006ba1',
      800: '#005885',
      900: '#003f5e',
    },
  },
  fonts: {
    heading: `'Inter', sans-serif`,
    body: `'Inter', sans-serif`,
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
  },
  breakpoints: {
    base: '0em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
});

export default theme;
```

### Applying the Theme

Wrap your application with `ChakraProvider` and pass the custom theme:

```tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <YourApp />
    </ChakraProvider>
  );
}
```

## Design Tokens

### Color Tokens

Define color palettes with numeric scales (50-900) for light to dark shades:

```tsx
const theme = extendTheme({
  colors: {
    // Brand colors
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Semantic colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
});

// Usage in components
<Box bg="brand.500" color="white">Brand colored box</Box>
<Text color="gray.600">Muted text</Text>
<Button colorScheme="brand">Brand button</Button>
```

### Semantic Tokens

Use semantic tokens for color mode-aware values:

```tsx
const theme = extendTheme({
  semanticTokens: {
    colors: {
      // Text colors
      'text.primary': {
        default: 'gray.900',
        _dark: 'gray.50',
      },
      'text.secondary': {
        default: 'gray.600',
        _dark: 'gray.400',
      },
      'text.muted': {
        default: 'gray.500',
        _dark: 'gray.500',
      },

      // Background colors
      'bg.canvas': {
        default: 'white',
        _dark: 'gray.900',
      },
      'bg.surface': {
        default: 'gray.50',
        _dark: 'gray.800',
      },
      'bg.elevated': {
        default: 'white',
        _dark: 'gray.700',
      },

      // Border colors
      'border.default': {
        default: 'gray.200',
        _dark: 'gray.700',
      },
      'border.muted': {
        default: 'gray.100',
        _dark: 'gray.800',
      },

      // Interactive colors
      'interactive.default': {
        default: 'brand.500',
        _dark: 'brand.400',
      },
      'interactive.hover': {
        default: 'brand.600',
        _dark: 'brand.300',
      },
    },
  },
});

// Usage - automatically adapts to color mode
<Box bg="bg.canvas" borderColor="border.default">
  <Text color="text.primary">Primary text</Text>
  <Text color="text.secondary">Secondary text</Text>
</Box>
```

### Spacing Tokens

Customize spacing scale for consistent padding and margin:

```tsx
const theme = extendTheme({
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
});
```

### Typography Tokens

Define font families, sizes, weights, and line heights:

```tsx
const theme = extendTheme({
  fonts: {
    heading: `'Poppins', sans-serif`,
    body: `'Inter', sans-serif`,
    mono: `'JetBrains Mono', monospace`,
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
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
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
});
```

### Shadow Tokens

Customize elevation shadows for depth:

```tsx
const theme = extendTheme({
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    none: 'none',
    // Dark mode shadows
    'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
  },
});
```

## Color Mode Configuration

### Setting Up Dark Mode

Configure color mode behavior and provide toggle functionality:

```tsx
// theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light', // 'light' | 'dark' | 'system'
  useSystemColorMode: false,  // Use OS preference
};

const theme = extendTheme({
  config,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        color: props.colorMode === 'dark' ? 'gray.50' : 'gray.900',
      },
    }),
  },
});

export default theme;
```

### Color Mode Toggle

Implement a dark mode toggle button:

```tsx
import { IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const icon = useColorModeValue(<MoonIcon />, <SunIcon />);

  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={icon}
      onClick={toggleColorMode}
      variant="ghost"
    />
  );
}

// Alternative with manual color mode values
function ColorModeToggleAlt() {
  const { toggleColorMode } = useColorMode();
  const bg = useColorModeValue('gray.100', 'gray.700');
  const color = useColorModeValue('gray.800', 'gray.100');

  return (
    <IconButton
      aria-label="Toggle dark mode"
      icon={<MoonIcon />}
      onClick={toggleColorMode}
      bg={bg}
      color={color}
    />
  );
}
```

### Color Mode Values

Use `useColorModeValue` for component-level color mode support:

```tsx
import { Box, useColorModeValue } from '@chakra-ui/react';

function Card() {
  // Returns first value in light mode, second in dark mode
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'gray.50');
  const shadowColor = useColorModeValue('md', 'dark-lg');

  return (
    <Box
      bg={bg}
      borderColor={borderColor}
      color={textColor}
      shadow={shadowColor}
      borderWidth="1px"
      borderRadius="lg"
      p={6}
    >
      Content adapts to color mode
    </Box>
  );
}

// Or use semantic tokens (preferred)
function CardWithSemanticTokens() {
  return (
    <Box
      bg="bg.surface"
      borderColor="border.default"
      color="text.primary"
      borderWidth="1px"
      borderRadius="lg"
      p={6}
    >
      Content with semantic tokens
    </Box>
  );
}
```

### Color Mode Script

Add color mode script to prevent flash of unstyled content:

```tsx
// pages/_document.tsx (Next.js)
import { ColorModeScript } from '@chakra-ui/react';
import NextDocument, { Html, Head, Main, NextScript } from 'next/document';
import theme from '../theme';

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

// Or in index.html (Vite/CRA)
// <script>
//   (function() {
//     try {
//       var mode = localStorage.getItem('chakra-ui-color-mode');
//       if (!mode) return;
//       document.documentElement.dataset.theme = mode;
//       document.documentElement.style.colorScheme = mode;
//     } catch (e) {}
//   })();
// </script>
```

## Component Style Customization

### Single Part Components

Customize components with single-part anatomy:

```tsx
const theme = extendTheme({
  components: {
    Button: {
      // Base styles applied to all variants
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
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
        },
        md: {
          fontSize: 'md',
          px: 6,
          py: 3,
        },
        lg: {
          fontSize: 'lg',
          px: 8,
          py: 4,
        },
      },
      // Style variants
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500',
            },
          },
        },
        secondary: {
          bg: 'gray.200',
          color: 'gray.800',
          _hover: {
            bg: 'gray.300',
          },
        },
        ghost: {
          bg: 'transparent',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
      // Default values
      defaultProps: {
        size: 'md',
        variant: 'primary',
      },
    },
  },
});

// Usage
<Button variant="primary" size="lg">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="ghost" size="sm">Ghost Button</Button>
```

### Multi-Part Components

Customize components with multiple parts:

```tsx
import { defineStyleConfig, createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { cardAnatomy } from '@chakra-ui/anatomy';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

// Define styles for each part
const baseStyle = definePartsStyle({
  container: {
    bg: 'bg.surface',
    borderColor: 'border.default',
    borderRadius: 'lg',
  },
  header: {
    paddingBottom: 2,
    borderBottomWidth: '1px',
    borderColor: 'border.muted',
  },
  body: {
    paddingTop: 4,
  },
  footer: {
    paddingTop: 2,
    borderTopWidth: '1px',
    borderColor: 'border.muted',
  },
});

// Define variants
const variants = {
  elevated: definePartsStyle({
    container: {
      shadow: 'lg',
      borderWidth: '0',
    },
  }),
  outline: definePartsStyle({
    container: {
      borderWidth: '1px',
      shadow: 'none',
    },
  }),
  filled: definePartsStyle({
    container: {
      bg: 'gray.100',
      _dark: {
        bg: 'gray.700',
      },
    },
  }),
};

export const cardTheme = defineMultiStyleConfig({
  baseStyle,
  variants,
  defaultProps: {
    variant: 'elevated',
  },
});

// Apply to theme
const theme = extendTheme({
  components: {
    Card: cardTheme,
  },
});
```

### Component Default Props

Override default props for components:

```tsx
const theme = extendTheme({
  components: {
    Button: {
      defaultProps: {
        size: 'lg',
        colorScheme: 'brand',
      },
    },
    Input: {
      defaultProps: {
        size: 'md',
        variant: 'filled',
        focusBorderColor: 'brand.500',
      },
    },
    Heading: {
      defaultProps: {
        size: 'xl',
      },
    },
  },
});
```

## Global Styles

### Base Styles

Define global styles that apply throughout your application:

```tsx
const theme = extendTheme({
  styles: {
    global: (props) => ({
      // Root styles
      'html, body': {
        fontSize: 'md',
        color: props.colorMode === 'dark' ? 'gray.50' : 'gray.900',
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
        lineHeight: 'tall',
      },

      // Typography
      'h1, h2, h3, h4, h5, h6': {
        fontFamily: 'heading',
        fontWeight: 'bold',
      },

      // Links
      a: {
        color: props.colorMode === 'dark' ? 'brand.300' : 'brand.500',
        _hover: {
          textDecoration: 'underline',
        },
      },

      // Selection
      '::selection': {
        bg: props.colorMode === 'dark' ? 'brand.700' : 'brand.200',
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
      },

      // Scrollbar (webkit)
      '::-webkit-scrollbar': {
        width: '12px',
      },
      '::-webkit-scrollbar-track': {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
      },
      '::-webkit-scrollbar-thumb': {
        bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.400',
        borderRadius: 'full',
        border: '3px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
      },
    }),
  },
});
```

### Layer Styles

Define reusable layer styles for common patterns:

```tsx
const theme = extendTheme({
  layerStyles: {
    card: {
      bg: 'bg.surface',
      borderRadius: 'lg',
      borderWidth: '1px',
      borderColor: 'border.default',
      shadow: 'sm',
    },
    cardHover: {
      bg: 'bg.surface',
      borderRadius: 'lg',
      borderWidth: '1px',
      borderColor: 'border.default',
      shadow: 'sm',
      transition: 'all 0.2s',
      _hover: {
        shadow: 'lg',
        transform: 'translateY(-2px)',
      },
    },
    navbar: {
      bg: 'bg.elevated',
      borderBottom: '1px',
      borderColor: 'border.default',
      shadow: 'sm',
    },
  },
});

// Usage
<Box layerStyle="card" p={6}>
  Card content
</Box>
<Box layerStyle="cardHover" p={6}>
  Interactive card
</Box>
```

### Text Styles

Define reusable text styles:

```tsx
const theme = extendTheme({
  textStyles: {
    h1: {
      fontSize: ['4xl', '5xl', '6xl'],
      fontWeight: 'bold',
      lineHeight: 'shorter',
      letterSpacing: 'tight',
    },
    h2: {
      fontSize: ['3xl', '4xl', '5xl'],
      fontWeight: 'bold',
      lineHeight: 'short',
      letterSpacing: 'tight',
    },
    body: {
      fontSize: 'md',
      lineHeight: 'tall',
    },
    caption: {
      fontSize: 'sm',
      lineHeight: 'base',
      color: 'text.secondary',
    },
  },
});

// Usage
<Text textStyle="h1">Heading</Text>
<Text textStyle="body">Body text</Text>
<Text textStyle="caption">Caption text</Text>
```

## Advanced Theme Patterns

### Multi-Brand Themes

Support multiple brands with theme switching:

```tsx
// themes/brand-a.ts
export const brandATheme = extendTheme({
  colors: {
    brand: { /* Brand A colors */ },
  },
});

// themes/brand-b.ts
export const brandBTheme = extendTheme({
  colors: {
    brand: { /* Brand B colors */ },
  },
});

// App.tsx
import { useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';

function App() {
  const [currentTheme, setCurrentTheme] = useState(brandATheme);

  return (
    <ChakraProvider theme={currentTheme}>
      <YourApp onThemeChange={setCurrentTheme} />
    </ChakraProvider>
  );
}
```

### Responsive Typography

Configure responsive font sizes globally:

```tsx
const theme = extendTheme({
  styles: {
    global: {
      html: {
        fontSize: { base: '14px', md: '16px', lg: '18px' },
      },
    },
  },
  textStyles: {
    responsive: {
      fontSize: { base: 'sm', md: 'md', lg: 'lg' },
    },
  },
});
```

Use these theming patterns to create consistent, maintainable design systems that scale with your application needs and support multiple color modes seamlessly.
