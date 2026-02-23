# Lessons Learned - Auto-Captured

This file is automatically updated by hooks when errors occur.
Claude reads this at the start of each session to avoid repeating mistakes.

## Error Patterns and Fixes

<!-- Entries are auto-appended by the PostToolUseFailure hook -->
<!-- After fixing an issue, update the Status from NEEDS_FIX to RESOLVED and add the fix description -->

### Error: Read failure (2026-02-22T01:06:30Z)
- **Tool:** Read
- **Input:** `/home/user/claude/plugins/jira-orchestrator`
- **Error:** EISDIR: illegal operation on a directory, read
- **Status:** RESOLVED
- **Fix:** Use `ls` or `Glob` for directories, `Read` for files only
- **Prevention:** Always check if path is a file before using Read tool

### Error: Read failure (2026-02-22T01:06:56Z)
- **Tool:** Read
- **Input:** `/home/user/claude/plugins/jira-orchestrator/config/mcps`
- **Error:** EISDIR: illegal operation on a directory, read
- **Status:** RESOLVED
- **Fix:** Use `Bash ls` or `Glob` to list directory contents
- **Prevention:** Read tool is for files only, never directories

### Error: Bash failure (2026-02-23T00:24:08Z)
- **Tool:** Bash
- **Input:** `ls` with non-existent subdirectory
- **Error:** Exit code 2 - directory not found
- **Status:** RESOLVED
- **Fix:** The `teams/` subdirectory didn't exist; `2>/dev/null` suppressed stderr but exit code still propagated
- **Prevention:** Use `ls ... || true` when directory may not exist
