---
description: Hook policy engine with 8 installable packs for safety, verification, context recovery, and teammate quality gates
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Hook Policy Engine

Installable hook policy packs for Claude Code. Each pack is a hardened bash script registered in `.claude/settings.json`. Install individually or all at once via `/cc-hooks install`.

---

## 1. Hook Events Reference

| Event | When it fires | stdin payload | stdout expected |
|-------|--------------|---------------|-----------------|
| `PreToolUse` | Before a tool call executes | `{tool_name, tool_input}` | `{"decision":"approve"}` or `{"decision":"block","reason":"..."}` |
| `PostToolUse` | After a tool call completes | `{tool_name, tool_input, tool_response}` | `{"decision":"approve"}` or `{"decision":"block","reason":"..."}` |
| `PostToolUseFailure` | After a tool call errors | `{tool_name, tool_input, error}` | `{"decision":"approve"}` (errors are logged) |
| `Notification` | Claude sends a message | `{message}` | `{"decision":"approve"}` |
| `Stop` | Claude is about to stop (end of turn) | `{stop_reason}` | `{"decision":"approve"}` or `{"decision":"block","reason":"..."}` |
| `UserPromptSubmit` | User submits a prompt | `{prompt}` | `{"decision":"approve"}` or `{"decision":"block","reason":"..."}` |
| `SessionStart` | New session begins | `{session_id}` | `{"decision":"approve"}` |

**stdin format for PreToolUse/PostToolUse:**
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file",
    "content": "..."
  },
  "tool_response": "..."
}
```

All hooks must exit 0. Non-zero exit codes cause the harness to log an error and default to `approve`.

---

## 2. If-Based Filtering (matcher field)

The `matcher` field in `settings.json` is a **regex** matched against `tool_name`. A hook only fires when the regex matches the tool being called.

### Registration structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }
        ]
      }
    ]
  }
}
```

### Common matcher patterns

| Matcher | Fires on |
|---------|----------|
| `"Write\|Edit"` | Write or Edit tool calls only |
| `"Task"` | Task tool calls only (create, update, etc.) |
| `"Compact"` | Compaction events only |
| `"Bash"` | Bash tool calls only |
| `"Write\|Edit\|Bash"` | Write, Edit, or Bash |
| `""` | All tool calls (no filter) |
| `"^(?!Bash)"` | Everything except Bash |

Multiple hooks under the same event+matcher execute in order. If any returns `{"decision":"block"}`, the operation is blocked. All hooks receive the same stdin JSON.

---

## 3. The 8 Packs

### Pack 1: protect-sensitive-files

**Event:** PreToolUse  
**Matcher:** `"Write|Edit"`  
**Purpose:** Blocks writes to sensitive files before they happen.

**settings.json registration:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/protect-sensitive-files.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if [ -z "$FILE" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Resolve to absolute path for reliable matching
RESOLVED=$(realpath -m "$FILE" 2>/dev/null || echo "$FILE")

BLOCKED_PATTERNS=(
  ".env"
  "*.key"
  "*.pem"
  "*.p12"
  "*.pfx"
  "*.crt"
  "*.cer"
  "secrets/"
  "credentials"
  ".aws/credentials"
  ".ssh/id_rsa"
  ".ssh/id_ed25519"
  ".npmrc"
  ".pypirc"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  # Match against both resolved path and basename
  BASENAME=$(basename "$RESOLVED")
  case "$RESOLVED" in
    *"$pattern"*) ;;
    *) case "$BASENAME" in *"$pattern"*) ;; *) continue ;; esac ;;
  esac
  jq -n --arg f "$FILE" \
    '{"decision":"block","reason":("Blocked write to sensitive file: "+$f+" — store secrets in environment variables or a secrets manager, never in source files")}'
  exit 0
done

echo '{"decision":"approve"}'
```

**Example behavior:**
- Write to `.env` → blocked with reason
- Edit to `config/app.ts` → approved
- Write to `secrets/api-key.txt` → blocked

---

### Pack 2: auto-format-after-edit

**Event:** PostToolUse  
**Matcher:** `"Write|Edit"`  
**Purpose:** Runs the appropriate formatter after every file write, keeping code style consistent without manual intervention.

**settings.json registration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/auto-format-after-edit.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/auto-format-after-edit.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Security: reject path traversal outside project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
RESOLVED=$(realpath "$FILE" 2>/dev/null || echo "$FILE")
if [[ "$RESOLVED" != "$PROJECT_ROOT"* ]]; then
  echo '{"decision":"approve"}'
  exit 0
fi

EXT="${FILE##*.}"

case "$EXT" in
  ts|tsx|js|jsx|mjs|cjs)
    if command -v prettier &>/dev/null; then
      prettier --write "$FILE" --log-level warn 2>/dev/null || true
    fi
    if command -v eslint &>/dev/null; then
      eslint --fix "$FILE" --quiet 2>/dev/null || true
    fi
    ;;
  py)
    if command -v black &>/dev/null; then
      black --quiet "$FILE" 2>/dev/null || true
    fi
    if command -v isort &>/dev/null; then
      isort --quiet "$FILE" 2>/dev/null || true
    fi
    ;;
  rs)
    if command -v rustfmt &>/dev/null; then
      rustfmt --edition 2021 "$FILE" 2>/dev/null || true
    fi
    ;;
  go)
    if command -v gofmt &>/dev/null; then
      gofmt -w "$FILE" 2>/dev/null || true
    fi
    ;;
  json)
    if command -v prettier &>/dev/null; then
      prettier --write "$FILE" --parser json --log-level warn 2>/dev/null || true
    fi
    ;;
  md|mdx)
    if command -v prettier &>/dev/null; then
      prettier --write "$FILE" --parser markdown --log-level warn 2>/dev/null || true
    fi
    ;;
  css|scss|less)
    if command -v prettier &>/dev/null; then
      prettier --write "$FILE" --log-level warn 2>/dev/null || true
    fi
    ;;
  *)
    # No formatter for this extension — approve silently
    ;;
esac

echo '{"decision":"approve"}'
```

**Example behavior:**
- Write to `src/components/Button.tsx` → runs prettier then eslint --fix
- Write to `api/handler.py` → runs black then isort
- Write to `lib/parser.rs` → runs rustfmt
- Write to `README.md` → runs prettier with markdown parser

---

### Pack 3: stop-until-tests-pass

**Event:** Stop  
**Matcher:** `""` (all stop events)  
**Purpose:** Prevents Claude from completing a turn if the test suite is currently failing. Forces fix-the-tests-first discipline.

**settings.json registration:**
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/stop-until-tests-pass.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/stop-until-tests-pass.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

# Only run if package.json has a test script
if [ ! -f "package.json" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

TEST_SCRIPT=$(jq -r '.scripts.test // ""' package.json 2>/dev/null || echo "")
if [ -z "$TEST_SCRIPT" ] || [ "$TEST_SCRIPT" = "null" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Skip if no test files exist (new project with stub test script)
TEST_FILE_COUNT=$(find . \( -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" \) \
  -not -path "*/node_modules/*" 2>/dev/null | wc -l || echo 0)
if [ "$TEST_FILE_COUNT" -eq 0 ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Run tests with timeout (120s max)
RESULT=$(timeout 120 npm test --silent 2>&1 || true)

# Count failure indicators (Vitest, Jest, Mocha, and generic patterns)
FAILURES=$(printf '%s' "$RESULT" | grep -cE "FAIL |failed|✗|× |Error:|AssertionError" 2>/dev/null || true)

if [ "$FAILURES" -gt 0 ]; then
  SUMMARY=$(printf '%s' "$RESULT" | tail -10)
  jq -n --arg summary "$SUMMARY" \
    '{"decision":"block","reason":("Tests are failing — fix before completing:\n\n"+$summary)}'
  exit 0
fi

echo '{"decision":"approve"}'
```

**Example behavior:**
- All tests pass → approved, Claude stops normally
- 3 tests fail → blocked, Claude told to fix them first
- No `package.json` → approved (non-Node projects unaffected)
- No test files yet → approved (empty test suites skip)

---

### Pack 4: post-compact-context-restoration

**Event:** PostToolUse  
**Matcher:** `"Compact"`  
**Purpose:** After context compaction, re-injects the active task description from `.claude/active-task.md` so Claude doesn't lose the thread of work in progress.

**settings.json registration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Compact",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/post-compact-context-restoration.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/post-compact-context-restoration.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

TASK_FILE=".claude/active-task.md"

if [ -f "$TASK_FILE" ]; then
  CONTENT=$(cat "$TASK_FILE")
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  printf '\n[CONTEXT RESTORED AFTER COMPACT — %s]\n%s\n[END CONTEXT RESTORATION]\n' \
    "$TIMESTAMP" "$CONTENT" >&2
fi

# Also check for in-progress work notes
NOTES_FILE=".claude/work-in-progress.md"
if [ -f "$NOTES_FILE" ]; then
  NOTES=$(cat "$NOTES_FILE")
  printf '\n[WORK IN PROGRESS]\n%s\n[END WORK IN PROGRESS]\n' "$NOTES" >&2
fi

echo '{"decision":"approve"}'
```

**Workflow:**
To use this pack effectively, maintain `.claude/active-task.md` with the current task description. Update it when starting a new major task:

```markdown
# Active Task

## Goal
Refactor authentication module to use JWT refresh tokens.

## In Progress
- [x] Updated token generation
- [ ] Update token validation middleware
- [ ] Update frontend auth store

## Key Context
- Token endpoint: /api/auth/refresh
- Store: src/stores/authStore.ts
- Middleware: src/middleware/auth.ts
```

After every compaction, this content is printed to stderr, which the harness injects back into context.

---

### Pack 5: direnv-reload-on-cwd-change

**Event:** UserPromptSubmit  
**Matcher:** `""` (all prompts)  
**Purpose:** Ensures environment variables are always current by reloading `.envrc` via `direnv` before processing each prompt. Prevents stale env vars when switching between projects or after `.envrc` changes.

**settings.json registration:**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/direnv-reload-on-cwd-change.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/direnv-reload-on-cwd-change.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

# Only run if direnv is installed and .envrc exists in current or parent dir
if ! command -v direnv &>/dev/null; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Walk up to find .envrc
CUR="$PWD"
ENVRC_FOUND=false
while [ "$CUR" != "/" ]; do
  if [ -f "$CUR/.envrc" ]; then
    ENVRC_FOUND=true
    break
  fi
  CUR=$(dirname "$CUR")
done

if [ "$ENVRC_FOUND" = false ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Allow and export — suppress output unless changed
direnv allow . 2>/dev/null || true
DIRENV_OUT=$(direnv export bash 2>/dev/null || true)

if [ -n "$DIRENV_OUT" ]; then
  printf '[direnv] Environment reloaded from .envrc (%d chars exported)\n' "${#DIRENV_OUT}" >&2
fi

echo '{"decision":"approve"}'
```

**Example behavior:**
- `.envrc` exists → `direnv allow` + export on each prompt
- `direnv` not installed → silently approved
- No `.envrc` anywhere up the tree → silently approved

---

### Pack 6: task-created-governance

**Event:** PreToolUse  
**Matcher:** `"Task"`  
**Purpose:** Enforces minimum quality on task descriptions before subagents are spawned. Prevents "do the thing" tasks with no context, which produce poor agent output.

**settings.json registration:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/task-created-governance.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/task-created-governance.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(cat)
DESCRIPTION=$(printf '%s' "$INPUT" | jq -r '.tool_input.description // ""')
PROMPT=$(printf '%s' "$INPUT" | jq -r '.tool_input.prompt // ""')

# Use whichever field is populated
CONTENT="${DESCRIPTION:-$PROMPT}"

# Strip whitespace for length check
TRIMMED=$(printf '%s' "$CONTENT" | tr -d '[:space:]')

MIN_LENGTH=20

if [ "${#TRIMMED}" -lt "$MIN_LENGTH" ]; then
  jq -n \
    --arg len "${#TRIMMED}" \
    --arg min "$MIN_LENGTH" \
    '{"decision":"block","reason":("Task description is too short ("+$len+" chars, minimum "+$min+"). Add context: what needs to be done, what files are involved, and what success looks like.")}'
  exit 0
fi

# Block obviously vague tasks
VAGUE_PATTERNS=("fix it" "do this" "handle this" "implement it" "make it work")
LOWER=$(printf '%s' "$CONTENT" | tr '[:upper:]' '[:lower:]')
for pattern in "${VAGUE_PATTERNS[@]}"; do
  if [ "$LOWER" = "$pattern" ]; then
    echo '{"decision":"block","reason":"Task description is too vague. Describe the specific change, the files involved, and the expected outcome."}'
    exit 0
  fi
done

echo '{"decision":"approve"}'
```

**Example behavior:**
- Task "fix" → blocked (too short)
- Task "fix it" → blocked (vague pattern)
- Task "Refactor the authentication middleware in src/middleware/auth.ts to use JWT refresh tokens instead of session cookies" → approved

---

### Pack 7: task-completed-quality-gate

**Event:** PostToolUse  
**Matcher:** `"Task"`  
**Purpose:** After a subagent task completes, runs TypeScript type checking to catch type errors introduced by the agent before the turn ends.

**settings.json registration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Task",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/task-completed-quality-gate.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/task-completed-quality-gate.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

# Only run if tsconfig exists
if [ ! -f "tsconfig.json" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Only run if TypeScript is installed
if ! command -v npx &>/dev/null; then
  echo '{"decision":"approve"}'
  exit 0
fi

# Run type check with timeout
TS_RESULT=$(timeout 60 npx tsc --noEmit 2>&1 || true)
TS_ERROR_COUNT=$(printf '%s' "$TS_RESULT" | grep -cE "error TS[0-9]+" 2>/dev/null || true)

if [ "$TS_ERROR_COUNT" -gt 0 ]; then
  # Truncate to first 20 errors for readability
  TS_SUMMARY=$(printf '%s' "$TS_RESULT" | grep -E "error TS[0-9]+" | head -20)
  jq -n \
    --arg count "$TS_ERROR_COUNT" \
    --arg errors "$TS_SUMMARY" \
    '{"decision":"block","reason":($count+" TypeScript error(s) introduced by task — fix before completing:\n\n"+$errors)}'
  exit 0
fi

echo '{"decision":"approve"}'
```

**Example behavior:**
- Agent introduces 3 type errors → blocked, errors listed
- Agent's code is clean → approved
- No `tsconfig.json` → approved (JS-only projects unaffected)
- `tsc` times out after 60s → approved (prevent infinite block)

---

### Pack 8: teammate-idle-enforcement

**Event:** Stop  
**Matcher:** `""` (all stop events)  
**Purpose:** Records each completion timestamp so external monitoring tools can detect when Claude has been idle for extended periods. Pairs with the `loop` skill for automated idle detection.

**settings.json registration:**
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/teammate-idle-enforcement.sh" }]
      }
    ]
  }
}
```

**Script: `.claude/hooks/teammate-idle-enforcement.sh`**
```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +%s)
TIMESTAMP_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
IDLE_LOG="/tmp/claude-last-stop"
IDLE_THRESHOLD_MINUTES=10

# Atomic write using flock
(
  flock -x 200
  printf '%s\n' "$TIMESTAMP" > "$IDLE_LOG"
) 200>"${IDLE_LOG}.lock" 2>/dev/null || printf '%s\n' "$TIMESTAMP" > "$IDLE_LOG"

# Check if previous stop was recorded and calculate idle duration
PREV_STOP_FILE="/tmp/claude-prev-stop"
if [ -f "$PREV_STOP_FILE" ]; then
  PREV_TS=$(cat "$PREV_STOP_FILE" 2>/dev/null || echo 0)
  IDLE_SECONDS=$(( TIMESTAMP - PREV_TS ))
  IDLE_MINUTES=$(( IDLE_SECONDS / 60 ))

  if [ "$IDLE_MINUTES" -ge "$IDLE_THRESHOLD_MINUTES" ]; then
    printf '[teammate-idle] Claude has been idle for %d minutes (since %s)\n' \
      "$IDLE_MINUTES" "$TIMESTAMP_ISO" >&2
  fi
fi

# Update previous stop timestamp
printf '%s\n' "$TIMESTAMP" > "$PREV_STOP_FILE"

echo '{"decision":"approve"}'
```

**Example behavior:**
- Normal completion → records timestamp, approves
- First stop of session → no idle warning
- Next stop 15 minutes later → logs "[teammate-idle] Claude has been idle for 15 minutes"
- `/tmp/claude-last-stop` contains Unix timestamp readable by external tools

**External idle check script:**
```bash
#!/usr/bin/env bash
IDLE_LOG="/tmp/claude-last-stop"
THRESHOLD=600  # 10 minutes in seconds
if [ -f "$IDLE_LOG" ]; then
  LAST=$(cat "$IDLE_LOG")
  NOW=$(date +%s)
  DIFF=$(( NOW - LAST ))
  if [ "$DIFF" -gt "$THRESHOLD" ]; then
    echo "Claude idle for $(( DIFF / 60 )) minutes"
    exit 1
  fi
fi
echo "Active"
```

---

## 4. Composing Packs

Multiple packs stack in `settings.json`. Install order does not matter — all packs under the same event+matcher run in sequence:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/protect-sensitive-files.sh" }
        ]
      },
      {
        "matcher": "Task",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/task-created-governance.sh" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/auto-format-after-edit.sh" }
        ]
      },
      {
        "matcher": "Compact",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/post-compact-context-restoration.sh" }
        ]
      },
      {
        "matcher": "Task",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/task-completed-quality-gate.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/stop-until-tests-pass.sh" },
          { "type": "command", "command": "bash .claude/hooks/teammate-idle-enforcement.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/direnv-reload-on-cwd-change.sh" }
        ]
      }
    ]
  }
}
```

### Execution order within a matcher group

When two hooks share the same event+matcher, they run left-to-right in the `hooks` array. If `stop-until-tests-pass` blocks, `teammate-idle-enforcement` still runs (all hooks get a chance to execute — the block decision is applied after all hooks complete).

### Recommended pack combinations

**Safety-first setup (minimal overhead):**
- `protect-sensitive-files` — always-on PreToolUse guard

**Active development (medium overhead):**
- `protect-sensitive-files`
- `auto-format-after-edit`
- `task-created-governance`

**CI-grade local enforcement (higher overhead):**
- All of the above plus `stop-until-tests-pass` and `task-completed-quality-gate`

**Agent team setup (full pack):**
- `--all` — install everything

---

## 5. Custom Pack Template

Use this template to write a new hook pack from scratch.

### Checklist

- [ ] Script starts with `#!/usr/bin/env bash` and `set -euo pipefail`
- [ ] Reads stdin exactly once into `INPUT=$(cat)` — stdin is a stream, can only be read once
- [ ] Uses `jq -r` to extract fields from `$INPUT` — never string parsing
- [ ] Returns valid JSON to stdout: `{"decision":"approve"}` or `{"decision":"block","reason":"..."}`
- [ ] Uses `jq -n` with `--arg` for constructing output JSON — never string concatenation
- [ ] Validates file paths with `realpath` when path traversal is a risk
- [ ] Uses `flock` for atomic writes to shared files
- [ ] Uses `|| true` after commands that may legitimately fail (grep, find, etc.)
- [ ] Exits 0 in all paths — non-zero exit defaults to `approve` but logs an error
- [ ] Has a graceful "no-op" path for environments where the dependency is absent

### Template

```bash
#!/usr/bin/env bash
# <pack-name>.sh — <one-line description>
# Event:   <PreToolUse|PostToolUse|Stop|UserPromptSubmit|SessionStart>
# Matcher: "<regex|empty-for-all>"
set -euo pipefail

# Read stdin exactly once
INPUT=$(cat)

# --- Prerequisite checks ---
# Exit early if the environment doesn't support this pack
if ! command -v jq &>/dev/null; then
  # jq is required for safe JSON parsing — approve without running
  echo '{"decision":"approve"}'
  exit 0
fi

# --- Extract relevant fields ---
# Adjust field names based on the event type:
#   PreToolUse:  .tool_name, .tool_input.<field>
#   PostToolUse: .tool_name, .tool_input.<field>, .tool_response
#   Stop:        .stop_reason
#   UserPromptSubmit: .prompt
FIELD=$(printf '%s' "$INPUT" | jq -r '.tool_input.some_field // ""')

# --- Guard: skip if irrelevant ---
if [ -z "$FIELD" ]; then
  echo '{"decision":"approve"}'
  exit 0
fi

# --- Main logic ---
if <condition that should block>; then
  # Use jq -n with --arg to safely construct JSON (never string concatenation)
  jq -n --arg reason "Blocked because: $FIELD fails the policy" \
    '{"decision":"block","reason":$reason}'
  exit 0
fi

# Default: approve
echo '{"decision":"approve"}'
```

### Testing your pack

```bash
# Test approve path
echo '{"tool_name":"Write","tool_input":{"file_path":"src/index.ts","content":"..."}}' \
  | bash .claude/hooks/my-pack.sh

# Test block path
echo '{"tool_name":"Write","tool_input":{"file_path":".env","content":"SECRET=abc"}}' \
  | bash .claude/hooks/my-pack.sh

# Validate output is valid JSON
echo '{"tool_name":"Write","tool_input":{"file_path":".env"}}' \
  | bash .claude/hooks/my-pack.sh | jq .
```

### Registering in settings.json

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/my-pack.sh" }
        ]
      }
    ]
  }
}
```

Use `/cc-hooks test .claude/hooks/my-pack.sh` after writing to validate both paths with the built-in harness test runner.
