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

## Graduated permanent rules (from recurring lessons-learned entries)

- Before calling `Read` on a path, confirm it is a file. Use `Glob` for directories, `Read` for files only. The `Read` tool fails with `EISDIR` on directories. *Graduated 2026-04-17 from 6 lessons.*
- Agent subagents inherit a large context chain (CLAUDE.md + rules + plugin CLAUDE.md) before the caller's prompt. When spawning, run the `prompt-budget-preflight` skill: prefer named specialists over generics, keep the user-prompt under ~400 words, and follow the 5-section minimum-viable-prompt template. Generics (Explore / general-purpose) with 900-word prompts have been observed to reject at 22%. *Graduated 2026-04-17 from 1 RESOLVED entry + live repro in planning phase.*

## Lessons-learned hygiene

- The PostToolUseFailure hook at `.claude/hooks/lessons-learned-capture.sh` filters known false-positive classes (tsc exit-2, grep zero-match, expected 4xx, vitest red-green iteration) before appending. See the filter list in the hook script for the complete set. Skipped captures are logged to `.claude/orchestration/telemetry/lessons-capture-skipped.jsonl` for audit.
- Run `/cc-memory --graduate --dry-run` periodically to propose more graduations; apply via `--apply` once reviewed. See `plugins/claude-code-expert/commands/cc-memory.md` for the full spec.
