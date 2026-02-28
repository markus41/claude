# Claude Code Cowork & Marketplace Research

## Research Date
2026-02-28

## Key Findings Summary

### 1. Claude Code Cowork Feature (2026 Release)
- **Definition**: An enterprise collaboration platform extending Claude Code (2025) to non-programming knowledge work
- **Model**: Agentic architecture where Claude analyzes tasks, breaks into subtasks, executes work in VM, coordinates parallel workstreams
- **Key Difference from Claude Code**: Cowork is "Claude Code for the rest of your work" — applies agent autonomy to office/enterprise work, not just programming
- **Session Model**: Persistent workspace with task execution capability; desktop app must stay open during session
- **Collaboration Limitation**: No built-in session sharing or real-time collaboration — current research preview limitation

### 2. Enterprise Plugin Marketplace (Feb 2026 Update)
Anthropic announced major Cowork updates including **private plugin marketplaces** for enterprises:

**Core Features:**
- Private org-specific plugin marketplaces (control what teams access)
- Admin-managed distribution with per-user provisioning
- Auto-install capabilities for teams
- Pre-built templates: HR, Design, Engineering, Operations, Finance, Investment Banking
- Support for private GitHub repos as plugin sources (beta)
- OpenTelemetry support: track usage, costs, tool activity across teams

**Multi-app Workflows:**
- Orchestrate across Excel, PowerPoint, other apps
- Pass context between applications
- Structured slash commands launch with forms (feels like filling out brief form)

### 3. What Gets Shared in Cowork Marketplace

From codebase analysis (marketplace-pro plugin), the marketplace distributes:

**Discrete Artifacts:**
1. **Skills** — Domain knowledge packaged as reusable components (subdirs with SKILL.md)
2. **Agents** — Specialized autonomous agents (team-specific roles, .md files)
3. **Commands** — Slash commands (structured workflows, form-based)
4. **Workflows** — Multi-step automation (coordination across services)
5. **Templates** — Pre-built composites for roles/departments

**Metadata Included:**
- Version (semver)
- Author/org
- Description & keywords
- Capabilities/features list
- Dependencies (with version constraints: ^, ~, *)
- Trust/security metadata (Sigstore signatures, composite trust scores)

### 4. Discovery & Installation Mechanisms

From marketplace-pro plugin implementation:

**Discovery:**
- **Smart search** over plugin repository with category filtering
- **Quality indicators** (trust grades A-F based on signature, reputation, code analysis, community, freshness)
- **Contextual recommendations** using Apriori mining + cosine similarity
  - Analyzes project fingerprint (features detected in codebase)
  - Mines association rules ("projects with {kubernetes, helm} usually need {ci-cd}")
  - Finds gaps and ranks plugins by gap-coverage relevance
- **Project-aware suggestion** — scans your project structure, suggests missing plugins

**Installation:**
- `/plugin-install <name>` — from registry or Git
- Registry tracks installed plugins + available plugins
- Dependency resolution: topological sort, version constraint checking
- Post-install hooks for configuration/setup
- Development mode with `--dev` (symlink for rapid iteration)

### 5. Governance & Trust Model

**Marketplace-Pro Trust Scoring Formula:**
```
Overall = 0.25*Signed + 0.20*Reputation + 0.25*CodeAnalysis + 0.15*Community + 0.15*Freshness
Grades: A (90-100), B (80-89), C (60-79), D (40-59), F (0-39)
```

**Enterprise Policy Control:**
- `.claude/policies/plugins.yaml` — trust thresholds, allowlists/blocklists
- `plugin-lock.json` — pinned versions with integrity checksums (GitOps model)
- Multi-registry federation with priority resolution
- Sigstore signing for supply chain security

**What's NOT Shared:**
- Session artifacts (no session sharing in Cowork)
- Live execution state
- Folder instructions or project-specific configs (stored locally)

### 6. Marketplace Architecture Patterns

**From marketplace-pro plugin (5 core modules):**

1. **Composition Engine** (src/composition/engine.ts)
   - Greedy set cover + Kahn's topological sort
   - Converts natural-language intent → plugin resolution DAG
   - Handles dependency conflicts

2. **Supply Chain Security** (src/security/trust-engine.ts)
   - Sigstore signing verification
   - Composite trust scoring
   - Sandbox policies

3. **Contextual Intelligence** (src/intelligence/fingerprint.ts)
   - Project fingerprinting (extract features from code)
   - Apriori mining (learn feature co-occurrence)
   - Cosine similarity matching

4. **Dev Studio** (src/devstudio/server.ts)
   - Hot-reload server for plugin development
   - Live validation & testing
   - Build tools

5. **Federation** (src/federation/registry.ts)
   - Multi-registry support (priority-based resolution)
   - GitOps lockfile model
   - Policy enforcement across registries

### 7. Plugin Manifest Structure

Standard plugin.json includes:
```json
{
  "name", "version", "description", "author", "license",
  "keywords", "categories",
  "repository": { "type", "url" },
  "commands": { "/cmd": { "description", "handler", "allowedTools", "argumentHint" } },
  "agents": { "agent-name": { "description", "model", "handler", "capabilities" } },
  "skills": { "skill-name": { "description", "handler" } },
  "hooks": { "hook-name": { "event", "toolPattern", "filePattern", "handler" } },
  "dependencies": { "plugin-name": "^version" },
  "configuration": { "localConfig", "requiredEnvVars", "optionalEnvVars" },
  "postInstall": { "script", "description" }
}
```

## Best Practices for Cowork Marketplace

1. **Composability First** — Design skills/agents to work independently and combine
2. **Trust Transparency** — Use Sigstore signing, maintain fresh metadata
3. **Contextual Design** — Build skills that understand project context (via fingerprinting)
4. **Graceful Degradation** — Handle missing dependencies or unavailable registries
5. **Hot-Reload UX** — Support development mode for fast iteration
6. **Policy Enforcement** — Allow orgs to lock versions and manage risk
7. **Multi-Source Support** — Support registry, Git, and private repos
8. **Clear Metadata** — Consistent keywords, categories, capability descriptors for discovery

## Relation to This Project

**marketplace-pro plugin** is a reference implementation of enterprise marketplace concepts:
- Located: `/home/user/claude/plugins/marketplace-pro/`
- Provides: composition, security, intelligence, dev tools, federation
- Commands: `/mp:*` family (setup, compose, recommend, trust, verify, etc.)
- Agent: marketplace-advisor (guidance on selection & algorithms)
- Skills: 5 modules with specialized knowledge

This project includes a full plugin registry system with versioning, dependency resolution, and validation (see `.claude/PLUGIN_SYSTEM.md`).

## Cowork Plugin Format & Structure (2026 Official Documentation)

### A. Core Plugin Directory Structure

**Standard layout (both Cowork and Claude Code):**
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (metadata & config)
├── .mcp.json                # MCP server tool connections
├── commands/                # Explicit slash commands (*.md files)
├── skills/                  # Domain expertise (subdirs with SKILL.md)
├── agents/                  # Custom agent definitions (optional, *.md with YAML frontmatter)
├── hooks/                   # Event handlers (optional, hooks.json)
├── .lsp.json                # Language server protocol (optional)
├── settings.json            # Default settings when plugin enabled (optional)
└── README.md                # Documentation
```

### B. Plugin Manifest File (.claude-plugin/plugin.json)

**Required fields:**
- `name` (string): unique identifier, becomes skill namespace prefix (e.g., `my-plugin:skill-name`)
- `description` (string): shown in plugin manager when browsing
- `version` (string): semantic versioning (e.g., "1.0.0")
- `author` (object): optional, `{ "name": "Your Name" }` for attribution

**Optional fields:**
- `homepage` (string): project website
- `repository` (string): Git repo URL
- `license` (string): license type (e.g., "MIT")
- `keywords` (array): searchable tags for discovery
- `categories` (array): domain categories (sales, finance, legal, hr, design, etc.)

**Example:**
```json
{
  "name": "sales-cowork",
  "description": "Sales plugin for prospect research, deal prep, pipeline review",
  "version": "1.0.0",
  "author": { "name": "Anthropic" },
  "homepage": "https://github.com/anthropics/knowledge-work-plugins",
  "license": "Apache-2.0",
  "keywords": ["sales", "crm", "prospect-research"],
  "categories": ["sales"]
}
```

### C. Skills Component (skills/skill-name/SKILL.md)

**Format:** Markdown file with YAML frontmatter + instructions

**Required frontmatter fields:**
- `description` (string): explains what the skill does and when Claude should use it
- `name` (optional in frontmatter; folder name becomes skill name): e.g., `code-review` → `/plugin:code-review`

**Optional frontmatter fields:**
- `disable-model-invocation` (boolean): if true, Claude won't trigger it automatically
- `tools` (array): restrict to specific tools (e.g., `["filesystem", "bash"]`)

**Structure:**
```markdown
---
description: Reviews code for best practices, security issues, and test coverage. Use when reviewing PRs, analyzing code quality, or checking for vulnerabilities.
name: code-review
---

# Code Review Skill

When reviewing code, systematically check for:

1. **Code Organization & Structure**
   - Are classes/functions single-responsibility?
   - Is code DRY (Don't Repeat Yourself)?

2. **Error Handling**
   - Do all paths handle errors?
   - Are error messages descriptive?

3. **Security Concerns**
   - Are inputs validated?
   - Are secrets/credentials in version control?

4. **Test Coverage**
   - Are critical paths tested?
   - Do tests cover edge cases?
```

**Skill invocation:** Claude automatically draws on skills when relevant to the task. User can also explicitly invoke with `/plugin:skill-name arguments`.

### D. Commands Component (commands/*.md)

**Format:** Markdown files with YAML frontmatter

**Purpose:** Explicit slash commands users trigger manually (vs. skills that Claude invokes automatically)

**Frontmatter fields:**
- `description` (string): what the command does
- `arguments` (string, optional): hint for user input (e.g., "company name or ticker")
- `tools` (array, optional): allowed tools for this command

**Example - commands/call-prep.md:**
```markdown
---
description: Prep materials for a sales call with a prospect
arguments: prospect name or company
---

# Call Prep Command

Prepare call materials for [PROSPECT NAME]:

1. **Research & Context**
   - Find recent company news
   - Identify decision makers
   - Check company size & industry

2. **Value Proposition**
   - Tailor pitch to their industry
   - Identify pain points we solve
   - Prepare proof points

3. **Call Plan**
   - 3-5 key talking points
   - Expected objections + rebuttals
   - Next steps to propose
```

**Invocation:** `/sales:call-prep Acme Corp` (triggers the call-prep command in the sales plugin)

### E. MCP Connectors (.mcp.json)

**Format:** JSON configuration for external tool integrations

**Purpose:** Wire Claude to external services (CRMs, databases, design tools, etc.)

**Structure:**
```json
{
  "crm": {
    "command": "mcp-hubspot-server",
    "args": ["serve"],
    "env": {
      "HUBSPOT_API_KEY": "${env:HUBSPOT_API_KEY}"
    },
    "capabilities": ["search-contacts", "create-deal", "update-record"]
  },
  "email": {
    "command": "mcp-gmail-server",
    "env": {
      "GMAIL_API_KEY": "${env:GMAIL_API_KEY}"
    },
    "capabilities": ["search-emails", "send-email"]
  }
}
```

**Tool Permissions (in Cowork UI):** For each MCP tool, admins set:
- Allow: runs automatically
- Ask: Claude must confirm before running
- Block: never allowed

### F. Agents Component (agents/*.md)

**Format:** Markdown with YAML frontmatter (same format as subagents in Claude Code)

**Purpose:** Specialized parallel workers for complex tasks

**Frontmatter fields:**
- `description` (string): what this agent specializes in
- `model` (string): which Claude model to use (e.g., "claude-opus-4.6")
- `tools` (array): available tools for this agent
- `disallowedTools` (array): tools this agent cannot use
- `maxTurns` (number): max conversation turns before stopping

**Example - agents/research-agent.md:**
```markdown
---
description: Specialist for prospect research, competitive intelligence, market analysis
model: claude-opus-4.6
tools: ["mcp-web-search", "mcp-notion", "mcp-slack"]
disallowedTools: ["bash"]
maxTurns: 10
---

You are a market research specialist. When given a prospect or company name:
1. Search for latest company news and financials
2. Identify key decision makers and their LinkedIn profiles
3. Find recent funding rounds or acquisitions
4. Summarize competitive positioning
```

### G. Hooks Component (hooks/hooks.json)

**Format:** JSON event handlers that trigger on specific conditions

**Purpose:** Automate actions like linting, validation, or notifications

**Example hooks.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint:fix $FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

### H. Settings.json (Plugin Default Settings)

**Format:** JSON configuration applied when plugin is enabled

**Supported keys:**
- `agent` (string): activates a custom agent as the main thread (e.g., `"agent": "security-reviewer"`)

**Example:**
```json
{
  "agent": "security-reviewer"
}
```

---

## The 11 Official Cowork Plugins (Anthropic, 2026)

| # | Plugin | Purpose | Key Connectors |
|---|--------|---------|----------------|
| 1 | **Productivity** | Tasks, calendars, workflows | Slack, Notion, Asana, Linear, Jira, Monday, ClickUp, Microsoft 365 |
| 2 | **Enterprise Search** | Cross-tool unified search | Email, chat, docs, wikis across platforms |
| 3 | **Sales** | Prospect research, deal prep, pipeline | HubSpot, Close, Clay, ZoomInfo, Fireflies |
| 4 | **Finance** | Analysis, modeling, metrics | Snowflake, Databricks, BigQuery |
| 5 | **Data** | SQL, analysis, dashboards, validation | Snowflake, Databricks, BigQuery, Hex, Amplitude |
| 6 | **Legal** | Contract review, NDA triage, compliance | DocuSign, Box, Egnyte, compliance tracking |
| 7 | **Marketing** | Content, campaigns, brand voice, reporting | Canva, Figma, HubSpot, Ahrefs, SimilarWeb |
| 8 | **Customer Support** | Ticket triage, response drafting, escalations | Intercom, HubSpot, Guru, Jira |
| 9 | **Product Management** | Specs, roadmaps, user research, competitive tracking | Linear, Asana, Figma, Amplitude, Pendo |
| 10 | **Biology Research** | Literature search, genomics, experiment planning | PubMed, BioRender, ChEMBL, Benchling |
| 11 | **Plugin Create/Customize** | Build and customize plugins | — |

---

## Key Differences: Cowork vs. Claude Code Plugins

### File Format
- **Both use identical format:** Markdown + JSON, no code required, no build steps
- **Skills are 100% cross-compatible** between Cowork and Claude Code

### Marketplace Isolation
- **Separate plugin panels:** Installing in Cowork doesn't make plugin available in Code Tab
- **Skills uploaded via Claude Desktop settings ARE shared** across Chat, Cowork, and Code Tab
- **Different default marketplaces:**
  - Cowork: `anthropics/knowledge-work-plugins` (sales, finance, legal, HR, design, etc.)
  - Claude Code: `anthropics/claude-code` (engineering, architecture, code-review, feature-dev, etc.)

### UI & Interaction Model
- **Cowork:** User-friendly chat interface, "accessibility-first" design, requires no installation
- **Claude Code:** Terminal-based, more control over execution flow, full script/CLI access

### Execution Model
- **Cowork:** Runs in isolated VM, shows screenshots to Claude for visual feedback, less token-efficient but more secure
- **Claude Code:** Runs locally, full access to filesystem/bash/git, more token-efficient

---

## Plugin Development Best Practices

### 1. Composability
- Design skills to be **independent and reusable**
- Each skill should solve one focused problem
- Skills can call other skills when needed

### 2. Naming Conventions
- Plugin names: lowercase with hyphens (e.g., `sales-cowork`, `product-pm`)
- Skill names: descriptive, lowercase (e.g., `call-prep`, `code-review`, `reconciliation`)
- Full invocation: `/plugin-name:skill-name arguments`

### 3. Metadata Clarity
- Write descriptive `description` fields so Claude knows when to use each skill
- Use `keywords` and `categories` to improve discoverability
- Include `repository` URL for users to contribute or report issues

### 4. Tool Permissions
- Declare required tools in skill frontmatter: `tools: ["mcp-hubspot", "bash"]`
- Declare forbidden tools: disallowedTools to prevent misuse
- Admins can override at installation time

### 5. Dependencies
- Specify dependent plugins/MCP servers in manifest
- Use semantic versioning: `^1.0.0` (compatible), `~1.0.0` (patch-compatible), `1.0.0` (exact)
- Test plugin installation with all dependency combinations

### 6. Documentation
- Include `README.md` with installation, usage, and customization instructions
- Link to external docs, GitHub issues, and support channels
- Show example commands and expected outputs

### 7. Security & Trust
- Use Sigstore signing for official plugins
- Keep dependencies up-to-date
- Document any external API keys required (guide users to set env vars)
- Never commit secrets or credentials

---

## How Cowork Sessions Work with Plugins

### Session Lifecycle
1. **User selects plugin/workflow in Cowork marketplace**
2. **Plugin installed locally** (skills, commands, MCP connections loaded)
3. **User launches session** with initial prompt/inputs
4. **Claude breaks down task** into subtasks, allocates to parallel agents
5. **Agents execute** using:
   - Available skills (auto-invoked as needed)
   - Available commands (user-triggered)
   - MCP connectors (to external services)
6. **Session outputs** (files, reports, artifacts) saved to workspace
7. **Desktop app stays open** during session (persistent VM)

### Key Constraints (Feb 2026)
- **No session sharing:** Sessions are local to user's machine, cannot be shared with team
- **No real-time collaboration:** Only one user per session
- **Session history:** User can resume/pause sessions, but not share them

### Future Roadmap Hints
- Private plugin marketplaces for enterprises (admin-managed)
- Per-user provisioning with auto-install capabilities
- Multi-app orchestration (Excel, PowerPoint, etc.)
- OpenTelemetry tracking: usage, costs, tool activity per team member

---

## Installation & Discovery Methods

### For Users (Cowork UI)
```
Claude Desktop → Cowork Tab → Customize → Browse Plugins
→ Install → Configure (optional) → Launch Session
```

### For Developers (CLI)
```bash
# Test locally during development
claude --plugin-dir ./my-plugin

# Load multiple plugins
claude --plugin-dir ./plugin-1 --plugin-dir ./plugin-2

# Install published plugin
claude plugin install sales@anthropics/knowledge-work-plugins
```

### For Organizations (Private Marketplaces)
- Admins create org-specific marketplace
- Add plugins to marketplace (from GitHub, public registry, or custom)
- Set install policies: auto-install, available, or blocked
- Users see only approved plugins in Cowork UI
- Per-user provisioning with cost tracking (OpenTelemetry)

---

## Resources

- **Official Claude Code Plugin Docs:** https://code.claude.com/docs/en/plugins
- **Cowork Plugin Guide:** https://support.claude.com/en/articles/13837440-use-plugins-in-cowork
- **Knowledge Work Plugins (11 official examples):** https://github.com/anthropics/knowledge-work-plugins
- **Plugin Manifest Reference:** https://code.claude.com/docs/en/plugins-reference
- **Community Guide:** https://aiblewmymind.substack.com/p/claude-cowork-plugins-guide

