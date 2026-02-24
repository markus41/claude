#!/bin/bash
# PreToolUse hook - Verifies pac auth profile is active before Dataverse operations
# Part of tvs-microsoft-deploy plugin
# NOTE: Works alongside base Golden Armada hooks, does not replace them
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only inspect Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check pac commands (not pac auth commands themselves, to avoid circular blocking)
if ! echo "$COMMAND" | grep -qE '^\s*pac '; then
  exit 0
fi

# Allow pac auth commands through (creating/selecting auth is what we want them to do)
if echo "$COMMAND" | grep -qE '^\s*pac auth (create|select|list|delete|who|clear)'; then
  exit 0
fi

# Dataverse operations that require an active auth profile
DATAVERSE_OPS="solution|env|canvas|pages|copilot-studio|modelbuilder|plugin|connector|admin"
if ! echo "$COMMAND" | grep -qE "^\s*pac ($DATAVERSE_OPS)"; then
  exit 0
fi

# Check if pac is available
if ! command -v pac &>/dev/null; then
  echo "BLOCKED: pac CLI is not installed or not in PATH." >&2
  echo "  Install: https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction" >&2
  exit 2
fi

# Check for active auth profile by running pac auth list
AUTH_OUTPUT=$(pac auth list 2>&1) || true

# Check if there are any auth profiles at all
if echo "$AUTH_OUTPUT" | grep -qE '(No auth profiles|no profiles)'; then
  echo "BLOCKED: No pac auth profiles found. Create one before running Dataverse operations." >&2
  echo "  For TVS:        pac auth create --name tvs-prod --environment \${TVS_DATAVERSE_ENV_URL:-https://tvs-prod.crm8.dynamics.com}" >&2
  echo "  For Consulting: pac auth create --name consulting-prod --environment \${CONSULTING_DATAVERSE_ENV_URL:-https://consulting-prod.crm.dynamics.com}" >&2
  exit 2
fi

# Check if there is an active (starred) profile
if ! echo "$AUTH_OUTPUT" | grep -qE '^\s*\*'; then
  echo "BLOCKED: No active pac auth profile selected." >&2
  echo "  Run: pac auth select --index <N>" >&2
  echo "  Or:  pac auth list   (to see available profiles)" >&2
  exit 2
fi

# Extract active profile details (line with the asterisk)
ACTIVE_LINE=$(echo "$AUTH_OUTPUT" | grep -E '^\s*\*' | head -1)
ACTIVE_ENV=$(echo "$ACTIVE_LINE" | grep -oP 'https://[^\s]+\.dynamics\.com' || true)

# If the command targets a specific environment, verify it matches the active profile
TARGET_ENV=$(echo "$COMMAND" | grep -oP '(?<=--environment\s)[^\s]+' || true)
if [ -n "$TARGET_ENV" ] && [ -n "$ACTIVE_ENV" ]; then
  if [ "$TARGET_ENV" != "$ACTIVE_ENV" ]; then
    echo "WARNING: Target environment ($TARGET_ENV) differs from active pac profile ($ACTIVE_ENV)." >&2
    echo "  The command may fail or target the wrong environment." >&2
    echo "  Consider: pac auth select to switch to the correct profile." >&2
  fi
fi

# Validate active profile matches known Rosa environments
if [ -n "$ACTIVE_ENV" ]; then
  if ! echo "$ACTIVE_ENV" | grep -qE '(tvs-(prod|dev|test)|consulting-(prod|dev))\.crm[0-9]*\.dynamics\.com'; then
    echo "WARNING: Active pac profile environment ($ACTIVE_ENV) is not a known Rosa environment." >&2
    echo "  Known environments: tvs-{prod|dev|test}.crm8.dynamics.com, consulting-{prod|dev}.crm.dynamics.com" >&2
  fi
fi

# For production-targeting commands, add extra caution
if echo "$COMMAND" | grep -qE '(solution import|solution upgrade|env reset|env copy|env delete)'; then
  if echo "$ACTIVE_ENV" | grep -qE '(tvs-prod|consulting-prod)'; then
    echo "CAUTION: You are running a destructive operation against a PRODUCTION environment ($ACTIVE_ENV)." >&2
    echo "  Ensure you have a backup and have tested in dev/test first." >&2
  fi
fi

exit 0
