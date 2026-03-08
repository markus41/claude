#!/bin/bash
# PreToolUse hook for Edit|Write - protects critical files
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED_PATTERNS=(".env" ".env." "secrets/" "credentials" "id_rsa" "id_ed25519" ".pem" "package-lock.json" "pnpm-lock.yaml")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: Cannot modify protected file matching pattern '$pattern': $FILE_PATH" >&2
    exit 2
  fi
done

exit 0
