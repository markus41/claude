#!/usr/bin/env bash
# triage-trigger.sh - Trigger triage analysis after tool use
# Called by PostToolUse hook to detect when triage should be invoked

set -euo pipefail

TOOL_NAME="${1:-}"
TOOL_INPUT="${2:-}"

# Check if the tool output suggests a triage-worthy event
case "$TOOL_NAME" in
  Bash|Read|Grep)
    # Check for error patterns that might need triage
    if echo "$TOOL_INPUT" | grep -qi "error\|failed\|exception"; then
      echo "Triage candidate detected from $TOOL_NAME"
    fi
    ;;
esac

exit 0
