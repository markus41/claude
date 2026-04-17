# Claude Code Permissions & Security

Complete reference for the permission model and security features.

## Permission Modes

Claude Code operates in one of several permission modes:

### Default Mode (`default`)
- Prompts on first use of each tool type
- User approves/denies each tool call
- Safest mode for general use

### Accept Edits Mode (`acceptEdits`)
- Auto-approves file edits (Read, Write, Edit)
- Still asks for Bash commands and other tools
- Good balance for code-focused work

### Plan Mode (`plan`)
- Read-only analysis mode
- Claude can read but not modify anything
- Good for exploration and planning
- Invoke with `Shift+Tab` or `--permission-mode plan`

### Don't Ask Mode (`dontAsk`)
- Auto-denies unless pre-approved in allow list
- Good for locked-down environments
- Must configure allow list in settings.json

### Bypass Permissions (`bypassPermissions`)
- Skips ALL permission prompts
- Use only in trusted, sandboxed environments
- `--dangerously-skip-permissions` flag
- **Never use in production or with untrusted code**

### Switching Modes at Runtime
- `Shift+Tab` — Cycle through permission modes interactively
- `--permission-mode <mode>` — Set mode at startup

## Permission Configuration

### Allow Lists

In `settings.json` or `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(npm run *)",
      "Bash(npx tsc *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(wc *)",
      "Bash(echo *)",
      "Bash(pwd)",
      "Bash(which *)",
      "Bash(node *)",
      "Bash(python3 *)",
      "WebFetch",
      "WebSearch",
      "TodoWrite",
      "NotebookEdit",
      "Agent"
    ]
  }
}
```

### Deny Lists

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo *)",
      "Bash(curl * | bash)",
      "Bash(wget * | bash)",
      "Bash(chmod 777 *)",
      "Bash(> /dev/sda)",
      "Bash(mkfs *)",
      "Bash(dd if=*)",
      "Bash(:(){ :|:& };:)"
    ]
  }
}
```

### Pattern Matching

| Pattern | Example | Matches |
|---------|---------|---------|
| Exact tool | `"Read"` | All Read calls |
| Bash prefix | `"Bash(npm test)"` | Exactly `npm test` |
| Bash glob | `"Bash(npm *)"` | Any npm command |
| MCP wildcard | `"mcp__server__*"` | All tools from server |
| MCP specific | `"mcp__fs__read_file"` | Specific MCP tool |

### Precedence
1. Deny rules checked first (if matched, blocked)
2. Allow rules checked second (if matched, auto-approved)
3. If neither matched, user is prompted

## Tool Permission Categories

### Always Safe (typically auto-allowed)
- `Read` — Read file contents
- `Glob` — Find files by pattern
- `Grep` — Search file contents
- `TodoWrite` — Manage todo list

### Requires Approval by Default
- `Write` — Create/overwrite files
- `Edit` — Modify existing files
- `Bash` — Execute shell commands
- `WebFetch` — Fetch web content
- `WebSearch` — Search the web
- `NotebookEdit` — Edit Jupyter notebooks

### Special Tools
- `Agent` — Spawn sub-agents (inherits parent permissions)
- `AskUserQuestion` — Always allowed (asks user questions)
- `Skill` — Invoke slash commands

## Security Best Practices

### 1. Principle of Least Privilege
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(npx tsc --noEmit)"
    ]
  }
}
```

### 2. Protect Sensitive Files
Use hooks to guard sensitive paths:
```bash
#!/bin/bash
# PreToolUse hook
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
PATH_ARG=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Block access to secrets
if echo "$PATH_ARG" | grep -qE '\.(env|pem|key|secret)$'; then
  echo '{"decision": "deny", "reason": "Access to secret files is blocked"}'
  exit 0
fi

echo '{"decision": "approve"}'
```

### 3. Sandbox Bash Commands
```json
{
  "permissions": {
    "allow": [
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(git *)",
      "Bash(ls *)",
      "Bash(cat *)"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(sudo *)",
      "Bash(curl *)",
      "Bash(wget *)"
    ]
  }
}
```

### 4. MCP Server Permissions
```json
{
  "permissions": {
    "allow": [
      "mcp__filesystem__read_file",
      "mcp__filesystem__list_directory"
    ],
    "deny": [
      "mcp__filesystem__write_file",
      "mcp__filesystem__delete_file"
    ]
  }
}
```

### 5. Enterprise Controls
- Organization-level settings cannot be overridden
- API key management via managed auth
- Audit logging via hooks
- Network restrictions via proxy settings

## Session Permission Prompts

During a session, when Claude requests a tool:
- **Allow Once** — Approve this specific call
- **Allow Always** — Add to session allow list (until restart)
- **Deny** — Block this specific call
- **Deny Always** — Add to session deny list

Session permissions reset when Claude Code restarts. For persistent permissions, add them to `settings.json`.

## Managed Settings (Enterprise)

Enterprise admins can push managed settings that users cannot override:

```json
{
  "managedSettings": {
    "permissions": {
      "deny": [
        "Bash(curl *)",
        "Bash(wget *)",
        "WebFetch",
        "WebSearch"
      ]
    },
    "model": "claude-sonnet-4-6",
    "hooks": {
      "PostToolUse": [
        {
          "matcher": "*",
          "hooks": [
            {
              "type": "command",
              "command": "bash /opt/audit/log-tool-use.sh"
            }
          ]
        }
      ]
    }
  }
}
```

## Security Audit Checklist

- [ ] No API keys in `.mcp.json` (use env vars)
- [ ] `.env` files in `.gitignore`
- [ ] Deny list covers destructive commands
- [ ] PreToolUse hooks guard sensitive files
- [ ] PostToolUse hooks log activity
- [ ] MCP servers are from trusted sources
- [ ] Permission mode appropriate for environment
- [ ] Enterprise managed settings in place (if applicable)
