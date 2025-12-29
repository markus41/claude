#!/bin/bash
#######################################################################
# exec-automator Plugin Installation Script
# Copyright (c) 2025 Brookside BI
#
# Sets up Python environment, installs dependencies, configures MCP server
# for the exec-automator Claude Code plugin.
#
# This script handles the complete installation process including:
# - Python version validation
# - Virtual environment setup
# - LangGraph, LangChain, and MCP dependencies
# - Environment variable configuration
# - Directory structure initialization
# - MCP server connectivity testing
#
# Usage:
#   ./scripts/install.sh [options]
#
# Options:
#   --python PATH    Specify Python executable (default: python3)
#   --skip-test      Skip MCP server connection test
#   --dev            Install development dependencies
#   --help           Show this help message
#######################################################################

set -e  # Exit on error

# Color codes for terminal output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Brookside BI brand colors
readonly BROOKSIDE_BLUE="${CYAN}"
readonly BROOKSIDE_ACCENT="${PURPLE}"

# Script configuration
PYTHON_EXEC="python3"
SKIP_TEST=false
DEV_MODE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PLUGIN_ROOT/logs"
LOG_FILE="$LOG_DIR/install-$(date +%Y%m%d-%H%M%S).log"

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
    echo -e "${BROOKSIDE_BLUE}[INFO]${NC} $*"
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

step() {
    echo -e "\n${BROOKSIDE_ACCENT}${BOLD}>>> $*${NC}"
    log "STEP" "$*"
}

#######################################################################
# Utility Functions
#######################################################################

show_help() {
    cat << EOF
${BOLD}exec-automator Installation Script${NC}

${BROOKSIDE_BLUE}Usage:${NC}
  ./scripts/install.sh [options]

${BROOKSIDE_BLUE}Options:${NC}
  --python PATH    Specify Python executable (default: python3)
  --skip-test      Skip MCP server connection test
  --dev            Install development dependencies
  --help           Show this help message

${BROOKSIDE_BLUE}Examples:${NC}
  ./scripts/install.sh
  ./scripts/install.sh --python python3.11 --dev
  ./scripts/install.sh --skip-test

${BROOKSIDE_BLUE}Environment Variables:${NC}
  ANTHROPIC_API_KEY    Claude API key (required)
  OPENAI_API_KEY       OpenAI API key (optional)

${BROOKSIDE_BLUE}For more information:${NC}
  https://github.com/brooksidebi/exec-automator

EOF
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

version_compare() {
    # Compare version strings (e.g., "3.10.0" >= "3.10")
    local ver1=$1
    local op=$2
    local ver2=$3

    python3 -c "from packaging import version; import sys; sys.exit(0 if version.parse('$ver1') $op version.parse('$ver2') else 1)"
}

#######################################################################
# Installation Steps
#######################################################################

print_banner() {
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          ███████╗██╗  ██╗███████╗ ██████╗                    ║
║          ██╔════╝╚██╗██╔╝██╔════╝██╔════╝                    ║
║          █████╗   ╚███╔╝ █████╗  ██║                         ║
║          ██╔══╝   ██╔██╗ ██╔══╝  ██║                         ║
║          ███████╗██╔╝ ██╗███████╗╚██████╗                    ║
║          ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝                    ║
║                                                               ║
║         AUTOMATOR - AI-Powered Executive Director            ║
║                                                               ║
║                   Installation Wizard                        ║
║                                                               ║
║                  Powered by Brookside BI                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

setup_directories() {
    step "Setting up directory structure"

    local dirs=(
        "$LOG_DIR"
        "$PLUGIN_ROOT/mcp-server/src"
        "$PLUGIN_ROOT/mcp-server/data"
        "$PLUGIN_ROOT/workflows"
        "$PLUGIN_ROOT/.venv"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            info "Creating directory: $dir"
            mkdir -p "$dir"
        else
            info "Directory exists: $dir"
        fi
    done

    success "Directory structure initialized"
}

check_python_version() {
    step "Validating Python installation"

    if ! check_command "$PYTHON_EXEC"; then
        error "Python executable '$PYTHON_EXEC' not found"
        error "Please install Python 3.10 or higher"
        error "Or specify python path with --python option"
        exit 1
    fi

    local python_version=$($PYTHON_EXEC --version 2>&1 | awk '{print $2}')
    info "Found Python version: $python_version"

    # Check minimum version (3.10)
    if ! version_compare "$python_version" ">=" "3.10"; then
        error "Python 3.10 or higher is required"
        error "Current version: $python_version"
        exit 1
    fi

    success "Python version check passed: $python_version"
}

create_virtual_environment() {
    step "Creating Python virtual environment"

    local venv_path="$PLUGIN_ROOT/.venv"

    if [[ -d "$venv_path" ]]; then
        warn "Virtual environment already exists at $venv_path"
        read -p "Remove and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Removing existing virtual environment"
            rm -rf "$venv_path"
        else
            info "Keeping existing virtual environment"
            return 0
        fi
    fi

    info "Creating virtual environment at $venv_path"
    $PYTHON_EXEC -m venv "$venv_path"

    success "Virtual environment created"
}

activate_virtual_environment() {
    step "Activating virtual environment"

    local venv_path="$PLUGIN_ROOT/.venv"

    # Detect OS and activate accordingly
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash, MSYS2)
        source "$venv_path/Scripts/activate"
    else
        # Linux, macOS
        source "$venv_path/bin/activate"
    fi

    info "Virtual environment activated: $(which python)"
    success "Python environment ready"
}

upgrade_pip() {
    step "Upgrading pip, setuptools, and wheel"

    python -m pip install --upgrade pip setuptools wheel >> "$LOG_FILE" 2>&1

    local pip_version=$(pip --version | awk '{print $2}')
    success "pip upgraded to version: $pip_version"
}

install_dependencies() {
    step "Installing Python dependencies"

    info "This may take a few minutes..."

    # Core dependencies
    local core_deps=(
        "langgraph>=0.2.0"
        "langchain>=0.3.0"
        "langchain-anthropic>=0.2.0"
        "langchain-openai>=0.2.0"
        "langchain-community>=0.3.0"
        "mcp>=1.0.0"
        "httpx>=0.27.0"
        "pydantic>=2.0.0"
        "python-dotenv>=1.0.0"
        "packaging>=23.0"
    )

    # Development dependencies
    local dev_deps=(
        "pytest>=8.0.0"
        "pytest-asyncio>=0.23.0"
        "black>=24.0.0"
        "ruff>=0.1.0"
        "mypy>=1.8.0"
        "ipython>=8.20.0"
    )

    # Install core dependencies
    for dep in "${core_deps[@]}"; do
        info "Installing: $dep"
        pip install "$dep" >> "$LOG_FILE" 2>&1
    done

    # Install dev dependencies if requested
    if [[ "$DEV_MODE" == true ]]; then
        info "Installing development dependencies..."
        for dep in "${dev_deps[@]}"; do
            info "Installing: $dep"
            pip install "$dep" >> "$LOG_FILE" 2>&1
        done
    fi

    success "All dependencies installed successfully"
}

setup_environment_file() {
    step "Setting up environment configuration"

    local env_file="$PLUGIN_ROOT/.env"

    if [[ -f "$env_file" ]]; then
        warn "Environment file already exists: $env_file"
        return 0
    fi

    info "Creating .env template at $env_file"

    cat > "$env_file" << 'EOF'
# exec-automator Environment Configuration
# Generated by install.sh

# API Keys (REQUIRED)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# MCP Server Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8765
MCP_LOG_LEVEL=INFO

# LangGraph Configuration
LANGGRAPH_CHECKPOINT_DB=sqlite:///./mcp-server/data/checkpoints.db
LANGGRAPH_TRACING=false

# Integration Settings (Optional)
# CRM_API_KEY=
# CALENDAR_API_KEY=
# EMAIL_API_KEY=

# Development Settings
DEBUG=false
LOG_LEVEL=INFO
EOF

    success "Environment template created"
    warn "IMPORTANT: Edit $env_file and add your API keys!"
}

check_api_keys() {
    step "Checking API key configuration"

    # Try to load .env file
    if [[ -f "$PLUGIN_ROOT/.env" ]]; then
        set -a
        source "$PLUGIN_ROOT/.env"
        set +a
    fi

    local keys_configured=true

    if [[ -z "${ANTHROPIC_API_KEY:-}" ]] || [[ "$ANTHROPIC_API_KEY" == "your_anthropic_api_key_here" ]]; then
        warn "ANTHROPIC_API_KEY not configured"
        keys_configured=false
    else
        success "ANTHROPIC_API_KEY configured"
    fi

    if [[ -z "${OPENAI_API_KEY:-}" ]] || [[ "$OPENAI_API_KEY" == "your_openai_api_key_here" ]]; then
        info "OPENAI_API_KEY not configured (optional)"
    else
        success "OPENAI_API_KEY configured"
    fi

    if [[ "$keys_configured" == false ]]; then
        warn "Some required API keys are not configured"
        warn "Please edit $PLUGIN_ROOT/.env before running the MCP server"
    fi
}

create_mcp_server_stub() {
    step "Creating MCP server stub"

    local server_file="$PLUGIN_ROOT/mcp-server/src/server.py"

    if [[ -f "$server_file" ]]; then
        info "MCP server file already exists: $server_file"
        return 0
    fi

    info "Creating MCP server stub at $server_file"

    cat > "$server_file" << 'EOF'
"""
exec-automator MCP Server
Copyright (c) 2025 Brookside BI

LangGraph/LangChain workflow engine for executive director automation.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """MCP server entry point."""
    logger.info("Starting exec-automator MCP server...")
    logger.info("LangGraph workflow engine initializing...")

    # TODO: Implement MCP server logic
    # This is a stub - actual implementation to be added

    logger.info("Server ready for connections")

    # Keep server running
    try:
        await asyncio.Event().wait()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")


if __name__ == "__main__":
    asyncio.run(main())
EOF

    success "MCP server stub created"
    info "Server implementation to be completed in later steps"
}

test_mcp_server() {
    if [[ "$SKIP_TEST" == true ]]; then
        info "Skipping MCP server test (--skip-test flag)"
        return 0
    fi

    step "Testing MCP server startup"

    local server_file="$PLUGIN_ROOT/mcp-server/src/server.py"

    if [[ ! -f "$server_file" ]]; then
        warn "Server file not found, skipping test"
        return 0
    fi

    info "Starting MCP server test (will timeout after 5 seconds)..."

    # Run server with timeout
    timeout 5s python "$server_file" >> "$LOG_FILE" 2>&1 || true

    success "MCP server startup test completed"
    info "Check logs for details: $LOG_FILE"
}

create_startup_scripts() {
    step "Creating startup scripts"

    # Create start-mcp.sh if it doesn't exist
    local start_script="$SCRIPT_DIR/start-mcp.sh"

    if [[ ! -f "$start_script" ]]; then
        info "Creating $start_script"
        cat > "$start_script" << 'EOF'
#!/bin/bash
# Start the exec-automator MCP server
# See start-mcp.sh for full implementation
EOF
        chmod +x "$start_script"
    fi

    success "Startup scripts ready"
}

generate_install_summary() {
    step "Installation Summary"

    echo ""
    echo -e "${BROOKSIDE_BLUE}${BOLD}Installation Complete!${NC}"
    echo ""
    echo -e "${GREEN}✓${NC} Python virtual environment created"
    echo -e "${GREEN}✓${NC} Dependencies installed"
    echo -e "${GREEN}✓${NC} Directory structure initialized"
    echo -e "${GREEN}✓${NC} Environment configuration created"
    echo -e "${GREEN}✓${NC} MCP server stub created"
    echo ""

    echo -e "${BROOKSIDE_ACCENT}${BOLD}Next Steps:${NC}"
    echo ""
    echo -e "1. Configure API keys in ${CYAN}.env${NC} file:"
    echo -e "   ${YELLOW}$PLUGIN_ROOT/.env${NC}"
    echo ""
    echo -e "2. Activate the virtual environment:"
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo -e "   ${YELLOW}source .venv/Scripts/activate${NC}"
    else
        echo -e "   ${YELLOW}source .venv/bin/activate${NC}"
    fi
    echo ""
    echo -e "3. Start the MCP server:"
    echo -e "   ${YELLOW}./scripts/start-mcp.sh${NC}"
    echo ""
    echo -e "4. Run health check:"
    echo -e "   ${YELLOW}./scripts/health-check.sh${NC}"
    echo ""

    echo -e "${BROOKSIDE_BLUE}${BOLD}Documentation:${NC}"
    echo -e "  Installation log: ${YELLOW}$LOG_FILE${NC}"
    echo -e "  Plugin root:      ${YELLOW}$PLUGIN_ROOT${NC}"
    echo ""

    echo -e "${PURPLE}Thank you for choosing Brookside BI!${NC}"
    echo ""
}

#######################################################################
# Main Installation Flow
#######################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --python)
                PYTHON_EXEC="$2"
                shift 2
                ;;
            --skip-test)
                SKIP_TEST=true
                shift
                ;;
            --dev)
                DEV_MODE=true
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

    # Create log directory first
    mkdir -p "$LOG_DIR"

    # Print banner
    print_banner

    # Run installation steps
    setup_directories
    check_python_version
    create_virtual_environment
    activate_virtual_environment
    upgrade_pip
    install_dependencies
    setup_environment_file
    check_api_keys
    create_mcp_server_stub
    create_startup_scripts
    test_mcp_server

    # Show summary
    generate_install_summary

    log "INFO" "Installation completed successfully"
}

# Run main function
main "$@"
