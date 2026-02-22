---
name: lessons-review
description: Review and maintain the lessons-learned knowledge base. Use to audit past errors, clean up resolved entries, and extract patterns.
disable-model-invocation: true
---

# Lessons Learned Review

Review and maintain `.claude/rules/lessons-learned.md`:

1. Read the current lessons-learned file
2. For entries marked NEEDS_FIX:
   - Check if the issue has been resolved in the codebase
   - If resolved, update Status to RESOLVED and add Fix/Prevention notes
3. For entries marked RESOLVED:
   - Extract recurring patterns into appropriate `.claude/rules/*.md` files
   - Remove duplicate entries
4. Report summary:
   - Total entries
   - Open (NEEDS_FIX) count
   - Resolved count
   - New patterns extracted to rules

$ARGUMENTS
