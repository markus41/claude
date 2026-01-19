#!/bin/bash
# Template Generated Hook - Validates and reports on generated templates
# Trigger: PostToolUse on Write|Edit for template files
# Plugin: infrastructure-template-generator

set -e

# Configuration
HOOK_NAME="template-generated"
LOG_FILE="${HOME}/.claude/logs/${HOOK_NAME}.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create log directory if needed
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$TIMESTAMP] [ITG] $1" >> "$LOG_FILE"
}

# Validate Cookiecutter template
validate_cookiecutter() {
    local file="$1"
    log "Validating Cookiecutter template: $file"

    # Check JSON syntax
    if ! python -c "import json; json.load(open('$file'))" 2>/dev/null; then
        log "ERROR: Invalid JSON syntax in $file"
        echo "⚠️  Invalid JSON syntax in cookiecutter.json"
        return 1
    fi

    # Check for required fields
    if ! python -c "import json; d=json.load(open('$file')); assert 'project_name' in d or 'project_slug' in d" 2>/dev/null; then
        log "WARNING: Missing project_name or project_slug in $file"
        echo "⚠️  Consider adding project_name or project_slug variable"
    fi

    log "Cookiecutter template validation passed"
    echo "✅ Cookiecutter template validated: $file"
}

# Validate Terraform file
validate_terraform() {
    local file="$1"
    log "Validating Terraform file: $file"

    # Check if terraform is available
    if command -v terraform &> /dev/null; then
        local dir=$(dirname "$file")
        if terraform fmt -check "$file" 2>/dev/null; then
            log "Terraform format check passed"
            echo "✅ Terraform format valid: $file"
        else
            log "WARNING: Terraform format issues in $file"
            echo "⚠️  Run 'terraform fmt' to fix formatting in $file"
        fi
    else
        log "Terraform CLI not found, skipping validation"
    fi
}

# Validate YAML file
validate_yaml() {
    local file="$1"
    log "Validating YAML file: $file"

    # Check YAML syntax
    if python -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        log "YAML syntax validation passed"
        echo "✅ YAML syntax valid: $file"
    else
        log "ERROR: Invalid YAML syntax in $file"
        echo "⚠️  Invalid YAML syntax in $file"
        return 1
    fi

    # Check for Harness pipeline structure
    if grep -q "^pipeline:" "$file" 2>/dev/null; then
        log "Detected Harness pipeline file"
        if grep -q "identifier:" "$file" && grep -q "stages:" "$file"; then
            echo "✅ Harness pipeline structure valid"
        else
            echo "⚠️  Harness pipeline may be missing required fields"
        fi
    fi
}

# Main execution
main() {
    local file="$1"

    if [ -z "$file" ]; then
        log "No file provided, exiting"
        exit 0
    fi

    log "Processing file: $file"

    case "$file" in
        *cookiecutter.json)
            validate_cookiecutter "$file"
            ;;
        *.tf)
            validate_terraform "$file"
            ;;
        *.yaml|*.yml)
            validate_yaml "$file"
            ;;
        *)
            log "Unknown file type, skipping validation"
            ;;
    esac

    log "Hook completed for: $file"
}

# Execute main with all arguments
main "$@"
