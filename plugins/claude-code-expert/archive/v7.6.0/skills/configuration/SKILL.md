# Claude Code Configuration

Complete guide to all configuration files, settings, and directory structure.

## Directory Structure

```
project/
├── .claude/
│   ├── CLAUDE.md          # Project-level instructions (checked into git)
│   ├── settings.json      # Project-level settings (checked into git)
│   ├── settings.local.json # Local overrides (gitignored)
│   ├── rules/             # Path-scoped rule files
│   ├── skills/            # Reusable workflow definitions
│   ├── agents/            # Custom agent definitions
│   ├── hooks/             # Hook scripts
│   ├── plugins/           # Installed plugins
│   ├── registry/          # Plugin registry metadata
│   └── tools/             # Custom tools
├── .mcp.json              # MCP server configuration
├── CLAUDE.md              # Root-level project instructions
└── ...
```

## CLAUDE.md Hierarchy

Claude Code loads instructions from multiple levels (all are additive):

### 1. Enterprise Level (highest priority)
- Managed by organization admins
- Cannot be overridden by lower levels
- Distributed via managed settings

### 2. User Level
- `~/.claude/CLAUDE.md` — Global user instructions
- Applies to all projects for this user

### 3. Project Level (most common)
- `./CLAUDE.md` — Root project instructions
- `./.claude/CLAUDE.md` — Additional project instructions
- Both are loaded; they combine

### 4. Directory Level
- `path/to/dir/CLAUDE.md` — Instructions scoped to that directory
- Only loaded when Claude is working with files in that directory

### Writing Effective CLAUDE.md

```markdown
# Project Instructions

## Build & Test
- Install: `pnpm install`
- Test: `pnpm test`
- Single test: `pnpm test -- --grep "test name"`
- Lint: `pnpm lint`

## Code Style
- Use TypeScript strict mode
- Prefer async/await over callbacks
- Max function length: 50 lines

## Architecture
- Monorepo with packages in `packages/`
- Shared types in `packages/shared`
- API routes in `src/api/`

## Important Context
- Database uses PostgreSQL with Prisma ORM
- Auth uses Keycloak OIDC
- Deploy target: Kubernetes on AWS EKS
```

## settings.json

Project and user settings files control Claude Code behavior.

### File Locations
- **Project**: `.claude/settings.json` (checked into git)
- **Project local**: `.claude/settings.local.json` (gitignored)
- **User**: `~/.claude/settings.json` (global)

### Schema

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Bash(npx tsc --noEmit)",
      "Read",
      "Glob",
      "Grep"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(curl *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/pre-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [],
    "Notification": [],
    "Stop": [],
    "SubagentStop": []
  },
  "env": {
    "CUSTOM_VAR": "value"
  },
  "model": "claude-sonnet-4-6",
  "smallFastModel": "claude-haiku-4-5-20251001",
  "temperature": 1.0,
  "autoMemory": true,
  "autoCompact": true,
  "contextWindow": {
    "compactThreshold": 0.8,
    "warningThreshold": 0.9
  }
}
```

### Permission Patterns

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(npm test)",
      "Bash(npm run *)",
      "Bash(npx tsc *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "mcp__filesystem__*",
      "WebFetch(https://docs.*)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | bash)",
      "Bash(wget * | bash)"
    ]
  }
}
```

### Permission Glob Patterns
- `*` matches any characters within a single argument
- `Bash(npm *)` matches `npm test`, `npm install`, etc.
- `mcp__server__*` matches all tools from an MCP server
- Tool names: `Read`, `Write`, `Edit`, `Glob`, `Grep`, `Bash`, `WebFetch`, `WebSearch`, `Agent`, `TodoWrite`, `NotebookEdit`

## .mcp.json

MCP server configuration file at project root.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
      "env": {}
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db"
      }
    },
    "custom-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": {
        "API_KEY": "..."
      }
    }
  }
}
```

## Rules System

Rules are markdown files in `.claude/rules/` loaded as project instructions.

### Path-Scoped Rules

```markdown
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules
- Use strict mode
- Prefer interfaces over types for object shapes
```

### Global Rules (no paths frontmatter)

```markdown
# Git Rules
- Never force push to main
- Use conventional commit format
```

## settings.local.json

Local overrides that are NOT checked into git. Same schema as `settings.json`. Values merge with (and override) `settings.json`.

```json
{
  "permissions": {
    "allow": [
      "Bash(docker *)"
    ]
  },
  "env": {
    "DATABASE_URL": "postgresql://localhost:5432/mydb"
  }
}
```
