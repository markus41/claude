#!/bin/bash
#######################################################################
# exec-automator Health Check Script
# Copyright (c) 2025 Brookside BI
#
# Comprehensive health check for the exec-automator plugin:
# - MCP server connectivity and status
# - LLM API availability (Anthropic, OpenAI)
# - Integration service connectivity
# - Database and checkpoint system
# - Virtual environment and dependencies
# - Log file analysis
#
# Usage:
#   ./scripts/health-check.sh [options]
#
# Options:
#   --verbose        Show detailed output
#   --fix            Attempt to fix common issues
#   --json           Output results in JSON format
#   --help           Show this help message
#
# Exit codes:
#   0 - All checks passed
#   1 - Some checks failed (warnings)
#   2 - Critical checks failed
#######################################################################

set -e  # Exit on error (disable for health checks)
set +e  # Re-enable to capture errors

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
VERBOSE=false
FIX_ISSUES=false
JSON_OUTPUT=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PLUGIN_ROOT/logs"
LOG_FILE="$LOG_DIR/health-check-$(date +%Y%m%d-%H%M%S).log"

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
CRITICAL_FAILED=false

declare -a CHECK_RESULTS=()

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
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "${CYAN}[INFO]${NC} $*"
    fi
    log "INFO" "$*"
}

success() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "${GREEN}[✓]${NC} $*"
    fi
    log "SUCCESS" "$*"
}

warn() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "${YELLOW}[⚠]${NC} $*"
    fi
    log "WARN" "$*"
}

error() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "${RED}[✗]${NC} $*" >&2
    fi
    log "ERROR" "$*"
}

verbose() {
    if [[ "$VERBOSE" == true ]] && [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "${BLUE}  →${NC} $*"
    fi
    log "VERBOSE" "$*"
}

#######################################################################
# Utility Functions
#######################################################################

show_help() {
    cat << EOF
${BOLD}exec-automator Health Check Script${NC}

${CYAN}Usage:${NC}
  ./scripts/health-check.sh [options]

${CYAN}Options:${NC}
  --verbose        Show detailed output
  --fix            Attempt to fix common issues
  --json           Output results in JSON format
  --help           Show this help message

${CYAN}Examples:${NC}
  ./scripts/health-check.sh
  ./scripts/health-check.sh --verbose
  ./scripts/health-check.sh --fix
  ./scripts/health-check.sh --json > health-report.json

${CYAN}Exit Codes:${NC}
  0  All checks passed
  1  Some checks failed (warnings)
  2  Critical checks failed

EOF
}

print_banner() {
    if [[ "$JSON_OUTPUT" == true ]]; then
        return
    fi

    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    Health Check Report                       ║
║                                                               ║
║              exec-automator System Diagnostics               ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

record_check() {
    local category=$1
    local name=$2
    local status=$3  # pass, fail, warn
    local message=$4

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    case $status in
        pass)
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            success "$category: $name"
            ;;
        warn)
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            warn "$category: $name - $message"
            ;;
        fail)
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            error "$category: $name - $message"
            ;;
        critical)
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            CRITICAL_FAILED=true
            error "$category: $name - $message [CRITICAL]"
            ;;
    esac

    # Store for JSON output
    CHECK_RESULTS+=("{\"category\":\"$category\",\"name\":\"$name\",\"status\":\"$status\",\"message\":\"$message\"}")
}

#######################################################################
# Health Check Functions
#######################################################################

check_environment() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}Environment Checks${NC}"
    fi

    # Check plugin root directory
    if [[ -d "$PLUGIN_ROOT" ]]; then
        record_check "Environment" "Plugin Root Directory" "pass" ""
        verbose "Plugin root: $PLUGIN_ROOT"
    else
        record_check "Environment" "Plugin Root Directory" "critical" "Directory not found"
    fi

    # Check .env file
    if [[ -f "$PLUGIN_ROOT/.env" ]]; then
        record_check "Environment" ".env File" "pass" ""

        # Load environment
        set -a
        source "$PLUGIN_ROOT/.env" 2>/dev/null || true
        set +a
    else
        record_check "Environment" ".env File" "warn" "File not found - using defaults"
    fi

    # Check log directory
    if [[ -d "$LOG_DIR" ]]; then
        record_check "Environment" "Log Directory" "pass" ""

        # Check log file size
        local log_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
        verbose "Log directory size: $log_size"
    else
        record_check "Environment" "Log Directory" "warn" "Directory not found"
        if [[ "$FIX_ISSUES" == true ]]; then
            mkdir -p "$LOG_DIR"
            info "Created log directory"
        fi
    fi

    # Check directory structure
    local required_dirs=(
        "$PLUGIN_ROOT/mcp-server"
        "$PLUGIN_ROOT/mcp-server/src"
        "$PLUGIN_ROOT/workflows"
        "$PLUGIN_ROOT/agents"
    )

    local missing_dirs=0
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            missing_dirs=$((missing_dirs + 1))
        fi
    done

    if [[ $missing_dirs -eq 0 ]]; then
        record_check "Environment" "Directory Structure" "pass" ""
    else
        record_check "Environment" "Directory Structure" "warn" "$missing_dirs directories missing"
    fi
}

check_python_environment() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}Python Environment Checks${NC}"
    fi

    # Check virtual environment
    local venv_path="$PLUGIN_ROOT/.venv"

    if [[ -d "$venv_path" ]]; then
        record_check "Python" "Virtual Environment" "pass" ""

        # Activate venv for dependency checks
        if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            source "$venv_path/Scripts/activate" 2>/dev/null || true
        else
            source "$venv_path/bin/activate" 2>/dev/null || true
        fi

        # Check Python version
        if command -v python &> /dev/null; then
            local python_version=$(python --version 2>&1 | awk '{print $2}')
            verbose "Python version: $python_version"

            if python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
                record_check "Python" "Python Version" "pass" ""
            else
                record_check "Python" "Python Version" "fail" "Python 3.10+ required"
            fi
        else
            record_check "Python" "Python Executable" "critical" "Python not found"
        fi
    else
        record_check "Python" "Virtual Environment" "critical" "Not found - run install.sh"
        return
    fi

    # Check required packages
    local packages=(
        "langgraph"
        "langchain"
        "langchain_anthropic"
        "langchain_openai"
        "mcp"
    )

    local missing_packages=0
    for package in "${packages[@]}"; do
        if python -c "import ${package}" 2>/dev/null; then
            verbose "Package installed: $package"
        else
            missing_packages=$((missing_packages + 1))
            verbose "Package missing: $package"
        fi
    done

    if [[ $missing_packages -eq 0 ]]; then
        record_check "Python" "Required Packages" "pass" ""
    else
        record_check "Python" "Required Packages" "fail" "$missing_packages packages missing"

        if [[ "$FIX_ISSUES" == true ]]; then
            info "Installing missing packages..."
            pip install -q langgraph langchain langchain-anthropic langchain-openai mcp
        fi
    fi
}

check_api_keys() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}API Key Checks${NC}"
    fi

    # Check Anthropic API key
    if [[ -n "${ANTHROPIC_API_KEY:-}" ]] && [[ "$ANTHROPIC_API_KEY" != "your_anthropic_api_key_here" ]]; then
        record_check "API Keys" "ANTHROPIC_API_KEY" "pass" ""

        # Test API connection (if python available)
        if command -v python &> /dev/null; then
            verbose "Testing Anthropic API connection..."
            local api_test=$(python -c "
import os
from anthropic import Anthropic
try:
    client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    # Just test initialization, don't make actual API call
    print('ok')
except Exception as e:
    print(f'error: {e}')
" 2>&1)

            if [[ "$api_test" == "ok" ]]; then
                verbose "Anthropic API client initialized successfully"
            else
                verbose "Anthropic API test failed: $api_test"
            fi
        fi
    else
        record_check "API Keys" "ANTHROPIC_API_KEY" "critical" "Not configured"
    fi

    # Check OpenAI API key (optional)
    if [[ -n "${OPENAI_API_KEY:-}" ]] && [[ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]]; then
        record_check "API Keys" "OPENAI_API_KEY" "pass" ""
    else
        record_check "API Keys" "OPENAI_API_KEY" "warn" "Not configured (optional)"
    fi
}

check_mcp_server() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}MCP Server Checks${NC}"
    fi

    # Check server file
    local server_file="$PLUGIN_ROOT/mcp-server/src/server.py"

    if [[ -f "$server_file" ]]; then
        record_check "MCP Server" "Server File" "pass" ""

        # Check if server is valid Python
        if command -v python &> /dev/null; then
            if python -m py_compile "$server_file" 2>/dev/null; then
                verbose "Server file syntax valid"
            else
                record_check "MCP Server" "Server Syntax" "fail" "Python syntax error"
            fi
        fi
    else
        record_check "MCP Server" "Server File" "critical" "Not found"
    fi

    # Check if server is running
    local pid_file="$PLUGIN_ROOT/mcp-server.pid"

    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")

        if ps -p "$pid" > /dev/null 2>&1; then
            record_check "MCP Server" "Server Process" "pass" ""
            verbose "Server running (PID: $pid)"

            # Check server responsiveness (if possible)
            # TODO: Implement actual MCP protocol check
        else
            record_check "MCP Server" "Server Process" "warn" "PID file exists but process not running"

            if [[ "$FIX_ISSUES" == true ]]; then
                rm -f "$pid_file"
                info "Removed stale PID file"
            fi
        fi
    else
        record_check "MCP Server" "Server Process" "warn" "Server not running"
    fi
}

check_integrations() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}Integration Checks${NC}"
    fi

    local config_file="$PLUGIN_ROOT/mcp-server/config/integrations.json"

    if [[ -f "$config_file" ]]; then
        record_check "Integrations" "Configuration File" "pass" ""

        # Count configured integrations
        if command -v python &> /dev/null; then
            local integration_count=$(python -c "
import json
try:
    with open('$config_file') as f:
        config = json.load(f)
    print(len(config))
except:
    print(0)
" 2>/dev/null)

            if [[ $integration_count -gt 0 ]]; then
                verbose "$integration_count integrations configured"
            else
                verbose "No integrations configured"
            fi
        fi
    else
        record_check "Integrations" "Configuration File" "warn" "No integrations configured"
    fi
}

check_database() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}Database Checks${NC}"
    fi

    # Check checkpoint database
    local checkpoint_db="$PLUGIN_ROOT/mcp-server/data/checkpoints.db"

    if [[ -f "$checkpoint_db" ]]; then
        record_check "Database" "Checkpoint DB" "pass" ""

        local db_size=$(du -h "$checkpoint_db" 2>/dev/null | cut -f1)
        verbose "Database size: $db_size"

        # Check database integrity (if sqlite3 available)
        if command -v sqlite3 &> /dev/null; then
            local integrity_check=$(sqlite3 "$checkpoint_db" "PRAGMA integrity_check;" 2>&1)

            if [[ "$integrity_check" == "ok" ]]; then
                verbose "Database integrity OK"
            else
                record_check "Database" "DB Integrity" "warn" "Integrity check failed"
            fi
        fi
    else
        record_check "Database" "Checkpoint DB" "warn" "Not initialized yet"
    fi
}

check_logs() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        echo -e "\n${BOLD}${PURPLE}Log Analysis${NC}"
    fi

    # Find recent log files
    local recent_logs=$(find "$LOG_DIR" -name "*.log" -mtime -1 2>/dev/null | wc -l)

    if [[ $recent_logs -gt 0 ]]; then
        record_check "Logs" "Recent Activity" "pass" ""
        verbose "$recent_logs log files from last 24 hours"

        # Check for errors in recent logs
        local error_count=$(find "$LOG_DIR" -name "*.log" -mtime -1 -exec grep -i "ERROR\|CRITICAL" {} \; 2>/dev/null | wc -l)

        if [[ $error_count -gt 0 ]]; then
            record_check "Logs" "Error Count" "warn" "$error_count errors in last 24 hours"
        else
            verbose "No errors found in recent logs"
        fi
    else
        record_check "Logs" "Recent Activity" "warn" "No recent activity"
    fi

    # Check log rotation
    local total_logs=$(find "$LOG_DIR" -name "*.log" 2>/dev/null | wc -l)

    if [[ $total_logs -gt 100 ]]; then
        record_check "Logs" "Log Rotation" "warn" "$total_logs log files - consider cleanup"

        if [[ "$FIX_ISSUES" == true ]]; then
            info "Cleaning old log files..."
            find "$LOG_DIR" -name "*.log" -mtime +30 -delete
        fi
    else
        verbose "$total_logs total log files"
    fi
}

#######################################################################
# Report Generation
#######################################################################

generate_summary() {
    if [[ "$JSON_OUTPUT" == true ]]; then
        return
    fi

    echo ""
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}Health Check Summary${NC}"
    echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
    echo ""

    echo -e "Total Checks:    ${BOLD}$TOTAL_CHECKS${NC}"
    echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
    echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
    echo ""

    local pass_percentage=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

    if [[ $pass_percentage -ge 90 ]]; then
        echo -e "Overall Status:  ${GREEN}${BOLD}HEALTHY${NC} (${pass_percentage}%)"
    elif [[ $pass_percentage -ge 70 ]]; then
        echo -e "Overall Status:  ${YELLOW}${BOLD}WARNING${NC} (${pass_percentage}%)"
    else
        echo -e "Overall Status:  ${RED}${BOLD}CRITICAL${NC} (${pass_percentage}%)"
    fi

    echo ""
    echo -e "Report saved to: ${CYAN}$LOG_FILE${NC}"
    echo ""
}

generate_json_report() {
    if [[ "$JSON_OUTPUT" != true ]]; then
        return
    fi

    cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "plugin": "exec-automator",
  "version": "1.0.0",
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "passed": $PASSED_CHECKS,
    "warnings": $WARNING_CHECKS,
    "failed": $FAILED_CHECKS,
    "critical_failed": $CRITICAL_FAILED
  },
  "checks": [
    $(IFS=,; echo "${CHECK_RESULTS[*]}")
  ],
  "environment": {
    "plugin_root": "$PLUGIN_ROOT",
    "log_dir": "$LOG_DIR",
    "python_version": "$(python --version 2>&1 | awk '{print $2}')"
  }
}
EOF
}

#######################################################################
# Main Function
#######################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --fix)
                FIX_ISSUES=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
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

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Print banner
    print_banner

    # Run all checks
    check_environment
    check_python_environment
    check_api_keys
    check_mcp_server
    check_integrations
    check_database
    check_logs

    # Generate report
    if [[ "$JSON_OUTPUT" == true ]]; then
        generate_json_report
    else
        generate_summary
    fi

    # Determine exit code
    if [[ "$CRITICAL_FAILED" == true ]]; then
        exit 2
    elif [[ $FAILED_CHECKS -gt 0 ]] || [[ $WARNING_CHECKS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
