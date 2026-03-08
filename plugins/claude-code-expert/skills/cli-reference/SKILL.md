# Claude Code CLI Reference

Complete reference for the Claude Code command-line interface.

## Installation

```bash
# npm (global)
npm install -g @anthropic-ai/claude-code

# Direct invocation
npx @anthropic-ai/claude-code

# Update to latest
npm update -g @anthropic-ai/claude-code
```

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

### Core Flags
| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |
| `--print` | `-p` | Non-interactive mode: print response and exit |
| `--verbose` | | Enable verbose/debug logging |
| `--model` | `-m` | Override model (e.g., `claude-sonnet-4-6`) |
| `--continue` | `-c` | Resume most recent conversation |
| `--resume` | `-r` | Resume specific conversation by ID |

### Output & Format Flags
| Flag | Description |
|------|-------------|
| `--output-format` | Output format: `text` (default), `json`, `stream-json` |
| `--max-turns` | Maximum conversation turns in non-interactive mode |
| `--no-input` | Skip initial user input (for piped content) |
| `--input-format` | Input format: `text` (default), `stream-json` |

### Permission & Security Flags
| Flag | Description |
|------|-------------|
| `--dangerously-skip-permissions` | Skip all permission prompts (use with caution) |
| `--allowedTools` | Comma-separated list of allowed tools |
| `--disallowedTools` | Comma-separated list of disallowed tools |
| `--permission-mode` | Permission mode: `default`, `plan`, `bypassPermissions` |
| `--permission-prompt-tool` | MCP tool for handling permission prompts |

### Configuration Flags
| Flag | Description |
|------|-------------|
| `--append-system-prompt` | Append text to system prompt |
| `--system-prompt` | Override entire system prompt (use with `-p`) |
| `--mcp-config` | Path to MCP config JSON file |
| `--add-dir` | Add additional directories to context |

### Session Management Flags
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

### Behavior Configuration
| Variable | Description |
|----------|-------------|
| `DISABLE_AUTOMEMORY` | `1` to disable auto-memory |
| `DISABLE_BUG_COMMAND` | `1` to disable /bug command |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Override max output tokens |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` to disable telemetry |
| `CLAUDE_CODE_SKIP_DOCTOR` | `1` to skip doctor checks |

### Proxy & Network
| Variable | Description |
|----------|-------------|
| `HTTP_PROXY` / `HTTPS_PROXY` | HTTP/S proxy URL |
| `NO_PROXY` | Proxy bypass list |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` to skip TLS verification |

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
