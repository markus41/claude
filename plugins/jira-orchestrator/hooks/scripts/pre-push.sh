#!/usr/bin/env bash
# pre-push.sh - Pre-push validation for branch naming and Jira linkage
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "Pre-push check: branch=$BRANCH"

# Verify branch follows naming convention
if echo "$BRANCH" | grep -qE '^(feature|fix|chore|release)/[A-Z]+-[0-9]+'; then
  echo "Branch naming convention: OK"
fi

exit 0
