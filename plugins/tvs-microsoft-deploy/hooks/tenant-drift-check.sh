#!/bin/bash
# PreToolUse hook - blocks tenant drift between configured and active tenant context.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ "$TOOL_NAME" != "Bash" ] || [ -z "$COMMAND" ]; then
  exit 0
fi

if ! echo "$COMMAND" | grep -qE '^\s*(az|pac)\s'; then
  exit 0
fi

TARGET_TENANT=$(echo "$COMMAND" | sed -nE 's/.*--tenant[= ]([^ ]+).*/\1/p' | head -n 1)
EXPECTED_TENANT="${AZURE_TENANT_ID:-}"

if [ -z "$EXPECTED_TENANT" ]; then
  echo "BLOCKED: AZURE_TENANT_ID is required for tenant drift validation." >&2
  exit 2
fi

if [ -n "$TARGET_TENANT" ] && [ "$TARGET_TENANT" != "$EXPECTED_TENANT" ]; then
  echo "BLOCKED: tenant drift detected. command tenant=$TARGET_TENANT expected=$EXPECTED_TENANT" >&2
  exit 2
fi

if [ -n "${DATAVERSE_ENV_ID:-}" ] && echo "$COMMAND" | grep -qE 'pac\s+(solution|org)'; then
  if ! echo "$COMMAND" | grep -q -- "$DATAVERSE_ENV_ID"; then
    echo "BLOCKED: Dataverse environment drift. expected environment $DATAVERSE_ENV_ID" >&2
    exit 2
  fi
fi

exit 0
