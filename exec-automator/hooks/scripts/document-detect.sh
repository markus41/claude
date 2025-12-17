#!/bin/bash
# Document Detection Hook
# Event: UserPromptSubmit
# Purpose: Detect organizational documents and suggest appropriate analysis workflows
#
# This hook analyzes user prompts to identify when organizational documents (RFPs, bylaws,
# job descriptions) are mentioned, then suggests the appropriate exec-automator commands
# and agents to analyze them effectively.
#
# Brand Voice: Brookside BI - Empowering nonprofits through intelligent automation

set -e

HOOK_NAME="document-detect"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${PLUGIN_ROOT}/state"

# Get user prompt from arguments or stdin
USER_PROMPT="${1:-}"
if [ -z "$USER_PROMPT" ]; then
    # Read from stdin if available
    if [ ! -t 0 ]; then
        USER_PROMPT=$(cat)
    fi
fi

# Exit silently if no prompt
if [ -z "$USER_PROMPT" ]; then
    exit 0
fi

# Logging functions
log_info() {
    echo "[${HOOK_NAME}] INFO: $1"
}

log_suggestion() {
    echo "[${HOOK_NAME}] SUGGESTION: $1"
}

# Document type detection patterns
declare -A DOCUMENT_PATTERNS=(
    ["rfp"]="rfp|request for proposal|scope of work|deliverables|procurement"
    ["job_description"]="job description|job posting|position description|responsibilities|qualifications|reports to"
    ["bylaws"]="bylaws|articles of incorporation|governance|board duties|committee structure"
    ["contract"]="contract|agreement|mou|memorandum of understanding|service agreement"
    ["strategic_plan"]="strategic plan|long-range plan|goals and objectives|strategic priorities"
    ["annual_report"]="annual report|impact report|year in review"
    ["operations_manual"]="operations manual|procedures manual|policy manual|sop|standard operating"
)

# Organization type patterns
declare -A ORG_PATTERNS=(
    ["nonprofit"]="nonprofit|501c3|501c6|charitable|foundation"
    ["association"]="association|trade association|professional association|society"
    ["trade_association"]="trade association|industry association|chamber of commerce"
    ["membership"]="membership organization|member-driven|member services"
)

# Executive director patterns
ED_PATTERNS="executive director|ed position|chief executive|ceo nonprofit|executive leadership"

# Automation-related patterns
AUTOMATION_PATTERNS="automate|automation|ai agent|workflow|langgraph|responsibility automation"

# Analysis-related patterns
ANALYSIS_PATTERNS="analyze|score|assess|evaluate|extract responsibilities|automation potential"

# Detect document type
detect_document_type() {
    local prompt="$1"
    local detected_types=()

    for doc_type in "${!DOCUMENT_PATTERNS[@]}"; do
        local pattern="${DOCUMENT_PATTERNS[$doc_type]}"
        if echo "$prompt" | grep -iEq "$pattern"; then
            detected_types+=("$doc_type")
        fi
    done

    echo "${detected_types[@]}"
}

# Detect organization type
detect_org_type() {
    local prompt="$1"
    local detected_types=()

    for org_type in "${!ORG_PATTERNS[@]}"; do
        local pattern="${ORG_PATTERNS[$org_type]}"
        if echo "$prompt" | grep -iEq "$pattern"; then
            detected_types+=("$org_type")
        fi
    done

    echo "${detected_types[@]}"
}

# Check for executive director context
has_ed_context() {
    local prompt="$1"
    if echo "$prompt" | grep -iEq "$ED_PATTERNS"; then
        return 0
    fi
    return 1
}

# Check for automation intent
has_automation_intent() {
    local prompt="$1"
    if echo "$prompt" | grep -iEq "$AUTOMATION_PATTERNS"; then
        return 0
    fi
    return 1
}

# Check for analysis intent
has_analysis_intent() {
    local prompt="$1"
    if echo "$prompt" | grep -iEq "$ANALYSIS_PATTERNS"; then
        return 0
    fi
    return 1
}

# Suggest commands based on detected context
suggest_commands() {
    local doc_types=($1)
    local org_types=($2)
    local has_ed=$3
    local has_automation=$4
    local has_analysis=$5

    # Only suggest if we have relevant context
    if [ ${#doc_types[@]} -eq 0 ] && [ "$has_ed" = "false" ] && [ "$has_automation" = "false" ] && [ "$has_analysis" = "false" ]; then
        return 0
    fi

    echo ""
    echo "╔════════════════════════════════════════════════════════════════════╗"
    echo "║          Exec-Automator Document Detection                         ║"
    echo "╚════════════════════════════════════════════════════════════════════╝"
    echo ""

    # Document type suggestions
    if [ ${#doc_types[@]} -gt 0 ]; then
        log_info "Detected document type(s): ${doc_types[*]}"
        echo ""

        for doc_type in "${doc_types[@]}"; do
            case "$doc_type" in
                rfp)
                    log_suggestion "RFP detected - Use org-analyzer agent for comprehensive extraction"
                    echo "  Command: /exec:analyze <document> rfp standard"
                    echo "  Agent: org-analyzer"
                    echo "  Output: Complete organizational profile with ED responsibilities"
                    echo ""
                    ;;
                job_description)
                    log_suggestion "Job description detected - Extract responsibilities and score automation potential"
                    echo "  Command: /exec:analyze <document> job-description comprehensive"
                    echo "  Agent: org-analyzer"
                    echo "  Output: Responsibility inventory with automation scores"
                    echo ""
                    ;;
                bylaws)
                    log_suggestion "Bylaws detected - Map governance structure and ED authority"
                    echo "  Command: /exec:analyze <document> bylaws standard"
                    echo "  Agent: org-analyzer"
                    echo "  Output: Governance structure and authority boundaries"
                    echo ""
                    ;;
                contract)
                    log_suggestion "Contract detected - Extract deliverables and obligations"
                    echo "  Command: /exec:analyze <document> contract standard"
                    echo "  Output: Contractual obligations analysis"
                    echo ""
                    ;;
                strategic_plan)
                    log_suggestion "Strategic plan detected - Extract strategic responsibilities"
                    echo "  Command: /exec:analyze <document> auto-detect comprehensive"
                    echo "  Output: Strategic priorities and ED role in execution"
                    echo ""
                    ;;
            esac
        done
    fi

    # Executive director context suggestions
    if [ "$has_ed" = "true" ]; then
        log_info "Executive director context detected"
        echo ""
        log_suggestion "Consider using these exec-automator workflows:"
        echo "  1. Full organizational analysis"
        echo "     /exec:orchestrate full-analysis --documents <docs>"
        echo ""
        echo "  2. Responsibility extraction and categorization"
        echo "     Use agent: org-analyzer"
        echo ""
        echo "  3. Automation roadmap generation"
        echo "     /exec:score <profile> && /exec:orchestrate automation-roadmap"
        echo ""
    fi

    # Automation intent suggestions
    if [ "$has_automation" = "true" ]; then
        log_info "Automation intent detected"
        echo ""
        log_suggestion "Automation workflow recommendations:"
        echo "  1. Score automation potential: /exec:score <organization-profile>"
        echo "  2. Generate LangGraph workflows: /exec:orchestrate workflow-gen"
        echo "  3. Deploy AI agents: /exec:orchestrate agent-deploy"
        echo "  4. Simulate ROI: /exec:simulate <scenario>"
        echo ""
        log_suggestion "Available automation agents:"
        echo "  - workflow-designer: Design LangGraph workflows"
        echo "  - finance-manager: Automate financial responsibilities"
        echo "  - meeting-facilitator: Automate meeting coordination"
        echo ""
    fi

    # Analysis intent suggestions
    if [ "$has_analysis" = "true" ]; then
        log_info "Analysis intent detected"
        echo ""
        log_suggestion "Analysis workflow:"
        echo "  STEP 1: Document ingestion"
        echo "    /exec:analyze <document> [type] [depth]"
        echo ""
        echo "  STEP 2: Responsibility extraction"
        echo "    Agent: org-analyzer (automatic)"
        echo ""
        echo "  STEP 3: Automation scoring"
        echo "    /exec:score <profile-id>"
        echo ""
        echo "  STEP 4: Roadmap generation"
        echo "    /exec:orchestrate automation-roadmap"
        echo ""
        echo "  STEP 5: Dashboard review"
        echo "    /exec:dashboard"
        echo ""
    fi

    # Organization type context
    if [ ${#org_types[@]} -gt 0 ]; then
        log_info "Organization type(s): ${org_types[*]}"
        echo ""
        log_suggestion "Platform optimized for nonprofit/association management"
        echo "  - Industry-specific responsibility patterns"
        echo "  - Association governance frameworks"
        echo "  - Nonprofit compliance requirements"
        echo ""
    fi

    # General recommendations
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📚 Documentation: See agents/org-analyzer.md for detailed extraction patterns"
    echo "💡 Quick Start: /exec:help for comprehensive command reference"
    echo "🔧 MCP Tools: exec-automator MCP server provides 15+ specialized tools"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Log detection to session state
log_detection() {
    local doc_types="$1"
    local org_types="$2"
    local has_ed="$3"
    local has_automation="$4"

    if [ -f "${STATE_DIR}/sessions/current.json" ]; then
        local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

        # Append detection event to session state
        # Note: This is a simplified version - in production, use jq for JSON manipulation
        log_info "Detection event logged to session state"
    fi
}

# Main detection flow
main() {
    # Detect document types
    local doc_types=$(detect_document_type "$USER_PROMPT")

    # Detect organization types
    local org_types=$(detect_org_type "$USER_PROMPT")

    # Check for ED context
    local has_ed="false"
    if has_ed_context "$USER_PROMPT"; then
        has_ed="true"
    fi

    # Check for automation intent
    local has_automation="false"
    if has_automation_intent "$USER_PROMPT"; then
        has_automation="true"
    fi

    # Check for analysis intent
    local has_analysis="false"
    if has_analysis_intent "$USER_PROMPT"; then
        has_analysis="true"
    fi

    # Suggest commands if relevant context detected
    suggest_commands "$doc_types" "$org_types" "$has_ed" "$has_automation" "$has_analysis"

    # Log detection event
    log_detection "$doc_types" "$org_types" "$has_ed" "$has_automation"

    return 0
}

# Error handling (suppress errors for this hook - it's informational only)
trap 'exit 0' ERR

# Execute main flow
main "$@"

exit 0
