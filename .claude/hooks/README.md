# Hook System

Hooks are shell scripts that Claude Code executes automatically at specific lifecycle
events. They run outside of Claude's context — they cannot be overridden by prompts,
and they execute whether or not Claude is aware of them. This makes hooks the right
place for safety enforcement, automatic logging, and quality gates.

## Why hooks instead of instructions

Instructions in `CLAUDE.md` can be forgotten or overridden when context fills up.
Hooks cannot. The `bash-safety-validator` hook will block a destructive `rm -rf`
command even if Claude's context has been compacted and the rule file is no longer
visible. Hooks are the last line of defense.

## Hook inventory

| Script | Event | Matcher | Purpose |
|--------|-------|---------|---------|
| `session-init.sh` | SessionStart | — | Injects project context (paths, MCP tools, reminder to check lessons-learned) |
| `bash-safety-validator.sh` | PreToolUse | Bash | Blocks destructive commands (`rm -rf /`, fork bombs, `dd if=`) and credential exposure (`cat .env`, `echo $API_KEY`) |
| `protect-critical-files.sh` | PreToolUse | Edit, Write | Blocks writes to `.env`, `secrets/`, `credentials`, SSH keys, lock files |
| `helm-deploy-validator.sh` | PreToolUse | Bash | Warns on `helm install/upgrade` without `--set image.tag=`, `--atomic`, or `--wait` |
| `post-edit-lint.sh` | PostToolUse | Edit, Write | Auto-runs ESLint (`--fix`) on TS/JS, Black on Python, `jq` format on JSON after edits |
| `docker-build-tracker.sh` | PostToolUse | Bash | Appends a JSONL record to `.claude/logs/docker-builds.jsonl` for every `docker build`, `docker push`, `az acr build`, and `helm install/upgrade` |
| `subagent-results-log.sh` | SubagentStop | — | Logs subagent completion events to `.claude/logs/subagent-events.jsonl` |
| `teammate-idle-check.sh` | TeammateIdle | — | Blocks teammates from going idle if there are uncommitted changes containing TODO/FIXME comments |
| `task-quality-gate.sh` | TaskCompleted | — | Blocks task completion if there are merge conflicts or TypeScript compilation errors in modified files |
| `lessons-learned-capture.sh` | PostToolUseFailure | — | Appends every tool failure to `rules/lessons-learned.md` with tool name, input, error, and `NEEDS_FIX` status |

Note: the hooks directory contains 11 scripts total (including this README).

## Safety hooks in detail

### bash-safety-validator.sh

Runs before every Bash tool call. Reads the command from the tool input JSON and
checks it against two regex patterns:

```bash
# Blocks: rm -rf /, rm -rf ~, dd if=, mkfs., fork bomb
if echo "$COMMAND" | grep -qE '(rm -rf /|rm -rf ~|> /dev/sd|mkfs\.|dd if=|:(){ :|fork bomb)'; then
  echo "BLOCKED: Destructive system command detected" >&2
  exit 2
fi

# Blocks: cat .env, echo $API_KEY, echo $SECRET, etc.
if echo "$COMMAND" | grep -qE '(cat.*\.env|echo.*API_KEY|echo.*SECRET|echo.*PASSWORD|echo.*TOKEN)'; then
  echo "BLOCKED: Potential credential exposure" >&2
  exit 2
fi
```

Exit code `2` causes Claude Code to abort the tool call and report the block message.

### protect-critical-files.sh

Runs before every Edit and Write tool call. Checks the `file_path` parameter against
a list of protected path patterns:

```bash
PROTECTED_PATTERNS=(".env" ".env." "secrets/" "credentials" "id_rsa" "id_ed25519" ".pem" "package-lock.json" "pnpm-lock.yaml")
```

Any file path matching one of these patterns is blocked. This prevents accidental
overwriting of lock files and secrets, even if Claude generates a write command for
them.

## Self-healing loop

The `lessons-learned-capture.sh` hook is the entry point for the self-healing system:

```
Tool call fails (PostToolUseFailure event)
      │
      ▼
lessons-learned-capture.sh reads: tool_name, error, tool_input
      │
      ▼
Appends to .claude/rules/lessons-learned.md:
  ### Error: <tool> failure (<timestamp>)
  - Tool: <tool_name>
  - Input: `<command_or_file_path>`
  - Error: <error_message>
  - Status: NEEDS_FIX
      │
      ▼
Returns JSON context to Claude:
  "Error captured in lessons-learned.md.
   After fixing this issue, update the lesson entry with the solution."
      │
      ▼
Claude fixes the issue and updates the entry to RESOLVED
with a Fix and Prevention note.
      │
      ▼
lessons-learned.md is loaded as a rule on the next session start.
Claude does not repeat the mistake.
```

## Quality gate hooks

**`task-quality-gate.sh`** (TaskCompleted): Prevents task completion if:
- `git diff --check` finds merge conflict markers
- Modified TypeScript files fail `npx tsc --noEmit`

This ensures Claude does not mark a task done while leaving the codebase in a broken
state.

**`helm-deploy-validator.sh`** (PreToolUse on Bash): Does not block, but emits
warnings to stderr for Claude to see when a `helm install/upgrade` command is
missing recommended safety flags. Claude reads stderr and typically adds the missing
flags before proceeding.

## Build tracking

**`docker-build-tracker.sh`** logs every Docker and Helm operation to a JSONL file
at `.claude/logs/docker-builds.jsonl`. The `deploy-intelligence` MCP server reads
this file to provide build history queries, detect stale images in Kubernetes, and
generate deployment audit reports.

## Hook configuration

Hooks are registered in `.claude/settings.json` under the `hooks` key. Each entry
specifies the event type, an optional tool matcher, and the script path. Scripts must
be executable (`chmod +x`).

To disable a hook temporarily, remove its execute permission:

```bash
chmod -x .claude/hooks/hook-name.sh
```

To debug a hook, add `set -x` to the script to print each command as it runs.

## Creating a new hook

```bash
#!/bin/bash
# Brief description of what this hook does and why.
#
# Event: PreToolUse | PostToolUse | PostToolUseFailure | TaskCompleted | SessionStart
# Matcher: Bash | Edit | Write | (blank for all)

INPUT=$(cat)
# Parse fields from INPUT using jq:
# COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
# FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Your logic here.
# Exit 0: allow/proceed
# Exit 2: block with error message written to stderr

exit 0
```

## See also

- [../README.md](../README.md) — Platform overview
- [../rules/README.md](../rules/README.md) — Rules that hooks enforce at runtime
- [../mcp-servers/README.md](../mcp-servers/README.md) — MCP servers that consume hook-generated logs
