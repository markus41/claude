#!/bin/bash
# PreToolUse hook - Validates tenant isolation for Azure and Power Platform commands
# Part of tvs-microsoft-deploy plugin
# EXTENDS base Golden Armada tenant-isolation-validator.sh with Rosa-specific tenant IDs
# NOTE: Does not replace the base hook; adds Rosa Holdings entity-level isolation checks
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only inspect Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check az and pac commands
if ! echo "$COMMAND" | grep -qE '^\s*(az |pac )'; then
  exit 0
fi

# Rosa Holdings entity tenant IDs (from identity-agent entity tenant map)
# These must be set in the environment; we validate they are not cross-contaminated
KNOWN_TENANTS=(
  "TVS_TENANT_ID"
  "CONSULTING_TENANT_ID"
  "TAIA_TENANT_ID"
  "MEDIA_TENANT_ID"
)

# --- Azure CLI tenant isolation ---
if echo "$COMMAND" | grep -qE '^\s*az '; then

  # Check AZURE_TENANT_ID is set
  if [ -z "${AZURE_TENANT_ID:-}" ]; then
    echo "BLOCKED: AZURE_TENANT_ID is not set. Set it before running az commands." >&2
    echo "  export AZURE_TENANT_ID=<your-target-tenant-id>" >&2
    exit 2
  fi

  # If command explicitly specifies --tenant, verify it matches AZURE_TENANT_ID
  EXPLICIT_TENANT=$(echo "$COMMAND" | grep -oP '(?<=--tenant\s)[^\s]+' || true)
  if [ -n "$EXPLICIT_TENANT" ] && [ "$EXPLICIT_TENANT" != "$AZURE_TENANT_ID" ]; then
    echo "BLOCKED: --tenant flag ($EXPLICIT_TENANT) does not match AZURE_TENANT_ID ($AZURE_TENANT_ID)." >&2
    echo "  This could cause cross-tenant contamination." >&2
    exit 2
  fi

  # Validate subscription targeting: if --subscription is used, warn if env mismatch
  EXPLICIT_SUB=$(echo "$COMMAND" | grep -oP '(?<=--subscription\s)[^\s]+' || true)
  if [ -n "$EXPLICIT_SUB" ] && [ -n "${AZURE_SUBSCRIPTION_ID:-}" ]; then
    if [ "$EXPLICIT_SUB" != "$AZURE_SUBSCRIPTION_ID" ]; then
      echo "WARNING: --subscription ($EXPLICIT_SUB) differs from AZURE_SUBSCRIPTION_ID ($AZURE_SUBSCRIPTION_ID)." >&2
      echo "  Verify you are targeting the correct entity subscription." >&2
    fi
  fi

  # Cross-contamination check: ensure no two Rosa tenant IDs are identical
  SEEN_IDS=()
  for VAR_NAME in "${KNOWN_TENANTS[@]}"; do
    VAL="${!VAR_NAME:-}"
    if [ -z "$VAL" ]; then
      continue
    fi
    for SEEN in "${SEEN_IDS[@]}"; do
      if [ "$VAL" = "$SEEN" ]; then
        echo "BLOCKED: Tenant ID collision detected. $VAR_NAME shares the same ID as another entity." >&2
        echo "  Each Rosa entity must have a unique tenant ID. Check your environment variables." >&2
        exit 2
      fi
    done
    SEEN_IDS+=("$VAL")
  done
fi

# --- Power Platform CLI tenant isolation ---
if echo "$COMMAND" | grep -qE '^\s*pac '; then

  # Validate pac commands that target a Dataverse environment URL
  ENV_URL=$(echo "$COMMAND" | grep -oP '(?<=--environment\s)[^\s]+' || true)
  if [ -n "$ENV_URL" ]; then
    # Verify URL matches known Rosa Dataverse environments
    if ! echo "$ENV_URL" | grep -qE '(tvs-(prod|dev|test)|consulting-(prod|dev))\.crm[0-9]*\.dynamics\.com'; then
      echo "WARNING: Dataverse environment URL ($ENV_URL) does not match known Rosa environments." >&2
      echo "  Expected patterns: tvs-{prod|dev|test}.crm8.dynamics.com or consulting-{prod|dev}.crm.dynamics.com" >&2
    fi

    # Block if TVS tenant ID is set but targeting consulting env (or vice versa)
    if [ -n "${TVS_TENANT_ID:-}" ] && [ "$AZURE_TENANT_ID" = "$TVS_TENANT_ID" ]; then
      if echo "$ENV_URL" | grep -qE 'consulting-'; then
        echo "BLOCKED: Active tenant is TVS but targeting Consulting Dataverse environment." >&2
        echo "  Switch tenant context before targeting cross-entity environments." >&2
        exit 2
      fi
    fi
    if [ -n "${CONSULTING_TENANT_ID:-}" ] && [ "$AZURE_TENANT_ID" = "$CONSULTING_TENANT_ID" ]; then
      if echo "$ENV_URL" | grep -qE 'tvs-'; then
        echo "BLOCKED: Active tenant is Consulting but targeting TVS Dataverse environment." >&2
        echo "  Switch tenant context before targeting cross-entity environments." >&2
        exit 2
      fi
    fi
  fi

  # Validate --tenant flag on pac auth create
  if echo "$COMMAND" | grep -qE 'pac auth create'; then
    PAC_TENANT=$(echo "$COMMAND" | grep -oP '(?<=--tenant\s)[^\s]+' || true)
    if [ -n "$PAC_TENANT" ] && [ -n "${AZURE_TENANT_ID:-}" ]; then
      if [ "$PAC_TENANT" != "$AZURE_TENANT_ID" ] && [ "$PAC_TENANT" != "rosa-holdings.onmicrosoft.com" ]; then
        echo "BLOCKED: pac auth --tenant ($PAC_TENANT) does not match AZURE_TENANT_ID ($AZURE_TENANT_ID)." >&2
        exit 2
      fi
    fi
  fi
fi

exit 0
