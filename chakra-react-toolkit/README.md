# Chakra React Toolkit

A comprehensive frontend development toolkit for React/Next.js projects using Chakra UI. Streamline your component development workflow with intelligent code generation, accessibility auditing, theme management, and testing utilities.

## Features

### Component Generation (8 commands)
- `/create-component` - Scaffold Chakra components with variants and TypeScript interfaces
- `/create-form` - Generate accessible forms with validation
- `/create-layout` - Build page layouts using Stack, Grid, and Flex
- `/create-modal` - Create modal/drawer/dialog components with focus management
- `/create-data-table` - Generate sortable, paginated data tables
- `/create-nav` - Build navigation menus, breadcrumbs, and tabs
- `/create-card` - Create cards, stats displays, and info components
- `/create-toast` - Set up toast notifications and alerts

### Accessibility (3 commands)
- `/a11y-audit` - Run comprehensive accessibility audit on components
- `/a11y-fix` - Auto-fix common accessibility issues
- `/test-a11y` - Generate accessibility tests with jest-axe

### Theming (3 commands)
- `/theme-setup` - Initialize Chakra theme with design tokens
- `/theme-extend` - Extend and customize existing theme
- `/responsive-check` - Analyze responsive design across breakpoints

### Testing (2 commands)
- `/test-component` - Generate component tests (Vitest/Jest + Testing Library)
- `/test-snapshot` - Generate visual snapshot tests

### Animation/Motion (2 commands)
- `/add-animation` - Add Framer Motion or Chakra transitions
- `/create-loader` - Create loading spinners and skeleton screens

### Icons/Assets (2 commands)
- `/setup-icons` - Configure icon library (Chakra Icons, React Icons, Lucide, Heroicons)
- `/create-icon` - Create custom icon components

## Installation

### From Claude Code Marketplace
```bash
claude plugins install chakra-react-toolkit
```

### Local Development
```bash
claude --plugin-dir /path/to/chakra-react-toolkit
```

## Skills

The plugin includes 4 auto-activating skills:

1. **chakra-components** - Chakra UI component patterns, composition, and responsive props
2. **chakra-theming** - Theme customization, design tokens, and color modes
3. **react-accessibility** - A11y best practices, ARIA patterns, and keyboard navigation
4. **component-testing** - Testing Library patterns for Chakra components

## Agents

Two intelligent agents assist your workflow:

1. **chakra-component-generator** - Proactively generates components following Chakra best practices
2. **accessibility-reviewer** - Reviews components for accessibility issues after creation

## Automated Validation

The plugin includes a PreToolUse hook that automatically validates:
- Chakra UI import patterns
- Basic accessibility attributes
- TypeScript interface consistency

## Configuration

Create `.claude/chakra-react-toolkit.local.md` in your project to customize:

```yaml
---
theme:
  primaryColor: "blue"
  colorMode: "system"
componentPath: "src/components"
testPath: "src/__tests__"
useStrictTypes: true
preferredIconLibrary: "lucide"
animationLibrary: "framer-motion"
---

# Project-specific notes and conventions
```

## Requirements

- React 18+
- Chakra UI v2+
- TypeScript 5+ (recommended)
- Node.js 18+

## Code Style

Generated components follow:
- TypeScript with explicit interfaces
- Chakra UI composition patterns
- React 18+ best practices
- WCAG 2.1 AA accessibility standards

## License

MIT
