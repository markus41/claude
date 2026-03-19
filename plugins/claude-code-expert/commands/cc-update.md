# /cc-update — Incremental Plugin Sync & Project Configuration Update

Update the installed Claude Code configuration after plugin changes. Uses the fingerprint
system to only touch managed files. Discovers sub-repositories and ensures they have proper
`.claude` setups. Regenerates documentation structure and validates health.

## Usage

```bash
/cc-update                       # Full incremental update
/cc-update --dry-run             # Show what would change without writing
/cc-update --force               # Overwrite all managed files (ignore fingerprint)
/cc-update --sub-repos-only      # Only discover and set up sub-repositories
/cc-update --health-only         # Only run health check, no changes
/cc-update --docs-only           # Only regenerate docs/context/ scaffolding
/cc-update --hooks-only          # Only sync hook scripts and settings.json hooks
/cc-update --research-only       # Only update researcher agents and routing
/cc-update --rotate              # Rotate lessons-learned.md (archive + promote)
```

---

## Phase 1: Read Fingerprint

Check `.claude/fingerprint.json` for current state:

```bash
if [ -f ".claude/fingerprint.json" ]; then
  CURRENT_VERSION=$(jq -r '.pluginVersion' .claude/fingerprint.json)
  PLUGIN_VERSION=$(jq -r '.version' plugins/claude-code-expert/.claude-plugin/plugin.json)
  # Compare versions to determine what needs updating
fi
```

If no fingerprint exists, treat as fresh install → run `/cc-setup --auto` instead.

---

## Phase 2: Sub-Repository Discovery

### 2.1 Find Nested Repos

```bash
# Discover git repos within the project
find . -name ".git" -type d \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/modules/*" \
  ! -path "*/vendor/*" \
  -maxdepth 4 2>/dev/null \
  | sed 's|/.git$||'

# Also check monorepo package directories
find ./packages ./apps ./services ./libs -maxdepth 1 -mindepth 1 -type d 2>/dev/null
```

### 2.2 Ensure .claude Setup Per Sub-Repo

For each discovered sub-repo:

1. **Create `.claude/` directory** if missing
2. **Create `CLAUDE.md`** if missing — inherit from parent with local overrides:
   ```markdown
   # {package-name} — Claude Code Instructions

   ## Parent Project
   See @../../CLAUDE.md for global conventions.

   ## Local Build Commands
   {auto-detected from local package.json}

   ## Scope
   {from package.json description}
   ```
3. **Create `rules/lessons-learned.md`** if missing (empty template)
4. **Create `settings.json`** if missing (inherit parent permissions)

### 2.3 Update Fingerprint Sub-Repos List

```json
"subRepos": [
  { "path": "packages/api", "hasClaudeSetup": true, "stack": ["typescript", "fastapi"] },
  { "path": "packages/web", "hasClaudeSetup": true, "stack": ["typescript", "react"] }
]
```

---

## Phase 3: Configuration Sync

### 3.1 Hook Scripts

Ensure all hook scripts from the plugin exist and are executable:

```bash
REQUIRED_HOOKS=(
  "lessons-learned-capture.sh"
  "anchor-state.sh"
  "recover-state.sh"
  "research-anchor.sh"
  "session-init.sh"
  "bash-safety-validator.sh"
  "protect-critical-files.sh"
  "post-edit-lint.sh"
)

for hook in "${REQUIRED_HOOKS[@]}"; do
  if [ ! -x ".claude/hooks/$hook" ]; then
    # Copy from plugin templates or generate
    chmod +x ".claude/hooks/$hook"
  fi
done
```

### 3.2 Settings.json Hooks

Ensure `settings.json` has all required hook events:

| Event | Hook | Purpose |
|-------|------|---------|
| `SessionStart[startup]` | `session-init.sh` | Load project context |
| `SessionStart[compact]` | echo reminder | Post-compact reminder |
| `PostToolUseFailure` | `lessons-learned-capture.sh` | Error capture |
| `PreCompact` | `anchor-state.sh` | Save state before compaction |
| `PostCompact` | `recover-state.sh` | Restore state after compaction |
| `SubagentStop` | `research-anchor.sh` | Anchor research findings |
| `PreToolUse[Bash]` | `bash-safety-validator.sh` | Prevent dangerous commands |
| `PreToolUse[Edit\|Write]` | `protect-critical-files.sh` | Guard critical files |

### 3.3 MCP Configuration

Verify `.mcp.json` has all recommended MCP servers:

```json
{
  "mcpServers": {
    "perplexity": { "required": true },
    "firecrawl": { "required": true },
    "context7": { "recommended": true },
    "lessons-learned": { "recommended": true },
    "code-quality-gate": { "recommended": true }
  }
}
```

### 3.4 Rules Files

Ensure `.claude/rules/` has required files:

| File | Type | Purpose |
|------|------|---------|
| `architecture.md` | Global | Project structure conventions |
| `code-style.md` | Scoped | Language conventions |
| `git-workflow.md` | Global | Git conventions |
| `research.md` | Global | MCP tool routing |
| `self-healing.md` | Global | Error capture protocol |
| `testing.md` | Scoped | Test conventions |
| `lessons-learned.md` | Global | Auto-growing error log |

---

## Phase 4: Documentation Generation

### 4.1 Root CLAUDE.md

Update (or generate) root CLAUDE.md with:

```markdown
# Project Instructions

## Stack
{auto-detected from package.json, tsconfig.json, etc.}

## Build & Test
{auto-detected commands}

## Reference Documents
- Architecture: @docs/context/architecture.md
- API Guidelines: @docs/context/api-guidelines.md
- Testing Strategy: @docs/context/testing-strategy.md
- Security Rules: @docs/context/security-rules.md
- Current Plan: @docs/context/plan.md

## Rules
- Code Style: @.claude/rules/code-style.md
- Git Workflow: @.claude/rules/git-workflow.md
- Research: @.claude/rules/research.md
- Lessons Learned: @.claude/rules/lessons-learned.md

## Research Tools
- Perplexity MCP: Knowledge Q&A, current events, comparisons
- Firecrawl MCP: URL scraping, structured extraction
- Context7 MCP: Library docs (MANDATORY for audits and planning)

## Workflow
EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT
```

### 4.2 docs/context/ Scaffolding

Generate template files for any missing docs/context/ files:

| File | Auto-Populated From |
|------|-------------------|
| `project-overview.md` | package.json description, README first paragraph |
| `architecture.md` | Directory structure analysis |
| `domain-glossary.md` | Template only |
| `testing-strategy.md` | Detected test framework |
| `api-contracts.md` | Template only |
| `security-rules.md` | Template with sensible defaults |
| `changelog.md` | Recent git log |
| `plan.md` | Empty scratch pad |
| `decisions/adr-template.md` | ADR template |

---

## Phase 5: LSP Detection

Check for required LSP servers based on detected stack:

| Stack | LSP | Check Command |
|-------|-----|---------------|
| TypeScript | typescript-language-server | `which typescript-language-server` |
| Python | pyright | `which pyright` |
| Rust | rust-analyzer | `which rust-analyzer` |
| Go | gopls | `which gopls` |
| C# | omnisharp | `which omnisharp` |

Report missing LSPs with install commands.

---

## Phase 6: Health Check

### 6.1 Lessons-Learned Health

```
Entries: {count}
  RESOLVED: {count} ({percentage}%)
  NEEDS_FIX: {count} ({percentage}%)
  Unresolved > 7 days: {count}
  Patterns detected: {count}
  Lines: {count} / 300 limit
```

### 6.2 Memory Health

```
MEMORY.md: {lines} / 200 limit
Anchored state: {exists?}
Research findings: {lines}
Fingerprint: {version, age}
```

### 6.3 Hook Health

```
Hooks configured: {count} / {expected}
Hook scripts executable: {count} / {total}
Missing hooks: {list}
```

### 6.4 Overall Score

```
=== Claude Code Health ===

Configuration:   ██████████ 100%  ✓ All layers configured
Hooks:           ████████░░  80%  ✓ 7/9 hooks active
Memory:          ██████████ 100%  ✓ 3-tier architecture
Research:        ██████████ 100%  ✓ All 3 MCP tools routed
Sub-Repos:       ██████░░░░  60%  ⚠ 2/4 sub-repos configured
Docs:            ████░░░░░░  40%  ⚠ 4/10 context docs exist
Lessons Health:  ████████░░  80%  ⚠ 3 unresolved > 7 days

Overall: 80/100
```

---

## Phase 7: Write Fingerprint

Update `.claude/fingerprint.json` with:

```json
{
  "pluginName": "claude-code-expert",
  "pluginVersion": "5.0.0",
  "lastUpdate": "{timestamp}",
  "stack": { ... },
  "managedFiles": { ... },
  "subRepos": [ ... ],
  "memoryHealth": { ... },
  "score": 80
}
```

---

## Phase 8: Lessons-Learned Rotation (--rotate)

When `--rotate` flag is used:

1. **Archive**: Move RESOLVED entries older than 30 days to `.claude/lessons-archive/{year}-{month}.md`
2. **Promote**: Entries with 3+ similar patterns → create/update permanent rule in `.claude/rules/`
3. **Prune**: Remove NEEDS_FIX entries older than 14 days with no resolution
4. **Reindex**: Clean up the file for readability
5. **Update fingerprint**: Record rotation date

---

## Output

```
=== /cc-update — Incremental Sync ===

Plugin: claude-code-expert v5.0.0 (was v4.1.0)
Mode: incremental (fingerprint found)

[✓] Hook scripts: 8/8 present and executable
[✓] Settings.json: 8/8 hook events configured
[✓] MCP servers: 3/3 configured in .mcp.json
[✓] Rules: 7/7 files present
[✓] Sub-repos: 3 discovered, all have .claude/
[✓] docs/context/: 6/10 files (4 templates generated)
[✓] CLAUDE.md: Updated with reference links
[✓] Fingerprint: Updated

Health: 88/100
Recommendations:
- Run /cc-update --rotate to archive 5 old lessons
- Fill in docs/context/domain-glossary.md
- Install missing LSP: pyright (pip install pyright)
```
