#!/bin/bash
# PreToolUse hook - blocks destructive operations unless explicitly approved.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ "$TOOL_NAME" != "Bash" ] || [ -z "$COMMAND" ]; then
  exit 0
fi

DESTRUCTIVE_PATTERN='(az[[:space:]].*(delete|purge)|pac[[:space:]].*(solution[[:space:]]+delete|org[[:space:]]+delete)|curl[[:space:]].*-X[[:space:]]*(DELETE|PATCH).*(graph\.microsoft\.com|api\.stripe\.com|firebase)|rm[[:space:]]+-rf[[:space:]]+(plugins/tvs-microsoft-deploy|/prod|/production))'
if echo "$COMMAND" | grep -qiE "$DESTRUCTIVE_PATTERN"; then
  if [ "${ALLOW_DESTRUCTIVE_CALLS:-false}" != "true" ]; then
    echo "BLOCKED: unsafe destructive call detected." >&2
    echo "Set ALLOW_DESTRUCTIVE_CALLS=true only for approved change windows." >&2
    exit 2
  fi
fi

exit 0
