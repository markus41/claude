#!/usr/bin/env bash
# seed_keyvault.sh - Seed Azure Key Vault secrets from environment variables
#
# Reads expected variables from .env.template comments and stores each
# one in the kv-tvs-holdings Key Vault using Azure CLI.
#
# Usage: ./seed_keyvault.sh [--vault-name VAULT] [--dry-run]
#
# Prerequisites:
#   - Azure CLI installed and authenticated (az login)
#   - Appropriate Key Vault access policies or RBAC assigned

set -euo pipefail

VAULT_NAME="kv-tvs-holdings"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --vault-name) VAULT_NAME="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Expected secrets derived from .env.template
SECRETS=(
    "FABRIC-TOKEN:FABRIC_TOKEN"
    "FABRIC-CAPACITY-ID:FABRIC_CAPACITY_ID"
    "GRAPH-TOKEN:GRAPH_TOKEN"
    "TVS-DATAVERSE-ENV-URL:TVS_DATAVERSE_ENV_URL"
    "CONSULTING-DATAVERSE-ENV-URL:CONSULTING_DATAVERSE_ENV_URL"
    "STRIPE-SECRET-KEY:STRIPE_SECRET_KEY"
    "STRIPE-WEBHOOK-SECRET:STRIPE_WEBHOOK_SECRET"
    "FIREBASE-PROJECT-ID:FIREBASE_PROJECT_ID"
    "FIREBASE-SERVICE-ACCOUNT:FIREBASE_SERVICE_ACCOUNT"
    "PAYLOCITY-CLIENT-ID:PAYLOCITY_CLIENT_ID"
    "PAYLOCITY-CLIENT-SECRET:PAYLOCITY_CLIENT_SECRET"
    "PAYLOCITY-COMPANY-ID:PAYLOCITY_COMPANY_ID"
    "FLOW-ENVIRONMENT-ID:FLOW_ENVIRONMENT_ID"
    "APPINSIGHTS-CONNECTION-STRING:APPINSIGHTS_CONNECTION_STRING"
)

echo "=== Seeding Key Vault: ${VAULT_NAME} ==="
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

for entry in "${SECRETS[@]}"; do
    KV_NAME="${entry%%:*}"
    ENV_VAR="${entry##*:}"
    VALUE="${!ENV_VAR:-}"

    if [[ -z "$VALUE" ]]; then
        echo "  SKIP: ${KV_NAME} (${ENV_VAR} not set)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  DRY-RUN: Would set ${KV_NAME} from ${ENV_VAR}"
        SUCCESS=$((SUCCESS + 1))
        continue
    fi

    if az keyvault secret set \
        --vault-name "${VAULT_NAME}" \
        --name "${KV_NAME}" \
        --value "${VALUE}" \
        --output none 2>/dev/null; then
        echo "  OK: ${KV_NAME}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL: ${KV_NAME}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "=== Summary ==="
echo "  Stored:  ${SUCCESS}"
echo "  Skipped: ${SKIPPED}"
echo "  Failed:  ${FAILED}"

if [[ "$FAILED" -gt 0 ]]; then
    exit 1
fi
