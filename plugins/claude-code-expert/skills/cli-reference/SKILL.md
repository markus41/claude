# Claude Code CLI Reference

Complete reference for the Claude Code command-line interface.

## Installation

### System Requirements
- macOS 13.0+, Windows 10 1809+, Ubuntu 20.04+, Debian 10+, Alpine 3.19+
- 4GB+ RAM
- Internet connection required
- Shell: Bash, Zsh, PowerShell, CMD
- Windows: Git for Windows required

### Methods

```bash
# Native (Recommended)
curl -fsSL https://claude.ai/install.sh | bash

# Homebrew (macOS)
brew install --cask claude-code

# WinGet (Windows)
winget install Anthropic.ClaudeCode

# npm (legacy)
npm install -g @anthropic-ai/claude-code

# Direct invocation
npx @anthropic-ai/claude-code

# Update to latest
npm update -g @anthropic-ai/claude-code
```

### Initial Login
```bash
claude     # First run opens browser for login
```
Supports: Claude Pro, Teams, Enterprise, Console, Bedrock, Vertex AI, Foundry.
Credentials stored at `~/.claude.json`.

## Basic Usage

```bash
# Interactive mode (default)
claude

# Start with initial prompt
claude "explain this codebase"

# Non-interactive / print mode
claude -p "what does this function do?"

# Pipe input
cat file.ts | claude -p "review this code"

# Resume last conversation
claude --continue

# Resume specific conversation
claude --resume <session-id>
```

## CLI Flags

### Session Management Flags
| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |
| `--print` | `-p` | Non-interactive mode: print response and exit |
| `--verbose` | | Enable verbose/debug logging |
| `--debug [category]` | | Debug logging for specific category |
| `--model` | `-m` | Override model (e.g., `sonnet`, `opus`, `haiku`) |
| `--continue` | `-c` | Resume most recent conversation |
| `--resume` | `-r` | Resume specific conversation by ID |
| `--fork-session` | | Create new session from current context |
| `--teleport` | | Resume a web session locally |
| `--remote "task"` | | Create cloud session |
| `--worktree` | `-w` | Run in isolated git worktree |

### Output & Format Flags
| Flag | Description |
|------|-------------|
| `--output-format` | Output format: `text` (default), `json`, `stream-json` |
| `--max-turns` | Maximum conversation turns in non-interactive mode |
| `--max-budget-usd` | Spending limit per session |
| `--no-input` | Skip initial user input (for piped content) |
| `--input-format` | Input format: `text` (default), `stream-json` |
| `--json-schema` | Structured output with JSON schema (print mode) |

### Permission & Security Flags
| Flag | Description |
|------|-------------|
| `--dangerously-skip-permissions` | Skip all permission prompts (use with caution) |
| `--allowedTools` | Comma-separated list of allowed tools |
| `--disallowedTools` | Comma-separated list of disallowed tools |
| `--permission-mode` | Permission mode: `default`, `plan`, `acceptEdits`, `dontAsk`, `bypassPermissions` |
| `--permission-prompt-tool` | MCP tool for handling permission prompts |

### Configuration Flags
| Flag | Description |
|------|-------------|
| `--system-prompt` | Override entire system prompt (use with `-p`) |
| `--append-system-prompt` | Append text to system prompt |
| `--system-prompt-file` | Load system prompt from file |
| `--append-system-prompt-file` | Append system prompt from file |
| `--mcp-config` | Path to MCP config JSON file |
| `--settings` | Load settings from file or JSON string |
| `--agents` | Define custom agents as JSON |
| `--plugin-dir` | Load plugin from directory (repeatable) |
| `--add-dir` | Add additional working directories to context |
| `--init` | Run initialization hooks |
| `--maintenance` | Run maintenance hooks |

### PR & Review Flags
| Flag | Description |
|------|-------------|
| `--from-pr <url>` | Load PR context from GitHub URL |
| `--fallback-model` | Fallback model if primary unavailable |

### Agent Team Flags
| Flag | Description |
|------|-------------|
| `--teammate-mode` | Run as part of an agent team |
| `--chrome` | Enable Chrome browser for agent |
| `--no-chrome` | Disable Chrome browser |
| `--strict-mcp-config` | Fail on invalid MCP config |
| `--setting-sources` | Show which file each setting comes from |
| `--include-partial-messages` | Include partial messages in stream output |
| `--betas` | Enable beta features |
| `--no-session-persistence` | Disable session persistence |
| `--allow-dangerously-skip-permissions` | Allow skipping permissions programmatically |

### Auth CLI
```bash
claude auth login              # Login to Anthropic
claude auth logout             # Logout
claude auth status             # Show auth status

claude agents                  # Manage agent teams
claude update                  # Update Claude Code

claude mcp add-json <name> <json>   # Add MCP from JSON blob
claude mcp add-from-claude-desktop  # Import from Claude Desktop
```

### Session ID Flags
| Flag | Description |
|------|-------------|
| `--session-id` | Set specific session ID |
| `--conversation-id` | Set conversation ID within session |

## Environment Variables

### Authentication
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key for Anthropic direct access |
| `ANTHROPIC_AUTH_TOKEN` | OAuth/bearer token for API access |
| `CLAUDE_CODE_API_KEY` | Alternative API key variable |

### Provider Selection
| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_USE_BEDROCK` | `1` to use AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX` | `1` to use Google Vertex AI |
| `ANTHROPIC_BASE_URL` | Custom API base URL |

### AWS Bedrock Configuration
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock endpoint URL |
| `AWS_REGION` | AWS region for Bedrock |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_SESSION_TOKEN` | AWS session token (for temporary creds) |
| `AWS_PROFILE` | AWS profile name |
| `ANTHROPIC_MODEL` | Override model ID for Bedrock |

### Google Vertex Configuration
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_VERTEX_PROJECT_ID` | GCP project ID |
| `CLOUD_ML_REGION` | GCP region |
| `ANTHROPIC_VERTEX_BASE_URL` | Custom Vertex endpoint |

### Model Overrides
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_MODEL` | Override default model ID |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Override Sonnet model ID |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Override Opus model ID |
| `CLAUDE_CODE_EFFORT_LEVEL` | Reasoning effort: `low`, `medium`, `high` |

### Behavior Configuration
| Variable | Description |
|----------|-------------|
| `DISABLE_AUTOMEMORY` | `1` to disable auto-memory |
| `DISABLE_AUTOUPDATER` | `1` to disable auto-updates |
| `DISABLE_BUG_COMMAND` | `1` to disable /bug command |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Override max output tokens |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` to disable telemetry |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | Enable OpenTelemetry |
| `CLAUDE_CODE_SKIP_DOCTOR` | `1` to skip doctor checks |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | Disable fast Opus mode |
| `CLAUDE_CODE_SIMPLE` | Use minimal system prompt |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | Disable large context window |
| `CLAUDE_CODE_SHELL` | Override shell detection |
| `BASH_DEFAULT_TIMEOUT_MS` | Bash command timeout in ms |
| `MAX_MCP_OUTPUT_TOKENS` | MCP tool output token limit |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Skill character budget |

### Directory Overrides
| Variable | Description |
|----------|-------------|
| `CLAUDE_CONFIG_DIR` | Custom config directory location |
| `CLAUDE_CODE_TMPDIR` | Override temporary directory |

### Cloud Provider: Microsoft Foundry
| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_USE_FOUNDRY` | `1` to use Microsoft Foundry |

### Agent Teams & Advanced
| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable agent teams feature |
| `CLAUDE_CODE_TEAM_NAME` | Team name for agent teams |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Require plan mode for teammates |
| `CLAUDE_CODE_DISABLE_CRON` | Disable background cron tasks |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable all background tasks |
| `CLAUDE_CODE_SHELL_PREFIX` | Prefix for shell commands |

### mTLS & Client Certificates
| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_CLIENT_CERT` | Client certificate path for mTLS |
| `CLAUDE_CODE_CLIENT_KEY` | Client private key path |
| `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE` | Passphrase for client key |

### Proxy & Network
| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` / `HTTPS_PROXY` | HTTP/S proxy URL |
| `NO_PROXY` | Proxy bypass list |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` to skip TLS verification |
| `CLAUDE_CODE_PROXY_RESOLVES_HOSTS` | Let proxy handle DNS resolution |

### Model Aliases
| Alias | Resolves To |
|-------|-------------|
| `opus` | `claude-opus-4-6` |
| `sonnet` | `claude-sonnet-4-6` |
| `haiku` | `claude-haiku-4-5-20251001` |
| `opusplan` | Opus with plan mode |
| `sonnet[1m]` | Sonnet with 1M context |
| `claude-opus-4-6[1m]` | Opus with 1M context |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |

## Examples

```bash
# Use specific model
claude -m claude-haiku-4-5-20251001 -p "quick question"

# JSON output for scripting
claude -p "list files" --output-format json

# Multi-turn with max turns
claude -p "refactor this" --max-turns 5

# With Bedrock
CLAUDE_CODE_USE_BEDROCK=1 AWS_REGION=us-east-1 claude

# With Vertex
CLAUDE_CODE_USE_VERTEX=1 ANTHROPIC_VERTEX_PROJECT_ID=my-project claude

# Add extra directories
claude --add-dir /path/to/other/repo

# With custom MCP config
claude --mcp-config ./custom-mcp.json
```
