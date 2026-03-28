---
name: css-variables-pigment
description: MUI CSS Variables mode (CssVarsProvider), Pigment CSS zero-runtime engine, and CSS custom properties theming
triggers:
  - CSS variables
  - CssVarsProvider
  - Pigment CSS
  - zero-runtime
  - css custom properties
  - extendTheme
  - colorSchemes
  - getInitColorSchemeScript
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
  - "theme*.ts"
  - "theme*.tsx"
---

# MUI CSS Variables & Pigment CSS Skill

## 1. CssVarsProvider (MUI v6)

`CssVarsProvider` replaces `ThemeProvider` when you want CSS-variable-based theming. Instead of injecting theme values into a JS context that triggers React re-renders on change, it emits CSS custom properties on the root element. Color scheme switches happen in CSS alone — no React tree re-render.

### Basic setup

```tsx
import { CssVarsProvider, extendTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        background: { default: '#fafafa' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        background: { default: '#121212' },
      },
    },
  },
});

function App() {
  return (
    <CssVarsProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {/* your app */}
    </CssVarsProvider>
  );
}
```

### Key differences from ThemeProvider

| Feature | ThemeProvider + createTheme | CssVarsProvider + extendTheme |
|---------|---------------------------|------------------------------|
| Theme values in CSS | No (JS only) | Yes (CSS custom properties) |
| Dark/light toggle | Re-renders entire tree | CSS-only, no re-render |
| SSR flash prevention | Requires manual script | Built-in `getInitColorSchemeScript()` |
| Theme access in sx/styled | `theme.palette.primary.main` | `theme.vars.palette.primary.main` or `var(--mui-palette-primary-main)` |
| Multiple color schemes | Separate themes, context switch | Single theme object with `colorSchemes` |

---

## 2. extendTheme() vs createTheme()

### createTheme()

Traditional API. Produces a theme object consumed by `ThemeProvider`. No CSS variables emitted. Good for projects that do not need CSS-variable-based theming or SSR flash prevention.

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
  },
});

// Used with <ThemeProvider theme={theme}>
```

### extendTheme()

Produces a CSS-variable-aware theme for `CssVarsProvider`. Accepts `colorSchemes` to define light and dark palettes in a single object. Automatically generates CSS custom properties.

```tsx
import { extendTheme, CssVarsProvider } from '@mui/material/styles';

const theme = extendTheme({
  cssVarPrefix: 'app',           // default: 'mui'
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#9c27b0' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        secondary: { main: '#ce93d8' },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", sans-serif',
  },
  shape: { borderRadius: 12 },
});

// Used with <CssVarsProvider theme={theme}>
```

### When to use which

- **Use `extendTheme` + `CssVarsProvider`** when:
  - You need SSR without flash-of-wrong-theme
  - You want CSS-only dark mode toggling (no re-renders)
  - You embed MUI components in non-React contexts (CSS vars work everywhere)
  - You want to reference theme tokens in plain CSS files
  - You are on MUI v6+

- **Use `createTheme` + `ThemeProvider`** when:
  - Migrating from MUI v4/v5 and not ready to switch
  - Using third-party libraries that depend on `ThemeProvider` context
  - Your app has a single color scheme and does not need SSR

---

## 3. colorSchemes Configuration

`colorSchemes` replaces the `palette.mode` approach. Define all schemes in one object:

```tsx
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1565c0', light: '#1976d2', dark: '#0d47a1' },
        secondary: { main: '#7b1fa2' },
        error: { main: '#d32f2f' },
        warning: { main: '#ed6c02' },
        info: { main: '#0288d1' },
        success: { main: '#2e7d32' },
        background: { default: '#ffffff', paper: '#f5f5f5' },
        text: { primary: '#1a1a1a', secondary: '#666666' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9', light: '#bbdefb', dark: '#42a5f5' },
        secondary: { main: '#ce93d8' },
        error: { main: '#f44336' },
        warning: { main: '#ffa726' },
        info: { main: '#29b6f6' },
        success: { main: '#66bb6a' },
        background: { default: '#121212', paper: '#1e1e1e' },
        text: { primary: '#ffffff', secondary: '#b0b0b0' },
      },
    },
  },
});
```

### Custom color schemes beyond light/dark

You can define additional schemes. The first key is treated as the default:

```tsx
const theme = extendTheme({
  colorSchemes: {
    light: { palette: { /* ... */ } },
    dark: { palette: { /* ... */ } },
    highContrast: {
      palette: {
        primary: { main: '#ffff00' },
        background: { default: '#000000', paper: '#111111' },
        text: { primary: '#ffffff' },
      },
    },
  },
});

// Switch to it:
const { setMode } = useColorScheme();
setMode('highContrast');
```

### Default color scheme

```tsx
<CssVarsProvider theme={theme} defaultMode="dark">
  {/* Renders with dark scheme initially */}
</CssVarsProvider>
```

Supported `defaultMode` values: `'light'`, `'dark'`, `'system'` (follows OS preference).

---

## 4. SSR Flash Prevention with getInitColorSchemeScript()

Without this script, SSR apps show the default (light) theme briefly before hydration applies the user's preferred scheme. The script injects a blocking `<script>` that reads `localStorage` (or OS preference) and sets the `data-*` attribute before first paint.

### Next.js App Router (layout.tsx)

```tsx
import { getInitColorSchemeScript } from '@mui/material/styles';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript({ defaultMode: 'system' })}
        {children}
      </body>
    </html>
  );
}
```

### Next.js Pages Router (_document.tsx)

```tsx
import { getInitColorSchemeScript } from '@mui/material/styles';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {getInitColorSchemeScript({ defaultMode: 'system' })}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Configuration options

```tsx
getInitColorSchemeScript({
  defaultMode: 'system',              // 'light' | 'dark' | 'system'
  modeStorageKey: 'app-color-mode',   // localStorage key (default: 'mui-mode')
  colorSchemeStorageKey: 'app-scheme', // localStorage key for scheme
  attribute: 'data-app-color-scheme', // HTML attribute set on root element
  colorSchemeNode: 'html',            // DOM node to receive the attribute
});
```

---

## 5. Runtime Color Scheme Switching

### useColorScheme() hook

```tsx
import { useColorScheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null; // avoids SSR hydration mismatch

  return (
    <Button
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      startIcon={mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    >
      {mode === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  );
}
```

### Three-way toggle (light / dark / system)

```tsx
function ThemeSwitcher() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null;

  const options = [
    { value: 'light', icon: <LightModeIcon />, label: 'Light' },
    { value: 'dark', icon: <DarkModeIcon />, label: 'Dark' },
    { value: 'system', icon: <SettingsBrightnessIcon />, label: 'System' },
  ] as const;

  return (
    <>
      {options.map((opt) => (
        <IconButton
          key={opt.value}
          onClick={() => setMode(opt.value)}
          color={mode === opt.value ? 'primary' : 'default'}
          aria-label={opt.label}
        >
          {opt.icon}
        </IconButton>
      ))}
    </>
  );
}
```

**Why no re-render:** `setMode` updates a `data-*` attribute on the root HTML element and writes to `localStorage`. CSS variables respond to the attribute via CSS selectors (e.g., `[data-mui-color-scheme="dark"]`). React components only re-render if they read `mode` — the actual style changes are pure CSS.

---

## 6. Accessing CSS Variables

### In the sx prop

```tsx
<Box
  sx={{
    // Option 1: Use the var() function directly
    color: 'var(--mui-palette-primary-main)',
    backgroundColor: 'var(--mui-palette-background-paper)',
    border: '1px solid var(--mui-palette-divider)',

    // Option 2: Use theme.vars (type-safe, recommended)
    // This is available inside callback form:
    color: (theme) => theme.vars.palette.primary.main,
    p: 2,
    borderRadius: 'var(--mui-shape-borderRadius)',
  }}
/>
```

### In styled() components

```tsx
import { styled } from '@mui/material/styles';

const StyledCard = styled('div')(({ theme }) => ({
  // theme.vars resolves to CSS var references like var(--mui-palette-...)
  // This is SSR-safe because it emits CSS variables, not resolved values
  backgroundColor: theme.vars.palette.background.paper,
  color: theme.vars.palette.text.primary,
  padding: theme.spacing(3),
  borderRadius: theme.vars.shape.borderRadius,
  boxShadow: theme.vars.shadows[4],
  border: `1px solid ${theme.vars.palette.divider}`,

  '&:hover': {
    backgroundColor: theme.vars.palette.action.hover,
  },
}));
```

### In plain CSS / CSS Modules

```css
/* styles.module.css */
.card {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
  border: 1px solid var(--mui-palette-divider);
  border-radius: var(--mui-shape-borderRadius);
  padding: 16px;
}

/* Dark mode styles — no extra class needed, CSS vars change automatically */
```

### With custom cssVarPrefix

```tsx
const theme = extendTheme({
  cssVarPrefix: 'app',
  // ...
});

// CSS variables are now:
//   var(--app-palette-primary-main)
//   var(--app-palette-background-default)
//   var(--app-shape-borderRadius)
```

---

## 7. Theme Tokens as CSS Variables

### How the mapping works

MUI transforms the nested theme object into flat CSS custom properties:

| Theme path | CSS variable |
|------------|-------------|
| `theme.palette.primary.main` | `--mui-palette-primary-main` |
| `theme.palette.background.default` | `--mui-palette-background-default` |
| `theme.palette.text.secondary` | `--mui-palette-text-secondary` |
| `theme.shape.borderRadius` | `--mui-shape-borderRadius` |
| `theme.shadows[4]` | `--mui-shadows-4` |
| `theme.palette.action.hover` | `--mui-palette-action-hover` |
| `theme.spacing(2)` | Computed (not a CSS var by default) |

### theme.vars vs theme direct access

```tsx
const StyledBox = styled('div')(({ theme }) => ({
  // WRONG for SSR with CssVarsProvider — resolves at build time, mismatches on hydration
  // color: theme.palette.primary.main,

  // CORRECT — emits var(--mui-palette-primary-main), works with SSR
  color: theme.vars.palette.primary.main,

  // theme.vars is only available when using CssVarsProvider + extendTheme.
  // With ThemeProvider + createTheme, use theme.palette.primary.main directly.
}));
```

### Custom CSS variables

Add custom tokens via the theme that become CSS variables:

```tsx
declare module '@mui/material/styles' {
  interface CssVarsThemeOptions {
    custom?: {
      headerHeight?: string;
      sidebarWidth?: string;
      contentMaxWidth?: string;
    };
  }
  interface Theme {
    custom: {
      headerHeight: string;
      sidebarWidth: string;
      contentMaxWidth: string;
    };
  }
}

const theme = extendTheme({
  custom: {
    headerHeight: '64px',
    sidebarWidth: '280px',
    contentMaxWidth: '1200px',
  },
  colorSchemes: { light: {}, dark: {} },
});

// Access in styled:
// theme.vars.custom.headerHeight → var(--mui-custom-headerHeight)
```

---

## 8. Pigment CSS (Zero-Runtime Styling Engine)

### What it is

Pigment CSS is MUI's compile-time CSS extraction engine. It replaces Emotion as the styling runtime — all `styled()` and `css()` calls are evaluated at build time and extracted to static CSS files. **No JavaScript styling runtime is shipped to the browser.**

### When to use Pigment CSS

- Server-heavy apps (Next.js App Router, RSC) where Emotion's runtime is a liability
- Performance-critical pages where eliminating the styling runtime reduces JS bundle size
- React Server Components: Emotion requires a client boundary; Pigment CSS does not
- Large design systems where static extraction improves cacheability

### When NOT to use Pigment CSS

- Highly dynamic styles that depend on runtime state (e.g., user-dragged colors)
- Projects heavily invested in Emotion APIs (`keyframes`, `Global`, `css` prop)
- Apps that need MUI v5 compatibility (Pigment CSS targets MUI v6+)

### Setup with Next.js App Router

Install:

```bash
npm install @pigment-css/react @pigment-css/nextjs-plugin
```

Configure `next.config.mjs`:

```js
import { withPigment } from '@pigment-css/nextjs-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPigment(nextConfig, {
  theme: {
    cssVarPrefix: 'app',
    colorSchemes: {
      light: {
        palette: {
          primary: { main: '#1976d2' },
          background: { default: '#ffffff' },
        },
      },
      dark: {
        palette: {
          primary: { main: '#90caf9' },
          background: { default: '#121212' },
        },
      },
    },
    typography: {
      fontFamily: '"Inter", sans-serif',
    },
  },
});
```

### Setup with Vite

```bash
npm install @pigment-css/react @pigment-css/vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pigment } from '@pigment-css/vite-plugin';

export default defineConfig({
  plugins: [
    pigment({
      theme: {
        colorSchemes: {
          light: { palette: { primary: { main: '#1976d2' } } },
          dark: { palette: { primary: { main: '#90caf9' } } },
        },
      },
    }),
    react(),
  ],
});
```

### Pigment CSS API: css() and styled()

```tsx
import { css, styled } from '@pigment-css/react';

// css() — returns a class name string (evaluated at build time)
const cardStyles = css(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  borderRadius: theme.vars.shape.borderRadius,
  padding: theme.spacing(3),
  boxShadow: theme.vars.shadows[2],
}));

function Card({ children }: { children: React.ReactNode }) {
  return <div className={cardStyles}>{children}</div>;
}

// styled() — creates a styled component (evaluated at build time)
const StyledButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
  color: theme.vars.palette.primary.contrastText,
  border: 'none',
  padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
  borderRadius: theme.vars.shape.borderRadius,
  cursor: 'pointer',
  fontSize: theme.typography.button.fontSize,
  fontWeight: theme.typography.button.fontWeight,
  '&:hover': {
    backgroundColor: theme.vars.palette.primary.dark,
  },
}));
```

### Pigment CSS with variants

```tsx
const StyledChip = styled('span')<{ variant?: 'filled' | 'outlined'; color?: 'primary' | 'error' }>(
  ({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing(0.5)} ${theme.spacing(1.5)}`,
    borderRadius: '16px',
    fontSize: '0.8125rem',
  }),
  {
    variants: [
      {
        props: { variant: 'filled', color: 'primary' },
        style: ({ theme }) => ({
          backgroundColor: theme.vars.palette.primary.main,
          color: theme.vars.palette.primary.contrastText,
        }),
      },
      {
        props: { variant: 'outlined', color: 'primary' },
        style: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.primary.main}`,
          color: theme.vars.palette.primary.main,
          backgroundColor: 'transparent',
        }),
      },
      {
        props: { variant: 'filled', color: 'error' },
        style: ({ theme }) => ({
          backgroundColor: theme.vars.palette.error.main,
          color: theme.vars.palette.error.contrastText,
        }),
      },
    ],
  },
);
```

### Limitations and gotchas

1. **No dynamic runtime styles**: Styles are extracted at build time. You cannot do:
   ```tsx
   // WRONG with Pigment CSS — width is unknown at compile time
   const Box = styled('div')<{ w: number }>(({ w }) => ({
     width: `${w}px`,
   }));
   ```
   Instead, use CSS variables or predefined variants:
   ```tsx
   // CORRECT — use inline style for truly dynamic values
   function Box({ width, children }: { width: number; children: React.ReactNode }) {
     return (
       <div className={boxStyles} style={{ '--box-width': `${width}px` } as React.CSSProperties}>
         {children}
       </div>
     );
   }
   const boxStyles = css({ width: 'var(--box-width)' });
   ```

2. **Theme must be serializable**: The theme passed to the plugin config must be plain JSON-serializable. No functions, class instances, or circular references.

3. **Build plugin required**: Pigment CSS does nothing without the Next.js/Vite/Webpack plugin. The `css()` and `styled()` calls are transformed at compile time by the plugin.

4. **Emotion APIs not available**: `keyframes`, `Global`, `ClassNames`, and the `css` prop from `@emotion/react` are not supported. Use `@pigment-css/react` equivalents.

5. **Migration is incremental**: You can use Pigment CSS alongside Emotion during migration. Components using `@pigment-css/react` are statically extracted; those still using `@mui/material/styles` use Emotion at runtime.

### Migration path from Emotion

```tsx
// BEFORE (Emotion runtime)
import { styled } from '@mui/material/styles';

const Card = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

// AFTER (Pigment CSS zero-runtime)
import { styled } from '@pigment-css/react';

const Card = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.vars.palette.background.paper, // note: theme.vars
}));
```

Key migration steps:
1. Change import from `@mui/material/styles` to `@pigment-css/react`
2. Replace `theme.palette.*` with `theme.vars.palette.*` in styled/css calls
3. Move dynamic style logic to CSS variables + inline `style` prop
4. Remove `@emotion/react` and `@emotion/styled` when fully migrated
5. Add the build plugin to your bundler config

---

## 9. TypeScript Augmentation for CSS Variables

### Augmenting the theme with custom tokens

```tsx
// theme.d.ts or inline in theme file
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteOptions {
    brand?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  }
  interface Palette {
    brand: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }

  interface TypeBackground {
    subtle?: string;
    emphasis?: string;
  }

  // Extend CSS variables
  interface ThemeVars {
    palette: Palette & {
      brand: {
        primary: string;
        secondary: string;
        accent: string;
      };
    };
  }
}
```

### Using augmented theme

```tsx
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        brand: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#F7C948',
        },
        background: {
          subtle: '#f8f9fa',
          emphasis: '#e9ecef',
        },
      },
    },
    dark: {
      palette: {
        brand: {
          primary: '#FF8C5A',
          secondary: '#3A8FD6',
          accent: '#FFD970',
        },
        background: {
          subtle: '#1a1a2e',
          emphasis: '#16213e',
        },
      },
    },
  },
});

// Type-safe access:
// theme.vars.palette.brand.primary → var(--mui-palette-brand-primary)
```

### Augmenting component prop types for new palette colors

```tsx
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    brand: true;
  }
}

// Now <Button color="brand"> is type-safe
```

---

## 10. Complete Example: Full App Setup

```tsx
// theme.ts
import { extendTheme } from '@mui/material/styles';

export const theme = extendTheme({
  cssVarPrefix: 'app',
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1565c0' },
        secondary: { main: '#7b1fa2' },
        background: { default: '#fafafa', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        secondary: { main: '#ce93d8' },
        background: { default: '#0a0a0a', paper: '#1e1e1e' },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
});
```

```tsx
// layout.tsx (Next.js App Router)
import { getInitColorSchemeScript } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CssVarsProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript({ defaultMode: 'system' })}
        <AppRouterCacheProvider>
          <CssVarsProvider theme={theme} defaultMode="system">
            <CssBaseline enableColorScheme />
            {children}
          </CssVarsProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

```tsx
// components/ThemeToggle.tsx
'use client';

import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) return null;

  return (
    <IconButton
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      sx={{
        color: 'var(--app-palette-text-primary)',
      }}
    >
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}
```

---

## Quick Reference

### Essential imports

```tsx
// CSS Variables mode
import { CssVarsProvider, extendTheme, useColorScheme, getInitColorSchemeScript } from '@mui/material/styles';

// Pigment CSS (zero-runtime)
import { css, styled } from '@pigment-css/react';

// Build plugins
import { withPigment } from '@pigment-css/nextjs-plugin';    // Next.js
import { pigment } from '@pigment-css/vite-plugin';           // Vite
```

### CSS variable naming convention

```
--{prefix}-palette-{color}-{shade}      e.g., --mui-palette-primary-main
--{prefix}-palette-text-{type}          e.g., --mui-palette-text-secondary
--{prefix}-palette-background-{type}    e.g., --mui-palette-background-paper
--{prefix}-palette-action-{type}        e.g., --mui-palette-action-hover
--{prefix}-shape-borderRadius           e.g., --mui-shape-borderRadius
--{prefix}-shadows-{index}              e.g., --mui-shadows-4
--{prefix}-typography-{variant}-*       e.g., --mui-typography-body1-fontSize
--{prefix}-zIndex-{component}           e.g., --mui-zIndex-modal
```

### Common mistakes

| Mistake | Fix |
|---------|-----|
| Using `theme.palette.*` in styled() with CssVarsProvider | Use `theme.vars.palette.*` for SSR-safe variable references |
| Forgetting `getInitColorSchemeScript()` in SSR layout | Add it as the first child of `<body>` |
| Checking `mode` before hydration causes mismatch | Guard with `if (!mode) return null` |
| Using `ThemeProvider` with `extendTheme()` | Use `CssVarsProvider` — `extendTheme` is designed for it |
| Using `createTheme()` with `CssVarsProvider` | Use `extendTheme()` — `createTheme` does not generate CSS vars |
| Dynamic props in Pigment CSS `styled()` | Use CSS variables + inline `style` prop instead |
| Missing build plugin for Pigment CSS | `css()` and `styled()` from `@pigment-css/react` require the bundler plugin |
