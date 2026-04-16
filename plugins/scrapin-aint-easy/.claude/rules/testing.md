---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**"
---

# Testing Rules

## Framework

- **Unit/Integration**: Vitest
- **Config**: `vitest.config.ts` at project root
- **Test location**: `tests/` directory mirroring `src/` structure

## Test Requirements

- Every new module must have at least one test file
- Bug fixes must include a regression test
- Test names must be descriptive: `it('should enforce max concurrency under load')`

## Test Structure

- Use `describe` blocks for grouping by class/module
- Use `it` or `test` for individual cases
- Arrange-Act-Assert pattern
- Prefer real implementations over mocks — only mock external services (network, filesystem)

## What to Test

- **Core modules**: concurrency limits, rate limiting accuracy, graph traversal correctness
- **Crawlers**: symbol extraction accuracy, snapshot diffing
- **Drift detection**: scoring accuracy, contradiction detection, baseline management
- **MCP tools**: input validation, response formatting

## Running Tests

```bash
pnpm test         # Run all tests once
pnpm test:watch   # Watch mode
```
