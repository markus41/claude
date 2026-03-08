#!/bin/bash
# PostToolUse hook - Audit trail for Microsoft Fabric operations.
# Records workspace, notebook, lakehouse, and pipeline operations
# to audit/fabric-operations.log in JSON-lines format.
set -euo pipefail

# Read tool input from environment variable (standard Claude Code hook convention)
COMMAND="${TOOL_INPUT:-}"

# Only process if we have a command containing Fabric operations
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match Fabric REST API calls or Fabric CLI/script invocations
IS_FABRIC=false
if echo "$COMMAND" | grep -qE 'curl\s.*api\.fabric\.microsoft\.com'; then
  IS_FABRIC=true
elif echo "$COMMAND" | grep -qE 'curl\s.*api\.powerbi\.com'; then
  IS_FABRIC=true
elif echo "$COMMAND" | grep -qE '(provision_fabric|fabric[-_]|onelake)'; then
  IS_FABRIC=true
elif echo "$COMMAND" | grep -qE 'az\s+rest\s.*fabric\.microsoft\.com'; then
  IS_FABRIC=true
fi

if [ "$IS_FABRIC" != "true" ]; then
  exit 0
fi

AUDIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/audit"
mkdir -p "$AUDIT_DIR"
LOG_FILE="$AUDIT_DIR/fabric-operations.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TENANT="${AZURE_TENANT_ID:-unknown}"
USER="${USER:-unknown}"

# Determine the Fabric entity and action
ENTITY="unknown"
ACTION="unknown"

# Detect Fabric REST API endpoints
if echo "$COMMAND" | grep -qE 'api\.fabric\.microsoft\.com|api\.powerbi\.com'; then
  FABRIC_PATH=$(echo "$COMMAND" | grep -oE '(api\.fabric\.microsoft\.com|api\.powerbi\.com)/v[0-9.]*/[a-zA-Z/]+' | head -1 | sed 's|.*v[0-9.]*/||')

  # Identify entity from URL path
  if echo "$FABRIC_PATH" | grep -qiE 'workspaces'; then
    ENTITY="workspace"
  elif echo "$FABRIC_PATH" | grep -qiE 'notebooks'; then
    ENTITY="notebook"
  elif echo "$FABRIC_PATH" | grep -qiE 'lakehouses'; then
    ENTITY="lakehouse"
  elif echo "$FABRIC_PATH" | grep -qiE 'pipelines'; then
    ENTITY="pipeline"
  elif echo "$FABRIC_PATH" | grep -qiE 'datasets|semanticModels'; then
    ENTITY="semanticModel"
  elif echo "$FABRIC_PATH" | grep -qiE 'reports'; then
    ENTITY="report"
  elif echo "$FABRIC_PATH" | grep -qiE 'capacities'; then
    ENTITY="capacity"
  elif echo "$FABRIC_PATH" | grep -qiE 'eventstreams'; then
    ENTITY="eventstream"
  elif echo "$FABRIC_PATH" | grep -qiE 'kqlDatabases'; then
    ENTITY="kqlDatabase"
  else
    ENTITY=$(echo "$FABRIC_PATH" | cut -d'/' -f1)
  fi

  # Detect HTTP method for action
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

  # Refine for pipeline runs
  if echo "$FABRIC_PATH" | grep -qiE 'pipelines.*jobs'; then
    ACTION="run"
  fi
fi

# Detect script-based Fabric operations
if echo "$COMMAND" | grep -qE 'provision_fabric'; then
  ENTITY="workspace"; ACTION="provision"
elif echo "$COMMAND" | grep -qE 'onelake'; then
  ENTITY="onelake"; ACTION="operation"
fi

ACTION="${ACTION:-unknown}"
ENTITY="${ENTITY:-unknown}"

# Extract workspace ID if present in URL
WORKSPACE_ID="unknown"
if echo "$COMMAND" | grep -qoE 'workspaces/[0-9a-f-]+'; then
  WORKSPACE_ID=$(echo "$COMMAND" | grep -oE 'workspaces/[0-9a-f-]+' | head -1 | sed 's|workspaces/||')
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
  --arg workspace "$WORKSPACE_ID" \
  '{timestamp:$ts, command:$cmd, tenant:$tenant, entity:$entity, user:$user, action:$action, workspace:$workspace}' \
  >> "$LOG_FILE"

exit 0
