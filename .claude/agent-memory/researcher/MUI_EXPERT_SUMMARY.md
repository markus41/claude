# Material UI Expert Plugin Knowledge Base

**Research Completion Date**: 2026-03-28
**MUI Coverage**: v5 (legacy), v6 (current), v7 (roadmap)
**Status**: Ready for expert plugin development

## Executive Summary

Comprehensive Material UI research completed covering all 10 requested areas. MUI is a mature, production-grade React component library with sophisticated theming, multiple styling approaches, and advanced packages for data tables, date pickers, and custom design systems.

**Key Insights**:
1. **Package structure is modular**: @mui/material is complete; @mui/system for custom systems; @mui/base for headless
2. **v6 is smooth upgrade**: Only breaking changes are bundle optimization (UMD removed), IE 11 support dropped, Grid API updated
3. **Styling has evolved**: Emotion (v5), dual Emotion/Pigment (v6 opt-in), Pigment CSS becoming default (v7)
4. **Accessibility is strong**: WCAG 2.1 AA built-in; don't fight MUI's ARIA implementations
5. **Performance matters**: Path imports 6x faster than barrel imports; Pigment CSS future

---

## Critical Findings for Expert Plugin

### 1. Package Architecture
- **8 core packages**: material, system, x-data-grid, x-date-pickers, icons-material, lab, joy, base
- **Installation**: Only install @mui/material + Emotion peers; others pulled as needed
- **Layering**: Material Design compliance at @mui/material; design system primitives at @mui/system; headless at @mui/base

### 2. Theming (Deepest Control Point)
- **createTheme** defines: palette (colors), typography (fonts), spacing (8px base), breakpoints, components overrides
- **Three customization layers**: component-level (sx), component-type (styleOverrides), global theme
- **CSS variables support**: `cssVariables: true` generates `--mui-palette-primary-main` etc. at build time for zero-flicker SSR
- **Dark mode**: NEVER use `theme.palette.mode` checks; ALWAYS use `theme.applyStyles('dark', {...})`

### 3. Styling Approaches
| Approach | When | DX | Performance |
|----------|------|-----|-------------|
| sx prop | One-off, responsive | Excellent (inline) | Emotion runtime |
| styled() | Reusable components | Good (named exports) | Emotion runtime |
| Pigment CSS | Production (v6+) | Requires build config | Zero runtime |

### 4. Component Props Patterns
- **Size control**: `size="small" \| "medium" \| "large"`
- **Slot system (v6+)**: `slots={{ root: Custom }}` + `slotProps={{ root: {...} }}`
- **Deprecated**: `component` prop (v5 anti-pattern), `renderInput` in DatePicker
- **Responsive values**: `sx={{ fontSize: { xs: '12px', md: '16px' } }}`

### 5. MUI v5 → v6 Breaking Changes
- **UMD bundle removed**: -2.5MB (-25% size)
- **IE 11 support dropped**: Chrome 90→109 minimum
- **Grid API**: `xs={12}` → `size={{ xs: 12 }}`
- **Slots**: `component` → `slots` + `slotProps`
- **@mui/lab deprecated**: Pickers moved to @mui/x-date-pickers
- **Pigment CSS**: Optional zero-runtime engine
- **Codemods available**: `npx @mui/codemod@latest v5-to-v6`

### 6. Responsive Design System
- **5 breakpoints**: xs(0), sm(600), md(900), lg(1200), xl(1536)
- **CSS approach**: `theme.breakpoints.up('md')`, `theme.breakpoints.down('sm')`
- **JS approach**: `useMediaQuery(theme.breakpoints.down('sm'))`
- **Responsive sx**: `sx={{ padding: { xs: 1, md: 2 } }}`
- **SSR critical**: Use `useMediaQuery` to prevent mobile→desktop layout flash

### 7. MUI X Components (Advanced)
- **DataGrid**: Enterprise table with keyboard nav, custom checkbox column (`checkboxColDef`), March 2026 updates
- **DatePicker**: v5→v6 changed from `renderInput` to `slotProps.textField`; v6→v7 changed slot naming
- **TreeView, Gantt, Charts**: All follow modern slot prop pattern

### 8. Accessibility (Built-in WCAG 2.1 AA)
- **Semantic HTML**: Button renders as `<button>`, Input as `<input>`
- **ARIA management**: MUI auto-adds roles; don't duplicate
- **Focus management**: Proper tabindex, visible focus states
- **Don't fight MUI**: Let components handle accessibility; avoid custom ARIA on MUI components

### 9. Performance & Bundle Size
- **Path imports**: `import Button from '@mui/material/Button'` (6x faster dev than barrel)
- **Icons**: Use `@mui/icons-material/ComponentName`, not named imports
- **Tree-shaking**: Modern bundlers handle it; focus on import style
- **Pigment CSS**: Opt-in v6, default v7; zero-runtime styling with build-time extraction
- **Next.js 13.5+**: Auto-optimized imports with `optimizePackageImports`

### 10. Anti-Patterns & Common Mistakes
| Anti-Pattern | Problem | Fix |
|---|---|---|
| `theme.palette.mode === 'dark' ? '#fff' : '#000'` | Flicker on mode toggle | Use `theme.applyStyles('dark', {...})` |
| `import { Button } from '@mui/material'` | 6x slower dev builds | Use `import Button from '@mui/material/Button'` |
| `'.Mui-disabled': { opacity: 0.5 }` | Affects all disabled globally | Use `'&.Mui-disabled': {...}` |
| `'& .Mui-focused': { color: red }` (no space) | Selector doesn't match | Use `'&.Mui-focused': { color: red }` (space required) |
| Missing ThemeProvider | Components have no theme | Wrap entire app with `<ThemeProvider theme={theme}>` |
| Grid v5 API in v6 | Breaks responsive layout | Use `Grid2 size={{ xs: 12, sm: 6 }}` |
| Styled components nesting | Complex selectors fail silently | Use sx prop or simple selectors |

---

## Supporting Documentation

### Official Sources Referenced
1. [MUI Main Documentation](https://mui.com)
2. [v6 Upgrade Guide](https://mui.com/material-ui/migration/upgrade-to-v6/)
3. [Theming & Customization](https://mui.com/material-ui/customization/theming/)
4. [sx Prop System](https://mui.com/system/getting-started/the-sx-prop/)
5. [CSS Theme Variables](https://mui.com/material-ui/customization/css-theme-variables/)
6. [Bundle Size Optimization](https://mui.com/material-ui/guides/minimizing-bundle-size/)
7. [Next.js Integration](https://mui.com/material-ui/integrations/nextjs/)
8. [Base UI (Headless v1.0)](https://v6.mui.com/base-ui/getting-started/)
9. [MUI X Components](https://mui.com/x/)
10. [Joy UI Alternative](https://mui.com/joy-ui/getting-started/)
11. [Accessibility Patterns](https://mui.com/material-ui/guides/accessibility/)
12. [Migration from Deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/)

### Alternative Packages Covered
- **@mui/joy**: Alternative design system (beta status, development on hold)
- **@mui/base**: Headless components library (v1.0 stable, 35+ components, zero default styles)
- **@mui/lab**: Incubated components (deprecated; moved to X or main)

---

## Expert Plugin Use Cases

This comprehensive knowledge base enables building an expert MUI plugin that:

1. **Provides API guidance**: Knows all component props, variants, slot structures
2. **Detects anti-patterns**: Identifies dark mode flicker, barrel imports, selector issues
3. **Explains v5→v6 migration**: Automates codemod suggestions, explains breaking changes
4. **Optimizes performance**: Recommends path imports, Pigment CSS migration, bundle analysis
5. **Ensures accessibility**: Validates ARIA patterns, WCAG compliance, semantic HTML
6. **Customization wizard**: Guides theme creation, component overrides, variant definitions
7. **Responsive design helper**: Suggests breakpoint usage, useMediaQuery patterns, SSR considerations
8. **Next.js integration**: Handles SSR styling extraction, CSS variables, media query optimization
9. **Component patterns**: Teaches sx prop, styled() API, slots/slotProps patterns
10. **Troubleshooting**: Resolves theme nesting issues, styling conflicts, dark mode problems

---

## Recommended Plugin Structure

For comprehensive MUI expert plugin:

```
/plugin/
  commands/
    - theme-analyzer.md (analyzes current theme, suggests improvements)
    - component-auditor.md (finds anti-patterns, accessibility issues)
    - migration-guide.md (v5→v6 codemod and manual migration)
    - performance-optimizer.md (import paths, bundle analysis)
  agents/
    - theme-architect.md (theme customization expert)
    - component-pattern-guide.md (teaches component usage)
    - accessibility-auditor.md (WCAG/ARIA validation)
    - migration-specialist.md (v5→v6 support)
  skills/
    - theming-system/ (palette, typography, spacing, variants)
    - styling-approaches/ (sx prop, styled(), Pigment CSS)
    - responsive-design/ (breakpoints, useMediaQuery, SSR)
    - mui-x-components/ (DataGrid, DatePicker patterns)
    - accessibility-patterns/ (ARIA, semantic HTML, focus)
    - performance-optimization/ (imports, bundle size, Pigment CSS)
    - anti-pattern-detection/ (common mistakes, quick fixes)
```

---

## Key Performance Metrics

- **Development build time**: 6x improvement with path imports vs barrel imports
- **Bundle size reduction (v6)**: 2.5MB (-25%) with UMD removal
- **Dark mode SSR flicker**: Eliminated with CSS variables + `applyStyles()`
- **Pigment CSS (v6 opt-in)**: Further bundle reduction, RSC compatible, zero runtime overhead
- **Icon performance**: Significant improvement with path imports over named imports

---

**Status**: Research complete. Ready to implement expert MUI plugin with all areas covered comprehensively.
