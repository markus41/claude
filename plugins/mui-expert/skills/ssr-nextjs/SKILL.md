---
name: ssr-nextjs
description: MUI server-side rendering with Next.js — App Router, Pages Router, RSC compatibility, Emotion cache, and Pigment CSS
triggers:
  - SSR
  - Next.js
  - server-side rendering
  - App Router
  - server components
  - RSC
  - Emotion cache
  - ThemeRegistry
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
  - "next.config.*"
  - "app/layout.*"
---

# MUI SSR with Next.js

## 1. Next.js App Router Setup (v13+)

The App Router requires a client-side ThemeRegistry component that flushes Emotion's
server-generated styles into the document head via `useServerInsertedHTML`.

### ThemeRegistry client component

```tsx
// src/components/ThemeRegistry/EmotionCache.tsx
'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';

export default function NextAppDirEmotionCacheProvider(
  props: { options: Parameters<typeof createCache>[0]; children: React.ReactNode }
) {
  const { options, children } = props;

  const [registry] = React.useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: { name: string; isGlobal: boolean }[] = [];

    cache.insert = (...args) => {
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push({
          name: serialized.name,
          isGlobal: !selector,
        });
      }
      return prevInsert(...args);
    };

    return { cache, flush: () => { const prev = inserted; inserted = []; return prev; } };
  });

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) return null;

    let styles = '';
    let dataEmotionAttribute = registry.cache.key;
    const globals: { name: string; style: string }[] = [];

    for (const { name, isGlobal } of names) {
      const style = registry.cache.inserted[name];
      if (typeof style === 'string') {
        if (isGlobal) {
          globals.push({ name, style });
        } else {
          styles += style;
          dataEmotionAttribute += ` ${name}`;
        }
      }
    }

    return (
      <>
        {globals.map(({ name, style }) => (
          <style
            key={name}
            data-emotion={`${registry.cache.key}-global`}
            dangerouslySetInnerHTML={{ __html: style }}
          />
        ))}
        {styles && (
          <style
            data-emotion={dataEmotionAttribute}
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        )}
      </>
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
```

### ThemeRegistry wrapper

```tsx
// src/components/ThemeRegistry/ThemeRegistry.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import theme from './theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui', prepend: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
```

### app/layout.tsx integration

```tsx
// app/layout.tsx
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';

export const metadata = {
  title: 'My App',
  description: 'MUI + Next.js App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
```

### Required dependencies

```bash
npm install @mui/material @emotion/react @emotion/styled @emotion/cache
```

---

## 2. Next.js Pages Router Setup

The Pages Router uses `_document.tsx` to extract critical CSS at render time and
inject it into the initial HTML response.

### createEmotionCache utility

```tsx
// src/createEmotionCache.ts
import createCache from '@emotion/cache';

export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
```

### _app.tsx with CacheProvider

```tsx
// pages/_app.tsx
import * as React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}
```

### _document.tsx with extractCriticalToChunks

```tsx
// pages/_document.tsx
import * as React from 'react';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentProps,
  DocumentContext,
} from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import { AppType } from 'next/app';
import theme from '../src/theme';
import createEmotionCache from '../src/createEmotionCache';

interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: React.ReactElement[];
}

export default function MyDocument({ emotionStyleTags }: MyDocumentProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <link rel="shortcut icon" href="/favicon.ico" />
        {emotionStyleTags}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const originalRenderPage = ctx.renderPage;
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: React.ComponentType<React.ComponentProps<AppType> & { emotionCache: ReturnType<typeof createEmotionCache> }>) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />;
        },
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    emotionStyleTags,
  };
};
```

### Additional dependency for Pages Router

```bash
npm install @emotion/server
```

---

## 3. Server Components Compatibility

### MUI components do NOT work in React Server Components

Every MUI component uses React context (ThemeProvider), hooks (useTheme, useState),
or event handlers. **None of them can be rendered as RSC.** Any file importing from
`@mui/material` must include `'use client'` at the top, or be imported from a file
that does.

### Client boundary patterns

**Pattern 1: Thin client wrapper around server data**

```tsx
// app/users/page.tsx (Server Component — fetches data)
import UserTable from './UserTable';

export default async function UsersPage() {
  const users = await db.user.findMany(); // server-side data fetch
  return <UserTable users={users} />;     // pass plain data to client
}
```

```tsx
// app/users/UserTable.tsx (Client Component — renders MUI)
'use client';

import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';

interface User { id: string; name: string; email: string; }

export default function UserTable({ users }: { users: User[] }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

**Pattern 2: Client island for interactive sections only**

```tsx
// app/dashboard/page.tsx (Server Component)
import DashboardStats from './DashboardStats';  // server-rendered plain HTML
import DashboardCharts from './DashboardCharts'; // 'use client' — interactive

export default async function DashboardPage() {
  const stats = await fetchStats();
  const chartData = await fetchChartData();

  return (
    <div>
      {/* Server-rendered: zero JS shipped for this section */}
      <DashboardStats stats={stats} />

      {/* Client boundary: MUI charts with interactivity */}
      <DashboardCharts data={chartData} />
    </div>
  );
}
```

**Pattern 3: Re-export barrel for 'use client' boundary**

```tsx
// src/components/mui.tsx
'use client';

// Single 'use client' boundary for all MUI re-exports used across the app.
// Keeps individual page components clean.
export {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Stack,
} from '@mui/material';
```

### Where to place 'use client'

Push the `'use client'` boundary **as far down the component tree as possible**.
Server components at the top fetch data, client components at the leaves render UI.

```
app/
  layout.tsx          ← Server (ThemeRegistry is a 'use client' child)
  page.tsx            ← Server (fetches data, passes to client children)
  components/
    Header.tsx        ← 'use client' (uses MUI AppBar, needs onClick)
    Footer.tsx        ← Server (plain HTML, no MUI needed)
    DataTable.tsx     ← 'use client' (uses MUI DataGrid)
```

---

## 4. CSS Variables Mode for SSR (FOUC Prevention)

MUI v6+ supports CSS variables mode via `cssVariables: true` or
`Experimental_CssVarsProvider` in v5. This eliminates the flash of unstyled content
(FOUC) on page load because the color scheme is applied via a synchronous script
before React hydrates.

### Setup with getInitColorSchemeScript

```tsx
// app/layout.tsx
import { getInitColorSchemeScript } from '@mui/material/styles';
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* This script runs synchronously before React hydrates.
            It reads localStorage/system preference and sets a data attribute
            on <html> so styles apply immediately — no FOUC. */}
        {getInitColorSchemeScript({ defaultMode: 'system' })}
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
```

### Theme configuration for CSS variables mode

```tsx
// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
    // or 'class' to use className-based toggling
    // or 'media' to follow prefers-color-scheme only
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1976d2' },
        background: { default: '#fafafa', paper: '#fff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        background: { default: '#121212', paper: '#1e1e1e' },
      },
    },
  },
});

export default theme;
```

### Toggle color scheme at runtime

```tsx
'use client';

import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();
  return (
    <IconButton
      onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
      aria-label="toggle color mode"
    >
      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}
```

---

## 5. Pigment CSS with Next.js

Pigment CSS is MUI's zero-runtime CSS-in-JS solution. It extracts styles at build
time, producing static CSS files. This means:

- No Emotion runtime shipped to the browser
- No `useServerInsertedHTML` or `extractCriticalToChunks` needed
- Full RSC compatibility (styles are static, not context-dependent)

### Installation

```bash
npm install @pigment-css/react @pigment-css/nextjs-plugin
```

### next.config.mjs setup

```js
// next.config.mjs
import { withPigment } from '@pigment-css/nextjs-plugin';

const nextConfig = {
  // your existing Next.js config
};

export default withPigment(nextConfig, {
  theme: {
    palette: {
      primary: { main: '#1976d2' },
      background: { default: '#fafafa' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    // Pigment CSS theme uses the same shape as createTheme
  },
  // Pigment-specific options:
  transformLibraries: ['@mui/material'],
  // Transforms MUI's styled() calls into static CSS at build time
});
```

### Using Pigment CSS utilities directly

```tsx
import { styled, css } from '@pigment-css/react';

// These are extracted at build time — zero runtime cost
const StyledCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

// className-based utility
const highlightClass = css(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));
```

### Pigment CSS vs Emotion SSR comparison

| Aspect | Emotion SSR | Pigment CSS |
|--------|-------------|-------------|
| Runtime JS | ~12 kB gzipped | 0 kB |
| SSR extraction | Required (extractCriticalToChunks / useServerInsertedHTML) | Not needed |
| RSC support | Needs 'use client' boundary | Works in server components |
| Dynamic styles | Full runtime support | Limited (CSS variables for dynamic values) |
| Build time | Normal | Slightly longer (extraction step) |
| MUI compatibility | All components | MUI v6+ with `@pigment-css/react` |

---

## 6. Common SSR Pitfalls

### Hydration mismatch from useMediaQuery

`useMediaQuery` uses `window.matchMedia` which does not exist on the server. By
default, it returns `false` on the server. If the client evaluates `true`, you get a
hydration mismatch.

**Fix: provide ssrMatchMedia**

```tsx
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Server-side: pass the user-agent to approximate the device
function getServerTheme(userAgent: string) {
  return createTheme({
    components: {
      MuiUseMediaQuery: {
        defaultProps: {
          ssrMatchMedia: (query: string) => ({
            matches: mediaQuery.match(query, {
              // Provide a width matching the UA
              width: /mobile/i.test(userAgent) ? '0px' : '1024px',
            }),
          }),
        },
      },
    },
  });
}
```

**Alternative: defer rendering until client**

```tsx
'use client';

import useMediaQuery from '@mui/material/useMediaQuery';

export default function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width:600px)', {
    // Do not render on server — avoids mismatch entirely
    noSsr: true,
    // defaultMatches controls server-side return value
    defaultMatches: false,
  });

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### Flash of unstyled content (FOUC) prevention checklist

1. Use `prepend: true` in Emotion cache so MUI styles are injected before other styles
2. Use `getInitColorSchemeScript` for dark/light mode (see section 4)
3. In Pages Router, ensure `_document.tsx` extracts critical CSS (see section 2)
4. In App Router, ensure `useServerInsertedHTML` flushes styles (see section 1)
5. Add `suppressHydrationWarning` to `<html>` when using color scheme scripts

### Portal components (Dialog, Menu, Popper, Tooltip) and SSR

Portal components render into `document.body` via `createPortal`. On the server,
`document` does not exist. MUI handles this internally by deferring portal mounting,
but be aware:

- **Do not conditionally render portals based on server/client detection.** MUI
  already does this. Extra checks cause hydration mismatches.
- **Use `disablePortal` if you need server-rendered content** (e.g., for SEO in
  Dialog):

```tsx
<Dialog open={open} disablePortal>
  <DialogTitle>Server-Rendered Dialog</DialogTitle>
  <DialogContent>This content is in the DOM tree, not a portal.</DialogContent>
</Dialog>
```

- **Menu/Autocomplete `disablePortal`** keeps the dropdown in the DOM flow, avoiding
  SSR issues with portals but requiring careful z-index management.

### Dynamic imports for heavy MUI X components

Large components like DataGrid, DatePicker, and Charts add significant bundle weight.
Use `next/dynamic` to code-split them:

```tsx
import dynamic from 'next/dynamic';

const DataGrid = dynamic(
  () => import('@mui/x-data-grid').then((mod) => mod.DataGrid),
  {
    loading: () => <Skeleton variant="rectangular" height={400} />,
    ssr: false, // DataGrid is interactive-only; skip SSR
  }
);

const DatePicker = dynamic(
  () => import('@mui/x-date-pickers/DatePicker').then((mod) => mod.DatePicker),
  {
    loading: () => <Skeleton variant="rectangular" width={300} height={56} />,
    ssr: false,
  }
);
```

**When to use `ssr: false`:**
- Component is purely interactive (DataGrid, Charts)
- Component relies heavily on browser APIs (DatePicker with locale)
- Component is below the fold and not SEO-relevant

**When to keep SSR enabled:**
- Content is above the fold and needs fast FCP
- Content is SEO-relevant (product listings, article text)

---

## 7. Emotion Cache Configuration

### prepend: true is critical

```tsx
const cache = createCache({
  key: 'mui',
  prepend: true, // MUI styles go BEFORE other <style> tags
});
```

Without `prepend: true`, MUI styles may be overridden by global CSS or other
libraries because of CSS source order. With `prepend: true`, MUI styles are
inserted at the top of `<head>`, giving them lower specificity in the cascade
and allowing your custom styles to win.

### Cache key naming to avoid conflicts

If you have multiple Emotion caches (e.g., MUI + your own styled-components via
Emotion), each must have a unique `key`:

```tsx
// MUI cache
const muiCache = createCache({ key: 'mui', prepend: true });

// App-specific cache
const appCache = createCache({ key: 'app' });
```

The `key` is used as a prefix in generated class names (`mui-1a2b3c`, `app-4d5e6f`)
and as the `data-emotion` attribute value on `<style>` tags. Duplicate keys cause
style clobbering.

### Per-request cache on server (not singleton)

On the server, **create a new Emotion cache for every request**. A singleton cache
accumulates styles across requests and causes:
- Memory leaks (styles from request A bleed into request B)
- Wrong styles rendered (stale cache entries)
- Increasing response sizes over time

```tsx
// WRONG: singleton cache on server
const cache = createCache({ key: 'mui' }); // created once at module scope

// CORRECT: per-request cache
function handleRequest(req, res) {
  const cache = createCache({ key: 'mui' }); // fresh for each request
  // ... render with this cache
}
```

In the App Router, the `useState` initializer in `NextAppDirEmotionCacheProvider`
(section 1) already ensures per-render cache creation because React creates a new
component instance for each server render.

In the Pages Router, `_document.tsx`'s `getInitialProps` creates a new cache per
request (section 2).

---

## Quick Reference: Which Setup Do I Need?

| Setup | App Router (v13+) | Pages Router | Static Export |
|-------|-------------------|--------------|---------------|
| ThemeRegistry + useServerInsertedHTML | Required | N/A | Required |
| _document.tsx + extractCriticalToChunks | N/A | Required | N/A |
| getInitColorSchemeScript | Recommended | Recommended | Recommended |
| Pigment CSS | Alternative (replaces Emotion) | Alternative | Alternative |
| @emotion/cache with prepend | Required | Required | Required |
| @emotion/server | Not needed | Required | Not needed |

## Package Versions

These patterns apply to:
- `@mui/material` v5.14+ and v6.x
- `next` v13.4+ (App Router), v12+ (Pages Router)
- `@emotion/react` v11.x, `@emotion/cache` v11.x
- `@pigment-css/react` v0.0.x (early adoption, API may change)
