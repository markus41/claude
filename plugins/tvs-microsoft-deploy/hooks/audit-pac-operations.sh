#!/bin/bash
# PostToolUse hook - Audit trail for PAC CLI operations.
# Logs every pac command with timestamp, tenant, environment, and action
# to audit/pac-operations.log in JSON-lines format.
set -euo pipefail

# Read tool input from environment variable (standard Claude Code hook convention)
COMMAND="${TOOL_INPUT:-}"

# Only process if we have a command containing pac invocations
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match pac CLI invocations
if ! echo "$COMMAND" | grep -qE '(^|\s|&&|\|)pac\s'; then
  exit 0
fi

AUDIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/audit"
mkdir -p "$AUDIT_DIR"
LOG_FILE="$AUDIT_DIR/pac-operations.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TENANT="${AZURE_TENANT_ID:-unknown}"
USER="${USER:-unknown}"

# Extract the pac subcommand group and action
# e.g. "pac solution export --path ..." -> entity=solution, action=export
PAC_FRAGMENT=$(echo "$COMMAND" | grep -oE 'pac\s+[a-z-]+(\s+[a-z-]+)?' | head -1)
ENTITY=$(echo "$PAC_FRAGMENT" | awk '{print $2}')
ACTION=$(echo "$PAC_FRAGMENT" | awk '{print $3}')
ENTITY="${ENTITY:-unknown}"
ACTION="${ACTION:-unknown}"

# Extract environment if specified via --environment or --env
ENV_NAME="default"
if echo "$COMMAND" | grep -qoE -- '--environment\s+\S+'; then
  ENV_NAME=$(echo "$COMMAND" | grep -oE -- '--environment\s+\S+' | head -1 | awk '{print $2}')
elif echo "$COMMAND" | grep -qoE -- '--env\s+\S+'; then
  ENV_NAME=$(echo "$COMMAND" | grep -oE -- '--env\s+\S+' | head -1 | awk '{print $2}')
fi

# Sanitize the command for JSON (truncate long commands, escape)
SAFE_COMMAND=$(echo "$COMMAND" | head -c 500 | tr '\n' ' ' | tr '\t' ' ')

jq -nc \
  --arg ts "$TIMESTAMP" \
  --arg cmd "$SAFE_COMMAND" \
  --arg tenant "$TENANT" \
  --arg entity "$ENTITY" \
  --arg user "$USER" \
  --arg action "$ACTION" \
  --arg env "$ENV_NAME" \
  '{timestamp:$ts, command:$cmd, tenant:$tenant, entity:$entity, user:$user, action:$action, environment:$env}' \
  >> "$LOG_FILE"

exit 0
