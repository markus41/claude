#!/bin/bash
# PreToolUse hook for Bash - validates helm deploy commands to prevent stale image issues
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check helm install/upgrade commands
if ! echo "$COMMAND" | grep -qE '^helm (install|upgrade)'; then
  exit 0
fi

WARNINGS=""

# Check 1: Warn if no --set image.tag is specified (likely using chart defaults which may be stale)
if ! echo "$COMMAND" | grep -qE -- '--set\s+image\.tag='; then
  if ! echo "$COMMAND" | grep -qE -- '-f\s+\S+|--values\s+\S+'; then
    WARNINGS="${WARNINGS}WARNING: No image tag override (--set image.tag=) and no values file specified. This may deploy a stale cached image.\n"
  fi
fi

# Check 2: Warn if using :latest tag explicitly (caching risk)
if echo "$COMMAND" | grep -qE 'image\.tag=latest'; then
  WARNINGS="${WARNINGS}WARNING: Using :latest tag is risky. K8s may use cached image instead of pulling the newest. Use a specific tag (git SHA, timestamp, or semver).\n"
fi

# Check 3: Check if --atomic flag is missing (rollback safety)
if ! echo "$COMMAND" | grep -qE -- '--atomic'; then
  WARNINGS="${WARNINGS}NOTE: Consider adding --atomic for automatic rollback on failure.\n"
fi

# Check 4: Check if --wait flag is missing
if ! echo "$COMMAND" | grep -qE -- '--wait'; then
  WARNINGS="${WARNINGS}NOTE: Consider adding --wait to ensure pods are running before marking deploy successful.\n"
fi

# If there are warnings, provide them as feedback but don't block
if [ -n "$WARNINGS" ]; then
  printf "%b" "$WARNINGS" >&2
  # Don't block (exit 0) but the warnings go to stderr for Claude to see
fi

exit 0
