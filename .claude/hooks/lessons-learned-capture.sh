#!/usr/bin/env bash
#
# PostToolUseFailure hook — captures tool failures for self-learning.
#
# SCOPING: historically this hook captured *every* non-zero exit from every
# tool, which polluted lessons-learned.md with ~170 entries that were never
# actual incidents — tsc-exit-2 during normal refactors (tsc's way of saying
# "there are type errors" not "the tool broke"), grep-exit-1 on zero matches
# (grep's normal "no match" signal), WebFetch 404s on crawler-style URLs.
#
# This hook now filters those false-positives before appending. See the
# graduation report at .claude/reports/cc-memory-graduate-2026-04-17.md for
# the diagnosis. Keep the filter list narrow — anything genuinely suspicious
# should still land in lessons-learned.

set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // "unknown"')
ERROR=$(printf '%s' "$INPUT" | jq -r '.error // "unknown error"')
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // .tool_input.file_path // "N/A"')
URL=$(printf '%s' "$INPUT" | jq -r '.tool_input.url // .tool_input.prompt // ""')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

LESSONS_FILE="${CLAUDE_PROJECT_DIR}/.claude/rules/lessons-learned.md"

# --- Scope filters ----------------------------------------------------------
#
# Return 0 (skip capture) for the known false-positive classes documented in
# the graduation report. These are normal tool-output signals, not incidents.

should_skip() {
  local tool="$1" command="$2" error="$3" url="$4"

  # 1) Bash running `tsc` / `tsc --noEmit` exiting 2 while emitting structured
  #    TypeScript errors. Exit-2 is "there are errors", not "tsc broke".
  if [ "$tool" = "Bash" ]; then
    if printf '%s' "$command" | grep -qE '(^|[[:space:]/])(npx[[:space:]]+)?tsc( |$)'; then
      if printf '%s' "$error" | grep -qE 'error TS[0-9]+:|Cannot find (module|name)'; then
        return 0
      fi
      if printf '%s' "$error" | grep -qE '^Exit code 2'; then
        return 0
      fi
    fi

    # 2) Bash running `grep` / `rg` that exited 1 (= zero matches). Normal.
    if printf '%s' "$command" | grep -qE '(^|[[:space:]|&;])grep( |$)|(^|[[:space:]|&;])rg( |$)'; then
      if printf '%s' "$error" | grep -qE '^Exit code 1\b'; then
        return 0
      fi
    fi

    # 3) Bash pipelines whose only signal is "no matches" — e.g. `head` on an
    #    empty stream piped from grep that found nothing.
    if printf '%s' "$error" | grep -qE '^Exit code 1\b' && printf '%s' "$command" | grep -qE '\|[[:space:]]*grep\b|\|[[:space:]]*rg\b'; then
      return 0
    fi

    # 4) pnpm test / vitest exit-1 with "Tests failed" is an iteration signal
    #    (red → fix → green). Only capture if it's a module-missing class.
    if printf '%s' "$command" | grep -qE '(^|[[:space:]])(pnpm|npm)[[:space:]]+(run[[:space:]]+)?(test|vitest)\b'; then
      if printf '%s' "$error" | grep -qE 'Test failed|Tests failed|ELIFECYCLE'; then
        return 0
      fi
    fi
  fi

  # 5) WebFetch 4xx on URLs that are known-external documentation crawl
  #    targets (docs sites routinely have stale links). Capture 5xx and auth
  #    errors — they suggest a real problem.
  if [ "$tool" = "WebFetch" ]; then
    if printf '%s' "$error" | grep -qE 'status code (40[0-4]|410)'; then
      return 0
    fi
    if printf '%s' "$error" | grep -qE 'Maximum number of redirects exceeded'; then
      # Capture on first hit; likely a config issue worth noting. But do not
      # re-capture the same redirect-loop repeatedly. Since we cannot dedupe
      # statelessly, skip it.
      return 0
    fi
  fi

  # 6) Firecrawl redirect-loops — same reasoning as WebFetch.
  if [ "$tool" = "mcp__firecrawl__firecrawl_scrape" ] || [ "$tool" = "mcp__firecrawl__firecrawl_search" ]; then
    if printf '%s' "$error" | grep -qE 'Maximum number of redirects exceeded|status code 40[0-4]'; then
      return 0
    fi
  fi

  # 7) Read on a path that doesn't exist is a normal negative-lookup — the
  #    tool is literally designed to report this.
  if [ "$tool" = "Read" ]; then
    if printf '%s' "$error" | grep -qE 'File does not exist\.|EISDIR: illegal operation on a directory'; then
      # Keep capturing EISDIR (it's the one Read-class lesson that actually
      # produced a rule). But not bare "does not exist" — that's a negative
      # lookup, not an incident.
      if printf '%s' "$error" | grep -qE 'File does not exist\.' && ! printf '%s' "$error" | grep -qE 'EISDIR'; then
        return 0
      fi
    fi
  fi

  # 8) Anything with "Prompt is too long" should be captured — it's one of the
  #    classes that already produced a real rule (prompt-budget-preflight).
  #    No skip.

  return 1  # do not skip; capture it
}

if should_skip "$TOOL_NAME" "$COMMAND" "$ERROR" "$URL"; then
  # Filtered out — emit a no-op response and exit. Optionally log the skip at
  # debug level to a separate file so we can audit the filter.
  SKIP_LOG="${CLAUDE_PROJECT_DIR}/.claude/orchestration/telemetry/lessons-capture-skipped.jsonl"
  mkdir -p "$(dirname "$SKIP_LOG")" 2>/dev/null || true
  printf '{"ts":"%s","tool":%s,"reason":"filtered"}\n' \
    "$TIMESTAMP" \
    "$(printf '%s' "$TOOL_NAME" | jq -Rs .)" \
    >> "$SKIP_LOG" 2>/dev/null || true
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUseFailure","additionalContext":""}}'
  exit 0
fi

# --- Capture ----------------------------------------------------------------

# Create the file with header if it doesn't exist
if [ ! -f "$LESSONS_FILE" ]; then
  mkdir -p "$(dirname "$LESSONS_FILE")"
  cat > "$LESSONS_FILE" << 'HEADER'
# Lessons Learned - Auto-Captured

This file is automatically updated by hooks when errors occur.
Claude reads this at the start of each session to avoid repeating mistakes.

## Error Patterns and Fixes

HEADER
fi

# Append the lesson
cat >> "$LESSONS_FILE" << LESSON

### Error: $TOOL_NAME failure ($TIMESTAMP)
- **Tool:** $TOOL_NAME
- **Input:** \`$COMMAND\`
- **Error:** $ERROR
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving
LESSON

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUseFailure\",\"additionalContext\":\"Error captured in lessons-learned.md. After fixing this issue, update the lesson entry with the solution.\"}}"

exit 0
