---
name: /mui-audit
intent: Audit MUI usage in a project for best practices, performance, and accessibility
inputs:
  - name: --scope
    type: enum
    values: [full, performance, a11y, patterns]
    required: false
    default: full
  - name: --fix
    type: boolean
    description: Automatically apply safe fixes where possible
    required: false
    default: false
  - name: --path
    type: string
    description: Directory to audit (defaults to src/)
    required: false
    default: src/
risk: low
cost: high
tags: [mui-expert, audit, best-practices]
description: >
  Scan a project's MUI usage for anti-patterns, performance issues, and
  accessibility gaps. Produces a severity-graded report with file locations
  and fix suggestions. Optionally applies safe automatic fixes.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# /mui-audit

Audit MUI usage in a project for best practices, performance, and accessibility.

## Operating Protocol

### Step 1 — Discover MUI files

1. Use `Glob` to find all `.tsx`, `.ts`, `.jsx`, `.js` files under `--path`.
2. Filter to files that import from `@mui/*` or `@material-ui/*` using `Grep`.
3. Build a file inventory: path, MUI packages imported, rough component count.

### Step 2 — Run scoped checks

Run the checks appropriate to `--scope`. `full` runs all scopes.

#### Performance checks (`--scope performance`)

| ID | Anti-pattern | Severity |
|----|-------------|----------|
| P01 | Barrel import from `@mui/material` (e.g. `import { Button, Box } from '@mui/material'`) — prevents tree-shaking | error |
| P02 | `import * as Icons from '@mui/icons-material'` or unspecific icon barrel import | error |
| P03 | Inline `sx` object literal on a component that re-renders frequently (unstable reference) — should use `useMemo` or `styled()` | warning |
| P04 | DataGrid without `columnVisibilityModel` memoization when column list is large | warning |
| P05 | `ThemeProvider` defined inside a component body (recreates theme on every render) | error |
| P06 | Missing `React.memo` or `useMemo` on expensive MUI list items inside virtualized lists | info |

#### Accessibility checks (`--scope a11y`)

| ID | Anti-pattern | Severity |
|----|-------------|----------|
| A01 | `IconButton` without `aria-label` prop | error |
| A02 | `TextField` without `label`, `aria-label`, or `aria-labelledby` | error |
| A03 | `Dialog` without `aria-labelledby` pointing to a title element | warning |
| A04 | `Tooltip` wrapping a disabled element without `<span>` wrapper (tooltip never fires) | warning |
| A05 | `CircularProgress` or `LinearProgress` without `aria-label` or `aria-describedby` | warning |
| A06 | `Link` or `Button` with only icon content and no screen-reader text | error |
| A07 | Color contrast — custom `palette` colors that fail WCAG AA (4.5:1 for normal text, 3:1 for large) | error |
| A08 | `Select` without associated `InputLabel` and matching `labelId` | error |
| A09 | `Tabs` without `aria-label` on the `Tabs` container | warning |
| A10 | `Alert` without `role="alert"` when dynamically inserted (not rendered on mount) | warning |

#### Patterns checks (`--scope patterns`)

| ID | Anti-pattern | Severity |
|----|-------------|----------|
| Q01 | `makeStyles` or `withStyles` usage — v4 JSS API, migrate to `styled()` or `sx` | error |
| Q02 | `@material-ui/*` imports — v4 package name, migrate to `@mui/*` | error |
| Q03 | Hardcoded hex/rgb color values in `sx` or `style` props instead of `theme.palette.*` | error |
| Q04 | Hardcoded pixel spacing (e.g. `mt: '16px'`) instead of theme spacing units (e.g. `mt: 2`) | warning |
| Q05 | Missing `<CssBaseline />` inside `ThemeProvider` | warning |
| Q06 | `ThemeProvider` absent — app uses MUI components without theme context | warning |
| Q07 | Repeated `sx` patterns (3+ identical `sx` objects across files) that should be extracted into `styled()` or component overrides | info |
| Q08 | `Grid` v1 API (`item`, `container`, `xs`/`sm`/`md` as direct props) — should migrate to `Grid2` | warning |
| Q09 | Missing `key` prop on MUI components inside `.map()` | error |
| Q10 | `DatePicker` / `TimePicker` / `DateTimePicker` without `LocalizationProvider` ancestor | error |
| Q11 | `DataGrid` rows without `id` field and missing `getRowId` prop | error |
| Q12 | Inline `style={{}}` prop where equivalent `sx` prop exists | warning |

### Step 3 — Compile report

Group findings by severity (ERROR → WARNING → INFO), then by file.

For each finding, output:
```
[SEVERITY] File: path/to/file.tsx (line ~N)
Rule: Q03 — Hardcoded color in sx prop
Found: color: '#1976d2'
Fix: color: 'primary.main'  (or theme.palette.primary.main inside styled())
```

Calculate an overall health score:
- Start at 100
- Deduct 5 per ERROR, 2 per WARNING, 0.5 per INFO
- Clamp to 0–100

Print summary:
```
MUI Audit Summary
-----------------
Files scanned:   42
Files with issues: 18
Errors:   7
Warnings: 23
Info:     11
Health score: 72/100
```

### Step 4 — Apply fixes (if `--fix`)

Only apply fixes that are **safe** (no behavior change, purely syntactic):

- Q02: Rewrite `@material-ui/*` imports to `@mui/*` equivalents
- Q01: Rewrite `makeStyles` to `styled()` only when the styles are purely static (no dynamic props)
- Q09: Add `key={item.id}` (prompt for the ID field if ambiguous)
- Q12: Convert `style={{ marginTop: '16px' }}` to `sx={{ mt: 2 }}` (8px grid)
- A01: Add `aria-label="[icon description]"` to `IconButton` — prompt for label text if not inferable from context

For each fix applied, print:
```
FIXED [Q02] src/components/Nav.tsx — rewrote @material-ui/core import to @mui/material
```

Do not auto-fix: color contrast issues (A07), missing ThemeProvider (Q06), DataGrid row ID (Q11), or any change that requires understanding business logic.

After applying fixes, re-run the affected checks and show delta.

## Output

- Audit report printed in the conversation.
- If `--fix` was used, list of files modified.
- Prioritized action list: top 5 highest-impact fixes to address manually.
