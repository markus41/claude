#!/usr/bin/env bash
# post-merge.sh - Post-merge Jira transition trigger
set -euo pipefail

echo "Post-merge: checking for Jira transitions"

# Get merged commits
MERGED_ISSUES=$(git log ORIG_HEAD..HEAD --pretty=%B 2>/dev/null | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | sort -u || true)

if [ -n "$MERGED_ISSUES" ]; then
  echo "Issues merged: $MERGED_ISSUES"
fi

exit 0
