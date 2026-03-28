---
name: migration
description: MUI version migration guides — v4→v5 and v5→v6 with codemods and patterns
triggers:
  - migration
  - upgrade
  - migrate
  - v4
  - v5
  - v6
  - makeStyles
  - codemod
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
---

# MUI Version Migration

## v4 → v5 Migration

### Package Renames

```bash
# Uninstall v4 packages
npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/system

# Install v5 packages
npm install @mui/material @mui/icons-material @mui/lab @mui/system
npm install @emotion/react @emotion/styled   # new required peer deps

# If using styled-components instead of emotion (less common):
npm install @mui/material @mui/styled-engine-sc styled-components
```

### Run the v5 Codemod

The codemod handles ~80% of the mechanical changes automatically.

```bash
# Run the v5 preset-safe codemod (safe subset — no breaking changes)
npx @mui/codemod v5.0.0/preset-safe src/

# Run on a single file
npx @mui/codemod v5.0.0/preset-safe src/components/MyComponent.tsx

# Run individual transforms
npx @mui/codemod v5.0.0/component-rename-prop src/
npx @mui/codemod v5.0.0/moved-lab-modules src/
npx @mui/codemod v5.0.0/optimal-imports src/
```

After running the codemod, review the diff carefully — some transformations may need manual adjustment.

### Import Path Changes

```tsx
// v4
import { makeStyles } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

// v5
import { styled } from '@mui/material/styles';     // replaces makeStyles
import { createTheme } from '@mui/material/styles'; // createMuiTheme → createTheme
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
```

### createTheme Changes

```tsx
// v4
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  overrides: {                       // v4: overrides
    MuiButton: {
      root: { textTransform: 'none' },
    },
  },
  props: {                           // v4: props
    MuiButton: { disableRipple: true },
  },
});

// v5
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  components: {                      // v5: components (combines overrides + props)
    MuiButton: {
      defaultProps: {                // was: props
        disableRipple: true,
      },
      styleOverrides: {              // was: overrides
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### makeStyles → styled / sx

This is the most impactful change. JSS (`makeStyles`, `withStyles`) is replaced by Emotion.

#### Pattern 1: sx prop (simple, inline styles)

```tsx
// v4 with makeStyles
const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
}));

function MyComponent() {
  const classes = useStyles();
  return <div className={classes.root}>Content</div>;
}

// v5 with sx prop
function MyComponent() {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
      }}
    >
      Content
    </Box>
  );
}
```

#### Pattern 2: styled() (reusable styled components)

```tsx
// v4 with makeStyles + clsx
const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 2,
  },
  cardHighlighted: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  },
}));

function MyCard({ highlighted }: { highlighted: boolean }) {
  const classes = useStyles();
  return (
    <div className={clsx(classes.card, { [classes.cardHighlighted]: highlighted })}>
      Content
    </div>
  );
}

// v5 with styled()
import { styled } from '@mui/material/styles';

const StyledCard = styled('div', {
  shouldForwardProp: (prop) => prop !== 'highlighted',
})<{ highlighted?: boolean }>(({ theme, highlighted }) => ({
  padding: theme.spacing(3),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  ...(highlighted && {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light,
  }),
}));

function MyCard({ highlighted }: { highlighted: boolean }) {
  return <StyledCard highlighted={highlighted}>Content</StyledCard>;
}
```

#### Pattern 3: tss-react (drop-in makeStyles replacement)

For large codebases where a full migration is impractical, `tss-react` provides a near-identical API:

```bash
npm install tss-react @emotion/react
```

```tsx
// Minimal diff from v4 makeStyles
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  root: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
}));

function MyComponent() {
  const { classes } = useStyles();
  return <div className={classes.root}>Content</div>;
}
```

### withStyles → styled

```tsx
// v4
const StyledButton = withStyles((theme) => ({
  root: {
    margin: theme.spacing(1),
  },
  label: {
    color: theme.palette.primary.main,
  },
}))(Button);

// v5
const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  '& .MuiButton-label': {          // target internal class
    color: theme.palette.primary.main,
  },
}));
// Or better — use sx prop on Button directly
```

### color Prop Changes

```tsx
// v4 — color accepted any string
<Button color="default">Default</Button>

// v5 — 'default' removed; use 'inherit' or omit color
<Button>Default</Button>
<Button color="inherit">Inherit parent color</Button>
```

### System Props Removed from Most Components

In v5, system props (like `mt`, `p`, `bgcolor`) work on `Box` and `Stack` but not on
all components. Use the `sx` prop instead.

```tsx
// v4 — system props on Typography
<Typography mt={2} color="primary.main">Text</Typography>

// v5 — use sx prop
<Typography sx={{ mt: 2, color: 'primary.main' }}>Text</Typography>
```

### Lab Component Moves

Several components graduated from `@mui/lab` to `@mui/material`:

| v4 lab | v5 core |
|--------|---------|
| `@material-ui/lab/Alert` | `@mui/material/Alert` |
| `@material-ui/lab/Autocomplete` | `@mui/material/Autocomplete` |
| `@material-ui/lab/Pagination` | `@mui/material/Pagination` |
| `@material-ui/lab/Rating` | `@mui/material/Rating` |
| `@material-ui/lab/Skeleton` | `@mui/material/Skeleton` |
| `@material-ui/lab/SpeedDial` | `@mui/material/SpeedDial` |
| `@material-ui/lab/ToggleButton` | `@mui/material/ToggleButton` |

### v4 → v5 Breaking Changes Checklist

- [ ] Replace `@material-ui/*` with `@mui/*`
- [ ] Add `@emotion/react` and `@emotion/styled` peer deps
- [ ] Replace `createMuiTheme` with `createTheme`
- [ ] Replace `theme.overrides` + `theme.props` with `theme.components`
- [ ] Replace all `makeStyles`/`withStyles` (JSS) with `styled`/`sx`/tss-react
- [ ] Remove `color="default"` — use `color="inherit"` or omit
- [ ] Update Lab imports to core for graduated components
- [ ] Replace `<Hidden>` with `sx={{ display: { xs: 'none', sm: 'block' } }}`
- [ ] Update `Box` system shorthand keys (some changed)
- [ ] Check all `className` overrides — internal class names changed in v5

---

## v5 → v6 Migration

### Run the v6 Codemod

```bash
# Run preset-safe (recommended first step)
npx @mui/codemod v6.0.0/preset-safe src/

# Run on specific directories
npx @mui/codemod v6.0.0/preset-safe src/components/ src/pages/

# Individual transforms (if preset-safe missed something)
npx @mui/codemod v6.0.0/grid-v2-props src/
npx @mui/codemod v6.0.0/sx-prop src/
```

### Grid v2 (Major Breaking Change)

Grid v2 is the default `Grid` in v6. The `item` prop is removed; use `size` instead.
The `xs`, `sm`, `md`, `lg`, `xl` props are replaced by a single `size` prop with an object.

```tsx
// v5 Grid
import Grid from '@mui/material/Grid';

<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    <Card />
  </Grid>
  <Grid item xs={12} sm={6} md={8}>
    <Content />
  </Grid>
</Grid>

// v6 Grid (Grid v2) — same import path, new API
import Grid from '@mui/material/Grid';

<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Card />
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 8 }}>
    <Content />
  </Grid>
</Grid>

// Shorthand for full-width only
<Grid size={12}>Full width</Grid>

// Auto-grow
<Grid size="grow">Fills remaining space</Grid>
```

### Grid v2 — Offset

```tsx
// v5 — offset via empty grid items or negative margins
<Grid item xs={4} />   // spacer
<Grid item xs={8}><Content /></Grid>

// v6 — offset prop
<Grid size={8} offset={4}><Content /></Grid>

// Responsive offset
<Grid size={{ xs: 12, md: 8 }} offset={{ md: 4 }}>
  <Content />
</Grid>
```

### Slots Pattern Standardized

In v6, the `slots`/`slotProps` API is standardized across all MUI X components
(DatePicker, DataGrid, Charts). The old `components`/`componentsProps` API is removed.

```tsx
// v5 (deprecated in v6)
<DatePicker
  components={{ TextField: CustomTextField }}
  componentsProps={{ textField: { variant: 'outlined' } }}
/>

// v6 (required)
<DatePicker
  slots={{ textField: CustomTextField }}
  slotProps={{ textField: { variant: 'outlined' } }}
/>
```

### Pigment CSS (Experimental in v6)

v6 introduces optional Pigment CSS — a build-time CSS extraction alternative to Emotion.
It enables zero-runtime styling (faster SSR, smaller bundles).

```bash
# Install Pigment CSS (optional — still experimental in v6)
npm install @mui/material-pigment-css @pigment-css/react

# Next.js setup
npm install @pigment-css/nextjs-plugin
```

```js
// next.config.js
const { withPigment } = require('@pigment-css/nextjs-plugin');

module.exports = withPigment({
  // your next config
}, {
  theme: require('./src/theme').default,
});
```

With Pigment CSS, `styled()` and `sx` are processed at build time — no Emotion runtime.
Server components can use styled components directly without `'use client'`.

### v5 → v6 Breaking Changes Checklist

- [ ] Update all packages: `npm install @mui/material@6 @mui/x-date-pickers@7 @mui/x-data-grid@7`
- [ ] Replace Grid v1 props (`item`, `xs`/`sm`/`md`) with Grid v2 `size` prop
- [ ] Replace `components`/`componentsProps` with `slots`/`slotProps` in all MUI X components
- [ ] Check `@mui/x-date-pickers` peer dep: now requires `dayjs` or another adapter explicitly
- [ ] `useMediaQuery` now requires a `theme` argument in some contexts — verify usages
- [ ] `Stack` `divider` spacing changed — verify visual output
- [ ] Review `@mui/x-data-grid` API: some column definition fields changed

---

## Incremental Migration Strategy

For large codebases (100+ components), do not migrate everything at once.

### Phase 1: Package and Config (1 day)

```bash
# 1. Update packages
npm uninstall @material-ui/core @material-ui/icons
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled

# 2. Run codemods
npx @mui/codemod v5.0.0/preset-safe src/

# 3. Fix obvious import errors
# 4. Run the app; expect red errors — that's normal at this stage
```

### Phase 2: Theme Migration (1–2 days)

```tsx
// Migrate theme file first — everything depends on it
// Old: createMuiTheme with overrides/props
// New: createTheme with components.MuiXxx.styleOverrides/defaultProps
```

### Phase 3: Component-by-Component (ongoing)

Prioritize components that are:
1. Used most frequently (Button, TextField, etc.)
2. Already have a clear `sx`-based replacement
3. Self-contained (not deeply composed)

```tsx
// Migrate one component at a time:
// 1. Remove makeStyles import
// 2. Replace className={classes.xxx} with sx={...} or styled()
// 3. Run tests
// 4. Commit
```

### Phase 4: Remove JSS Entirely

```bash
# Once all makeStyles are removed:
npm uninstall @material-ui/styles
```

### Coexistence Strategy (v4 + v5 during migration)

```tsx
// Temporarily keep both packages during migration
// @material-ui/core for unmigrated components
// @mui/material for migrated components

// Wrap each style engine separately
import { StylesProvider } from '@material-ui/core/styles';   // v4 JSS
import { ThemeProvider } from '@mui/material/styles';         // v5 Emotion

function App() {
  return (
    <StylesProvider injectFirst>
      <ThemeProvider theme={v5Theme}>
        {/* migrated components use v5 theme */}
        {/* unmigrated components use v4 styles */}
        <Router />
      </ThemeProvider>
    </StylesProvider>
  );
}
```

## makeStyles → styled/sx Conversion Reference

| makeStyles pattern | v5 equivalent |
|-------------------|---------------|
| `padding: theme.spacing(2)` | `sx={{ p: 2 }}` |
| `margin: theme.spacing(1, 2)` | `sx={{ my: 1, mx: 2 }}` |
| `color: theme.palette.primary.main` | `sx={{ color: 'primary.main' }}` |
| `backgroundColor: theme.palette.grey[100]` | `sx={{ bgcolor: 'grey.100' }}` |
| `display: 'flex'` | `sx={{ display: 'flex' }}` |
| `[theme.breakpoints.up('sm')]: { ... }` | `sx={{ md: { ... } }}` |
| `'&:hover': { ... }` | `sx={{ '&:hover': { ... } }}` |
| `'& .MuiButton-root': { ... }` | `sx={{ '& .MuiButton-root': { ... } }}` |
| `theme.transitions.create('opacity')` | `styled()(({ theme }) => ({ transition: theme.transitions.create('opacity') }))` |

## Common Post-Migration Issues

**Styles not applying:**
- Check that `CssBaseline` is inside `ThemeProvider`
- Confirm `@emotion/react` and `@emotion/styled` are installed
- Ensure no JSS `StylesProvider` is conflicting

**TypeScript errors after codemod:**
- `makeStyles` return type changed — `classes` is now in a `{ classes }` object with tss-react
- `Theme` import moved from `@material-ui/core` to `@mui/material/styles`
- Some prop types narrowed (e.g., `color` no longer accepts `'default'`)

**SSR style flash (FOUC):**
- Missing Emotion cache setup — see the performance skill for full SSR config
- Ensure `createEmotionCache()` is called per request, not once globally

**Grid layout broken after v6 upgrade:**
- The `item` prop is removed — add `size` prop to every grid item
- Run `npx @mui/codemod v6.0.0/grid-v2-props src/` to automate this
