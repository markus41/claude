---
description: Generate changelog entries from diffs and PRs
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Release Notes Skill

Generates structured changelog entries by analyzing git diffs and PR descriptions.

## Steps

1. Run `git log --oneline` for the release range
2. Categorize commits: feat, fix, refactor, docs, chore, test
3. For each significant change, check knowledge graph for affected symbols
4. Generate changelog in Keep a Changelog format
5. Apply template from `@.claude/skills/release-notes/template.md`
