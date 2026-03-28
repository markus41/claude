# MUI Expert Plugin — Operational Guide

## Purpose
Use this plugin when working with Material UI (MUI) in React projects. It provides
comprehensive knowledge across 22 skill areas: theming, CSS variables, Pigment CSS,
components, sx/styled API, slots API, MUI X premium components (DataGrid, DatePickers,
Charts, TreeView), accessibility, performance, SSR/Next.js, animations, virtualization,
forms, white-label/multi-tenant, headless components (MUI Base), Joy UI, i18n/RTL,
testing, and migration.

## Package ecosystem
```
@mui/material        — Core components (Button, TextField, Dialog, etc.)
@mui/system          — sx prop, styled(), Box, Container, Grid, Stack
@mui/icons-material  — 2100+ Material Design icons
@mui/lab             — Experimental components (LoadingButton, TabContext, Masonry)
@mui/x-data-grid     — DataGrid (free), DataGridPro, DataGridPremium
@mui/x-date-pickers  — DatePicker, TimePicker, DateTimePicker, DateRangePicker
@mui/x-charts        — BarChart, LineChart, PieChart, ScatterChart, SparkLineChart
@mui/x-tree-view     — SimpleTreeView, RichTreeView, RichTreeViewPro
@mui/base            — Unstyled/headless components and hooks
@mui/joy             — Joy UI (alternative design system)
@emotion/react       — CSS-in-JS runtime (MUI's default styling engine)
@emotion/styled      — styled() function
@pigment-css/react   — Zero-runtime CSS engine (alternative to Emotion)
@pigment-css/nextjs-plugin — Next.js integration for Pigment CSS
```

## MUI MCP Server

The official MUI MCP server (`@mui/mcp`) is configured in `.mcp.json` as `mui-mcp`.
It provides direct access to MUI's official documentation — use it to get accurate,
up-to-date answers for complex MUI questions.

**Tools provided by `mui-mcp`:**
- `useMuiDocs` — Fetch documentation for a specific MUI package/topic
- `fetchDocs` — Follow-up fetch for additional doc URLs returned by `useMuiDocs`

**When to use:**
- Complex theming or component questions where skills alone may be insufficient
- Verifying API signatures, prop types, or behavior for specific MUI versions
- Getting the latest migration guidance or changelog details

**Recommended workflow:**
1. Call `useMuiDocs` with the relevant package/topic
2. Call `fetchDocs` for any additional URLs in the returned content
3. Combine MCP results with plugin skills to provide a complete answer

## Operating rules
1. Always use named imports from `@mui/material` (tree-shakeable)
2. Never import from `@mui/material/index` or barrel files in production code
3. Prefer `sx` prop for one-off styles, `styled()` for reusable styled components
4. Always wrap apps in `<ThemeProvider>` (or `<CssVarsProvider>` for CSS variables) with `<CssBaseline />`
5. Use `theme.palette.mode` for dark/light mode — never hard-code colors
6. Use the `slots` and `slotProps` API for component customization (not deprecated `components`/`componentsProps`)
7. DataGrid: always provide a `getRowId` prop, always wrap in explicit-height container
8. DatePicker: always wrap in `<LocalizationProvider>` with a date adapter
9. Charts: always set explicit height on container, use composition API for mixed charts
10. Accessibility: every icon-only button needs `aria-label`; every form field needs a label
11. For CSS variables mode, use `extendTheme()` + `CssVarsProvider` instead of `createTheme()` + `ThemeProvider`
12. For SSR, use `getInitColorSchemeScript()` to prevent flash of wrong color scheme
13. Memoize static sx objects outside components, dynamic ones with useMemo
14. Lazy-load heavy MUI X components (DataGrid, DatePicker, Charts) with React.lazy or next/dynamic

## Prohibited
- Do not use `makeStyles` or `@mui/styles` (deprecated JSS-based API)
- Do not use `@material-ui/*` packages (v4 legacy)
- Do not import the entire icon library (`import * as Icons`)
- Do not use inline `style={}` when `sx` is available
- Do not skip `CssBaseline` in theme setups
- Do not use `components`/`componentsProps` props (use `slots`/`slotProps` instead)
- Do not use `autoHeight` on DataGrid with large datasets (disables virtualization)
- Do not create theme inside component render functions

## Skill areas (22)

| Area | Skill | Key Topics |
|------|-------|------------|
| Theming | `theming` | createTheme, palette, typography, dark mode, component overrides, augmentation |
| CSS Variables | `css-variables-pigment` | CssVarsProvider, extendTheme, colorSchemes, Pigment CSS zero-runtime |
| Styling | `sx-styled` | sx prop, styled(), responsive values, pseudo-selectors, performance |
| Slots | `slots-api` | slots/slotProps for deep component customization, migration from components prop |
| Components | `components` | TextField, Autocomplete, Dialog, Table, AppBar, Drawer, Tabs, Menu |
| DataGrid | `data-grid` | Server-side, filtering, sorting, editing, export, Pro/Premium features |
| Date Pickers | `date-pickers` | DatePicker, TimePicker, timezone, validation, custom fields, shortcuts |
| Charts | `charts` | BarChart, LineChart, PieChart, composition API, custom tooltips, dual axes |
| Tree View | `tree-view` | SimpleTreeView, RichTreeView, lazy loading, DnD, virtualization |
| Forms | `forms-validation` | react-hook-form, Formik, Zod integration, complex form patterns |
| Layout | `layout-responsive` | Grid v2, Stack, Container, breakpoints, useMediaQuery |
| Accessibility | `accessibility` | ARIA, keyboard nav, focus management, WCAG compliance |
| Performance | `performance` | Tree-shaking, bundle analysis, render optimization, lazy loading |
| SSR/Next.js | `ssr-nextjs` | App Router, Pages Router, Emotion cache, RSC, Pigment CSS |
| Animations | `animations-transitions` | Fade, Grow, Slide, Collapse, TransitionGroup, Framer Motion |
| Virtualization | `virtualization` | react-window, react-virtuoso, virtualized Autocomplete, infinite scroll |
| White-Label | `white-label` | Nested ThemeProvider, dynamic themes, tenant branding, theme factory |
| MUI Base | `base-headless` | useButton, useInput, useMenu hooks, Tailwind integration |
| Joy UI | `joy-ui` | Alternative design system, variant system, CSS vars by default |
| i18n/RTL | `i18n-rtl` | RTL support, locale customization, bidirectional text |
| Testing | `testing` | React Testing Library, portal components, DataGrid tests, a11y testing |
| Migration | `migration` | v4→v5, v5→v6, codemods, Grid v2, slots migration |

## Context budget
Load order: CONTEXT_SUMMARY.md → relevant skill SKILL.md → command .md → agent .md
