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

### Error: Bash failure (2026-02-23T02:31:39Z)
- **Tool:** Bash
- **Input:** `ls /home/user/claude/.claude/tools/plugin-cli/src/ 2>/dev/null && echo "---" && ls /home/user/claude/.claude/tools/plugin-cli/src/commands/ 2>/dev/null`
- **Error:** Exit code 2
bundler.ts
cli.ts
doctor.ts
linter.ts
scaffolder.ts
template-engine.ts
types.ts
validator.ts
---

bundler.ts
cli.ts
doctor.ts
linter.ts
scaffolder.ts
template-engine.ts
types.ts
validator.ts
---
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T02:40:30Z)
- **Tool:** Bash
- **Input:** `python3 -c "
import json, os
idx = json.load(open('.claude/registry/index.json'))
print('=== SKILL REFERENCES IN QUICKLOOKUP ===')
broken = 0
for trigger, target in idx['quickLookup']['byTrigger'].items():
    parts = target.split('/')
    if parts[0] == 'skills':
        skill_dir = f'.claude/skills/{parts[1]}'
        skill_md = f'{skill_dir}/SKILL.md'
        if not os.path.isfile(skill_md):
            print(f'  BROKEN: {trigger[:40]:40s} -> {target} (no SKILL.md)')
            broken += 1
        else:
            print(f'  OK:     {trigger[:40]:40s} -> {target}')
    elif parts[0] == 'agents':
        import glob
        matches = glob.glob(f'.claude/agents/**/{parts[1]}.md', recursive=True)
        if not matches:
            matches = glob.glob(f'.claude/agents/{parts[1]}.md')
        if not matches:
            print(f'  BROKEN: {trigger[:40]:40s} -> {target} (no agent .md)')
            broken += 1
        else:
            print(f'  OK:     {trigger[:40]:40s} -> {target}')
    else:
        print(f'  SKIP:   {trigger[:40]:40s} -> {target} (mcp/external)')
print(f'\nTotal broken: {broken}')
"`
- **Error:** Exit code 1
Traceback (most recent call last):
  File "<string>", line 3, in <module>
FileNotFoundError: [Errno 2] No such file or directory: '.claude/registry/index.json'

Traceback (most recent call last):
  File "<string>", line 3, in <module>
FileNotFoundError: [Errno 2] No such file or directory: '.claude/registry/index.json'
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Read failure (2026-02-23T03:10:48Z)
- **Tool:** Read
- **Input:** `/home/user/claude/plugins/ahling-command-center/agents/acc-agent.md`
- **Error:** File does not exist. Note: your current working directory is /home/user/claude.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Read failure (2026-02-23T03:11:02Z)
- **Tool:** Read
- **Input:** `/home/user/claude/plugins/ahling-command-center/agents/acc-agent.md`
- **Error:** File does not exist. Note: your current working directory is /home/user/claude.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T03:12:21Z)
- **Tool:** Bash
- **Input:** `head -100 /home/user/claude/plugins/fastapi-backend/skills/fastapi-core/SKILL.md`
- **Error:** Exit code 1
head: cannot open '/home/user/claude/plugins/fastapi-backend/skills/fastapi-core/SKILL.md' for reading: No such file or directory

head: cannot open '/home/user/claude/plugins/fastapi-backend/skills/fastapi-core/SKILL.md' for reading: No such file or directory
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Read failure (2026-02-23T03:12:55Z)
- **Tool:** Read
- **Input:** `/tmp/claude-0/-home-user-claude/tasks/a063b03.output`
- **Error:** File content (89831 tokens) exceeds maximum allowed tokens (25000). Please use offset and limit parameters to read specific portions of the file, or use the GrepTool to search for specific content.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T03:16:29Z)
- **Tool:** Bash
- **Input:** `ls -la /home/user/claude/plugins/marketplace-pro/commands/security/ 2>/dev/null`
- **Error:** Exit code 2
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-02-23T03:22:20Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit --strict ... plugins/marketplace-pro/src/composition/engine.ts`
- **Error:** Cannot find module 'fs' or its corresponding type declarations
- **Status:** RESOLVED
- **Fix:** Same as federation module — root tsconfig lacks @types/node. Plugin TS files are reference implementations not compiled by root build.
- **Prevention:** Do not type-check plugin Node.js TS files with the root tsconfig.

### Error: Bash failure (2026-02-23T03:22:59Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit --target ES2022 --module nodenext --moduleResolution nodenext --strict --esModuleInterop --skipLibCheck plugins/marketplace-pro/src/federation/types.ts plugins/marketplace-pro/src/federation/registry.ts 2>&1`
- **Error:** Exit code 2 — Cannot find module 'fs'/'path'/'crypto' or 'process'
- **Status:** RESOLVED
- **Fix:** Root tsconfig is for React/Vite frontend and has no `@types/node`. Plugin TS files using Node APIs are reference implementations not compiled by root tsconfig. This is expected and consistent with all other marketplace-pro modules (engine.ts, trust-engine.ts).
- **Prevention:** Do not type-check plugin Node.js TS files with the root tsconfig. These plugins would need their own tsconfig with `"types": ["node"]` or `@types/node` installed if compilation were required.

### Error: Bash failure (2026-02-23T03:28:16Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit plugins/marketplace-pro/src/devstudio/types.ts plugins/marketplace-pro/src/devstudio/server.ts --target ES2020 --module ESNext --moduleResolution bundler --strict --skipLibCheck --allowImportingTsExtensions --noUnusedLocals --noUnusedParameters --lib ES2020 --isolatedModules --noEmit 2>&1`
- **Error:** Exit code 2
plugins/marketplace-pro/src/devstudio/server.ts(27,3): error TS6196: 'ValidationSeverity' is declared but never used.
plugins/marketplace-pro/src/devstudio/server.ts(1259,15): error TS6133: 'relativePath' is declared but its value is never read.

plugins/marketplace-pro/src/devstudio/server.ts(27,3): error TS6196: 'ValidationSeverity' is declared but never used.
plugins/marketplace-pro/src/devstudio/server.ts(1259,15): error TS6133: 'relativePath' is declared but its value is never read.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Read failure (2026-02-23T03:28:25Z)
- **Tool:** Read
- **Input:** `/home/user/claude/.claude/agent-memory/code-reviewer/MEMORY.md`
- **Error:** File does not exist. Note: your current working directory is /home/user/claude.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: JSON structure assumption
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** commands.minimal.json `commands` field is a flat list, not a dict of categories. Check structure before assuming dict.
- **Prevention:** Always inspect JSON structure with `type()` check before calling `.items()` on it.

### Error: Bash escapes `!=` in inline python
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Bash escapes `!` inside double-quoted strings. Use heredoc (`<< 'PYEOF'`) for multi-line python instead of inline `-c "..."`.
- **Prevention:** Always use heredoc for python scripts with `!=` or `!` operators.

### Error: Git push rejected (remote ahead)
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Use `git stash && git pull --rebase origin <branch> && git stash pop` when local has uncommitted changes and remote is ahead.
- **Prevention:** Always `git pull --rebase` before pushing. If unstaged changes exist, stash first.
