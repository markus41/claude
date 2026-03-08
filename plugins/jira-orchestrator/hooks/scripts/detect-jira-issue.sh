#!/usr/bin/env bash
# detect-jira-issue.sh - Detect Jira issue keys in user prompts
# Called by UserPromptSubmit hook to auto-detect issue context

set -euo pipefail

PROMPT="${1:-}"

# Match Jira issue keys (e.g., PROJ-123, ABC-456)
if echo "$PROMPT" | grep -qoE '[A-Z][A-Z0-9]+-[0-9]+'; then
  ISSUE_KEY=$(echo "$PROMPT" | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | head -1)
  echo "Detected Jira issue: $ISSUE_KEY"
  exit 0
fi

exit 0
