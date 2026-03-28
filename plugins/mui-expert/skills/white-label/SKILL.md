---
name: white-label
description: MUI multi-theme and white-label systems — nested ThemeProvider, dynamic theme switching, tenant-specific branding, and theme composition
triggers:
  - white-label
  - multi-theme
  - multi-tenant
  - nested ThemeProvider
  - dynamic theme
  - tenant branding
  - theme switching
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
---

# MUI White-Label and Multi-Theme Systems

## Nested ThemeProvider

MUI's `ThemeProvider` can be nested. Inner providers merge with or override the outer
theme. Use this to scope different visual treatments to different sections of the app.

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const mainTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    background: { default: '#fafafa' },
  },
});

// Admin sidebar uses a dark theme, scoped to its subtree
const adminSidebarTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#1e1e1e', paper: '#2d2d2d' },
  },
});

export function AppShell() {
  return (
    <ThemeProvider theme={mainTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* Dark sidebar — scoped theme */}
        <ThemeProvider theme={adminSidebarTheme}>
          <Paper sx={{ width: 280, minHeight: '100vh', p: 2 }}>
            <Typography variant="h6">Admin</Typography>
            <Button variant="contained">Dashboard</Button>
          </Paper>
        </ThemeProvider>

        {/* Main content — inherits mainTheme */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Typography variant="h4">Welcome</Typography>
          <Button variant="contained">Main Action</Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
```

### Nested Theme with Callback (Merge Instead of Replace)

Pass a function to `ThemeProvider` to receive the outer theme and merge selectively:

```tsx
<ThemeProvider theme={mainTheme}>
  <ThemeProvider
    theme={(outerTheme) =>
      createTheme({
        ...outerTheme,
        palette: {
          ...outerTheme.palette,
          primary: { main: '#e91e63' },  // override only primary
        },
      })
    }
  >
    <Button variant="contained">Pink Button, rest of theme inherited</Button>
  </ThemeProvider>
</ThemeProvider>
```

---

## Dynamic Theme Loading

Load theme configuration from an API or database at runtime. This is the foundation
of any white-label system.

```tsx
import { ThemeProvider, createTheme, type ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useState, useEffect, useMemo, type ReactNode } from 'react';

interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: number;
  logoUrl: string;
  mode: 'light' | 'dark';
}

function buildThemeOptions(brand: BrandConfig): ThemeOptions {
  return {
    palette: {
      mode: brand.mode,
      primary: { main: brand.primaryColor },
      secondary: { main: brand.secondaryColor },
    },
    typography: {
      fontFamily: brand.fontFamily,
    },
    shape: {
      borderRadius: brand.borderRadius,
    },
  };
}

async function fetchBrandConfig(tenantId: string): Promise<BrandConfig> {
  const res = await fetch(`/api/tenants/${tenantId}/brand`);
  if (!res.ok) throw new Error(`Failed to load brand config for ${tenantId}`);
  return res.json();
}

interface DynamicThemeProviderProps {
  tenantId: string;
  children: ReactNode;
}

export function DynamicThemeProvider({ tenantId, children }: DynamicThemeProviderProps) {
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandConfig(tenantId)
      .then(setBrandConfig)
      .catch((err) => setError(err.message));
  }, [tenantId]);

  const theme = useMemo(
    () => (brandConfig ? createTheme(buildThemeOptions(brandConfig)) : null),
    [brandConfig],
  );

  if (error) return <Box sx={{ p: 4, color: 'error.main' }}>Theme load failed: {error}</Box>;
  if (!theme) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

---

## Theme Composition

Use `deepmerge` (shipped with MUI as `@mui/utils/deepmerge`) to layer tenant
overrides on top of a base theme. This ensures tenants only override what they need
and inherit everything else.

```tsx
import { createTheme, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

// Shared base — every tenant gets this as the foundation
const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
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
        root: { border: '1px solid', borderColor: 'rgba(0,0,0,0.12)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
};

// Tenant-specific overrides — only the diff
const acmeOverrides: ThemeOptions = {
  palette: {
    primary: { main: '#ff5722' },
    secondary: { main: '#ff9800' },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 24 },   // pill buttons for Acme
      },
    },
  },
};

const globexOverrides: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: { main: '#00bcd4' },
    secondary: { main: '#7c4dff' },
  },
  shape: { borderRadius: 4 },
};

// Compose: base + tenant overrides via deepmerge
export function createTenantTheme(overrides: ThemeOptions) {
  const merged = deepmerge(baseThemeOptions, overrides);
  return createTheme(merged);
}

// Usage
const acmeTheme = createTenantTheme(acmeOverrides);
const globexTheme = createTenantTheme(globexOverrides);
```

---

## Tenant-Specific Branding

A token-based approach: load brand colors, fonts, logos, and favicon from a config
object. This separates brand identity from theme mechanics.

```tsx
import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

// Brand tokens — everything that varies per tenant
export interface BrandTokens {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  errorColor?: string;
  warningColor?: string;
  successColor?: string;
  fontFamily: string;
  headingFontFamily?: string;
  borderRadius: number;
  logoUrl: string;
  logoHeight: number;         // px
  faviconUrl: string;
  mode: 'light' | 'dark';
  customShadows?: boolean;    // use flat design (no shadows)
}

const baseThemeOptions: ThemeOptions = {
  typography: {
    button: { textTransform: 'none' },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
  },
};

export function createBrandTheme(tokens: BrandTokens): Theme {
  const brandOverrides: ThemeOptions = {
    palette: {
      mode: tokens.mode,
      primary: { main: tokens.primaryColor },
      secondary: { main: tokens.secondaryColor },
      ...(tokens.errorColor && { error: { main: tokens.errorColor } }),
      ...(tokens.warningColor && { warning: { main: tokens.warningColor } }),
      ...(tokens.successColor && { success: { main: tokens.successColor } }),
    },
    typography: {
      fontFamily: tokens.fontFamily,
      h1: { fontFamily: tokens.headingFontFamily ?? tokens.fontFamily },
      h2: { fontFamily: tokens.headingFontFamily ?? tokens.fontFamily },
      h3: { fontFamily: tokens.headingFontFamily ?? tokens.fontFamily },
    },
    shape: { borderRadius: tokens.borderRadius },
    ...(tokens.customShadows === false && {
      shadows: Array(25).fill('none') as Theme['shadows'],
    }),
  };

  return createTheme(deepmerge(baseThemeOptions, brandOverrides));
}

// React context to expose brand tokens (logo, favicon, etc.) outside the theme
import { createContext, useContext, type ReactNode } from 'react';

const BrandContext = createContext<BrandTokens | null>(null);

export function useBrand(): BrandTokens {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error('useBrand must be used within BrandProvider');
  return brand;
}

export function BrandProvider({ tokens, children }: { tokens: BrandTokens; children: ReactNode }) {
  return <BrandContext.Provider value={tokens}>{children}</BrandContext.Provider>;
}
```

Usage in a header component:

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import { useBrand } from './brand';

export function BrandedHeader() {
  const brand = useBrand();
  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          component="img"
          src={brand.logoUrl}
          alt={`${brand.name} logo`}
          sx={{ height: brand.logoHeight, mr: 2 }}
        />
      </Toolbar>
    </AppBar>
  );
}
```

---

## CSS Variables Approach

MUI v5.1+ supports `CssVarsProvider` which uses CSS custom properties for palette
values. This enables theme switching without React re-renders — the browser just
swaps variable values.

```tsx
import {
  Experimental_CssVarsProvider as CssVarsProvider,
  experimental_extendTheme as extendTheme,
  useColorScheme,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import type { ReactNode } from 'react';

// extendTheme replaces createTheme when using CssVarsProvider
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        background: { default: '#fafafa', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        background: { default: '#121212', paper: '#1e1e1e' },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: { textTransform: 'none' },
  },
});

// Toggle component — switches mode via CSS variables, zero re-render
function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  return (
    <IconButton
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
    </IconButton>
  );
}

export function CssVarsApp({ children }: { children: ReactNode }) {
  return (
    <CssVarsProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <ModeToggle />
      {children}
    </CssVarsProvider>
  );
}
```

### Accessing CSS Variables in sx

```tsx
<Box
  sx={{
    // These reference the CSS variable, not a JS value
    color: 'var(--mui-palette-primary-main)',
    bgcolor: 'var(--mui-palette-background-paper)',
    borderRadius: 'var(--mui-shape-borderRadius)',
  }}
/>
```

### CssVarsProvider with Multi-Tenant

Combine `extendTheme` with tenant overrides:

```tsx
import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

const baseExtended = {
  colorSchemes: {
    light: { palette: { primary: { main: '#1976d2' } } },
    dark: { palette: { primary: { main: '#90caf9' } } },
  },
};

function createTenantCssVarsTheme(overrides: Record<string, unknown>) {
  return extendTheme(deepmerge(baseExtended, overrides));
}

// Tenant override — only changes primary color for both schemes
const acmeCssVarsTheme = createTenantCssVarsTheme({
  colorSchemes: {
    light: { palette: { primary: { main: '#ff5722' } } },
    dark: { palette: { primary: { main: '#ff8a65' } } },
  },
});
```

---

## Theme Registry Pattern

Map tenant IDs to theme objects. Useful when you have a known set of tenants at
build time, or when you cache API-loaded themes.

```tsx
import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

const baseOptions: ThemeOptions = {
  typography: { button: { textTransform: 'none' } },
  shape: { borderRadius: 8 },
};

// Registry: tenant ID -> theme options (only the diff from base)
const tenantThemeOverrides: Record<string, ThemeOptions> = {
  acme: {
    palette: { primary: { main: '#ff5722' }, secondary: { main: '#ff9800' } },
    typography: { fontFamily: '"Poppins", sans-serif' },
  },
  globex: {
    palette: { mode: 'dark', primary: { main: '#00bcd4' } },
    shape: { borderRadius: 4 },
  },
  initech: {
    palette: { primary: { main: '#4caf50' }, secondary: { main: '#8bc34a' } },
    typography: { fontFamily: '"Roboto Mono", monospace' },
  },
};

// Cache to avoid re-creating themes on every render
const themeCache = new Map<string, Theme>();

export function getTenantTheme(tenantId: string): Theme {
  const cached = themeCache.get(tenantId);
  if (cached) return cached;

  const overrides = tenantThemeOverrides[tenantId];
  if (!overrides) {
    console.warn(`No theme registered for tenant "${tenantId}", using base theme`);
    const fallback = createTheme(baseOptions);
    themeCache.set(tenantId, fallback);
    return fallback;
  }

  const theme = createTheme(deepmerge(baseOptions, overrides));
  themeCache.set(tenantId, theme);
  return theme;
}

// Dynamic registration for API-loaded tenants
export function registerTenantTheme(tenantId: string, overrides: ThemeOptions): void {
  tenantThemeOverrides[tenantId] = overrides;
  themeCache.delete(tenantId);  // invalidate cache
}
```

Usage:

```tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTenantTheme } from './theme-registry';

function App({ tenantId }: { tenantId: string }) {
  const theme = getTenantTheme(tenantId);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* app content */}
    </ThemeProvider>
  );
}
```

---

## Component Variant Overrides per Tenant

Tenants may need different component appearances beyond colors — pill buttons for
one brand, square for another, outlined defaults for a third.

```tsx
import { createTheme, type ThemeOptions, type Components, type Theme } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

// Each tenant defines component overrides
type TenantComponents = Components<Omit<Theme, 'components'>>;

const acmeComponents: TenantComponents = {
  MuiButton: {
    defaultProps: { variant: 'contained', disableElevation: true },
    styleOverrides: {
      root: { borderRadius: 24, padding: '10px 28px', fontWeight: 700 },
      containedPrimary: {
        background: 'linear-gradient(45deg, #ff5722, #ff9800)',
        '&:hover': { background: 'linear-gradient(45deg, #e64a19, #f57c00)' },
      },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: '2px solid',
        borderColor: 'rgba(255, 87, 34, 0.2)',
      },
    },
  },
  MuiChip: {
    defaultProps: { variant: 'filled' },
    styleOverrides: {
      root: { borderRadius: 24, fontWeight: 600 },
    },
  },
};

const initechComponents: TenantComponents = {
  MuiButton: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: { borderRadius: 0, textTransform: 'uppercase', letterSpacing: 1 },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 2 },
    styleOverrides: {
      root: { borderRadius: 0 },
    },
  },
};

// Compose with base theme
const baseOptions: ThemeOptions = {
  typography: { button: { textTransform: 'none' } },
};

export const acmeTheme = createTheme(
  deepmerge(baseOptions, {
    palette: { primary: { main: '#ff5722' } },
    components: acmeComponents,
  }),
);

export const initechTheme = createTheme(
  deepmerge(baseOptions, {
    palette: { primary: { main: '#4caf50' } },
    components: initechComponents,
  }),
);
```

---

## TypeScript for Multi-Theme

### Generic Theme Factory Function

```tsx
import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

// Shared base type for all tenant configs
interface TenantThemeConfig {
  tenantId: string;
  palette: {
    primary: string;
    secondary: string;
    mode?: 'light' | 'dark';
  };
  typography?: {
    fontFamily?: string;
    headingFontFamily?: string;
  };
  shape?: {
    borderRadius?: number;
  };
  components?: ThemeOptions['components'];
}

const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
  },
};

export function createThemeFromConfig(config: TenantThemeConfig): Theme {
  const overrides: ThemeOptions = {
    palette: {
      mode: config.palette.mode ?? 'light',
      primary: { main: config.palette.primary },
      secondary: { main: config.palette.secondary },
    },
    ...(config.typography && {
      typography: {
        fontFamily: config.typography.fontFamily,
        ...(config.typography.headingFontFamily && {
          h1: { fontFamily: config.typography.headingFontFamily },
          h2: { fontFamily: config.typography.headingFontFamily },
          h3: { fontFamily: config.typography.headingFontFamily },
          h4: { fontFamily: config.typography.headingFontFamily },
        }),
      },
    }),
    ...(config.shape && { shape: config.shape }),
    ...(config.components && { components: config.components }),
  };

  return createTheme(deepmerge(baseThemeOptions, overrides));
}

// Type-safe tenant registry
const configs: Record<string, TenantThemeConfig> = {
  acme: {
    tenantId: 'acme',
    palette: { primary: '#ff5722', secondary: '#ff9800' },
    typography: { fontFamily: '"Poppins", sans-serif' },
  },
  globex: {
    tenantId: 'globex',
    palette: { primary: '#00bcd4', secondary: '#7c4dff', mode: 'dark' },
    shape: { borderRadius: 4 },
  },
};

export function getThemeForTenant(tenantId: string): Theme {
  const config = configs[tenantId];
  if (!config) throw new Error(`Unknown tenant: ${tenantId}`);
  return createThemeFromConfig(config);
}
```

### Augmenting the Theme Type for Custom Tokens

```tsx
import { createTheme } from '@mui/material/styles';

// Declare custom tokens on the theme
declare module '@mui/material/styles' {
  interface Theme {
    brand: {
      logoUrl: string;
      logoHeight: number;
      appName: string;
    };
  }
  interface ThemeOptions {
    brand?: {
      logoUrl?: string;
      logoHeight?: number;
      appName?: string;
    };
  }
}

const acmeTheme = createTheme({
  palette: { primary: { main: '#ff5722' } },
  brand: {
    logoUrl: '/brands/acme/logo.svg',
    logoHeight: 40,
    appName: 'Acme Portal',
  },
});

// Now type-safe in any component:
// const theme = useTheme();
// theme.brand.logoUrl  <-- autocompletes
```

---

## Performance

### Memoize Theme Creation

`createTheme` is expensive. Never call it inside a render function without memoization.

```tsx
import { useMemo } from 'react';
import { createTheme, ThemeProvider, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';

const baseOptions: ThemeOptions = { /* ... */ };

function TenantApp({ overrides, children }: { overrides: ThemeOptions; children: React.ReactNode }) {
  // GOOD — only re-creates when overrides reference changes
  const theme = useMemo(
    () => createTheme(deepmerge(baseOptions, overrides)),
    [overrides],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

### Avoid Re-Creating Overrides Object

```tsx
// BAD — new object on every render, theme re-created every time
function App({ primaryColor }: { primaryColor: string }) {
  return (
    <TenantApp overrides={{ palette: { primary: { main: primaryColor } } }}>
      {/* ... */}
    </TenantApp>
  );
}

// GOOD — stable reference
function App({ primaryColor }: { primaryColor: string }) {
  const overrides = useMemo(
    () => ({ palette: { primary: { main: primaryColor } } }),
    [primaryColor],
  );
  return <TenantApp overrides={overrides}>{/* ... */}</TenantApp>;
}
```

### Cache Themes for Known Tenants

See the Theme Registry Pattern section above. The `Map`-based cache prevents
re-creating the same theme on navigation or re-mount.

---

## Complete White-Label Architecture

Full example tying together theme factory, tenant loader, brand context, and provider.

### File: `lib/brand/types.ts`

```tsx
export interface TenantBrandConfig {
  tenantId: string;
  name: string;
  domain: string;
  logoUrl: string;
  logoHeight: number;
  faviconUrl: string;
  palette: {
    mode: 'light' | 'dark';
    primary: string;
    secondary: string;
    error?: string;
    warning?: string;
    success?: string;
  };
  typography: {
    fontFamily: string;
    headingFontFamily?: string;
    googleFontsUrl?: string;   // link to Google Fonts CSS
  };
  shape: {
    borderRadius: number;
  };
  components?: {
    buttonVariant?: 'contained' | 'outlined' | 'text';
    buttonBorderRadius?: number;
    cardElevation?: number;
    cardBorderRadius?: number;
  };
}
```

### File: `lib/brand/theme-factory.ts`

```tsx
import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import deepmerge from '@mui/utils/deepmerge';
import type { TenantBrandConfig } from './types';

const BASE_THEME: ThemeOptions = {
  typography: {
    button: { textTransform: 'none', fontWeight: 600 },
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { scrollBehavior: 'smooth' },
      },
    },
  },
};

const cache = new Map<string, Theme>();

export function createBrandTheme(config: TenantBrandConfig): Theme {
  const cached = cache.get(config.tenantId);
  if (cached) return cached;

  const overrides: ThemeOptions = {
    palette: {
      mode: config.palette.mode,
      primary: { main: config.palette.primary },
      secondary: { main: config.palette.secondary },
      ...(config.palette.error && { error: { main: config.palette.error } }),
      ...(config.palette.warning && { warning: { main: config.palette.warning } }),
      ...(config.palette.success && { success: { main: config.palette.success } }),
    },
    typography: {
      fontFamily: config.typography.fontFamily,
      ...(config.typography.headingFontFamily && {
        h1: { fontFamily: config.typography.headingFontFamily },
        h2: { fontFamily: config.typography.headingFontFamily },
        h3: { fontFamily: config.typography.headingFontFamily },
        h4: { fontFamily: config.typography.headingFontFamily },
      }),
    },
    shape: { borderRadius: config.shape.borderRadius },
    components: {
      ...(config.components?.buttonVariant && {
        MuiButton: {
          defaultProps: { variant: config.components.buttonVariant },
          ...(config.components.buttonBorderRadius != null && {
            styleOverrides: {
              root: { borderRadius: config.components.buttonBorderRadius },
            },
          }),
        },
      }),
      ...(config.components?.cardElevation != null && {
        MuiCard: {
          defaultProps: { elevation: config.components.cardElevation },
          ...(config.components.cardBorderRadius != null && {
            styleOverrides: {
              root: { borderRadius: config.components.cardBorderRadius },
            },
          }),
        },
      }),
    },
  };

  const theme = createTheme(deepmerge(BASE_THEME, overrides));
  cache.set(config.tenantId, theme);
  return theme;
}

export function invalidateBrandCache(tenantId?: string): void {
  if (tenantId) {
    cache.delete(tenantId);
  } else {
    cache.clear();
  }
}
```

### File: `lib/brand/BrandProvider.tsx`

```tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { TenantBrandConfig } from './types';
import { createBrandTheme } from './theme-factory';

// --- Brand Context ---
const BrandContext = createContext<TenantBrandConfig | null>(null);

export function useBrand(): TenantBrandConfig {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand() must be used within <BrandProvider>');
  return ctx;
}

// --- Tenant Loader ---
async function loadTenantConfig(tenantId: string): Promise<TenantBrandConfig> {
  const res = await fetch(`/api/tenants/${tenantId}/brand`);
  if (!res.ok) throw new Error(`Brand config fetch failed (${res.status})`);
  return res.json();
}

// --- Font Loader ---
function loadGoogleFonts(url: string): void {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// --- Favicon Setter ---
function setFavicon(url: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

// --- Provider Component ---
interface BrandProviderProps {
  tenantId: string;
  fallbackConfig?: TenantBrandConfig;   // optional static fallback
  children: ReactNode;
}

export function BrandProvider({ tenantId, fallbackConfig, children }: BrandProviderProps) {
  const [config, setConfig] = useState<TenantBrandConfig | null>(fallbackConfig ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTenantConfig(tenantId)
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);

        // Side effects: load fonts, set favicon, set document title
        if (cfg.typography.googleFontsUrl) loadGoogleFonts(cfg.typography.googleFontsUrl);
        if (cfg.faviconUrl) setFavicon(cfg.faviconUrl);
        document.title = cfg.name;
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => { cancelled = true; };
  }, [tenantId]);

  const theme = useMemo(() => (config ? createBrandTheme(config) : null), [config]);

  if (error && !config) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ color: 'error.main', mb: 1 }}>Failed to load brand: {error}</Box>
      </Box>
    );
  }

  if (!theme || !config) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrandContext.Provider value={config}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </BrandContext.Provider>
  );
}
```

### File: `App.tsx` (entry point)

```tsx
import { BrandProvider } from './lib/brand/BrandProvider';
import { BrandedHeader } from './components/BrandedHeader';
import { Dashboard } from './pages/Dashboard';

// Tenant ID typically comes from subdomain, URL param, or env variable
function getTenantId(): string {
  const subdomain = window.location.hostname.split('.')[0];
  return subdomain === 'localhost' ? 'acme' : subdomain;
}

export default function App() {
  const tenantId = getTenantId();

  return (
    <BrandProvider tenantId={tenantId}>
      <BrandedHeader />
      <Dashboard />
    </BrandProvider>
  );
}
```

### File: `components/BrandedHeader.tsx`

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useBrand } from '../lib/brand/BrandProvider';

export function BrandedHeader() {
  const brand = useBrand();

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Box
          component="img"
          src={brand.logoUrl}
          alt={`${brand.name} logo`}
          sx={{ height: brand.logoHeight, mr: 2 }}
        />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {brand.name}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
```
