---
name: plugin-development
description: Complete guide to building Claude Code plugins — manifest schema, command/skill/agent/hook authoring, MCP server development, marketplace publishing, and testing
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
triggers:
  - build plugin
  - create plugin
  - plugin development
  - plugin manifest
  - plugin schema
  - plugin authoring
  - marketplace publish
  - plugin structure
  - plugin scaffolding
---

# Plugin Development Complete Guide

Building Claude Code plugins means creating directories, manifests, and markdown files that extend Claude's capabilities through commands, skills, agents, and hooks.

## Plugin Anatomy

Every plugin follows this directory structure:

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json               # Manifest (REQUIRED)
├── commands/                      # Slash commands
│   ├── index.json                # Command index (optional)
│   └── my-command.md
├── skills/                        # Knowledge packs
│   ├── skill-name/
│   │   └── SKILL.md
│   └── another-skill/
│       └── SKILL.md
├── agents/                        # Specialized workers
│   ├── index.json                # Agent index (optional)
│   ├── my-agent.md
│   └── another-agent.md
├── hooks/                         # Lifecycle scripts
│   ├── hooks.json                # Hook configuration
│   ├── my-hook.sh
│   └── scripts/
│       └── helper.sh
├── mcp-server/                    # Optional: custom MCP server
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── dist/
├── CLAUDE.md                      # Plugin routing guide (recommended)
├── CONTEXT_SUMMARY.md             # Bootstrap context (recommended, 700 tokens max)
└── README.md                      # Marketplace documentation
```

## Manifest Schema (plugin.json)

Located at `.claude-plugin/plugin.json`, the manifest defines plugin identity, permissions, and capabilities.

### Required Fields

| Field | Type | Example |
|-------|------|---------|
| `$schema` | string | `"https://claude.local/schemas/plugin.schema.json"` |
| `name` | string | `"my-awesome-plugin"` |
| `version` | string | `"1.0.0"` (semver) |
| `description` | string | One-line summary (50-80 chars) |
| `author.name` | string | Your name or org |
| `license` | string | `"MIT"` or other SPDX |
| `permissions.requires` | string[] | Minimum permissions needed |

### Example Manifest

```json
{
  "$schema": "https://claude.local/schemas/plugin.schema.json",
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "Does something amazing with Claude Code",
  "author": {
    "name": "Your Name"
  },
  "license": "MIT",
  "repository": "https://github.com/user/my-awesome-plugin",
  "keywords": [
    "automation",
    "productivity",
    "development"
  ],
  "permissions": {
    "requires": [
      "read",
      "write"
    ],
    "optional": [
      "bash",
      "agent",
      "mcp"
    ]
  },
  "capabilities": {
    "provides": [
      "my-custom-capability"
    ],
    "requires": []
  },
  "contextEntry": "CONTEXT_SUMMARY.md",
  "context": {
    "entry": "CONTEXT_SUMMARY.md",
    "title": "My Awesome Plugin",
    "summary": "Essential context for using the plugin",
    "tags": [
      "automation",
      "claude-code"
    ],
    "bootstrapFiles": [
      "CONTEXT_SUMMARY.md"
    ],
    "maxTokens": 700,
    "excludeGlobs": [
      "**/node_modules/**",
      "**/.git/**"
    ],
    "lazyLoadSections": [
      "CLAUDE.md",
      "commands/advanced.md",
      "skills/expert-mode/SKILL.md"
    ]
  }
}
```

### Manifest Fields Explained

**`$schema`**: Validates against Claude's plugin schema. Use as shown above.

**`name`**: Unique identifier (lowercase, hyphens). Used in `claude plugin install` commands.

**`version`**: Semantic versioning. Increment when publishing updates (1.0.0 → 1.0.1 for patches, 1.1.0 for features, 2.0.0 for breaking changes).

**`permissions.requires`**: Minimum permissions needed. Plugin will not load without these:
- `read` — read files
- `write` — write files
- `bash` — execute shell commands
- `agent` — spawn subagents
- `mcp` — use MCP servers
- `network` — external HTTP

**`permissions.optional`**: Nice-to-have permissions. Plugin works without them but features are limited.

**`capabilities.provides`**: Custom capabilities your plugin exposes. Use for plugin discovery and dependency resolution.

**`contextEntry`**: Points to the bootstrap file. Always `"CONTEXT_SUMMARY.md"`.

**`context.bootstrapFiles`**: Files loaded into context when plugin installs. Keep to 700 tokens.

**`context.lazyLoadSections`**: Files loaded on-demand when user references them. Helps large plugins stay responsive.

**`context.excludeGlobs`**: Patterns to exclude from context scanning (node_modules, build artifacts, etc.).

## Command Authoring

Commands are markdown files in the `commands/` directory with YAML frontmatter and implementation body.

### Command Frontmatter Schema

```yaml
---
name: my-command
intent: What this command does (one sentence)
inputs:
  - name: description
  - task: what the user wants
  - query: optional search term
flags:
  - name: force
    type: boolean
    description: Skip confirmations
  - name: output
    type: choice
    choices: [json, text, html]
    description: Output format
risk: low
cost: low
tags:
  - my-plugin
  - productivity
---
```

### Command Body Structure

After frontmatter, the body contains:

1. **Usage Examples** (code blocks with bash syntax)
2. **Operating Protocol** (numbered phases)
3. **Output Contract** (what the command produces)

### Full Command Example

```yaml
---
name: batch-process
intent: Process multiple files with transformation rules
inputs:
  - files: pattern matching files to process
  - rule: transformation function (e.g., "uppercase", "snake_case")
flags:
  - name: dry-run
    type: boolean
    description: Show changes without applying
  - name: workers
    type: string
    description: Number of parallel workers (default 4)
risk: medium
cost: medium
tags:
  - my-plugin
  - batch
---

# Batch Process Command

Process multiple files with transformation rules applied in parallel.

## Usage

```bash
/batch-process --files "src/**/*.ts" --rule uppercase
/batch-process --files "*.md" --rule snake_case --dry-run
/batch-process --files "src/**/*.js" --rule lowercase --workers 8
```

## Operating Protocol

1. **Parse** input flags and file pattern
2. **Validate** files exist and are readable
3. **Check dry-run** — if set, show preview without modifying
4. **Scan** matching files into queue
5. **Apply rule** to each file (parallel if workers > 1)
6. **Report** changes: files modified, skipped, failed
7. **Rollback** if failures exceed threshold (--continue-on-error overrides)

## Output Contract

Returns JSON object:
```json
{
  "processed": 42,
  "modified": 40,
  "skipped": 2,
  "failed": 0,
  "duration_ms": 1234,
  "files": [
    {"path": "src/file.ts", "status": "modified", "size_before": 100, "size_after": 120}
  ]
}
```
```

### Command Naming

Prefix commands with plugin name for namespacing:
- Good: `/my-plugin-batch`, `/my-plugin-audit`
- Avoid: `/batch`, `/process` (too generic)

## Skill Authoring

Skills are knowledge packs in `skills/SKILLNAME/SKILL.md` with frontmatter and progressive loading.

### Skill Frontmatter

```yaml
---
name: my-skill
description: What this skill teaches (one sentence)
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
triggers:
  - use my skill
  - teach me about skill
  - how to use skill
disable-model-invocation: false
---
```

Set `disable-model-invocation: true` for user-only reference skills (no model can invoke them).

### Skill Body Structure

1. **Goal** (why someone uses this skill)
2. **Core Loop** (numbered steps, 5-10 steps typical)
3. **Examples** (real code snippets)

### Full Skill Example

```yaml
---
name: database-migrations
description: Safely design and test database migrations with rollback paths
allowed-tools:
  - Read
  - Write
  - Bash
triggers:
  - database migration
  - db migration
  - migration strategy
  - rollback plan
---

# Database Migrations

Design, test, and execute database migrations safely with automatic rollback paths.

## Goal

Write migrations that are **testable**, **reversible**, and **traceable**. Catch issues in development, not production.

## Core Loop

1. **Analyze** existing schema using introspection (PRAGMA for SQLite, DESCRIBE for MySQL)
2. **Design** migration: identify impact zones (tables, columns, indexes affected)
3. **Write up migration** in idempotent SQL (use CREATE IF NOT EXISTS, etc.)
4. **Test forward** locally: apply migration to dev DB, verify no errors
5. **Test backward** locally: rollback, verify schema returns to original state
6. **Document** rollback procedure: exact SQL to undo, any data caveats
7. **Plan downtime** or use zero-downtime pattern (shadow columns, dual-write)
8. **Execute in staging** first, verify application compatibility
9. **Run in production** during maintenance window with team ready to rollback
10. **Verify** schema matches expectation post-migration

## Examples

### SQLite: Add Column (Reversible)

Forward:
```sql
ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL;
```

Backward:
```sql
-- SQLite doesn't support DROP COLUMN in older versions, so recreate:
-- Copy old schema to backup, drop table, recreate without new column
```

### PostgreSQL: Add Column with Default (Zero-Downtime)

Forward (in 3 phases to avoid locking):
```sql
-- Phase 1: Add column nullable
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Phase 2: Backfill existing rows (in batches to avoid locks)
UPDATE users SET status = 'active' WHERE status IS NULL LIMIT 1000;

-- Phase 3: Add constraint and default
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
```

Backward:
```sql
ALTER TABLE users DROP COLUMN status;
```

### Testing Migration (Bash)

```bash
# Create test database
sqlite3 /tmp/test.db < schema.sql

# Apply migration
sqlite3 /tmp/test.db < migration_up.sql

# Verify schema
echo "SELECT * FROM pragma_table_info(users);" | sqlite3 /tmp/test.db

# Rollback
sqlite3 /tmp/test.db < migration_down.sql

# Verify rollback
echo "SELECT * FROM pragma_table_info(users);" | sqlite3 /tmp/test.db
```
```

### Skill Triggers

Choose triggers users actually type. Avoid generic phrases; be specific:
- Good: `database migration`, `migration strategy`, `zero-downtime pattern`
- Avoid: `how to`, `help`, `explain` (too broad)

## Agent Authoring

Agents are specialized workers in markdown with YAML frontmatter and workflow steps.

### Agent Frontmatter

```yaml
---
name: my-agent
intent: One-sentence summary of what agent does
inputs:
  - task: primary input
  - context: optional background
risk: low
cost: low
tags:
  - my-plugin
description: Multi-sentence description (2-3 sentences)
model: claude-sonnet-4-6
tools:
  - Read
  - Write
  - Bash
---
```

### Agent Model Selection

- `claude-opus-4-6`: Complex reasoning, multi-step problems, code architecture
- `claude-sonnet-4-6`: Implementation, bug fixing, most tasks (recommended default)
- `claude-haiku-4-5`: Fast research, summaries, quick lookups

### Agent Body Structure

Mandatory sections:
1. **Agent Name** (heading)
2. **Purpose** (paragraph explaining intent)
3. **When to Use** (user scenarios)
4. **Workflow** (numbered steps, 3-8 steps typical)
5. **Known Limitations** (edge cases, gotchas)

### Full Agent Example

```yaml
---
name: code-architect
intent: Design system architecture and produce implementation roadmap
inputs:
  - problem: architecture challenge to solve
  - constraints: technical/business constraints
risk: medium
cost: medium
tags:
  - my-plugin
  - architecture
  - design
description: Analyzes requirements, designs modular architecture, produces detailed implementation roadmap with testing strategy.
model: claude-opus-4-6
tools:
  - Read
  - Write
  - Grep
  - Bash
---

# Code Architect Agent

System design specialist that analyzes requirements, designs modular architecture, and produces step-by-step implementation roadmaps.

## Purpose

When teams face architecture decisions, they need structured reasoning about tradeoffs: monolith vs microservices, SQL vs NoSQL, sync vs async. This agent produces **evidence-backed design docs** that make these tradeoffs explicit and testable.

## When to Use

- Starting a new project: need architecture foundation
- Scaling existing system: need refactor strategy
- Evaluating tech choices: need comparison framework
- Code review: need architecture validation

## Workflow

1. **Understand Requirements**
   - Read problem statement and constraints
   - List functional requirements (features, user stories)
   - List non-functional requirements (scale, latency, availability)
   - Identify known edge cases

2. **Design Tradeoff Matrix**
   - List candidate architectures (3-5 options)
   - For each, score on: scalability, complexity, cost, time-to-market
   - Highlight which constraints rule out which options
   - Recommend top 2 designs

3. **Deep-Dive Recommended Design**
   - Draw module boundaries (responsibility, data ownership)
   - Define interfaces between modules
   - Show data flow end-to-end
   - Identify external dependencies

4. **Produce Roadmap**
   - Break into 4-6 phases
   - For each phase: deliverables, test strategy, rollback plan
   - Estimate effort (3-point estimates: optimistic/likely/pessimistic)
   - Call out blockers and risks

5. **Create Implementation Checklists**
   - Phase-by-phase tasks
   - Definition of done for each phase
   - Testing/validation criteria

## Known Limitations

- Architecture cannot predict all runtime issues (load patterns, failure modes)
- Assume team has required skills for chosen tech stack
- Roadmap assumes no major scope creep; update if requirements change
- Does not cover devops/infrastructure details (separate discipline)
```

## Hook Script Authoring

Hooks are bash scripts in `hooks/` that respond to lifecycle events with JSON on stdin/stdout.

### Hook Lifecycle Events

| Event | Fires | Input | Decision |
|-------|-------|-------|----------|
| `SessionStart` | Claude Code session begins | session context | additionalContext |
| `PreToolUse` | Before tool call | tool name, input | allow/block/passthrough |
| `PostToolUse` | After successful tool call | tool output | additionalContext |
| `PostToolUseFailure` | After tool call fails | tool name, error | additionalContext (can auto-heal) |
| `Stop` | Session ends | reason | cleanup |
| `Notification` | User sends message | text | prompt override |

### Hook Input Format

```json
{
  "tool_name": "Read",
  "tool_input": {
    "file_path": "/home/user/file.txt"
  },
  "session_id": "s_abc123",
  "user_message": "optional context"
}
```

### Hook Output Format

```json
{
  "additionalContext": "Helpful context to pass to Claude",
  "decision": "allow",
  "blocked_reason": "optional reason if decision is block"
}
```

### Full Hook Script Example

```bash
#!/bin/bash
# PreToolUse hook: validate dangerous operations

set -e

# Read input
input=$(cat)

# Extract fields
tool_name=$(echo "$input" | jq -r '.tool_name')
tool_input=$(echo "$input" | jq '.tool_input')
file_path=$(echo "$tool_input" | jq -r '.file_path // empty')

# Block if deleting system files
if [[ "$tool_name" == "Bash" ]] && echo "$input" | jq -r '.tool_input.command' | grep -q "rm -rf /"; then
  echo '{"decision": "block", "blocked_reason": "Dangerous operation: rm -rf / blocked"}'
  exit 0
fi

# Allow
echo '{"decision": "allow"}'
exit 0
```

### Hook Configuration (hooks.json)

```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "script": "hooks/validate-dangerous.sh",
      "enabled": true
    },
    {
      "event": "PostToolUseFailure",
      "script": "hooks/capture-errors.sh",
      "enabled": true
    }
  ]
}
```

### Hook Security

- Sanitize all inputs: `jq -r` prevents injection
- Use `flock` for atomic file writes (avoid race conditions)
- Do not execute user input directly
- Log hook executions for debugging
- Exit code 0 = success, non-zero = failure (blocks tool call if PreToolUse)

## MCP Server Development

Optional: plugins can include custom MCP servers for new tools.

### TypeScript MCP Server

```typescript
// mcp-server/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "analyze_code",
      description: "Analyzes code for patterns",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Code to analyze" },
          language: { type: "string", description: "Programming language" }
        },
        required: ["code", "language"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "analyze_code") {
    const { code, language } = request.params.arguments;
    const analysis = {
      lines: code.split('\n').length,
      language,
      patterns: ["if-else", "loops", "functions"]
    };
    return {
      content: [{ type: "text", text: JSON.stringify(analysis) }]
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### package.json for MCP Server

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "Custom MCP server for my plugin",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

## Plugin CLAUDE.md

Short routing guide (under 50 lines) for the plugin's capabilities.

```markdown
# My Awesome Plugin

## Purpose

Use this plugin when you need to automate batch processing, validate schemas, and generate reports.

## Fast Routing

- Batch process files? → `/batch-process`
- Validate schema? → `/validate-schema`
- Generate report? → `/gen-report`
- Need advanced options? → Open `skills/advanced-batch/SKILL.md`

## Operating Rules

1. Always preview with `--dry-run` before modifying
2. Use `--workers 1` for debugging
3. Check `CONTEXT_SUMMARY.md` for permission requirements
```

## CONTEXT_SUMMARY.md

Bootstrap context loaded when plugin installs. Keep under 700 tokens.

```markdown
# My Awesome Plugin Bootstrap

What this plugin does in 2-3 sentences. When to install it.

## Quick Start

- `/batch-process --help` for batch operations
- `/validate-schema FILE` to validate JSON/YAML
- Skills: `advanced-batch`, `schema-validation`

## Permissions Needed

- read, write (required)
- bash (optional, for advanced batch processing)

## Key Concepts

- **Batch Processing**: Parallel file transformation using rules
- **Schema Validation**: JSON Schema or custom validators
- **Dry-Run**: Preview changes without applying

## When to Use

- Processing 10+ files with same rule
- Ensuring data consistency
- Automating repetitive tasks
```

## Testing & Validation

### Manual Testing Checklist

- [ ] All commands parse without YAML errors
- [ ] All referenced files exist (commands, skills, agents in manifest match filesystem)
- [ ] Frontmatter fields are valid (risk/cost are low/medium/high)
- [ ] Skills have at least 3 triggers
- [ ] Commands have usage examples
- [ ] Agents have workflow steps (minimum 3)
- [ ] README is under 500 words

### Validate Manifest

```bash
# Check if plugin.json is valid JSON
python3 -m json.tool .claude-plugin/plugin.json > /dev/null && echo "JSON valid"

# Check all referenced files exist
python3 << 'EOF'
import json, os
data = json.load(open('.claude-plugin/plugin.json'))
bootstrap_files = data.get('context', {}).get('bootstrapFiles', [])
for f in bootstrap_files:
    if not os.path.exists(f):
        print(f"MISSING: {f}")
EOF
```

## Marketplace Publishing

### README Requirements

- Title and one-line description
- Features (bullet list, 3-5 items)
- Installation instructions
- Usage examples (at least 2)
- Permissions required
- Version history (latest changes)

### Versioning

- `1.0.0` — Initial release
- `1.0.1` — Bug fix (patch)
- `1.1.0` — New feature (minor)
- `2.0.0` — Breaking change (major)

### Keyword Optimization

Choose keywords from common Claude Code domains:
- automation, productivity, development, testing
- configuration, debugging, architecture, performance
- documentation, api, integration, workflow

Keep to 10-15 keywords total for discoverability.

### Distribution

Plugins are published to the Claude Code marketplace:
1. Create repo on GitHub
2. Add `.claude-plugin/plugin.json` and files
3. Tag release as `v1.0.0`
4. Submit to marketplace (review process ~24-48 hours)
5. Once approved, appears in `claude plugin search`

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| YAML parse error | Invalid frontmatter | Use valid YAML (quotes, hyphens for lists) |
| File not found | Referenced file missing | Add file or update manifest |
| Unknown permission | Typo in permissions | Use: read, write, bash, agent, mcp, network |
| Too many tokens | CONTEXT_SUMMARY too long | Trim to essentials, use lazyLoadSections |
| Tool not available | Tool not in `allowed-tools` | Add tool to skill frontmatter |
