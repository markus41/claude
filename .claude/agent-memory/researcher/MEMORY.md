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

