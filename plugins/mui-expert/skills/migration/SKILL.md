---
name: mui-migration
description: MUI Migration skill. Covers v4→v5 and v5→v6 migrations including package renames, JSS→emotion conversion, makeStyles/withStyles→styled/sx patterns, Grid v2 changes, codemods, and incremental migration strategies.
triggers:
  - migration
  - upgrade
  - migrate
  - v4
  - v5
  - v6
  - makeStyles
  - withStyles
  - codemod
  - breaking changes
  - JSS
  - emotion
  - "@material-ui"
  - Grid v2
  - Pigment CSS
globs:
  - "*.tsx"
  - "*.ts"
  - "*.jsx"
  - "*.js"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
---

# MUI Migration Skill

---

## MUI v4 → v5 Migration

### Package Renames

```bash
# Remove v4 packages
npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/styles @material-ui/system

# Install v5 packages
npm install @mui/material @mui/icons-material @mui/lab @emotion/react @emotion/styled

# If using styled-components instead of emotion
npm install @mui/material @mui/styled-engine-sc styled-components
```

| v4 Package | v5 Package |
|------------|------------|
| `@material-ui/core` | `@mui/material` |
| `@material-ui/icons` | `@mui/icons-material` |
| `@material-ui/lab` | `@mui/lab` |
| `@material-ui/styles` | `@mui/styles` (legacy) or use emotion |
| `@material-ui/system` | `@mui/system` |

### Run the v5 Codemod

```bash
# Run the preset-safe codemod (handles most breaking changes automatically)
npx @mui/codemod v5.0.0/preset-safe src/

# Individual codemods available:
npx @mui/codemod v5.0.0/moved-lab-modules src/
npx @mui/codemod v5.0.0/top-level-imports src/
npx @mui/codemod v5.0.0/use-transitionprops src/
npx @mui/codemod v5.0.0/with-mobile-dialog src/
```

### Import Path Changes

```tsx
// v4
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { red } from '@material-ui/core/colors';

// v5
import { styled } from '@mui/material/styles';      // preferred
import Button from '@mui/material/Button';
import { red } from '@mui/material/colors';
```

### Styling: JSS → Emotion

#### makeStyles → sx prop

```tsx
// v4 — makeStyles with JSS
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
}));

function MyComponent() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <span className={classes.title}>Hello</span>
    </div>
  );
}

// v5 — sx prop (best for simple cases)
function MyComponent() {
  return (
    <Box
      sx={{
        backgroundColor: 'primary.main',
        padding: 2,
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
    >
      <Typography sx={{ fontSize: 24, fontWeight: 'bold', color: 'text.primary' }}>
        Hello
      </Typography>
    </Box>
  );
}
```

#### makeStyles → styled()

```tsx
// v5 — styled() (best for reusable components with theme access)
import { styled } from '@mui/material/styles';

const StyledRoot = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const StyledTitle = styled('span')(({ theme }) => ({
  fontSize: 24,
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

function MyComponent() {
  return (
    <StyledRoot>
      <StyledTitle>Hello</StyledTitle>
    </StyledRoot>
  );
}
```

#### withStyles → styled()

```tsx
// v4
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const StyledButton = withStyles((theme) => ({
  root: {
    borderRadius: 8,
    textTransform: 'none',
  },
  contained: {
    boxShadow: 'none',
  },
}))(Button);

// v5
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  '&.MuiButton-contained': {
    boxShadow: 'none',
  },
}));
```

### classes Prop → sx/styled

```tsx
// v4 — passing classes to override
<TextField
  classes={{
    root: classes.textField,
  }}
  InputProps={{
    classes: { input: classes.input },
  }}
/>

// v5 — use sx or theme overrides
<TextField
  sx={{
    '& .MuiInputBase-input': {
      padding: '8px 12px',
    },
  }}
/>

// v5 — global theme overrides (preferred)
const theme = createTheme({
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            padding: '8px 12px',
          },
        },
      },
    },
  },
});
```

### Theme Changes

```tsx
// v4
import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  overrides: {                          // v4 key
    MuiButton: {
      root: { borderRadius: 8 },
    },
  },
  props: {                              // v4 key
    MuiButton: { disableElevation: true },
  },
  typography: {
    useNextVariants: true,              // removed in v5
  },
});

// v5
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
  components: {                         // v5: merged overrides + props
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
});
```

### Breakpoints Changes

```tsx
// v4
theme.breakpoints.between('sm', 'md')  // sm <= x < md
theme.breakpoints.up('md')

// v5 — between() now includes upper bound
theme.breakpoints.between('sm', 'md')  // sm <= x <= md (inclusive)
// Use up('sm') and down('md') for exclusive upper bound
```

### Grid Changes (v4 → v5)

```tsx
// v4 (unchanged in v5 — same API)
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>Content</Grid>
</Grid>
```

### Component API Changes

```tsx
// v4 — Fab
<Fab color="primary"><AddIcon /></Fab>

// v5 — same API, just new package
import Fab from '@mui/material/Fab';
<Fab color="primary"><AddIcon /></Fab>

// v4 — Snackbar
<Snackbar>
  <SnackbarContent message="..." action={<Button>Close</Button>} />
</Snackbar>

// v5 — use Alert inside Snackbar
<Snackbar>
  <Alert severity="success" onClose={handleClose}>Success!</Alert>
</Snackbar>

// v4 — CircularProgress determinate
<CircularProgress variant="static" value={50} />

// v5 — renamed variant
<CircularProgress variant="determinate" value={50} />
```

---

## MUI v5 → v6 Migration

### Run the v6 Codemod

```bash
npx @mui/codemod@latest v6.0.0/preset-safe src/
```

### Grid v2 — Breaking Change

Grid v2 replaces the `xs/sm/md/lg/xl` props with a unified `size` prop and adds `offset`.

```tsx
// v5 Grid
import Grid from '@mui/material/Grid';

<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
    Card
  </Grid>
  <Grid item xs={12} sm={6} md={8}>
    Main content
  </Grid>
</Grid>

// v6 Grid (v2 — default in v6)
import Grid from '@mui/material/Grid';  // same import, new API

<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    Card
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 8 }}>
    Main content
  </Grid>
</Grid>

// v6 Grid with offset
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 8 }} offset={{ md: 2 }}>
    Centered content
  </Grid>
</Grid>

// v6 shorthand — single breakpoint as number
<Grid size={6}>Half width</Grid>
<Grid size="grow">Grows to fill</Grid>
<Grid size="auto">Shrinks to content</Grid>
```

### slots/slotProps API (v6 pattern)

v6 standardizes the `slots` and `slotProps` API across all components (replacing `components`/`componentsProps`).

```tsx
// v5 — components/componentsProps (still works but deprecated)
<DatePicker
  components={{ OpenPickerIcon: CalendarIcon }}
  componentsProps={{ textField: { variant: 'outlined' } }}
/>

// v6 — slots/slotProps (new standard)
<DatePicker
  slots={{ openPickerIcon: CalendarIcon }}
  slotProps={{ textField: { variant: 'outlined' } }}
/>

// TextField inside other components
// v5
<Autocomplete
  renderInput={(params) => <TextField {...params} label="Search" />}
/>
// v6 — can still use renderInput, but slotProps.textField also works
<Autocomplete
  slotProps={{ textField: { label: 'Search', variant: 'outlined' } }}
/>
```

### Pigment CSS (Zero-Runtime, Optional)

v6 introduces experimental Pigment CSS support for zero-runtime styling (no emotion at runtime).

```bash
npm install @pigment-css/react @pigment-css/nextjs-plugin
```

```ts
// next.config.ts — experimental
import { withPigment } from '@pigment-css/nextjs-plugin';

export default withPigment({
  // next config
}, {
  theme: yourTheme,
});
```

Note: Pigment CSS is opt-in and experimental in v6. Emotion remains the default.

### Other v6 Breaking Changes

```tsx
// useMediaQuery — default noSsr changed
// v5: noSsr=false (can cause hydration mismatch)
// v6: noSsr=true by default (safer for SSR)
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

// Alert — icon mapping changed
// v6: severity="success" icon can be customized via slots
<Alert slots={{ icon: CheckCircleIcon }} severity="success">
  Done
</Alert>

// ButtonGroup — variant default changed from 'outlined' to 'contained'
// Explicitly set variant to avoid surprise
<ButtonGroup variant="outlined">
  <Button>One</Button>
  <Button>Two</Button>
</ButtonGroup>
```

---

## Incremental Migration (Running v4 and v5 Side by Side)

For large codebases, you can run v4 and v5 simultaneously:

```bash
npm install @mui/material @emotion/react @emotion/styled
# Keep @material-ui/core installed temporarily
```

```tsx
// Wrap new v5 components in a separate ThemeProvider
import { ThemeProvider as V5ThemeProvider, createTheme as createV5Theme } from '@mui/material/styles';
import { StylesProvider } from '@material-ui/core/styles';  // v4

const v5Theme = createV5Theme({ /* ... */ });

function App() {
  return (
    <StylesProvider injectFirst>          {/* v4 styles inject first */}
      <V4ThemeProvider theme={v4Theme}>
        <V5ThemeProvider theme={v5Theme}>
          {/* Mix v4 and v5 components */}
          <OldV4Component />
          <NewV5Component />
        </V5ThemeProvider>
      </V4ThemeProvider>
    </StylesProvider>
  );
}
```

---

## Migration Checklist

### v4 → v5

- [ ] Run `npx @mui/codemod v5.0.0/preset-safe src/`
- [ ] Replace `@material-ui/*` with `@mui/*` in package.json
- [ ] Install `@emotion/react` and `@emotion/styled`
- [ ] Replace `createMuiTheme` → `createTheme`
- [ ] Move `overrides` + `props` into `components: { Comp: { defaultProps, styleOverrides } }`
- [ ] Replace `makeStyles`/`withStyles` with `styled()` or `sx` prop
- [ ] Update `Grid item xs=...` (unchanged, but check for removed `zeroMinWidth` prop)
- [ ] Check `theme.breakpoints.between()` inclusivity change
- [ ] Replace `CircularProgress variant="static"` → `"determinate"`
- [ ] Replace `Snackbar` + `SnackbarContent` with `Snackbar` + `Alert`
- [ ] Test all custom theme overrides in new `components` key format

### v5 → v6

- [ ] Run `npx @mui/codemod@latest v6.0.0/preset-safe src/`
- [ ] Migrate `<Grid item xs={N}>` → `<Grid size={{ xs: N }}>`
- [ ] Replace `components`/`componentsProps` → `slots`/`slotProps` where used
- [ ] Check `useMediaQuery` SSR behavior if `noSsr` was previously set
- [ ] Review `ButtonGroup` variant (now defaults to `'contained'`)
- [ ] Verify `DatePicker` slot API if using `renderInput` (still works, but `slotProps.textField` preferred)

---

## makeStyles Conversion Patterns Quick Reference

| v4 makeStyles | v5 Equivalent |
|---------------|---------------|
| `padding: theme.spacing(2)` | `padding: 2` (sx uses spacing multiplier) |
| `color: theme.palette.primary.main` | `color: 'primary.main'` (sx token) |
| `[theme.breakpoints.down('sm')]: {...}` | `{ xs: ..., sm: ... }` (sx responsive) |
| `theme.transitions.create('opacity')` | `transition: 'opacity 0.3s'` or via `styled()` |
| `zIndex: theme.zIndex.modal + 1` | Access via theme in `styled()` |
| Complex dynamic styles | Use `styled()` with props, not `sx` |
