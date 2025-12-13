#!/bin/bash
# security-scan.sh - Scan HA configuration for security issues

FILE="${1:-}"
CONTENT="${2:-}"

echo "=== Security Scan ==="

ISSUES_FOUND=0

# Function to report issue
report_issue() {
    local severity=$1
    local message=$2
    echo "[$severity] $message"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

# Check for hardcoded secrets
if echo "$CONTENT" | grep -qiE '(password|api_key|token|secret):\s*["\x27]?[a-zA-Z0-9]{8,}'; then
    if ! echo "$CONTENT" | grep -qE '!secret'; then
        report_issue "CRITICAL" "Potential hardcoded secret found. Use !secret reference."
    fi
fi

# Check for exposed webhooks without auth
if echo "$CONTENT" | grep -qiE 'webhook.*:'; then
    if ! echo "$CONTENT" | grep -qiE 'allowed_methods|local_only'; then
        report_issue "HIGH" "Webhook configured without explicit restrictions."
    fi
fi

# Check for shell commands
if echo "$CONTENT" | grep -qiE 'shell_command|command_line'; then
    report_issue "MEDIUM" "Shell command integration detected. Ensure input validation."
fi

# Check for REST commands with external URLs
if echo "$CONTENT" | grep -qiE 'rest_command.*http[s]?://(?!localhost|127\.|192\.168\.|10\.)'; then
    report_issue "MEDIUM" "External REST command detected. Verify endpoint security."
fi

# Check for open media access
if echo "$CONTENT" | grep -qiE 'media_player.*stream|camera.*still_image_url'; then
    report_issue "LOW" "Media streaming configured. Ensure proper access controls."
fi

# Check for debug mode
if echo "$CONTENT" | grep -qiE 'debug:\s*true|log_level:\s*debug'; then
    report_issue "LOW" "Debug logging enabled. Disable in production."
fi

# Summary
echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "No security issues found."
else
    echo "Found $ISSUES_FOUND potential security issue(s)."
    echo "Review and address before deploying."
fi

echo "=== Scan Complete ==="
exit 0
