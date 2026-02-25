# Neural Orchestration Platform — Claude Configuration Hub

This directory is the configuration center for Claude Code on this project. It defines
how Claude behaves, what it knows, what it can do, and how it learns from mistakes.
Every subdirectory has a specific, well-defined role. Understanding the relationships
between them is key to extending or debugging the system.

## Why this structure exists

Claude Code is more than a chat interface — it is an orchestration platform. Complex
tasks are broken into subtasks and delegated to specialized agents. Skills provide
reusable procedures. Rules enforce consistency. Hooks automate quality gates. MCP
servers extend Claude's reach into external systems. The registry ties everything
together so the right component is activated at the right time.

## Directory structure

```
.claude/
├── agents/          # 137 specialized subagents (30+ domain categories)
├── skills/          # 55 reusable skill procedures (SKILL.md format)
├── rules/           # 8 rule files that guide all Claude behavior
├── hooks/           # 11 lifecycle hooks (safety, quality, self-healing)
├── mcp-servers/     # 5 custom MCP servers (deploy, quality, metrics, etc.)
├── logs/            # Runtime logs (docker builds, subagent events, sessions)
├── CLAUDE.md        # Top-level project instructions (workflow, commands, models)
└── README.md        # This file
```

## Component quick reference

| Component | Count | Purpose |
|-----------|-------|---------|
| Agents | 137 | Specialized subagents invoked via `Task` tool |
| Skills | 55 | Reusable procedures activated by keyword triggers |
| Rules | 8 | Behavioral constraints loaded as project instructions |
| Hooks | 11 | Shell scripts that run at lifecycle events |
| MCP servers (custom) | 5 | Extended tooling for deploy, quality, metrics |
| MCP servers (external) | 2 | Perplexity (web research), Firecrawl (scraping) |
| Workflows | 21+ | Documented multi-step orchestration patterns |

## How the components relate

**Skills activate agents.** When you use a keyword like `ultrathink` or `jira-branch`,
the registry's quickLookup maps it to the appropriate skill or agent. Skills then
define which tools are available and how the procedure should be carried out.

**Hooks enforce lifecycle.** Every Bash command passes through the
`bash-safety-validator` hook before execution. Every `Edit`/`Write` call passes
through `protect-critical-files`. Errors are automatically captured by
`lessons-learned-capture.sh` and appended to the rules file so future sessions
avoid the same mistake.

**Rules guide all behavior.** Rule files are loaded as project instructions scoped
to file path patterns. The `code-style` rules only apply to TypeScript/JavaScript
files. The `docker-k8s` rules only apply to Docker, Kubernetes, and Helm files.
The `lessons-learned` file is global and grows automatically through the
self-healing loop.

**MCP servers extend tooling.** The five custom MCP servers give Claude structured
access to Docker build history, deployment state, project metrics, code quality
scores, and workflow pipelines — data that is not available through the standard
file/bash tools.

**The registry indexes everything.** The registry provides a quickLookup index
that maps trigger keywords to skill and agent definitions, enabling fast activation
without scanning all files.

## Data flow for a typical task

```
User request
    │
    ├─► Rules applied (code-style, git-workflow, etc.)
    │
    ├─► Skill activated (keyword match via registry)
    │
    ├─► Hook: PreToolUse (bash-safety-validator, protect-critical-files)
    │
    ├─► Agent invoked via Task tool (specialized subagent)
    │
    ├─► Hook: PostToolUse (docker-build-tracker, post-edit-lint)
    │
    ├─► Hook: PostToolUseFailure → lessons-learned-capture (if error)
    │
    └─► Hook: TaskCompleted → task-quality-gate (merge conflicts, TypeScript check)
```

## Subdirectory documentation

| Directory | README |
|-----------|--------|
| `agents/` | [agents/README.md](agents/README.md) |
| `skills/` | [skills/README.md](skills/README.md) |
| `rules/` | [rules/README.md](rules/README.md) |
| `hooks/` | [hooks/README.md](hooks/README.md) |
| `mcp-servers/` | [mcp-servers/README.md](mcp-servers/README.md) |

## Key configuration files

- **`CLAUDE.md`** — The primary project instruction file. Defines the
  EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT workflow, which models to use for
  which task types, and paths to all key components.
- **`.mcp.json`** (project root) — Registers all MCP servers (custom and external)
  with their startup commands and environment variables.
- **`rules/lessons-learned.md`** — Auto-growing file of captured errors and fixes.
  Read at session start to avoid known pitfalls.
