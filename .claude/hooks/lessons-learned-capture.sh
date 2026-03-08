#!/bin/bash
# PostToolUseFailure hook - captures errors for self-learning
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
ERROR=$(echo "$INPUT" | jq -r '.error // "unknown error"')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // .tool_input.file_path // "N/A"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

LESSONS_FILE="$CLAUDE_PROJECT_DIR/.claude/rules/lessons-learned.md"

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

# Provide context back to Claude
echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUseFailure\",\"additionalContext\":\"Error captured in lessons-learned.md. After fixing this issue, update the lesson entry with the solution.\"}}"

exit 0
