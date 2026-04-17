---
description: Security-hardened hook script implementations — ready-to-paste templates for security-guard, auto-format, inject-context, session-init, on-stop, and lessons-learned-capture
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Write
  - Bash
---

# Hook Script Library

Six production-ready hook scripts with security hardening. Copy to `.claude/hooks/` and register in `.claude/settings.json`.

## Security Principles Applied

All scripts follow these rules:
- `set -euo pipefail` at the top
- `jq` for JSON (never string concatenation)
- `realpath` for path validation (prevents traversal)
- `flock` for atomic file writes (prevents interleaved concurrent writes)
- Reject filenames starting with `-` (flag injection prevention)
- Hardcoded blocklists only (never source from external files)
- `printf '%s'` for untrusted data, not `echo`

---

## 1. security-guard.sh

Registered on: `PreToolUse` with matcher `Bash`

Blocks hardcoded dangerous commands before Claude executes them. This is defense-in-depth only — use `settings.json` deny list as the primary control.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(head -c 65536)
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision": "approve"}'
  exit 0
fi

TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Hardcoded blocklist — do NOT source from external files
BLOCKED_PATTERNS=(
  "rm -rf /"
  "sudo rm"
  "mkfs"
  "dd if="
  "> /dev/sd"
  "chmod -R 777"
  "curl.*| sh"
  "curl.*| bash"
  "wget.*| sh"
  "wget.*| bash"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if printf '%s' "$TOOL_INPUT" | grep -qF "$pattern"; then
    jq -n --arg p "$pattern" '{"decision":"block","reason":("Blocked dangerous command: "+$p)}'
    exit 0
  fi
done

echo '{"decision": "approve"}'
```

---

## 2. auto-format.sh

Registered on: `PostToolUse` with matcher `Write|Edit`

Runs the appropriate formatter immediately after Claude writes a file. Includes path traversal protection.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Validate: file must exist, be a regular file, be inside project
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

REAL=$(realpath "$FILE" 2>/dev/null) || { echo '{"decision": "approve"}'; exit 0; }
WORKDIR=$(realpath "$PWD")

# Reject paths outside project root (path traversal guard)
if [[ "$REAL" != "$WORKDIR"/* ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Reject filenames starting with dash (flag injection guard)
BASENAME=$(basename "$REAL")
if [[ "$BASENAME" == -* ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Format based on extension
case "$REAL" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.scss|*.md)
    npx prettier --write "$REAL" 2>/dev/null || true ;;
  *.py)
    black "$REAL" 2>/dev/null || ruff format "$REAL" 2>/dev/null || true ;;
  *.rs)
    rustfmt "$REAL" 2>/dev/null || true ;;
  *.go)
    gofmt -w "$REAL" 2>/dev/null || true ;;
  *.sh)
    shfmt -w "$REAL" 2>/dev/null || true ;;
esac

echo '{"decision": "approve"}'
```

---

## 3. inject-context.sh

Registered on: `UserPromptSubmit`

Injects dynamic context (date, branch, uncommitted file count) on every prompt. Claude receives this as additional context before processing.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Inject dynamic context — stdout is added to Claude's context
DATE=$(date '+%Y-%m-%d %H:%M')
BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "no commits")

echo "[Session Context] Date: $DATE | Branch: $BRANCH | Uncommitted: $UNCOMMITTED files | Last commit: $LAST_COMMIT"
echo '{"decision": "approve"}'
```

**How it works:** On `UserPromptSubmit`, stdout is prepended to the user's message as context. Use this for date injection, active branch, workspace state — anything Claude should know before processing each turn.

---

## 4. session-init.sh

Registered on: `SessionStart`

Fires when a session begins or resumes. Outputs status information to stderr (shown as system messages) and checks for stale memory files.

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Session started: $(date '+%Y-%m-%d %H:%M')" >&2
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'no-git')" >&2
echo "Last commit: $(git log --oneline -1 2>/dev/null || echo 'no commits')" >&2

# Warn about stale memory rotation
LESSONS=".claude/rules/lessons-learned.md"
if [ -f "$LESSONS" ]; then
  LINES=$(wc -l < "$LESSONS")
  if [ "$LINES" -gt 200 ]; then
    echo "WARNING: lessons-learned.md has $LINES lines — run /cc-memory --rotate to prune resolved entries" >&2
  fi
fi

echo '{"decision": "approve"}'
```

---

## 5. on-stop.sh

Registered on: `Stop`

Fires when Claude finishes a response turn. Use for reminders, notifications, or light cleanup.

```bash
#!/usr/bin/env bash
set -euo pipefail

# Remind about uncommitted work at end of each turn
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "Reminder: $UNCOMMITTED uncommitted files" >&2
fi

echo '{"decision": "approve"}'
```

---

## 6. lessons-learned-capture.sh

Registered on: `PostToolUseFailure`

The most important hook. Auto-captures every tool failure to `.claude/rules/lessons-learned.md` for the self-healing loop. Uses `flock` for atomic writes and sanitizes inputs to prevent injection.

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=$(head -c 65536)
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision": "approve"}'
  exit 0
fi

TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')
ERROR=$(printf '%s' "$INPUT" | jq -r '.error // ""')

if [ -z "$ERROR" ] || [ "$ERROR" = "null" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Sanitize: strip shell metacharacters to prevent injection
SAFE_TOOL=$(printf '%s' "$TOOL" | head -c 50 | tr -d '`$()\\!"'"'"'')
SAFE_ERROR=$(printf '%s' "$ERROR" | head -c 200 | tr -d '`$()\\!"'"'"'')
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
LESSONS=".claude/rules/lessons-learned.md"

# flock ensures atomic append — prevents interleaved writes if hooks run concurrently
(
  flock -x 200
  printf '\n### Error: %s failure (%s)\n- **Tool:** %s\n- **Error:** %s\n- **Status:** NEEDS_FIX - Claude should document the fix here after resolving\n' \
    "$SAFE_TOOL" "$TIMESTAMP" "$SAFE_TOOL" "$SAFE_ERROR" \
    >> "$LESSONS"
) 200>/tmp/lessons-learned.lock

echo '{"decision": "approve"}'
```

---

## settings.json — Register All Six

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/security-guard.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/auto-format.sh" }]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "*",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/lessons-learned-capture.sh" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/on-stop.sh" }]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/inject-context.sh" }]
      }
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash .claude/hooks/session-init.sh" }]
      }
    ]
  }
}
```

---

## Quick Deploy

```bash
# Create hooks directory
mkdir -p .claude/hooks

# Make all hooks executable after writing
chmod +x .claude/hooks/*.sh

# Verify hook syntax before registering
bash -n .claude/hooks/security-guard.sh && echo "OK"
bash -n .claude/hooks/lessons-learned-capture.sh && echo "OK"
```

## Stack-Specific Additional Hooks

| Detected Stack | Hook | Event | Matcher | Action |
|----------------|------|-------|---------|--------|
| TypeScript | `auto-typecheck.sh` | PostToolUse | `Write\|Edit` | `tsc --noEmit` |
| ESLint | `auto-lint.sh` | PostToolUse | `Write\|Edit` | `eslint --fix` |
| Docker | `no-latest-tag.sh` | PreToolUse | `Bash` | Block `:latest` tags |
| Git | `no-env-commit.sh` | PreToolUse | `Bash` | Block `.env` commits |
| Python (Black) | `auto-format-py.sh` | PostToolUse | `Write\|Edit` | `black` |
| Rust | `auto-clippy.sh` | PostToolUse | `Write\|Edit` | `cargo clippy` |

See `skills/lsp-integration/SKILL.md` for TypeScript, Python, and Rust diagnostics hook implementations.
