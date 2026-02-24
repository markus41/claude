#!/bin/bash
# PreToolUse hook - Blocks commits/writes containing hardcoded secrets
# Part of tvs-microsoft-deploy plugin
# NOTE: Works alongside base Golden Armada hooks, does not replace them
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only inspect tools that write content: Edit, Write, Bash (for git commit)
case "$TOOL_NAME" in
  Edit|Write|Bash) ;;
  *) exit 0 ;;
esac

# Extract content to scan based on tool type
CONTENT=""
case "$TOOL_NAME" in
  Edit)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
    ;;
  Write)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
    ;;
  Bash)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    # Only scan bash commands that write files or commit
    if ! echo "$CONTENT" | grep -qE '(git commit|echo.*>|cat.*>|tee |printf.*>)'; then
      exit 0
    fi
    ;;
esac

if [ -z "$CONTENT" ]; then
  exit 0
fi

VIOLATIONS=""

# Stripe keys (sk_live_, sk_test_, whsec_)
if echo "$CONTENT" | grep -qE 'sk_(live|test)_[A-Za-z0-9]{20,}'; then
  VIOLATIONS="${VIOLATIONS}  - Stripe secret key (sk_live_*/sk_test_*)\n"
fi
if echo "$CONTENT" | grep -qE 'whsec_[A-Za-z0-9]{20,}'; then
  VIOLATIONS="${VIOLATIONS}  - Stripe webhook secret (whsec_*)\n"
fi

# AWS access keys
if echo "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
  VIOLATIONS="${VIOLATIONS}  - AWS access key (AKIA*)\n"
fi

# Google API keys
if echo "$CONTENT" | grep -qE 'AIza[0-9A-Za-z_-]{35}'; then
  VIOLATIONS="${VIOLATIONS}  - Google API key (AIza*)\n"
fi

# Azure connection strings (Storage, Service Bus, Cosmos, etc.)
if echo "$CONTENT" | grep -qE 'DefaultEndpointsProtocol=https?;AccountName='; then
  VIOLATIONS="${VIOLATIONS}  - Azure Storage connection string\n"
fi
if echo "$CONTENT" | grep -qE 'AccountKey=[A-Za-z0-9+/=]{40,}'; then
  VIOLATIONS="${VIOLATIONS}  - Azure AccountKey value\n"
fi

# Database connection strings
if echo "$CONTENT" | grep -qE 'Server=tcp:.*\.database\.windows\.net'; then
  VIOLATIONS="${VIOLATIONS}  - Azure SQL connection string\n"
fi
if echo "$CONTENT" | grep -qE 'mongodb(\+srv)?://[^/\s]+:[^@/\s]+@'; then
  VIOLATIONS="${VIOLATIONS}  - MongoDB connection string with credentials\n"
fi
if echo "$CONTENT" | grep -qE 'redis://[^/\s]*:[^@/\s]+@'; then
  VIOLATIONS="${VIOLATIONS}  - Redis connection string with credentials\n"
fi

# Bearer tokens and JWTs
if echo "$CONTENT" | grep -qE 'Bearer [A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'; then
  VIOLATIONS="${VIOLATIONS}  - Bearer JWT token\n"
fi
if echo "$CONTENT" | grep -qE 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'; then
  VIOLATIONS="${VIOLATIONS}  - Raw JWT token (eyJ* pattern)\n"
fi

# Firebase service account JSON key indicators
if echo "$CONTENT" | grep -qE '"type"\s*:\s*"service_account"'; then
  VIOLATIONS="${VIOLATIONS}  - Firebase/GCP service account JSON key\n"
fi
if echo "$CONTENT" | grep -qE '"private_key"\s*:\s*"-----BEGIN'; then
  VIOLATIONS="${VIOLATIONS}  - Private key embedded in JSON\n"
fi

# Generic private keys
if echo "$CONTENT" | grep -qE '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'; then
  VIOLATIONS="${VIOLATIONS}  - Private key (PEM format)\n"
fi

# Report results
if [ -n "$VIOLATIONS" ]; then
  echo "BLOCKED: Hardcoded secrets detected. Use Azure Key Vault references instead." >&2
  echo "Violations found:" >&2
  printf "%b" "$VIOLATIONS" >&2
  echo "Remediation: Store secrets in kv-rosa-holdings and reference via @Microsoft.KeyVault(SecretUri=...)" >&2
  exit 2
fi

exit 0
