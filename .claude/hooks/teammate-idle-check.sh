#!/bin/bash
# TeammateIdle hook - prevents teammates from going idle with unclaimed tasks
INPUT=$(cat)
TEAMMATE_NAME=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')

# Check if there are uncommitted changes
if git -C "$CLAUDE_PROJECT_DIR" diff --quiet 2>/dev/null && git -C "$CLAUDE_PROJECT_DIR" diff --staged --quiet 2>/dev/null; then
  exit 0  # No uncommitted changes, OK to go idle
fi

# Check for TODO comments in recently modified files
RECENT_CHANGES=$(git -C "$CLAUDE_PROJECT_DIR" diff --name-only 2>/dev/null)
if [ -n "$RECENT_CHANGES" ]; then
  TODO_COUNT=$(echo "$RECENT_CHANGES" | xargs grep -l "TODO\|FIXME\|HACK" 2>/dev/null | wc -l)
  if [ "$TODO_COUNT" -gt 0 ]; then
    echo "There are $TODO_COUNT files with TODO/FIXME comments in your changes. Please address them before going idle." >&2
    exit 2
  fi
fi

exit 0
