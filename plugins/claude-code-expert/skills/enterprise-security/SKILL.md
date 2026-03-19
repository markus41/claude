---
name: enterprise-security
description: Enterprise-grade security patterns for Claude Code — audit logging, compliance frameworks, secrets management, permission hardening, network security, and managed settings enforcement
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
triggers:
  - enterprise security
  - compliance
  - audit logging
  - soc2
  - secrets management
  - permission hardening
  - managed settings
  - hipaa
  - gdpr
---

# Enterprise Security Patterns for Claude Code

Production-grade security architecture for Claude Code deployments with compliance, audit, and policy enforcement.

## Permission Hardening by Role

### Developer (Restricted Privileges)

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "Bash(npm test)",
      "Bash(npm run dev)",
      "Bash(git status)",
      "Bash(git diff)",
      "Bash(git log)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(chmod 777 *)",
      "Write",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

### Code Reviewer (Read-Heavy)

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git diff *)"
    ],
    "deny": [
      "Write",
      "Edit",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git rebase *)"
    ]
  }
}
```

### Administrator (Full Access with Audit)

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(*)",
      "Agent",
      "WebFetch"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "bash /opt/audit/admin-audit-log.sh"
          }
        ]
      }
    ]
  }
}
```

## Secrets Management

### Preventing Credential Exposure

PreToolUse hook to block access to credential files:

```bash
#!/bin/bash
# name: block-credential-files.sh
# Prevent Claude from reading .env, .pem, .key, .secret files

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name' 2>/dev/null)
PATH_ARG=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# List of blocked patterns
BLOCKED_PATTERNS=(
  '\.env'
  '\.env\..*'
  '\.pem$'
  '\.key$'
  '\.secret$'
  '\.jks$'
  'credentials\.json'
  'service-account\.json'
  'firebase-key\.json'
  '/vault/'
  '/secrets/'
  '/private/'
)

# Check each pattern
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$PATH_ARG" | grep -qE "$pattern"; then
    echo '{
      "decision": "deny",
      "reason": "Access to credential files is blocked",
      "blocked_pattern": "'$pattern'"
    }'
    exit 0
  fi
done

echo '{"decision": "approve"}'
```

### Vault Integration Pattern

For HashiCorp Vault:

```bash
#!/bin/bash
# name: vault-credential-retrieval.sh
# Fetch credentials from Vault instead of storing locally

SECRET_NAME=$1
VAULT_ADDR=${VAULT_ADDR:-"https://vault.internal:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-}

if [ -z "$VAULT_TOKEN" ]; then
  echo '{"error": "VAULT_TOKEN not set"}'
  exit 1
fi

curl -s \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/secret/data/$SECRET_NAME" | jq -r '.data.data'
```

### AWS Secrets Manager Pattern

```bash
#!/bin/bash
# name: aws-secrets-retrieval.sh

SECRET_NAME=$1
REGION=${AWS_REGION:-us-east-1}

aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query 'SecretString' \
  --output text 2>/dev/null
```

### Git Hook to Prevent Secret Commits

```bash
#!/bin/bash
# name: pre-commit-secret-scan.sh
# Placed in .git/hooks/pre-commit

# Patterns that suggest credentials
PATTERNS=(
  'PRIVATE.*KEY'
  'PASSWORD.*='
  'APIKEY'
  'api.key'
  'secret_access_key'
  'aws_secret'
  'postgresql://.*:.*@'
  'mongodb+srv://.*:.*@'
)

EXIT_CODE=0

for file in $(git diff --cached --name-only); do
  for pattern in "${PATTERNS[@]}"; do
    if git diff --cached "$file" | grep -qiE "$pattern"; then
      echo "ERROR: Potential secret detected in $file (pattern: $pattern)"
      EXIT_CODE=1
    fi
  done
done

exit $EXIT_CODE
```

## Audit Logging

### Comprehensive Audit Trail Hook

```bash
#!/bin/bash
# name: audit-trail.sh
# PostToolUse hook: log all tool usage with context

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name' 2>/dev/null)
RESULT=$(echo "$INPUT" | jq -r '.tool_result' 2>/dev/null)
USER=${CLAUDE_USER:-"unknown"}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AUDIT_LOG="/var/log/claude-code/audit.log"

# Truncate output for logging (first 200 chars)
RESULT_SUMMARY=$(echo "$RESULT" | head -c 200)
INPUT_SUMMARY=$(echo "$INPUT" | jq -r '.tool_input | @json' 2>/dev/null | head -c 200)

# Append to audit log with atomic write
{
  flock -x 200
  echo "{
    \"timestamp\": \"$TIMESTAMP\",
    \"user\": \"$USER\",
    \"tool\": \"$TOOL\",
    \"input_summary\": \"$INPUT_SUMMARY\",
    \"output_length\": $(echo "$RESULT" | wc -c),
    \"status\": \"success\"
  }" >> "$AUDIT_LOG"
} 200>"/var/log/claude-code/audit.log.lock"

# Also log file modifications
if [[ "$TOOL" == "Write" ]] || [[ "$TOOL" == "Edit" ]]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
  echo "{
    \"timestamp\": \"$TIMESTAMP\",
    \"user\": \"$USER\",
    \"action\": \"file_modified\",
    \"file\": \"$FILE_PATH\",
    \"tool\": \"$TOOL\"
  }" >> "/var/log/claude-code/file-changes.log"
fi
```

### Log Rotation Configuration

```bash
#!/bin/bash
# name: setup-audit-log-rotation.sh
# Configure logrotate for Claude Code audit trails

cat > /etc/logrotate.d/claude-code << 'EOF'
/var/log/claude-code/*.log {
  daily
  rotate 90
  compress
  delaycompress
  missingok
  notifempty
  create 0600 root root
  sharedscripts
  postrotate
    # Notify SIEM or archival system
    /opt/claude-code/archive-audit-logs.sh
  endscript
}
EOF

chmod 644 /etc/logrotate.d/claude-code
```

## SOC2 Compliance Mapping

### CC-6.1 Logical Access Control

**Control:** Restrict access to systems and data.

**Implementation:**
- Permission modes (plan, default, acceptEdits) limit tool access
- Allow/deny lists in settings.json prevent unauthorized tool use
- Managed settings prevent user override
- Pre-commit hooks block credential commits

**Evidence Collection:**
```bash
# Audit: Current permissions configuration
grep -r "permissions" ~/.claude/settings.json

# Audit: Session permission changes
grep "permission_mode" /var/log/claude-code/audit.log

# Audit: Denied tool uses
grep '"decision": "deny"' /var/log/claude-code/audit.log | wc -l
```

### CC-7.1 System Monitoring and Anomaly Detection

**Control:** Monitor activity for anomalies.

**Implementation:**
- PostToolUse hooks capture all tool calls with timestamps
- File change tracking logs modifications with user
- Login events tracked via forceLoginMethod
- Cost tracking detects unusual API usage patterns

**Evidence Collection:**
```bash
# Daily activity summary
awk '$tool == "Bash(rm*)" {rm_count++} END {
  print "Dangerous Bash uses: " rm_count
}' /var/log/claude-code/audit.log

# User activity timeline
grep '"user":' /var/log/claude-code/audit.log | \
  jq -s 'group_by(.user) |
         map({user: .[0].user, count: length})'
```

### CC-8.1 Change Management

**Control:** Authorize and document changes.

**Implementation:**
- Git hooks require pre-commit message format
- File modification audit trail (tool, user, timestamp)
- Pre-push hooks verify branch protection
- PostToolUse hooks log all code changes

**Evidence Collection:**
```bash
# Git change log with user and timestamp
git log --pretty=format:"%h %an %ad %s" --date=short

# Files modified in past 30 days
find . -mtime -30 -type f | xargs ls -lt | head -20
```

## HIPAA Compliance Template

Protected Health Information (PHI) prevention hooks:

```bash
#!/bin/bash
# name: hipaa-phi-guard.sh
# PreToolUse: Block tools that could expose PHI

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name' 2>/dev/null)

# Reject tools that could output to insecure locations
case "$TOOL" in
  WebFetch|WebSearch)
    echo '{"decision": "deny", "reason": "WebFetch/WebSearch blocked in HIPAA environment"}'
    exit 0
    ;;
  Bash)
    CMD=$(echo "$INPUT" | jq -r '.tool_input.command' 2>/dev/null)
    # Block commands that might exfiltrate data
    if echo "$CMD" | grep -qE '(curl|wget|scp|rsync|nc).*[^127\.0\.0\.1]'; then
      echo '{"decision": "deny", "reason": "Network exfiltration patterns blocked"}'
      exit 0
    fi
    ;;
esac

echo '{"decision": "approve"}'
```

PostToolUse hook to prevent PHI in responses:

```bash
#!/bin/bash
# name: hipaa-output-sanitizer.sh
# PostToolUse: Scan outputs for PHI patterns

INPUT=$(cat)
OUTPUT=$(echo "$INPUT" | jq -r '.tool_result' 2>/dev/null)

# Common PHI patterns
PHI_PATTERNS=(
  '[0-9]{3}-[0-9]{2}-[0-9]{4}'  # SSN
  '[0-9]{16,19}'                 # Credit card
  'MRN[:\s]*[0-9]{6,12}'         # Medical Record Number
)

for pattern in "${PHI_PATTERNS[@]}"; do
  if echo "$OUTPUT" | grep -qE "$pattern"; then
    echo "{
      \"warning\": \"PHI pattern detected in output\",
      \"pattern\": \"$pattern\",
      \"action\": \"sanitize\"
    }"
    # Do not output the matched text
    exit 1
  fi
done
```

## GDPR Data Handling

### Retention Policy

```json
{
  "dataRetention": {
    "auditLogs": "90 days",
    "fileLogs": "30 days",
    "sessionLogs": "7 days",
    "backups": "365 days"
  },
  "zeroDataRetention": true
}
```

### PII Detection Hook

```bash
#!/bin/bash
# name: gdpr-pii-detector.sh
# PreToolUse: Detect PII in inputs and flag for review

INPUT=$(cat)

# PII patterns
PII_PATTERNS=(
  'name[:\s]*[A-Z][a-z]+ [A-Z]'
  'email[:\s]*[a-z0-9._%+-]+@'
  'phone[:\s]*\+?[0-9\s().-]{10,}'
  'address[:\s]*[0-9]+ .{5,}'
)

for pattern in "${PII_PATTERNS[@]}"; do
  if echo "$INPUT" | grep -qiE "$pattern"; then
    echo "{
      \"warning\": \"PII detected in input\",
      \"pattern\": \"$pattern\",
      \"user_confirmation_required\": true
    }"
    exit 1
  fi
done

echo '{"decision": "approve"}'
```

## SSO and Identity Integration

### Anthropic API with Organization

```json
{
  "auth": {
    "method": "apiKey",
    "apiKey": "${ANTHROPIC_API_KEY}",
    "organizationId": "${ANTHROPIC_ORG_ID}",
    "forceLoginOrgUUID": "org-12345"
  }
}
```

### AWS Bedrock Integration

```json
{
  "auth": {
    "method": "bedrock",
    "region": "us-east-1",
    "roleArn": "arn:aws:iam::123456789:role/claude-code-role",
    "assumeRoleSessionName": "claude-code-session"
  }
}
```

### Google Cloud Vertex AI

```json
{
  "auth": {
    "method": "vertexAI",
    "projectId": "my-gcp-project",
    "location": "us-central1",
    "serviceAccountPath": "/etc/gcloud/service-account.json"
  }
}
```

## Network Security

### Proxy Configuration for Egress Control

```bash
export GLOBAL_AGENT_HTTP_PROXY="http://proxy.internal:3128"
export GLOBAL_AGENT_HTTPS_PROXY="https://proxy.internal:3128"
export NO_PROXY="localhost,127.0.0.1,*.internal,.local"
```

### Air-Gapped Setup (Bedrock)

For deployments without internet access:

```json
{
  "auth": {
    "method": "bedrock",
    "vpcEndpoint": "vpce-12345678",
    "region": "us-east-1"
  },
  "network": {
    "allowedDomains": [
      "bedrock.us-east-1.amazonaws.com"
    ],
    "blockPublicInternet": true
  }
}
```

### MCP Server Domain Allowlist

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["mcp-filesystem-server.js"],
      "allowedPaths": ["/app", "/data"],
      "allowNetworkAccess": false
    },
    "web": {
      "allowedDomains": [
        "api.internal",
        "docs.internal"
      ]
    }
  }
}
```

## Managed Settings Enforcement

### Organization-Level Settings (macOS)

Place at `/Library/Application Support/ClaudeCode/CLAUDE.md` and `settings.json`:

```json
{
  "managedSettings": {
    "version": "1.0",
    "enforced": true,
    "permissions": {
      "deny": [
        "Bash(curl * | bash)",
        "Bash(wget * | bash)",
        "Bash(sudo *)",
        "Bash(chmod 777 *)"
      ]
    },
    "model": "claude-sonnet-4-6",
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "*",
          "hooks": [
            {
              "type": "command",
              "command": "/opt/audit/enterprise-audit.sh"
            }
          ]
        }
      ]
    },
    "network": {
      "proxy": "https://proxy.corp:3128"
    }
  }
}
```

### Linux System-Wide Settings

Place at `/etc/claude-code/CLAUDE.md` and `/etc/claude-code/settings.json`.

### Windows Group Policy

Store at `HKEY_LOCAL_MACHINE\Software\Policies\ClaudeCode\`:

```powershell
New-Item -Path "HKLM:\Software\Policies\ClaudeCode" -Force
New-ItemProperty -Path "HKLM:\Software\Policies\ClaudeCode" `
  -Name "PermissionMode" -Value "plan" -PropertyType String
```

## Incident Response Playbook

### If Claude Generates Credentials

1. **Immediate**: Stop the session (`Ctrl+C`)
2. **Contain**: Run credential rotation script
3. **Audit**: Check audit logs for exposure
4. **Remediate**: Revoke any exposed credentials
5. **Document**: Record incident in security log

```bash
#!/bin/bash
# name: incident-response-credential-leak.sh

INCIDENT_ID=$(date +%s)
INCIDENT_LOG="/var/log/claude-code/incidents.log"

echo "{
  \"incident_id\": \"$INCIDENT_ID\",
  \"type\": \"credential_exposure\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"status\": \"investigating\",
  \"actions_taken\": []
}" > "/tmp/incident-$INCIDENT_ID.json"

# Rotate all API keys
echo "  Revoking API keys..."
# Call credential rotation service

# Archive audit logs for forensics
echo "  Archiving audit logs..."
tar czf "/var/log/claude-code/incident-$INCIDENT_ID.tar.gz" \
  /var/log/claude-code/*.log

echo "  Incident $INCIDENT_ID logged"
```

### If Sensitive Data Output

1. **Check**: Grep audit logs for the data pattern
2. **Scope**: Determine who had access
3. **Notify**: Alert security team
4. **Retain**: Keep logs for compliance investigation

```bash
#!/bin/bash
# name: audit-forensics.sh

DATA_PATTERN="$1"
LOG_DIR="/var/log/claude-code"

echo "=== Forensic Analysis ==="
echo "Pattern: $DATA_PATTERN"
echo ""
echo "Occurrences in audit trail:"
grep -rn "$DATA_PATTERN" "$LOG_DIR" | wc -l
echo ""
echo "Timeline:"
grep -rn "$DATA_PATTERN" "$LOG_DIR" | cut -d: -f3 | jq '.timestamp'
```

## Enterprise Security Checklist

- [ ] Permission mode set to non-permissive (not bypassPermissions)
- [ ] Deny list covers destructive bash commands (rm, mkfs, dd, chmod 777)
- [ ] PreToolUse hook blocks .env, .pem, .key file access
- [ ] PostToolUse hook logs all tool calls with timestamp and user
- [ ] Vault or Secrets Manager integration configured
- [ ] Pre-commit hook prevents credential commits
- [ ] Audit logs persist to /var/log/claude-code/
- [ ] Log rotation configured with 90-day retention
- [ ] Managed settings prevent user override
- [ ] SSO method configured (Anthropic, Bedrock, or Vertex)
- [ ] Network proxy configured for egress control
- [ ] MCP servers vetted for security
- [ ] SOC2/HIPAA/GDPR compliance policies documented
- [ ] Incident response playbook tested
- [ ] Security team trained on audit log access
