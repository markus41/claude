#!/usr/bin/env bash
#
# Documentation Sync
# Purpose: Auto-update documentation when code changes
# Triggers: When source files are written/modified
#

set -euo pipefail

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
FILE_PATH=""
PROJECT_ROOT="${PWD}"
OBSIDIAN_VAULT=""
REPO_NAME=""
ORG_NAME=""
VERBOSE=false

declare -a DOCS_TO_UPDATE
declare -a BREAKING_CHANGES
declare -a NEW_FEATURES

#######################################
# Parse command line arguments
#######################################
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --file)
                FILE_PATH="$2"
                shift 2
                ;;
            --project-root)
                PROJECT_ROOT="$2"
                shift 2
                ;;
            --obsidian-vault)
                OBSIDIAN_VAULT="$2"
                shift 2
                ;;
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

#######################################
# Show help message
#######################################
show_help() {
    cat <<EOF
Usage: docs-sync.sh [OPTIONS]

Detect documentation updates needed when source code changes.

OPTIONS:
    --file PATH             Path to the modified file (required)
    --project-root PATH     Project root directory (default: current)
    --obsidian-vault PATH   Path to Obsidian vault (optional)
    --verbose, -v           Enable verbose output
    --help, -h              Show this help message

EXAMPLES:
    # Check documentation for a modified file
    docs-sync.sh --file src/api/users.ts --project-root .

    # With Obsidian vault integration
    docs-sync.sh --file src/core.py --obsidian-vault ~/obsidian

EOF
}

#######################################
# Utility functions
#######################################
log_info() {
    [[ "$VERBOSE" == true ]] && echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[DOCS]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_action() {
    echo -e "${CYAN}[ACTION]${NC} $*"
}

#######################################
# Detect repository information
#######################################
detect_repo_info() {
    # Get repository name
    if [[ -d "$PROJECT_ROOT/.git" ]]; then
        local remote_url=$(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || echo "")

        if [[ -n "$remote_url" ]]; then
            # Extract org and repo from GitHub URL
            if [[ "$remote_url" =~ github\.com[/:]([^/]+)/([^/.]+) ]]; then
                ORG_NAME="${BASH_REMATCH[1]}"
                REPO_NAME="${BASH_REMATCH[2]}"
            fi
        fi
    fi

    # Fallback: use directory name
    if [[ -z "$REPO_NAME" ]]; then
        REPO_NAME=$(basename "$PROJECT_ROOT")
    fi

    log_info "Repository: $ORG_NAME/$REPO_NAME"
}

#######################################
# Analyze file changes
#######################################
analyze_changes() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        log_warn "File not found: $file"
        return
    fi

    log_info "Analyzing: $file"

    # Check if file is in git
    if git -C "$PROJECT_ROOT" ls-files --error-unmatch "$file" &>/dev/null; then
        # Get diff if file exists in git
        local diff_output
        diff_output=$(git -C "$PROJECT_ROOT" diff HEAD "$file" 2>/dev/null || echo "")

        if [[ -n "$diff_output" ]]; then
            # Check for breaking changes (common patterns)
            if echo "$diff_output" | grep -qE '(\-.*function.*\(|\-.*class|\-.*interface|\-.*type.*=|\-.*export)'; then
                BREAKING_CHANGES+=("Potential API changes detected in $file")
            fi

            # Check for new exports (new features)
            if echo "$diff_output" | grep -qE '\+.*export (function|class|interface|type|const)'; then
                NEW_FEATURES+=("New exports added in $file")
            fi
        fi
    fi

    # Determine file type and documentation needs
    local ext="${file##*.}"
    case "$ext" in
        ts|tsx|js|jsx)
            check_typescript_docs "$file"
            ;;
        py)
            check_python_docs "$file"
            ;;
        go)
            check_go_docs "$file"
            ;;
        rs)
            check_rust_docs "$file"
            ;;
        java)
            check_java_docs "$file"
            ;;
    esac
}

#######################################
# Check TypeScript/JavaScript documentation
#######################################
check_typescript_docs() {
    local file="$1"

    # Check for exported functions/classes
    if grep -qE 'export (function|class|interface|type)' "$file"; then
        DOCS_TO_UPDATE+=("API documentation (exported members in $file)")
    fi

    # Check for React components
    if grep -qE '(React\.FC|React\.Component|function.*\(props)' "$file"; then
        DOCS_TO_UPDATE+=("Component documentation (React components in $file)")
    fi

    # Check for API routes (Next.js, Express)
    if grep -qE '(app\.(get|post|put|delete)|export (GET|POST|PUT|DELETE))' "$file"; then
        DOCS_TO_UPDATE+=("API endpoint documentation (routes in $file)")
    fi
}

#######################################
# Check Python documentation
#######################################
check_python_docs() {
    local file="$1"

    # Check for public functions/classes
    if grep -qE '^(def|class) [^_]' "$file"; then
        DOCS_TO_UPDATE+=("API documentation (public members in $file)")
    fi

    # Check for FastAPI/Flask routes
    if grep -qE '@(app\.(get|post|put|delete)|router\.)' "$file"; then
        DOCS_TO_UPDATE+=("API endpoint documentation (routes in $file)")
    fi
}

#######################################
# Check Go documentation
#######################################
check_go_docs() {
    local file="$1"

    # Check for exported functions/types
    if grep -qE '^(func|type) [A-Z]' "$file"; then
        DOCS_TO_UPDATE+=("API documentation (exported members in $file)")
    fi
}

#######################################
# Check Rust documentation
#######################################
check_rust_docs() {
    local file="$1"

    # Check for public functions/structs
    if grep -qE '^pub (fn|struct|enum|trait)' "$file"; then
        DOCS_TO_UPDATE+=("API documentation (public members in $file)")
    fi
}

#######################################
# Check Java documentation
#######################################
check_java_docs() {
    local file="$1"

    # Check for public classes/methods
    if grep -qE 'public (class|interface|enum)' "$file"; then
        DOCS_TO_UPDATE+=("API documentation (public members in $file)")
    fi
}

#######################################
# Find related documentation files
#######################################
find_related_docs() {
    local file="$1"
    local related_docs=()

    # Find README files
    local file_dir=$(dirname "$file")
    while [[ "$file_dir" != "." && "$file_dir" != "/" ]]; do
        if [[ -f "$PROJECT_ROOT/$file_dir/README.md" ]]; then
            related_docs+=("$PROJECT_ROOT/$file_dir/README.md")
        fi
        file_dir=$(dirname "$file_dir")
    done

    # Check for docs directory
    if [[ -d "$PROJECT_ROOT/docs" ]]; then
        related_docs+=("$PROJECT_ROOT/docs/**/*.md")
    fi

    # Check for API documentation
    if [[ -f "$PROJECT_ROOT/API.md" ]]; then
        related_docs+=("$PROJECT_ROOT/API.md")
    fi

    printf '%s\n' "${related_docs[@]}"
}

#######################################
# Generate Obsidian vault update checklist
#######################################
generate_obsidian_checklist() {
    if [[ -z "$OBSIDIAN_VAULT" ]] || [[ ! -d "$OBSIDIAN_VAULT" ]]; then
        return
    fi

    local repo_doc="$OBSIDIAN_VAULT/Repositories/$ORG_NAME/$REPO_NAME.md"

    cat <<EOF

### Obsidian Vault Updates

${CYAN}Repository Documentation:${NC}
- Path: \`$repo_doc\`
- Update last_updated date
- Add changes to recent updates section
EOF

    if [[ ${#BREAKING_CHANGES[@]} -gt 0 ]]; then
        cat <<EOF
- Document breaking changes

${CYAN}Architecture Decision Records (ADRs):${NC}
- Consider creating ADR in: \`$OBSIDIAN_VAULT/Repositories/$ORG_NAME/$REPO_NAME/Decisions/\`
- Document architectural changes and rationale
EOF
    fi

    if [[ ${#NEW_FEATURES[@]} -gt 0 ]]; then
        cat <<EOF

${CYAN}Research Notes:${NC}
- Log new patterns in: \`$OBSIDIAN_VAULT/Research/\`
- Cross-reference with related documentation
EOF
    fi
}

#######################################
# Generate documentation sync report
#######################################
generate_report() {
    cat <<EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                DOCUMENTATION SYNC CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 File Modified: $FILE_PATH
📦 Project: $REPO_NAME
🏢 Organization: $ORG_NAME

EOF

    # Breaking changes
    if [[ ${#BREAKING_CHANGES[@]} -gt 0 ]]; then
        echo -e "${RED}⚠️  BREAKING CHANGES DETECTED${NC}"
        for change in "${BREAKING_CHANGES[@]}"; do
            echo "   • $change"
        done
        echo ""
    fi

    # New features
    if [[ ${#NEW_FEATURES[@]} -gt 0 ]]; then
        echo -e "${GREEN}✨ NEW FEATURES DETECTED${NC}"
        for feature in "${NEW_FEATURES[@]}"; do
            echo "   • $feature"
        done
        echo ""
    fi

    # Documentation updates needed
    if [[ ${#DOCS_TO_UPDATE[@]} -gt 0 ]]; then
        echo -e "${YELLOW}📚 DOCUMENTATION UPDATES NEEDED${NC}"
        for doc in "${DOCS_TO_UPDATE[@]}"; do
            echo "   • $doc"
        done
        echo ""
    fi

    # Related documentation files
    local related_docs=()
    mapfile -t related_docs < <(find_related_docs "$FILE_PATH")

    if [[ ${#related_docs[@]} -gt 0 ]]; then
        echo -e "${BLUE}📄 RELATED DOCUMENTATION FILES${NC}"
        for doc in "${related_docs[@]}"; do
            echo "   • $doc"
        done
        echo ""
    fi

    # Obsidian integration
    generate_obsidian_checklist

    # Action items
    cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

    if [[ ${#BREAKING_CHANGES[@]} -gt 0 ]]; then
        echo "[ ] Document breaking changes in CHANGELOG"
        echo "[ ] Update migration guide"
        echo "[ ] Update version number (semver major)"
    fi

    if [[ ${#NEW_FEATURES[@]} -gt 0 ]]; then
        echo "[ ] Add feature documentation"
        echo "[ ] Update API reference"
        echo "[ ] Add usage examples"
    fi

    if [[ ${#DOCS_TO_UPDATE[@]} -gt 0 ]]; then
        echo "[ ] Review and update API documentation"
        echo "[ ] Update inline code comments"
        echo "[ ] Generate/update type definitions"
    fi

    if [[ ${#related_docs[@]} -gt 0 ]]; then
        echo "[ ] Update README files"
        echo "[ ] Review related documentation"
    fi

    if [[ -n "$OBSIDIAN_VAULT" ]]; then
        echo "[ ] Sync changes to Obsidian vault"
        echo "[ ] Create ADRs for significant changes"
        echo "[ ] Update research notes"
    fi

    if [[ ${#BREAKING_CHANGES[@]} -eq 0 ]] && [[ ${#NEW_FEATURES[@]} -eq 0 ]] && [[ ${#DOCS_TO_UPDATE[@]} -eq 0 ]]; then
        log_success "No documentation updates required"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

#######################################
# Main execution
#######################################
main() {
    parse_args "$@"

    if [[ -z "$FILE_PATH" ]]; then
        log_warn "No file path provided"
        exit 0
    fi

    # Skip if file is in excluded patterns
    if echo "$FILE_PATH" | grep -qE '(node_modules|dist|build|\.test\.|\.spec\.)'; then
        log_info "Skipping excluded file: $FILE_PATH"
        exit 0
    fi

    detect_repo_info
    analyze_changes "$FILE_PATH"
    generate_report
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
