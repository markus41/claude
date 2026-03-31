---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "**/*.html"
---

# Product / UX Guardrails

## Accessibility (WCAG 2.1 AA)

- Plugin marketplace UI must meet WCAG 2.1 AA compliance
- All interactive elements must have visible focus indicators
- Color contrast ratio must be at least 4.5:1 for normal text, 3:1 for large text
- Images and icons must have meaningful `alt` text or `aria-label`
- Form inputs must have associated labels
- Error messages must be announced to screen readers (`role="alert"` or `aria-live`)

## ReactFlow Canvas

- ReactFlow canvas must support keyboard navigation (Tab to nodes, Enter to select, arrow keys to pan)
- Provide zoom controls accessible via keyboard, not just scroll/pinch
- Node content must be readable at default zoom level
- Canvas must have an accessible label describing its purpose

## State Management

- Zustand stores must use `immer` middleware for complex nested state updates
- Keep stores focused — one store per domain (plugins, agents, canvas, etc.)
- Derived state should use selectors, not duplicate data across stores
- Avoid storing server state in Zustand — use TanStack Query for API data

## User-Facing Copy

- All user-facing strings must be in English, clear, and free of technical jargon
- Error messages must explain what went wrong and what the user can do about it
- Loading states must provide feedback (spinner, skeleton, or progress indicator)
- Avoid abbreviations in UI labels unless universally understood (e.g., "OK", "URL")

## Plugin Lifecycle

- Plugin install must be non-destructive — never delete user data during installation
- Plugin uninstall must be reversible — preserve user configuration for potential reinstall
- Show confirmation dialogs for destructive actions (uninstall, reset, bulk delete)
- Plugin state transitions must provide visual feedback (installing, active, error, disabled)

## Performance

- Lazy-load plugin UIs — do not bundle all plugin components in the main chunk
- Large lists (plugins, agents, skills) must use virtualization if > 50 items
- Animations (Framer Motion) must respect `prefers-reduced-motion` media query
- Canvas operations must maintain 60fps — debounce expensive recalculations
