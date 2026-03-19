# Claude Code Expert Plugin v6.0

A high-intelligence Claude Code copilot with **16 commands**, **33 skills**, **16 agents**, and a **10-tool MCP server**. Features deep code reasoning, evidence-driven planning, orchestration-first execution, model routing, CI/CD integration, enterprise security, context budgeting, plugin development guidance, prompt engineering, performance profiling, and interactive tutorials.

**New in v6.0:**
- **Model Router Intelligence** — `model-routing` skill with decision matrices, cost tables, and budget-aware model selection
- **Context Budget Mastery** — `/cc-budget` command + `context-budgeting` skill for token arithmetic, anchor budgets, and compact strategies
- **CI/CD Integration** — `/cc-cicd` command + `cicd-integration` skill for GitHub Actions, headless mode, automated PR reviews
- **Plugin Development Guide** — `plugin-development` skill + `plugin-architect` agent for building Claude Code plugins
- **Prompt Engineering** — `prompt-engineering` skill for crafting effective CLAUDE.md, rules, agent prompts, and task instructions
- **Performance Profiling** — `/cc-perf` command + `session-analytics` skill for token tracking and cost optimization
- **Enterprise Security** — `enterprise-security` skill + `security-compliance-advisor` agent for SOC2, HIPAA, GDPR compliance
- **Worked Examples** — `/cc-learn` command + 8 step-by-step tutorials covering setup through CI/CD
- **Advanced Agent Teams** — `agent-teams-advanced` skill + `teams-architect` agent for topology design and coordination
- **MCP Server v3.0** — 3 new tools: `cc_docs_model_recommend`, `cc_docs_checklist`, `cc_docs_compare`

**From v5.0:** Deep Code Intelligence, Principal Engineer Strategist, smarter MCP retrieval, bootstrap context.
**From v4.x:** Research routing, context anchoring, self-healing, orchestration-first, agent lifecycle, council review.

Includes a **10-tool MCP server** for querying documentation, model recommendations, checklists, and comparisons programmatically.

## The 4-Layer Extension Stack

Power users use all four layers together for transformative productivity gains:

| Layer | What | Impact |
|-------|------|--------|
| **CLAUDE.md** | Routing OS — project rules, decision trees, build commands | Agent navigates your codebase correctly |
| **Skills** | Capability packs — domain playbooks loaded on demand | 82% token savings vs loading everything |
| **Hooks** | Guardrails — auto-format, security, error capture | Compliance without asking |
| **Agents** | Specialized workers — code review, security, testing | Parallel expert analysis |

## What's Included

### Agents (16)
| Agent | Domain |
|-------|--------|
| `claude-code-architect` | Overall Claude Code setup, project structure, CLAUDE.md |
| `claude-code-debugger` | Diagnose and fix ALL Claude Code setup/runtime issues |
| `council-coordinator` | Multi-agent council reviews with deliberation protocols + Context7 |
| `hooks-specialist` | Hook system design, lifecycle events, security patterns |
| `mcp-configurator` | MCP server setup, configuration, custom servers |
| `sdk-guide` | Claude Agent SDK, building custom agents, tool use |
| `ide-integration-specialist` | VS Code, JetBrains, Vim/Neovim integration |
| `permissions-security-advisor` | Permission model, security best practices |
| `team-orchestrator` | Master orchestrator — delegates, monitors, audits, routes research |
| `audit-reviewer` | Second-round auditor with Context7 library validation |
| `agent-lifecycle-manager` | Agent health checks, idle cleanup, retention policies |
| `research-orchestrator` | Routes research to Perplexity/Firecrawl/Context7 based on task |
| `principal-engineer-strategist` | Principal-level reasoning for architecture, debugging, tradeoffs, and hidden constraints |
| **`plugin-architect`** | Plugin design, scaffolding, manifest validation, marketplace publishing |
| **`security-compliance-advisor`** | Enterprise security audit, SOC2/HIPAA/GDPR compliance, remediation planning |
| **`teams-architect`** | Agent Team topology design, sizing, cost estimation, coordination optimization |

### Skills (33)
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
| `agent-lifecycle` | Agent health checks, idle detection, cleanup, retention, audit loops |
| `research-routing` | Optimal routing: Perplexity (Q&A), Firecrawl (extraction), Context7 (docs) |
| `context-anchoring` | Preserve critical info across /compact — PreCompact/PostCompact hooks |
| `self-healing-advanced` | Pattern detection, rotation, rule promotion, cross-agent learning |
| `deep-code-intelligence` | Evidence-driven workflow for hard bugs, architecture choices, and high-stakes implementation plans |
| `council-review` | Deliberation protocols, scoring systems, weighted voting |
| **`model-routing`** | Intelligent model selection with decision matrices, cost tables, budget planning |
| **`context-budgeting`** | Token arithmetic, anchor budget math, compact strategies, progressive loading |
| **`cicd-integration`** | GitHub Actions, headless mode, automated PR reviews, secrets management |
| **`plugin-development`** | Building plugins: manifest schema, command/skill/agent/hook authoring, marketplace publishing |
| **`prompt-engineering`** | Effective CLAUDE.md, rules, agent prompts, task framing, template library |
| **`session-analytics`** | Token tracking, bottleneck identification, caching behavior, cost estimation |
| **`enterprise-security`** | Audit logging, SOC2/HIPAA/GDPR compliance, secrets management, permission hardening |
| **`worked-examples`** | 8 end-to-end tutorials: setup, hooks, review, agents, optimization, debugging, memory, CI/CD |
| **`agent-teams-advanced`** | Agent Teams topology design, worktree coordination, failure handling, custom templates |

### Commands (16)
| Command | Purpose |
|---------|---------|
| `/cc-setup` | **Full repo analysis & 4-layer deployment** — detect stack, deploy all layers, install MCP, configure memory |
| `/cc-memory` | **Hybrid memory architecture** — split rule files, MCP-backed long-term memory, rotation, audit |
| `/cc-orchestrate` | **Agent team templates** — builder-validator, QA swarm, feature squad, research council, and more |
| `/cc-intel` | Deep code intelligence mode — repo fingerprinting, hypothesis trees, option scoring, validation strategy |
| `/cc-council` | Multi-agent council review with 6 protocols, scoped scoring, weighted voting |
| `/cc-help` | Interactive Claude Code documentation lookup |
| `/cc-config` | Generate or audit Claude Code configuration |
| `/cc-hooks` | Design and implement Claude Code hooks |
| `/cc-mcp` | Configure and troubleshoot MCP servers |
| `/cc-agent` | Build custom agents with the Agent SDK |
| `/cc-troubleshoot` | Diagnose and fix Claude Code issues |
| `/cc-debug` | Comprehensive debugger for Claude Code setup |
| **`/cc-budget`** | Context budget calculator — audit token consumers, optimize allocation, plan anchor strategies |
| **`/cc-cicd`** | CI/CD pipeline generator — GitHub Actions, GitLab CI, pre-commit hooks, automated PR review |
| **`/cc-perf`** | Session performance analyzer — token tracking, bottleneck identification, cost optimization |
| **`/cc-learn`** | Interactive tutorials — 8 step-by-step walkthroughs for common Claude Code workflows |

### Custom MCP Server v3.0 (10 tools)
| Tool | Purpose |
|------|---------|
| `cc_docs_search` | Search documentation by topic keyword |
| `cc_docs_list_topics` | List all available documentation topics |
| `cc_docs_full_reference` | Get complete docs for a specific topic |
| `cc_docs_env_vars` | Environment variables reference |
| `cc_docs_settings_schema` | Complete settings.json schema |
| `cc_docs_troubleshoot` | Troubleshooting guidance for specific issues |
| `cc_docs_resolve_task` | Recommend the best commands, agents, and docs for a natural-language engineering task |
| **`cc_docs_model_recommend`** | Recommend optimal model for a task with cost estimate and budget awareness |
| **`cc_docs_checklist`** | Step-by-step checklists for setup, review, debug, deploy, and security tasks |
| **`cc_docs_compare`** | Side-by-side comparison of any 2-3 commands, skills, or agents |

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

### New in v6.0
```bash
/cc-budget audit                   # See what consumes your context window
/cc-cicd generate github-actions   # Generate CI/CD workflow with Claude Code
/cc-perf analyze                   # Find token waste and optimize costs
/cc-learn setup                    # Interactive tutorial for new users
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
- **Research Routing**: Perplexity (knowledge), Firecrawl (extraction), Context7 (library docs), chaining strategies
- **Anchoring**: Context preservation, PreCompact/PostCompact hooks, anchor budgets, state recovery
- **Self-Healing**: Pattern detection, lessons rotation, rule promotion, cross-agent learning, health scoring
- **Orchestration**: Subagents, Agent Teams, 10 templates, audit loops, lifecycle management, worktrees, headless/cron
- **Tools**: Every built-in tool with parameters and best practices
- **Thinking**: Extended thinking, budget config, API usage
- **Git**: Commit workflow, PR creation, worktrees, parallel development
- **Testing**: TDD, test frameworks, QA swarms, coverage
- **Cost**: Model cascading, progressive skill loading, context budgeting
- **Teams**: Team plans, enterprise settings, shared config, onboarding
- **Debugging**: Systematic diagnostics, common fixes, self-healing protocol
