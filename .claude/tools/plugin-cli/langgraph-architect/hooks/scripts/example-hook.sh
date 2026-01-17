#!/bin/bash
# Example Hook
# This hook runs on file write operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}[Hook]${NC} Example hook triggered"

# Example: Check file size
FILE_PATH="$1"

if [ -f "$FILE_PATH" ]; then
  FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null || echo "0")

  if [ "$FILE_SIZE" -gt 1000000 ]; then
    echo -e "${YELLOW}[Warning]${NC} File is larger than 1MB: $FILE_PATH"
  fi
fi

exit 0
