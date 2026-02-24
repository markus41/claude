#!/bin/bash
# PreToolUse hook - requires audit metadata for mutating commands.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ "$TOOL_NAME" != "Bash" ] || [ -z "$COMMAND" ]; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '^\s*(az|pac|curl|python3\s+plugins/tvs-microsoft-deploy/scripts/)'; then
  if ! echo "$COMMAND" | grep -qE '(--change-ticket|--run-id|--requested-by|X-Audit-Run-Id|X-Change-Ticket)'; then
    if [ "${ALLOW_MISSING_AUDIT_METADATA:-false}" != "true" ]; then
      echo "BLOCKED: missing audit metadata on mutating/infrastructure command." >&2
      echo "Include --change-ticket/--run-id/--requested-by or required X-Audit-* headers." >&2
      exit 2
    fi
  fi
fi

exit 0
