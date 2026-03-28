---
name: MUI Performance & Architectural Patterns Research
description: Comprehensive research on MUI bundle optimization, CSS-in-JS performance, DataGrid tuning, RSC compatibility, and advanced TypeScript patterns
type: reference
---

# MUI Performance Optimization & Architectural Patterns
## Comprehensive Research Report

**Research Date**: 2026-03-28
**Sources**: MUI Official Documentation via WebFetch

---

## 1. BUNDLE SIZE OPTIMIZATION

### Tree-Shaking & Import Strategies

**Named Imports (Recommended)**
```typescript
// ✅ Good - Enables tree-shaking
import { Button, TextField, Card } from '@mui/material';

// ❌ Avoid - Pulls entire library
import * as MUI from '@mui/material';
```

**Key Findings:**
- Named imports allow bundlers (webpack, esbuild, Vite) to eliminate unused components during build
- MUI's modular architecture inherently supports dead-code elimination
- Production builds with minification required for optimal results

### CSS Variable Architecture
- MUI uses CSS custom properties extensively (`--mui-palette-primary-main`, `--mui-spacing`)
- CSS variables reduce duplicate style definitions across components and themes
- Dark mode implemented via `[data-mui-color-scheme="dark"]` attribute switching—**no style duplication**
- Layer-based organization (`@layer theme, docsearch, mui, utilities`) enables predictable cascade and style removal

### Code Splitting for Heavy Components

```typescript
import dynamic from 'next/dynamic';

// For Next.js App Router
const DataGrid = dynamic(() => import('@mui/x-data-grid'), {
  loading: () => <LoadingSpinner />,
  ssr: false // DataGrid not suitable for SSR
});
```

---

## 2. EMOTION PERFORMANCE & CSS-IN-JS

### Emotion Cache Configuration (Critical for SSR)

```typescript
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';

const cache = createCache({
  key: 'mui-style',
  prepend: true, // Critical: inserts Emotion styles before other stylesheets
});

const { extractCriticalToChunks } = createEmotionServer(cache);

const html = renderToString(
  <CacheProvider value={cache}>
    <App />
  </CacheProvider>
);
const { css, ids } = extractCriticalToChunks(html);
```

**Configuration Key Options:**
- `prepend: true` - **Recommended for SSR** - ensures MUI styles have correct cascade priority
- `key: 'custom-prefix'` - Namespace styles to avoid conflicts
- `supportBaseCSSOMAPIs: false` - Compatibility with older browsers if needed

### Avoid Re-renders from sx Prop

```typescript
// ❌ Bad - Creates new object on every render
const MyComponent = ({ isActive }) => (
  <Box sx={{
    backgroundColor: isActive ? 'primary.main' : 'background.paper',
    padding: 2
  }} />
);

// ✅ Good - Memoized sx object
const containerSx = {
  display: 'flex',
  gap: 2,
  padding: 3,
  backgroundColor: 'background.paper',
};

const MyComponent = ({ isActive }) => (
  <Box sx={{
    ...containerSx,
    opacity: isActive ? 1 : 0.5,
  }} />
);
```

### When styled() is Faster Than sx

```typescript
// ✅ Use styled for:
// - Components rendered many times
// - Complex pseudo-selectors/media queries
// - Performance-critical paths

import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  '&:hover': { backgroundColor: theme.palette.primary.dark },
  '&:disabled': { backgroundColor: theme.palette.action.disabled },
  transition: theme.transitions.create('all'),
}));

// ✅ Use sx for:
// - One-off styling
// - Responsive adjustments
// - Theme-dependent styling with simple conditions
```

---

## 3. PIGMENT CSS (ZERO-RUNTIME CSS-IN-JS)

### Status & Architecture
- **Zero-Runtime**: Styles extracted at build time, no runtime JS for styling
- **Current State**: Emerging technology, not yet production-default for MUI v6
- **Alternative**: Modern MUI emphasizes CSS custom properties (CSS variables) instead

### Key Limitation
- Limited to **static styles only** (dynamic values require CSS variables)
- Not suitable for complex theming scenarios
- Build-time processing increases build duration

### Migration Path from Emotion
1. Identify static vs dynamic styles
2. Move static styles to Pigment CSS build-time extraction
3. Keep dynamic styles in sx prop or styled()
4. Use CSS variables for theme values in both

---

## 4. RENDER OPTIMIZATION PATTERNS

### React.memo with MUI

```typescript
const MemoizedButton = memo(({ onClick, label, variant }) => (
  <Button variant={variant} onClick={onClick}>
    {label}
  </Button>
));

// With custom comparison
const MemoizedListItem = memo(
  ({ item, onSelect, isSelected }) => (
    <ListItem
      button
      selected={isSelected}
      onClick={() => onSelect(item.id)}
    >
      <ListItemText primary={item.name} />
    </ListItem>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);
```

### useCallback for Event Handlers

```typescript
// ❌ Bad: onSelect recreated each render → memoized children re-render
const ParentComponent = ({ items }) => {
  const onSelect = (id) => { /* ... */ };
  return items.map(item => (
    <MemoizedItem key={item.id} onSelect={onSelect} />
  ));
};

// ✅ Good: stable callback reference
const ParentComponent = ({ items }) => {
  const onSelect = useCallback((id) => { /* ... */ }, []);
  return items.map(item => (
    <MemoizedItem key={item.id} onSelect={onSelect} />
  ));
};
```

### Avoiding Theme Object Recreation

```typescript
// ❌ Bad: Creates new theme on every render
const Component = () => {
  const theme = createTheme({
    palette: { primary: { main: '#1976d2' } },
  });
  return <ThemeProvider theme={theme}><App /></ThemeProvider>;
};

// ✅ Good: Theme created once at module level
const theme = createTheme({
  palette: { primary: { main: '#1976d2' } },
});

const Component = () => (
  <ThemeProvider theme={theme}><App /></ThemeProvider>
);
```

### Stable References for sx Objects

```typescript
// ✅ Define sx outside component
const containerSx = {
  display: 'flex',
  gap: 2,
  padding: 3,
};

const Component = ({ isActive }) => (
  <Box sx={{
    ...containerSx,
    opacity: isActive ? 1 : 0.5,
  }} />
);

// ✅ Or use useMemo for dynamic sx
const Component = ({ isActive }) => {
  const dynamicSx = useMemo(() => ({
    ...containerSx,
    opacity: isActive ? 1 : 0.5,
  }), [isActive]);

  return <Box sx={dynamicSx} />;
};
```

---

## 5. DATAGRID PERFORMANCE

### Virtualization

- **Row Virtualization**: Built-in, only visible rows + buffer rendered
- **Column Virtualization**: Use `columnBuffer` and `columnThrottleMs`

```typescript
<DataGrid
  columns={columns}
  rows={rows}
  columnBuffer={5}       // Render 5 columns outside viewport
  columnThrottleMs={100} // Throttle column rendering updates
/>
```

### Memoizing Columns and Rows

```typescript
const GridComponent = () => {
  // ✅ Memoize columns definition
  const columns = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        width: 100,
        renderCell: (params) => <strong>{params.value}</strong>
      },
      {
        field: 'actions',
        headerName: 'Actions',
        renderCell: (params) => (
          <Button onClick={() => handleEdit(params.row.id)}>Edit</Button>
        ),
        disableSelectionOnClick: true,
      }
    ],
    []
  );

  // ✅ Memoize rows
  const rows = useMemo(
    () => data.map((item, idx) => ({ ...item, id: idx })),
    [data]
  );

  return <DataGrid columns={columns} rows={rows} />;
};
```

### Debouncing Filters

```typescript
const [filterModel, setFilterModel] = useState({});
const [debouncedFilters, setDebouncedFilters] = useState({});

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedFilters(filterModel);
    // Execute actual filtering/API call
  }, 300);

  return () => clearTimeout(timer);
}, [filterModel]);

<DataGrid
  onFilterModelChange={setFilterModel}
  filterModel={debouncedFilters}
  rows={filteredRows}
/>
```

### Optimistic Updates

```typescript
const handleDelete = async (id) => {
  // Optimistic update
  const newRows = rows.filter(row => row.id !== id);
  setRows(newRows);

  try {
    await deleteRow(id);
  } catch (error) {
    // Rollback on failure
    setRows(initialRows);
  }
};
```

### Pagination vs Infinite Scroll

**Pagination** (Recommended):
- Fixed server load
- Predictable memory usage
- Better for large datasets
- Better UX for enterprise apps

**Infinite Scroll**:
- Continuous DOM growth
- Memory accumulation
- Better for browse experience

---

## 6. REACT SERVER COMPONENTS COMPATIBILITY

### Client Boundaries Required For

- Interactive components (Button, TextField, Modal, Dropdown)
- Theme providers
- Context consumers
- Event handlers
- React hooks (useState, useEffect, useCallback, etc.)

```typescript
// ✅ Server Component - Layout, static content
export default async function Layout() {
  const data = await fetchData(); // Server-only

  return (
    <html>
      <ClientThemeProvider>
        <Header data={data} />
        <ClientComponent />
      </ClientThemeProvider>
    </html>
  );
}

// Client Component wrapper for theme
'use client';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

export function ClientThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

### Progressive Enhancement

```typescript
'use client';

import { Box, TextField, Button } from '@mui/material';

export function SearchForm() {
  return (
    <Box component="form" action="/search" method="POST">
      <TextField name="q" placeholder="Search..." />
      <Button type="submit">Search</Button>
    </Box>
  );
}
```

---

## 7. CODE SPLITTING STRATEGIES

### Dynamic Imports for Heavy Components

```typescript
import dynamic from 'next/dynamic';
import Skeleton from '@mui/lab/Skeleton';

const DataGrid = dynamic(
  () => import('@mui/x-data-grid').then(mod => mod.DataGrid),
  {
    loading: () => <Skeleton variant="rectangular" height={400} />,
    ssr: false,
  }
);
```

### Route-Based Splitting

```typescript
const routes = [
  { path: '/dashboard', component: lazy(() => import('./Dashboard')) },
  { path: '/analytics', component: lazy(() => import('./Analytics')) },
  { path: '/settings', component: lazy(() => import('./Settings')) },
];

export function AppRouter() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <Routes>
        {routes.map(route => (
          <Route key={route.path} path={route.path} element={<route.component />} />
        ))}
      </Routes>
    </Suspense>
  );
}
```

---

## 8. ACCESSIBILITY PERFORMANCE

### Focus Management

```typescript
'use client';

import { Dialog, DialogTitle, TextField, Button } from '@mui/material';
import { useRef, useEffect } from 'react';

export function AccessibleDialog({ open, onClose }) {
  const firstFocusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>User Information</DialogTitle>
      <TextField ref={firstFocusRef} label="Name" autoFocus />
      <Button onClick={onClose}>Close</Button>
    </Dialog>
  );
}
```

### ARIA Live Regions

```typescript
import { Alert, Snackbar } from '@mui/material';

<Snackbar
  open={open}
  autoHideDuration={6000}
  role="status"
  aria-live="polite" // Auto-announced to screen readers
>
  <Alert>{message}</Alert>
</Snackbar>
```

### Skip Navigation

```typescript
<Link
  href="#main-content"
  sx={{
    position: 'absolute',
    top: '-40px',
    left: 0,
    '&:focus': { top: 0 }
  }}
>
  Skip to main content
</Link>
```

**Performance Impact**: Minimal (ARIA attributes only, no layout recalc)

---

## 9. ADVANCED TYPESCRIPT PATTERNS

### OverridableComponent Pattern

```typescript
import { OverridableComponent } from '@mui/material/OverridableComponent';
import SvgIcon from '@mui/material/SvgIcon';

interface CustomIconProps {
  children?: React.ReactNode;
  color?: 'primary' | 'secondary';
}

type CustomIconTypeMap<P = {}, D extends React.ElementType = React.ElementType> = {
  props: P & CustomIconProps;
  defaultComponent: D;
};

export const CustomIcon: OverridableComponent<CustomIconTypeMap> =
  React.forwardRef((props, ref) => {
    const { children, color = 'primary', ...other } = props;
    return (
      <SvgIcon color={color} ref={ref} {...other}>
        {children}
      </SvgIcon>
    );
  });
```

### Component Prop Typing

```typescript
import { forwardRef, ElementType } from 'react';
import { Box, BoxProps } from '@mui/material';

interface CustomBoxProps<C extends ElementType = 'div'> extends BoxProps<C> {
  variant?: 'card' | 'section';
}

export const CustomBox = forwardRef<HTMLElement, CustomBoxProps>(
  ({ variant, ...props }, ref) => {
    const variantStyles = {
      card: { boxShadow: 1, borderRadius: 2, p: 2 },
      section: { border: '1px solid', borderColor: 'divider', p: 3 },
    };

    return (
      <Box
        ref={ref}
        sx={variant ? variantStyles[variant] : {}}
        {...props}
      />
    );
  }
);
```

### Theme Augmentation

```typescript
declare module '@mui/material/styles' {
  interface Theme {
    customSpacing: {
      baseUnit: number;
      small: number;
      medium: number;
      large: number;
    };
  }

  interface Palette {
    custom: {
      accent: string;
      background: string;
    };
  }
}

export const customTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    custom: { accent: '#ff9800', background: '#f5f5f5' },
  },
  customSpacing: { baseUnit: 8, small: 12, medium: 20, large: 32 },
});
```

### Polymorphic Component Types

```typescript
import { ComponentProps, ElementType, ReactNode, forwardRef } from 'react';

interface PolymorphicProps<C extends ElementType = 'div'> {
  children?: ReactNode;
  component?: C;
}

type PolymorphicComponentProps<C extends ElementType, P = {}> =
  PolymorphicProps<C> & Omit<ComponentProps<C>, 'component'> & P;

interface CustomComponentProps {
  highlight?: boolean;
}

export const CustomComponent = forwardRef<
  HTMLElement,
  PolymorphicComponentProps<ElementType, CustomComponentProps>
>(({ component: Component = 'div', highlight, ...props }, ref) => (
  <Box
    ref={ref}
    component={Component}
    sx={{
      ...(highlight && { backgroundColor: 'warning.light', p: 2 }),
    }}
    {...props}
  />
));
```

---

## PERFORMANCE CHECKLIST

### Bundle & Load Time
- Use named imports (`import { Button } from '@mui/material'`)
- Enable tree-shaking in build config
- Dynamic import MUI X components
- Implement route-based code splitting
- Use `next/dynamic` for heavy components

### Rendering & Runtime
- Memoize columns/rows in DataGrid
- Use `useCallback` for event handlers
- Create theme once at module level
- Define sx objects outside components
- Use `React.memo` for frequently-rendered components
- Prefer `styled()` for complex, frequently-rendered components
- Use `sx` for simple, one-off styling

### CSS & Styling
- Leverage CSS variables for theme values
- Configure Emotion cache for SSR (`prepend: true`)
- Avoid sx prop recreation via memoization
- Use dark mode via `data-mui-color-scheme` (no style duplication)

### DataGrid
- Enable row/column virtualization
- Memoize `columns` and `rows` props
- Debounce filter input
- Use pagination for large datasets
- Implement optimistic updates

### Advanced
- Implement polymorphic component patterns with TypeScript
- Augment theme types for custom properties
- Use OverridableComponent pattern for custom components
- Create proper client boundaries in Next.js App Router
- Implement focus management with useRef

### Accessibility (No Performance Cost)
- Add skip navigation links
- Manage focus properly in dialogs
- Use ARIA live regions for notifications
- Test keyboard navigation
- Ensure color contrast compliance
