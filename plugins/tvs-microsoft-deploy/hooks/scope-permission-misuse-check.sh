#!/bin/bash
# PreToolUse hook - blocks broad scope/permission escalation patterns.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ "$TOOL_NAME" != "Bash" ] || [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qiE '(Directory\.ReadWrite\.All|RoleManagement\.ReadWrite\.Directory|User\.ReadWrite\.All|Application\.ReadWrite\.All|--allow-no-subscriptions|--consent-type\s+AllPrincipals)'; then
  if [ "${ALLOW_HIGH_PRIVILEGE_SCOPES:-false}" != "true" ]; then
    echo "BLOCKED: potential scope/permission misuse detected." >&2
    echo "Set ALLOW_HIGH_PRIVILEGE_SCOPES=true only with CAB approval evidence." >&2
    exit 2
  fi
fi

exit 0
