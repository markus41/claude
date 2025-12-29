---
name: audit-a11y
description: Run comprehensive accessibility audit with WCAG compliance check
argument-hint: [path-to-component]
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---

# Accessibility Audit Command

You are being invoked as the `/audit-a11y` slash command for the frontend-powerhouse plugin.

## Your Task

Perform a comprehensive accessibility audit of a component or application path. Use the **accessibility-auditor** agent with **ultrathink** mode for deep analysis.

## Arguments

- **path-to-component** (optional): Path to specific component or directory. Defaults to `src/`

## Instructions

1. **Activate the accessibility-auditor agent** via the Task tool with ultrathink enabled
2. The agent will analyze:
   - Semantic HTML structure
   - ARIA attributes and roles
   - Keyboard navigation support
   - Color contrast ratios
   - Screen reader compatibility
   - Focus management
   - Form labels and validation messages
3. Generate a WCAG 2.1 Level AA compliance report
4. Provide actionable recommendations with code examples

## WCAG Criteria Checked

- **Perceivable**: Text alternatives, captions, adaptable content, distinguishable elements
- **Operable**: Keyboard accessible, sufficient time, seizure prevention, navigable
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

## Expected Output

A markdown report saved to `accessibility-audit-{timestamp}.md` with:

```markdown
# Accessibility Audit Report

**Date**: {timestamp}
**Path**: {path}
**WCAG Level**: AA
**Overall Score**: {score}/100

## Summary
- Total Issues: {count}
- Critical: {count}
- Major: {count}
- Minor: {count}

## Issues Found

### 1. [Critical] Missing ARIA Labels
- **Location**: `src/components/Button/index.tsx:45`
- **Issue**: Button has no accessible name
- **WCAG**: 4.1.2 Name, Role, Value
- **Fix**:
  ```tsx
  <Button aria-label="Submit form">Submit</Button>
  ```

## Recommendations
...
```

## Usage Examples

```bash
# Audit entire src directory
/audit-a11y

# Audit specific component
/audit-a11y src/components/Button

# Audit specific file
/audit-a11y src/pages/Dashboard.tsx
```

## Delegation Pattern

```typescript
// Use Task tool with ultrathink for deep analysis
task: {
  agent: "accessibility-auditor",
  prompt: `Perform comprehensive WCAG 2.1 AA accessibility audit of ${path}`,
  model: "opus",  // Use opus for ultrathink
  extended_thinking: true
}
```

## Tools to Use

The agent may use:
- Static analysis of JSX/TSX files
- Automated testing with @axe-core/react
- Manual review of patterns
- Color contrast checking tools

After completion, save the report and provide a summary to the user with the most critical issues highlighted.
