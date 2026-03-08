# Claude Code Slash Commands

Complete reference for all built-in and custom slash commands.

## Built-in Slash Commands

### Session Management
| Command | Description |
|---------|-------------|
| `/clear` | Clear conversation and start fresh (same session) |
| `/compact` | Compress conversation to reduce context usage |
| `/compact [instructions]` | Compact with custom focus instructions |
| `/resume` | Resume a previous session |
| `/continue` | Continue current session |
| `/status` | Current session info |
| `/context` | View context window usage |

### Help & Info
| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/doctor` | Run diagnostics and health checks |
| `/version` | Show Claude Code version |
| `/settings` | View active settings |

### Model & Configuration
| Command | Description |
|---------|-------------|
| `/model` | View or change the current model |
| `/model <name>` | Switch to specific model (sonnet, opus, haiku) |
| `/permissions` | Manage permission rules |

### Conversation Modes
| Command | Description |
|---------|-------------|
| `/plan` | Enter plan mode (read-only analysis) |
| `/fast` | Toggle fast mode (faster output, same model) |

### Memory & Instructions
| Command | Description |
|---------|-------------|
| `/memory` | Edit CLAUDE.md and auto-memory |
| `/init` | Generate project CLAUDE.md |
| `/init-only` | Generate CLAUDE.md and exit |

### Agents & Skills
| Command | Description |
|---------|-------------|
| `/agents` | View, create, edit, delete subagents |
| `/agents list` | List all available agents |
| `/skills` | Browse available skills |
| `/plugin` | Manage plugins (install, enable, disable) |

### Tools & Servers
| Command | Description |
|---------|-------------|
| `/mcp` | Check MCP server status, authenticate |
| `/hooks` | Configure lifecycle hooks |
| `/add-dir <path>` | Add additional working directory |

### Code & Navigation
| Command | Description |
|---------|-------------|
| `/diff` | View git diff interactively |
| `/review` | Review pull request |
| `/fork [name]` | Fork current conversation |

### Display & Preferences
| Command | Description |
|---------|-------------|
| `/theme` | Change color theme |
| `/vim` | Toggle Vim editing mode |
| `/terminal-setup` | Configure keybindings |

### Built-in Skills
| Command | Description |
|---------|-------------|
| `/simplify` | Review code quality and refactor |
| `/batch <instruction>` | Parallel codebase changes |
| `/debug [description]` | Debug session issues |
| `/loop <interval>` | Recurring prompts |
| `/claude-api` | Load Claude API reference docs |

### Security & Sandbox
| Command | Description |
|---------|-------------|
| `/sandbox` | View or configure sandbox settings |
| `/security-review` | Run security analysis on codebase |

### Export & Sharing
| Command | Description |
|---------|-------------|
| `/export` | Export conversation |
| `/copy` | Copy last response to clipboard |

### Monitoring & Insights
| Command | Description |
|---------|-------------|
| `/tasks` | View background tasks |
| `/insights` | Session insights and analytics |
| `/stats` | Usage statistics |
| `/usage` | Token/cost usage for current session |
| `/extra-usage` | Extended usage details |

### Releases & Updates
| Command | Description |
|---------|-------------|
| `/release-notes` | View release notes for current version |
| `/upgrade` | Upgrade Claude Code to latest |

### Hooks & Plugins
| Command | Description |
|---------|-------------|
| `/save-hooks` | Save current hooks configuration |
| `/reload-plugins` | Reload installed plugins |

### Browser & Display
| Command | Description |
|---------|-------------|
| `/chrome` | Open Chrome browser session |
| `/desktop` | Desktop view mode |
| `/mobile` | Mobile view mode |
| `/ide` | IDE integration mode |

### Account & Auth
| Command | Description |
|---------|-------------|
| `/login` | Login to Anthropic |
| `/logout` | Logout from Anthropic |

### Configuration
| Command | Description |
|---------|-------------|
| `/rename` | Rename current conversation |
| `/keybindings` | View or edit keybindings |
| `/statusline` | Configure status line display |
| `/output-style` | Change output formatting style |
| `/privacy-settings` | View or edit privacy settings |
| `/add-dir` | Add working directory to context |

### Remote & Apps
| Command | Description |
|---------|-------------|
| `/remote-env` | Configure remote environment |
| `/remote-control` | Start remote control session |

### GitHub & Slack Apps
| Command | Description |
|---------|-------------|
| `/install-github-app` | Install Claude GitHub App |
| `/install-slack-app` | Install Claude Slack App |

### Bug Reporting
| Command | Description |
|---------|-------------|
| `/bug` | Report a bug (can be disabled via env var) |

### Input Prefixes
| Prefix | Action |
|--------|--------|
| `/` | Invoke command or skill |
| `!` | Bash mode (execute shell command) |
| `@` | File mention (add file to context) |
| `?` | Show shortcuts |

## Keyboard Shortcuts

### Input Controls
| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | Multi-line input |
| `Ctrl+C` | Interrupt current operation |
| `Ctrl+D` | Exit Claude Code |
| `Escape` | Rewind to last checkpoint |
| `Escape` (2x) | Full rewind |
| `Tab` | Auto-complete |
| `Up/Down` | Navigate command history |
| `?` | Show shortcuts |

### Mode & Toggle Controls
| Shortcut | Action |
|----------|--------|
| `Shift+Tab` | Cycle permission modes |
| `Ctrl+O` | Toggle verbose output |
| `Ctrl+B` | Send task to background |
| `Ctrl+T` | Toggle task list |
| `Option+P` | Switch model |
| `Option+T` | Toggle extended thinking |
| `Ctrl+G` | Open input in text editor |
| `Ctrl+V` | Paste image |

### Line Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Kill text from cursor to end of line |
| `Ctrl+U` | Kill text from cursor to start of line |
| `Ctrl+Y` | Yank (paste) killed text |
| `Alt+Y` | Cycle through kill ring |
| `Alt+B` | Move back one word |
| `Alt+F` | Move forward one word |
| `Alt+M` | Toggle multiline mode |

### Display & Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Clear screen |
| `Ctrl+R` | Reverse search history |
| `Ctrl+F` | Kill background agents |

### Permission Prompts
| Shortcut | Action |
|----------|--------|
| `y` / `Enter` | Approve (Allow Once) |
| `a` | Allow Always (for this session) |
| `n` | Deny |
| `d` | Deny Always (for this session) |
| `e` | Edit (modify the tool call) |

## Custom Slash Commands

### Creating Custom Commands

Custom commands are skill files in `.claude/skills/` or plugin directories.

#### Skill File Format

```markdown
---
name: my-command
description: What this command does
triggers:
  - /my-command
  - /mc
args:
  - name: target
    description: Target to operate on
    required: false
---

# My Custom Command

Instructions for Claude when this command is invoked.

## Steps
1. Do this first
2. Then do this
3. Finally do this

## Rules
- Always follow this pattern
- Never do this other thing
```

#### Plugin Command Format

Commands in plugin `commands/` directories:

```markdown
# Command Name

Description of what the command does.

## Usage
\`\`\`
/plugin-prefix:command-name [args]
\`\`\`

## Arguments
- `arg1` — Description
- `--flag` — Description

## Implementation

When this command is invoked:
1. Step one
2. Step two
3. Step three
```

### Command Resolution Order

1. Built-in commands (highest priority)
2. Project skills (`.claude/skills/`)
3. Installed plugin commands
4. User-level skills (`~/.claude/skills/`)

### Invoking Custom Commands

```
# Direct invocation
/my-command

# With arguments
/my-command some-argument

# Plugin-namespaced command
/plugin-name:command-name

# Via Skill tool (programmatic)
Skill(skill="my-command", args="some-argument")
```

## Plan Mode Details

When `/plan` is active:
1. Claude analyzes the request
2. Writes a step-by-step plan to a plan file
3. Calls `ExitPlanMode` to present plan to user
4. User reviews and approves/modifies/rejects
5. On approval, Claude executes the plan

### Plan Mode Permissions
- Read-only tools work normally
- Write/Edit/Bash require plan approval first
- Use `AskUserQuestion` for clarifications during planning
- Use `ExitPlanMode` when plan is ready (not `AskUserQuestion`)

## Context Management Commands

### /compact
Compresses the conversation to free up context window space.

```
/compact                    # Default compression
/compact focus on the API   # Compress with focus on API-related content
```

**When to use:**
- Context window is getting large
- Conversation has covered many topics
- You want to focus on a specific area

**How it works:**
- Summarizes previous conversation
- Preserves key decisions and context
- Reduces token count significantly
- Maintains file state awareness

### /clear
Starts a completely fresh conversation.

```
/clear
```

**When to use:**
- Switching to unrelated task
- Want a clean slate
- Context is too polluted

**Difference from /compact:**
- `/compact` preserves summarized context
- `/clear` removes all context entirely
