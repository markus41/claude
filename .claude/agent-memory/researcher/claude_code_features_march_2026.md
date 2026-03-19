---
name: Claude Code & Agent SDK March 2026 Features
description: Comprehensive research on sub-agent capabilities, agent teams, multi-agent orchestration, hooks, and Claude model updates
type: reference
---

# Claude Code and Claude Agent SDK - March 2026 Research

## Date
2026-03-19

## Key Findings

### 1. Sub-Agent Capabilities

**Built-in Subagent Types:**
- **Explore** (Haiku): Read-only agent for file discovery and codebase search
- **Plan**: Research agent for gathering context before planning
- **General-purpose**: Capable agent handling both exploration and modifications
- **Bash, statusline-setup, Claude Code Guide**: Helper agents for specific tasks

**Custom Subagent Features:**
- YAML frontmatter configuration in Markdown files
- Located at `.claude/agents/` (project) or `~/.claude/agents/` (user)
- Scope options: project, user, CLI-defined (session-only), or plugin-provided
- Fields: `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `isolation`

**Subagent Execution Modes:**
- **Foreground**: Blocking, permission prompts passed through to user
- **Background**: Concurrent, requires upfront permission pre-approval, auto-denies unapproved tools
- Toggle with `Ctrl+B` or set `background: true` in config
- Cannot nest (subagents cannot spawn other subagents)

**Subagent Persistence & Memory:**
- Persistent memory directory at `~/.claude/agent-memory/<name>/` (user), `.claude/agent-memory/<name>/` (project)
- Full conversation history retained when resuming subagents
- Auto-compaction support triggered at ~95% capacity
- Transcripts stored at `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`

**Subagent Tool Control:**
- `tools` field: allowlist of tools (inherits all if omitted)
- `disallowedTools` field: denylist
- `Agent(agent_type)` syntax for restricting which subagents can be spawned
- Hooks support for conditional validation (e.g., read-only database queries)
- Permission modes: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan`

### 2. Agent Teams (Experimental)

**Enable Agent Teams:**
- Add `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to `.claude/settings.json` env or shell
- Requires Claude Code v2.1.32 or later
- **Still experimental** - has known limitations

**Architecture:**
- **Lead**: Main session that creates and coordinates team
- **Teammates**: Separate Claude Code instances, each with own context window
- **Task List**: Shared work items with dependencies (at `~/.claude/teams/{team-name}/config.json`)
- **Mailbox**: Messaging system for direct inter-agent communication

**When to Use Agent Teams:**
- Research and review: parallel investigation with different angles
- New modules/features: team members own separate pieces independently
- Debugging with competing hypotheses: test multiple theories in parallel
- Cross-layer coordination: frontend, backend, tests by different teammates
- **NOT for**: sequential tasks, same-file edits, highly dependent work (use subagents instead)

**Communication:**
- Teammates can message each other directly (unlike subagents)
- Automatic message delivery, no polling
- Idle notifications automatically sent to lead
- Lead assigns tasks or teammates self-claim from shared list

**Display Modes:**
- **In-process** (default): All in main terminal, use `Shift+Down` to cycle
- **Split-panes**: Each teammate gets own pane via tmux or iTerm2
- Configure with `"teammateMode": "in-process"` or `--teammate-mode` flag

**Token Cost:**
- Each teammate has own context window - uses significantly more tokens
- Roughly **4-7x more tokens** than single session
- **~15x standard usage** for full agent teams (announced Feb 2026)
- Diminishing returns beyond 5-6 teammates

**Limitations (Experimental):**
- No session resumption with in-process teammates (`/resume` and `/rewind` don't restore them)
- Task status can lag - teammates may fail to mark tasks as complete
- Shutdown can be slow
- One team per session
- No nested teams (teammates cannot spawn other teams)
- Lead is fixed - cannot promote teammate or transfer leadership
- Permissions set at spawn - all teammates start with lead's mode
- Split-panes require tmux or iTerm2

**Best Practices:**
- 3-5 teammates for most workflows (balance parallelism vs coordination)
- 5-6 tasks per teammate keeps everyone productive
- Avoid file conflicts - break work so each teammate owns different files
- Check in on progress, redirect failing approaches, synthesize findings
- Start with research/review before moving to parallel implementation
- Wait for teammates to finish before lead does work itself

### 3. Agent Tool & Subagent Spawning

**Agent Tool (renamed from Task in v2.1.63):**
- Used to spawn subagents from main conversation
- Takes `agent_type` parameter for which subagent to spawn
- Can spawn with `Agent(agent_type)` syntax in tools list to restrict types

**Subagent Types Parameter Options:**
- `Agent` without parentheses: can spawn any subagent
- `Agent(worker, researcher)`: allowlist specific agents
- Omitted from tools: cannot spawn any subagents
- Wildcards supported in allowlists

**Resume Subagents:**
- Each subagent has unique agent ID
- Use `SendMessage` tool with agent ID in `to` field to resume
- Ask Claude to "continue that work" or "resume the X subagent"
- Full conversation history retained including all previous tool calls
- Find IDs in `.claude/projects/{project}/{sessionId}/subagents/`

### 4. Claude Code Hooks System - March 2026

**Hook Events (28 total):**
- `SessionStart`: session begins or resumes
- `UserPromptSubmit`: before Claude processes prompt
- `PreToolUse`: before tool execution (can block)
- `PermissionRequest`: when permission dialog appears
- `PostToolUse`: after tool succeeds
- `PostToolUseFailure`: after tool fails
- `Notification`: Claude needs attention/input
- `SubagentStart`: subagent spawned
- `SubagentStop`: subagent finishes
- `Stop`: Claude finishes responding
- `StopFailure`: turn ends due to API error
- `TeammateIdle`: agent team teammate about to idle
- `TaskCompleted`: task marked complete
- `InstructionsLoaded`: CLAUDE.md or rules loaded
- `ConfigChange`: config file changed
- `WorktreeCreate`/`WorktreeRemove`: git worktree lifecycle
- `PreCompact`/`PostCompact`: context compaction
- `Elicitation`/`ElicitationResult`: MCP server user input

**Hook Types:**
1. **Command** (`"type": "command"`): Shell script with stdin/stdout/exit codes
2. **HTTP** (`"type": "http"`): POST event data to webhook endpoint
3. **Prompt** (`"type": "prompt"`): Single-turn LLM evaluation (Haiku default)
4. **Agent** (`"type": "agent"`): Multi-turn subagent verification with tools

**Hook Configuration Locations (scoped):**
- `~/.claude/settings.json`: all projects (not shareable)
- `.claude/settings.json`: single project (shareable, in repo)
- `.claude/settings.local.json`: project-specific (gitignored)
- Managed policy settings: organization-wide
- Plugin `hooks/hooks.json`: when plugin enabled
- Skill/agent frontmatter: while skill/agent active

**Hook Exit Codes:**
- **0**: action proceeds (command hooks) or stdout becomes context (SessionStart/UserPromptSubmit)
- **2**: action blocked, stderr becomes Claude feedback
- **Other**: action proceeds, stderr logged (visible in verbose mode `Ctrl+O`)

**Hook Matchers:**
- Filter by tool name: `Bash`, `Edit|Write`, `mcp__.*`
- Filter by event source: `startup`, `resume`, `clear`, `compact`
- Filter by MCP server: configured MCP server names
- Most use regex patterns (case-sensitive)

**Common Patterns:**
1. **Notifications**: macOS (`osascript`), Linux (`notify-send`), Windows (PowerShell)
2. **Auto-format**: Run Prettier/Eslint on Edit/Write
3. **Protect files**: Block edits to `.env`, `.git/`, package-lock.json
4. **Audit logging**: Track all configuration changes
5. **Auto-approve**: Skip prompts for specific tools
6. **Re-inject context**: Add reminders after compaction

### 5. Claude Models - March 2026

**Latest Models:**

| Model | Features | Context | Max Output | Knowledge Cutoff | Pricing |
|-------|----------|---------|-----------|------------------|---------|
| **Claude Opus 4.6** | Most intelligent, agents, coding | 1M tokens | 128k | May 2025 (reliable) | $5/in, $25/out |
| **Claude Sonnet 4.6** | Speed/intelligence balance, agentic | 1M tokens | 64k | Aug 2025 (reliable) | $3/in, $15/out |
| **Claude Haiku 4.5** | Fastest, near-frontier intelligence | 200k tokens | 64k | Feb 2025 | $1/in, $5/out |

**Capabilities:**
- All support text/image input, multilingual, vision
- **Extended thinking**: All three models
- **Adaptive thinking**: Opus 4.6 and Sonnet 4.6 only
- **Priority Tier**: All three available
- **Structured outputs**: GA on Sonnet 4.5+, Opus 4.5+, Haiku 4.5+

**1M Token Context Window:**
- **Now GA** (General Availability) for Claude Opus 4.6 and Sonnet 4.6
- Standard pricing (no beta header required)
- Auto-handles requests over 200k tokens
- Claude Sonnet 4.5 can access 1M via `context-1m-2025-08-07` beta header
- Enables entirely new categories of work

**Model Aliases:**
- `sonnet` → Claude Sonnet 4.6
- `opus` → Claude Opus 4.6
- `haiku` → Claude Haiku 4.5
- Or use full model IDs like `claude-opus-4-6`

**Legacy Models:**
- Sonnet 4.5, Opus 4.5, Opus 4.1, Sonnet 4, Opus 4 still available
- Haiku 3 deprecated, retiring April 19, 2026

### 6. Claude Agent SDK (formerly Claude Code SDK)

**Renamed in late 2025** to reflect it's a general-purpose agent runtime

**Current Versions:**
- Python: v0.1.48+ on PyPI
- TypeScript: v0.2.71+ on npm

**Key Features:**
- Same execution loop as Claude Code
- Built-in tools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
- Hooks: PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, UserPromptSubmit, etc.
- Subagents: Create with custom prompts, tool restrictions, permissions
- MCP: Connect to external systems
- Sessions: Maintain context across exchanges, resume later
- Permissions: Control tool access

**Message Types Throughout Lifecycle:**
- `SystemMessage`: Session lifecycle ("init", "compact_boundary")
- `AssistantMessage`: Emitted after each Claude response
- `UserMessage`: Emitted after each tool execution with results

**Authentication:**
- API key (preferred): `export ANTHROPIC_API_KEY=...`
- Amazon Bedrock: `CLAUDE_CODE_USE_BEDROCK=1` + AWS credentials
- Google Vertex AI: `CLAUDE_CODE_USE_VERTEX=1` + Google Cloud credentials
- Microsoft Azure: `CLAUDE_CODE_USE_FOUNDRY=1` + Azure credentials

**Project-Level Configuration:**
- Settings via `setting_sources=["project"]` (Python) or `settingSources: ['project']` (TypeScript)
- Access to CLAUDE.md, skills, slash commands, memory, plugins

**Compare to Alternatives:**
- **vs Client SDK**: Agent SDK handles tool loop autonomously; Client SDK requires manual implementation
- **vs Claude Code CLI**: Same capabilities, different interface. CLI for interactive, SDK for CI/CD/automation

### 7. MCP Integration Patterns

**MCP Servers in Claude Code:**
- Configured in `.mcp.json` at project root or via settings
- Scopes: local (default), project (`.mcp.json`), user (`~/.claude/settings.json`)
- Transports: HTTP, Stdio (SSE deprecated)
- Can be inline or referenced by name in subagent configs

**MCP in Subagents:**
- `mcpServers` field in frontmatter
- Inline definitions: scoped to that subagent only
- String references: reuse parent session's connection
- Keep MCP out of main conversation context when defining inline

**MCP Tool Naming:**
- Format: `mcp__<server>__<tool>`
- Examples: `mcp__github__search_repositories`, `mcp__filesystem__read_file`
- Hook matchers: use regex like `mcp__github__.*` or `mcp__.*__write.*`

**Management:**
- CLI: `claude mcp` command family
- In-session: `/mcp` command
- Configuration via `.mcp.json` or `settings.json`

### 8. Local Project Context

**This Project's Agent Structure:**
- 137+ specialized subagents across 28+ domain categories
- Located in `.claude/agents/` with some multi-agent directories
- Top 8 core agents in root: code-reviewer, debugger, doc-writer, docker-ops, k8s-image-auditor, researcher, security-reviewer, test-writer
- Notable: `orchestration/ultrathink` (Opus, extended thinking), `orchestration/angelos-symbo` (master orchestrator), `orchestration/feature-dev` (full-stack TDD)

**Workflow Protocol:**
- EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT
- Use subagents for research to preserve main context
- Research tools: Perplexity MCP, Firecrawl MCP, Context7 MCP

## References

- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Subagents Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)

## Session Context
Researched by: researcher agent
Timestamp: 2026-03-19
Knowledge cutoff applied: February 2025
Latest documentation accessed: March 2026
