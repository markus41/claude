#!/usr/bin/env bash
# ============================================================================
# AGENT TEAMS QUALITY GATE HOOK
# ============================================================================
# Enforces quality standards when Agent Team teammates complete tasks.
# Used with TaskCompleted and TeammateIdle hooks.
#
# Exit codes:
#   0 - Allow action to proceed
#   2 - Block action and send feedback
#
# @version 1.0.0
# ============================================================================

set -euo pipefail

HOOK_TYPE="${1:-TaskCompleted}"
TEAM_NAME="${2:-default}"
TASK_ID="${3:-}"
TEAMMATE_NAME="${4:-}"

LOG_PREFIX="[AgentTeams:QualityGate]"

# ============================================================================
# TASK COMPLETED VALIDATION
# ============================================================================

validate_task_completed() {
    local task_id="$1"

    echo "$LOG_PREFIX Validating task completion: $task_id"

    # Check if there are uncommitted changes that should be committed
    local uncommitted
    uncommitted=$(git diff --name-only 2>/dev/null | wc -l)

    if [ "$uncommitted" -gt 0 ]; then
        echo "$LOG_PREFIX WARNING: $uncommitted uncommitted files detected"
        # Don't block, just warn
    fi

    # Check for TODO markers in recently changed files
    local recent_todos
    recent_todos=$(git diff --name-only HEAD 2>/dev/null | xargs grep -l "TODO\|FIXME\|HACK" 2>/dev/null | wc -l)

    if [ "$recent_todos" -gt 0 ]; then
        echo "$LOG_PREFIX INFO: $recent_todos files with TODO/FIXME markers in recent changes"
    fi

    # Verify no merge conflicts in working directory
    local conflicts
    conflicts=$(grep -rl "<<<<<<< " . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" 2>/dev/null | wc -l)

    if [ "$conflicts" -gt 0 ]; then
        echo "$LOG_PREFIX BLOCKING: $conflicts files with merge conflicts detected"
        echo "Resolve merge conflicts before marking task as complete"
        exit 2
    fi

    echo "$LOG_PREFIX Task validation passed"
    exit 0
}

# ============================================================================
# TEAMMATE IDLE HANDLER
# ============================================================================

handle_teammate_idle() {
    local teammate="$1"

    echo "$LOG_PREFIX Teammate idle: $teammate"

    # Check if there are unclaimed tasks in the shared task list
    local team_dir="$HOME/.claude/teams/$TEAM_NAME"

    if [ -d "$team_dir" ]; then
        echo "$LOG_PREFIX Checking for unclaimed tasks in $TEAM_NAME"

        # Look for pending tasks
        local pending_count
        pending_count=$(find "$team_dir" -name "*.task" -exec grep -l '"status":"pending"' {} \; 2>/dev/null | wc -l)

        if [ "$pending_count" -gt 0 ]; then
            echo "$LOG_PREFIX $pending_count unclaimed tasks available - teammate should pick one up"
            echo "There are $pending_count unclaimed tasks. Please claim the next available task."
            exit 2  # Send feedback to keep teammate working
        fi
    fi

    echo "$LOG_PREFIX No more tasks - teammate can go idle"
    exit 0
}

# ============================================================================
# MAIN DISPATCH
# ============================================================================

case "$HOOK_TYPE" in
    TaskCompleted)
        validate_task_completed "${TASK_ID}"
        ;;
    TeammateIdle)
        handle_teammate_idle "${TEAMMATE_NAME}"
        ;;
    *)
        echo "$LOG_PREFIX Unknown hook type: $HOOK_TYPE"
        exit 0
        ;;
esac
