#!/bin/bash
# PreToolUse hook - Adds TAIA-specific safeguards for destructive operations.
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only inspect potentially destructive Azure/Graph patterns.
if ! echo "$COMMAND" | grep -qE 'az (ad user delete|group delete|rest .*DELETE|resource delete)|graph .*delete|pac .*delete'; then
  exit 0
fi

# Require explicit tenant context for TAIA destructive operations.
if [ -z "${TAIA_TENANT_ID:-}" ] || [ -z "${AZURE_TENANT_ID:-}" ]; then
  echo "BLOCKED: TAIA_TENANT_ID and AZURE_TENANT_ID must be set before destructive commands." >&2
  exit 2
fi

if [ "$AZURE_TENANT_ID" != "$TAIA_TENANT_ID" ]; then
  echo "BLOCKED: Destructive command attempted outside TAIA tenant context." >&2
  echo "  AZURE_TENANT_ID=$AZURE_TENANT_ID does not match TAIA_TENANT_ID=$TAIA_TENANT_ID" >&2
  exit 2
fi

# Require intent marker to reduce accidental execution.
if ! echo "$COMMAND" | grep -q -- '--i-understand-taia-winddown'; then
  echo "BLOCKED: Add --i-understand-taia-winddown to confirm intentional destructive action." >&2
  exit 2
fi

exit 0
