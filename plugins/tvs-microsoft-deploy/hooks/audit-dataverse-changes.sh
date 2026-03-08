#!/bin/bash
# PostToolUse hook - Audit trail for Dataverse schema modifications.
# Captures pac solution, pac modelbuilder, pac environment, pac table,
# and pac plugin operations to audit/dataverse-changes.log in JSON-lines format.
set -euo pipefail

# Read tool input from environment variable (standard Claude Code hook convention)
COMMAND="${TOOL_INPUT:-}"

# Only process if we have a command containing pac or Dataverse commands
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match pac CLI Dataverse-related subcommands
IS_DATAVERSE=false
if echo "$COMMAND" | grep -qE '(^|\s|&&|\|)pac\s+(solution|modelbuilder|environment|table|plugin|pcf|package)\s'; then
  IS_DATAVERSE=true
elif echo "$COMMAND" | grep -qE 'curl\s.*\.dynamics\.com'; then
  IS_DATAVERSE=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)pac\s+auth\s+(create|select|clear)'; then
  IS_DATAVERSE=true
fi

if [ "$IS_DATAVERSE" != "true" ]; then
  exit 0
fi

AUDIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/audit"
mkdir -p "$AUDIT_DIR"
LOG_FILE="$AUDIT_DIR/dataverse-changes.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TENANT="${AZURE_TENANT_ID:-unknown}"
USER="${USER:-unknown}"

# Extract pac subcommand and action
ENTITY="unknown"
ACTION="unknown"

if echo "$COMMAND" | grep -qE '(^|\s|&&|\|)pac\s'; then
  PAC_FRAGMENT=$(echo "$COMMAND" | grep -oE 'pac\s+[a-z-]+(\s+[a-z-]+)?' | head -1)
  ENTITY=$(echo "$PAC_FRAGMENT" | awk '{print $2}')
  ACTION=$(echo "$PAC_FRAGMENT" | awk '{print $3}')
fi

# Detect Dataverse REST API operations
if echo "$COMMAND" | grep -qE 'curl\s.*\.dynamics\.com'; then
  ENTITY="dataverseApi"
  if echo "$COMMAND" | grep -qE -- '(-X\s*POST|--method\s+post)'; then
    ACTION="create"
  elif echo "$COMMAND" | grep -qE -- '(-X\s*PATCH|--method\s+patch)'; then
    ACTION="update"
  elif echo "$COMMAND" | grep -qE -- '(-X\s*DELETE|--method\s+delete)'; then
    ACTION="delete"
  else
    ACTION="read"
  fi

  # Extract entity set from URL path
  DV_PATH=$(echo "$COMMAND" | grep -oE '\.dynamics\.com/api/data/v[0-9.]+/[a-zA-Z_]+' | head -1 | sed 's|.*v[0-9.]*/||')
  if [ -n "$DV_PATH" ]; then
    ENTITY="dataverse/$DV_PATH"
  fi
fi

ENTITY="${ENTITY:-unknown}"
ACTION="${ACTION:-unknown}"

# Extract environment URL if specified
ENV_URL="unknown"
if echo "$COMMAND" | grep -qoE -- '--environment\s+\S+'; then
  ENV_URL=$(echo "$COMMAND" | grep -oE -- '--environment\s+\S+' | head -1 | awk '{print $2}')
elif echo "$COMMAND" | grep -qoE -- '--env\s+\S+'; then
  ENV_URL=$(echo "$COMMAND" | grep -oE -- '--env\s+\S+' | head -1 | awk '{print $2}')
elif echo "$COMMAND" | grep -qoE -- '--url\s+\S+'; then
  ENV_URL=$(echo "$COMMAND" | grep -oE -- '--url\s+\S+' | head -1 | awk '{print $2}')
fi

# Extract solution name if specified
SOLUTION_NAME="unknown"
if echo "$COMMAND" | grep -qoE -- '--solution-name\s+\S+'; then
  SOLUTION_NAME=$(echo "$COMMAND" | grep -oE -- '--solution-name\s+\S+' | head -1 | awk '{print $2}')
elif echo "$COMMAND" | grep -qoE -- '--name\s+\S+'; then
  SOLUTION_NAME=$(echo "$COMMAND" | grep -oE -- '--name\s+\S+' | head -1 | awk '{print $2}')
fi

# Sanitize the command for JSON
SAFE_COMMAND=$(echo "$COMMAND" | head -c 500 | tr '\n' ' ' | tr '\t' ' ')

jq -nc \
  --arg ts "$TIMESTAMP" \
  --arg cmd "$SAFE_COMMAND" \
  --arg tenant "$TENANT" \
  --arg entity "$ENTITY" \
  --arg user "$USER" \
  --arg action "$ACTION" \
  --arg environment "$ENV_URL" \
  --arg solution "$SOLUTION_NAME" \
  '{timestamp:$ts, command:$cmd, tenant:$tenant, entity:$entity, user:$user, action:$action, environment:$environment, solution:$solution}' \
  >> "$LOG_FILE"

exit 0
