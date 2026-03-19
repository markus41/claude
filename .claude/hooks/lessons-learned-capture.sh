#!/bin/bash
# PostToolUseFailure hook - Enhanced error capture with deduplication,
# severity tagging, pattern counting, sanitization, atomic writes,
# and auto-rotation triggers.
#
# Receives JSON on stdin: { tool_name, error, tool_input: { command?, file_path? } }

set -euo pipefail

# --- Read and validate input ---
INPUT=$(head -c 65536)

if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUseFailure","additionalContext":"Hook received invalid JSON input; skipping capture."}}'
  exit 0
fi

# --- Extract fields via jq (safe parsing) ---
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
RAW_ERROR=$(printf '%s' "$INPUT" | jq -r '.error // "unknown error"')
RAW_COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .tool_input.file_path // "N/A"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

# --- Sanitize all inputs to prevent markdown/shell injection ---
# Strip backticks, dollar signs, and control characters; truncate to safe lengths
sanitize() {
  local max_len="${2:-500}"
  printf '%s' "$1" \
    | tr -d '\000-\010\013\014\016-\037' \
    | sed 's/[`$\\]/\\&/g' \
    | head -c "$max_len"
}

TOOL_NAME=$(printf '%s' "$TOOL_NAME" | tr -cd '[:alnum:]._:/-' | head -c 100)
ERROR=$(sanitize "$RAW_ERROR" 500)
COMMAND=$(sanitize "$RAW_COMMAND" 300)

# --- Determine severity based on tool type and error pattern ---
classify_severity() {
  local tool="$1"
  local error="$2"

  # Critical: security-related or data-loss errors
  if printf '%s' "$error" | grep -qiE 'permission denied|EACCES|secret|credential|force push|reset --hard'; then
    echo "critical"
    return
  fi

  # High: tool failures that block workflow
  if printf '%s' "$error" | grep -qiE 'EISDIR|ENOENT|command not found|Module not found|Cannot find module|exit code [1-9]'; then
    echo "high"
    return
  fi

  # Medium: tool-specific known patterns
  case "$tool" in
    Bash)
      if printf '%s' "$error" | grep -qiE 'syntax error|SyntaxError|TypeError|KeyError'; then
        echo "medium"
        return
      fi
      ;;
    Read)
      echo "medium"
      return
      ;;
    mcp__*)
      echo "medium"
      return
      ;;
  esac

  # Low: everything else
  echo "low"
}

SEVERITY=$(classify_severity "$TOOL_NAME" "$RAW_ERROR")

# --- Resolve lessons file path ---
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  LESSONS_FILE="${CLAUDE_PROJECT_DIR}/.claude/rules/lessons-learned.md"
else
  LESSONS_FILE=".claude/rules/lessons-learned.md"
fi

# --- Create file with header if missing ---
if [ ! -f "$LESSONS_FILE" ]; then
  mkdir -p "$(dirname "$LESSONS_FILE")"
  cat > "$LESSONS_FILE" << 'HEADER'
# Lessons Learned - Auto-Captured

This file is automatically updated by hooks when errors occur.
Claude reads this at the start of each session to avoid repeating mistakes.

## Error Patterns and Fixes

HEADER
fi

# --- Deduplication: skip if same tool+error signature in last 10 entries ---
if [ -f "$LESSONS_FILE" ]; then
  # Extract the last ~120 lines (roughly last 10 entries at ~12 lines each)
  RECENT_BLOCK=$(tail -120 "$LESSONS_FILE" 2>/dev/null || true)

  # Check if this tool+error combo already appears recently
  TOOL_MATCH=$(printf '%s' "$RECENT_BLOCK" | grep -c "^- \*\*Tool:\*\* ${TOOL_NAME}$" 2>/dev/null || true)
  ERROR_SHORT=$(printf '%s' "$RAW_ERROR" | head -c 60 | sed 's/[[\.*^$()+?{|]/\\&/g')
  ERROR_MATCH=$(printf '%s' "$RECENT_BLOCK" | grep -c "${ERROR_SHORT}" 2>/dev/null || true)

  if [ "${TOOL_MATCH:-0}" -gt 0 ] && [ "${ERROR_MATCH:-0}" -gt 0 ]; then
    # Duplicate detected — skip writing, still inform Claude
    echo '{"hookSpecificOutput":{"hookEventName":"PostToolUseFailure","additionalContext":"Duplicate error detected (same tool+error in recent entries). Skipped capture. Still fix the issue and update the existing lesson entry."}}'
    exit 0
  fi
fi

# --- Pattern counter: count how many times this tool has errored ---
TOOL_COUNT=0
if [ -f "$LESSONS_FILE" ]; then
  TOOL_COUNT=$(grep -c "^- \*\*Tool:\*\* ${TOOL_NAME}$" "$LESSONS_FILE" 2>/dev/null || true)
fi
SEEN_COUNT=$((TOOL_COUNT + 1))

# --- Atomic write with flock ---
(
  flock -w 5 200 || {
    echo '{"hookSpecificOutput":{"hookEventName":"PostToolUseFailure","additionalContext":"Could not acquire lock for lessons-learned.md. Error not captured."}}'
    exit 0
  }

  cat >> "$LESSONS_FILE" << ENTRY

### Error: ${TOOL_NAME} failure (${TIMESTAMP})
- **Tool:** ${TOOL_NAME}
- **Severity:** ${SEVERITY}
- **Seen:** ${SEEN_COUNT} times
- **Input:** \`${COMMAND}\`
- **Error:** ${ERROR}
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving
ENTRY

  # --- Auto-rotation trigger: warn if file exceeds 300 lines ---
  LINE_COUNT=$(wc -l < "$LESSONS_FILE" 2>/dev/null || echo 0)
  if [ "${LINE_COUNT}" -gt 300 ]; then
    # Check if rotation reminder already exists
    if ! grep -q "ROTATION NEEDED" "$LESSONS_FILE" 2>/dev/null; then
      cat >> "$LESSONS_FILE" << 'ROTATION'

---
> **ROTATION NEEDED**: This file exceeds 300 lines. Claude should:
> 1. Archive RESOLVED entries older than 30 days to `.claude/lessons-archive/`
> 2. Promote patterns (3+ similar) to permanent rules in `.claude/rules/`
> 3. Prune NEEDS_FIX entries older than 14 days with no resolution
---
ROTATION
    fi
  fi

) 200>"${LESSONS_FILE}.lock"

# Clean up lock file
rm -f "${LESSONS_FILE}.lock"

# --- Report back to Claude ---
echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUseFailure\",\"additionalContext\":\"Error captured in lessons-learned.md (severity: ${SEVERITY}, tool seen ${SEEN_COUNT} times). After fixing this issue, update the lesson entry: change Status to RESOLVED, add Fix and Prevention lines.\"}}"

exit 0
