---
description: Structured code review using checklist and knowledge graph context
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
---

# Code Review Skill

Performs structured code reviews using the project's checklist, enriched with documentation
context from the scrapin knowledge graph.

## Steps

1. Read the diff or changed files
2. For each imported symbol in changed code, call `scrapin_search` to check if documentation exists
3. For deprecated symbol usage, flag with `scrapin_graph_query` to find replacements
4. Apply checklist from `@.claude/skills/code-review/checklist.md`
5. Format review using template from `@.claude/skills/code-review/template.md`
6. Categorize findings as BLOCK / REQUEST / SUGGEST / PRAISE
