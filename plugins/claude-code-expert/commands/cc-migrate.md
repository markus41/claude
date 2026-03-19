---
name: cc-migrate
intent: Migrate Claude Code configurations between versions, convert legacy formats, and upgrade deprecated patterns
tags:
  - claude-code-expert
  - command
  - migration
  - upgrade
  - config
arguments:
  - name: target
    description: What to migrate — "all", "settings", "hooks", "rules", "plugins", "mcp", "memory", or a specific file path
    required: false
    type: string
    default: all
flags:
  - name: dry-run
    description: Show what would change without writing any files
    type: boolean
    default: false
  - name: backup
    description: Create timestamped backups before modifying files
    type: boolean
    default: true
  - name: from-version
    description: Override source version detection (e.g., "3.0", "4.0")
    type: string
  - name: to-version
    description: Target version to migrate to (defaults to latest)
    type: string
    default: latest
  - name: report
    description: Save migration report to .claude/migration-report.md
    type: boolean
    default: false
  - name: fix
    description: Auto-fix deprecated patterns without prompting
    type: boolean
    default: false
---

# /cc-migrate — Project Migration Assistant

Detect outdated Claude Code configurations, convert legacy formats, and upgrade deprecated
patterns. Ensures your setup stays current as Claude Code evolves.

## Usage

```bash
/cc-migrate                          # Full migration scan + interactive upgrade
/cc-migrate --dry-run                # Show what would change without writing
/cc-migrate settings                 # Migrate only settings.json
/cc-migrate hooks                    # Migrate only hooks configuration
/cc-migrate plugins                  # Migrate only plugin manifests
/cc-migrate --fix                    # Auto-fix all deprecated patterns
/cc-migrate --report                 # Generate migration report
/cc-migrate --from-version 3.0      # Force source version detection
```

---

## Migration Domains

### 1. Settings Migration

Detect and upgrade `settings.json` and `settings.local.json` schema changes.

```
Migration checks:
├── Deprecated keys removed or renamed
├── New required keys added with sensible defaults
├── Permission format changes (string → object)
├── Hook event name changes (e.g., PostToolUseFailure additions)
├── Model ID updates (old model names → current IDs)
└── Enterprise settings compatibility
```

#### Settings Migration Rules

```yaml
migrations:
  # Model ID updates
  - pattern: "claude-3-opus"
    replacement: "claude-opus-4-6"
    reason: "Model family updated to Claude 4.x"

  - pattern: "claude-3-sonnet"
    replacement: "claude-sonnet-4-6"
    reason: "Model family updated to Claude 4.x"

  - pattern: "claude-3-haiku"
    replacement: "claude-haiku-4-5"
    reason: "Model family updated to Claude 4.x"

  # Permission format
  - pattern: '"allowedTools": ["Bash(npm test)"]'
    replacement: '"permissions": {"allow": ["Bash(npm test)"]}'
    reason: "allowedTools renamed to permissions.allow"

  # Hook event names
  - pattern: '"ToolUseFailure"'
    replacement: '"PostToolUseFailure"'
    reason: "Event renamed for consistency with lifecycle prefix convention"
```

### 2. Hooks Migration

Upgrade hook configurations and scripts to current conventions.

```
Migration checks:
├── Hook event names match current lifecycle events
│   ├── PreToolUse, PostToolUse, PostToolUseFailure
│   ├── Notification, Stop, SubagentStop
│   └── PreCompact, PostCompact (newer events)
├── Hook scripts exist and are executable
├── Hook JSON output format matches current schema
├── Deprecated hook patterns replaced
│   ├── stdout text → stdout JSON { "decision": "...", "reason": "..." }
│   ├── exit-code-only → JSON response with reason
│   └── Inline commands → script file references
└── Timeout values within supported range
```

#### Hook Script Upgrade

```bash
# OLD format (pre-4.0): plain text output
echo "BLOCK: dangerous command detected"

# NEW format (4.0+): JSON output
echo '{"decision": "block", "reason": "dangerous command detected"}'
```

### 3. Rules Migration

Upgrade `.claude/rules/*.md` files to current format.

```
Migration checks:
├── Frontmatter format (paths field uses valid glob patterns)
├── Rules not duplicating CLAUDE.md content
├── Lessons-learned entries with NEEDS_FIX older than 30 days flagged
├── Path-scoped rules use current file extensions
└── No conflicting rules across files
```

### 4. Plugin Migration

Upgrade plugin manifests and directory structure.

```
Migration checks:
├── plugin.json schema matches current version
│   ├── Required fields present (name, version, description)
│   ├── Commands array format (name + path)
│   ├── Agents array format (name + path)
│   └── Skills array format (name + path)
├── Resource files referenced in manifest exist on disk
├── Agent .md files have valid YAML frontmatter
│   ├── name, description, tools, model fields
│   └── Model IDs are current
├── Skill directories contain SKILL.md
└── Legacy flat skill files → directory + SKILL.md structure
```

#### Legacy Skill Conversion

```
BEFORE (flat file):
  skills/my-skill.md

AFTER (directory structure):
  skills/my-skill/SKILL.md
```

### 5. MCP Migration

Upgrade `.mcp.json` server configurations.

```
Migration checks:
├── Server command paths are valid
├── Deprecated server names updated
├── Environment variable references exist
├── Duplicate server entries removed
├── Disabled servers flagged for cleanup
└── Package versions referenced are current
```

### 6. Memory Migration

Upgrade memory architecture to current conventions.

```
Migration checks:
├── MEMORY.md exists and is under 200 lines
├── Memory files have valid frontmatter (name, description, type)
├── No memory content stored directly in MEMORY.md (index only)
├── Legacy .claude/memory/ → project-scoped memory path
├── Orphaned memory files (not referenced in MEMORY.md)
└── Memory types match current schema (user, feedback, project, reference)
```

---

## Implementation

When invoked:

### Phase 1: Detection (read-only)

1. Scan all Claude Code configuration files
2. Detect current version of each configuration domain
3. Build a migration plan listing every change needed

```bash
# Files to scan
CONFIG_FILES=(
  ".claude/settings.json"
  ".claude/settings.local.json"
  ".mcp.json"
  "CLAUDE.md"
  ".claude/CLAUDE.md"
)

# Directories to scan
CONFIG_DIRS=(
  ".claude/rules/"
  ".claude/skills/"
  ".claude/agents/"
  ".claude/hooks/"
  "plugins/*/.claude-plugin/"
)
```

### Phase 2: Analysis

For each detected issue, classify:

| Severity | Meaning | Action |
|----------|---------|--------|
| **CRITICAL** | Configuration will not work | Must fix |
| **DEPRECATED** | Works now but will break in future | Should fix |
| **UPGRADE** | Better pattern available | Nice to fix |
| **INFO** | Informational finding | No action needed |

### Phase 3: Report

Display findings in structured format:

```
=== Claude Code Migration Report ===

Target version: 4.6 (latest)
Detected version: mixed (settings: 4.0, hooks: 3.x, plugins: 4.2)

[CRITICAL] settings.json: "allowedTools" key deprecated → use "permissions.allow"
[DEPRECATED] hooks/auto-format.sh: text output → must return JSON
[DEPRECATED] settings.json: model "claude-3-sonnet" → "claude-sonnet-4-6"
[UPGRADE] skills/my-skill.md: flat file → directory structure recommended
[UPGRADE] .mcp.json: "memory" server package outdated (0.6.2 → 1.0.0)
[INFO] 14 NEEDS_FIX entries in lessons-learned.md older than 7 days

Summary: 1 critical, 2 deprecated, 2 upgrades, 1 info
```

### Phase 4: Apply (unless --dry-run)

1. Create backups if `--backup` is set (default: true)
   ```bash
   # Backup format: .claude/backups/migrate-{timestamp}/
   mkdir -p .claude/backups/migrate-$(date +%Y%m%d-%H%M%S)
   ```
2. Apply changes in dependency order:
   - Settings first (other configs may depend on settings)
   - MCP config second (servers referenced by hooks)
   - Hooks third (may reference scripts)
   - Rules fourth (may reference patterns from above)
   - Plugins last (may reference all of the above)
3. Validate each change after applying
4. If `--report` flag: save full report to `.claude/migration-report.md`

### Phase 5: Verification

After applying changes:

```bash
# Validate all JSON files
for f in .claude/settings.json .mcp.json; do
  python3 -c "import json; json.load(open('$f')); print('OK: $f')"
done

# Validate hook scripts are executable
find .claude/hooks/ -name "*.sh" ! -perm -u+x -exec echo "NOT EXECUTABLE: {}" \;

# Validate skill directory structure
for d in .claude/skills/*/; do
  [ ! -f "$d/SKILL.md" ] && echo "MISSING SKILL.md: $d"
done
```

---

## Version History Reference

| Version | Key Changes |
|---------|------------|
| 3.x | Text-based hook output, flat skill files, allowedTools key |
| 4.0 | JSON hook output, directory skills, permissions.allow, PostToolUseFailure |
| 4.2 | Council review, agent lifecycle, context anchoring |
| 4.5+ | PreCompact/PostCompact hooks, enhanced memory frontmatter, model ID updates |

---

## Safety

- **Backups**: All original files are backed up before modification (unless `--backup false`)
- **Atomic writes**: Changes are written to temp files first, then renamed
- **Validation**: Every modified file is validated after writing
- **Rollback**: If any validation fails, all changes in that domain are reverted from backup
- **No data loss**: Migration never deletes content — it transforms or moves it
