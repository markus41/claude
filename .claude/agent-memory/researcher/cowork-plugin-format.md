# Claude Desktop Cowork Plugin Format Specification

Research date: 2026-02-28

## Summary

Cowork uses the **same plugin format as Claude Code** (no Cowork-specific manifest differences). Both are enterprise-grade plugin systems with identical specifications for manifest, marketplace distribution, and component discovery. The key difference is the distribution medium: Cowork runs in Desktop/Electron, Code runs in terminal.

## 1. Plugin Manifest (plugin.json) - Required & Optional Fields

**Location**: `.claude-plugin/plugin.json` (required directory structure)

### Required Fields
- **`name`** (string) - ONLY required field
  - kebab-case, no spaces (e.g., `deployment-tools`, not `Deployment Tools`)
  - Used for namespacing components (e.g., `plugin-name:agent-name`)
  - Must be unique within marketplace

### Metadata Fields (Optional but Recommended)
```json
{
  "name": "plugin-name",
  "version": "1.2.0",              // semantic versioning
  "description": "Brief description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"]
}
```

### Component Path Fields (Optional)
All paths must be relative, start with `./`, and are relative to plugin root:
- **`commands`** (string | array) - Additional slash command files/directories
- **`agents`** (string | array) - Additional agent files  
- **`skills`** (string | array) - Additional skill directories (with SKILL.md structure)
- **`hooks`** (string | array | object) - Hook config paths or inline config
- **`mcpServers`** (string | array | object) - MCP server definitions
- **`outputStyles`** (string | array) - Output style files/directories
- **`lspServers`** (string | array | object) - Language Server Protocol configs

**Critical Rule**: Custom paths SUPPLEMENT default directories, they don't REPLACE them.
- If `commands/` exists at root, it's loaded PLUS any custom command paths
- If `agents/` exists at root, it's loaded PLUS any custom agent paths

## 2. File Structure & Discovery

### Standard Plugin Layout
```
plugin-name/
├── .claude-plugin/
│   └── plugin.json                    # Manifest (optional if using defaults)
├── commands/                          # Default command location (discovered auto)
│   ├── status.md
│   └── logs.md
├── agents/                            # Default agent location (discovered auto)
│   ├── security-reviewer.md
│   └── compliance-checker.md
├── skills/                            # Default skill location (discovered auto)
│   ├── code-reviewer/
│   │   └── SKILL.md
│   └── pdf-processor/
│       ├── SKILL.md
│       └── scripts/
├── hooks/                             # Hook configs
│   └── hooks.json
├── .mcp.json                          # MCP server definitions
├── .lsp.json                          # LSP server configs
├── settings.json                      # Default settings (agent settings only supported)
└── README.md
```

### Slash Command Discovery
- **Format**: Markdown files in `commands/` directory
- **Filename**: becomes the command name (e.g., `deploy.md` → `/deploy` or `/plugin-name:deploy`)
- **Structure**: Plain markdown (legacy) or SKILL.md format (preferred for new skills)
- **Namespacing**: Plugin name prefixes all commands (e.g., `review-plugin` → `/review-plugin:review`)
- **Auto-discovery**: Any `.md` file in `commands/` directory is auto-discovered, no manifest entry required

### Agent Discovery
- **Format**: Markdown files in `agents/` directory with YAML frontmatter
- **Filename**: becomes agent identifier
- **Structure**:
```markdown
---
name: agent-name
description: What this agent specializes in
---

Detailed system prompt for the agent describing its role and expertise.
```
- **Auto-discovery**: Any `.md` file with proper frontmatter in `agents/` is auto-discovered
- **Invocation**: Manual via UI or automatic by Claude when task matches capabilities

### Skill Discovery
- **Format**: Directory-based, each skill is a subdirectory with `SKILL.md`
- **Structure**:
```
skills/
└── skill-name/
    ├── SKILL.md
    ├── reference.md (optional)
    └── scripts/ (optional)
```
- **SKILL.md frontmatter**:
```markdown
---
description: What this skill does
disable-model-invocation: true (optional)
---

Skill instructions/documentation.
```
- **Auto-discovery**: Any subdirectory with `SKILL.md` is auto-discovered

## 3. Cowork vs Code: Are They Different?

**No - they use identical plugin formats.**

Both Cowork and Code:
- Use same `.claude-plugin/plugin.json` manifest structure
- Discover commands/agents/skills the same way
- Support same MCP servers, LSP servers, hooks
- Use same marketplace.json format for distribution
- Can install plugins from same marketplaces (fully cross-compatible)

**Differences**:
- **Cowork**: Desktop/Electron interface, focused on enterprise/office workflows
- **Code**: Terminal interface, focused on development workflows
- **Plugin templates**: Different defaults (Cowork ships with 11 productivity plugins, Code ships with developer plugins) but both can use any marketplace

**Key fact**: You can load Code's developer plugins into Cowork, or Cowork's business plugins into Code. Same plugin system.

## 4. Private Marketplace Upload Flow

### Step 1: Prepare Plugin
- Ensure plugin follows standard layout (`.claude-plugin/plugin.json`, `commands/`, `agents/`, `skills/`)
- Validate with: `claude plugin validate .`

### Step 2: Create Marketplace File
Create `.claude-plugin/marketplace.json` in repository root:
```json
{
  "name": "company-tools",
  "owner": {
    "name": "Your Team",
    "email": "team@example.com"
  },
  "plugins": [
    {
      "name": "your-plugin",
      "source": "./plugins/your-plugin",  // relative path
      "description": "Plugin description",
      "version": "1.0.0"
    }
  ]
}
```

### Step 3: Host & Register
**For GitHub** (recommended):
- Push repo with `.claude-plugin/marketplace.json` to GitHub
- Users add with: `/plugin marketplace add owner/repo`

**For Other Git Hosts**:
- Push to GitLab, Bitbucket, or self-hosted
- Users add with full URL: `/plugin marketplace add https://gitlab.com/company/plugins.git`

**For Private Repos**:
- Requires authentication token in environment:
  - GitHub: `GITHUB_TOKEN` or `GH_TOKEN`
  - GitLab: `GITLAB_TOKEN` or `GL_TOKEN`
  - Bitbucket: `BITBUCKET_TOKEN`
- Both manual install and auto-updates supported

### Step 4: Desktop Installation (Cowork/Code)
Users do:
1. Run `/plugin marketplace add <marketplace-source>`
2. Run `/plugin install plugin-name@marketplace-name`
3. Or use interactive UI: `/plugin` → Discover tab → Select plugin → Install

**For Cowork Desktop**: Same steps, works identically (supports plugins in Electron interface)

## 5. Size Limits, Naming Rules, Structural Requirements

### Size Limits
- **Plugin ZIP for upload**: Max 50 MB
- **Each plugin directory**: No hard limit, but keep reasonable for caching

### Naming Rules
- **Plugin names**: kebab-case, lowercase, hyphens only (e.g., `deployment-tools`)
  - NO spaces, CamelCase, or underscores
  - NO reserved marketplace names: `claude-code-marketplace`, `claude-plugins-official`, `anthropic-marketplace`, `anthropic-plugins`, etc.
- **Command filenames**: `kebab-case.md` (e.g., `deploy-all.md`)
- **Agent filenames**: `kebab-case.md` with proper YAML frontmatter
- **Skill directories**: `kebab-case` subdirectories with `SKILL.md` inside

### Structural Requirements
- **Manifest location**: MUST be `.claude-plugin/plugin.json` (not optional, this is the required directory)
- **Component directories**: MUST be at plugin root, NOT inside `.claude-plugin/`
  - Correct: `plugin-root/commands/`, `plugin-root/agents/`, `plugin-root/skills/`
  - Wrong: `plugin-root/.claude-plugin/commands/`, etc.
- **Paths in manifest**: Must start with `./` and be relative to plugin root
- **No external file references**: Paths traversing outside plugin (e.g., `../shared`) won't work after installation (caching limitation)
  - Workaround: Use symlinks within plugin directory, they're copied to cache

### Version Management
- **Semantic versioning**: `MAJOR.MINOR.PATCH` (e.g., `2.1.0`)
- **Version location**: Set in `plugin.json` OR `marketplace.json`, not both (plugin.json wins if both set)
- **Update detection**: Claude Code uses version number to detect updates; if version doesn't change, users won't see code changes due to caching
- **Pre-releases**: Use `2.0.0-beta.1` for testing

### Installation Scopes
- **user** (default): Personal across all projects, stored in `~/.claude/settings.json`
- **project**: Team shared via git, stored in `.claude/settings.json`
- **local**: Project-specific/gitignored, stored in `.claude/settings.local.json`
- **managed** (admin-controlled): Read-only via managed settings

### Marketplace.json Requirements
**Required fields in marketplace.json**:
```json
{
  "name": "marketplace-id",          // kebab-case, must be unique
  "owner": {
    "name": "Team Name"              // Required
  },
  "plugins": [
    {
      "name": "plugin-name",         // Required, kebab-case
      "source": "./path/or/object"   // Required
    }
  ]
}
```

**Plugin source types** in marketplace:
- Relative path: `"source": "./plugins/my-plugin"`
- GitHub: `"source": { "source": "github", "repo": "owner/repo" }`
- Git URL: `"source": { "source": "url", "url": "https://...repo.git" }`
- npm: `"source": { "source": "npm", "package": "@org/plugin" }`
- pip: `"source": { "source": "pip", "package": "plugin-name" }`

**Note**: Relative paths only work with Git-based marketplaces, not URL-based marketplaces.

## 6. Key Limitations & Gotchas

1. **Path traversal blocked**: Plugins can't reference files outside their directory after caching (use symlinks as workaround)
2. **Manifest auto-discovery**: If you omit `.claude-plugin/plugin.json`, Claude auto-discovers from directory name (OK for simple plugins)
3. **Strict mode**: In marketplace, `"strict: true"` (default) means `plugin.json` is authority; `"strict: false"` means marketplace entry is entire definition
4. **No session sharing in Cowork**: Sessions don't auto-share between users; Cowork plugins are installed per-user or per-team via marketplace
5. **Component directory isolation**: Commands, agents, skills must be at plugin root, not in `.claude-plugin/` subdirectory
6. **Version doesn't auto-bump**: You must manually increment version in manifest for users to see updates

## References

- [Plugins reference - Claude Code Docs](https://code.claude.com/docs/en/plugins-reference)
- [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
- [Discover and install prebuilt plugins](https://code.claude.com/docs/en/discover-plugins)
- [Get started with Cowork](https://support.claude.com/en/articles/13345190-get-started-with-cowork)
- [Manage Cowork plugins for your organization](https://support.claude.com/en/articles/13837433-manage-cowork-plugins-for-your-organization)

