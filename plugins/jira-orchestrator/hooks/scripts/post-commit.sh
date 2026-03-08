#!/usr/bin/env bash
# post-commit.sh - Post-commit Jira sync trigger
set -euo pipefail

COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
# Extract Jira issue key from commit message
ISSUE_KEY=$(echo "$COMMIT_MSG" | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | head -1 || true)

if [ -n "$ISSUE_KEY" ]; then
  echo "Post-commit: Jira issue $ISSUE_KEY referenced"
fi

exit 0
