# Claude Code Expert Plugin v4.0

A comprehensive Claude Code knowledge base with **4-layer extension stack deployment**, **orchestration-first agent teams**, **mandatory audit loops**, and **agent lifecycle management**. Auto-detects your repo's tech stack and deploys a complete Claude Code configuration: CLAUDE.md (routing OS), Skills (capability packs), Hooks (guardrails & automation), Agents (specialized workers), MCP servers, hybrid memory architecture, and agent team orchestration templates.

**New in v4.0:**
- **Orchestration-first principle** — Claude prefers to delegate work to specialized agents rather than doing everything directly
- **Mandatory audit loops** — every agent's output gets a second-round review before acceptance
- **Agent lifecycle management** — health checks, idle detection, cleanup, and retention policies
- **Cross-audit pattern** — in teams of 3+, agents audit each other's work round-robin
- **3 new specialist agents** — team-orchestrator, audit-reviewer, agent-lifecycle-manager
- **2 new templates** — audited-builder, audited-squad
- **Claude Code Agent Teams support** — experimental mesh-network teams with TeammateIdle hooks
- **Updated for Claude 4.6** — Opus 4.6 (1M context), Sonnet 4.6, Haiku 4.5

Includes a **custom MCP server** for querying documentation programmatically and a **dedicated debugger** for diagnosing setup issues.

## The 4-Layer Extension Stack

Power users use all four layers together for transformative productivity gains:

| Layer | What | Impact |
|-------|------|--------|
| **CLAUDE.md** | Routing OS — project rules, decision trees, build commands | Agent navigates your codebase correctly |
| **Skills** | Capability packs — domain playbooks loaded on demand | 82% token savings vs loading everything |
| **Hooks** | Guardrails — auto-format, security, error capture | Compliance without asking |
| **Agents** | Specialized workers — code review, security, testing | Parallel expert analysis |

## What's Included

### Agents (11)
| Agent | Domain |
|-------|--------|
| `claude-code-architect` | Overall Claude Code setup, project structure, CLAUDE.md |
| `claude-code-debugger` | Diagnose and fix ALL Claude Code setup/runtime issues |
| `council-coordinator` | Multi-agent council reviews with deliberation protocols |
| `hooks-specialist` | Hook system design, lifecycle events, security patterns |
| `mcp-configurator` | MCP server setup, configuration, custom servers |
| `sdk-guide` | Claude Agent SDK, building custom agents, tool use |
| `ide-integration-specialist` | VS Code, JetBrains, Vim/Neovim integration |
| `permissions-security-advisor` | Permission model, security best practices |
| **`team-orchestrator`** | Master orchestrator — delegates, monitors, audits agent work |
| **`audit-reviewer`** | Second-round auditor — finds gaps other agents missed |
| **`agent-lifecycle-manager`** | Agent health checks, idle cleanup, retention policies |

### Skills (20)
| Skill | Coverage |
|-------|----------|
| `cli-reference` | Every CLI flag, argument, and environment variable |
| `configuration` | settings.json, CLAUDE.md, .claude/ directory, .mcp.json |
| `hooks-system` | PreToolUse, PostToolUse, Notification, Stop, SubagentStop hooks |
| `mcp-servers` | MCP protocol, server config, built-in and custom servers |
| `agent-sdk` | Claude Agent SDK, spawning agents, tool schemas, multi-agent patterns |
| `ide-integrations` | VS Code extension, JetBrains plugin, terminal, remote dev |
| `permissions-security` | Permission modes, allowlists/denylists, enterprise security |
| `slash-commands` | Built-in slash commands, keyboard shortcuts, custom commands |
| `context-management` | Context window, /compact, /clear, conversation flow |
| `memory-instructions` | CLAUDE.md hierarchy, project/user instructions, auto-memory, rules |
| `tools-reference` | All built-in tools: Read, Write, Edit, Glob, Grep, Bash, Agent, etc. |
| `extended-thinking` | Extended thinking, ultrathink, thinking budget configuration |
| `git-integration` | Git workflows, commits, PRs, branch management, safety rules |
| `testing-workflows` | Test running, TDD patterns, test frameworks, coverage |
| `cost-optimization` | Token usage, model routing, caching, batch processing, cost reduction |
| `troubleshooting` | Common errors, debugging, diagnostics, self-healing protocol |
| `teams-collaboration` | Team plans, Agent Teams, enterprise settings, multi-user workflows, onboarding |
| `settings-deep-dive` | Complete settings.json schema, every permission pattern, feature flags |
| **`agent-lifecycle`** | Agent health checks, idle detection, cleanup, retention, audit loops |

### Commands (11)
| Command | Purpose |
|---------|---------|
| `/cc-setup` | **Full repo analysis & 4-layer deployment** — detect stack, deploy all layers, install MCP, configure memory |
| `/cc-memory` | **Hybrid memory architecture** — split rule files, MCP-backed long-term memory, rotation, audit |
| `/cc-orchestrate` | **Agent team templates** — builder-validator, QA swarm, feature squad, research council, and more |
| `/cc-help` | Interactive Claude Code documentation lookup |
| `/cc-config` | Generate or audit Claude Code configuration |
| `/cc-hooks` | Design and implement Claude Code hooks |
| `/cc-mcp` | Configure and troubleshoot MCP servers |
| `/cc-agent` | Build custom agents with the Agent SDK |
| `/cc-troubleshoot` | Diagnose and fix Claude Code issues |
| `/cc-debug` | Comprehensive debugger for Claude Code setup |

### Custom MCP Server (6 tools)
| Tool | Purpose |
|------|---------|
| `cc_docs_search` | Search documentation by topic keyword |
| `cc_docs_list_topics` | List all available documentation topics |
| `cc_docs_full_reference` | Get complete docs for a specific topic |
| `cc_docs_env_vars` | Environment variables reference |
| `cc_docs_settings_schema` | Complete settings.json schema |
| `cc_docs_troubleshoot` | Troubleshooting guidance for specific issues |

## Installation

```bash
/plugin-install claude-code-expert
```

### Enable MCP Server

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-code-docs": {
      "command": "node",
      "args": ["plugins/claude-code-expert/mcp-server/src/index.js"]
    }
  }
}
```

Then install MCP server dependencies:
```bash
cd plugins/claude-code-expert/mcp-server && npm install
```

## Quick Start

### Full Setup (Recommended)
```bash
/cc-setup                              # Interactive 10-phase setup
/cc-setup --auto                       # Non-interactive best-guess
/cc-setup --preset power-user          # Maximum configuration
/cc-setup --dry-run                    # Preview without writing files
```

### Memory Architecture
```bash
/cc-memory --init                      # Set up split memory files
/cc-memory --mcp                       # Add MCP-backed persistent memory
/cc-memory --status                    # Check memory usage & token estimates
/cc-memory --audit                     # Find bloat, duplicates, stale entries
/cc-memory --rotate                    # Archive old session summaries
/cc-memory --dry-run                   # Preview without writing files
```

### Agent Orchestration
```bash
/cc-orchestrate --list                 # See all templates
/cc-orchestrate --template builder-validator    # Standard build + review
/cc-orchestrate --template qa-swarm            # Multi-perspective testing
/cc-orchestrate --template feature-squad       # Full-stack feature team
/cc-orchestrate --template research-council    # Evaluate multiple approaches
/cc-orchestrate --template pr-review-board     # Critical PR multi-review
/cc-orchestrate --worktree                     # Git worktrees for parallel agents
/cc-orchestrate --dry-run --template qa-swarm  # Preview without deploying
```

### Other Commands
```bash
/cc-help "How do I configure hooks?"
/cc-config --audit
/cc-hooks create security-guard
/cc-mcp add postgres
/cc-agent create my-custom-agent
/cc-troubleshoot auth
/cc-debug --fix
```

### MCP Tools (after enabling server)
The MCP server provides tools that Claude can use directly:
```
mcp__claude-code-docs__cc_docs_search("hooks")
mcp__claude-code-docs__cc_docs_full_reference("settings-deep-dive")
mcp__claude-code-docs__cc_docs_troubleshoot("MCP server not starting")
```

## Setup Presets

| Preset | Layers | MCP | Memory | Cost | Best For |
|--------|--------|-----|--------|------|----------|
| `minimal` | CLAUDE.md only | None | Default | Lowest | Small/personal projects |
| `developer` | All 4 | 2-3 detected | Split files | Low | Standard development |
| `power-user` | All 4 + full | All detected | Split + MCP memory | Medium | Maximum productivity |
| `ci-cd` | CLAUDE.md + hooks | GitHub only | None | Very low | CI/CD pipelines |
| `secure` | CLAUDE.md + hooks | None | None | Low | Security-first environments |
| `team` | All 4 (shared) | Project-scoped | Shared rules | Medium | Team projects |

## Orchestration Templates

| Template | Type | Agents | Audit | Use Case |
|----------|------|--------|-------|----------|
| `builder-validator` | Subagent | 2 | Single review | Standard feature work |
| **`audited-builder`** | Subagent | 3 | Full audit loop | Quality-critical features |
| `qa-swarm` | Agent Team | 4-6 | Peer review | Thorough testing |
| `feature-squad` | Agent Team | 3-4 | Lead review | Full-stack features |
| **`audited-squad`** | Agent Team | 5 | Cross-audit + final | Critical full-stack work |
| `research-council` | Subagent | 2-3 | Source validation | Design decisions |
| `refactor-pipeline` | Subagent | 3 | Verifier step | Large refactors |
| `pr-review-board` | Agent Team | 3 | Cross-review | Critical PR reviews |
| `docs-sprint` | Agent Team | 3-4 | Accuracy check | Documentation updates |
| `continuous-monitor` | Headless | 1-4 | Automated | Ongoing automation |

## Documentation Coverage

This plugin provides deep knowledge across these areas:

- **CLI**: Every flag, argument, pipe mode, output format
- **Configuration**: CLAUDE.md, settings.json, .mcp.json, rules, .claude/ directory
- **Settings**: Complete schema, permission patterns, hook config, env vars, feature flags
- **Hooks**: All 6 hook events, matchers, input/output schemas, example scripts
- **MCP**: Server configuration, 20+ known servers, custom server development, MCP prompts
- **Agent SDK**: Programmatic usage, streaming, multi-agent patterns, CI/CD
- **IDE**: VS Code, JetBrains, terminal, remote dev, Codespaces
- **Permissions**: Modes, allow/deny lists, patterns, enterprise controls
- **Commands**: All built-in slash commands, keyboard shortcuts, custom commands
- **Context**: Window management, /compact, /clear, token reduction strategies
- **Memory**: 3-tier hybrid architecture, split files, MCP-backed persistence, rotation
- **Orchestration**: Subagents, Agent Teams, 10 templates, audit loops, lifecycle management, worktrees, headless/cron
- **Tools**: Every built-in tool with parameters and best practices
- **Thinking**: Extended thinking, budget config, API usage
- **Git**: Commit workflow, PR creation, worktrees, parallel development
- **Testing**: TDD, test frameworks, QA swarms, coverage
- **Cost**: Model cascading, progressive skill loading, context budgeting
- **Teams**: Team plans, enterprise settings, shared config, onboarding
- **Debugging**: Systematic diagnostics, common fixes, self-healing protocol
