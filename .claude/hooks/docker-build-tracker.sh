#!/bin/bash
# PostToolUse hook for Bash - tracks docker build/push commands
# Logs build metadata so we can detect stale images in K8s deploys

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ")

LOG_DIR="$CLAUDE_PROJECT_DIR/.claude/logs"
BUILD_LOG="$LOG_DIR/docker-builds.jsonl"
mkdir -p "$LOG_DIR"

# Track docker build commands
if echo "$COMMAND" | grep -qE '^docker build'; then
  IMAGE_TAG=$(echo "$COMMAND" | grep -oE -- '-t\s+\S+' | sed 's/-t\s*//')
  DOCKERFILE=$(echo "$COMMAND" | grep -oE -- '-f\s+\S+' | sed 's/-f\s*//' || echo "Dockerfile")
  NO_CACHE=$(echo "$COMMAND" | grep -q -- '--no-cache' && echo "true" || echo "false")
  BUILD_CONTEXT=$(echo "$COMMAND" | awk '{print $NF}')

  echo "{\"timestamp\":\"$TIMESTAMP\",\"action\":\"build\",\"image\":\"$IMAGE_TAG\",\"dockerfile\":\"$DOCKERFILE\",\"no_cache\":$NO_CACHE,\"context\":\"$BUILD_CONTEXT\",\"command\":\"$COMMAND\"}" >> "$BUILD_LOG"
fi

# Track docker push commands
if echo "$COMMAND" | grep -qE '^docker push'; then
  IMAGE=$(echo "$COMMAND" | awk '{print $3}')
  echo "{\"timestamp\":\"$TIMESTAMP\",\"action\":\"push\",\"image\":\"$IMAGE\",\"command\":\"$COMMAND\"}" >> "$BUILD_LOG"
fi

# Track ACR build commands (az acr build)
if echo "$COMMAND" | grep -qE '^az acr build'; then
  REGISTRY=$(echo "$COMMAND" | grep -oE -- '--registry\s+\S+' | sed 's/--registry\s*//')
  IMAGE_TAG=$(echo "$COMMAND" | grep -oE -- '-t\s+\S+|--image\s+\S+' | sed 's/\(-t\|--image\)\s*//')
  NO_CACHE=$(echo "$COMMAND" | grep -q -- '--no-cache' && echo "true" || echo "false")

  echo "{\"timestamp\":\"$TIMESTAMP\",\"action\":\"acr_build\",\"registry\":\"$REGISTRY\",\"image\":\"$IMAGE_TAG\",\"no_cache\":$NO_CACHE,\"command\":\"$COMMAND\"}" >> "$BUILD_LOG"
fi

# Track helm install/upgrade commands
if echo "$COMMAND" | grep -qE '^helm (install|upgrade)'; then
  RELEASE=$(echo "$COMMAND" | awk '{print $3}')
  CHART=$(echo "$COMMAND" | awk '{print $4}')
  IMAGE_SET=$(echo "$COMMAND" | grep -oE -- '--set\s+image\.[^[:space:]]+' | tr '\n' '|')

  echo "{\"timestamp\":\"$TIMESTAMP\",\"action\":\"helm_deploy\",\"release\":\"$RELEASE\",\"chart\":\"$CHART\",\"image_overrides\":\"$IMAGE_SET\",\"command\":\"$COMMAND\"}" >> "$BUILD_LOG"
fi

exit 0
