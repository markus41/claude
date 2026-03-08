---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Code Style Rules

- Use ES modules (import/export), not CommonJS (require)
- Destructure imports when possible
- Use TypeScript strict mode
- Prefer `const` over `let`, never use `var`
- Use async/await over raw promises
- Name files in kebab-case
- Name classes in PascalCase, functions in camelCase
- Maximum function length: 50 lines (extract helpers)
- Always handle errors explicitly, never swallow them
