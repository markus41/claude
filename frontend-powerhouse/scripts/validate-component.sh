#!/bin/bash

# Component Structure Validator
# Validates React/TypeScript components follow best practices
# Usage: validate-component.sh <component-file-path>

set -e

COMPONENT_FILE="$1"

if [ -z "$COMPONENT_FILE" ]; then
  echo "Error: Component file path required"
  echo "Usage: validate-component.sh <component-file-path>"
  exit 1
fi

if [ ! -f "$COMPONENT_FILE" ]; then
  echo "Error: File not found: $COMPONENT_FILE"
  exit 1
fi

# Exit code: 0 = pass, 1 = fail
EXIT_CODE=0

echo "Validating component: $COMPONENT_FILE"
echo "----------------------------------------"

# Check 1: Proper TypeScript interface for props
if ! grep -q "interface.*Props" "$COMPONENT_FILE"; then
  echo "WARNING: No TypeScript Props interface found"
  echo "  Expected pattern: interface ComponentNameProps { ... }"
  EXIT_CODE=1
fi

# Check 2: Component export
if ! grep -qE "export (default )?(const|function)" "$COMPONENT_FILE"; then
  echo "WARNING: No component export found"
  echo "  Expected: export const ComponentName or export default function"
  EXIT_CODE=1
fi

# Check 3: Chakra UI imports (if using Chakra)
if grep -q "from ['\"]@chakra-ui" "$COMPONENT_FILE"; then
  echo "INFO: Chakra UI detected"

  # Check for inline styles (anti-pattern with Chakra)
  if grep -qE "style=\{\{" "$COMPONENT_FILE"; then
    echo "WARNING: Inline styles detected - use Chakra props instead"
    echo "  Example: <Box bg='blue.500' p={4}> instead of style={{background: 'blue', padding: '16px'}}"
    EXIT_CODE=1
  fi

  # Check for className usage (should use Chakra props)
  if grep -qE "className=['\"]" "$COMPONENT_FILE"; then
    echo "WARNING: className usage detected - prefer Chakra style props"
    echo "  Example: <Box fontSize='lg'> instead of className='text-lg'"
    EXIT_CODE=1
  fi
fi

# Check 4: Accessibility - images without alt
if grep -qE "<(img|Image)[^>]*>" "$COMPONENT_FILE"; then
  # Extract image tags and check for alt attribute
  if grep -E "<(img|Image)" "$COMPONENT_FILE" | grep -qv "alt="; then
    echo "WARNING: Image tag(s) missing alt attribute"
    echo "  All images should have descriptive alt text for accessibility"
    EXIT_CODE=1
  fi
fi

# Check 5: Accessibility - buttons without labels
if grep -qE "<(button|Button)[^>]*>" "$COMPONENT_FILE"; then
  # Check if buttons have content or aria-label
  if grep -E "<(button|Button)[^>]*\/>" "$COMPONENT_FILE" | grep -qv "aria-label="; then
    echo "WARNING: Self-closing button without aria-label"
    echo "  Buttons should have accessible labels"
    EXIT_CODE=1
  fi
fi

# Check 6: TypeScript - any type usage (anti-pattern)
if grep -qE ":\s*any\s*[;,)]" "$COMPONENT_FILE"; then
  echo "WARNING: TypeScript 'any' type detected"
  echo "  Use specific types for better type safety"
  EXIT_CODE=1
fi

# Check 7: Component naming convention
FILENAME=$(basename "$COMPONENT_FILE" .tsx)
if ! grep -qE "(const|function)\s+$FILENAME" "$COMPONENT_FILE"; then
  echo "WARNING: Component name doesn't match filename"
  echo "  File: $FILENAME.tsx should export component named $FILENAME"
  EXIT_CODE=1
fi

echo "----------------------------------------"

if [ $EXIT_CODE -eq 0 ]; then
  echo "SUCCESS: Component validation passed"
else
  echo "FAILED: Component has validation issues (see warnings above)"
fi

exit $EXIT_CODE
