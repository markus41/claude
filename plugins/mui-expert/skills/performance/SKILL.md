---
name: performance
description: MUI performance optimization — tree-shaking, bundle size, rendering, SSR
triggers:
  - performance
  - bundle size
  - tree-shaking
  - optimization
  - lazy loading
  - SSR
  - Next.js
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
  - "*.jsx"
  - "*.js"
  - "webpack.config.*"
  - "next.config.*"
---

# MUI Performance Optimization

## Tree-Shaking — Named Imports Only

Use named imports from `@mui/material`. Never import from barrel files or index — bundlers
cannot tree-shake those effectively.

```tsx
// BAD — imports the entire @mui/material bundle (~300 KB+ gzipped)
import { Button, TextField, Dialog } from '@mui/material';

// GOOD — each import is individually tree-shaken
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
```

### Icons — always deep import

```tsx
// BAD — imports all 2100+ icons (~1 MB+)
import { Delete, Edit, Add } from '@mui/icons-material';

// GOOD — only the used icon is bundled
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
```

### babel-plugin-import (alternative for barrel imports)

If you must use named imports from barrels, configure the plugin to transform them:

```json
// .babelrc
{
  "plugins": [
    ["babel-plugin-import", {
      "libraryName": "@mui/material",
      "libraryDirectory": "",
      "camel2DashComponentName": false
    }]
  ]
}
```

## Bundle Analysis

```bash
# Install source-map-explorer
npm install --save-dev source-map-explorer

# Add to package.json
"scripts": {
  "analyze": "source-map-explorer 'build/static/js/*.js'"
}

# For Next.js, use @next/bundle-analyzer
npm install --save-dev @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({});

// Run:
// ANALYZE=true npm run build
```

```bash
# Webpack bundle analyzer (CRA or custom webpack)
npm install --save-dev webpack-bundle-analyzer

# In webpack config:
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
plugins: [new BundleAnalyzerPlugin()]
```

## Emotion Caching

Without caching, Emotion regenerates style sheets on every SSR request. Use `createCache`
with a `CacheProvider` for significant SSR performance gains.

```tsx
// lib/createEmotionCache.ts
import createCache from '@emotion/cache';

export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
```

```tsx
// _app.tsx (Next.js Pages Router)
import { CacheProvider, EmotionCache } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createEmotionCache from '../lib/createEmotionCache';

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) {
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  );
}
```

```tsx
// _document.tsx — inject emotion styles before MUI styles
import Document, { Html, Head, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from '../lib/createEmotionCache';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>{(this.props as any).emotionStyleTags}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

MyDocument.getInitialProps = async (ctx) => {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: any) => (props) => <App emotionCache={cache} {...props} />,
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

  return { ...initialProps, emotionStyleTags };
};
```

## Avoiding Re-renders

### Memoize sx objects

The `sx` prop creates a new object on every render, causing Emotion to recalculate styles.

```tsx
import { useMemo } from 'react';
import Box from '@mui/material/Box';

// BAD — new object reference every render triggers style recalculation
function MyComponent({ isActive }: { isActive: boolean }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        backgroundColor: isActive ? 'primary.light' : 'grey.100',
      }}
    >
      Content
    </Box>
  );
}

// GOOD — memoize the sx object when it depends on props/state
function MyComponent({ isActive }: { isActive: boolean }) {
  const sx = useMemo(
    () => ({
      p: 2,
      borderRadius: 1,
      backgroundColor: isActive ? 'primary.light' : 'grey.100',
    }),
    [isActive]
  );

  return <Box sx={sx}>Content</Box>;
}

// BEST for static styles — define outside component (zero recalculation)
const styles = {
  container: { p: 2, borderRadius: 1 },
  active: { backgroundColor: 'primary.light' },
  inactive: { backgroundColor: 'grey.100' },
} as const;

function MyComponent({ isActive }: { isActive: boolean }) {
  return (
    <Box sx={[styles.container, isActive ? styles.active : styles.inactive]}>
      Content
    </Box>
  );
}
```

### Memoize components

```tsx
import React, { memo, useCallback } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

interface ItemProps {
  id: string;
  label: string;
  onDelete: (id: string) => void;
}

// memo prevents re-render when parent re-renders but props are unchanged
const ProductItem = memo(function ProductItem({ id, label, onDelete }: ItemProps) {
  return (
    <ListItem
      secondaryAction={
        <IconButton aria-label={`Delete ${label}`} onClick={() => onDelete(id)}>
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemText primary={label} />
    </ListItem>
  );
});

// In parent — stabilize callback with useCallback
function ProductList({ items }: { items: Item[] }) {
  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);   // no deps — setItems is stable

  return (
    <List>
      {items.map((item) => (
        <ProductItem
          key={item.id}
          id={item.id}
          label={item.name}
          onDelete={handleDelete}
        />
      ))}
    </List>
  );
}
```

### Avoid inline function handlers in render

```tsx
// BAD — new function reference on every render
<Button onClick={() => handleSave(item.id)}>Save</Button>

// GOOD — stable reference
const handleSave = useCallback(() => {
  doSave(item.id);
}, [item.id]);

<Button onClick={handleSave}>Save</Button>
```

## Virtualization for Large Lists

Render only visible rows — critical for DataGrid-like scenarios with 1000+ rows.

```tsx
// Option 1: MUI X DataGrid (built-in virtualization)
import { DataGrid } from '@mui/x-data-grid/DataGrid';

<DataGrid
  rows={largeDataset}   // 10,000+ rows — only renders ~20 visible rows
  columns={columns}
  getRowId={(row) => row.id}
/>

// Option 2: react-window for custom lists
import { FixedSizeList } from 'react-window';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

function VirtualizedList({ items }: { items: string[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <ListItem style={style} key={index} component="div" disablePadding>
      <ListItemText primary={items[index]} />
    </ListItem>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={46}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// Option 3: react-virtuoso (easier API, variable row heights)
import { Virtuoso } from 'react-virtuoso';
import ListItem from '@mui/material/ListItem';

<Virtuoso
  style={{ height: '400px' }}
  totalCount={items.length}
  itemContent={(index) => (
    <ListItem>
      <ListItemText primary={items[index].name} />
    </ListItem>
  )}
/>
```

## Lazy Loading Heavy Components

MUI X components (DataGrid, DatePicker) are large. Split them to a separate chunk.

```tsx
import { lazy, Suspense } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Lazy load DataGrid — only fetched when component mounts
const DataGrid = lazy(() =>
  import('@mui/x-data-grid').then((m) => ({ default: m.DataGrid }))
);

// Lazy load DatePicker
const DatePicker = lazy(() =>
  import('@mui/x-date-pickers/DatePicker').then((m) => ({ default: m.DatePicker }))
);

function Loading() {
  return (
    <Box display="flex" justifyContent="center" p={4}>
      <CircularProgress />
    </Box>
  );
}

function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DataGrid rows={rows} columns={columns} />
    </Suspense>
  );
}
```

### Lazy load entire feature sections

```tsx
// Next.js — disable SSR for heavy client-only components
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('../components/RichTextEditor'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

const ChartsSection = dynamic(() => import('../components/ChartsSection'), {
  ssr: false,
});
```

## SSR Setup

### Next.js Pages Router

See the Emotion caching section above for full `_app.tsx` + `_document.tsx` setup.

```bash
npm install @emotion/server @emotion/cache @emotion/react
```

Key points:
- Create a fresh `EmotionCache` per request (not shared across requests)
- Extract critical CSS via `extractCriticalToChunks` in `getInitialProps`
- Inject style tags in `<Head>` before the page renders

### Next.js App Router (v13+)

```tsx
// app/layout.tsx
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';

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

```tsx
// components/ThemeRegistry/ThemeRegistry.tsx
'use client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NextAppDirEmotionCacheProvider } from './EmotionCache';
import theme from '@/lib/theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
}
```

```tsx
// components/ThemeRegistry/EmotionCache.tsx
'use client';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useState } from 'react';

export function NextAppDirEmotionCacheProvider({
  options,
  children,
}: {
  options: { key: string };
  children: React.ReactNode;
}) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache(options);
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
```

## Code Splitting for MUI X

```tsx
// Split DataGrid, DatePicker, and Charts into separate chunks
// Each will only load when that route/component is first rendered

// routes/reports.tsx — DataGrid loads only when user visits /reports
const ReportsDataGrid = lazy(() =>
  import('@/components/ReportsDataGrid')   // ReportsDataGrid imports DataGridPremium internally
);

// routes/analytics.tsx — Charts load only when user visits /analytics
const AnalyticsCharts = lazy(() => import('@/components/AnalyticsCharts'));

// routes/schedule.tsx — DatePicker loads only when user visits /schedule
const SchedulePicker = lazy(() => import('@/components/SchedulePicker'));
```

## Theme Singleton (Avoid Recreation)

```tsx
// BAD — new theme object on every render causes all consumers to re-render
function App() {
  return (
    <ThemeProvider theme={createTheme({ palette: { mode: 'dark' } })}>
      <App />
    </ThemeProvider>
  );
}

// GOOD — create once outside of component or in useMemo
const theme = createTheme({
  palette: { mode: 'light' },
});

// For dynamic themes (user toggles dark mode):
function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const theme = useMemo(
    () => createTheme({ palette: { mode } }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToggleButton onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}>
        Toggle theme
      </ToggleButton>
      <MyApp />
    </ThemeProvider>
  );
}
```

## Performance Checklist

- [ ] All MUI imports are deep imports (not from `@mui/material` barrel)
- [ ] All icon imports are deep imports (not from `@mui/icons-material` barrel)
- [ ] Static `sx` objects are defined outside components
- [ ] Dynamic `sx` objects that depend on props are wrapped in `useMemo`
- [ ] Event handlers in lists use `useCallback` or are defined outside the render
- [ ] List components with 100+ items use virtualization
- [ ] DataGrid, DatePicker, Charts are lazy-loaded in routes that don't need them on initial load
- [ ] Emotion cache is per-request on SSR (not a singleton)
- [ ] Theme is created once (not inside render)
- [ ] Bundle analyzer run after major dependency changes
