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

### Error: Bash failure (2026-02-23T01:03:39Z)
- **Tool:** Bash
- **Input:** `# Check the agent-review-council plugin that appeared in ls but not in first scan
echo "=== agent-review-council (appeared in ls but missing from first scan) ==="
ls /home/user/claude/plugins/agent-review-council/ 2>/dev/null || echo "Directory empty or does not exist"
find /home/user/claude/plugins/agent-review-council -type f 2>/dev/null | head -20
du -sh /home/user/claude/plugins/agent-review-council/ 2>/dev/null`
- **Error:** Exit code 1
=== agent-review-council (appeared in ls but missing from first scan) ===
Directory empty or does not exist

=== agent-review-council (appeared in ls but missing from first scan) ===
Directory empty or does not exist
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T01:05:05Z)
- **Tool:** Bash
- **Input:** `for subdir in /home/user/claude/.claude/agents/*/; do
  dirname=$(basename "$subdir")
  echo "=== SUBDIR: $dirname ==="
  for f in "$subdir"*.md 2>/dev/null; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    summary=$(head -5 "$f" | grep -v "^---" | grep -v "^$" | head -3 | tr '\n' ' ')
    echo "  [$name] $summary"
  done
done`
- **Error:** Exit code 2
/bin/bash: eval: line 13: syntax error near unexpected token `2'
/bin/bash: eval: line 13: `  for f in "$subdir"*.md 2>/dev/null; do'

/bin/bash: eval: line 13: syntax error near unexpected token `2'
/bin/bash: eval: line 13: `  for f in "$subdir"*.md 2>/dev/null; do'
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T00:XX:00Z)
- **Tool:** Bash
- **Input:** Multi-line heredoc script passed to grep via pipe with quoted strings
- **Error:** grep treated echo/ls arguments as file paths instead of running them as shell commands
- **Status:** RESOLVED
- **Fix:** Use simple sequential commands with `echo "HEADER"` followed by `ls | grep` on separate lines; avoid complex heredoc scripts with pipes and redirects when using grep
- **Prevention:** When filtering ls output, use `ls /path/ | grep -iE "pattern"` as simple two-command pipes, not embedded in larger heredoc blocks

### Error: Bash failure (2026-02-23T01:07:40Z)
- **Tool:** Bash
- **Input:** `python3 -c "
import json

with open('/home/user/claude/.claude/registry/plugins.index.json') as f:
    data = json.load(f)

# Get the actual plugin list
plugins_section = data.get('plugins', {})
installed = data.get('installed', [])
registry = data.get('registry', [])

print('=== installed ===')
for p in installed:
    print(' -', p.get('name','?'), '|', p.get('id','?'))

print()
print('=== registry (first 30) ===')
if isinstance(registry, list):
    for p in registry[:30]:
        print(' -', p.get('name','?'), '|', p.get('id','?'))
elif isinstance(registry, dict):
    for k in list(registry.keys())[:30]:
        print(' -', k)
" 2>/dev/null`
- **Error:** Exit code 1
=== installed ===

=== installed ===
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T01:07:52Z)
- **Tool:** Bash
- **Input:** `python3 -c "
import json

with open('/home/user/claude/.claude/registry/plugins.index.json') as f:
    data = json.load(f)

installed = data.get('installed', [])
registry = data.get('registry', [])

print('=== installed ===')
for p in installed:
    print(' -', p.get('name','?'), '|', p.get('id','?'))

print()
print('=== registry (first 30) ===')
if isinstance(registry, list):
    for p in registry[:30]:
        print(' -', p.get('name','?'), '|', p.get('id','?'))
elif isinstance(registry, dict):
    for k in list(registry.keys())[:30]:
        print(' -', k)
"`
- **Error:** Exit code 1
=== installed ===
Traceback (most recent call last):
  File "<string>", line 12, in <module>
AttributeError: 'str' object has no attribute 'get'

=== installed ===
Traceback (most recent call last):
  File "<string>", line 12, in <module>
AttributeError: 'str' object has no attribute 'get'
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Task failure (2026-02-23T01:08:04Z)
- **Tool:** Task
- **Input:** `N/A`
- **Error:** Cannot resume agent a4fdfad: it is still running. Use TaskStop to stop it first, or wait for it to complete.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T01:11:13Z)
- **Tool:** Bash
- **Input:** `git add .claude/skills/docker/SKILL.md .claude/skills/e2e-testing/SKILL.md .claude/skills/fix-and-learn/SKILL.md .claude/skills/helm/SKILL.md .claude/skills/jira-smart-commits.md .claude/skills/lessons-review/SKILL.md .claude/rules/lessons-learned.md && git commit -m "$(cat <<'EOF'
refactor: Phase 2 skills cleanup - remove 6 redundant skills

Removed:
- docker/ skill (covered by docker-build/)
- helm/ skill (covered by helm-deploy/)
- fix-and-learn/ (covered by debugging skill + lessons-learned MCP)
- e2e-testing/ (covered by testing skill)
- lessons-review/ (covered by lessons-learned MCP server)
- jira-smart-commits.md (stray file, not in subdirectory)

Also captures lessons-learned from research agent errors.

https://claude.ai/code/session_01YPvN7sqzdynz1npqr1us9E
EOF
)"`
- **Error:** Exit code 128
fatal: pathspec '.claude/skills/docker/SKILL.md' did not match any files

fatal: pathspec '.claude/skills/docker/SKILL.md' did not match any files
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving
