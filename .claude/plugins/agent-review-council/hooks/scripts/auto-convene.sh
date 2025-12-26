#!/usr/bin/env bash

# Auto-Convene Hook
# Automatically convenes council review when PR is created or updated
#
# Usage: Called automatically by git workflow on PR events
# Event: onPRCreated, onPRUpdated

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

# Council configuration file
COUNCIL_CONFIG="${COUNCIL_CONFIG:-.claude/council/config.json}"

# Default protocol if not specified in config
DEFAULT_PROTOCOL="${COUNCIL_PROTOCOL:-adversarial}"

# Default panel size
DEFAULT_PANEL_SIZE="${COUNCIL_PANEL_SIZE:-standard}"

# Minimum review confidence threshold
MIN_CONFIDENCE="${COUNCIL_MIN_CONFIDENCE:-0.75}"

# Slack webhook for notifications (optional)
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"

# ============================================================================
# Helper Functions
# ============================================================================

log() {
  echo "[auto-convene] $*" >&2
}

error() {
  echo "[auto-convene] ERROR: $*" >&2
  exit 1
}

# Read config value from council config
get_config() {
  local key="$1"
  local default="$2"

  if [[ -f "$COUNCIL_CONFIG" ]]; then
    value=$(jq -r ".${key} // \"${default}\"" "$COUNCIL_CONFIG" 2>/dev/null || echo "$default")
    echo "$value"
  else
    echo "$default"
  fi
}

# Check if PR meets criteria for auto-review
should_auto_convene() {
  local pr_number="$1"
  local files_changed="$2"
  local lines_changed="$3"

  # Read auto-convene settings from config
  local enabled=$(get_config "autoConveneOnPR" "true")
  local min_files=$(get_config "autoConveneMinFiles" "1")
  local min_lines=$(get_config "autoConveneMinLines" "10")

  if [[ "$enabled" != "true" ]]; then
    log "Auto-convene disabled in config"
    return 1
  fi

  if [[ "$files_changed" -lt "$min_files" ]]; then
    log "Too few files changed ($files_changed < $min_files), skipping"
    return 1
  fi

  if [[ "$lines_changed" -lt "$min_lines" ]]; then
    log "Too few lines changed ($lines_changed < $min_lines), skipping"
    return 1
  fi

  return 0
}

# Determine protocol based on PR characteristics
select_protocol() {
  local files_changed="$1"
  local security_sensitive="$2"
  local lines_changed="$3"

  # Security-sensitive changes → red-blue-team
  if [[ "$security_sensitive" == "true" ]]; then
    echo "red-blue-team"
    return
  fi

  # Large changes → autogen-team for coordination
  if [[ "$lines_changed" -gt 500 ]]; then
    echo "autogen-team"
    return
  fi

  # Small changes → rapid-fire for speed
  if [[ "$lines_changed" -lt 50 ]]; then
    echo "rapid-fire"
    return
  fi

  # Default from config
  echo "$(get_config "deliberationProtocol" "$DEFAULT_PROTOCOL")"
}

# Determine panel size based on PR characteristics
select_panel_size() {
  local files_changed="$1"
  local lines_changed="$2"

  if [[ "$lines_changed" -gt 1000 ]]; then
    echo "full"
  elif [[ "$lines_changed" -gt 300 ]]; then
    echo "thorough"
  elif [[ "$lines_changed" -gt 100 ]]; then
    echo "standard"
  else
    echo "quick"
  fi
}

# Check if files touch security-sensitive areas
is_security_sensitive() {
  local changed_files="$1"

  # Patterns indicating security-sensitive code
  local security_patterns=(
    "auth"
    "authentication"
    "authorization"
    "security"
    "password"
    "token"
    "jwt"
    "crypto"
    "encrypt"
    "permission"
    "role"
    "session"
    "payment"
    "billing"
  )

  for pattern in "${security_patterns[@]}"; do
    if echo "$changed_files" | grep -qi "$pattern"; then
      return 0
    fi
  done

  return 1
}

# Send Slack notification
notify_slack() {
  local pr_number="$1"
  local verdict="$2"
  local confidence="$3"
  local pr_url="$4"

  if [[ -z "$SLACK_WEBHOOK" ]]; then
    return
  fi

  local color="good"
  local emoji="✅"

  case "$verdict" in
    "APPROVE")
      color="good"
      emoji="✅"
      ;;
    "APPROVE_WITH_CHANGES")
      color="warning"
      emoji="⚠️"
      ;;
    "REQUEST_CHANGES")
      color="danger"
      emoji="🔄"
      ;;
    "REJECT")
      color="danger"
      emoji="❌"
      ;;
  esac

  local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "$emoji Council Review Complete: PR #$pr_number",
      "title_link": "$pr_url",
      "fields": [
        {
          "title": "Verdict",
          "value": "$verdict",
          "short": true
        },
        {
          "title": "Confidence",
          "value": "$confidence",
          "short": true
        }
      ],
      "footer": "Agent Review Council",
      "footer_icon": "https://example.com/council-icon.png"
    }
  ]
}
EOF
)

  curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" 2>/dev/null || true
}

# ============================================================================
# Main Logic
# ============================================================================

main() {
  log "Auto-convene hook triggered"

  # Get PR information from environment or arguments
  PR_NUMBER="${PR_NUMBER:-${1:-}}"
  PR_URL="${PR_URL:-}"

  if [[ -z "$PR_NUMBER" ]]; then
    error "PR_NUMBER not provided"
  fi

  log "Processing PR #$PR_NUMBER"

  # Get PR diff stats using gh CLI
  if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh) not found. Install: https://cli.github.com/"
  fi

  # Get changed files
  changed_files=$(gh pr diff "$PR_NUMBER" --name-only || error "Failed to get PR diff")
  files_changed=$(echo "$changed_files" | wc -l)

  # Get lines changed
  diff_stat=$(gh pr view "$PR_NUMBER" --json additions,deletions --jq '.additions + .deletions')
  lines_changed=${diff_stat:-0}

  log "Files changed: $files_changed, Lines changed: $lines_changed"

  # Check if we should auto-convene
  if ! should_auto_convene "$PR_NUMBER" "$files_changed" "$lines_changed"; then
    log "Skipping auto-convene (criteria not met)"
    exit 0
  fi

  # Determine review parameters
  security_sensitive="false"
  if is_security_sensitive "$changed_files"; then
    security_sensitive="true"
    log "Security-sensitive files detected"
  fi

  protocol=$(select_protocol "$files_changed" "$security_sensitive" "$lines_changed")
  panel_size=$(select_panel_size "$files_changed" "$lines_changed")

  log "Selected protocol: $protocol, panel size: $panel_size"

  # Convene council
  log "Convening council for PR #$PR_NUMBER..."

  verdict_file=$(mktemp)

  if claude-code /council:review \
      --pr="$PR_NUMBER" \
      --protocol="$protocol" \
      --size="$panel_size" \
      --output="$verdict_file"; then

    log "Council review completed successfully"

    # Parse verdict
    verdict=$(jq -r '.verdict.decision' "$verdict_file")
    confidence=$(jq -r '.verdict.confidence' "$verdict_file")

    log "Verdict: $verdict (confidence: $confidence)"

    # Check confidence threshold
    if (( $(echo "$confidence < $MIN_CONFIDENCE" | bc -l) )); then
      log "WARNING: Confidence $confidence below threshold $MIN_CONFIDENCE"
      # Optionally: Re-run with larger panel or different protocol
    fi

    # Post verdict as PR comment
    if command -v gh &> /dev/null; then
      verdict_summary=$(jq -r '.verdict.summary // "See full verdict for details"' "$verdict_file")

      gh pr comment "$PR_NUMBER" --body "$(cat <<EOF
## 🏛️ Council Review Complete

**Verdict:** \`$verdict\`
**Confidence:** $confidence
**Protocol:** $protocol
**Panel Size:** $panel_size

$verdict_summary

<details>
<summary>Full Verdict</summary>

\`\`\`json
$(cat "$verdict_file")
\`\`\`

</details>
EOF
)"
      log "Posted verdict as PR comment"
    fi

    # Send Slack notification
    notify_slack "$PR_NUMBER" "$verdict" "$confidence" "$PR_URL"

    # Block merge if verdict is not favorable
    blocking_mode=$(get_config "blockOnUnfavorableVerdict" "true")

    if [[ "$blocking_mode" == "true" ]] && [[ "$verdict" != "APPROVE" ]]; then
      log "Blocking merge: verdict is $verdict"
      # Set GitHub status check to failure
      if command -v gh &> /dev/null; then
        gh pr review "$PR_NUMBER" --request-changes --body "Council verdict: $verdict. Changes required before merge."
      fi
      exit 1
    fi

    rm -f "$verdict_file"
    exit 0

  else
    error "Council review failed"
  fi
}

# Run main function
main "$@"
