# /cc-sync — Idempotent Claude Code Setup Sync & Update

Re-analyze the current project, update the full Claude Code configuration, propagate `.claude/`
into sub-repositories, scaffold the `docs/context/` knowledge base, and ensure README.md and
CLAUDE.md are comprehensive and interlinked. Safe to run repeatedly — merges without overwriting
user customizations.

## Usage

```bash
/cc-sync                         # Full sync — update everything
/cc-sync --dry-run               # Preview changes without writing
/cc-sync --docs-only             # Only sync docs/context/ structure
/cc-sync --subrepos-only         # Only propagate .claude to sub-repos
/cc-sync --readme-only           # Only update README.md + CLAUDE.md
/cc-sync --lsp-only              # Only detect and install LSPs
/cc-sync --rules-only            # Only sync .claude/rules/
/cc-sync --force                 # Overwrite existing files (careful!)
/cc-sync --depth 2               # Sub-repo scan depth (default: 2)
/cc-sync --verbose               # Show detailed diff of changes
```

---

## How cc-sync differs from cc-setup

| Aspect | `/cc-setup` | `/cc-sync` |
|--------|-------------|------------|
| Purpose | First-time deployment | Ongoing maintenance |
| Writes | Creates from scratch | Merges into existing |
| User edits | May overwrite | Preserves user sections |
| Sub-repos | Ignored | Discovered and configured |
| docs/context/ | Not created | Full knowledge base scaffold |
| README | Basic | Comprehensive nested structure |
| CLAUDE.md | Routing OS | Routing OS + cross-references |
| Idempotent | No | Yes — safe to re-run |
| LSP install | Recommends | Installs missing ones |

---

## Phase 1: Project Re-Fingerprint

Re-scan the project using the same detection maps as `/cc-setup` Phase 1, but compare
against the **existing** configuration to compute a delta.

### 1.1 Detect Current State

```bash
# Build current fingerprint
FINGERPRINT=(
  languages: [detected]
  frameworks: [detected]
  infrastructure: [detected]
  databases: [detected]
  services: [detected]
  test_frameworks: [detected]
  package_manager: detected
  monorepo: detected | none
  scale: small | medium | large
)

# Load previous fingerprint if saved
PREV_FINGERPRINT=".claude/sync-state.json"
```

### 1.2 Compute Delta

```json
{
  "added": ["Prisma", "Redis"],
  "removed": ["Knex"],
  "unchanged": ["TypeScript", "Next.js", "Docker", "PostgreSQL"],
  "config_drift": {
    "rules_missing": ["security.md"],
    "skills_stale": ["db-ops"],
    "hooks_orphaned": ["auto-knex.sh"],
    "agents_missing": ["security-auditor"]
  }
}
```

### 1.3 Save Fingerprint

After sync completes, write `.claude/sync-state.json` for future delta comparisons:

```json
{
  "lastSync": "2026-03-19T12:00:00Z",
  "fingerprint": { ... },
  "version": "6.1.0",
  "syncCount": 4
}
```

---

## Phase 2: Sub-Repository Discovery & Propagation

Scan for nested git repositories and ensure each has a `.claude/` directory with
appropriate configuration inherited from the root.

### 2.1 Discovery

```bash
# Find sub-directories that are git repos (up to --depth levels)
# Skip: node_modules, .git, vendor, dist, build, coverage, __pycache__
EXCLUDE_DIRS="node_modules|\.git|vendor|dist|build|coverage|__pycache__|\.next|\.nuxt|\.cache"

find . -maxdepth ${DEPTH:-2} -name ".git" -type d \
  | grep -vE "$EXCLUDE_DIRS" \
  | while read gitdir; do
      REPO_DIR=$(dirname "$gitdir")
      if [ "$REPO_DIR" != "." ]; then
        echo "SUB_REPO: $REPO_DIR"
      fi
    done
```

### 2.2 Propagation Rules

For each discovered sub-repository:

| What | Action | Override? |
|------|--------|-----------|
| `.claude/` directory | Create if missing | No |
| `CLAUDE.md` | Create with sub-project context if missing, merge if exists | Merge only |
| `.claude/rules/` | Copy root rules, skip if sub-repo has its own | No overwrite |
| `.claude/rules/lessons-learned.md` | Create empty if missing | No overwrite |
| `.claude/rules/self-healing.md` | Copy from root | No overwrite |
| `.claude/settings.json` | Inherit root permissions + sub-repo specific | Merge |
| `.claude/hooks/` | Copy session-init.sh and error capture only | No overwrite |

### 2.3 Sub-Repo CLAUDE.md Template

```markdown
# {Sub-Repo Name}

> Part of the {root_project_name} workspace.
> Root instructions: see `../../CLAUDE.md`

## Purpose
{auto_detected_from_package_json_or_directory_name}

## Build & Test
- Install: `{detected_install_cmd}`
- Build: `{detected_build_cmd}`
- Test: `{detected_test_cmd}`

## Tech Stack
{detected_from_sub_repo_files}

## Key Paths
- Source: {src_dir}
- Tests: {test_dir}

## Conventions
- Follow root project conventions unless overridden here
- {any_sub_repo_specific_conventions}

## Don't Touch
- {auto_generated_files}
```

### 2.4 Sub-Repo Sync Report

```
=== Sub-Repository Sync ===

  packages/api/        ✓ .claude/ exists, updated rules
  packages/web/        ✓ .claude/ created (new), 4 files written
  packages/shared/     ✓ .claude/ exists, no changes needed
  tools/cli/           ✓ .claude/ created (new), 3 files written
  services/worker/     ⚠ .claude/ exists, 2 rules outdated → updated

Total: 5 sub-repos, 3 updated, 2 created, 0 skipped
```

---

## Phase 3: Documentation Scaffold — docs/context/

Generate a comprehensive `docs/context/` knowledge base. Each file is created with
a starter template if it doesn't exist. Existing files are never overwritten.

### 3.1 Full Directory Structure

```text
docs/
  context/
    project-overview.md           # What this system is, for whom, capabilities, non-goals
    vision-and-roadmap.md         # Where it's going next; informs suggestions and refactors
    domain-glossary.md            # Canonical definitions for domain terms, entities, statuses
    personas-and-use-cases.md     # Key user types and primary use cases
    architecture.md               # Top-level diagram and narrative (systems, boundaries)
    architecture-runtime.md       # Runtime view (calls, queues, batch jobs, external services)
    architecture-deployment.md    # Environments, regions, scaling, feature flags
    data-model.md                 # Main entities, relationships, invariants
    data-migrations.md            # How to evolve data safely (playbooks, patterns)
    api-contracts.md              # Important endpoints, request/response, status codes
    api-guidelines.md             # REST/GraphQL patterns, pagination, errors, idempotency
    ux-flows.md                   # Main flows as step-by-step narratives
    ux-principles.md              # Design/interaction principles to protect during code changes
    security-rules.md             # Authz rules, PII handling, tenant isolation
    compliance.md                 # HIPAA/GDPR/other obligations, logging/retention rules
    testing-strategy.md           # How tests are organized, what must be tested
    test-inventory.md             # Pointers to major test suites, contracts, golden tests
    constraints.md                # Platform support, tech choices, SLAs/SLOs
    performance.md                # Budgets, hotspots, benchmarks, perf-related gotchas
    ops-and-runbooks.md           # Key operational procedures, incident handling
    changelog.md                  # Human-readable record of important changes
    plan.md                       # Current work plan / scratchpad (Claude can maintain)
    decisions/                    # Architecture Decision Records
      adr-template.md             # Starter template for new ADRs
```

### 3.2 Template Generation Rules

Each file gets a starter template with clear section headers. Templates are **only written
when the file does not exist**. Example:

#### project-overview.md template
```markdown
# Project Overview

> Auto-generated by /cc-sync on {date}. Fill in the sections below.

## What Is This?
<!-- One paragraph: what the system does and who it serves -->

## Core Capabilities
<!-- Bulleted list of primary features/services -->

## Non-Goals
<!-- What this project explicitly does NOT do -->

## Tech Stack Summary
{auto_detected_stack_from_fingerprint}

## Repository Structure
```text
{auto_generated_tree_of_top_level_dirs}
```

## Key Entry Points
<!-- Main files a new developer should read first -->

## Related Systems
<!-- External services, APIs, or repos this project depends on -->
```

#### architecture.md template
```markdown
# Architecture

> Auto-generated by /cc-sync on {date}. Fill in the sections below.

## System Diagram
<!-- Paste or describe the high-level architecture diagram -->

## Components
| Component | Purpose | Tech | Location |
|-----------|---------|------|----------|
{auto_detected_components}

## Boundaries
<!-- What is internal vs external? Where are the trust boundaries? -->

## Data Flow
<!-- How does data flow through the system? -->

## Key Design Decisions
<!-- Link to docs/context/decisions/ for ADRs -->
```

#### adr-template.md
```markdown
# ADR-NNNN: {Title}

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** {date}
**Deciders:** {names}

## Context
<!-- What is the issue that we're seeing that motivates this decision? -->

## Decision
<!-- What is the change that we're proposing and/or doing? -->

## Consequences
<!-- What becomes easier or harder because of this change? -->

## Alternatives Considered
<!-- What other options were evaluated? Why were they rejected? -->
```

### 3.3 Auto-Population from Fingerprint

When creating templates, auto-populate what we can from the project fingerprint:

| Template Field | Source |
|----------------|--------|
| Tech Stack Summary | Phase 1 detected languages/frameworks |
| Repository Structure | `ls` top-level directories |
| Components table | Detected services (Docker Compose, package.json workspaces) |
| Build commands | Detected package manager + scripts |
| Test strategy | Detected test frameworks |

---

## Phase 4: .claude/ Directory Enrichment

Ensure the `.claude/` directory has the full recommended structure. Create missing
directories and starter files without overwriting existing ones.

### 4.1 Target Structure

```text
.claude/
  CLAUDE.local.md                # Personal overrides (gitignored)
  settings.json                  # Project settings
  settings.local.json            # Personal settings (gitignored)
  rules/
    coding.md                    # Language/framework conventions
    testing.md                   # Test types, locations, coverage targets
    security.md                  # Authn/z, secrets, PII, dependency policies
    infra.md                     # Terraform/Helm/Docker conventions
    review.md                    # PR checklist, what "good" changes look like
    product.md                   # Product principles preserved in code
    git-workflow.md              # Commit format, branch strategy
    architecture.md              # Module boundaries, import rules
    self-healing.md              # Error capture and learning loop
    lessons-learned.md           # Auto-growing error/fix knowledge base
    memory-profile.md            # Project identity, team info, domains
    memory-preferences.md        # User workflow preferences, tool choices
    memory-decisions.md          # Architecture Decision Records
    memory-patterns.md           # Recurring code patterns and solutions
    memory-sessions.md           # Recent session summaries (auto-rotated)
  skills/
    code-review/
      SKILL.md                   # Structured review workflow
      checklist.md               # Review checklist
      template.md                # Review output template
      examples.md                # Example reviews
    release-notes/
      SKILL.md                   # Changelog generation from diffs/PRs
      template.md                # Release note template
      examples.md                # Example release notes
    migration-planner/
      SKILL.md                   # Safe schema/API migration planning
      playbook.md                # Step-by-step migration playbook
    bug-triage/
      SKILL.md                   # Bug categorization and prioritization
      heuristics.md              # Triage decision heuristics
  templates/
    pr-description.md            # PR template Claude fills in
    design-doc.md                # Small RFC/ADR skeleton
    test-plan.md                 # Test description template
    incident-report.md           # Postmortem template
  agents/
    backend-architect.md         # Backend/infra heuristics persona
    frontend-specialist.md       # UI/UX specialist persona
    infra-guardian.md             # Conservative, safety-first infra persona
    qa-analyst.md                # Test design and bug-hunting focus
  hooks/
    security-guard.sh            # Block destructive commands
    auto-format.sh               # Format on save
    lessons-learned-capture.sh   # Capture errors
    inject-context.sh            # Dynamic context injection
    session-init.sh              # Session startup
    on-stop.sh                   # Session end
```

### 4.2 Merge Strategy

For each file in the target structure:

```
IF file does not exist:
  → Create from template
  → Log: "CREATED: {path}"
ELSE IF file exists AND --force flag:
  → Backup to {path}.bak
  → Overwrite with template
  → Log: "OVERWRITTEN: {path} (backup at {path}.bak)"
ELSE:
  → Skip
  → Log: "SKIPPED: {path} (already exists)"
```

### 4.3 Starter Skill Templates

#### code-review/SKILL.md
```markdown
---
description: "Structured code review — auto-invoke for PR reviews and /review commands"
model: claude-opus-4-6
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Code Review

## Workflow
1. Read the diff or changed files
2. Run through checklist.md categories
3. Generate structured review using template.md
4. Flag security, performance, and correctness issues
5. Suggest improvements with code examples

## Inputs
- File paths, diff, or PR number

## Outputs
- Structured review (see template.md)
```

#### bug-triage/SKILL.md
```markdown
---
description: "Bug triage and prioritization — auto-invoke for bug reports and issue analysis"
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Bug Triage

## Workflow
1. Reproduce or verify the bug report
2. Categorize: crash, data loss, UX, performance, cosmetic
3. Assess severity × frequency = priority score
4. Identify root cause area using heuristics.md
5. Recommend fix approach and effort estimate

## Inputs
- Bug description, error logs, screenshots

## Outputs
- Priority: P0-P4, Category, Root cause area, Fix estimate
```

---

## Phase 5: README.md & CLAUDE.md Comprehensive Update

### 5.1 README.md Structure

Generate or update `README.md` with a comprehensive, nested structure:

```markdown
# {Project Name}

> {One-line description from package.json or auto-detected}

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Claude Code Integration](#claude-code-integration)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Overview
{Auto-generated from docs/context/project-overview.md if exists, else from fingerprint}

### Tech Stack
| Layer | Technology |
|-------|-----------|
{auto_detected_stack_table}

### Repository Structure
```text
{auto_generated_directory_tree_depth_2}
```

## Getting Started

### Prerequisites
{auto_detected_from_engines_field_and_stack}

### Installation
```bash
{detected_install_command}
```

### Development Server
```bash
{detected_dev_command}
```

### Environment Variables
{point_to_env_example_or_list_required_vars}

## Architecture
{Summary from docs/context/architecture.md or auto-detected component list}

See [docs/context/architecture.md](docs/context/architecture.md) for full details.

## Development

### Code Style
{detected_from_eslint_prettier_editorconfig}

### Branch Strategy
{detected_from_git_history_or_conventions}

### Commit Format
```
type(scope): description
```
Types: feat, fix, refactor, test, docs, chore, perf, ci

## Testing
```bash
{detected_test_command}
```
{detected_test_framework_info}

See [docs/context/testing-strategy.md](docs/context/testing-strategy.md) for full strategy.

## Deployment
{summary_from_detected_infra}

See [docs/context/architecture-deployment.md](docs/context/architecture-deployment.md).

## Claude Code Integration

This project is configured for Claude Code with the full 4-layer extension stack:

| Layer | Status | Files |
|-------|--------|-------|
| CLAUDE.md | {status} | `CLAUDE.md` + `.claude/rules/*.md` |
| Skills | {status} | `.claude/skills/*/SKILL.md` |
| Hooks | {status} | `.claude/settings.json` + `.claude/hooks/*.sh` |
| Agents | {status} | `.claude/agents/*.md` |

### Key Commands
- `/cc-setup` — Full repo analysis and initial deployment
- `/cc-sync` — Update configuration after project changes
- `/cc-intel` — Deep code analysis for complex tasks

### Configuration
- Project settings: `.claude/settings.json`
- MCP servers: `.mcp.json`
- Rules: `.claude/rules/`
- Lessons learned: `.claude/rules/lessons-learned.md`

## Documentation

All project documentation lives in `docs/context/`:

| Document | Purpose |
|----------|---------|
| [Project Overview](docs/context/project-overview.md) | What, who, why |
| [Architecture](docs/context/architecture.md) | System design |
| [Data Model](docs/context/data-model.md) | Entities and relationships |
| [API Contracts](docs/context/api-contracts.md) | Endpoints and formats |
| [Security Rules](docs/context/security-rules.md) | Auth and compliance |
| [Testing Strategy](docs/context/testing-strategy.md) | Test approach |
| [ADRs](docs/context/decisions/) | Architecture decisions |
| [Changelog](docs/context/changelog.md) | Change history |

## Contributing
1. Create a feature branch from `main`
2. Follow the commit format above
3. Ensure tests pass: `{detected_test_command}`
4. Open a PR with the template in `.claude/templates/pr-description.md`
```

### 5.2 README Merge Strategy

The README uses **section-aware merging**:

```
FOR each section in template:
  IF section exists in current README:
    → SKIP (preserve user content)
  ELSE:
    → APPEND section at appropriate position
    → Log: "ADDED section: {heading}"
```

User-written sections are never deleted or overwritten.

### 5.3 CLAUDE.md Cross-Reference Update

Update the root `CLAUDE.md` to reference all generated assets:

```markdown
# Project Instructions

## Build & Test
{detected_commands}

## Tech Stack
{detected_stack_summary}

## Key Paths
- Source: {src_dir}
- Tests: {test_dir}
- Docs: docs/context/
- Rules: .claude/rules/
- Skills: .claude/skills/
- Agents: .claude/agents/
- Templates: .claude/templates/

## Reference Documents
Read these files for deep context before making major changes:
- Architecture: `@docs/context/architecture.md`
- Data Model: `@docs/context/data-model.md`
- Security: `@docs/context/security-rules.md`
- API: `@docs/context/api-contracts.md`
- Testing: `@docs/context/testing-strategy.md`
- Glossary: `@docs/context/domain-glossary.md`

## Rules
- Code style: `@.claude/rules/coding.md`
- Testing: `@.claude/rules/testing.md`
- Security: `@.claude/rules/security.md`
- Git: `@.claude/rules/git-workflow.md`
- Infrastructure: `@.claude/rules/infra.md`

## Skills
- Code review: `@.claude/skills/code-review/SKILL.md` (uses checklist.md + template.md)
- Release notes: `@.claude/skills/release-notes/SKILL.md`
- Bug triage: `@.claude/skills/bug-triage/SKILL.md`
- Migration planning: `@.claude/skills/migration-planner/SKILL.md`

## Templates
- PR descriptions: `.claude/templates/pr-description.md`
- Design docs: `.claude/templates/design-doc.md`
- Test plans: `.claude/templates/test-plan.md`
- Incident reports: `.claude/templates/incident-report.md`

## Decision Trees
- Auth/identity tasks → check `{auth_dir}` + `docs/context/security-rules.md`
- Database/migration tasks → check `{db_dir}` + `docs/context/data-model.md`
- Infrastructure tasks → check `{infra_dir}` + `docs/context/architecture-deployment.md`
- API changes → check `{api_dir}` + `docs/context/api-contracts.md`
- Performance concerns → check `docs/context/performance.md`

## Conventions
{detected_conventions}

## Don't Touch
{auto_generated_files}
{vendor_directories}
{lock_files}
```

---

## Phase 6: LSP Auto-Installation

### 6.1 Detection and Install

For each detected language, check if the LSP is installed and install if missing:

```bash
LSP_MATRIX=(
  # "language:lsp_binary:install_command"
  "TypeScript:typescript-language-server:npm i -g typescript-language-server typescript"
  "Python:pyright:npm i -g pyright"
  "Go:gopls:go install golang.org/x/tools/gopls@latest"
  "Rust:rust-analyzer:rustup component add rust-analyzer"
  "Ruby:solargraph:gem install solargraph"
  "PHP:intelephense:npm i -g intelephense"
  "Svelte:svelte-language-server:npm i -g svelte-language-server"
  "Vue:vue-language-server:npm i -g @vue/language-server"
  "Tailwind:tailwindcss-language-server:npm i -g @tailwindcss/language-server"
  "GraphQL:graphql-language-service-cli:npm i -g graphql-language-service-cli"
  "Prisma:prisma-language-server:npm i -g @prisma/language-server"
  "YAML:yaml-language-server:npm i -g yaml-language-server"
  "Dockerfile:dockerfile-language-server:npm i -g dockerfile-language-server-nodejs"
  "Bash:bash-language-server:npm i -g bash-language-server"
  "SQL:sql-language-server:npm i -g sql-language-server"
  "Terraform:terraform-ls:# Install from HashiCorp releases"
  "C#:omnisharp:# Install via VS Code extension or dotnet tool"
  "Elixir:elixir-ls:# Install via Mix"
)

for entry in "${LSP_MATRIX[@]}"; do
  LANG="${entry%%:*}"
  REST="${entry#*:}"
  BINARY="${REST%%:*}"
  INSTALL="${REST#*:}"

  if is_detected "$LANG"; then
    if ! command -v "$BINARY" &>/dev/null; then
      echo "  INSTALLING: $BINARY for $LANG"
      eval "$INSTALL" 2>/dev/null
    else
      echo "  OK: $BINARY already installed"
    fi
  fi
done
```

### 6.2 LSP Report

```
=== LSP Status ===
  TypeScript:  ✓ typescript-language-server (installed)
  Python:      ✓ pyright (installed)
  Bash:        ✗ bash-language-server → installing...  ✓ done
  YAML:        ✗ yaml-language-server → installing...  ✓ done
  Dockerfile:  ✗ dockerfile-language-server → installing...  ✓ done

Installed: 3 new LSPs
Already present: 2
```

---

## Phase 7: .gitignore Hygiene

Ensure `.gitignore` includes Claude Code local files:

```bash
GITIGNORE_ENTRIES=(
  "# Claude Code local files"
  ".claude/settings.local.json"
  ".claude/CLAUDE.local.md"
  ".claude/rules/memory-sessions.md"
)

for entry in "${GITIGNORE_ENTRIES[@]}"; do
  if ! grep -qF "$entry" .gitignore 2>/dev/null; then
    echo "$entry" >> .gitignore
  fi
done
```

---

## Phase 8: Verification & Sync Report

### 8.1 Comprehensive Report

```
╔══════════════════════════════════════════════════════╗
║           Claude Code Sync Report                    ║
╠══════════════════════════════════════════════════════╣

  Fingerprint:      TypeScript · Next.js · Prisma · Docker · PostgreSQL
  Previous sync:    2026-03-15 (4 days ago)
  Changes detected: +Redis, -Knex

  ┌─── Root Project ───────────────────────────────────┐
  │ CLAUDE.md          ✓ Updated (3 new references)     │
  │ README.md          ✓ Updated (added 2 sections)     │
  │ .claude/rules/     ✓ 10/10 files present            │
  │ .claude/skills/    ✓ 4 skills (1 new: redis-ops)    │
  │ .claude/agents/    ✓ 4 agents present               │
  │ .claude/hooks/     ✓ 6 hooks configured             │
  │ .claude/templates/ ✓ 4 templates present            │
  │ docs/context/      ✓ 15/22 files populated          │
  │ LSPs               ✓ 5 installed (2 new)            │
  │ MCP Servers        ✓ 3 configured                   │
  └────────────────────────────────────────────────────┘

  ┌─── Sub-Repositories ───────────────────────────────┐
  │ packages/api/      ✓ .claude/ synced                │
  │ packages/web/      ✓ .claude/ created (new)         │
  │ packages/shared/   ✓ no changes needed              │
  └────────────────────────────────────────────────────┘

  ┌─── Recommendations ────────────────────────────────┐
  │ ⚠ docs/context/architecture.md is empty — fill in  │
  │ ⚠ docs/context/data-model.md is empty — fill in    │
  │ ⚠ 3 ADRs recommended for key decisions             │
  │ ℹ Consider adding Redis MCP server to .mcp.json    │
  └────────────────────────────────────────────────────┘

  Score: 82/100 → Advanced Setup
  Previous: 74/100 (+8 improvement)
╚══════════════════════════════════════════════════════╝
```

### 8.2 Scoring Rubric

| Category | Weight | Criteria |
|----------|--------|----------|
| CLAUDE.md quality | 15 | Cross-references, routing, under 150 lines |
| README.md completeness | 10 | All sections populated with real content |
| .claude/rules/ coverage | 15 | Files for each detected concern area |
| .claude/skills/ relevance | 10 | Stack-matched skills present |
| .claude/agents/ coverage | 10 | Personas for key project areas |
| .claude/hooks/ events | 10 | Security + format + error capture minimum |
| .claude/templates/ | 5 | PR, design doc, test plan present |
| docs/context/ coverage | 10 | Populated docs for architecture, data, API |
| Sub-repo propagation | 5 | All sub-repos have .claude/ |
| LSP installation | 5 | All detected languages have LSPs |
| MCP servers | 5 | Appropriate servers configured |

---

## Phase 9: Sync State Persistence

Save the sync state for future runs:

```json
// .claude/sync-state.json
{
  "version": "6.1.0",
  "lastSync": "2026-03-19T12:00:00Z",
  "syncCount": 4,
  "fingerprint": {
    "languages": ["TypeScript", "Python"],
    "frameworks": ["Next.js"],
    "infrastructure": ["Docker", "GitHub Actions"],
    "databases": ["PostgreSQL", "Redis"],
    "services": ["Prisma", "Stripe"],
    "testFrameworks": ["Vitest", "Playwright"],
    "packageManager": "pnpm",
    "monorepo": "pnpm workspaces",
    "scale": "medium"
  },
  "generated": {
    "rules": ["coding.md", "testing.md", "security.md", "git-workflow.md"],
    "skills": ["code-review", "release-notes", "bug-triage"],
    "agents": ["backend-architect", "frontend-specialist"],
    "templates": ["pr-description.md", "design-doc.md", "test-plan.md"],
    "docs": ["project-overview.md", "architecture.md", "data-model.md"],
    "hooks": ["security-guard.sh", "auto-format.sh", "lessons-learned-capture.sh"],
    "lsps": ["typescript-language-server", "pyright", "bash-language-server"]
  },
  "subRepos": [
    { "path": "packages/api", "hasClaudeDir": true, "lastSync": "2026-03-19T12:00:00Z" },
    { "path": "packages/web", "hasClaudeDir": true, "lastSync": "2026-03-19T12:00:00Z" }
  ],
  "score": {
    "current": 82,
    "previous": 74,
    "history": [45, 62, 74, 82]
  }
}
```

---

## Implementation Flow

When `/cc-sync` is invoked:

1. **Re-fingerprint** — Scan repo, compute delta from last sync (Phase 1)
2. **Discover sub-repos** — Find nested git repos, assess their .claude/ status (Phase 2)
3. **Scaffold docs/context/** — Create missing documentation templates (Phase 3)
4. **Enrich .claude/** — Fill gaps in rules, skills, agents, templates (Phase 4)
5. **Update README.md** — Section-aware merge of comprehensive structure (Phase 5)
6. **Update CLAUDE.md** — Add cross-references to new assets (Phase 5)
7. **Propagate to sub-repos** — Copy/merge configuration into sub-repos (Phase 2)
8. **Install LSPs** — Detect and install missing language servers (Phase 6)
9. **Update .gitignore** — Ensure local files are excluded (Phase 7)
10. **Verify & report** — Score everything, show delta from last sync (Phase 8)
11. **Persist state** — Save sync-state.json for future runs (Phase 9)

---

## Flags

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview all changes without writing any files |
| `--docs-only` | Only sync `docs/context/` structure |
| `--subrepos-only` | Only propagate `.claude/` to sub-repositories |
| `--readme-only` | Only update README.md and CLAUDE.md |
| `--lsp-only` | Only detect and install LSPs |
| `--rules-only` | Only sync `.claude/rules/` files |
| `--skills-only` | Only sync `.claude/skills/` |
| `--agents-only` | Only sync `.claude/agents/` |
| `--templates-only` | Only sync `.claude/templates/` |
| `--force` | Overwrite existing files (creates .bak backups) |
| `--depth N` | Sub-repo scan depth (default: 2) |
| `--verbose` | Show detailed diff of each change |
| `--no-lsp` | Skip LSP installation |
| `--no-subrepos` | Skip sub-repo discovery |
| `--no-docs` | Skip docs/context/ scaffolding |
| `--score-only` | Only run scoring, don't modify anything |

---

## Safety Guarantees

1. **Never overwrites user content** (unless `--force` with `.bak` backup)
2. **Section-aware merging** for README.md and CLAUDE.md
3. **Idempotent** — running twice produces no extra changes
4. **Delta-aware** — only touches what changed since last sync
5. **Audit trail** — sync-state.json records every run
6. **Dry-run first** — always available to preview before committing
