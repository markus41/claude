#!/bin/bash
# validate-yaml.sh - Validate YAML syntax before writing

FILE="${1:-}"
CONTENT="${2:-}"

echo "=== YAML Validation ==="

# Check if python with yaml is available
if command -v python3 &> /dev/null; then
    echo "$CONTENT" | python3 -c "
import sys
import yaml
try:
    yaml.safe_load(sys.stdin.read())
    print('YAML syntax: Valid')
    sys.exit(0)
except yaml.YAMLError as e:
    print(f'YAML syntax: INVALID')
    print(f'Error: {e}')
    sys.exit(1)
"
    RESULT=$?
else
    echo "Warning: Python not available for YAML validation"
    RESULT=0
fi

# Additional HA-specific checks
if echo "$CONTENT" | grep -qE '^\s*-\s*platform:'; then
    echo "Platform configuration detected"
fi

if echo "$CONTENT" | grep -qE '^\s*alias:'; then
    echo "Automation/script detected"
fi

if echo "$CONTENT" | grep -qE 'trigger:|condition:|action:'; then
    echo "Automation structure detected"

    # Check for common automation issues
    if ! echo "$CONTENT" | grep -qE 'trigger:'; then
        echo "Warning: Automation missing trigger"
    fi
    if ! echo "$CONTENT" | grep -qE 'action:'; then
        echo "Warning: Automation missing action"
    fi
fi

echo "=== Validation Complete ==="
exit $RESULT
