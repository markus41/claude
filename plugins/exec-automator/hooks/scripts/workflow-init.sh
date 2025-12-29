#!/bin/bash
# Workflow Initialization Hook
# Event: SessionStart
# Purpose: Initialize exec-automator workflow state and prepare session for executive analysis
#
# This hook runs at the start of every Claude Code session to ensure the exec-automator
# platform is ready to analyze organizational documents and orchestrate automation workflows.
#
# Brand Voice: Brookside BI - Empowering nonprofits through intelligent automation

set -e

HOOK_NAME="workflow-init"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${PLUGIN_ROOT}/state"
VAULT_PATH="${OBSIDIAN_VAULT_PATH:-${HOME}/obsidian}"
CHECKPOINT_DIR="${VAULT_PATH}/Projects/exec-automator/checkpoints"
ANALYSIS_DIR="${VAULT_PATH}/Projects/exec-automator/analyses"

# Session metadata
SESSION_ID="$(date +%Y%m%d_%H%M%S)_$$"
SESSION_START="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Logging functions
log_info() {
    echo "[${HOOK_NAME}] INFO: $1"
}

log_warn() {
    echo "[${HOOK_NAME}] WARN: $1"
}

log_error() {
    echo "[${HOOK_NAME}] ERROR: $1" >&2
}

log_success() {
    echo "[${HOOK_NAME}] SUCCESS: $1"
}

# Initialize state directory structure
init_state_dirs() {
    log_info "Initializing workflow state directories..."

    # Create state directories
    mkdir -p "${STATE_DIR}"/{sessions,workflows,analyses,temp}

    # Create Obsidian vault structure
    mkdir -p "${CHECKPOINT_DIR}"
    mkdir -p "${ANALYSIS_DIR}"
    mkdir -p "${VAULT_PATH}/Projects/exec-automator/reports"
    mkdir -p "${VAULT_PATH}/Projects/exec-automator/organizations"

    log_success "State directories initialized"
}

# Create session state file
create_session_state() {
    log_info "Creating session state for: ${SESSION_ID}"

    local session_file="${STATE_DIR}/sessions/${SESSION_ID}.json"

    cat > "${session_file}" <<EOF
{
  "session_id": "${SESSION_ID}",
  "start_time": "${SESSION_START}",
  "status": "active",
  "workflow_phase": "idle",
  "documents_analyzed": [],
  "organizations_profiled": [],
  "workflows_generated": [],
  "agents_deployed": [],
  "checkpoints": [],
  "metadata": {
    "plugin_version": "1.0.0",
    "platform": "claude-code",
    "environment": "${CLAUDE_ENV:-development}"
  }
}
EOF

    # Create symlink to current session
    ln -sf "${session_file}" "${STATE_DIR}/sessions/current.json"

    log_success "Session state created: ${session_file}"
}

# Verify MCP server availability
verify_mcp_server() {
    log_info "Verifying exec-automator MCP server..."

    # Check if MCP server script exists
    local mcp_server="${PLUGIN_ROOT}/mcp-server/src/server.py"
    if [ ! -f "${mcp_server}" ]; then
        log_warn "MCP server not found at: ${mcp_server}"
        log_warn "Some automation features may be unavailable"
        return 1
    fi

    # Verify Python dependencies (basic check)
    if ! command -v python3 &> /dev/null; then
        log_warn "Python 3 not found - MCP server cannot run"
        return 1
    fi

    log_success "MCP server verified"
    return 0
}

# Load pattern library
load_pattern_library() {
    log_info "Loading responsibility pattern library..."

    local pattern_lib="${PLUGIN_ROOT}/templates/patterns/responsibility-patterns.json"
    if [ -f "${pattern_lib}" ]; then
        log_success "Pattern library loaded: $(wc -l < "${pattern_lib}") patterns"
    else
        log_warn "Pattern library not found - will use default patterns"
    fi
}

# Check for workflow templates
verify_workflow_templates() {
    log_info "Verifying workflow templates..."

    local templates_dir="${PLUGIN_ROOT}/templates/workflows"
    if [ -d "${templates_dir}" ]; then
        local template_count=$(find "${templates_dir}" -name "*.json" -o -name "*.yaml" | wc -l)
        log_success "Found ${template_count} workflow templates"
    else
        log_warn "Workflow templates directory not found"
    fi
}

# Initialize analysis queue
init_analysis_queue() {
    log_info "Initializing analysis queue..."

    local queue_file="${STATE_DIR}/analyses/queue.json"
    if [ ! -f "${queue_file}" ]; then
        cat > "${queue_file}" <<EOF
{
  "queue_id": "analysis-queue",
  "created_at": "${SESSION_START}",
  "pending": [],
  "in_progress": [],
  "completed": [],
  "failed": []
}
EOF
        log_success "Analysis queue initialized"
    else
        log_info "Using existing analysis queue"
    fi
}

# Display session banner
display_banner() {
    cat <<'EOF'
╔════════════════════════════════════════════════════════════════════╗
║                    Exec-Automator Platform                         ║
║           AI-Powered Executive Director Automation                 ║
║                                                                    ║
║  Analyze. Score. Automate. Transform.                             ║
║                                                                    ║
║  Brookside BI - Empowering nonprofits through intelligent AI      ║
╚════════════════════════════════════════════════════════════════════╝

EOF
    log_info "Session initialized: ${SESSION_ID}"
    log_info "Start time: ${SESSION_START}"
    echo ""
}

# Check for pending analyses from previous sessions
check_pending_work() {
    log_info "Checking for pending work from previous sessions..."

    local queue_file="${STATE_DIR}/analyses/queue.json"
    if [ -f "${queue_file}" ]; then
        local pending_count=$(grep -o '"pending":\s*\[' "${queue_file}" | wc -l)
        local in_progress_count=$(grep -o '"in_progress":\s*\[' "${queue_file}" | wc -l)

        if [ "$pending_count" -gt 0 ] || [ "$in_progress_count" -gt 0 ]; then
            log_warn "Found pending or in-progress analyses from previous sessions"
            log_info "Use /exec:resume to continue previous work"
        fi
    fi
}

# Verify Obsidian vault integration
verify_obsidian_integration() {
    log_info "Verifying Obsidian vault integration..."

    if [ ! -d "${VAULT_PATH}" ]; then
        log_warn "Obsidian vault not found at: ${VAULT_PATH}"
        log_warn "Documentation and checkpoints will be stored locally only"
        return 1
    fi

    # Check if exec-automator project structure exists
    local project_dir="${VAULT_PATH}/Projects/exec-automator"
    if [ ! -d "${project_dir}" ]; then
        log_info "Creating exec-automator project structure in Obsidian vault..."
        mkdir -p "${project_dir}"/{analyses,reports,organizations,checkpoints,workflows}

        # Create README for the project
        cat > "${project_dir}/README.md" <<'EOF'
# Executive Director Automation Platform

This directory contains all analyses, reports, and organizational profiles generated by the Brookside BI Exec-Automator platform.

## Directory Structure

- **analyses/**: Detailed responsibility analyses for organizations
- **reports/**: Executive summaries and automation roadmaps
- **organizations/**: Organizational profiles and metadata
- **checkpoints/**: Session checkpoints and workflow states
- **workflows/**: Generated LangGraph workflows and agent specifications

## Quick Links

- [[System/Claude-Instructions/Orchestration-Protocol]]
- [[Projects/exec-automator/analyses]]
- [[Projects/exec-automator/reports]]

## Tagging Convention

- `#exec-automator` - All exec-automator content
- `#org/[name]` - Organization-specific content
- `#analysis/[type]` - Analysis type (rfp, bylaws, job-description)
- `#automation-score/[range]` - Automation potential (high, medium, low)

---

**Platform:** Brookside BI Exec-Automator
**Version:** 1.0.0
**Generated:** $(date +%Y-%m-%d)
EOF
        log_success "Created Obsidian vault project structure"
    fi

    log_success "Obsidian vault integration verified"
    return 0
}

# Clean up stale temp files
cleanup_stale_files() {
    log_info "Cleaning up stale temporary files..."

    # Remove temp files older than 24 hours
    if [ -d "${STATE_DIR}/temp" ]; then
        find "${STATE_DIR}/temp" -type f -mtime +1 -delete 2>/dev/null || true
    fi

    # Clean up failed sessions older than 7 days
    if [ -d "${STATE_DIR}/sessions" ]; then
        find "${STATE_DIR}/sessions" -name "*.json" -mtime +7 -exec grep -l '"status": "failed"' {} \; -delete 2>/dev/null || true
    fi

    log_success "Cleanup completed"
}

# Display available commands
display_quick_start() {
    cat <<'EOF'

Quick Start Commands:
  /exec:analyze <document>     - Analyze RFP, job description, or bylaws
  /exec:score <org-profile>    - Score automation potential for responsibilities
  /exec:orchestrate <workflow> - Generate and deploy LangGraph workflows
  /exec:dashboard              - View analysis dashboard and metrics
  /exec:simulate <scenario>    - Simulate automation scenarios and ROI

For detailed help: /exec:help

EOF
}

# Main initialization flow
main() {
    display_banner

    # Step 1: Initialize directories
    init_state_dirs

    # Step 2: Create session state
    create_session_state

    # Step 3: Verify MCP server
    verify_mcp_server || true

    # Step 4: Load pattern library
    load_pattern_library

    # Step 5: Verify workflow templates
    verify_workflow_templates

    # Step 6: Initialize analysis queue
    init_analysis_queue

    # Step 7: Verify Obsidian integration
    verify_obsidian_integration || true

    # Step 8: Check for pending work
    check_pending_work

    # Step 9: Clean up stale files
    cleanup_stale_files

    # Step 10: Display quick start guide
    display_quick_start

    log_success "Workflow initialization complete"
    log_info "Ready to analyze organizational documents and automate executive responsibilities"

    # Write initialization marker
    echo "${SESSION_ID}" > "${STATE_DIR}/.initialized"

    return 0
}

# Error handling
trap 'log_error "Workflow initialization failed at line $LINENO"' ERR

# Execute main flow
main "$@"

exit 0
