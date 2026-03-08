# Claude Code Hooks System

Complete reference for the hooks lifecycle system.

## Overview

Hooks are user-defined shell commands that execute at specific points in the Claude Code lifecycle. They run synchronously and can modify Claude's behavior by returning structured JSON.

## Hook Types

### All Lifecycle Events
| Event | When | Can Block? |
|-------|------|-----------|
| `SessionStart` | Session begins/resumes | No |
| `UserPromptSubmit` | Before processing user prompt | Yes (exit 2) |
| `PreToolUse` | Before tool execution | Yes (exit 2) |
| `PostToolUse` | After tool succeeds | No |
| `PostToolUseFailure` | After tool fails | No |
| `PermissionRequest` | Permission prompt appears | No |
| `Notification` | User needs attention | No |
| `SubagentStart` | Sub-agent starts | No |
| `SubagentStop` | Sub-agent finishes | Yes (continue) |
| `TaskCompleted` | Task marked complete | No |
| `ConfigChange` | Config file changed | No |
| `TeammateIdle` | Agent team teammate going idle | No |
| `PreCompact` | Before conversation history compacted | No |
| `SessionEnd` | Session terminates | No |
| `Stop` | Claude about to stop | Yes (continue) |

### Hook Types (4 types)
| Type | Description |
|------|-------------|
| `command` | Shell script execution |
| `http` | POST to a URL endpoint |
| `prompt` | Single-turn LLM evaluation |
| `agent` | Multi-turn verification with tools |

### Hook Exit Codes
| Exit Code | Meaning |
|-----------|---------|
| `0` | Proceed (approve). For UserPromptSubmit/SessionStart, stdout added to context |
| `2` | Block action (deny). stderr becomes feedback to Claude |
| Other | Log only (hook failure, tool proceeds normally) |

### PreToolUse
Fires **before** a tool is executed. Can approve, deny, or modify the tool call.

**Trigger:** Before each tool invocation
**Input (stdin):** JSON with tool name and input parameters
**Output (stdout):** JSON with decision

```json
// Input received on stdin
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/data",
    "description": "Delete temporary data"
  },
  "session_id": "abc123"
}
```

**Response options:**

```json
// Approve (proceed normally)
{ "decision": "approve" }

// Deny (block the tool call)
{ "decision": "deny", "reason": "Destructive command blocked" }

// Modify (change the tool input)
{
  "decision": "approve",
  "tool_input": {
    "command": "rm -rf /tmp/data --interactive",
    "description": "Delete temporary data (with confirmation)"
  }
}

// No output = approve (passthrough)
```

### PostToolUse
Fires **after** a tool completes. Can observe results or modify output.

**Trigger:** After each tool invocation
**Input (stdin):** JSON with tool name, input, and output

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  },
  "tool_output": {
    "stdout": "All tests passed",
    "stderr": "",
    "exitCode": 0
  },
  "session_id": "abc123"
}
```

**Response:** Optional JSON to modify what Claude sees.

### Notification
Fires when Claude wants to notify the user (e.g., task completion).

**Trigger:** Claude sends a notification
**Input (stdin):** JSON with notification details

```json
{
  "message": "Task completed successfully",
  "type": "info",
  "session_id": "abc123"
}
```

**Use cases:** Desktop notifications, Slack messages, sound alerts.

### Stop
Fires when Claude is about to stop (end of conversation turn).

**Trigger:** Claude reaches a stopping point
**Input (stdin):** JSON with session context

```json
{
  "session_id": "abc123",
  "reason": "end_turn",
  "message": "I've completed the task."
}
```

**Response:** Can force Claude to continue.

```json
// Force continue with additional instructions
{
  "decision": "continue",
  "message": "Also run the linter before finishing."
}

// Allow stop (default)
{ "decision": "stop" }
```

### SubagentStop
Fires when a sub-agent (spawned via Agent tool) is about to stop.

Same schema as Stop but for sub-agents.

## Configuration

Hooks are configured in `settings.json` (project or user level):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/pre-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/log-tool-use.py"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/notify.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/on-stop.sh"
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns

| Pattern | Matches |
|---------|---------|
| `"Bash"` | Only Bash tool calls |
| `"Read"` | Only Read tool calls |
| `"Write"` | Only Write tool calls |
| `"Edit"` | Only Edit tool calls |
| `"mcp__*"` | All MCP tool calls |
| `"mcp__filesystem__*"` | Specific MCP server tools |
| `"*"` | All tool calls |
| `""` | Default/all (for non-tool hooks) |

## Example Hook Scripts

### Security Guard (PreToolUse)

```bash
#!/bin/bash
# .claude/hooks/security-guard.sh
# Block dangerous bash commands

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if [ "$TOOL" = "Bash" ]; then
  # Block rm -rf on important paths
  if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+(/|/home|/etc|/var)'; then
    echo '{"decision": "deny", "reason": "Blocked: destructive rm -rf on system path"}'
    exit 0
  fi

  # Block curl piped to bash
  if echo "$COMMAND" | grep -qE 'curl.*\|\s*(ba)?sh'; then
    echo '{"decision": "deny", "reason": "Blocked: piping curl to shell"}'
    exit 0
  fi

  # Block sudo
  if echo "$COMMAND" | grep -qE '^\s*sudo\s'; then
    echo '{"decision": "deny", "reason": "Blocked: sudo commands"}'
    exit 0
  fi
fi

# Approve everything else
echo '{"decision": "approve"}'
```

### Tool Usage Logger (PostToolUse)

```bash
#!/bin/bash
# .claude/hooks/log-tool-use.sh
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "$TIMESTAMP | $TOOL" >> .claude/tool-usage.log
```

### Desktop Notification (Notification)

```bash
#!/bin/bash
# .claude/hooks/notify.sh
INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message')

# macOS
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\""
fi

# Linux
if command -v notify-send &>/dev/null; then
  notify-send "Claude Code" "$MESSAGE"
fi
```

### Auto-Test on Stop (Stop)

```bash
#!/bin/bash
# .claude/hooks/auto-test.sh
INPUT=$(cat)

# Check if any source files were modified
if git diff --name-only | grep -qE '\.(ts|tsx|js|jsx)$'; then
  # Run tests
  if ! npm test --silent 2>/dev/null; then
    echo '{"decision": "continue", "message": "Tests are failing. Please fix them before stopping."}'
    exit 0
  fi
fi

echo '{"decision": "stop"}'
```

### Error Capture (PostToolUse)

```bash
#!/bin/bash
# .claude/hooks/lessons-learned-capture.sh
# Capture tool failures to lessons-learned.md

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_output.exitCode // .tool_output.exit_code // "0"')
ERROR=$(echo "$INPUT" | jq -r '.tool_output.stderr // .error // ""')

if [ "$EXIT_CODE" != "0" ] && [ -n "$ERROR" ]; then
  TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input | tostring' | head -c 200)

  cat >> .claude/rules/lessons-learned.md << EOF

### Error: ${TOOL} failure (${TIMESTAMP})
- **Tool:** ${TOOL}
- **Input:** \`${TOOL_INPUT}\`
- **Error:** ${ERROR}
- **Status:** NEEDS_FIX
EOF
fi
```

## Hook Execution Details

- Hooks run **synchronously** — Claude waits for them to complete
- Hooks receive input on **stdin** as JSON
- Hooks output responses on **stdout** as JSON
- Non-zero exit codes are treated as hook failures (tool proceeds as normal)
- Hooks have a **timeout** (default varies by hook type)
- Hooks run in the **project root** directory
- Hooks have access to the **full environment** (env vars, PATH, etc.)
- Multiple hooks can be chained for the same matcher — they run in order

## Best Practices

1. **Keep hooks fast** — They block Claude's execution
2. **Use jq for JSON parsing** — It's reliable and available everywhere
3. **Handle errors gracefully** — A crashing hook shouldn't block Claude
4. **Log hook activity** — For debugging hook behavior
5. **Test hooks independently** — Run them with sample JSON input
6. **Use matchers narrowly** — Don't run expensive hooks on every tool call
7. **Return valid JSON** — Invalid JSON is ignored (treated as approve)
