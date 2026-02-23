# Self-Healing Protocol

When an error occurs:
1. The PostToolUseFailure hook automatically captures it in lessons-learned.md
2. Fix the underlying issue
3. Update the lessons-learned.md entry with:
   - Change Status from NEEDS_FIX to RESOLVED
   - Add a **Fix:** line describing what resolved it
   - Add a **Prevention:** line describing how to avoid it in future
4. If the error reveals a pattern, add a new rule to the appropriate `.claude/rules/*.md` file

When starting a session:
1. The SessionStart hook reminds about key tools and rules
2. Auto memory preserves cross-session learnings
3. Lessons-learned.md is loaded as a rule file automatically

This creates a continuous learning loop:
Error occurs → Hook captures → Claude fixes → Claude documents → Future sessions avoid the mistake
