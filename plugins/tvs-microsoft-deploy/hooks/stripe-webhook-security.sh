#!/bin/bash
# PreToolUse hook - Validates Stripe webhook configuration and key safety
# Part of tvs-microsoft-deploy plugin
# EXTENDS base Golden Armada stripe-webhook-security.sh with TVS webhook endpoint
# NOTE: Does not replace the base hook; adds TVS portal-specific validations
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Inspect Bash commands and file writes
case "$TOOL_NAME" in
  Bash|Edit|Write) ;;
  *) exit 0 ;;
esac

CONTENT=""
case "$TOOL_NAME" in
  Bash)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    ;;
  Edit)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
    ;;
  Write)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
    ;;
esac

if [ -z "$CONTENT" ]; then
  exit 0
fi

# Only run deeper checks if content involves Stripe or webhook configuration
if ! echo "$CONTENT" | grep -qiE '(stripe|webhook|whsec_)'; then
  exit 0
fi

VIOLATIONS=""

# --- Live key in non-production environment ---
# Block sk_live_ keys when NODE_ENV or ENVIRONMENT is dev/test/staging
CURRENT_ENV="${NODE_ENV:-${ENVIRONMENT:-production}}"
if echo "$CONTENT" | grep -qE 'sk_live_[A-Za-z0-9]{20,}'; then
  if echo "$CURRENT_ENV" | grep -qiE '(dev|test|staging|local)'; then
    VIOLATIONS="${VIOLATIONS}  - Stripe LIVE secret key used in $CURRENT_ENV environment\n"
    VIOLATIONS="${VIOLATIONS}    Use sk_test_ keys for non-production environments\n"
  fi
fi

# --- STRIPE_WEBHOOK_SECRET validation ---
# If configuring a webhook endpoint, verify the secret is set
if echo "$CONTENT" | grep -qiE '(webhook.*endpoint|stripe.*webhook.*create|--webhook-secret)'; then
  if [ -z "${STRIPE_WEBHOOK_SECRET:-}" ]; then
    VIOLATIONS="${VIOLATIONS}  - STRIPE_WEBHOOK_SECRET is not set in environment\n"
    VIOLATIONS="${VIOLATIONS}    Webhook signature verification will fail without it\n"
  fi
fi

# --- TVS Portal webhook URL validation ---
# Ensure webhook URLs match expected TVS broker portal patterns
TVS_WEBHOOK_PATTERNS=(
  "stapp-broker-.*\.azurestaticapps\.net/api/webhooks/stripe"
  "tvs-broker-portal\.trustedvirtual\.solutions/api/webhooks/stripe"
  "localhost:[0-9]+/api/webhooks/stripe"
)

WEBHOOK_URL=$(echo "$CONTENT" | grep -oP 'https?://[^\s"'"'"']+webhook[^\s"'"'"']*' || true)
if [ -n "$WEBHOOK_URL" ]; then
  URL_VALID=false
  for PATTERN in "${TVS_WEBHOOK_PATTERNS[@]}"; do
    if echo "$WEBHOOK_URL" | grep -qE "$PATTERN"; then
      URL_VALID=true
      break
    fi
  done
  if [ "$URL_VALID" = false ]; then
    VIOLATIONS="${VIOLATIONS}  - Webhook URL ($WEBHOOK_URL) does not match known TVS portal endpoints\n"
    VIOLATIONS="${VIOLATIONS}    Expected: stapp-broker-*.azurestaticapps.net/api/webhooks/stripe\n"
    VIOLATIONS="${VIOLATIONS}    Or:       tvs-broker-portal.trustedvirtual.solutions/api/webhooks/stripe\n"
  fi
fi

# --- Stripe CLI webhook forward validation ---
if echo "$CONTENT" | grep -qE 'stripe listen.*--forward-to'; then
  FORWARD_URL=$(echo "$CONTENT" | grep -oP '(?<=--forward-to\s)[^\s]+' || true)
  if [ -n "$FORWARD_URL" ]; then
    if ! echo "$FORWARD_URL" | grep -qE 'localhost:[0-9]+/api/webhooks/stripe'; then
      VIOLATIONS="${VIOLATIONS}  - stripe listen --forward-to URL ($FORWARD_URL) should target /api/webhooks/stripe\n"
    fi
  fi
fi

# --- Webhook secret in code (should be env var reference) ---
if echo "$CONTENT" | grep -qE 'whsec_[A-Za-z0-9]{20,}'; then
  # Already caught by keyvault-secrets-enforcer, but double-check context
  VIOLATIONS="${VIOLATIONS}  - Hardcoded webhook secret (whsec_*) found\n"
  VIOLATIONS="${VIOLATIONS}    Use process.env.STRIPE_WEBHOOK_SECRET or Key Vault reference\n"
fi

# Report results
if [ -n "$VIOLATIONS" ]; then
  echo "BLOCKED: Stripe webhook security violations detected." >&2
  echo "Violations:" >&2
  printf "%b" "$VIOLATIONS" >&2
  echo "Refer to: plugins/tvs-microsoft-deploy/docs/stripe-integration.md" >&2
  exit 2
fi

exit 0
