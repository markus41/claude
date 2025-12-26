#!/usr/bin/env bash

# Agent Review Council - Post-Install Hook
# Runs automatically after plugin installation
# Provides interactive setup and quick-start guidance

set -euo pipefail

PLUGIN_DIR="${PLUGIN_DIR:-.claude/plugins/agent-review-council}"
CONFIG_DIR="${HOME}/.claude/council"
CONFIG_FILE="${CONFIG_DIR}/config.json"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC}  ${BOLD}🏛️  Agent Review Council - Installation Complete!${NC}  ${BLUE}║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

print_section() {
  echo -e "\n${CYAN}▸ $1${NC}"
}

print_success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

print_info() {
  echo -e "  ${BLUE}ℹ${NC} $1"
}

print_tip() {
  echo -e "  ${YELLOW}💡${NC} $1"
}

ask_yes_no() {
  local question="$1"
  local default="${2:-y}"

  if [[ "$default" == "y" ]]; then
    prompt="[Y/n]"
  else
    prompt="[y/N]"
  fi

  read -p "$(echo -e "${CYAN}${question} ${prompt}:${NC} ")" response
  response=${response:-$default}

  [[ "${response,,}" =~ ^y(es)?$ ]]
}

# ============================================================================
# Setup Functions
# ============================================================================

create_config_directory() {
  print_section "Creating configuration directory"

  if [[ ! -d "$CONFIG_DIR" ]]; then
    mkdir -p "$CONFIG_DIR"
    print_success "Created $CONFIG_DIR"
  else
    print_info "Directory already exists: $CONFIG_DIR"
  fi
}

generate_default_config() {
  print_section "Generating default configuration"

  if [[ -f "$CONFIG_FILE" ]]; then
    print_info "Config file already exists: $CONFIG_FILE"
    return 0
  fi

  cat > "$CONFIG_FILE" <<'EOF'
{
  "defaultProtocol": "adversarial",
  "defaultPanelSize": "standard",
  "defaultVoting": "super-majority",
  "requireDevilsAdvocate": true,
  "preserveDissent": true,
  "autoConveneOnPR": false,
  "minReviewersForMerge": 3,

  "protocols": {
    "adversarial": { "enabled": true },
    "round-robin": { "enabled": true },
    "red-blue-team": { "enabled": true, "battleRounds": 3 },
    "six-thinking-hats": { "enabled": true, "timePerHat": "5min" },
    "autogen-team": { "enabled": true, "maxIterations": 5 },
    "rapid-fire": { "enabled": true },
    "panel-discussion": { "enabled": true },
    "appreciative-inquiry": { "enabled": true }
  },

  "automation": {
    "autoConvene": {
      "enabled": false,
      "minFiles": 1,
      "minLines": 10,
      "securitySensitivePatterns": [
        "auth", "password", "token", "jwt", "crypto",
        "payment", "billing", "session", "permission"
      ]
    },
    "notifications": {
      "slack": {
        "enabled": false,
        "webhook": "${SLACK_WEBHOOK_URL}"
      }
    }
  }
}
EOF

  print_success "Created default config: $CONFIG_FILE"
}

interactive_setup() {
  print_section "Interactive Setup (Optional)"

  if ! ask_yes_no "Would you like to customize your configuration now?" "n"; then
    print_info "Skipping interactive setup. You can edit $CONFIG_FILE later."
    return 0
  fi

  echo ""
  echo -e "${BOLD}Configuration Options:${NC}"
  echo ""

  # Default protocol
  echo -e "${CYAN}1. Default Protocol${NC}"
  echo "   Choose the deliberation protocol to use by default:"
  echo "   a) adversarial (attacker/defender debate)"
  echo "   b) round-robin (sequential building)"
  echo "   c) red-blue-team (security focus)"
  echo "   d) six-thinking-hats (balanced perspectives)"
  echo "   e) rapid-fire (quick consensus)"
  read -p "   Choice [a]: " protocol_choice
  protocol_choice=${protocol_choice:-a}

  case "$protocol_choice" in
    a) DEFAULT_PROTOCOL="adversarial" ;;
    b) DEFAULT_PROTOCOL="round-robin" ;;
    c) DEFAULT_PROTOCOL="red-blue-team" ;;
    d) DEFAULT_PROTOCOL="six-thinking-hats" ;;
    e) DEFAULT_PROTOCOL="rapid-fire" ;;
    *) DEFAULT_PROTOCOL="adversarial" ;;
  esac

  # Panel size
  echo ""
  echo -e "${CYAN}2. Default Panel Size${NC}"
  echo "   Choose how many agents to use by default:"
  echo "   a) quick (3 agents, ~5 min)"
  echo "   b) standard (5 agents, ~10 min)"
  echo "   c) thorough (7 agents, ~15 min)"
  read -p "   Choice [b]: " size_choice
  size_choice=${size_choice:-b}

  case "$size_choice" in
    a) DEFAULT_SIZE="quick" ;;
    b) DEFAULT_SIZE="standard" ;;
    c) DEFAULT_SIZE="thorough" ;;
    *) DEFAULT_SIZE="standard" ;;
  esac

  # Auto-convene
  echo ""
  if ask_yes_no "3. Enable automatic PR reviews?" "n"; then
    AUTO_CONVENE="true"
  else
    AUTO_CONVENE="false"
  fi

  # Slack notifications
  echo ""
  if ask_yes_no "4. Enable Slack notifications?" "n"; then
    read -p "   Slack webhook URL: " SLACK_WEBHOOK
    SLACK_ENABLED="true"
  else
    SLACK_ENABLED="false"
    SLACK_WEBHOOK=""
  fi

  # Update config file
  print_section "Saving configuration"

  if command -v jq &> /dev/null; then
    tmp_file=$(mktemp)
    jq ".defaultProtocol = \"$DEFAULT_PROTOCOL\" | \
        .defaultPanelSize = \"$DEFAULT_SIZE\" | \
        .automation.autoConvene.enabled = $AUTO_CONVENE | \
        .automation.notifications.slack.enabled = $SLACK_ENABLED | \
        .automation.notifications.slack.webhook = \"$SLACK_WEBHOOK\"" \
        "$CONFIG_FILE" > "$tmp_file"
    mv "$tmp_file" "$CONFIG_FILE"
    print_success "Configuration saved"
  else
    print_info "jq not found, config not updated. Please edit $CONFIG_FILE manually."
  fi
}

create_examples_directory() {
  print_section "Creating examples directory"

  local examples_dir="${CONFIG_DIR}/examples"

  if [[ ! -d "$examples_dir" ]]; then
    mkdir -p "$examples_dir"
  fi

  # Create example review script
  cat > "${examples_dir}/quick-security-review.sh" <<'EOF'
#!/usr/bin/env bash
# Example: Quick Security Review

echo "Running Red/Blue Team security review on auth code..."
/council:review --protocol=red-blue-team --focus=security --files="src/auth/**"
EOF
  chmod +x "${examples_dir}/quick-security-review.sh"

  # Create example config
  cat > "${examples_dir}/example-config.json" <<'EOF'
{
  "// EXAMPLE CONFIG": "Copy this to ~/.claude/council/config.json and customize",

  "defaultProtocol": "red-blue-team",
  "defaultPanelSize": "thorough",
  "autoConveneOnPR": true,

  "automation": {
    "autoConvene": {
      "enabled": true,
      "securitySensitivePatterns": [
        "auth", "password", "payment"
      ]
    },
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "YOUR_SLACK_WEBHOOK_URL"
      }
    }
  }
}
EOF

  print_success "Created example files in $examples_dir"
}

show_quick_start() {
  print_section "Quick Start Guide"

  echo ""
  echo -e "${BOLD}Try these commands to get started:${NC}"
  echo ""

  echo -e "${GREEN}1. Your First Review${NC}"
  echo -e "   ${CYAN}/council:review${NC}"
  echo "   → Reviews your current uncommitted changes"
  echo ""

  echo -e "${GREEN}2. Security Audit${NC}"
  echo -e "   ${CYAN}/council:review --protocol=red-blue-team --focus=security${NC}"
  echo "   → Red team finds vulnerabilities, blue team proposes fixes"
  echo ""

  echo -e "${GREEN}3. Quick Consensus${NC}"
  echo -e "   ${CYAN}/council:review --protocol=rapid-fire --quick${NC}"
  echo "   → Fast review with 30-second critiques (5 min total)"
  echo ""

  echo -e "${GREEN}4. Balanced Perspective${NC}"
  echo -e "   ${CYAN}/council:review --protocol=six-thinking-hats${NC}"
  echo "   → Reviews code from 6 different perspectives"
  echo ""
}

show_resources() {
  print_section "Documentation & Resources"

  echo ""
  print_info "QUICK_START.md - 5-minute getting started guide"
  print_info "README.md - Comprehensive documentation"
  print_info "config.json - Your configuration file"
  echo ""

  echo -e "${BOLD}Available Commands:${NC}"
  echo "  /council:review       - Quick code review"
  echo "  /council:convene      - Advanced review with options"
  echo "  /council:explain      - Learn about protocols"
  echo "  /council:status       - Check council status"
  echo "  /council:history      - View past verdicts"
  echo ""
}

show_next_steps() {
  print_section "Next Steps"

  echo ""
  print_tip "Read QUICK_START.md for a 5-minute tutorial"
  print_tip "Try '/council:review' on your current code"
  print_tip "Explore different protocols with '/council:explain protocols'"
  print_tip "Configure automation in $CONFIG_FILE"
  echo ""
}

run_quick_demo() {
  print_section "Quick Demo (Optional)"

  if ! ask_yes_no "Would you like to see a quick protocol demo?" "n"; then
    return 0
  fi

  echo ""
  echo -e "${BOLD}Protocol Overview:${NC}"
  echo ""

  local protocols=(
    "adversarial:Attacker/Defender debate:Medium:Truth through opposition"
    "round-robin:Sequential building:Medium:Layered insights"
    "red-blue-team:Security audit:Slow:Find & fix vulnerabilities"
    "six-thinking-hats:6 perspectives:Medium:Balanced analysis"
    "rapid-fire:30-sec critiques:Fast:Quick consensus"
    "autogen-team:Manager-workers:Fast:Complex coordination"
  )

  for protocol in "${protocols[@]}"; do
    IFS=':' read -r name desc speed use <<< "$protocol"
    printf "  ${GREEN}%-20s${NC} │ %-25s │ ${CYAN}%-6s${NC} │ %s\n" \
      "$name" "$desc" "$speed" "$use"
  done

  echo ""
  print_info "See README.md for all 20 protocols"
}

# ============================================================================
# Main Installation Flow
# ============================================================================

main() {
  print_header

  print_success "Agent Review Council plugin installed successfully!"
  echo ""
  echo -e "  ${BOLD}20 deliberation protocols${NC}"
  echo -e "  ${BOLD}21 specialized agents${NC}"
  echo -e "  ${BOLD}Production-ready automation${NC}"
  echo ""

  # Setup steps
  create_config_directory
  generate_default_config
  create_examples_directory

  # Interactive configuration
  interactive_setup

  # Guidance
  show_quick_start
  run_quick_demo
  show_resources
  show_next_steps

  # Final message
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}  ${BOLD}Installation Complete! Ready to review code! 🏛️${NC}        ${GREEN}║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${CYAN}Start now:${NC} ${BOLD}/council:review${NC}"
  echo ""
}

# Run main installation flow
main "$@"
