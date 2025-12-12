# Chakra React Toolkit Settings Template

Copy this file to `.claude/chakra-react-toolkit.local.md` in your project and customize.

```markdown
---
# Theme Configuration
theme:
  primaryColor: "blue"           # Primary color scheme (blue, teal, purple, etc.)
  colorMode: "system"            # "light" | "dark" | "system"

# Path Configuration
componentPath: "src/components"  # Where to create new components
testPath: "src/__tests__"        # Where to create test files
hooksPath: "src/hooks"           # Where to create custom hooks

# Code Generation Settings
useStrictTypes: true             # Use strict TypeScript interfaces
exportStyle: "named"             # "named" | "default"
useForwardRef: true              # Wrap components with forwardRef

# Icon Library Preference
preferredIconLibrary: "lucide"   # "chakra" | "react-icons" | "lucide" | "heroicons"

# Animation Preference
animationLibrary: "framer-motion"  # "framer-motion" | "chakra" | "both"

# Testing Configuration
testingFramework: "vitest"       # "vitest" | "jest" | "both"
includeA11yTests: true           # Include jest-axe accessibility tests

# Component Defaults
defaultVariants:
  - "solid"
  - "outline"
  - "ghost"
defaultSizes:
  - "sm"
  - "md"
  - "lg"
---

# Project-Specific Conventions

## Component Naming
- Use PascalCase for component names
- Prefix shared components with project abbreviation if needed

## File Structure
- One component per file
- Co-locate tests with components or in __tests__ folder

## Custom Theme Notes
Add any project-specific theme customizations or design system notes here.

## Accessibility Requirements
Document any specific accessibility requirements for your project.
```
