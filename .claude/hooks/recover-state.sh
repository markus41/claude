#!/bin/bash
# recover-state.sh — Reminds about anchored state after compaction
# Hook: PostCompact / SessionStart (compact matcher)
# Checks for .claude/anchored-state.md and outputs a reminder
# with a preview of the saved state.
set -euo pipefail

# Read hook input from stdin (required by hook protocol)
INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_FILE="$PROJECT_DIR/.claude/anchored-state.md"

if [ -f "$STATE_FILE" ]; then
  # Build a preview from the first 10 lines
  PREVIEW=$(head -10 "$STATE_FILE" 2>/dev/null || echo "(could not read)")

  # Escape for JSON: backslashes, quotes, newlines
  PREVIEW_ESCAPED=$(echo "$PREVIEW" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read())[1:-1])" 2>/dev/null || echo "")

  # Output hookSpecificOutput JSON so Claude sees the reminder
  printf '{"hookSpecificOutput": "CONTEXT RECOVERED: Anchored state exists at .claude/anchored-state.md. Read it to restore pre-compaction context.\\n\\nPreview:\\n%s"}\n' "$PREVIEW_ESCAPED"
else
  # No state file — nothing to recover
  printf '{"hookSpecificOutput": "No anchored state file found. This is a fresh session or state was not captured before compaction."}\n'
fi
