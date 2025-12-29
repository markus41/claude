#!/bin/bash
# Execution Tracking Hook
# Event: PostToolUse
# Purpose: Track workflow execution progress and update state for automation orchestration
#
# This hook runs after each tool use to monitor workflow progress, track analysis completion,
# identify bottlenecks, and maintain comprehensive execution state for the exec-automator platform.
#
# Brand Voice: Brookside BI - Empowering nonprofits through intelligent automation

set -e

HOOK_NAME="execution-tracker"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${PLUGIN_ROOT}/state"
VAULT_PATH="${OBSIDIAN_VAULT_PATH:-${HOME}/obsidian}"

# Tool use metadata (passed as arguments or environment variables)
TOOL_NAME="${1:-${TOOL_NAME:-unknown}}"
TOOL_STATUS="${2:-${TOOL_STATUS:-unknown}}"
TOOL_DURATION="${3:-${TOOL_DURATION:-0}}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Logging functions
log_info() {
    echo "[${HOOK_NAME}] INFO: $1"
}

log_debug() {
    # Only log debug in verbose mode
    if [ "${EXEC_AUTOMATOR_VERBOSE:-0}" = "1" ]; then
        echo "[${HOOK_NAME}] DEBUG: $1"
    fi
}

log_warn() {
    echo "[${HOOK_NAME}] WARN: $1"
}

log_metric() {
    echo "[${HOOK_NAME}] METRIC: $1"
}

# Check if session is initialized
check_session() {
    if [ ! -f "${STATE_DIR}/sessions/current.json" ]; then
        log_debug "No active session - skipping execution tracking"
        return 1
    fi
    return 0
}

# Track tool usage patterns
track_tool_usage() {
    local tool="$1"
    local status="$2"

    log_debug "Tracking tool: ${tool} (status: ${status})"

    # Create tool usage log if it doesn't exist
    local usage_log="${STATE_DIR}/temp/tool-usage.log"
    mkdir -p "${STATE_DIR}/temp"

    # Append usage record
    echo "${TIMESTAMP}|${tool}|${status}|${TOOL_DURATION}" >> "${usage_log}"

    # Track specific tool categories
    case "$tool" in
        Read|Grep|Glob)
            track_document_analysis
            ;;
        Write|Edit)
            track_output_generation
            ;;
        Bash)
            track_workflow_execution
            ;;
        mcp__exec-automator__*)
            track_mcp_tool_usage "$tool"
            ;;
    esac
}

# Track document analysis progress
track_document_analysis() {
    log_debug "Document analysis tool used"

    # Check if we're in analysis phase
    local phase_file="${STATE_DIR}/temp/current-phase.txt"
    if [ -f "$phase_file" ]; then
        local current_phase=$(cat "$phase_file")
        if [ "$current_phase" = "document-analysis" ]; then
            # Increment analysis counter
            local counter_file="${STATE_DIR}/temp/analysis-counter.txt"
            local count=0
            if [ -f "$counter_file" ]; then
                count=$(cat "$counter_file")
            fi
            count=$((count + 1))
            echo "$count" > "$counter_file"

            log_metric "Document analysis operations: ${count}"
        fi
    fi
}

# Track output generation
track_output_generation() {
    log_debug "Output generation tool used"

    # Track outputs created
    local output_log="${STATE_DIR}/temp/outputs.log"
    echo "${TIMESTAMP}|output_generated" >> "$output_log"
}

# Track workflow execution
track_workflow_execution() {
    log_debug "Workflow execution tool used"

    # Track workflow invocations
    local workflow_log="${STATE_DIR}/workflows/execution.log"
    mkdir -p "${STATE_DIR}/workflows"
    echo "${TIMESTAMP}|workflow_step_executed" >> "$workflow_log"
}

# Track MCP tool usage
track_mcp_tool_usage() {
    local mcp_tool="$1"

    log_info "MCP tool used: ${mcp_tool}"

    # Extract MCP operation from tool name
    # Format: mcp__exec-automator__<operation>
    local operation=$(echo "$mcp_tool" | sed 's/mcp__exec-automator__//')

    case "$operation" in
        parse_rfp|parse_job_description|parse_bylaws)
            log_metric "Document parsing: ${operation}"
            update_workflow_phase "document-parsing"
            ;;
        extract_responsibilities|categorize_responsibility)
            log_metric "Responsibility extraction: ${operation}"
            update_workflow_phase "responsibility-extraction"
            ;;
        score_automation_potential)
            log_metric "Automation scoring: ${operation}"
            update_workflow_phase "automation-scoring"
            ;;
        generate_langgraph_workflow|generate_agent_spec)
            log_metric "Workflow generation: ${operation}"
            update_workflow_phase "workflow-generation"
            ;;
        create_organizational_profile)
            log_metric "Profile generation: ${operation}"
            update_workflow_phase "profile-generation"
            ;;
    esac

    # Log MCP usage to session state
    local mcp_log="${STATE_DIR}/temp/mcp-usage.log"
    echo "${TIMESTAMP}|${operation}|${TOOL_STATUS}" >> "$mcp_log"
}

# Update workflow phase
update_workflow_phase() {
    local new_phase="$1"

    local phase_file="${STATE_DIR}/temp/current-phase.txt"
    local prev_phase="idle"
    if [ -f "$phase_file" ]; then
        prev_phase=$(cat "$phase_file")
    fi

    # Only update if phase changed
    if [ "$prev_phase" != "$new_phase" ]; then
        echo "$new_phase" > "$phase_file"
        log_info "Workflow phase transition: ${prev_phase} → ${new_phase}"

        # Log phase transition
        local transitions_log="${STATE_DIR}/workflows/phase-transitions.log"
        echo "${TIMESTAMP}|${prev_phase}|${new_phase}" >> "$transitions_log"
    fi
}

# Calculate workflow progress
calculate_progress() {
    log_debug "Calculating workflow progress..."

    # Define workflow phases in order
    local phases=("idle" "document-parsing" "responsibility-extraction" "automation-scoring" "workflow-generation" "profile-generation" "complete")
    local current_phase="idle"

    if [ -f "${STATE_DIR}/temp/current-phase.txt" ]; then
        current_phase=$(cat "${STATE_DIR}/temp/current-phase.txt")
    fi

    # Find current phase index
    local current_index=0
    for i in "${!phases[@]}"; do
        if [ "${phases[$i]}" = "$current_phase" ]; then
            current_index=$i
            break
        fi
    done

    # Calculate percentage
    local total_phases=${#phases[@]}
    local progress=$((current_index * 100 / (total_phases - 1)))

    log_metric "Workflow progress: ${progress}% (Phase: ${current_phase})"

    # Write progress to state
    echo "$progress" > "${STATE_DIR}/temp/progress.txt"
}

# Detect analysis completion
detect_completion() {
    log_debug "Checking for workflow completion..."

    # Check if we have profile generation
    if [ -f "${STATE_DIR}/temp/current-phase.txt" ]; then
        local current_phase=$(cat "${STATE_DIR}/temp/current-phase.txt")
        if [ "$current_phase" = "profile-generation" ] || [ "$current_phase" = "complete" ]; then
            log_info "Analysis workflow appears complete"

            # Suggest next steps
            suggest_next_steps
        fi
    fi
}

# Suggest next steps based on current state
suggest_next_steps() {
    local current_phase=$(cat "${STATE_DIR}/temp/current-phase.txt" 2>/dev/null || echo "unknown")

    case "$current_phase" in
        document-parsing)
            log_info "Next step: Run responsibility extraction"
            echo "  Use: org-analyzer agent or /exec:analyze command"
            ;;
        responsibility-extraction)
            log_info "Next step: Score automation potential"
            echo "  Use: /exec:score <profile-id>"
            ;;
        automation-scoring)
            log_info "Next step: Generate automation roadmap"
            echo "  Use: /exec:orchestrate automation-roadmap"
            ;;
        profile-generation)
            log_info "Analysis complete! Recommended next steps:"
            echo "  1. Review dashboard: /exec:dashboard"
            echo "  2. Generate workflows: /exec:orchestrate workflow-gen"
            echo "  3. Simulate ROI: /exec:simulate <scenario>"
            echo "  4. Deploy agents: /exec:orchestrate agent-deploy"
            ;;
    esac
}

# Monitor for long-running operations
monitor_duration() {
    local duration="$1"

    # Warn if operation took longer than 30 seconds
    if [ "$duration" -gt 30 ]; then
        log_warn "Long-running operation detected: ${duration}s"
        log_info "Consider breaking complex operations into smaller steps"
    fi

    # Track average duration
    local avg_file="${STATE_DIR}/temp/avg-duration.txt"
    local count_file="${STATE_DIR}/temp/operation-count.txt"

    local total_duration=0
    local count=0

    if [ -f "$avg_file" ]; then
        total_duration=$(cat "$avg_file")
    fi
    if [ -f "$count_file" ]; then
        count=$(cat "$count_file")
    fi

    count=$((count + 1))
    total_duration=$((total_duration + duration))

    echo "$total_duration" > "$avg_file"
    echo "$count" > "$count_file"

    local avg=$((total_duration / count))
    log_metric "Average operation duration: ${avg}s (${count} operations)"
}

# Track errors and failures
track_errors() {
    local status="$1"

    if [ "$status" = "error" ] || [ "$status" = "failed" ]; then
        log_warn "Tool execution failed or errored"

        # Increment error counter
        local error_file="${STATE_DIR}/temp/error-count.txt"
        local error_count=0
        if [ -f "$error_file" ]; then
            error_count=$(cat "$error_file")
        fi
        error_count=$((error_count + 1))
        echo "$error_count" > "$error_file"

        log_metric "Error count: ${error_count}"

        # Log error to session state
        local error_log="${STATE_DIR}/temp/errors.log"
        echo "${TIMESTAMP}|${TOOL_NAME}|${status}" >> "$error_log"
    fi
}

# Generate execution summary
generate_summary() {
    if [ "${EXEC_AUTOMATOR_SUMMARY:-0}" != "1" ]; then
        return 0
    fi

    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Execution Summary"
    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Tool usage stats
    if [ -f "${STATE_DIR}/temp/tool-usage.log" ]; then
        local tool_count=$(wc -l < "${STATE_DIR}/temp/tool-usage.log")
        log_metric "Total tool invocations: ${tool_count}"
    fi

    # Current phase
    if [ -f "${STATE_DIR}/temp/current-phase.txt" ]; then
        local phase=$(cat "${STATE_DIR}/temp/current-phase.txt")
        log_info "Current workflow phase: ${phase}"
    fi

    # Progress
    if [ -f "${STATE_DIR}/temp/progress.txt" ]; then
        local progress=$(cat "${STATE_DIR}/temp/progress.txt")
        log_metric "Workflow progress: ${progress}%"
    fi

    # Errors
    if [ -f "${STATE_DIR}/temp/error-count.txt" ]; then
        local errors=$(cat "${STATE_DIR}/temp/error-count.txt")
        if [ "$errors" -gt 0 ]; then
            log_warn "Errors encountered: ${errors}"
        fi
    fi

    log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main tracking flow
main() {
    # Check if session is active
    if ! check_session; then
        exit 0
    fi

    # Track tool usage
    track_tool_usage "$TOOL_NAME" "$TOOL_STATUS"

    # Monitor duration if provided
    if [ "$TOOL_DURATION" != "0" ]; then
        monitor_duration "$TOOL_DURATION"
    fi

    # Track errors
    track_errors "$TOOL_STATUS"

    # Calculate progress
    calculate_progress

    # Detect completion
    detect_completion

    # Generate summary if requested
    generate_summary

    return 0
}

# Error handling (suppress errors - tracking is non-critical)
trap 'exit 0' ERR

# Execute main flow
main "$@"

exit 0
