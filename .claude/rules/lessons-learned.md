# Lessons Learned - Auto-Captured

This file is automatically updated by hooks when errors occur.
Claude reads this at the start of each session to avoid repeating mistakes.

## Error Patterns and Fixes

<!-- Entries are auto-appended by the PostToolUseFailure hook -->
<!-- After fixing an issue, update the Status from NEEDS_FIX to RESOLVED and add the fix description -->

### Error: EISDIR on directory path
- **Tool:** Read
- **Status:** RESOLVED
- **Fix:** Use `ls` or `Glob` for directories, `Read` for files only
- **Prevention:** Always check if path is a file before using Read tool

### Error: Exit code from ls on non-existent directory
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** `2>/dev/null` suppresses stderr but exit code still propagates
- **Prevention:** Use `ls ... || true` when directory may not exist

### Error: Bash redirection in for loop
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** `for f in "$dir"*.md 2>/dev/null` causes syntax error in bash eval
- **Prevention:** Use `find` or `ls | while read` instead of glob with redirection in for-in

### Error: Python iterating dict keys as objects
- **Tool:** Bash (python3 -c)
- **Status:** RESOLVED
- **Fix:** `plugins.index.json` has `"installed"` as dict (keys=names), not list of objects
- **Prevention:** Check JSON structure before assuming list/dict shape. Use `for k, v in d.items()`

### Error: Task resume on running agent
- **Tool:** Task
- **Status:** RESOLVED
- **Fix:** Cannot resume a still-running agent — must wait for completion or stop it first
- **Prevention:** Check agent status before attempting resume

### Error: git add on already-deleted files
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Files deleted with `git rm` are already staged; explicit `git add` fails with "pathspec did not match"
- **Prevention:** After `git rm`, use `git add -u` or just commit directly — don't re-add deleted files

### Error: heredoc grep confusion
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Complex heredoc scripts with pipes caused grep to treat shell arguments as file paths
- **Prevention:** Use simple sequential `cmd | grep` pipes, not embedded in heredoc blocks
