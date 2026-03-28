# MUI Expert Plugin — Operational Guide

## Purpose
Use this plugin when working with Material UI (MUI) in React projects. It provides
deep knowledge of theming, components, the sx/styled API, MUI X premium components,
accessibility patterns, performance optimization, and version migration.

## Package ecosystem
```
@mui/material        — Core components (Button, TextField, Dialog, etc.)
@mui/system          — sx prop, styled(), Box, Container, Grid, Stack
@mui/icons-material  — 2100+ Material Design icons
@mui/lab             — Experimental components (LoadingButton, TabContext, Masonry)
@mui/x-data-grid     — DataGrid (free), DataGridPro, DataGridPremium
@mui/x-date-pickers  — DatePicker, TimePicker, DateTimePicker, DateRangePicker
@mui/x-charts        — BarChart, LineChart, PieChart, ScatterChart
@mui/x-tree-view     — TreeView, RichTreeView
@mui/base            — Unstyled/headless components
@mui/joy             — Joy UI (alternative design system)
@emotion/react       — CSS-in-JS runtime (MUI's default styling engine)
@emotion/styled      — styled() function
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
4. Always wrap apps in `<ThemeProvider>` with `<CssBaseline />`
5. Use `theme.palette.mode` for dark/light mode — never hard-code colors
6. DataGrid: always provide a `getRowId` prop if rows lack an `id` field
7. DatePicker: always wrap in `<LocalizationProvider>` with a date adapter
8. Accessibility: every icon-only button needs `aria-label`; every form field needs a label

## Prohibited
- Do not use `makeStyles` or `@mui/styles` (deprecated JSS-based API)
- Do not use `@material-ui/*` packages (v4 legacy)
- Do not import the entire icon library (`import * as Icons`)
- Do not use inline `style={}` when `sx` is available
- Do not skip `CssBaseline` in theme setups

## Context budget
Load order: CONTEXT_SUMMARY.md → relevant skill SKILL.md → command .md → agent .md
