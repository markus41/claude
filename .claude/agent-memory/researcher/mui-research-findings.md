---
name: Material UI Comprehensive Research
description: Complete MUI v5/v6 knowledge base covering package structure, theming, styling, components, X packages, migration, patterns, and best practices
type: reference
---

# Material UI (MUI) Comprehensive Research - March 2026

**Research Date**: 2026-03-28
**MUI Current Version**: v6.0+ (with v7 available)
**Status**: Complete knowledge base for expert plugin development

## 1. Package Structure & Installation

### Core Packages

| Package | Purpose | Install |
|---------|---------|---------|
| `@mui/material` | Material Design components (complete) | `npm install @mui/material @emotion/react @emotion/styled` |
| `@mui/system` | Design system layer for custom systems | Dependency of @mui/material |
| `@mui/x-data-grid` | Enterprise data grid component | `npm install @mui/x-data-grid` |
| `@mui/x-date-pickers` | Date/time picker components (v5→v6 migration) | `npm install @mui/x-date-pickers` |
| `@mui/icons-material` | 2000+ Material Design icons | `npm install @mui/icons-material` |
| `@mui/lab` | Incubation components (many moved to X) | Deprecated for new components |
| `@mui/joy` | Alternative design system (beta status) | `npm install @mui/joy` |
| `@mui/base` | Headless/unstyled components v1.0+ | `npm install @mui/base` |
| `@emotion/react` | CSS-in-JS runtime (required) | Peer dependency |
| `@emotion/styled` | styled() API for Emotion | Peer dependency |

### Layered Architecture
- **@mui/material** re-exports APIs from dependencies, so install only @mui/material
- **@mui/system** provides lower-level design system primitives
- **@mui/styled-engine** thin wrapper around Emotion (or use @mui/styled-engine-sc for styled-components)

### Tree-Shaking & Bundle Optimization
- ❌ **AVOID**: `import { Button } from '@mui/material'` (6x slower in dev, barrel import)
- ✅ **PREFER**: `import Button from '@mui/material/Button'` (path-based)
- ✅ **Next.js 13.5+**: Auto-optimized with `optimizePackageImports` option
- For icons: path imports dramatically faster than named imports
- v6: Reduced UMD bundle size by 25% (2.5MB reduction); IE 11 support removed

---

## 2. Theming System (createTheme + ThemeProvider)

### Basic Setup

```typescript
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    mode: 'light', // 'dark'
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial"',
    h1: { fontSize: '2.5rem' },
  },
  spacing: 8, // Base unit (theme.spacing(2) = 16px)
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  components: {
    MuiButton: {
      styleOverrides: { root: { borderRadius: 4 } },
      variants: [ /* custom variant definitions */ ],
    },
  },
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Palette Structure
- **Primary/Secondary**: Brand colors, used for buttons, links, focus states
- **Error/Warning/Info/Success**: Semantic colors
- **Background/Text**: Gray scales
- Each color has: main, light, dark, contrastText variants

### CSS Theme Variables (v6+)
```typescript
const theme = createTheme({
  cssVariables: true,
  colorSchemeSelector: 'class', // Adds to <html class="light"/"dark">
});
```
- Generates `--mui-palette-primary-main`, `--mui-spacing-2`, etc.
- Enables dark mode SSR without flicker
- Can precompute at build time
- Alternative selectors: `data` attribute, custom `selector`

### Dark Mode & applyStyles()
```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...theme.applyStyles('dark', { color: '#fff' }),
        }),
      },
    },
  },
});
```
- **Do NOT use**: `theme.palette.mode` for conditional dark styles (causes flicker)
- **Use**: `theme.applyStyles('dark', {...})` instead

### Theme Customization Levels
1. **sx prop** (component-level, one-off)
2. **components[ComponentName].styleOverrides** (per-component, reusable)
3. **components[ComponentName].variants** (branded variants, new pattern)
4. **Global theme** (createTheme palette/typography/spacing)

---

## 3. Styling System: sx Prop & styled() API

### The sx Prop (Most Common)
```typescript
<Box sx={{
  color: 'primary.main',
  fontSize: { xs: '14px', md: '16px' }, // responsive
  padding: theme => theme.spacing(2), // theme access
  '&:hover': { backgroundColor: 'action.hover' },
  '@media (max-width: 600px)': { fontSize: '12px' },
}}>
```

**Advantages**:
- Inline access to theme
- Responsive values via object notation
- Supports pseudo-classes/elements
- Scoped to single component (no name collisions)

### styled() API (Component Definitions)
```typescript
import { styled } from '@mui/material/styles';

const CustomButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  '&:hover': { backgroundColor: theme.palette.primary.dark },
  padding: theme.spacing(2),
}));

// Or with shouldForwardProp for custom props
const StyledDiv = styled('div')(({ theme }) => ({...}), {
  shouldForwardProp: (prop) => prop !== 'size',
});
```

**Best for**:
- Reusable styled components
- Complex logic dependent on props
- Named exports for DX
- Can use theme.breakpoints.up('md') for media queries

### Emotion Integration (Default)
- @mui/material uses Emotion by default
- `@emotion/react` + `@emotion/styled` are peer dependencies
- Alternative: `@mui/styled-engine-sc` for styled-components
- styled() provides shouldForwardProp, theme support, and variant handling automatically

### Pigment CSS (v6+ Opt-in)
- Zero-runtime CSS-in-JS library (extracts styles at build time)
- Eliminates Emotion runtime overhead
- RSC (React Server Components) compatible
- Reduces bundle size significantly
- **Status**: Experimental in v6; future default in v7+
- Uses WyW-in-JS under the hood (smooth migration path)

---

## 4. Key Components & Common Props

### Core Component Pattern
Most MUI components follow this prop structure:

```typescript
<Component
  // Sizing
  size="small" | "medium" | "large"

  // Content control
  disabled={false}
  fullWidth={false}

  // Layout
  sx={{ /* ... */ }}
  component="div" // DEPRECATED in v6; use slots/slotProps instead

  // Slots (v6+, replaces 'component' prop)
  slots={{ root: CustomComponent }}
  slotProps={{ root: { className: 'custom' } }}
/>
```

### TextField (Form Input)
```typescript
<TextField
  label="Username"
  value={value}
  onChange={e => setValue(e.target.value)}
  size="small" // "small" | "medium"
  margin="normal" // "none" | "normal" | "dense"
  error={!!error}
  helperText={error}
  variant="outlined" // "outlined" | "filled" | "standard"
  InputProps={{ startAdornment: <Icon /> }}
  InputLabelProps={{ shrink: true }}
  sx={{ width: '100%' }}
/>
```

**Key props**:
- `InputProps`, `InputLabelProps` unlock 80% of customization
- Controlled or uncontrolled component
- margin controls FormControl vertical spacing

### Button
```typescript
<Button
  variant="contained" // "contained" | "outlined" | "text"
  color="primary"
  size="medium"
  disableElevation={false}
  onClick={handler}
  startIcon={<Icon />}
  fullWidth={false}
  sx={{ /* overrides */ }}
/>
```

### Box & Stack (Layout)
```typescript
<Box component="section" sx={{ padding: 2 }}>
  Content
</Box>

<Stack
  direction="row" // "row" | "column"
  spacing={2} // Gap between children
  alignItems="center"
  justifyContent="space-between"
  sx={{ /* ... */ }}
>
  {items}
</Stack>
```

### Grid (Responsive Layout)
**v6 Breaking Change**: Size/offset props updated from `xs={12}` to object notation
```typescript
// v6 new format
<Grid2 size={{ xs: 12, sm: 6, md: 4 }} />

// v5 format (deprecated)
<Grid item xs={12} sm={6} md={4} />
```

---

## 5. MUI v5 → v6 Migration

### Major Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| **UMD bundle removed** | 25% smaller, IE 11 gone | Update bundler config if using UMD |
| **IE 11 support removed** | Chrome 90→109, Firefox 78→115 | Drop IE polyfills |
| **Grid API changed** | xs={12} → size={{xs: 12}} | Run codemod or update props |
| **Pigment CSS** | Opt-in zero-runtime styling | Test with existing Emotion setup |
| **react-is@19 requirement** | React 19 compatible | Set resolution for React 18 compatibility |
| **slots/slotProps** | Replaces `component` prop | Migrate to modern slot system |
| **@mui/lab deprecated** | Pickers moved to @mui/x-date-pickers | Update imports; use codemod |

### Codemods Available
```bash
# Run all v5→v6 codemods
npx @mui/codemod@latest v5-to-v6

# Run deprecation fixes
npx @mui/codemod@latest deprecations/all
```

### React 18 Compatibility
If using React 18 with MUI v6 (which uses react-is@19):
```json
{
  "resolutions": {
    "react-is": "^18.x"
  }
}
```

---

## 6. Responsive Design & Media Queries

### Breakpoints (Default)
```typescript
xs: 0,    // Mobile first
sm: 600,  // Small tablets
md: 900,  // Tablets
lg: 1200, // Desktop
xl: 1536  // Large desktop
```

### Using theme.breakpoints in styled()
```typescript
const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('md')]: { padding: theme.spacing(4) },
  [theme.breakpoints.down('sm')]: { display: 'none' },
  [theme.breakpoints.only('md')]: { color: 'blue' },
}));
```

### useMediaQuery Hook
```typescript
import { useTheme, useMediaQuery } from '@mui/material';

function Responsive() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

### Responsive sx Prop
```typescript
<Box sx={{
  fontSize: { xs: '12px', sm: '14px', md: '16px' },
  padding: { xs: 1, sm: 2, md: 3 },
}}>
```

### SSR Consideration
Use `useMediaQuery` with SSR to prevent "flash of desktop" on mobile:
```typescript
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
// Avoids showing desktop layout briefly on mobile
```

---

## 7. MUI X Components (Advanced)

### DataGrid (`@mui/x-data-grid`)
- Enterprise-grade table component
- Recent updates (March 2026): keyboard navigation, custom checkbox column (`checkboxColDef`)
- v5→v6 migration involved slot prop changes
- Tree view, Gantt, charts also available

### DatePicker (`@mui/x-date-pickers`)
**v5→v6 Migration**:
- Replaced `renderInput` with `slotProps.textField`
- Improved keyboard support for day/month/year selection
- DateRangePicker timezone fixes

**v6→v7 Migration**:
- Renamed: `SlotsComponent` → `Slots`, `SlotsComponentsProps` → `SlotProps`
- Updated slot prop structure for consistency

---

## 8. Accessibility (WCAG 2.1 Level AA)

### MUI's Built-in A11y

| Feature | Implementation |
|---------|-----------------|
| **Semantic HTML** | Buttons render as `<button>`, inputs as `<input>` |
| **ARIA roles** | Auto-added by components (avoid duplication) |
| **Focus management** | Proper tabindex, focus visible states |
| **Keyboard navigation** | Arrow keys, Enter, Escape for modals |
| **Color contrast** | Material Design guidelines (WCAG AA) |

### Best Practices
- ✅ Let MUI handle ARIA; don't add redundant roles
- ✅ Link `<label>` to inputs via `htmlFor` and `id`
- ✅ Use semantic components (Button, not Div with click handler)
- ✅ Test with assistive technologies (NVDA, JAWS)

### Compliance Standards
- WCAG 2.1 Level AA (MUI target)
- WAI-ARIA 1.2 (W3C Recommendation, June 2023)
- Section 508, ADA, European Accessibility Act

---

## 9. Common Pitfalls & Anti-Patterns

### 1. **Theme Nesting & Selector Formatting**
❌ **Wrong**:
```typescript
MuiButton: {
  styleOverrides: {
    root: {
      '.Mui-focused': { color: 'red' }, // No space after &
    }
  }
}
```

✅ **Correct**:
```typescript
MuiButton: {
  styleOverrides: {
    root: {
      '&.Mui-focused': { color: 'red' }, // Space after &
      '& .Mui-disabled': { opacity: 0.5 }, // Descendant selector
    }
  }
}
```

### 2. **CSS Specificity Issues**
❌ Don't style state classes directly:
```typescript
'.Mui-disabled': { opacity: 0.5 } // Affects all disabled components globally!
```

✅ Target state + component:
```typescript
'&.Mui-disabled': { opacity: 0.5 } // Only affects this component
```

### 3. **Dark Mode Flicker**
❌ **Wrong**:
```typescript
color: theme.palette.mode === 'dark' ? '#fff' : '#000'
```

✅ **Correct**:
```typescript
...theme.applyStyles('dark', { color: '#fff' })
```

### 4. **Missing ThemeProvider**
❌ Don't forget to wrap app:
```typescript
// Components won't have theme access
<App />
```

✅ Use ThemeProvider:
```typescript
<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### 5. **Incorrect Grid API (v6)**
❌ v5 style in v6:
```typescript
<Grid item xs={12} sm={6} /> // Causes issues
```

✅ v6 style:
```typescript
<Grid2 size={{ xs: 12, sm: 6 }} />
```

### 6. **Deprecated Component Pattern**
❌ Using callbacks in styleOverrides:
```typescript
styleOverrides: {
  root: ({ ownerState }) => ({ /* ownerState deprecated */ })
}
```

✅ Use variants:
```typescript
variants: [
  { props: { size: 'large' }, style: { padding: 20 } }
]
```

### 7. **Barrel Imports in Development**
❌ Slow development builds:
```typescript
import { Button, TextField, Box } from '@mui/material'
```

✅ Path imports:
```typescript
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
```

### 8. **Nesting Styled Components Nightmare**
Complex pseudo-classes with nested selectors can fail silently or conflict. Use `Box` + `sx` for simpler cases.

---

## 10. Alternative MUI Packages

### Joy UI (`@mui/joy`)
- **Purpose**: Alternative design system (not Material Design)
- **Status**: Beta, development on hold
- **Use case**: When you don't want Material Design restrictions
- **Key feature**: Color inversion (prevents hierarchy disruption)
- **Styling**: Same Emotion-based system as @mui/material

### Base UI (`@mui/base`)
- **Purpose**: Headless/unstyled components (v1.0 launched Feb 2026)
- **Components**: 35+ accessible components, zero default styles
- **Use case**: Building custom design systems, Tailwind integration
- **Styling options**: Emotion, Tailwind, CSS Modules, plain CSS, MUI System
- **Status**: Fully supported, long-term maintenance commitment

### @mui/lab (Deprecated)
- **Status**: Incubation/deprecated
- **Moved to @mui/x**: DatePicker, TimePicker, TreeView
- **Moved to @mui/material**: LoadingButton
- **Removed in future**: Components should migrate to X or main

---

## 11. Performance Best Practices

### Bundle Size Optimization
1. **Use path imports** (not barrel imports): Reduces initial build time 6x
2. **Tree-shaking**: Modern bundlers handle it; focus on import style
3. **Code splitting**: Lazy load route components, modal contents
4. **Icons**: Use `@mui/icons-material/ComponentName` paths, not named imports

### Runtime Performance
1. **Memoization**: Use `React.memo()` for frequently-rendered custom components
2. **useMediaQuery**: Can trigger re-renders; memoize if expensive logic depends on it
3. **Theme updates**: Wrap ThemeProvider at app root to avoid re-renders of entire tree
4. **CSS-in-JS overhead**: With Emotion, minimal; consider Pigment CSS for production

### Pigment CSS (Future)
- Opt-in in v6; will be default in v7
- Extracts styles at build time (zero runtime overhead)
- Larger build time, smaller runtime size
- Requires Next.js 13+ or Vite integration

---

## 12. Server-Side Rendering (SSR) & Next.js

### Next.js Integration
1. **App Router (Next.js 13.5+)**:
   - Wrap components with `'use client'` directive
   - MUI components not RSC-compatible (require client boundary)
   - Auto-import optimization available

2. **Pages Router & getServerSideProps**:
   - Use `documentGetInitialProps` helper
   - Render `DocumentHeadTags` in `<Head>`

3. **CSS Variables + SSR**:
   - Enables dark mode without flash (CSS computed before render)
   - Critical for perceived performance

### Theme Extraction
For SSR, MUI's createTheme includes styling extraction:
```typescript
// In Next.js document:
import { DocumentHeadTags } from '@mui/material';

export default function _document() {
  return (
    <Html>
      <Head>
        <DocumentHeadTags />
      </Head>
      <body>
        <Main />
      </body>
    </Html>
  );
}
```

### Media Query SSR
Use `useMediaQuery` with SSR enabled to prevent mobile layout flash:
```typescript
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
// Server-renders correct layout immediately
```

---

## 13. Integration with Other Libraries

### styled-components
Use `@mui/styled-engine-sc` instead of default Emotion:
```bash
npm install @mui/styled-engine-sc styled-components
```

### Tailwind CSS
- **Joy UI + Tailwind**: Works well (design system optional)
- **Base UI + Tailwind**: Excellent for custom design systems
- **Material UI + Tailwind**: Possible but conflicts (both provide utility classes)

### CSS Modules
- MUI components don't support CSS Modules natively
- Use sx prop or styled() for overrides

---

## Key Takeaways for Plugin Development

1. **Know the package structure**: @mui/material is the complete library
2. **Master theming**: createTheme → ThemeProvider is the control center
3. **Learn sx prop**: Most flexible for component-level customization
4. **Understand migration path**: v5→v6 is smooth; Pigment CSS coming in v7
5. **Optimize imports**: Path imports critical for dev performance
6. **Use slots/slotProps**: v6 modern pattern, better than deprecated `component` prop
7. **Avoid dark mode flicker**: Use `applyStyles()` not `palette.mode` checks
8. **Responsive first**: Use breakpoints and `useMediaQuery` hooks
9. **Accessibility built-in**: Don't fight MUI's ARIA; let it handle a11y
10. **Consider alternatives**: Base UI for headless, Joy UI for non-Material designs

---

## Documentation References

All information sourced from official MUI documentation (code.claude.com and mui.com):

- [Main Documentation](https://mui.com)
- [v6 Migration Guide](https://mui.com/material-ui/migration/upgrade-to-v6/)
- [Customization Guide](https://mui.com/material-ui/customization/theming/)
- [sx Prop Documentation](https://mui.com/system/getting-started/the-sx-prop/)
- [CSS Theme Variables](https://mui.com/material-ui/customization/css-theme-variables/)
- [Bundle Size Guide](https://mui.com/material-ui/guides/minimizing-bundle-size/)
- [Next.js Integration](https://mui.com/material-ui/integrations/nextjs/)
- [Base UI (Headless)](https://v6.mui.com/base-ui/getting-started/)
- [MUI X Components](https://mui.com/x/)
- [Joy UI](https://mui.com/joy-ui/getting-started/)
