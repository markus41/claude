#!/bin/bash
#######################################################################
# exec-automator MCP Server Startup Script
# Copyright (c) 2025 Brookside BI
#
# Activates virtual environment, sets environment variables, and
# launches the MCP server for the exec-automator Claude Code plugin.
#
# Features:
# - Virtual environment activation
# - Environment variable loading
# - Process management (PID tracking)
# - Log rotation
# - Graceful shutdown handling
#
# Usage:
#   ./scripts/start-mcp.sh [options]
#
# Options:
#   --daemon         Run server as background daemon
#   --port PORT      Override default port
#   --debug          Enable debug logging
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
DAEMON_MODE=false
DEBUG_MODE=false
SERVER_PORT=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PLUGIN_ROOT/logs"
PID_FILE="$PLUGIN_ROOT/mcp-server.pid"
LOG_FILE="$LOG_DIR/mcp-server-$(date +%Y%m%d).log"

#######################################################################
# Logging Functions
#######################################################################

info() {
    echo -e "${CYAN}[INFO]${NC} $*"
    log_to_file "INFO" "$*"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
    log_to_file "SUCCESS" "$*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    log_to_file "WARN" "$*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
    log_to_file "ERROR" "$*"
}

log_to_file() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

#######################################################################
# Utility Functions
#######################################################################

show_help() {
    cat << EOF
${BOLD}exec-automator MCP Server Startup Script${NC}

${CYAN}Usage:${NC}
  ./scripts/start-mcp.sh [options]

${CYAN}Options:${NC}
  --daemon         Run server as background daemon
  --port PORT      Override default port (default: 8765)
  --debug          Enable debug logging
  --help           Show this help message

${CYAN}Examples:${NC}
  ./scripts/start-mcp.sh
  ./scripts/start-mcp.sh --daemon
  ./scripts/start-mcp.sh --port 9000 --debug

${CYAN}Process Management:${NC}
  Start:    ./scripts/start-mcp.sh --daemon
  Stop:     kill \$(cat mcp-server.pid)
  Status:   ps -p \$(cat mcp-server.pid)

${CYAN}Logs:${NC}
  Server logs:  $LOG_DIR/mcp-server-YYYYMMDD.log
  Error logs:   $LOG_DIR/errors.log

EOF
}

check_server_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Server is running
        else
            # PID file exists but process is dead
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1  # No PID file
}

#######################################################################
# Environment Setup
#######################################################################

setup_environment() {
    info "Setting up environment..."

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Load environment variables from .env file
    local env_file="$PLUGIN_ROOT/.env"
    if [[ -f "$env_file" ]]; then
        info "Loading environment from $env_file"
        set -a
        source "$env_file"
        set +a
        success "Environment variables loaded"
    else
        warn "No .env file found at $env_file"
        warn "Server will use environment defaults"
    fi

    # Validate required variables
    if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
        error "ANTHROPIC_API_KEY not set in environment"
        error "Please configure .env file or export ANTHROPIC_API_KEY"
        exit 1
    fi

    # Set port if overridden
    if [[ -n "$SERVER_PORT" ]]; then
        export MCP_SERVER_PORT="$SERVER_PORT"
        info "Using port: $SERVER_PORT"
    fi

    # Set debug mode if enabled
    if [[ "$DEBUG_MODE" == true ]]; then
        export LOG_LEVEL="DEBUG"
        export DEBUG="true"
        info "Debug mode enabled"
    fi
}

activate_venv() {
    info "Activating virtual environment..."

    local venv_path="$PLUGIN_ROOT/.venv"

    if [[ ! -d "$venv_path" ]]; then
        error "Virtual environment not found at $venv_path"
        error "Please run ./scripts/install.sh first"
        exit 1
    fi

    # Detect OS and activate accordingly
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash, MSYS2)
        source "$venv_path/Scripts/activate"
    else
        # Linux, macOS
        source "$venv_path/bin/activate"
    fi

    success "Virtual environment activated: $(which python)"
}

#######################################################################
# Server Management
#######################################################################

check_dependencies() {
    info "Checking dependencies..."

    local required_packages=(
        "langgraph"
        "langchain"
        "mcp"
    )

    local missing_packages=()

    for package in "${required_packages[@]}"; do
        if ! python -c "import ${package}" 2>/dev/null; then
            missing_packages+=("$package")
        fi
    done

    if [[ ${#missing_packages[@]} -gt 0 ]]; then
        error "Missing required packages: ${missing_packages[*]}"
        error "Please run ./scripts/install.sh to install dependencies"
        exit 1
    fi

    success "All dependencies available"
}

start_server_foreground() {
    info "Starting MCP server in foreground mode..."

    local server_file="$PLUGIN_ROOT/mcp-server/src/server.py"

    if [[ ! -f "$server_file" ]]; then
        error "Server file not found: $server_file"
        exit 1
    fi

    echo ""
    echo -e "${PURPLE}${BOLD}╔═══════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}${BOLD}║   exec-automator MCP Server                  ║${NC}"
    echo -e "${PURPLE}${BOLD}║   Press Ctrl+C to stop                       ║${NC}"
    echo -e "${PURPLE}${BOLD}╚═══════════════════════════════════════════════╝${NC}"
    echo ""

    info "Server log: $LOG_FILE"
    info "Process ID: $$"
    echo $$ > "$PID_FILE"

    # Start server with output to both console and log
    python "$server_file" 2>&1 | tee -a "$LOG_FILE"

    # Cleanup on exit
    rm -f "$PID_FILE"
}

start_server_daemon() {
    info "Starting MCP server in daemon mode..."

    local server_file="$PLUGIN_ROOT/mcp-server/src/server.py"

    if [[ ! -f "$server_file" ]]; then
        error "Server file not found: $server_file"
        exit 1
    fi

    # Start server in background
    nohup python "$server_file" >> "$LOG_FILE" 2>&1 &
    local pid=$!

    # Save PID
    echo $pid > "$PID_FILE"

    # Wait a moment and check if process is still running
    sleep 2

    if ps -p $pid > /dev/null 2>&1; then
        success "MCP server started successfully"
        info "Process ID: $pid"
        info "Server log: $LOG_FILE"
        info ""
        info "To stop the server:"
        info "  kill $pid"
        info "  or: kill \$(cat $PID_FILE)"
    else
        error "Server failed to start"
        error "Check logs: $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

#######################################################################
# Main Function
#######################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --daemon)
                DAEMON_MODE=true
                shift
                ;;
            --port)
                SERVER_PORT="$2"
                shift 2
                ;;
            --debug)
                DEBUG_MODE=true
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

    # Check if server is already running
    if check_server_running; then
        local pid=$(cat "$PID_FILE")
        error "MCP server is already running (PID: $pid)"
        error "Stop the existing server first:"
        error "  kill $pid"
        exit 1
    fi

    # Setup environment
    setup_environment

    # Activate virtual environment
    activate_venv

    # Check dependencies
    check_dependencies

    # Start server
    if [[ "$DAEMON_MODE" == true ]]; then
        start_server_daemon
    else
        start_server_foreground
    fi
}

# Trap SIGINT and SIGTERM for graceful shutdown
trap 'echo -e "\n${YELLOW}Shutting down server...${NC}"; rm -f "$PID_FILE"; exit 0' SIGINT SIGTERM

# Run main function
main "$@"
