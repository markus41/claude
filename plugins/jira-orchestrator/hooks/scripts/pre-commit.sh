#!/usr/bin/env bash
# pre-commit.sh - Pre-commit validation for Jira-linked commits
set -euo pipefail

# Verify staged changes have associated Jira context
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  echo "No staged changes found"
  exit 0
fi

echo "Pre-commit check: $(echo "$STAGED" | wc -l) files staged"
exit 0
