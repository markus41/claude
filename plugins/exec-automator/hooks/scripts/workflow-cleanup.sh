#!/bin/bash
# Workflow Cleanup Hook
# Event: SessionEnd
# Purpose: Checkpoint workflow state, archive analysis results, and clean up session data
#
# This hook runs at the end of every Claude Code session to preserve workflow state,
# archive completed analyses to the Obsidian vault, and clean up temporary files.
# It ensures no work is lost and the platform is ready for the next session.
#
# Brand Voice: Brookside BI - Empowering nonprofits through intelligent automation

set -e

HOOK_NAME="workflow-cleanup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${PLUGIN_ROOT}/state"
VAULT_PATH="${OBSIDIAN_VAULT_PATH:-${HOME}/obsidian}"
CHECKPOINT_DIR="${VAULT_PATH}/Projects/exec-automator/checkpoints"
ANALYSIS_DIR="${VAULT_PATH}/Projects/exec-automator/analyses"

# Session metadata
SESSION_END="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

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

# Get current session ID
get_session_id() {
    if [ -f "${STATE_DIR}/sessions/current.json" ]; then
        # Extract session_id from JSON (simplified - in production use jq)
        grep -o '"session_id": "[^"]*"' "${STATE_DIR}/sessions/current.json" | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Calculate session duration
calculate_session_duration() {
    local session_file="${STATE_DIR}/sessions/current.json"
    if [ ! -f "$session_file" ]; then
        echo "0"
        return
    fi

    # Extract start time (simplified - in production use jq)
    local start_time=$(grep -o '"start_time": "[^"]*"' "$session_file" | cut -d'"' -f4)
    if [ -z "$start_time" ]; then
        echo "0"
        return
    fi

    # Calculate duration in seconds (simplified)
    # In production, use proper date arithmetic
    local start_epoch=$(date -d "$start_time" +%s 2>/dev/null || echo "0")
    local end_epoch=$(date -d "$SESSION_END" +%s 2>/dev/null || echo "0")
    local duration=$((end_epoch - start_epoch))

    echo "$duration"
}

# Create session checkpoint
create_checkpoint() {
    local session_id="$1"

    log_info "Creating checkpoint for session: ${session_id}"

    # Create checkpoint directory
    local checkpoint_path="${CHECKPOINT_DIR}/${session_id}"
    mkdir -p "$checkpoint_path"

    # Copy session state
    if [ -f "${STATE_DIR}/sessions/current.json" ]; then
        cp "${STATE_DIR}/sessions/current.json" "${checkpoint_path}/session-state.json"
    fi

    # Copy workflow state
    if [ -f "${STATE_DIR}/temp/current-phase.txt" ]; then
        cp "${STATE_DIR}/temp/current-phase.txt" "${checkpoint_path}/workflow-phase.txt"
    fi

    # Copy execution logs
    if [ -f "${STATE_DIR}/temp/tool-usage.log" ]; then
        cp "${STATE_DIR}/temp/tool-usage.log" "${checkpoint_path}/tool-usage.log"
    fi

    # Copy MCP usage logs
    if [ -f "${STATE_DIR}/temp/mcp-usage.log" ]; then
        cp "${STATE_DIR}/temp/mcp-usage.log" "${checkpoint_path}/mcp-usage.log"
    fi

    # Copy phase transitions
    if [ -f "${STATE_DIR}/workflows/phase-transitions.log" ]; then
        cp "${STATE_DIR}/workflows/phase-transitions.log" "${checkpoint_path}/phase-transitions.log"
    fi

    # Copy error logs
    if [ -f "${STATE_DIR}/temp/errors.log" ]; then
        cp "${STATE_DIR}/temp/errors.log" "${checkpoint_path}/errors.log"
    fi

    # Create checkpoint metadata
    cat > "${checkpoint_path}/checkpoint-metadata.json" <<EOF
{
  "session_id": "${session_id}",
  "checkpoint_time": "${SESSION_END}",
  "session_duration_seconds": $(calculate_session_duration),
  "workflow_phase": "$(cat "${STATE_DIR}/temp/current-phase.txt" 2>/dev/null || echo "unknown")",
  "progress_percent": $(cat "${STATE_DIR}/temp/progress.txt" 2>/dev/null || echo "0"),
  "tool_invocations": $(wc -l < "${STATE_DIR}/temp/tool-usage.log" 2>/dev/null || echo "0"),
  "errors_encountered": $(cat "${STATE_DIR}/temp/error-count.txt" 2>/dev/null || echo "0"),
  "checkpoint_location": "${checkpoint_path}"
}
EOF

    log_success "Checkpoint created: ${checkpoint_path}"
}

# Archive completed analyses
archive_analyses() {
    log_info "Archiving completed analyses..."

    # Check for completed analysis outputs in temp/state directories
    local analyses_archived=0

    # Look for generated profiles
    if [ -d "${STATE_DIR}/analyses" ]; then
        for profile in "${STATE_DIR}/analyses"/*.json; do
            if [ -f "$profile" ]; then
                local profile_name=$(basename "$profile")
                local org_name=$(grep -o '"name": "[^"]*"' "$profile" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "unknown")

                # Create organization directory
                local org_dir="${ANALYSIS_DIR}/${org_name}"
                mkdir -p "$org_dir"

                # Copy profile to archive
                cp "$profile" "${org_dir}/${profile_name}"
                log_info "Archived analysis: ${profile_name} → ${org_dir}"

                analyses_archived=$((analyses_archived + 1))
            fi
        done
    fi

    # Archive reports
    if [ -d "${STATE_DIR}/temp" ]; then
        for report in "${STATE_DIR}/temp"/*-report.md; do
            if [ -f "$report" ]; then
                local report_name=$(basename "$report")
                cp "$report" "${VAULT_PATH}/Projects/exec-automator/reports/"
                log_info "Archived report: ${report_name}"
                analyses_archived=$((analyses_archived + 1))
            fi
        done
    fi

    if [ "$analyses_archived" -gt 0 ]; then
        log_success "Archived ${analyses_archived} analysis artifacts"
    else
        log_info "No completed analyses to archive"
    fi
}

# Update session state to completed
finalize_session() {
    local session_id="$1"
    local duration="$2"

    log_info "Finalizing session: ${session_id}"

    local session_file="${STATE_DIR}/sessions/${session_id}.json"
    if [ -f "$session_file" ]; then
        # Update session status to completed
        # In production, use jq for proper JSON manipulation
        sed -i 's/"status": "active"/"status": "completed"/' "$session_file" 2>/dev/null || true
        log_success "Session finalized"
    fi
}

# Clean up temporary files
cleanup_temp_files() {
    log_info "Cleaning up temporary files..."

    # Remove temporary analysis files
    if [ -d "${STATE_DIR}/temp" ]; then
        # Keep logs but remove working files
        rm -f "${STATE_DIR}/temp"/*.tmp 2>/dev/null || true
        rm -f "${STATE_DIR}/temp"/*.lock 2>/dev/null || true
    fi

    # Clear current session symlink
    rm -f "${STATE_DIR}/sessions/current.json" 2>/dev/null || true

    log_success "Temporary files cleaned"
}

# Generate session summary
generate_session_summary() {
    local session_id="$1"
    local duration="$2"

    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Session Summary: ${session_id}"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Duration
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    log_info "Session duration: ${hours}h ${minutes}m ${seconds}s"

    # Workflow phase reached
    if [ -f "${STATE_DIR}/temp/current-phase.txt" ]; then
        local phase=$(cat "${STATE_DIR}/temp/current-phase.txt")
        log_info "Workflow phase reached: ${phase}"
    fi

    # Progress
    if [ -f "${STATE_DIR}/temp/progress.txt" ]; then
        local progress=$(cat "${STATE_DIR}/temp/progress.txt")
        log_info "Overall progress: ${progress}%"
    fi

    # Tool usage
    if [ -f "${STATE_DIR}/temp/tool-usage.log" ]; then
        local tool_count=$(wc -l < "${STATE_DIR}/temp/tool-usage.log")
        log_info "Tool invocations: ${tool_count}"
    fi

    # MCP usage
    if [ -f "${STATE_DIR}/temp/mcp-usage.log" ]; then
        local mcp_count=$(wc -l < "${STATE_DIR}/temp/mcp-usage.log")
        log_info "MCP tool invocations: ${mcp_count}"
    fi

    # Errors
    if [ -f "${STATE_DIR}/temp/error-count.txt" ]; then
        local errors=$(cat "${STATE_DIR}/temp/error-count.txt")
        if [ "$errors" -gt 0 ]; then
            log_warn "Errors encountered: ${errors}"
        else
            log_success "No errors encountered"
        fi
    fi

    # Analyses completed
    if [ -d "${STATE_DIR}/analyses" ]; then
        local analysis_count=$(find "${STATE_DIR}/analyses" -name "*.json" | wc -l)
        if [ "$analysis_count" -gt 0 ]; then
            log_success "Analyses completed: ${analysis_count}"
        fi
    fi

    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Create session archive summary in Obsidian
create_vault_summary() {
    local session_id="$1"
    local duration="$2"

    log_info "Creating vault summary document..."

    local summary_file="${VAULT_PATH}/Projects/exec-automator/checkpoints/${session_id}/SESSION-SUMMARY.md"
    mkdir -p "$(dirname "$summary_file")"

    cat > "$summary_file" <<EOF
---
title: Session Summary - ${session_id}
session_id: ${session_id}
start_time: $(grep -o '"start_time": "[^"]*"' "${STATE_DIR}/sessions/${session_id}.json" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
end_time: ${SESSION_END}
duration_seconds: ${duration}
workflow_phase: $(cat "${STATE_DIR}/temp/current-phase.txt" 2>/dev/null || echo "unknown")
progress_percent: $(cat "${STATE_DIR}/temp/progress.txt" 2>/dev/null || echo "0")
status: completed
tags:
  - exec-automator
  - session-summary
  - type/checkpoint
fileClass: session-checkpoint
---

# Session Summary: ${session_id}

## Overview

**Session Duration:** $(printf '%dh %dm %ds' $((duration / 3600)) $(((duration % 3600) / 60)) $((duration % 60)))
**Workflow Phase:** $(cat "${STATE_DIR}/temp/current-phase.txt" 2>/dev/null || echo "unknown")
**Overall Progress:** $(cat "${STATE_DIR}/temp/progress.txt" 2>/dev/null || echo "0")%

## Activity Metrics

### Tool Usage
- **Total Invocations:** $(wc -l < "${STATE_DIR}/temp/tool-usage.log" 2>/dev/null || echo "0")
- **MCP Tools Used:** $(wc -l < "${STATE_DIR}/temp/mcp-usage.log" 2>/dev/null || echo "0")
- **Average Duration:** $(cat "${STATE_DIR}/temp/avg-duration.txt" 2>/dev/null || echo "0")s

### Workflow Progress
- **Phase Transitions:** $(wc -l < "${STATE_DIR}/workflows/phase-transitions.log" 2>/dev/null || echo "0")
- **Documents Analyzed:** 0
- **Profiles Generated:** 0

### Quality Metrics
- **Errors Encountered:** $(cat "${STATE_DIR}/temp/error-count.txt" 2>/dev/null || echo "0")
- **Success Rate:** N/A

## Checkpoint Contents

All session state has been preserved in this checkpoint directory:

\`\`\`
${CHECKPOINT_DIR}/${session_id}/
├── session-state.json         # Complete session state
├── workflow-phase.txt          # Current workflow phase
├── tool-usage.log              # Tool invocation history
├── mcp-usage.log               # MCP tool usage
├── phase-transitions.log       # Workflow phase changes
├── errors.log                  # Error log (if any)
└── checkpoint-metadata.json    # Checkpoint metadata
\`\`\`

## Resume Instructions

To resume this session's work:

\`\`\`bash
/exec:resume ${session_id}
\`\`\`

Or manually load the checkpoint:

\`\`\`bash
# Load session state
cat ${CHECKPOINT_DIR}/${session_id}/session-state.json

# Check workflow phase
cat ${CHECKPOINT_DIR}/${session_id}/workflow-phase.txt
\`\`\`

## Next Steps

Based on the workflow phase reached, recommended next steps:

$(cat "${STATE_DIR}/temp/current-phase.txt" 2>/dev/null | {
    read phase
    case "$phase" in
        document-parsing)
            echo "- Complete document parsing"
            echo "- Begin responsibility extraction"
            ;;
        responsibility-extraction)
            echo "- Complete responsibility extraction"
            echo "- Begin automation scoring"
            ;;
        automation-scoring)
            echo "- Review automation scores"
            echo "- Generate automation roadmap"
            ;;
        profile-generation|complete)
            echo "- Review generated profiles"
            echo "- Generate LangGraph workflows"
            echo "- Deploy automation agents"
            ;;
        *)
            echo "- Begin new analysis workflow"
            ;;
    esac
})

---

**Generated by:** Brookside BI Exec-Automator Platform
**Session Cleanup Hook Version:** 1.0.0
**Generated:** ${SESSION_END}
EOF

    log_success "Vault summary created: ${summary_file}"
}

# Display cleanup completion banner
display_completion_banner() {
    cat <<'EOF'

╔════════════════════════════════════════════════════════════════════╗
║              Session Cleanup Complete                              ║
║                                                                    ║
║  All workflow state has been checkpointed and archived.           ║
║  Your work is preserved and ready to resume.                      ║
║                                                                    ║
║  Thank you for using Brookside BI Exec-Automator!                 ║
╚════════════════════════════════════════════════════════════════════╝

EOF
}

# Main cleanup flow
main() {
    log_info "Starting workflow cleanup..."
    echo ""

    # Get session ID
    local session_id=$(get_session_id)
    if [ "$session_id" = "unknown" ]; then
        log_warn "No active session found - cleanup not required"
        exit 0
    fi

    # Calculate session duration
    local duration=$(calculate_session_duration)

    # Step 1: Create checkpoint
    create_checkpoint "$session_id"

    # Step 2: Archive completed analyses
    archive_analyses

    # Step 3: Finalize session state
    finalize_session "$session_id" "$duration"

    # Step 4: Generate session summary
    generate_session_summary "$session_id" "$duration"

    # Step 5: Create vault summary
    create_vault_summary "$session_id" "$duration"

    # Step 6: Clean up temporary files
    cleanup_temp_files

    # Step 7: Display completion banner
    display_completion_banner

    log_success "Workflow cleanup complete"
    log_info "Checkpoint location: ${CHECKPOINT_DIR}/${session_id}"
    log_info "Resume with: /exec:resume ${session_id}"

    return 0
}

# Error handling
trap 'log_error "Cleanup failed at line $LINENO" >&2' ERR

# Execute main flow
main "$@"

exit 0
