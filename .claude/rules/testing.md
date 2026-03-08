---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**"
  - "**/__tests__/**"
---

# Testing Conventions

- Write tests before or alongside implementation
- Run only the specific test file being worked on, not the full suite
- Use descriptive test names: "should [expected behavior] when [condition]"
- Prefer real implementations over mocks where practical
- Test edge cases: empty inputs, null values, boundary conditions
- After fixing a bug, write a regression test first
