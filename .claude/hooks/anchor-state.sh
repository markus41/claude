#!/bin/bash
# anchor-state.sh — Captures critical state before compaction
# Hook: PreCompact
# Saves git state, recent commits, task state, and timestamp
# to .claude/anchored-state.md so context survives /compact.
set -euo pipefail

# Read hook input from stdin (required by hook protocol)
INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_FILE="$PROJECT_DIR/.claude/anchored-state.md"

# Ensure directory exists
mkdir -p "$(dirname "$STATE_FILE")"

{
  echo "## Anchored State ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  echo ""

  # Git branch
  echo "### Git State"
  BRANCH=$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null || echo "unknown")
  echo "- Branch: \`$BRANCH\`"

  # Modified files
  MODIFIED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null || true)
  MOD_COUNT=$(echo "$MODIFIED" | grep -c . 2>/dev/null || echo "0")
  echo "- Modified files: $MOD_COUNT"
  if [ -n "$MODIFIED" ] && [ "$MOD_COUNT" -gt 0 ]; then
    echo '```'
    echo "$MODIFIED" | head -20
    [ "$MOD_COUNT" -gt 20 ] && echo "... and $((MOD_COUNT - 20)) more"
    echo '```'
  fi

  # Staged files
  STAGED=$(git -C "$PROJECT_DIR" diff --cached --name-only 2>/dev/null || true)
  STAGED_COUNT=$(echo "$STAGED" | grep -c . 2>/dev/null || echo "0")
  echo "- Staged files: $STAGED_COUNT"
  if [ -n "$STAGED" ] && [ "$STAGED_COUNT" -gt 0 ]; then
    echo '```'
    echo "$STAGED" | head -20
    echo '```'
  fi
  echo ""

  # Recent commits
  echo "### Last 5 Commits"
  echo '```'
  git -C "$PROJECT_DIR" log --oneline -5 2>/dev/null || echo "(no commits)"
  echo '```'
  echo ""

  # Todo/task state — check for any active todo files
  echo "### Task State"
  if [ -f "$PROJECT_DIR/.claude/orchestration-state.md" ]; then
    echo "Active orchestration state found:"
    head -10 "$PROJECT_DIR/.claude/orchestration-state.md" 2>/dev/null || true
  elif [ -f "$PROJECT_DIR/.claude/handoff-state.md" ]; then
    echo "Active handoff state found:"
    head -10 "$PROJECT_DIR/.claude/handoff-state.md" 2>/dev/null || true
  else
    echo "No active task/orchestration state files found."
  fi
  echo ""

  # Diff stat summary
  echo "### Working Tree Summary"
  echo '```'
  git -C "$PROJECT_DIR" diff --stat 2>/dev/null | tail -5 || echo "(clean)"
  echo '```'

} > "$STATE_FILE" 2>/dev/null

echo "Anchored state saved to .claude/anchored-state.md" >&2
