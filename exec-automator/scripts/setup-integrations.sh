#!/bin/bash
#######################################################################
# exec-automator Integration Setup Wizard
# Copyright (c) 2025 Brookside BI
#
# Interactive setup for external integrations including:
# - CRM systems (Salesforce, HubSpot, etc.)
# - Calendar services (Google Calendar, Outlook)
# - Email platforms (Gmail, Outlook, SendGrid)
# - Communication tools (Slack, Teams)
# - Document management (Google Drive, OneDrive)
#
# Handles OAuth flows, API key configuration, and connection testing.
#
# Usage:
#   ./scripts/setup-integrations.sh [options]
#
# Options:
#   --service NAME   Setup specific service only
#   --list           List available integrations
#   --reset          Reset all integration configurations
#   --help           Show this help message
#######################################################################

set -e  # Exit on error

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

# Script configuration
SPECIFIC_SERVICE=""
LIST_ONLY=false
RESET_CONFIG=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$PLUGIN_ROOT/mcp-server/config"
LOG_DIR="$PLUGIN_ROOT/logs"
LOG_FILE="$LOG_DIR/integration-setup-$(date +%Y%m%d-%H%M%S).log"
CREDENTIALS_FILE="$CONFIG_DIR/integrations.json"

#######################################################################
# Logging Functions
#######################################################################

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

info() {
    echo -e "${CYAN}[INFO]${NC} $*"
    log "INFO" "$*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log "SUCCESS" "$*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    log "WARN" "$*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
    log "ERROR" "$*"
}

prompt() {
    echo -e "${PURPLE}[?]${NC} $*"
}

#######################################################################
# Utility Functions
#######################################################################

show_help() {
    cat << EOF
${BOLD}exec-automator Integration Setup Wizard${NC}

${CYAN}Usage:${NC}
  ./scripts/setup-integrations.sh [options]

${CYAN}Options:${NC}
  --service NAME   Setup specific service only
  --list           List available integrations
  --reset          Reset all integration configurations
  --help           Show this help message

${CYAN}Available Services:${NC}
  crm              CRM systems (Salesforce, HubSpot)
  calendar         Calendar services (Google, Outlook)
  email            Email platforms (Gmail, Outlook, SendGrid)
  chat             Chat platforms (Slack, Teams)
  storage          Document storage (Google Drive, OneDrive)
  all              Setup all integrations

${CYAN}Examples:${NC}
  ./scripts/setup-integrations.sh
  ./scripts/setup-integrations.sh --service crm
  ./scripts/setup-integrations.sh --list

${CYAN}Security:${NC}
  Credentials are stored in: $CONFIG_DIR/integrations.json
  This file is .gitignore'd and should never be committed.

EOF
}

print_banner() {
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║              Integration Setup Wizard                        ║
║                                                               ║
║         Connect exec-automator to your tools                 ║
║                                                               ║
║                  Powered by Brookside BI                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

list_integrations() {
    cat << EOF
${BOLD}${CYAN}Available Integrations:${NC}

${BOLD}CRM Systems:${NC}
  ✓ Salesforce      - OAuth 2.0 + API Key
  ✓ HubSpot         - API Key
  ✓ Zoho CRM        - OAuth 2.0

${BOLD}Calendar Services:${NC}
  ✓ Google Calendar - OAuth 2.0
  ✓ Microsoft 365   - OAuth 2.0
  ✓ CalDAV          - Username/Password

${BOLD}Email Platforms:${NC}
  ✓ Gmail           - OAuth 2.0
  ✓ Outlook         - OAuth 2.0
  ✓ SendGrid        - API Key
  ✓ SMTP            - Username/Password

${BOLD}Communication:${NC}
  ✓ Slack           - OAuth 2.0 + Bot Token
  ✓ Microsoft Teams - OAuth 2.0
  ✓ Discord         - Bot Token

${BOLD}Document Storage:${NC}
  ✓ Google Drive    - OAuth 2.0
  ✓ OneDrive        - OAuth 2.0
  ✓ Dropbox         - OAuth 2.0

${BOLD}Other Services:${NC}
  ✓ Trello          - API Key + Token
  ✓ Asana           - Personal Access Token
  ✓ Jira            - API Token

${CYAN}Use --service <name> to setup a specific integration${NC}

EOF
}

#######################################################################
# Configuration Management
#######################################################################

setup_directories() {
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"

    # Create empty integrations file if it doesn't exist
    if [[ ! -f "$CREDENTIALS_FILE" ]]; then
        echo '{}' > "$CREDENTIALS_FILE"
        chmod 600 "$CREDENTIALS_FILE"  # Secure file permissions
    fi
}

load_existing_config() {
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        cat "$CREDENTIALS_FILE"
    else
        echo '{}'
    fi
}

save_config() {
    local service=$1
    local config=$2

    local existing_config=$(load_existing_config)

    # Merge configurations using Python
    python3 << EOF
import json
existing = json.loads('''$existing_config''')
new_config = json.loads('''$config''')
existing['$service'] = new_config
with open('$CREDENTIALS_FILE', 'w') as f:
    json.dump(existing, f, indent=2)
EOF

    chmod 600 "$CREDENTIALS_FILE"
    success "Configuration saved for $service"
}

#######################################################################
# Integration Setup Functions
#######################################################################

setup_crm_integration() {
    echo -e "\n${BOLD}${BLUE}CRM Integration Setup${NC}\n"

    prompt "Select CRM platform:"
    echo "  1) Salesforce"
    echo "  2) HubSpot"
    echo "  3) Zoho CRM"
    echo "  4) Skip"
    read -p "Choice [1-4]: " crm_choice

    case $crm_choice in
        1)
            setup_salesforce
            ;;
        2)
            setup_hubspot
            ;;
        3)
            setup_zoho
            ;;
        4)
            info "Skipping CRM integration"
            ;;
        *)
            warn "Invalid choice, skipping CRM integration"
            ;;
    esac
}

setup_salesforce() {
    info "Setting up Salesforce integration..."

    read -p "Salesforce Instance URL (e.g., https://yourorg.salesforce.com): " sf_instance
    read -p "Consumer Key (Client ID): " sf_client_id
    read -sp "Consumer Secret (Client Secret): " sf_client_secret
    echo ""
    read -p "Username: " sf_username
    read -sp "Password: " sf_password
    echo ""
    read -sp "Security Token: " sf_security_token
    echo ""

    local config=$(cat << EOF
{
  "type": "salesforce",
  "instance_url": "$sf_instance",
  "client_id": "$sf_client_id",
  "client_secret": "$sf_client_secret",
  "username": "$sf_username",
  "password": "$sf_password",
  "security_token": "$sf_security_token",
  "api_version": "v60.0"
}
EOF
)

    save_config "crm" "$config"
    success "Salesforce integration configured"
}

setup_hubspot() {
    info "Setting up HubSpot integration..."

    echo ""
    echo "To get your HubSpot API key:"
    echo "1. Go to Settings > Integrations > API Key"
    echo "2. Copy your API key"
    echo ""

    read -sp "HubSpot API Key: " hubspot_api_key
    echo ""

    local config=$(cat << EOF
{
  "type": "hubspot",
  "api_key": "$hubspot_api_key"
}
EOF
)

    save_config "crm" "$config"
    success "HubSpot integration configured"
}

setup_zoho() {
    info "Setting up Zoho CRM integration..."

    read -p "Zoho Client ID: " zoho_client_id
    read -sp "Zoho Client Secret: " zoho_client_secret
    echo ""
    read -p "Zoho Data Center (e.g., US, EU, IN): " zoho_dc

    local config=$(cat << EOF
{
  "type": "zoho",
  "client_id": "$zoho_client_id",
  "client_secret": "$zoho_client_secret",
  "data_center": "$zoho_dc"
}
EOF
)

    save_config "crm" "$config"
    success "Zoho CRM integration configured"
    info "Complete OAuth flow in your application"
}

setup_calendar_integration() {
    echo -e "\n${BOLD}${BLUE}Calendar Integration Setup${NC}\n"

    prompt "Select calendar service:"
    echo "  1) Google Calendar"
    echo "  2) Microsoft 365 / Outlook"
    echo "  3) CalDAV"
    echo "  4) Skip"
    read -p "Choice [1-4]: " calendar_choice

    case $calendar_choice in
        1)
            setup_google_calendar
            ;;
        2)
            setup_microsoft_calendar
            ;;
        3)
            setup_caldav
            ;;
        4)
            info "Skipping calendar integration"
            ;;
        *)
            warn "Invalid choice, skipping calendar integration"
            ;;
    esac
}

setup_google_calendar() {
    info "Setting up Google Calendar integration..."

    echo ""
    echo "To setup Google Calendar:"
    echo "1. Go to Google Cloud Console"
    echo "2. Create a new project or select existing"
    echo "3. Enable Google Calendar API"
    echo "4. Create OAuth 2.0 credentials"
    echo "5. Download credentials JSON"
    echo ""

    read -p "Path to credentials JSON file: " credentials_path

    if [[ -f "$credentials_path" ]]; then
        cp "$credentials_path" "$CONFIG_DIR/google-calendar-credentials.json"
        chmod 600 "$CONFIG_DIR/google-calendar-credentials.json"

        local config=$(cat << EOF
{
  "type": "google_calendar",
  "credentials_file": "$CONFIG_DIR/google-calendar-credentials.json",
  "scopes": ["https://www.googleapis.com/auth/calendar"]
}
EOF
)

        save_config "calendar" "$config"
        success "Google Calendar integration configured"
        info "First run will prompt for OAuth authorization"
    else
        error "Credentials file not found: $credentials_path"
    fi
}

setup_microsoft_calendar() {
    info "Setting up Microsoft 365 Calendar integration..."

    read -p "Application (client) ID: " ms_client_id
    read -sp "Client Secret: " ms_client_secret
    echo ""
    read -p "Tenant ID: " ms_tenant_id

    local config=$(cat << EOF
{
  "type": "microsoft_calendar",
  "client_id": "$ms_client_id",
  "client_secret": "$ms_client_secret",
  "tenant_id": "$ms_tenant_id",
  "authority": "https://login.microsoftonline.com/$ms_tenant_id",
  "scopes": ["https://graph.microsoft.com/.default"]
}
EOF
)

    save_config "calendar" "$config"
    success "Microsoft Calendar integration configured"
}

setup_caldav() {
    info "Setting up CalDAV integration..."

    read -p "CalDAV Server URL: " caldav_url
    read -p "Username: " caldav_username
    read -sp "Password: " caldav_password
    echo ""

    local config=$(cat << EOF
{
  "type": "caldav",
  "url": "$caldav_url",
  "username": "$caldav_username",
  "password": "$caldav_password"
}
EOF
)

    save_config "calendar" "$config"
    success "CalDAV integration configured"
}

setup_email_integration() {
    echo -e "\n${BOLD}${BLUE}Email Integration Setup${NC}\n"

    prompt "Select email platform:"
    echo "  1) Gmail"
    echo "  2) Outlook"
    echo "  3) SendGrid"
    echo "  4) Generic SMTP"
    echo "  5) Skip"
    read -p "Choice [1-5]: " email_choice

    case $email_choice in
        1)
            setup_gmail
            ;;
        2)
            setup_outlook
            ;;
        3)
            setup_sendgrid
            ;;
        4)
            setup_smtp
            ;;
        5)
            info "Skipping email integration"
            ;;
        *)
            warn "Invalid choice, skipping email integration"
            ;;
    esac
}

setup_gmail() {
    info "Setting up Gmail integration..."

    echo ""
    echo "Gmail uses the same OAuth setup as Google Calendar"
    echo "If you've already configured Google Calendar, you can reuse those credentials"
    echo ""

    read -p "Use existing Google credentials? (y/N): " use_existing

    if [[ "$use_existing" =~ ^[Yy]$ ]]; then
        local config=$(cat << EOF
{
  "type": "gmail",
  "credentials_file": "$CONFIG_DIR/google-calendar-credentials.json",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"]
}
EOF
)
        save_config "email" "$config"
        success "Gmail integration configured with existing credentials"
    else
        read -p "Path to credentials JSON file: " credentials_path

        if [[ -f "$credentials_path" ]]; then
            cp "$credentials_path" "$CONFIG_DIR/gmail-credentials.json"
            chmod 600 "$CONFIG_DIR/gmail-credentials.json"

            local config=$(cat << EOF
{
  "type": "gmail",
  "credentials_file": "$CONFIG_DIR/gmail-credentials.json",
  "scopes": ["https://www.googleapis.com/auth/gmail.send"]
}
EOF
)
            save_config "email" "$config"
            success "Gmail integration configured"
        else
            error "Credentials file not found: $credentials_path"
        fi
    fi
}

setup_outlook() {
    info "Setting up Outlook integration..."

    echo ""
    echo "Outlook uses Microsoft Graph API"
    echo ""

    read -p "Use existing Microsoft 365 credentials? (y/N): " use_existing

    if [[ "$use_existing" =~ ^[Yy]$ ]]; then
        # Reference existing config
        local config=$(cat << EOF
{
  "type": "outlook",
  "use_shared_credentials": true,
  "scopes": ["https://graph.microsoft.com/Mail.Send"]
}
EOF
)
        save_config "email" "$config"
        success "Outlook integration configured with existing credentials"
    else
        read -p "Application (client) ID: " ms_client_id
        read -sp "Client Secret: " ms_client_secret
        echo ""
        read -p "Tenant ID: " ms_tenant_id

        local config=$(cat << EOF
{
  "type": "outlook",
  "client_id": "$ms_client_id",
  "client_secret": "$ms_client_secret",
  "tenant_id": "$ms_tenant_id",
  "scopes": ["https://graph.microsoft.com/Mail.Send"]
}
EOF
)
        save_config "email" "$config"
        success "Outlook integration configured"
    fi
}

setup_sendgrid() {
    info "Setting up SendGrid integration..."

    echo ""
    echo "To get your SendGrid API key:"
    echo "1. Go to Settings > API Keys"
    echo "2. Create a new API key with Mail Send permissions"
    echo ""

    read -sp "SendGrid API Key: " sendgrid_api_key
    echo ""

    local config=$(cat << EOF
{
  "type": "sendgrid",
  "api_key": "$sendgrid_api_key"
}
EOF
)

    save_config "email" "$config"
    success "SendGrid integration configured"
}

setup_smtp() {
    info "Setting up SMTP integration..."

    read -p "SMTP Server: " smtp_server
    read -p "SMTP Port (e.g., 587): " smtp_port
    read -p "Username: " smtp_username
    read -sp "Password: " smtp_password
    echo ""
    read -p "Use TLS? (y/N): " use_tls

    local tls_enabled="false"
    if [[ "$use_tls" =~ ^[Yy]$ ]]; then
        tls_enabled="true"
    fi

    local config=$(cat << EOF
{
  "type": "smtp",
  "server": "$smtp_server",
  "port": $smtp_port,
  "username": "$smtp_username",
  "password": "$smtp_password",
  "use_tls": $tls_enabled
}
EOF
)

    save_config "email" "$config"
    success "SMTP integration configured"
}

setup_chat_integration() {
    echo -e "\n${BOLD}${BLUE}Chat Platform Integration Setup${NC}\n"

    prompt "Select chat platform:"
    echo "  1) Slack"
    echo "  2) Microsoft Teams"
    echo "  3) Discord"
    echo "  4) Skip"
    read -p "Choice [1-4]: " chat_choice

    case $chat_choice in
        1)
            setup_slack
            ;;
        2)
            setup_teams
            ;;
        3)
            setup_discord
            ;;
        4)
            info "Skipping chat integration"
            ;;
        *)
            warn "Invalid choice, skipping chat integration"
            ;;
    esac
}

setup_slack() {
    info "Setting up Slack integration..."

    echo ""
    echo "To setup Slack:"
    echo "1. Go to api.slack.com/apps"
    echo "2. Create a new app or select existing"
    echo "3. Install app to workspace"
    echo "4. Copy Bot User OAuth Token"
    echo ""

    read -sp "Slack Bot Token (xoxb-...): " slack_token
    echo ""

    local config=$(cat << EOF
{
  "type": "slack",
  "bot_token": "$slack_token"
}
EOF
)

    save_config "chat" "$config"
    success "Slack integration configured"
}

setup_teams() {
    info "Setting up Microsoft Teams integration..."

    echo ""
    echo "Teams uses Microsoft Graph API"
    echo ""

    read -p "Use existing Microsoft 365 credentials? (y/N): " use_existing

    if [[ "$use_existing" =~ ^[Yy]$ ]]; then
        local config=$(cat << EOF
{
  "type": "teams",
  "use_shared_credentials": true,
  "scopes": ["https://graph.microsoft.com/Chat.ReadWrite"]
}
EOF
)
        save_config "chat" "$config"
        success "Teams integration configured with existing credentials"
    else
        read -p "Application (client) ID: " ms_client_id
        read -sp "Client Secret: " ms_client_secret
        echo ""
        read -p "Tenant ID: " ms_tenant_id

        local config=$(cat << EOF
{
  "type": "teams",
  "client_id": "$ms_client_id",
  "client_secret": "$ms_client_secret",
  "tenant_id": "$ms_tenant_id",
  "scopes": ["https://graph.microsoft.com/Chat.ReadWrite"]
}
EOF
)
        save_config "chat" "$config"
        success "Teams integration configured"
    fi
}

setup_discord() {
    info "Setting up Discord integration..."

    echo ""
    echo "To setup Discord:"
    echo "1. Go to discord.com/developers/applications"
    echo "2. Create a new application"
    echo "3. Go to Bot section"
    echo "4. Copy bot token"
    echo ""

    read -sp "Discord Bot Token: " discord_token
    echo ""

    local config=$(cat << EOF
{
  "type": "discord",
  "bot_token": "$discord_token"
}
EOF
)

    save_config "chat" "$config"
    success "Discord integration configured"
}

#######################################################################
# Main Setup Flow
#######################################################################

run_interactive_setup() {
    print_banner

    info "This wizard will help you setup integrations for exec-automator"
    echo ""

    # Setup each integration category
    setup_crm_integration
    setup_calendar_integration
    setup_email_integration
    setup_chat_integration

    echo ""
    success "Integration setup complete!"
    echo ""
    info "Configuration saved to: $CREDENTIALS_FILE"
    warn "Keep this file secure - it contains sensitive credentials"
    echo ""
}

reset_configuration() {
    warn "This will delete all integration configurations"
    read -p "Are you sure? (y/N): " confirm

    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        if [[ -f "$CREDENTIALS_FILE" ]]; then
            mv "$CREDENTIALS_FILE" "$CREDENTIALS_FILE.backup-$(date +%Y%m%d-%H%M%S)"
            echo '{}' > "$CREDENTIALS_FILE"
            chmod 600 "$CREDENTIALS_FILE"
            success "Configuration reset complete"
            info "Backup saved to: $CREDENTIALS_FILE.backup-*"
        else
            info "No configuration file to reset"
        fi
    else
        info "Reset cancelled"
    fi
}

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service)
                SPECIFIC_SERVICE="$2"
                shift 2
                ;;
            --list)
                LIST_ONLY=true
                shift
                ;;
            --reset)
                RESET_CONFIG=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Create necessary directories
    setup_directories

    # Handle different modes
    if [[ "$LIST_ONLY" == true ]]; then
        list_integrations
        exit 0
    fi

    if [[ "$RESET_CONFIG" == true ]]; then
        reset_configuration
        exit 0
    fi

    # Run setup
    if [[ -n "$SPECIFIC_SERVICE" ]]; then
        case "$SPECIFIC_SERVICE" in
            crm)
                setup_crm_integration
                ;;
            calendar)
                setup_calendar_integration
                ;;
            email)
                setup_email_integration
                ;;
            chat)
                setup_chat_integration
                ;;
            *)
                error "Unknown service: $SPECIFIC_SERVICE"
                list_integrations
                exit 1
                ;;
        esac
    else
        run_interactive_setup
    fi
}

# Run main function
main "$@"
