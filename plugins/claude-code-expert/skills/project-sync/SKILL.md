---
description: "Project sync and configuration propagation — auto-invoke when running /cc-sync or updating Claude Code setup across repos"
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
---

# Project Sync

Reusable workflow for keeping Claude Code configuration current across a project
and its sub-repositories. Powers the `/cc-sync` command.

## When to Use

- After adding new dependencies, frameworks, or services to the project
- After restructuring directories or creating new packages
- When sub-repos are missing `.claude/` configuration
- When `docs/context/` needs scaffolding or updates
- When README.md or CLAUDE.md are out of date
- Periodically (weekly or per-sprint) to catch configuration drift

## Core Workflow

### 1. Re-Fingerprint

Re-scan the project using detection maps from `/cc-setup`:
- Languages, frameworks, infrastructure, databases, services
- Test frameworks, package manager, monorepo structure
- Compare against `.claude/sync-state.json` for delta

### 2. Sub-Repo Discovery

```bash
# Find nested git repos (exclude standard non-project dirs)
EXCLUDE="node_modules|\.git|vendor|dist|build|coverage|__pycache__|\.next|\.nuxt"
find . -maxdepth 2 -name ".git" -type d | grep -vE "$EXCLUDE"
```

For each sub-repo without `.claude/`:
- Create `.claude/` directory structure
- Generate CLAUDE.md with sub-project context
- Copy essential rules (self-healing, lessons-learned)
- Inherit root settings with sub-repo overrides

### 3. Documentation Scaffold

Create `docs/context/` files that don't exist:

| File | Auto-populated from |
|------|---------------------|
| project-overview.md | package.json, directory tree, fingerprint |
| architecture.md | Detected components, services |
| data-model.md | Prisma schema, migration files |
| api-contracts.md | Route files, OpenAPI specs |
| testing-strategy.md | Test framework config, test directories |
| security-rules.md | Auth middleware, env vars |
| changelog.md | Git log summary |

### 4. README/CLAUDE.md Update

Section-aware merge:
- Scan existing README.md for section headings
- Add missing sections (Getting Started, Architecture, Claude Code Integration, etc.)
- Never delete or overwrite existing user sections
- Update CLAUDE.md cross-references to new assets

### 5. LSP Installation

For each detected language, check binary availability and install if missing.

### 6. Verification

Score the configuration on a 0-100 scale across:
- CLAUDE.md quality (15pts)
- README.md completeness (10pts)
- .claude/rules/ coverage (15pts)
- .claude/skills/ relevance (10pts)
- .claude/agents/ coverage (10pts)
- .claude/hooks/ events (10pts)
- .claude/templates/ (5pts)
- docs/context/ coverage (10pts)
- Sub-repo propagation (5pts)
- LSP installation (5pts)
- MCP servers (5pts)

## Merge Strategy

```
IF file does not exist → CREATE from template
ELIF --force flag → BACKUP (.bak) then OVERWRITE
ELSE → SKIP (preserve user content)
```

For README.md and CLAUDE.md, use section-level granularity instead of file-level.

## Outputs

- Sync report with created/updated/skipped counts
- Score with delta from last sync
- Recommendations for empty template files
- Updated `.claude/sync-state.json`

## Reference Files

- `/cc-sync` command: `commands/cc-sync.md`
- `/cc-setup` command: `commands/cc-setup.md`
- Detection maps: Phase 1 of cc-setup.md
- Template library: Phase 3 of cc-sync.md
