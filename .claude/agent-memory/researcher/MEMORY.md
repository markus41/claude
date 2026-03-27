# Claude Code Complete Documentation Knowledge Base

## Date
2026-03-08

## Status
COMPREHENSIVE DOCUMENTATION RESEARCH COMPLETE
**2026-03-08 UPDATE**: Plugin discovery & marketplace architecture documented

## What This Contains
Complete coverage of Claude Code documentation from code.claude.com/docs including:
- Installation and setup procedures
- Configuration and settings (all scopes)
- Memory systems (CLAUDE.md and auto memory)
- Skills system (creation, invocation, bundled skills)
- Hooks (lifecycle events, types, configuration)
- MCP integration (server setup, authentication, management)
- Permissions system (modes, rules, enforcement)
- Subagents (built-in and custom)
- Plugins (structure, manifest, creation, distribution)
- CLI commands and flags
- Interactive mode commands
- Keyboard shortcuts
- Permission and safety mechanisms
- Common workflows
- IDE integrations (VS Code, JetBrains)
- Desktop and Web interfaces
- Error handling and troubleshooting
- Environment variables

## Key Documentation Sections Retrieved
1. **Quickstart** - First steps and basic operations
2. **Advanced Setup** - System requirements, installation variants, updates
3. **CLI Reference** - Complete command and flag documentation
4. **Settings** - Configuration file structure and all settings options
5. **Memory** - CLAUDE.md, auto memory, rules system
6. **MCP** - Model Context Protocol integration
7. **Skills** - Custom skills creation and management
8. **Hooks** - Lifecycle automation
9. **How Claude Code Works** - Agentic loop architecture
10. **Plugins** - Plugin creation and distribution
11. **Subagents** - Custom agent creation
12. **Permissions** - Access control and safety

## Critical Configuration Patterns
- Settings precedence: Managed > Local > Project > User
- Permission precedence: Deny > Ask > Allow
- CLAUDE.md locations with priority order
- Hook event matching and exit codes
- MCP server scope resolution
- Subagent tool restrictions and models
- Plugin directory structure

## Built-in Skills
- `/simplify` - Code quality and refactoring
- `/batch` - Parallel changes across codebase
- `/debug` - Session troubleshooting
- `/loop` - Recurring task scheduling
- `/claude-api` - API reference loading

## Built-in Subagents
- **Explore**: Read-only, Haiku model, fast analysis
- **Plan**: Read-only research
- **General-purpose**: Full capabilities

## Plugin System
Can create plugins with:
- `.claude-plugin/plugin.json` manifest
- `skills/`, `agents/`, `commands/` directories
- `hooks/hooks.json` configuration
- `.mcp.json` server definitions
- `settings.json` defaults

## Permission System
- **Modes**: default, acceptEdits, plan, dontAsk, bypassPermissions
- **Rules**: Tool(specifier) with wildcard support
- **Scopes**: Managed, User, Project, Local

## Memory Systems
- **CLAUDE.md**: Persistent instructions (max 200 lines in context)
- **Auto Memory**: Claude-maintained knowledge at `~/.claude/projects/<project>/memory/`
- **Rules**: Modular instructions in `.claude/rules/` with optional path scoping

## MCP Configuration
- **Transports**: HTTP, SSE (deprecated), Stdio
- **Scopes**: Local (default), Project (`.mcp.json`), User
- **Management**: Via `claude mcp` commands or `/mcp` in session

## Quick Command Reference
- `claude` - Start session
- `claude -p "query"` - Non-interactive
- `claude --model opus` - Set model
- `/help` - Show commands
- `/memory` - Manage instructions
- `/agents` - Manage subagents
- `/hooks` - Configure lifecycle
- `/mcp` - Manage servers
- `/permissions` - Manage access
- `/context` - Check context usage

## Documentation Links (All Retrieved)
- [Main Docs](https://code.claude.com/docs)
- [Quickstart](https://code.claude.com/docs/en/quickstart)
- [Setup](https://code.claude.com/docs/en/setup)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Settings](https://code.claude.com/docs/en/settings)
- [Memory](https://code.claude.com/docs/en/memory)
- [MCP](https://code.claude.com/docs/en/mcp)
- [Skills](https://code.claude.com/docs/en/skills)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works)
- [Plugins](https://code.claude.com/docs/en/plugins)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Permissions](https://code.claude.com/docs/en/permissions)

## For Plugins with Deep Claude Code Knowledge
This documentation base enables building plugins that:
1. Understand complete Claude Code architecture
2. Leverage all configuration options
3. Integrate with hooks, MCP, skills, and subagents
4. Provide context-aware guidance on features
5. Offer automation and workflow patterns
6. Teach best practices for Claude Code usage

## Session Model Used
- Claude Haiku 4.5 (fast research)
- WebFetch tool for documentation retrieval
- Multiple parallel requests to gather sections efficiently

## Token Usage
- Approximately 100K tokens used for comprehensive retrieval
- Organized as single knowledge base document
- Suitable for building large-scale plugins with complete feature coverage

## Plugin Discovery & Marketplace Architecture (2026-03-08)

### Plugin File Structure for Discovery
- **Manifest**: `.claude-plugin/plugin.json` (required field: `name` only, all others optional)
- **Default locations** (auto-discovered):
  - `commands/` - skill markdown files (legacy; use skills/ for new)
  - `agents/` - agent .md files with YAML frontmatter
  - `skills/` - skill folders with SKILL.md inside
  - `hooks/hooks.json` - hook configurations
  - `.mcp.json` - MCP server configs
  - `.lsp.json` - LSP server configs
  - `settings.json` - default plugin settings

### Plugin Manifest Schema (plugin.json)
**Required**: `name` only (kebab-case, no spaces)
**Metadata**: version, description, author, homepage, repository, license, keywords
**Component paths**: commands, agents, skills, hooks, mcpServers, lspServers, outputStyles
**Key**: Component paths supplement default dirs (don't replace them)
**Environment variable**: `${CLAUDE_PLUGIN_ROOT}` for absolute paths in hooks/MCP

### Plugin Namespacing
- Skills in plugins are namespaced: `/plugin-name:skill-name` (prevents conflicts)
- Standalone config uses short names: `/skill-name`
- Plugins always namespaced unless part of official marketplace

### How Marketplaces Work (marketplace.json)
**Location**: `.claude-plugin/marketplace.json` in repo root
**Purpose**: Catalog of plugins with version tracking, auto-updates, multiple sources

**Marketplace Required Fields**:
- `name` - marketplace identifier (kebab-case, public-facing)
- `owner` - object with `name` (required) and optional `email`
- `plugins` - array of plugin entries

**Plugin Entry Fields**:
- `name` - plugin identifier (kebab-case)
- `source` - where to fetch plugin (relative path, GitHub, npm, git URL, git-subdir)

**Plugin Sources Supported**:
- Relative path: `"./plugins/my-plugin"` (Git-based only)
- GitHub: `{"source": "github", "repo": "owner/repo", "ref?", "sha?"}`
- Git URL: `{"source": "url", "url": "https://...", "ref?", "sha?"}`
- Git subdir: `{"source": "git-subdir", "url": "...", "path": "...", "ref?", "sha?"}`
- npm: `{"source": "npm", "package": "@org/plugin", "version?", "registry?"}`
- pip: `{"source": "pip", "package": "name", "version?", "registry?"}`

**Optional Plugin Entry Fields**:
- description, version, author, homepage, repository, license, keywords, category, tags
- strict (true=default, plugin.json is authority; false=marketplace entry is authority)
- Component overrides: commands, agents, hooks, mcpServers, lspServers

### Plugin Installation & Caching
- Plugins installed from marketplaces are copied to **cache** at `~/.claude/plugins/cache`
- NOT used in-place from marketplace repo
- Path traversal limitation: plugins cannot reference files outside their directory (`../` fails)
- Symlinks honored during copy (workaround for shared files)

### Installation Scopes
- **user** (default): `~/.claude/settings.json` - personal, all projects
- **project**: `.claude/settings.json` - team, shared via git
- **local**: `.claude/settings.local.json` - project-specific, gitignored
- **managed**: Read-only, admin-updated

### Marketplace Distribution
- Host on GitHub (easiest): users add with `/plugin marketplace add owner/repo`
- Git services: GitLab, Bitbucket, self-hosted all supported

## draw.io / diagrams.net Research (2026-03-14)
Full reference: `.claude/agent-memory/researcher/drawio-reference.md`
Key findings:
- Official MCP: github.com/jgraph/drawio-mcp (@drawio/mcp on npm); 4 approaches; hosted at https://mcp.draw.io/mcp
- Community MCP: lgazo/drawio-mcp-server (npx -y drawio-mcp-server --editor); inspector/modifier/layer tools
- XML format: mxCell (vertex/edge), mxGeometry, object (metadata), placeholder %vars%; uncompressed for AI use
- Embed: embed.diagrams.net with postMessage protocol; 20+ URL params; lightbox=1 for viewer iframes
- Export: PNG, SVG, PDF, WebP, XML, HTML, CSV; PDF requires server endpoint
- Import: Mermaid v11.10.1, CSV, Gliffy, Lucidchart, VSDX; PlantUML deprecated end 2025
- AI: Sparkle/Generate tool (multi-engine); enableAi config; admin-controlled in Confluence
- VS Code: hediet.vscode-drawio extension; .drawio/.dio/.drawio.svg/.drawio.png; Code Link feature
- Integrations: Confluence (Forge-only by Jan 2026), Jira, GitHub, GitLab, Office 365, Notion (Chrome ext), Nextcloud
- Azure DevOps: no native integration; workarounds exist via marketplace extension or CI/CD pipeline
- Shape libraries: AWS/Azure/GCP/IBM/Cisco/UML/BPMN/network/etc.; enable via libs URL param
- Docker: jgraph/drawio image; env vars DRAWIO_SERVER_URL, DRAWIO_CONFIG, etc.
- Config JSON: 50+ options (fonts, colors, styles, libraries, behavior, AI, collaboration)

### Registry/Caching Behavior
- Plugins are versioned and cached locally
- Update detection: version in plugin.json must change for update trigger
- If version in both plugin.json and marketplace.json, plugin.json wins
- Marketplace entry `strict: false` means no plugin.json needed (marketplace defines all)

### Reserved Marketplace Names
Cannot use: claude-code-marketplace, claude-code-plugins, claude-plugins-official, anthropic-marketplace, anthropic-plugins, agent-skills, life-sciences

### Plugin CLI Commands
- `claude plugin install <name>[@marketplace]` - install plugin
- `claude plugin uninstall <name>` - remove plugin
- `claude plugin enable/disable <name>` - toggle without uninstall
- `claude plugin update <name>` - update to latest version
- `claude plugin validate .` - validate plugin.json or marketplace.json
- `--plugin-dir ./path` flag for development/testing (loads directly without cache)

### Testing & Validation
- Use `claude --plugin-dir ./my-plugin` for development
- Load multiple: `--plugin-dir ./p1 --plugin-dir ./p2`
- Common errors: manifest syntax, components in `.claude-plugin/` (wrong location)
- Validation: `claude plugin validate .` or `/plugin validate`

## MCP Tools Research (2026-03-19)

### Firecrawl MCP vs Perplexity MCP Comparison
Full reference: `.claude/agent-memory/researcher/mcp_comparison_firecrawl_vs_perplexity.md`

**Key Findings**:
- **Perplexity**: For Q&A, web search, current events. ~80% cheaper for simple queries. Returns cited sources.
- **Firecrawl**: For data extraction, crawling, structured JSON. Purpose-built for LLMs. 1 credit per page.
- **Decision**: Use Perplexity FIRST for any question/search. Use Firecrawl ONLY when structured extraction needed.
- **Firecrawl Agent**: 100-1,500+ credits per query (unpredictable). Avoid unless multi-page autonomous research essential.
- **Protected Sites**: Firecrawl fails 83% of time on LinkedIn/Amazon/etc. Use Perplexity to find URLs instead.

**Pricing**:
- Firecrawl Standard: $83/yr for 100k credits (~$0.0008/page)
- Perplexity: ~$0.02 per query; usage-based
- Recommendation: Perplexity for 80% of tasks; Firecrawl reserved for extraction

## Claude Code Memory System Deep Dive (2026-03-19)

Full research: `.claude/agent-memory/researcher/memory_system_research.md`

### Auto-Memory Architecture
- **Location**: `~/.claude/projects/<project>/memory/MEMORY.md` (200-line hard limit)
- **Topic files**: Auto-created when approaching 200 lines (no size limit, on-demand load)
- **Scope**: Per git repository (all worktrees share one memory)
- **CLAUDE.md**: Best practice <200 lines but loads fully regardless
- **Mechanism**: First 200 lines of MEMORY.md injected at session start; topic files load on-demand via file tools

### Context Anchoring Under Compaction
- **Survives compaction**: CLAUDE.md (full re-injection), first 200 lines of MEMORY.md (fresh load), `.claude/rules/` files
- **Lost during compaction**: Earlier conversation turns (summarized), content beyond line 200 of MEMORY.md, inline instructions
- **Hook control**: PreCompact fires before summarization (save state); PostCompact fires after (react to result)
- **Best practice**: Store critical state in CLAUDE.md or MEMORY.md; implement PreCompact to save important diffs/vars

### Error → Fix → Prevent Loop
- **Capture**: PostToolUseFailure hook auto-appends error to `.claude/rules/lessons-learned.md`
- **Fix**: Claude fixes issue in same session
- **Document**: Update entry: Status: RESOLVED, Fix: description, Prevention: how-to-avoid
- **Prevent**: Next session loads lessons-learned.md as rule file; Claude avoids repeat
- **Promote**: When 3+ similar errors appear, create permanent rule in `.claude/rules/` and remove promoted entries

### Compliance Patterns (2026 research)
- **Focused 30-line rules outperform 200-line comprehensive rules** — Each rule gets more attention
- **Positive instructions work better than negative** — "Use pnpm" >> "Don't use npm"
- **Rules + Hooks hybrid optimal** — Combine suggestions (rules) with enforcement (hooks); expect 70-80% compliance
- **Specificity drives adherence** — "2-space indentation" >> "format code properly"

### Memory Scoping for Agents
Four types for `~/.claude/agent-memory/<agent-name>/`:
1. **user** — Agent understanding of user role/expertise
2. **feedback** — Corrections ("don't do X") and validated patterns ("keep doing Y")
3. **project** — Ongoing work, deadlines, stakeholders (use absolute dates, not relative)
4. **reference** — External system pointers (Linear projects, Slack channels, Grafana boards)

Format: `<type>_<topic>.md` with frontmatter specifying type. Index up to 200 lines in MEMORY.md.

### MCP-Backed Memory
- **Package**: `@modelcontextprotocol/server-memory`
- **Storage**: SQLite database (local, machine-local)
- **Transport**: Stdio
- **Use case**: Semantic knowledge graphs shared across sessions; tool-based (not markdown) memory

## Agentic Design Patterns Research (2026-03-27)
Full reference: `.claude/agent-memory/researcher/agentic_design_patterns.md` (comprehensive deep dive)
Also: `.claude/agent-memory/researcher/agentic-patterns-research.md` (quick summary)
Source: github.com/Mathews-Tom/Agentic-Design-Patterns (Gulli & Sauco, 424 pages, MIT)

**4 Core Patterns (Andrew Ng)**:
- **Reflection** — LLM critiques own output, iterates to improve (15.6% accuracy gain)
- **Tool Use** — LLM decides which functions/APIs to call for tasks
- **Planning** — Agent breaks goals into subtasks, identifies dependencies, sequences execution
- **Multi-Agent** — Specialized agents collaborate toward complex goals

**21 patterns organized in 4 parts:**
- **Part 1 (Foundational)**: Prompt chaining, routing, parallelization, reflection, tool use, planning, multi-agent
- **Part 2 (Advanced Systems)**: Memory management, learning/adaptation, MCP, goal setting
- **Part 3 (Production)**: Exception handling, human-in-loop, RAG
- **Part 4 (Multi-Agent)**: A2A communication, resource optimization, reasoning, guardrails, evaluation, prioritization, discovery

**Additional Key Patterns**:
- **Prompt Chaining** — Sequential steps with intermediate validation (15.6% vs monolithic)
- **Routing** — Direct requests to specialized handlers by intent/domain
- **Parallelization** — Run independent tasks concurrently, combine results
- **Evaluator-Optimizer** — Generator + evaluator agent in feedback loop

**Frameworks**: LangGraph (recommended), CrewAI, AutoGen, DSPy, Smolagents
**Implementation guidance**: Start with single pattern. Combine 2-3 patterns for production. Multi-agent costs 25x single-agent.
**Cost awareness**: Each agent call + coordination + reflection loop = token expense. Balance quality vs. cost.
**Success factors**: Clear separation of concerns, well-defined interfaces, error handling, context management, monitoring

