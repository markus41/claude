---
name: fix-and-learn
description: Fix an issue and document the lesson learned. Ensures the self-healing loop completes.
disable-model-invocation: true
---

# Fix and Learn

Fix the following issue and document the lesson: $ARGUMENTS

## Process
1. **Diagnose**: Understand the root cause
2. **Fix**: Implement the minimal correct fix
3. **Test**: Verify the fix works (write a test if applicable)
4. **Document**: Update `.claude/rules/lessons-learned.md`:
   - Add or update the entry for this error
   - Set Status to RESOLVED
   - Add **Fix:** description
   - Add **Prevention:** how to avoid this in future
5. **Pattern check**: If this error reveals a broader pattern:
   - Add a new rule to the appropriate `.claude/rules/*.md` file
   - This prevents the entire class of error, not just this instance
