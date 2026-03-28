---
name: /mui-migrate
intent: Migrate MUI code between versions
inputs:
  - name: --from
    type: enum
    values: [v4, v5]
    required: true
  - name: --to
    type: enum
    values: [v5, v6]
    required: true
  - name: --path
    type: string
    description: Directory to migrate (defaults to src/)
    required: false
    default: src/
  - name: --dry-run
    type: boolean
    description: Preview changes without writing files
    required: false
    default: false
risk: medium
cost: high
tags: [mui-expert, migration, upgrade]
description: >
  Migrate MUI code between major versions (v4 to v5, or v5 to v6). Detects
  version-specific patterns, generates a migration plan, applies codemods where
  possible, and produces a report of changes made and items requiring manual review.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# /mui-migrate

Migrate MUI code between major versions.

## Operating Protocol

### Step 1 — Detect and validate current state

1. Read `package.json` to detect installed MUI version:
   - Look for `@material-ui/core` (v4), `@mui/material` (v5/v6)
   - Read the version field to determine exact semver
2. Validate that `--from` matches the detected version. Warn if there is a mismatch.
3. Validate that the `--from` → `--to` pair is supported:
   - v4 → v5: supported
   - v5 → v6: supported
   - v4 → v6: not directly supported — recommend v4 → v5 first
4. Print detected environment:
   ```
   Detected MUI version: 4.12.4 (@material-ui/core)
   Migration path: v4 → v5
   Files to process: 67 .tsx/.jsx files
   ```

### Step 2 — Scan and categorize patterns

Use `Grep` and `Glob` to inventory all patterns requiring migration. Build a per-file change list.

#### v4 → v5 patterns

| Pattern | Change required | Safety |
|---------|----------------|--------|
| `import X from '@material-ui/core'` | Rewrite to `@mui/material` | Auto |
| `import X from '@material-ui/icons'` | Rewrite to `@mui/icons-material` | Auto |
| `import X from '@material-ui/lab'` | Rewrite to `@mui/lab` | Auto |
| `makeStyles(theme => ...)` | Convert to `styled()` or `sx` prop | Manual |
| `withStyles(styles)(Component)` | Convert to `styled(Component)` | Manual |
| `createMuiTheme(...)` | Rename to `createTheme(...)` | Auto |
| `theme.spacing(x, y)` → `theme.spacing(x, y)` | No change needed (still works) | Skip |
| `<Hidden>` component | Migrate to `sx={{ display: { xs: 'none', ... } }}` | Manual |
| `<Box` with system props as direct props | Add to `sx` | Manual |
| JSS class references (`classes.root`) | Convert to `styled` component or `sx` | Manual |
| `color="default"` on Button | Change to `color="inherit"` or remove | Auto |
| `variant="default"` prop removals | Remove prop | Auto |
| `theme.palette.type` | Rename to `theme.palette.mode` | Auto |
| `theme.breakpoints.between('sm', 'md')` | No change | Skip |
| `@mui/styles` usage after migration | Replace with `@mui/material/styles` | Manual |

#### v5 → v6 patterns

| Pattern | Change required | Safety |
|---------|----------------|--------|
| `<Grid item xs={12}>` (v1 Grid API) | Migrate to `<Grid2 size={12}>` | Manual |
| `<Grid container spacing={2}>` | Migrate to `<Grid2 container spacing={2}>` | Auto |
| `import Grid from '@mui/material/Grid'` | Change to `import Grid2 from '@mui/material/Unstable_Grid2'` then `Grid2` | Manual |
| Deprecated slot props (e.g. `componentsProps`) | Rename to `slotProps` | Auto |
| `components` prop on compound components | Rename to `slots` | Auto |
| `TransitionComponent` prop | Rename to `slots.transition` | Manual |
| `PopperComponent` prop | Rename to `slots.popper` | Manual |
| `experimentalFeatures={{ newEditingApi: true }}` on DataGrid | Remove (now default) | Auto |
| `onCellEditCommit` DataGrid event | Change to `processRowUpdate` | Manual |
| `getRowClassName` returning class strings | Migrate to `getCellClassName` or `sx` | Manual |

### Step 3 — Generate migration plan

Print a migration plan grouped by safety level:

```
=== MIGRATION PLAN: v4 → v5 ===

AUTO-FIX (67 changes across 23 files)
  - @material-ui/* import rewrites
  - createMuiTheme → createTheme
  - theme.palette.type → theme.palette.mode
  - color="default" → color="inherit"

MANUAL REVIEW REQUIRED (34 changes across 18 files)
  - makeStyles conversions (12 occurrences in 8 files)
  - withStyles conversions (4 occurrences in 3 files)
  - <Hidden> component replacements (6 occurrences in 5 files)
  - JSS class reference removals (12 occurrences in 9 files)

ESTIMATED EFFORT: ~4-6 hours manual work after auto-fixes
```

If `--dry-run`, stop here and print the plan only.

### Step 4 — Apply auto-fixes (if not `--dry-run`)

Apply all "Auto" safety transformations:

1. Rewrite import paths using string replacement (preserve named imports).
2. Rename API calls (`createMuiTheme`, `palette.type`, etc.).
3. Remove deprecated boolean props where the default changed.
4. Rename slot/component props (`components` → `slots`, `componentsProps` → `slotProps`).

For each file modified, print:
```
MODIFIED src/components/Nav.tsx
  - 3 import rewrites (@material-ui/core → @mui/material)
  - 1 prop rename (color="default" → color="inherit")
```

### Step 5 — TypeScript check

After applying auto-fixes, run:
```bash
npx tsc --noEmit 2>&1
```

Capture and display TypeScript errors that surfaced due to migration. Group errors by:
- Type errors introduced by API changes (likely manual fixes needed)
- Missing type definitions (may need `@types/*` updates)
- Resolved automatically (no longer appearing after fixes)

### Step 6 — Generate summary report

```
=== MIGRATION SUMMARY ===

Auto-fixed:      67 changes in 23 files
Manual needed:   34 changes in 18 files (see list below)
TS errors after: 8 (were 0 before)

TOP MANUAL ITEMS
1. src/components/DataTable.tsx — makeStyles with dynamic props (lines 12-45)
2. src/layouts/MainLayout.tsx — <Hidden> usage needs sx breakpoints (lines 78, 142)
3. src/theme/overrides.js — JSS syntax in component overrides (entire file)
...

NEXT STEPS
1. Run: pnpm add @mui/material @mui/icons-material @emotion/react @emotion/styled
2. Remove: @material-ui/core @material-ui/icons @material-ui/styles
3. Address the 8 TypeScript errors above
4. Manually convert the 3 makeStyles files (highest priority)
5. Re-run /mui-audit --scope full to verify no remaining issues
```

## Output

- Migration plan always printed.
- If not `--dry-run`: list of modified files, TypeScript error report, prioritized manual action list.
- Recommended follow-up: run `/mui-audit` after migration completes.
