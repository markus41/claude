#!/bin/bash
# PostToolUse hook - Audit trail for Azure resource provisioning.
# Logs az resource create/update/delete, az deployment, az group,
# and bicep operations to audit/azure-provisioning.log in JSON-lines format.
set -euo pipefail

# Read tool input from environment variable (standard Claude Code hook convention)
COMMAND="${TOOL_INPUT:-}"

# Only process if we have a command containing az CLI commands
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Match az CLI provisioning commands (skip read-only: list, show, get)
IS_PROVISION=false
if echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+(resource|group|deployment|storage|keyvault|monitor|network|cosmosdb|functionapp|webapp|appservice|sql|redis|servicebus|eventhubs|cognitiveservices)\s+(create|update|delete|set|start|stop|restart)'; then
  IS_PROVISION=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+deployment\s+(group|sub|tenant)\s+(create|validate|what-if)'; then
  IS_PROVISION=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+bicep\s+(build|publish|decompile)'; then
  IS_PROVISION=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+role\s+assignment\s+(create|delete)'; then
  IS_PROVISION=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+keyvault\s+secret\s+(set|delete|purge)'; then
  IS_PROVISION=true
elif echo "$COMMAND" | grep -qE '(^|\s|&&|\|)az\s+tag\s+(create|update|delete)'; then
  IS_PROVISION=true
fi

if [ "$IS_PROVISION" != "true" ]; then
  exit 0
fi

AUDIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/audit"
mkdir -p "$AUDIT_DIR"
LOG_FILE="$AUDIT_DIR/azure-provisioning.log"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TENANT="${AZURE_TENANT_ID:-unknown}"
USER="${USER:-unknown}"
SUBSCRIPTION="${AZURE_SUBSCRIPTION_ID:-unknown}"

# Extract az subcommand group and action
# e.g. "az resource create ..." -> entity=resource, action=create
AZ_FRAGMENT=$(echo "$COMMAND" | grep -oE 'az\s+[a-z-]+(\s+[a-z-]+)?(\s+[a-z-]+)?' | head -1)
ENTITY=$(echo "$AZ_FRAGMENT" | awk '{print $2}')
ACTION=$(echo "$AZ_FRAGMENT" | awk '{print $3}')

# For compound subcommands like "az deployment group create"
SUBENTITY=$(echo "$AZ_FRAGMENT" | awk '{print $4}')
if [ -n "$SUBENTITY" ] && echo "$SUBENTITY" | grep -qE '^(create|update|delete|set|start|stop|validate|what-if|build|publish)$'; then
  ACTION="$SUBENTITY"
elif [ -n "$SUBENTITY" ]; then
  ENTITY="${ENTITY}/${ACTION}"
  ACTION="$SUBENTITY"
fi

ENTITY="${ENTITY:-unknown}"
ACTION="${ACTION:-unknown}"

# Extract resource group if specified
RESOURCE_GROUP="unknown"
if echo "$COMMAND" | grep -qoE -- '(-g|--resource-group)\s+\S+'; then
  RESOURCE_GROUP=$(echo "$COMMAND" | grep -oE -- '(-g|--resource-group)\s+\S+' | head -1 | awk '{print $2}')
fi

# Extract resource name if specified
RESOURCE_NAME="unknown"
if echo "$COMMAND" | grep -qoE -- '(-n|--name)\s+\S+'; then
  RESOURCE_NAME=$(echo "$COMMAND" | grep -oE -- '(-n|--name)\s+\S+' | head -1 | awk '{print $2}')
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
  --arg subscription "$SUBSCRIPTION" \
  --arg resourceGroup "$RESOURCE_GROUP" \
  --arg resourceName "$RESOURCE_NAME" \
  '{timestamp:$ts, command:$cmd, tenant:$tenant, entity:$entity, user:$user, action:$action, subscription:$subscription, resourceGroup:$resourceGroup, resourceName:$resourceName}' \
  >> "$LOG_FILE"

exit 0
