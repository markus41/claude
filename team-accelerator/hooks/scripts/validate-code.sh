#!/usr/bin/env bash
#
# Pre-Commit Code Validator
# Purpose: Validate code quality before changes are written
# Modes: --strict (block on issues) or --advisory (warn only)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Exit codes
EXIT_PASS=0
EXIT_BLOCK=1
EXIT_WARN=2

# Configuration
MODE="advisory"
FILE_PATH=""
STRICT_MODE=false
VERBOSE=false
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Issue tracking
declare -a CRITICAL_ISSUES
declare -a WARNINGS

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
            --mode)
                MODE="$2"
                [[ "$MODE" == "strict" ]] && STRICT_MODE=true
                shift 2
                ;;
            --strict)
                MODE="strict"
                STRICT_MODE=true
                shift
                ;;
            --advisory)
                MODE="advisory"
                STRICT_MODE=false
                shift
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
Usage: validate-code.sh [OPTIONS]

Validate code quality before committing changes.

OPTIONS:
    --file PATH         Path to file being validated (required)
    --mode MODE         Validation mode: strict or advisory (default: advisory)
    --strict            Enable strict mode (block on issues)
    --advisory          Enable advisory mode (warn only)
    --verbose, -v       Enable verbose output
    --help, -h          Show this help message

EXIT CODES:
    0   All checks passed
    1   Critical issues found (strict mode blocks)
    2   Warnings found (advisory mode)

EXAMPLES:
    # Advisory mode (warn only)
    validate-code.sh --file src/app.ts --advisory

    # Strict mode (block on issues)
    validate-code.sh --file src/app.ts --strict

EOF
}

#######################################
# Log functions
#######################################
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    WARNINGS+=("$*")
    ((WARNINGS_FOUND++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $*"
    CRITICAL_ISSUES+=("$*")
    ((ISSUES_FOUND++))
}

log_verbose() {
    [[ "$VERBOSE" == true ]] && echo -e "${BLUE}[DEBUG]${NC} $*"
}

#######################################
# Validation checks
#######################################

# Check for hardcoded secrets
check_secrets() {
    log_verbose "Checking for hardcoded secrets..."

    local file="$1"
    local patterns=(
        'api[_-]?key'
        'api[_-]?secret'
        'password'
        'passwd'
        'pwd'
        'secret[_-]?key'
        'access[_-]?token'
        'auth[_-]?token'
        'private[_-]?key'
        'client[_-]?secret'
        'aws[_-]?secret'
        'bearer[[:space:]]+[a-zA-Z0-9_-]{20,}'
    )

    for pattern in "${patterns[@]}"; do
        if grep -iE "$pattern.*=.*['\"][a-zA-Z0-9_-]{10,}['\"]" "$file" 2>/dev/null; then
            log_error "Potential hardcoded secret found: $pattern"
        fi
    done

    # Check for common secret patterns
    if grep -E '(sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|xoxb-[a-zA-Z0-9-]+)' "$file" 2>/dev/null; then
        log_error "Detected API key pattern (OpenAI, GitHub, Slack)"
    fi
}

# Check for debug statements
check_debug_statements() {
    log_verbose "Checking for debug statements..."

    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        js|jsx|ts|tsx)
            if grep -E 'console\.(log|debug|info|warn|error)' "$file" 2>/dev/null | grep -v '^\s*//' | grep -v '^\s*\*'; then
                log_warn "Console statements found (consider removing for production)"
            fi
            ;;
        py)
            if grep -E 'print\(' "$file" 2>/dev/null | grep -v '^\s*#'; then
                log_warn "Print statements found (consider using logging module)"
            fi
            ;;
        go)
            if grep -E 'fmt\.Print(ln|f)?' "$file" 2>/dev/null | grep -v '^\s*//'; then
                log_warn "Print statements found (consider using log package)"
            fi
            ;;
    esac
}

# Check for TODO/FIXME comments
check_todo_comments() {
    log_verbose "Checking for TODO/FIXME comments..."

    local file="$1"
    local todos=$(grep -iE '(TODO|FIXME|XXX|HACK)' "$file" 2>/dev/null | wc -l)

    if [[ $todos -gt 0 ]]; then
        log_warn "Found $todos TODO/FIXME comments (ensure they're tracked in issues)"
    fi
}

# Check for proper error handling
check_error_handling() {
    log_verbose "Checking error handling..."

    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        js|jsx|ts|tsx)
            # Check for async functions without try-catch
            if grep -E 'async\s+function' "$file" 2>/dev/null; then
                if ! grep -E 'try\s*{' "$file" 2>/dev/null; then
                    log_warn "Async functions found without try-catch blocks"
                fi
            fi

            # Check for promise without catch
            if grep -E '\.then\(' "$file" 2>/dev/null; then
                if ! grep -E '\.catch\(' "$file" 2>/dev/null; then
                    log_warn "Promises found without .catch() handlers"
                fi
            fi
            ;;
        py)
            # Check for bare except clauses
            if grep -E 'except:' "$file" 2>/dev/null | grep -v '^\s*#'; then
                log_warn "Bare except clauses found (be specific about exceptions)"
            fi
            ;;
    esac
}

# Check for security vulnerabilities
check_security() {
    log_verbose "Checking for security issues..."

    local file="$1"
    local ext="${file##*.}"

    # SQL injection patterns
    if grep -E 'execute\(.*\+.*\)|query\(.*\+.*\)' "$file" 2>/dev/null; then
        log_error "Potential SQL injection: string concatenation in query"
    fi

    # XSS vulnerabilities
    case "$ext" in
        js|jsx|ts|tsx)
            if grep -E 'dangerouslySetInnerHTML|innerHTML\s*=' "$file" 2>/dev/null; then
                log_warn "Potential XSS risk: direct HTML manipulation"
            fi
            ;;
    esac

    # Command injection
    if grep -E 'exec\(|system\(|shell_exec\(' "$file" 2>/dev/null; then
        log_error "Potential command injection: direct command execution"
    fi
}

# Check file syntax
check_syntax() {
    log_verbose "Checking file syntax..."

    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        json)
            if command -v jq &> /dev/null; then
                if ! jq empty "$file" 2>/dev/null; then
                    log_error "Invalid JSON syntax"
                fi
            fi
            ;;
        yaml|yml)
            if command -v yamllint &> /dev/null; then
                if ! yamllint -d relaxed "$file" 2>/dev/null; then
                    log_warn "YAML formatting issues detected"
                fi
            fi
            ;;
        js|jsx|ts|tsx)
            if command -v eslint &> /dev/null; then
                if ! eslint --no-eslintrc --quiet "$file" 2>/dev/null; then
                    log_verbose "ESLint issues detected (run eslint for details)"
                fi
            fi
            ;;
        py)
            if command -v python3 &> /dev/null; then
                if ! python3 -m py_compile "$file" 2>/dev/null; then
                    log_error "Python syntax error"
                fi
            fi
            ;;
    esac
}

# Check for unused imports/variables
check_unused_code() {
    log_verbose "Checking for unused code..."

    local file="$1"
    local ext="${file##*.}"

    case "$ext" in
        js|jsx|ts|tsx)
            # This is a simple check; use ESLint for comprehensive analysis
            local imports=$(grep -E '^import .* from' "$file" 2>/dev/null | wc -l)
            if [[ $imports -gt 20 ]]; then
                log_warn "Large number of imports ($imports) - verify all are needed"
            fi
            ;;
    esac
}

# Check package files
check_package_files() {
    log_verbose "Checking package configuration..."

    local file="$1"
    local filename=$(basename "$file")

    case "$filename" in
        package.json)
            # Check for vulnerable dependencies (if npm audit is available)
            if command -v npm &> /dev/null; then
                local pkg_dir=$(dirname "$file")
                if [[ -f "$pkg_dir/package-lock.json" ]]; then
                    log_verbose "Run 'npm audit' to check for vulnerabilities"
                fi
            fi

            # Validate semver
            if grep -E '"version":\s*"[^0-9]' "$file" 2>/dev/null; then
                log_error "Invalid semver format in package.json"
            fi
            ;;
        requirements.txt)
            # Check for unpinned versions
            if grep -E '^[a-zA-Z0-9_-]+$' "$file" 2>/dev/null; then
                log_warn "Unpinned dependencies found in requirements.txt"
            fi
            ;;
    esac
}

#######################################
# Main validation
#######################################
validate_file() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        log_error "File not found: $file"
        return $EXIT_BLOCK
    fi

    log_info "Validating: $file (mode: $MODE)"
    echo ""

    # Run all checks
    check_secrets "$file"
    check_debug_statements "$file"
    check_todo_comments "$file"
    check_error_handling "$file"
    check_security "$file"
    check_syntax "$file"
    check_unused_code "$file"
    check_package_files "$file"

    echo ""

    # Summary
    if [[ $ISSUES_FOUND -eq 0 ]] && [[ $WARNINGS_FOUND -eq 0 ]]; then
        log_success "All validation checks passed!"
        return $EXIT_PASS
    fi

    if [[ $ISSUES_FOUND -gt 0 ]]; then
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}  CRITICAL ISSUES FOUND: $ISSUES_FOUND${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        for issue in "${CRITICAL_ISSUES[@]}"; do
            echo -e "${RED}  • $issue${NC}"
        done
        echo ""
    fi

    if [[ $WARNINGS_FOUND -gt 0 ]]; then
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}  WARNINGS FOUND: $WARNINGS_FOUND${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        for warning in "${WARNINGS[@]}"; do
            echo -e "${YELLOW}  • $warning${NC}"
        done
        echo ""
    fi

    # Determine exit code based on mode
    if [[ $ISSUES_FOUND -gt 0 ]] && [[ "$STRICT_MODE" == true ]]; then
        echo -e "${RED}❌ BLOCKED: Critical issues must be resolved (strict mode)${NC}"
        return $EXIT_BLOCK
    elif [[ $ISSUES_FOUND -gt 0 ]] || [[ $WARNINGS_FOUND -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  WARNING: Issues found but allowed to proceed (advisory mode)${NC}"
        return $EXIT_WARN
    else
        return $EXIT_PASS
    fi
}

#######################################
# Main execution
#######################################
main() {
    parse_args "$@"

    if [[ -z "$FILE_PATH" ]]; then
        echo "Error: --file argument is required"
        show_help
        exit 1
    fi

    validate_file "$FILE_PATH"
    exit $?
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
