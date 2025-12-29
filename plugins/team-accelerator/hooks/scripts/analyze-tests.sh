#!/usr/bin/env bash
#
# Test Analyzer
# Purpose: Summarize test results at task completion
# Output: Markdown summary with pass/fail counts, coverage, recommendations
#

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
WORKSPACE="${PWD}"
TASK_ID=""
OUTPUT_FORMAT="markdown"
REPORT_PATH=""
VERBOSE=false

# Test metrics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
COVERAGE_PERCENT=0
EXECUTION_TIME=0

declare -a FAILED_TEST_NAMES
declare -a SLOW_TESTS
declare -a RECOMMENDATIONS

#######################################
# Parse command line arguments
#######################################
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --workspace)
                WORKSPACE="$2"
                shift 2
                ;;
            --task-id)
                TASK_ID="$2"
                shift 2
                ;;
            --output-format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            --report-path)
                REPORT_PATH="$2"
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
Usage: analyze-tests.sh [OPTIONS]

Analyze test results and generate summary report.

OPTIONS:
    --workspace PATH    Path to workspace directory (default: current)
    --task-id ID        Task identifier (optional)
    --output-format FMT Output format: markdown, json, text (default: markdown)
    --report-path PATH  Path to save report (optional)
    --verbose, -v       Enable verbose output
    --help, -h          Show this help message

EXAMPLES:
    # Analyze tests in current workspace
    analyze-tests.sh --workspace . --output-format markdown

    # Generate report with task ID
    analyze-tests.sh --task-id ABC123 --report-path ./test-report.md

EOF
}

#######################################
# Utility functions
#######################################
log_info() {
    [[ "$VERBOSE" == true ]] && echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

#######################################
# Find test result files
#######################################
find_test_results() {
    local workspace="$1"

    # Common test result file patterns
    local patterns=(
        "test-results.xml"
        "test-results.json"
        "junit.xml"
        "**/test-results/**/*.xml"
        "**/coverage/**/*.json"
        ".nyc_output/**/*.json"
        "coverage/coverage-final.json"
        "pytest-report.xml"
        "go-test-report.json"
    )

    local found_files=()

    for pattern in "${patterns[@]}"; do
        while IFS= read -r file; do
            [[ -f "$file" ]] && found_files+=("$file")
        done < <(find "$workspace" -type f -path "*$pattern" 2>/dev/null || true)
    done

    printf '%s\n' "${found_files[@]}"
}

#######################################
# Parse JUnit XML test results
#######################################
parse_junit_xml() {
    local file="$1"

    log_info "Parsing JUnit XML: $file"

    # Extract test counts (simple grep-based parsing)
    local tests=$(grep -oP 'tests="\K[0-9]+' "$file" 2>/dev/null | head -1 || echo "0")
    local failures=$(grep -oP 'failures="\K[0-9]+' "$file" 2>/dev/null | head -1 || echo "0")
    local errors=$(grep -oP 'errors="\K[0-9]+' "$file" 2>/dev/null | head -1 || echo "0")
    local skipped=$(grep -oP 'skipped="\K[0-9]+' "$file" 2>/dev/null | head -1 || echo "0")
    local time=$(grep -oP 'time="\K[0-9.]+' "$file" 2>/dev/null | head -1 || echo "0")

    TOTAL_TESTS=$((TOTAL_TESTS + tests))
    FAILED_TESTS=$((FAILED_TESTS + failures + errors))
    SKIPPED_TESTS=$((SKIPPED_TESTS + skipped))
    PASSED_TESTS=$((PASSED_TESTS + tests - failures - errors - skipped))
    EXECUTION_TIME=$(awk "BEGIN {print $EXECUTION_TIME + $time}")

    # Extract failed test names
    while IFS= read -r line; do
        local test_name=$(echo "$line" | grep -oP 'name="\K[^"]+' || echo "unknown")
        FAILED_TEST_NAMES+=("$test_name")
    done < <(grep '<testcase.*<failure' "$file" 2>/dev/null || true)

    # Find slow tests (>1s)
    while IFS= read -r line; do
        local test_name=$(echo "$line" | grep -oP 'name="\K[^"]+' || echo "unknown")
        local test_time=$(echo "$line" | grep -oP 'time="\K[0-9.]+' || echo "0")
        if (( $(awk "BEGIN {print ($test_time > 1)}") )); then
            SLOW_TESTS+=("$test_name (${test_time}s)")
        fi
    done < <(grep '<testcase' "$file" 2>/dev/null || true)
}

#######################################
# Parse Jest JSON results
#######################################
parse_jest_json() {
    local file="$1"

    log_info "Parsing Jest JSON: $file"

    if ! command -v jq &> /dev/null; then
        log_warn "jq not available, skipping JSON parsing"
        return
    fi

    # Extract metrics using jq
    local tests=$(jq '.numTotalTests // 0' "$file" 2>/dev/null || echo "0")
    local passed=$(jq '.numPassedTests // 0' "$file" 2>/dev/null || echo "0")
    local failed=$(jq '.numFailedTests // 0' "$file" 2>/dev/null || echo "0")
    local skipped=$(jq '.numPendingTests // 0' "$file" 2>/dev/null || echo "0")

    TOTAL_TESTS=$((TOTAL_TESTS + tests))
    PASSED_TESTS=$((PASSED_TESTS + passed))
    FAILED_TESTS=$((FAILED_TESTS + failed))
    SKIPPED_TESTS=$((SKIPPED_TESTS + skipped))
}

#######################################
# Parse coverage data
#######################################
parse_coverage() {
    local workspace="$1"

    # Look for coverage files
    local coverage_files=(
        "$workspace/coverage/coverage-final.json"
        "$workspace/coverage/coverage-summary.json"
        "$workspace/.coverage"
    )

    for file in "${coverage_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_info "Found coverage file: $file"

            if [[ "$file" == *.json ]] && command -v jq &> /dev/null; then
                # Try to extract coverage percentage
                local coverage=$(jq -r '.total.lines.pct // .total.statements.pct // 0' "$file" 2>/dev/null || echo "0")
                COVERAGE_PERCENT=$(awk "BEGIN {printf \"%.1f\", $coverage}")
            fi
            break
        fi
    done
}

#######################################
# Generate recommendations
#######################################
generate_recommendations() {
    # Coverage recommendations
    if (( $(awk "BEGIN {print ($COVERAGE_PERCENT < 80)}") )); then
        RECOMMENDATIONS+=("Increase test coverage (current: ${COVERAGE_PERCENT}%, target: 80%+)")
    fi

    # Failed tests
    if [[ $FAILED_TESTS -gt 0 ]]; then
        RECOMMENDATIONS+=("Fix $FAILED_TESTS failing test(s) before merging")
    fi

    # Slow tests
    if [[ ${#SLOW_TESTS[@]} -gt 0 ]]; then
        RECOMMENDATIONS+=("Optimize ${#SLOW_TESTS[@]} slow test(s) (>1s execution time)")
    fi

    # Skipped tests
    if [[ $SKIPPED_TESTS -gt 0 ]]; then
        RECOMMENDATIONS+=("Review $SKIPPED_TESTS skipped test(s) - ensure they're intentional")
    fi

    # Missing tests
    if [[ $TOTAL_TESTS -eq 0 ]]; then
        RECOMMENDATIONS+=("No tests found - add test coverage for new code")
    fi

    # Success case
    if [[ $FAILED_TESTS -eq 0 ]] && [[ $TOTAL_TESTS -gt 0 ]]; then
        RECOMMENDATIONS+=("All tests passing! Consider adding more edge case tests")
    fi
}

#######################################
# Generate markdown report
#######################################
generate_markdown_report() {
    local timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    cat <<EOF
# Test Analysis Report

**Generated:** $timestamp
**Task ID:** ${TASK_ID:-N/A}
**Workspace:** $WORKSPACE

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | $TOTAL_TESTS |
| **Passed** | ✅ $PASSED_TESTS |
| **Failed** | ❌ $FAILED_TESTS |
| **Skipped** | ⏭️ $SKIPPED_TESTS |
| **Coverage** | 📊 ${COVERAGE_PERCENT}% |
| **Execution Time** | ⏱️ ${EXECUTION_TIME}s |

### Test Results

EOF

    if [[ $TOTAL_TESTS -eq 0 ]]; then
        echo "⚠️ **No tests found in this session**"
        echo ""
        echo "This could mean:"
        echo "- No tests were executed"
        echo "- Test results were not generated in a recognized format"
        echo "- Tests are located outside the workspace"
        echo ""
    else
        local pass_rate=0
        if [[ $TOTAL_TESTS -gt 0 ]]; then
            pass_rate=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")
        fi

        if [[ $FAILED_TESTS -eq 0 ]]; then
            echo "✅ **All tests passed!** (${pass_rate}% success rate)"
        else
            echo "❌ **${FAILED_TESTS} test(s) failed** (${pass_rate}% success rate)"
        fi
        echo ""
    fi

    # Failed tests
    if [[ ${#FAILED_TEST_NAMES[@]} -gt 0 ]]; then
        cat <<EOF

### Failed Tests

EOF
        for test in "${FAILED_TEST_NAMES[@]}"; do
            echo "- \`$test\`"
        done
        echo ""
    fi

    # Slow tests
    if [[ ${#SLOW_TESTS[@]} -gt 0 ]]; then
        cat <<EOF

### Slow Tests (>1s)

EOF
        for test in "${SLOW_TESTS[@]}"; do
            echo "- \`$test\`"
        done
        echo ""
    fi

    # Recommendations
    if [[ ${#RECOMMENDATIONS[@]} -gt 0 ]]; then
        cat <<EOF

## Recommendations

EOF
        for rec in "${RECOMMENDATIONS[@]}"; do
            echo "- $rec"
        done
        echo ""
    fi

    # Coverage details
    if (( $(awk "BEGIN {print ($COVERAGE_PERCENT > 0)}") )); then
        cat <<EOF

## Coverage Analysis

Current coverage: **${COVERAGE_PERCENT}%**

EOF
        if (( $(awk "BEGIN {print ($COVERAGE_PERCENT >= 80)}") )); then
            echo "✅ Coverage meets minimum threshold (80%)"
        else
            echo "⚠️ Coverage below recommended threshold (80%)"
        fi
        echo ""
    fi

    cat <<EOF

---

## Action Items

EOF

    if [[ $FAILED_TESTS -gt 0 ]]; then
        echo "- [ ] Fix $FAILED_TESTS failing test(s)"
    fi

    if (( $(awk "BEGIN {print ($COVERAGE_PERCENT < 80)}") )); then
        echo "- [ ] Increase coverage to 80%+ (current: ${COVERAGE_PERCENT}%)"
    fi

    if [[ $SKIPPED_TESTS -gt 0 ]]; then
        echo "- [ ] Review skipped tests"
    fi

    if [[ ${#SLOW_TESTS[@]} -gt 0 ]]; then
        echo "- [ ] Optimize slow tests"
    fi

    if [[ $TOTAL_TESTS -eq 0 ]]; then
        echo "- [ ] Add test coverage"
    fi

    if [[ $FAILED_TESTS -eq 0 ]] && [[ $TOTAL_TESTS -gt 0 ]]; then
        echo "- [x] All tests passing - ready for review"
    fi

    echo ""
}

#######################################
# Generate JSON report
#######################################
generate_json_report() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat <<EOF
{
  "timestamp": "$timestamp",
  "taskId": "${TASK_ID:-null}",
  "workspace": "$WORKSPACE",
  "summary": {
    "totalTests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "skipped": $SKIPPED_TESTS,
    "coverage": $COVERAGE_PERCENT,
    "executionTime": $EXECUTION_TIME
  },
  "failedTests": [
$(printf '    "%s"\n' "${FAILED_TEST_NAMES[@]}" | paste -sd, -)
  ],
  "slowTests": [
$(printf '    "%s"\n' "${SLOW_TESTS[@]}" | paste -sd, -)
  ],
  "recommendations": [
$(printf '    "%s"\n' "${RECOMMENDATIONS[@]}" | paste -sd, -)
  ]
}
EOF
}

#######################################
# Main analysis
#######################################
analyze() {
    log_info "Analyzing tests in: $WORKSPACE"

    # Find and parse test results
    local test_files=()
    mapfile -t test_files < <(find_test_results "$WORKSPACE")

    if [[ ${#test_files[@]} -eq 0 ]]; then
        log_warn "No test result files found"
    else
        log_info "Found ${#test_files[@]} test result file(s)"

        for file in "${test_files[@]}"; do
            case "$file" in
                *.xml)
                    parse_junit_xml "$file"
                    ;;
                *.json)
                    parse_jest_json "$file"
                    ;;
            esac
        done
    fi

    # Parse coverage
    parse_coverage "$WORKSPACE"

    # Generate recommendations
    generate_recommendations

    # Generate report
    local report=""
    case "$OUTPUT_FORMAT" in
        markdown)
            report=$(generate_markdown_report)
            ;;
        json)
            report=$(generate_json_report)
            ;;
        *)
            log_warn "Unknown output format: $OUTPUT_FORMAT"
            report=$(generate_markdown_report)
            ;;
    esac

    # Output report
    if [[ -n "$REPORT_PATH" ]]; then
        echo "$report" > "$REPORT_PATH"
        log_success "Report saved to: $REPORT_PATH"
    else
        echo "$report"
    fi
}

#######################################
# Main execution
#######################################
main() {
    parse_args "$@"
    analyze
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
