#!/usr/bin/env bash
#
# Post-Deploy Notifier
# Purpose: Notify team on deployment-related actions
# Triggers: deploy, kubectl, helm, docker push/build commands
#

set -euo pipefail

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMMAND=""
USER="${USER:-unknown}"
TIMESTAMP=""
PROJECT=""
LOG_FILE=""
WEBHOOK_URL=""
NOTIFICATION_CHANNELS=("log")

#######################################
# Parse command line arguments
#######################################
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --command)
                COMMAND="$2"
                shift 2
                ;;
            --user)
                USER="$2"
                shift 2
                ;;
            --timestamp)
                TIMESTAMP="$2"
                shift 2
                ;;
            --project)
                PROJECT="$2"
                shift 2
                ;;
            --log-file)
                LOG_FILE="$2"
                shift 2
                ;;
            --webhook-url)
                WEBHOOK_URL="$2"
                shift 2
                ;;
            --channels)
                IFS=',' read -ra NOTIFICATION_CHANNELS <<< "$2"
                shift 2
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

#######################################
# Show help message
#######################################
show_help() {
    cat <<EOF
Usage: notify-deploy.sh [OPTIONS]

Notify team on deployment-related actions.

OPTIONS:
    --command CMD       The command that was executed (required)
    --user USER         User who executed the command (default: \$USER)
    --timestamp TIME    Timestamp of execution (default: now)
    --project NAME      Project name (default: unknown)
    --log-file PATH     Path to log file (default: workspace log)
    --webhook-url URL   Webhook URL for notifications
    --channels CHANNELS Comma-separated list of channels (log,webhook,slack)
    --help, -h          Show this help message

EXAMPLES:
    # Log deployment to file
    notify-deploy.sh --command "kubectl apply -f deploy.yaml" --project my-app

    # Send webhook notification
    notify-deploy.sh --command "helm upgrade" --webhook-url "https://hooks.slack.com/..."

EOF
}

#######################################
# Utility functions
#######################################
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[DEPLOY]${NC} $*"
}

get_timestamp() {
    if [[ -n "$TIMESTAMP" ]]; then
        echo "$TIMESTAMP"
    else
        date -u +"%Y-%m-%dT%H:%M:%SZ"
    fi
}

#######################################
# Parse deployment command
#######################################
parse_deployment() {
    local cmd="$1"
    local deploy_type="unknown"
    local target="unknown"
    local action="unknown"

    # Determine deployment type and extract details
    if echo "$cmd" | grep -q "kubectl"; then
        deploy_type="kubernetes"
        action=$(echo "$cmd" | grep -oE '(apply|create|delete|patch|scale|rollout)' | head -1)
        target=$(echo "$cmd" | grep -oE '\-f [^ ]+' | sed 's/-f //' || echo "unknown")
    elif echo "$cmd" | grep -q "helm"; then
        deploy_type="helm"
        action=$(echo "$cmd" | grep -oE '(install|upgrade|rollback|uninstall)' | head -1)
        target=$(echo "$cmd" | grep -oE '(install|upgrade) [^ ]+' | awk '{print $2}' || echo "unknown")
    elif echo "$cmd" | grep -q "docker push"; then
        deploy_type="docker"
        action="push"
        target=$(echo "$cmd" | grep -oE 'push [^ ]+' | sed 's/push //')
    elif echo "$cmd" | grep -q "docker build"; then
        deploy_type="docker"
        action="build"
        target=$(echo "$cmd" | grep -oE '\-t [^ ]+' | sed 's/-t //' || echo "unknown")
    elif echo "$cmd" | grep -q "npm publish"; then
        deploy_type="npm"
        action="publish"
        target=$(pwd | xargs basename)
    elif echo "$cmd" | grep -q "terraform apply"; then
        deploy_type="terraform"
        action="apply"
        target=$(echo "$cmd" | grep -oE '\-var-file=[^ ]+' | sed 's/-var-file=//' || echo "default")
    else
        deploy_type="generic"
        action="deploy"
        target="unknown"
    fi

    echo "$deploy_type|$action|$target"
}

#######################################
# Build notification message
#######################################
build_message() {
    local deploy_info="$1"
    IFS='|' read -r deploy_type action target <<< "$deploy_info"

    local timestamp=$(get_timestamp)
    local hostname=$(hostname 2>/dev/null || echo "unknown")

    cat <<EOF
{
  "event": "deployment",
  "timestamp": "$timestamp",
  "user": "$USER",
  "project": "$PROJECT",
  "deployment": {
    "type": "$deploy_type",
    "action": "$action",
    "target": "$target",
    "command": "$COMMAND"
  },
  "environment": {
    "hostname": "$hostname",
    "cwd": "$(pwd)"
  }
}
EOF
}

#######################################
# Build human-readable summary
#######################################
build_summary() {
    local deploy_info="$1"
    IFS='|' read -r deploy_type action target <<< "$deploy_info"

    cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    DEPLOYMENT NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 PROJECT:     $PROJECT
👤 USER:        $USER
🕐 TIME:        $(get_timestamp)
🚀 TYPE:        $deploy_type
⚡ ACTION:      $action
🎯 TARGET:      $target

📝 COMMAND:
   $COMMAND

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

#######################################
# Send notifications
#######################################
send_log_notification() {
    local message="$1"
    local summary="$2"

    # Determine log file
    if [[ -z "$LOG_FILE" ]]; then
        LOG_FILE="${CLAUDE_PLUGIN_ROOT:-/tmp}/.claude/logs/deployments.log"
        mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    fi

    # Append to log
    echo "$message" >> "$LOG_FILE"

    log_success "Deployment logged to: $LOG_FILE"
    echo ""
    echo "$summary"
}

send_webhook_notification() {
    local message="$1"

    if [[ -z "$WEBHOOK_URL" ]]; then
        log_info "Webhook URL not configured, skipping webhook notification"
        return 0
    fi

    # Send webhook
    local response
    if command -v curl &> /dev/null; then
        response=$(curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$message" \
            "$WEBHOOK_URL" 2>&1)

        if [[ $? -eq 0 ]]; then
            log_success "Webhook notification sent successfully"
        else
            log_info "Failed to send webhook: $response"
        fi
    else
        log_info "curl not available, skipping webhook notification"
    fi
}

send_slack_notification() {
    local deploy_info="$1"
    IFS='|' read -r deploy_type action target <<< "$deploy_info"

    if [[ -z "$WEBHOOK_URL" ]]; then
        log_info "Slack webhook URL not configured, skipping Slack notification"
        return 0
    fi

    # Build Slack-formatted message
    local slack_message=$(cat <<EOF
{
  "text": "🚀 Deployment Notification",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚀 Deployment Notification"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Project:*\n$PROJECT"
        },
        {
          "type": "mrkdwn",
          "text": "*User:*\n$USER"
        },
        {
          "type": "mrkdwn",
          "text": "*Type:*\n$deploy_type"
        },
        {
          "type": "mrkdwn",
          "text": "*Action:*\n$action"
        },
        {
          "type": "mrkdwn",
          "text": "*Target:*\n$target"
        },
        {
          "type": "mrkdwn",
          "text": "*Time:*\n$(get_timestamp)"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Command:*\n\`\`\`$COMMAND\`\`\`"
      }
    }
  ]
}
EOF
)

    # Send to Slack
    if command -v curl &> /dev/null; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$slack_message" \
            "$WEBHOOK_URL" > /dev/null 2>&1

        if [[ $? -eq 0 ]]; then
            log_success "Slack notification sent successfully"
        fi
    fi
}

#######################################
# Main notification handler
#######################################
notify() {
    if [[ -z "$COMMAND" ]]; then
        log_info "No command provided, skipping notification"
        exit 0
    fi

    # Parse deployment details
    local deploy_info=$(parse_deployment "$COMMAND")

    # Build messages
    local json_message=$(build_message "$deploy_info")
    local summary=$(build_summary "$deploy_info")

    # Send notifications to configured channels
    for channel in "${NOTIFICATION_CHANNELS[@]}"; do
        case "$channel" in
            log)
                send_log_notification "$json_message" "$summary"
                ;;
            webhook)
                send_webhook_notification "$json_message"
                ;;
            slack)
                send_slack_notification "$deploy_info"
                ;;
            *)
                log_info "Unknown notification channel: $channel"
                ;;
        esac
    done
}

#######################################
# Main execution
#######################################
main() {
    parse_args "$@"

    # Check if command is deployment-related
    if ! echo "$COMMAND" | grep -qE "(deploy|kubectl|helm|docker (push|build)|npm publish|terraform apply)"; then
        # Not a deployment command, exit silently
        exit 0
    fi

    notify
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
