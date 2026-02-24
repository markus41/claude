#!/bin/bash
# Centralized PreToolUse identity policy engine.
set -euo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
ENGINE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK_SCRIPT="$ENGINE_ROOT/scripts/identity_policy_checks.py"

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Read-only commands pass through.
if echo "$COMMAND" | grep -qE '^\s*(az .* (show|list)|pac .* list|jq |cat |echo )'; then
  exit 0
fi

JSON_RESULT=$(python3 "$CHECK_SCRIPT" --json --command "$COMMAND")
DENY_COUNT=$(echo "$JSON_RESULT" | jq '[.findings[] | select(.severity == "deny")] | length')
WARN_COUNT=$(echo "$JSON_RESULT" | jq '[.findings[] | select(.severity == "warn")] | length')

if [ "$WARN_COUNT" -gt 0 ]; then
  echo "IDENTITY POLICY WARNINGS:"
  echo "$JSON_RESULT" | jq -c '.findings[] | select(.severity == "warn")' >&2
fi

if [ "$DENY_COUNT" -gt 0 ]; then
  echo "BLOCKED: identity policy engine denied the operation." >&2
  echo "$JSON_RESULT" | jq -c '.findings[] | select(.severity == "deny")' >&2
  exit 2
fi

# Dynamic command-time checks for tenant/taia operations.
if echo "$COMMAND" | grep -qE 'taia|TAIA'; then
  if [ "${TAIA_WINDDOWN_APPROVED:-false}" != "true" ]; then
    echo "BLOCKED: TAIA operations require TAIA_WINDDOWN_APPROVED=true" >&2
    jq -n --arg policy "taia_winddown" --arg reason "missing TAIA_WINDDOWN_APPROVED=true" \
      '{policy:$policy,severity:"deny",reason:$reason}' >&2
    exit 2
  fi
fi

if echo "$COMMAND" | grep -qE '^\s*(az |pac )'; then
  if [ -z "${AZURE_TENANT_ID:-}" ]; then
    echo "BLOCKED: AZURE_TENANT_ID must be set." >&2
    jq -n '{policy:"tenant_isolation",severity:"deny",reason:"AZURE_TENANT_ID missing"}' >&2
    exit 2
  fi
fi

exit 0
