#!/bin/bash
# PostToolUse hook for Edit|Write - runs linting after file changes
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

# Run appropriate linter based on file type
case "$EXT" in
  ts|tsx|js|jsx)
    if command -v npx &>/dev/null && [ -f "$CLAUDE_PROJECT_DIR/node_modules/.bin/eslint" ]; then
      npx eslint --fix "$FILE_PATH" 2>/dev/null
    fi
    ;;
  py)
    if command -v python3 &>/dev/null; then
      python3 -m black "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
  json)
    if command -v jq &>/dev/null; then
      TMP=$(mktemp)
      if jq . "$FILE_PATH" > "$TMP" 2>/dev/null; then
        mv "$TMP" "$FILE_PATH"
      else
        rm -f "$TMP"
      fi
    fi
    ;;
esac

exit 0
