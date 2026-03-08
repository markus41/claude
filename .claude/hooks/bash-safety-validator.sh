#!/bin/bash
# PreToolUse hook for Bash - blocks dangerous commands
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block destructive operations
if echo "$COMMAND" | grep -qE '(rm -rf /|rm -rf ~|> /dev/sd|mkfs\.|dd if=|:(){ :|fork bomb)'; then
  echo "BLOCKED: Destructive system command detected" >&2
  exit 2
fi

# Block credential exposure
if echo "$COMMAND" | grep -qE '(cat.*\.env|echo.*API_KEY|echo.*SECRET|echo.*PASSWORD|echo.*TOKEN)' | grep -v 'grep'; then
  echo "BLOCKED: Potential credential exposure" >&2
  exit 2
fi

exit 0
