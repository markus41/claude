# UX Principles

## Accessibility

- All interactive elements must be keyboard-navigable
- Use semantic HTML elements (`button`, `nav`, `main`, `section`)
- Color contrast must meet WCAG 2.1 AA (4.5:1 for normal text)
- Provide `aria-label` for icon-only buttons
- Support screen readers for workflow canvas state changes

<!-- Fill in: Specific accessibility requirements for ReactFlow canvas -->

## Keyboard Navigation

| Action | Shortcut |
|--------|----------|
<!-- Fill in: Canvas keyboard shortcuts (zoom, pan, delete node, etc.) -->

## Responsive Design

- Desktop-first layout (workflow canvas requires pointer interaction)
- Minimum supported viewport: 1024px width
- Side panels collapse on narrow viewports

<!-- Fill in: Breakpoints, mobile considerations -->

## Animation and Motion

- Use Framer Motion for UI transitions
- Respect `prefers-reduced-motion` media query
- Keep animations under 300ms for interactive feedback

## Design Tokens

<!-- Fill in: Color palette, spacing scale, typography scale from Tailwind config -->

## Error States

- Show inline validation errors next to the offending field
- Use toast notifications for transient success/error messages
- Never show raw stack traces to end users
