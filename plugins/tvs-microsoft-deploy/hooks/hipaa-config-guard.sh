#!/bin/bash
# PreToolUse hook - Guards TVS tenant HIPAA-sensitive configuration changes
# Part of tvs-microsoft-deploy plugin
# Blocks Teams/SharePoint/Exchange config changes in TVS tenant without HIPAA_CONFIRMED=true
# NOTE: Works alongside base Golden Armada hooks, does not replace them
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only inspect Bash commands
if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check az, Teams, SharePoint, and Exchange commands
if ! echo "$COMMAND" | grep -qiE '(az |Set-|New-|Remove-|Update-|Grant-|Revoke-)'; then
  exit 0
fi

# Determine if this targets the TVS tenant
IS_TVS=false
if [ -n "${TVS_TENANT_ID:-}" ] && [ "${AZURE_TENANT_ID:-}" = "$TVS_TENANT_ID" ]; then
  IS_TVS=true
fi
# Also detect TVS by domain references in the command
if echo "$COMMAND" | grep -qiE '(trustedvirtual\.solutions|tvs-prod|tvs-dev|tvs-test)'; then
  IS_TVS=true
fi

# If not targeting TVS tenant, allow through
if [ "$IS_TVS" = false ]; then
  exit 0
fi

# --- Define HIPAA-sensitive operation patterns ---

# Teams policy changes (messaging, meeting, calling, app policies)
TEAMS_PATTERNS='(Set-CsTeamsMessagingPolicy|Set-CsTeamsMeetingPolicy|Set-CsTeamsCallingPolicy|New-CsTeamsMessagingPolicy|Set-CsTeamsAppPermissionPolicy|Grant-CsTeamsMessagingPolicy|Set-CsTeamsChannelsPolicy|Set-TeamMessagingSetting|Set-CsTeamsMeetingBroadcastPolicy)'

# SharePoint external sharing and access policies
SHAREPOINT_PATTERNS='(Set-SPOTenant.*Sharing|Set-SPOSite.*Sharing|Set-SPOTenant.*ExternalSharing|az.*sharepoint.*sharing|Set-SPOTenant.*OneDriveSharingCapability|Set-SPOTenant.*FileAnonymousLinkType|Set-PnPTenant.*Sharing)'

# Exchange retention, DLP, and compliance policies
EXCHANGE_PATTERNS='(Set-RetentionPolicy|New-RetentionPolicy|Set-RetentionCompliancePolicy|New-CompliancePolicy|Set-DlpPolicy|New-DlpPolicy|New-TransportRule.*Encrypt|Set-IRMConfiguration|Set-JournalRule|New-JournalRule|Set-MalwareFilterPolicy|Remove-RetentionPolicy)'

# Sensitivity labels and Information Protection
PROTECTION_PATTERNS='(Set-Label|New-Label|Set-LabelPolicy|New-DlpCompliancePolicy|Set-InformationBarrierPolicy|New-InformationBarrierPolicy)'

# Check if command matches any HIPAA-sensitive pattern
SENSITIVE=false
CATEGORY=""

if echo "$COMMAND" | grep -qE "$TEAMS_PATTERNS"; then
  SENSITIVE=true
  CATEGORY="Teams policy"
fi
if echo "$COMMAND" | grep -qE "$SHAREPOINT_PATTERNS"; then
  SENSITIVE=true
  CATEGORY="${CATEGORY:+$CATEGORY, }SharePoint sharing/access"
fi
if echo "$COMMAND" | grep -qE "$EXCHANGE_PATTERNS"; then
  SENSITIVE=true
  CATEGORY="${CATEGORY:+$CATEGORY, }Exchange retention/compliance"
fi
if echo "$COMMAND" | grep -qE "$PROTECTION_PATTERNS"; then
  SENSITIVE=true
  CATEGORY="${CATEGORY:+$CATEGORY, }Information Protection/DLP"
fi

# Read-only operations are always allowed
if echo "$COMMAND" | grep -qE '^\s*(Get-|az .* (show|list)|pac .* list)'; then
  exit 0
fi

# If sensitive operation detected, require HIPAA_CONFIRMED
if [ "$SENSITIVE" = true ]; then
  if [ "${HIPAA_CONFIRMED:-}" != "true" ]; then
    echo "BLOCKED: HIPAA-sensitive configuration change detected for TVS tenant." >&2
    echo "  Category: $CATEGORY" >&2
    echo "  Command:  $(echo "$COMMAND" | head -c 120)..." >&2
    echo "" >&2
    echo "  TVS (Trusted Virtual Solutions) handles PHI/PII data subject to HIPAA." >&2
    echo "  Modifying Teams, SharePoint, or Exchange policies requires explicit confirmation." >&2
    echo "" >&2
    echo "  To proceed, set:  export HIPAA_CONFIRMED=true" >&2
    echo "  Then re-run the command." >&2
    echo "" >&2
    echo "  Ensure changes are documented in the HIPAA compliance log." >&2
    exit 2
  else
    echo "HIPAA_CONFIRMED=true -- Proceeding with TVS tenant config change ($CATEGORY)." >&2
    echo "  Reminder: Log this change in the HIPAA compliance register." >&2
  fi
fi

exit 0
