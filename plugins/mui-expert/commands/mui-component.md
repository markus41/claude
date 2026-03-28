---
name: /mui-component
intent: Scaffold a MUI component following best practices
inputs:
  - name: --name
    type: string
    description: Component name in PascalCase (e.g. UserProfileCard)
    required: true
  - name: --type
    type: enum
    values: [form, display, navigation, feedback, layout]
    required: true
  - name: --features
    type: string
    description: Comma-separated feature flags (responsive, dark-mode, a11y, animation)
    required: false
    default: a11y
  - name: --with-test
    type: boolean
    required: false
    default: false
risk: low
cost: medium
tags: [mui-expert, component, scaffold]
description: >
  Scaffold a production-ready MUI component with proper imports, sx prop styling,
  theme-aware tokens, TypeScript props interface, and optional accessibility
  attributes and animation. Optionally generate a co-located test file.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

# /mui-component

Scaffold a MUI component following best practices.

## Operating Protocol

### Step 1 — Determine component shape

- Parse `--type` to select the appropriate MUI primitives:
  - `form`: TextField, Select, Checkbox, Radio, Switch, Button, FormControl, FormLabel, FormHelperText
  - `display`: Card, CardContent, CardMedia, Typography, Avatar, Chip, Badge, List, Table
  - `navigation`: AppBar, Toolbar, Drawer, Tabs, Tab, Breadcrumbs, BottomNavigation, Menu
  - `feedback`: Dialog, Snackbar, Alert, CircularProgress, LinearProgress, Skeleton, Tooltip
  - `layout`: Box, Stack, Grid2, Paper, Divider, Container
- Parse `--features` to determine what to include:
  - `responsive`: use `sx` breakpoint syntax (`{ xs: ..., sm: ..., md: ... }`)
  - `dark-mode`: use `theme.palette.mode` checks and `ColorModeContext` if present
  - `a11y`: add ARIA attributes, keyboard handlers, focus management (always included by default)
  - `animation`: add MUI Transitions (Fade, Slide, Collapse, Grow) or Zoom for mount/unmount

### Step 2 — Scaffold the component

Generate a `.tsx` file with:

1. **Imports** — always use named path imports, never barrel:
   ```ts
   // Good
   import Button from '@mui/material/Button';
   // Avoid
   import { Button } from '@mui/material';
   ```

2. **Props interface** — TypeScript `interface ${Name}Props` with JSDoc comments on each prop.

3. **Styling** — prefer `sx` prop for one-off overrides, `styled()` for reusable sub-elements. Never use inline `style={{}}` for values available via `sx`. Never hardcode colors or spacing values — always reference `theme.palette.*` and `theme.spacing()`.

4. **Accessibility** — include appropriate attributes by default:
   - `IconButton`: always add `aria-label`
   - `TextField`: always use `label` prop or `aria-label` + `aria-describedby` for helper text
   - Interactive elements: `role`, `tabIndex`, `onKeyDown` where applicable
   - Images: `alt` text
   - Loading states: `aria-busy`, `aria-live="polite"` on status regions

5. **Dark mode** (if `--features` includes `dark-mode`): use `useTheme()` and check `theme.palette.mode` for conditional styles, or use `theme.palette.mode === 'dark'` inside `sx`.

6. **Animation** (if `--features` includes `animation`): wrap mount with a MUI Transition component. Use `in` prop tied to component visibility state.

7. **Responsive layout** (if `--features` includes `responsive`): use `Grid2` for multi-column layouts, `sx` breakpoints for font sizes and spacing adjustments.

### Step 3 — Generate test file (if `--with-test`)

Create a co-located `${Name}.test.tsx` file with:

1. **Render test** — smoke test that the component mounts without throwing.
2. **Accessibility check** — `jest-axe` `toHaveNoViolations()` assertion wrapped in a MUI `ThemeProvider`.
3. **User interaction test** — `@testing-library/user-event` simulation of the primary interaction (click, type, select).
4. **Theme variation test** — render once in light mode, once in dark mode, assert no console errors and snapshot matches.

Test file follows these conventions:
- Descriptive `describe`/`it` blocks (no single-word test names)
- No mocking of MUI internals
- Real `ThemeProvider` wrapping every render
- `screen.getByRole` preferred over `getByTestId`

### Step 4 — Quality gate

Before outputting, verify the generated component:

- [ ] No hardcoded hex colors or pixel values for spacing
- [ ] No `import { X } from '@mui/material'` barrel imports
- [ ] No inline `style={{}}` where `sx` can be used
- [ ] All interactive elements have `aria-label` or visible label
- [ ] TypeScript interface covers all props (no implicit `any`)
- [ ] Component is exported as named export and as default

## Output

- Component file written to the current working directory (or `src/components/` if it exists).
- Test file written alongside the component (if `--with-test`).
- Summary listing what was generated and any assumptions made about the component's behavior.
