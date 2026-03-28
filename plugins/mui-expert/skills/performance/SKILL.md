---
name: mui-performance
description: MUI Performance Optimization skill. Covers tree-shaking, bundle size analysis, emotion caching, preventing unnecessary re-renders, sx prop pitfalls, virtualization, lazy loading, SSR/Next.js setup, and code splitting strategies.
triggers:
  - performance
  - bundle size
  - tree-shaking
  - optimization
  - lazy loading
  - SSR
  - Next.js
  - virtualization
  - re-render
  - emotion cache
  - CacheProvider
  - source-map-explorer
  - webpack
  - memoization
globs:
  - "*.tsx"
  - "*.ts"
  - "*.jsx"
  - "*.js"
  - "webpack.config.*"
  - "next.config.*"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# MUI Performance Optimization Skill

---

## Tree-Shaking: Import Strategy

### Named Imports vs Path Imports

```tsx
// AVOID — barrel import may bloat bundle depending on bundler/config
import { Button, TextField, Dialog } from '@mui/material';

// PREFER for legacy bundlers — explicit path imports guarantee tree-shaking
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
```

With modern bundlers (Vite, webpack 5 with `sideEffects: false`, esbuild), named imports from `@mui/material` are safely tree-shaken. Verify your bundler supports this before switching.

### Icon Imports — Critical for Bundle Size

```tsx
// BAD — imports entire icons library (~4MB)
import { Delete, Edit, Save } from '@mui/icons-material';

// GOOD — imports only the icons you use
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
```

### babel-plugin-import (legacy Babel setups)

```json
// .babelrc
{
  "plugins": [
    [
      "babel-plugin-import",
      {
        "libraryName": "@mui/material",
        "libraryDirectory": "",
        "camel2DashComponentName": false
      },
      "core"
    ]
  ]
}
```

---

## Bundle Size Analysis

```bash
# webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# In webpack.config.js:
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
plugins: [new BundleAnalyzerPlugin()]

# source-map-explorer (works with CRA, Vite, any source maps)
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer 'build/static/js/*.js'

# Vite rollup visualizer
npm install --save-dev rollup-plugin-visualizer
# In vite.config.ts:
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), visualizer({ open: true, gzipSize: true })]
```

Target sizes (gzipped) to watch for:
- `@mui/material` core: ~50-80KB
- `@mui/icons-material` per icon: ~1-2KB
- `@mui/x-data-grid`: ~120KB
- `@mui/x-date-pickers` + dayjs: ~60KB

---

## Emotion Caching

### Default Setup (Client-Side)

```tsx
// Default cache works for most apps — no changes needed
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const cache = createCache({
  key: 'mui',                // prefix for generated CSS class names
  prepend: true,             // insert styles before other CSS (prevents overrides)
});

function App() {
  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
```

### Nonce for Content Security Policy

```tsx
const cache = createCache({
  key: 'mui',
  nonce: document.querySelector('meta[property="csp-nonce"]')?.getAttribute('content') ?? undefined,
  prepend: true,
});
```

---

## Preventing Unnecessary Re-Renders

### The sx Prop Gotcha

The `sx` prop creates a new object reference every render, which causes style recalculation. Solutions:

```tsx
// BAD — new object created on every render
<Box sx={{ display: 'flex', gap: 2, p: 1 }} />

// GOOD — move static sx outside the component
const boxStyles = { display: 'flex', gap: 2, p: 1 };
function MyComponent() {
  return <Box sx={boxStyles} />;
}

// GOOD — useMemo for sx that depends on props/state
function MyComponent({ isActive }: { isActive: boolean }) {
  const styles = useMemo(
    () => ({
      display: 'flex',
      backgroundColor: isActive ? 'primary.main' : 'grey.100',
      color: isActive ? 'primary.contrastText' : 'text.primary',
    }),
    [isActive]
  );
  return <Box sx={styles} />;
}

// BEST — use styled() for components with style variants
const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  display: 'flex',
  backgroundColor: isActive ? theme.palette.primary.main : theme.palette.grey[100],
  color: isActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));
```

### Memoizing DataGrid Columns

```tsx
// BAD — columns recreated on every render, causes focus loss during editing
function MyGrid({ data }) {
  return (
    <DataGrid
      rows={data}
      columns={[
        { field: 'name', flex: 1 },
        { field: 'email', flex: 1 },
      ]}
    />
  );
}

// GOOD — stable columns reference
const COLUMNS: GridColDef[] = [
  { field: 'name', flex: 1 },
  { field: 'email', flex: 1 },
];

function MyGrid({ data }) {
  return <DataGrid rows={data} columns={COLUMNS} />;
}

// If columns depend on state, use useMemo
function MyGrid({ data, onDelete }) {
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'name', flex: 1 },
    {
      field: 'actions',
      renderCell: (params) => (
        <IconButton onClick={() => onDelete(params.row.id)}>
          <DeleteIcon />
        </IconButton>
      ),
    },
  ], [onDelete]);  // onDelete should be stable (useCallback)

  return <DataGrid rows={data} columns={columns} />;
}
```

### Component-Level Memoization

```tsx
// React.memo for pure list items
const UserCard = React.memo(function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <Card>
      <CardContent>{user.name}</CardContent>
      <CardActions>
        <Button onClick={() => onEdit(user.id)}>Edit</Button>
      </CardActions>
    </Card>
  );
});

// useCallback for stable event handlers passed to memoized children
function UserList({ users }) {
  const handleEdit = useCallback((id: string) => {
    setEditingId(id);
  }, []);  // no dependencies — stable forever

  return users.map((u) => <UserCard key={u.id} user={u} onEdit={handleEdit} />);
}
```

---

## Lazy Loading MUI Components

Heavy components to lazy-load: DataGrid, DatePicker, Charts, rich text editors.

```tsx
import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@mui/material';

// Lazy load heavy MUI X components
const DataGrid = lazy(() =>
  import('@mui/x-data-grid').then((m) => ({ default: m.DataGrid }))
);

const DatePicker = lazy(() =>
  import('@mui/x-date-pickers/DatePicker').then((m) => ({ default: m.DatePicker }))
);

// Usage with Suspense fallback
function AdminPage() {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={400} />}>
      <DataGrid rows={[]} columns={[]} />
    </Suspense>
  );
}

// Lazy load heavy icon sets
const HeavyIcon = lazy(() => import('@mui/icons-material/SomeHeavyIcon'));
```

### Dynamic Import for Conditional Heavy Features

```tsx
// Only load chart library when user navigates to analytics
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <AnalyticsPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

---

## Server-Side Rendering (SSR)

### Emotion SSR Setup (Generic Node.js / Express)

```tsx
// server.tsx
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';
import { renderToString } from 'react-dom/server';

function renderApp(url: string) {
  const cache = createCache({ key: 'mui' });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  const html = renderToString(
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <App url={url} />
      </ThemeProvider>
    </CacheProvider>
  );

  const chunks = extractCriticalToChunks(html);
  const styleTags = constructStyleTagsFromChunks(chunks);

  return `
    <!DOCTYPE html>
    <html>
      <head>${styleTags}</head>
      <body><div id="root">${html}</div></body>
    </html>
  `;
}
```

### Next.js App Router Integration

```tsx
// src/app/mui-registry.tsx
'use client';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { useState } from 'react';

export default function MuiRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'mui' });
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

// src/app/layout.tsx
import MuiRegistry from './mui-registry';
import ThemeRegistry from './theme-registry';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MuiRegistry>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </MuiRegistry>
      </body>
    </html>
  );
}
```

### Next.js Pages Router (Legacy)

```tsx
// pages/_document.tsx
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const cache = createCache({ key: 'mui' });
    const { extractCriticalToChunks } = createEmotionServer(cache);

    const originalRenderPage = ctx.renderPage;
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App: any) =>
          function EnhancedApp(props) {
            return <App emotionCache={cache} {...props} />;
          },
      });

    const initialProps = await Document.getInitialProps(ctx);
    const chunks = extractCriticalToChunks(initialProps.html);
    const emotionStyleTags = chunks.styles.map((style) => (
      <style
        data-emotion={`${style.key} ${style.ids.join(' ')}`}
        key={style.key}
        dangerouslySetInnerHTML={{ __html: style.css }}
      />
    ));

    return { ...initialProps, emotionStyleTags };
  }

  render() {
    return (
      <Html lang="en">
        <Head>{(this.props as any).emotionStyleTags}</Head>
        <body><Main /><NextScript /></body>
      </Html>
    );
  }
}
```

---

## Virtualization

### DataGrid Built-in Virtualization

```tsx
// DataGrid virtualizes by default — configure buffer sizes
<DataGrid
  rows={largeDataset}
  columns={columns}
  rowBufferPx={200}    // px of rows to render outside viewport (default 150)
  columnBufferPx={200} // px of columns to render outside viewport
  // Measure rows individually if heights vary
  getRowHeight={() => 'auto'}
  getEstimatedRowHeight={() => 52}
/>
```

### react-window for Custom Lists

```tsx
import { FixedSizeList, VariableSizeList } from 'react-window';
import { ListItem, ListItemText } from '@mui/material';

// Fixed height rows
function VirtualList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <ListItem style={style} key={items[index].id} divider>
      <ListItemText primary={items[index].name} secondary={items[index].email} />
    </ListItem>
  );

  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={72}   // row height in px
      overscanCount={5}
    >
      {Row}
    </FixedSizeList>
  );
}

// Variable height rows
const rowHeights = new Map<number, number>();

function VariableList({ items }: { items: Item[] }) {
  const getSize = (index: number) => rowHeights.get(index) ?? 72;

  return (
    <VariableSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={getSize}
      estimatedItemSize={72}
    >
      {({ index, style }) => (
        <ListItem style={style}>
          <ListItemText primary={items[index].name} />
        </ListItem>
      )}
    </VariableSizeList>
  );
}
```

---

## Font Loading Optimization

```html
<!-- In index.html — preload the font you actually use -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
/>
```

```ts
// Self-host fonts for best performance
// npm install @fontsource/roboto
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
```

```ts
// Tell MUI where to find Material Icons font (or use SVG icons instead)
// SVG icons from @mui/icons-material are preferred over font icons:
// - No network request
// - Smaller per-icon footprint
// - Tree-shakeable
import DeleteIcon from '@mui/icons-material/Delete'; // SVG, tree-shaken
```

---

## Performance Checklist

- [ ] Icons: use path imports from `@mui/icons-material/IconName`
- [ ] DataGrid/DatePicker/Charts: lazy loaded with `React.lazy`
- [ ] `columns` array in DataGrid: defined outside component or memoized
- [ ] Static `sx` objects: defined outside component
- [ ] Dynamic `sx` objects: wrapped in `useMemo`
- [ ] Event handlers passed to memoized children: wrapped in `useCallback`
- [ ] SSR/Next.js App Router: emotion registry properly configured
- [ ] Font loading: self-hosted via `@fontsource/roboto`
- [ ] Bundle analysis: run `source-map-explorer` after each major feature addition
- [ ] Large lists: virtualized with `react-window` or DataGrid virtualization
