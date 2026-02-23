#!/bin/bash
# TaskCompleted hook - validates task completion quality
INPUT=$(cat)
TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // "unknown task"')

# Check for merge conflicts
if git -C "$CLAUDE_PROJECT_DIR" diff --check 2>/dev/null | grep -q "conflict"; then
  echo "Cannot complete task '$TASK_SUBJECT': merge conflicts detected. Resolve conflicts first." >&2
  exit 2
fi

# Check for syntax errors in recently modified TypeScript files
MODIFIED_TS=$(git -C "$CLAUDE_PROJECT_DIR" diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$')
if [ -n "$MODIFIED_TS" ] && command -v npx &>/dev/null && [ -f "$CLAUDE_PROJECT_DIR/tsconfig.json" ]; then
  if ! npx tsc --noEmit 2>/dev/null; then
    echo "Cannot complete task '$TASK_SUBJECT': TypeScript compilation errors. Fix type errors first." >&2
    exit 2
  fi
fi

exit 0
