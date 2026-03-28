---
name: mui-theming
description: MUI theming system — createTheme, palette, typography, dark mode, component overrides, TypeScript augmentation, and design tokens
triggers:
  - theme
  - createTheme
  - ThemeProvider
  - dark mode
  - palette
  - typography
  - MUI theme
  - design tokens
  - color mode
  - augmentColor
  - theme overrides
  - theme composition
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
globs:
  - "*.ts"
  - "*.tsx"
  - "theme*.ts"
  - "theme*.tsx"
  - "**/theme/**"
---

# MUI Theming Skill

## createTheme() API

The `createTheme` function is the entry point for all MUI customization. It accepts a deeply partial theme object and merges it with the defaults.

```tsx
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: { ... },
  typography: { ... },
  spacing: 8,          // base spacing unit in px (default: 8)
  shape: { borderRadius: 8 },
  breakpoints: { ... },
  shadows: [...],
  transitions: { ... },
  zIndex: { ... },
});
```

---

## Palette

### Standard palette colors

```tsx
const theme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#3f50b5',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
    error:   { main: '#d32f2f' },
    warning: { main: '#ed6c02' },
    info:    { main: '#0288d1' },
    success: { main: '#2e7d32' },
  },
});
```

MUI auto-generates `light`, `dark`, and `contrastText` from `main` if you omit them.

### Custom palette colors with augmentColor

```tsx
const theme = createTheme({
  palette: {
    // augmentColor adds light/dark/contrastText automatically
    neutral: theme.palette.augmentColor({
      color: { main: '#64748b' },
      name: 'neutral',
    }),
    brand: theme.palette.augmentColor({
      color: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
      name: 'brand',
    }),
  },
});
```

Use a two-step createTheme call when augmentColor needs the base theme:

```tsx
let theme = createTheme();
theme = createTheme(theme, {
  palette: {
    salmon: theme.palette.augmentColor({
      color: { main: '#FF5733' },
      name: 'salmon',
    }),
  },
});
```

### Background and text

```tsx
palette: {
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0,0,0,0.87)',
    secondary: 'rgba(0,0,0,0.6)',
    disabled: 'rgba(0,0,0,0.38)',
  },
  divider: 'rgba(0,0,0,0.12)',
  action: {
    active: 'rgba(0,0,0,0.54)',
    hover: 'rgba(0,0,0,0.04)',
    selected: 'rgba(0,0,0,0.08)',
    disabled: 'rgba(0,0,0,0.26)',
    disabledBackground: 'rgba(0,0,0,0.12)',
    focus: 'rgba(0,0,0,0.12)',
  },
},
```

---

## Typography

```tsx
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,             // base font size (rem calculation root)
    htmlFontSize: 16,         // <html> font size for rem calculations
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01562em' },
    h2: { fontSize: '2rem',   fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem',   fontWeight: 600, lineHeight: 1.6 },

    subtitle1: { fontSize: '1rem',    fontWeight: 400, lineHeight: 1.75 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '1rem',    fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.43 },
    button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' }, // disable ALL_CAPS
    caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.66 },
    overline: { fontSize: '0.75rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08333em' },
  },
});
```

### Responsive typography

```tsx
typography: {
  h1: {
    fontSize: '2rem',
    [theme.breakpoints.up('md')]: { fontSize: '3rem' },
    [theme.breakpoints.up('lg')]: { fontSize: '4rem' },
  },
},
```

---

## Spacing

The spacing scale is factor-based. Default unit is 8px.

```tsx
const theme = createTheme({ spacing: 8 }); // default

theme.spacing(1)   // '8px'
theme.spacing(2)   // '16px'
theme.spacing(0.5) // '4px'
theme.spacing(1, 2)        // '8px 16px'
theme.spacing(1, 2, 3, 4)  // '8px 16px 24px 32px'

// Custom spacing function
const theme = createTheme({
  spacing: (factor: number) => `${0.25 * factor}rem`,
});
```

---

## Breakpoints

```tsx
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      // Add custom breakpoints:
      mobile: 0,
      tablet: 640,
      laptop: 1024,
      desktop: 1200,
    },
  },
});

// Usage in sx
<Box sx={{ fontSize: { xs: '1rem', md: '1.5rem', lg: '2rem' } }} />

// Usage in styles
theme.breakpoints.up('md')      // '@media (min-width:900px)'
theme.breakpoints.down('md')    // '@media (max-width:899.95px)'
theme.breakpoints.between('sm', 'md') // '@media (min-width:600px) and (max-width:899.95px)'
theme.breakpoints.only('md')    // '@media (min-width:900px) and (max-width:1199.95px)'
```

---

## Shape, Shadows, Transitions, zIndex

```tsx
const theme = createTheme({
  shape: {
    borderRadius: 8,  // default: 4
  },
  // shadows[0] = 'none', shadows[1-24] = elevation levels
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    // ... (24 levels total — override individual elevations selectively)
    ...Array(23).fill('none'),
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});
```

---

## ThemeProvider and CssBaseline

```tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({ ... });

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline normalizes browser styles and sets body background */}
      <CssBaseline />
      <YourApp />
    </ThemeProvider>
  );
}
```

---

## Dark Mode

### Static dark mode

```tsx
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    // MUI auto-adjusts all palette colors for dark mode
    // Override as needed:
    primary: { main: '#90caf9' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
```

### Dynamic dark mode with ColorModeContext

```tsx
import React, { createContext, useContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create context
const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function useColorMode() {
  return useContext(ColorModeContext);
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

// In a component:
function DarkModeToggle() {
  const { toggleColorMode } = useColorMode();
  return <IconButton onClick={toggleColorMode}><Brightness4Icon /></IconButton>;
}
```

### System preference detection

```tsx
import useMediaQuery from '@mui/material/useMediaQuery';

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(
    prefersDark ? 'dark' : 'light'
  );

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  // ...
}
```

---

## Component-Level Overrides

### styleOverrides

Override CSS for specific component slots:

```tsx
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          ...(theme.palette.mode === 'dark' && {
            backgroundColor: theme.palette.grey[900],
          }),
        }),
      },
    },
  },
});
```

### defaultProps

Set default prop values for all instances of a component:

```tsx
const theme = createTheme({
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        fullWidth: true,
      },
    },
    MuiCircularProgress: {
      defaultProps: {
        size: 24,
        thickness: 4,
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
  },
});
```

### Custom variants

Add new named variants to existing components:

```tsx
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'dashed' },
          style: {
            border: '2px dashed currentColor',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.04)',
            },
          },
        },
        {
          props: { variant: 'gradient' },
          style: ({ theme }) => ({
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            border: 'none',
          }),
        },
      ],
    },
  },
});
```

---

## Nested Themes and Theme Composition

```tsx
// Merge two themes
import { deepmerge } from '@mui/utils';

const baseTheme = createTheme({ ... });
const extendedTheme = createTheme(deepmerge(baseTheme, {
  typography: { h1: { fontSize: '3rem' } },
}));

// Nested ThemeProvider (child theme overrides parent locally)
function AdminPanel() {
  const parentTheme = useTheme();
  const adminTheme = createTheme(parentTheme, {
    palette: {
      primary: { main: '#dc2626' }, // red for admin
    },
  });

  return (
    <ThemeProvider theme={adminTheme}>
      <AdminUI />
    </ThemeProvider>
  );
}
```

---

## TypeScript Module Augmentation

Extend the theme types to support custom colors and variables:

```tsx
// theme-augmentation.d.ts (or in your theme file)
import '@mui/material/styles';
import '@mui/material/Button';

declare module '@mui/material/styles' {
  // Add custom palette colors
  interface Palette {
    neutral: Palette['primary'];
    brand: Palette['primary'];
    custom: {
      gradientStart: string;
      gradientEnd: string;
    };
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
    brand?: PaletteOptions['primary'];
    custom?: {
      gradientStart?: string;
      gradientEnd?: string;
    };
  }

  // Add custom theme variables
  interface Theme {
    custom: {
      navHeight: number;
      sidebarWidth: number;
    };
  }
  interface ThemeOptions {
    custom?: {
      navHeight?: number;
      sidebarWidth?: number;
    };
  }

  // Extend typography variants
  interface TypographyVariants {
    code: React.CSSProperties;
    label: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    code?: React.CSSProperties;
    label?: React.CSSProperties;
  }
}

// Allow usage of custom variants on Typography component
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    code: true;
    label: true;
  }
}

// Allow usage of custom palette colors on Button
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
    brand: true;
  }
}
```

With augmentation in place, usage is fully typed:

```tsx
const theme = createTheme({
  palette: {
    neutral: theme.palette.augmentColor({ color: { main: '#64748b' }, name: 'neutral' }),
    custom: { gradientStart: '#667eea', gradientEnd: '#764ba2' },
  },
  custom: { navHeight: 64, sidebarWidth: 240 },
  typography: {
    code: { fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.06)' },
  },
});

// Fully typed:
<Button color="neutral">Neutral Button</Button>
<Typography variant="code">const x = 1;</Typography>
const navH = theme.custom.navHeight; // typed as number
```

---

## Design Token Patterns

Centralize all design decisions as named tokens, then reference them throughout the theme:

```tsx
// design-tokens.ts
export const tokens = {
  color: {
    brand: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      900: '#0f172a',
    },
    semantic: {
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", monospace',
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const;

// theme.ts
import { createTheme } from '@mui/material/styles';
import { tokens } from './design-tokens';

export const theme = createTheme({
  palette: {
    primary: {
      light: tokens.color.brand[100],
      main: tokens.color.brand[500],
      dark: tokens.color.brand[900],
    },
    success: { main: tokens.color.semantic.success },
    warning: { main: tokens.color.semantic.warning },
    error:   { main: tokens.color.semantic.error },
    info:    { main: tokens.color.semantic.info },
  },
  typography: {
    fontFamily: tokens.typography.fontFamily.sans,
    h1: { fontSize: tokens.typography.scale['4xl'] },
    h2: { fontSize: tokens.typography.scale['3xl'] },
    h3: { fontSize: tokens.typography.scale['2xl'] },
    body1: { fontSize: tokens.typography.scale.base },
    body2: { fontSize: tokens.typography.scale.sm },
  },
  shape: { borderRadius: tokens.radius.md },
  spacing: (factor: number) => `${tokens.spacing.xs * factor}px`,
});
```

---

## Complete Theme Example

```tsx
// theme/index.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    error:     { main: '#dc2626' },
    warning:   { main: '#d97706' },
    info:      { main: '#0284c7' },
    success:   { main: '#16a34a' },
    background: { default: '#f8fafc', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    fontWeightBold: 700,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid', borderColor: 'divider', borderRadius: 12 },
      },
    },
  },
});

// Automatically scale typography for different screen sizes
theme = responsiveFontSizes(theme);

export default theme;
```
