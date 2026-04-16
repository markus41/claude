---
description: Plan schema or API migrations safely with rollback strategies
model: opus
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Migration Planner Skill

Plans safe schema, API, or dependency migrations with rollback strategies.

## Steps

1. Identify what's changing (schema, API version, dependency)
2. Use `scrapin_code_drift_scan` to find all affected code
3. Use `scrapin_graph_query` to map the dependency tree
4. Generate migration plan with:
   - Pre-migration checklist
   - Step-by-step migration sequence
   - Rollback procedure for each step
   - Verification queries/tests
5. Apply playbook from `@.claude/skills/migration-planner/playbook.md`
