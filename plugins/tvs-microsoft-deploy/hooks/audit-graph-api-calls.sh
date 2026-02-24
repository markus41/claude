#!/bin/bash
# PostToolUse hook - Audit trail for Microsoft Graph API calls.
# Tracks user creates, license assignments, conditional access changes,
# and other Graph API operations to audit/graph-api.log in JSON-lines format.
set -euo pipefail

# Read tool input from environment variable (standard Claude Code hook convention)
COMMAND="${TOOL_INPUT:-}"

# Only process if we have a command containing Graph API calls
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match curl calls to graph.microsoft.com or az rest --url with graph.microsoft.com
IS_GRAPH=false
if echo "$COMMAND" | grep -qE 'curl\s.*graph\.microsoft\.com'; then
  IS_GRAPH=true
elif echo "$COMMAND" | grep -qE 'az\s+rest\s.*graph\.microsoft\.com'; then
  IS_GRAPH=true
elif echo "$COMMAND" | grep -qE '(az\s+ad\s+user|az\s+ad\s+group|az\s+ad\s+app|az\s+ad\s+sp)'; then
  IS_GRAPH=true
fi

if [ "$IS_GRAPH" != "true" ]; then
  exit 0
fi

AUDIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/audit"
mkdir -p "$AUDIT_DIR"
LOG_FILE="$AUDIT_DIR/graph-api.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TENANT="${AZURE_TENANT_ID:-unknown}"
USER="${USER:-unknown}"

# Determine the Graph entity and action
ENTITY="unknown"
ACTION="unknown"

# Detect az ad CLI operations
if echo "$COMMAND" | grep -qE 'az\s+ad\s+user\s+create'; then
  ENTITY="user"; ACTION="create"
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+user\s+update'; then
  ENTITY="user"; ACTION="update"
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+user\s+delete'; then
  ENTITY="user"; ACTION="delete"
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+user\s+(list|show)'; then
  ENTITY="user"; ACTION="read"
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+group'; then
  ENTITY="group"
  ACTION=$(echo "$COMMAND" | grep -oE 'az\s+ad\s+group\s+[a-z-]+' | awk '{print $4}')
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+app'; then
  ENTITY="application"
  ACTION=$(echo "$COMMAND" | grep -oE 'az\s+ad\s+app\s+[a-z-]+' | awk '{print $4}')
elif echo "$COMMAND" | grep -qE 'az\s+ad\s+sp'; then
  ENTITY="servicePrincipal"
  ACTION=$(echo "$COMMAND" | grep -oE 'az\s+ad\s+sp\s+[a-z-]+' | awk '{print $4}')
fi

# Detect Graph REST API endpoints from curl/az rest
if echo "$COMMAND" | grep -qE 'graph\.microsoft\.com'; then
  GRAPH_PATH=$(echo "$COMMAND" | grep -oE 'graph\.microsoft\.com/[v0-9.]*/[a-zA-Z/]+' | head -1 | sed 's|graph\.microsoft\.com/[v0-9.]*/||')
  if [ -n "$GRAPH_PATH" ]; then
    ENTITY=$(echo "$GRAPH_PATH" | cut -d'/' -f1)
  fi
  # Detect HTTP method
  if echo "$COMMAND" | grep -qE -- '(-X\s*POST|--method\s+post)'; then
    ACTION="create"
  elif echo "$COMMAND" | grep -qE -- '(-X\s*PATCH|--method\s+patch)'; then
    ACTION="update"
  elif echo "$COMMAND" | grep -qE -- '(-X\s*DELETE|--method\s+delete)'; then
    ACTION="delete"
  elif echo "$COMMAND" | grep -qE -- '(-X\s*PUT|--method\s+put)'; then
    ACTION="replace"
  else
    ACTION="read"
  fi

  # Refine entity for well-known Graph paths
  if echo "$GRAPH_PATH" | grep -qE 'assignLicense'; then
    ENTITY="licenseAssignment"; ACTION="assign"
  elif echo "$GRAPH_PATH" | grep -qE 'conditionalAccess'; then
    ENTITY="conditionalAccessPolicy"
  elif echo "$GRAPH_PATH" | grep -qE 'subscribedSkus'; then
    ENTITY="subscribedSkus"; ACTION="read"
  fi
fi

ACTION="${ACTION:-unknown}"
ENTITY="${ENTITY:-unknown}"

# Sanitize the command for JSON
SAFE_COMMAND=$(echo "$COMMAND" | head -c 500 | tr '\n' ' ' | tr '\t' ' ')

jq -nc \
  --arg ts "$TIMESTAMP" \
  --arg cmd "$SAFE_COMMAND" \
  --arg tenant "$TENANT" \
  --arg entity "$ENTITY" \
  --arg user "$USER" \
  --arg action "$ACTION" \
  '{timestamp:$ts, command:$cmd, tenant:$tenant, entity:$entity, user:$user, action:$action}' \
  >> "$LOG_FILE"

exit 0
