# Claude Code Settings Deep Dive

Complete reference for every settings option, configuration key, and customization.

## Settings File Locations

| Location | Scope | Git Tracked |
|----------|-------|-------------|
| Managed (system-level) | Organization | `/Library/...` (macOS), `/etc/claude-code/` (Linux), `C:\Program Files\...` (Win) |
| `~/.claude/settings.json` | User (all projects) | N/A |
| `.claude/settings.json` | Project (shared) | Yes |
| `.claude/settings.local.json` | Project (personal) | No (gitignored) |

## Complete Settings Schema

```json
{
  // === PERMISSIONS ===
  "permissions": {
    "allow": ["Tool(pattern)"],
    "ask": ["Tool(pattern)"],
    "deny": ["Tool(pattern)"],
    "defaultMode": "default"
  },

  // === HOOKS ===
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "bash script.sh",
            "timeout": 10000
          }
        ]
      }
    ],
    "PostToolUse": [],
    "Notification": [],
    "Stop": [],
    "SubagentStop": []
  },

  // === ENVIRONMENT ===
  "env": {
    "VARIABLE_NAME": "value"
  },

  // === MODEL ===
  "model": "claude-sonnet-4-6",
  "smallFastModel": "claude-haiku-4-5-20251001",

  // === BEHAVIOR ===
  "autoMemory": true,
  "autoCompact": true,
  "language": "en",
  "outputStyle": "Explanatory",
  "spinnerVerbs": true,
  "spinnerTipsEnabled": true,
  "showTurnDuration": false,
  "respectGitignore": true,
  "cleanupPeriodDays": 30,
  "fastModePerSessionOptIn": false,
  "autoUpdatesChannel": "stable",

  // === STATUS LINE ===
  "statusLine": {
    "enabled": true,
    "showModel": true,
    "showTokens": true,
    "showCost": true
  },

  // === FILE SUGGESTIONS ===
  "fileSuggestion": true,

  // === CONTEXT WINDOW ===
  "contextWindow": {
    "compactThreshold": 0.8,
    "warningThreshold": 0.9
  },

  // === MCP ===
  "enableAllProjectMcpServers": false,
  "enabledMcpjsonServers": [],
  "allowedMcpServers": [],

  // === SANDBOX ===
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["//tmp/build"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"]
    }
  },

  // === HOOKS ===
  "disableAllHooks": false,
  "allowManagedHooksOnly": false,
  "allowedHttpHookUrls": [],
  "httpHookAllowedEnvVars": [],

  // === AUTH & LOGIN ===
  "forceLoginMethod": null,

  // === PLUGINS ===
  "pluginTrustMessage": "",
  "extraKnownMarketplaces": [],
  "strictKnownMarketplaces": false,
  "blockedMarketplaces": [],

  // === CLAUDE.md ===
  "claudeMdExcludes": [],

  // === MODELS ===
  "availableModels": [],

  // === ATTRIBUTION ===
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": ""
  },
  "includeCoAuthoredBy": true, // DEPRECATED: use attribution instead

  // === CHANNELS (v2.1.80+) ===
  "channelsEnabled": true,       // Managed only - master switch for Team/Enterprise
  "allowedChannelPlugins": [     // Managed only - restrict which channel plugins
    { "marketplace": "claude-plugins-official", "plugin": "telegram" }
  ],

  // === AGENT TEAMS (experimental) ===
  "teammateMode": "auto",       // "auto" | "in-process" | "tmux"

  // === WORKTREE ===
  "worktree": {
    "symlinkDirectories": ["node_modules", ".cache"],
    "sparsePaths": ["packages/my-app", "shared/utils"]
  },

  // === AUTO MODE ===
  "autoMode": {
    "environment": ["Trusted repo: github.example.com/acme"],
    "allow": ["Read any file in the project"],
    "soft_deny": ["Never delete production databases"]
  },
  "disableAutoMode": false,      // "disable" to block auto mode
  "useAutoModeDuringPlan": true,

  // === EFFORT & VOICE ===
  "effortLevel": "high",        // "low" | "medium" | "high" (Opus 4.6, Sonnet 4.6)
  "voiceEnabled": false,
  "alwaysThinkingEnabled": false,

  // === UI CUSTOMIZATION ===
  "spinnerTipsOverride": {
    "excludeDefault": true,
    "tips": ["Use our internal tool X"]
  },
  "prefersReducedMotion": false,
  "terminalProgressBarEnabled": true,
  "showClearContextOnPlanAccept": false,
  "plansDirectory": "~/.claude/plans",

  // === MODELS ===
  "availableModels": ["sonnet", "haiku", "opus"],
  "modelOverrides": {
    "claude-opus-4-6": "arn:aws:bedrock:us-east-1:..."
  }
}
```

## Permissions Deep Dive

### Tool Names
```
Read              — File reading
Write             — File creation/overwriting
Edit              — File modification
Glob              — File pattern search
Grep              — Content search
Bash              — Shell command execution
WebFetch          — Web content fetching
WebSearch         — Web searching
Agent             — Sub-agent spawning
TodoWrite         — Task tracking
NotebookEdit      — Jupyter notebook editing
AskUserQuestion   — User interaction (always allowed)
Skill             — Slash command invocation
ExitPlanMode      — Plan mode completion
```

### Bash Pattern Matching
```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",              // Exact match
      "Bash(npm run *)",             // npm run anything
      "Bash(npx *)",                 // Any npx command
      "Bash(git status)",            // Exact git status
      "Bash(git diff *)",            // git diff with any args
      "Bash(git log *)",             // git log with any args
      "Bash(git add *)",             // git add specific files
      "Bash(git commit *)",          // git commit
      "Bash(ls *)",                  // Any ls command
      "Bash(cat *)",                 // Any cat command
      "Bash(head *)",                // Any head command
      "Bash(tail *)",                // Any tail command
      "Bash(wc *)",                  // Word count
      "Bash(mkdir *)",               // Create directories
      "Bash(pwd)",                   // Print working directory
      "Bash(echo *)",                // Echo commands
      "Bash(which *)",               // Find executables
      "Bash(python3 *)",             // Python execution
      "Bash(node *)"                 // Node execution
    ],
    "deny": [
      "Bash(rm -rf /)",              // Block root delete
      "Bash(rm -rf ~)",              // Block home delete
      "Bash(sudo *)",                // Block sudo
      "Bash(chmod 777 *)",           // Block world-writable
      "Bash(curl * | sh)",           // Block pipe to shell
      "Bash(curl * | bash)",         // Block pipe to bash
      "Bash(wget * | sh)",           // Block wget pipe
      "Bash(eval *)",                // Block eval
      "Bash(> /dev/*)",              // Block device writes
      "Bash(dd *)"                   // Block disk operations
    ]
  }
}
```

### MCP Tool Patterns
```json
{
  "permissions": {
    "allow": [
      "mcp__filesystem__read_file",        // Specific tool
      "mcp__filesystem__list_directory",    // Specific tool
      "mcp__postgres__*",                   // All postgres tools
      "mcp__*"                              // All MCP tools
    ],
    "deny": [
      "mcp__filesystem__write_file",        // Block writes
      "mcp__filesystem__delete_file"        // Block deletes
    ]
  }
}
```

## Hook Configuration Deep Dive

### Matcher Patterns
| Pattern | Scope |
|---------|-------|
| `"Bash"` | Only Bash tool |
| `"Read"` | Only Read tool |
| `"Write"` | Only Write tool |
| `"Edit"` | Only Edit tool |
| `"Glob"` | Only Glob tool |
| `"Grep"` | Only Grep tool |
| `"WebFetch"` | Only WebFetch tool |
| `"Agent"` | Only Agent tool |
| `"mcp__*"` | All MCP tools |
| `"mcp__server__*"` | Specific MCP server |
| `"*"` | ALL tools |
| `""` | Default/all (for non-tool hooks) |

### Hook Script Interface

**Input (stdin):** JSON object

PreToolUse:
```json
{
  "tool_name": "string",
  "tool_input": { /* tool-specific */ },
  "session_id": "string"
}
```

PostToolUse:
```json
{
  "tool_name": "string",
  "tool_input": { /* tool-specific */ },
  "tool_output": { /* tool-specific */ },
  "session_id": "string"
}
```

**Output (stdout):** JSON object

PreToolUse responses:
```json
{ "decision": "approve" }
{ "decision": "deny", "reason": "explanation" }
{ "decision": "approve", "tool_input": { /* modified input */ } }
```

Stop responses:
```json
{ "decision": "stop" }
{ "decision": "continue", "message": "additional instructions" }
```

### Hook Timeout
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash hook.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

## Environment Variables in Settings

```json
{
  "env": {
    "DATABASE_URL": "postgresql://localhost:5432/mydb",
    "REDIS_URL": "redis://localhost:6379",
    "NODE_ENV": "development",
    "LOG_LEVEL": "debug",
    "CUSTOM_API_KEY": "key-value"
  }
}
```

These env vars are available to:
- Bash tool commands
- Hook scripts
- MCP servers
- Any child processes

## Local Overrides

`.claude/settings.local.json` — never committed to git:

```json
{
  "permissions": {
    "allow": [
      "Bash(docker *)",
      "Bash(kubectl *)"
    ]
  },
  "env": {
    "DATABASE_URL": "postgresql://localhost:5432/my_local_db",
    "ANTHROPIC_API_KEY": "sk-ant-my-personal-key"
  },
  "model": "claude-opus-4-6"
}
```

### Merge Behavior
- `permissions.allow`: Arrays concatenated (local + project)
- `permissions.deny`: Arrays concatenated
- `env`: Objects deep-merged (local overrides project)
- `model`: Local overrides project
- `hooks`: Deep-merged (local hooks added to project hooks)

## Feature Flags

```json
{
  "autoMemory": true,          // Auto-save memories
  "autoCompact": true           // Auto-compact at threshold
}
```

### Via Environment
```bash
DISABLE_AUTOMEMORY=1           # Disable auto-memory
DISABLE_BUG_COMMAND=1          # Disable /bug command
CLAUDE_CODE_SKIP_DOCTOR=1      # Skip doctor checks
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1  # Disable telemetry
```

## Configuration Validation

### Check Settings Syntax
```bash
python3 -c "
import json
try:
    data = json.load(open('.claude/settings.json'))
    print('Valid JSON')
    print('Keys:', list(data.keys()))
except json.JSONDecodeError as e:
    print(f'Invalid JSON: {e}')
"
```

### Check MCP Config
```bash
python3 -c "
import json
try:
    data = json.load(open('.mcp.json'))
    for name, config in data.get('mcpServers', {}).items():
        cmd = config.get('command', 'N/A')
        disabled = config.get('disabled', False)
        status = 'DISABLED' if disabled else 'OK'
        print(f'  {name}: {cmd} [{status}]')
except Exception as e:
    print(f'Error: {e}')
"
```

### Validate Plugin Manifests
```bash
python3 -c "
import json, glob
for f in glob.glob('plugins/*/. claude-plugin/plugin.json'):
    try:
        data = json.load(open(f))
        print(f'OK: {data[\"name\"]} v{data[\"version\"]}')
    except Exception as e:
        print(f'ERROR: {f}: {e}')
"
```

## Common Settings Recipes

### Developer Workstation
```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Glob", "Grep",
      "Bash(npm *)", "Bash(npx *)", "Bash(pnpm *)",
      "Bash(git *)", "Bash(ls *)", "Bash(cat *)",
      "Bash(mkdir *)", "Bash(node *)", "Bash(python3 *)",
      "WebFetch", "WebSearch", "Agent", "TodoWrite"
    ],
    "deny": [
      "Bash(rm -rf /)", "Bash(sudo *)"
    ]
  },
  "model": "claude-sonnet-4-6",
  "autoMemory": true,
  "autoCompact": true
}
```

### CI/CD Pipeline
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep",
      "Bash(npm test)", "Bash(npm run build)",
      "Bash(git diff *)", "Bash(git log *)"
    ],
    "deny": [
      "Write", "Edit",
      "Bash(git push *)", "Bash(git commit *)"
    ]
  },
  "model": "claude-haiku-4-5-20251001",
  "autoMemory": false
}
```

## Attribution Customization

Default commit attribution:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

Default PR attribution:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

### Custom Attribution (no Claude Code branding)
```json
{
  "attribution": {
    "commit": "AI-assisted development\n\nCo-Authored-By: AI Assistant <ai@company.com>",
    "pr": "AI-assisted development"
  }
}
```

### Hide All Attribution
```json
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
```

### Custom Branding Examples
```json
// Branded for your team
{
  "attribution": {
    "commit": "Built with Markus AI Platform\n\nCo-Authored-By: Markus AI <ai@markusplatform.com>",
    "pr": "Built with Markus AI Platform"
  }
}
```

## Channels Settings (v2.1.80+)

Channels push events into running sessions. Team/Enterprise require admin enablement.

### Enable for Organization (Managed Settings)
```json
{
  "channelsEnabled": true,
  "allowedChannelPlugins": [
    { "marketplace": "claude-plugins-official", "plugin": "telegram" },
    { "marketplace": "claude-plugins-official", "plugin": "discord" },
    { "marketplace": "acme-corp-plugins", "plugin": "internal-ci-alerts" }
  ]
}
```

### CLI Flags
```bash
# Start with channels
claude --channels plugin:telegram@claude-plugins-official

# Multiple channels
claude --channels plugin:telegram@claude-plugins-official plugin:discord@claude-plugins-official

# Development channels (custom/local)
claude --dangerously-load-development-channels server:my-webhook
```

## Agent Teams Settings (Experimental)

### Enable
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"
}
```

### Display Modes
| Mode | Description |
|------|-------------|
| `"auto"` | Split panes in tmux/iTerm2, in-process otherwise |
| `"in-process"` | All teammates in main terminal |
| `"tmux"` | Force split panes (requires tmux or iTerm2) |

### CLI Override
```bash
claude --teammate-mode in-process
```

## Worktree Settings

Reduce disk usage and startup time in large monorepos:
```json
{
  "worktree": {
    "symlinkDirectories": ["node_modules", ".cache"],
    "sparsePaths": ["packages/my-app", "shared/utils"]
  }
}
```

## Settings Precedence

1. **Managed** (highest) — server-managed > MDM/plist > file-based > HKCU registry
2. **Command line arguments** — temporary session overrides
3. **Local** (`.claude/settings.local.json`) — personal project overrides
4. **Project** (`.claude/settings.json`) — team-shared settings
5. **User** (`~/.claude/settings.json`) — personal global (lowest)

Array settings (like permissions, sandbox paths) merge across scopes — they concatenate and deduplicate.

### Security-Hardened
```json
{
  "permissions": {
    "allow": [
      "Read", "Glob", "Grep"
    ],
    "deny": [
      "Write", "Edit",
      "Bash(*)", "WebFetch", "WebSearch",
      "Agent", "mcp__*"
    ]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/audit-all.sh"
      }]
    }]
  }
}
```
