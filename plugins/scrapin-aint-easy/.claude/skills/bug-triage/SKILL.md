---
description: Categorize and prioritize bug reports using codebase and documentation context
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Bug Triage Skill

Helps categorize, prioritize, and investigate bug reports.

## Steps

1. Read the bug report or error description
2. Search codebase for the error message or affected code path
3. Use `scrapin_search` to find relevant documentation
4. Use `scrapin_code_drift_report` to check if the affected API has changed
5. Categorize severity: critical / high / medium / low
6. Apply heuristics from `@.claude/skills/bug-triage/heuristics.md`
7. Suggest investigation steps and potential fixes
