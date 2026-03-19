---
name: cc-deploy
intent: Idempotent re-deployment and refresh of Claude Code project configuration, docs scaffolding, sub-repo propagation, and LSP installation
tags:
  - claude-code-expert
  - command
  - deployment
  - refresh
  - docs
  - lsp
  - monorepo
arguments:
  - name: target
    description: What to deploy — "all", "docs", "lsp", "sub-repos", or a specific path
    required: false
    type: string
    default: all
flags:
  - name: update
    description: Refresh existing generated files in place instead of only filling gaps
    type: boolean
    default: false
  - name: dry-run
    description: Preview actions, diffs, and scores without writing files
    type: boolean
    default: false
  - name: sub-repos
    description: Scan for nested Git repositories and propagate Claude Code config to them
    type: boolean
    default: false
  - name: docs-only
    description: Only scaffold or refresh docs/context and .claude/templates assets
    type: boolean
    default: false
  - name: lsp-only
    description: Only detect and install recommended language servers
    type: boolean
    default: false
  - name: force
    description: Overwrite existing generated files that would normally be skipped
    type: boolean
    default: false
  - name: verify
    description: Run verification and scoring after deployment
    type: boolean
    default: false
  - name: auto
    description: Non-interactive mode; skip install prompts and apply best-guess defaults
    type: boolean
    default: false
---

# /cc-deploy — Idempotent Claude Code Re-Deployment & Enrichment

Refresh and enrich an existing Claude Code setup without starting from scratch. `/cc-deploy`
complements `/cc-setup`: it re-runs project fingerprinting, detects sub-repos, scaffolds rich
context docs, installs missing LSPs, refreshes templates/skills/agents/hooks, and verifies the
resulting deployment.

Use it after plugin upgrades, repo topology changes, new services/frameworks landing in the codebase,
or any time Claude Code config has drifted from the current project state.

## Usage

```bash
/cc-deploy                              # Full interactive refresh of current project
/cc-deploy --update                     # Refresh existing generated files in place
/cc-deploy --dry-run                    # Preview actions without writing
/cc-deploy --sub-repos                  # Detect nested repos and propagate config
/cc-deploy --docs-only                  # Only scaffold docs/context + templates
/cc-deploy --lsp-only                   # Only detect/install language servers
/cc-deploy --force                      # Overwrite generated files even if present
/cc-deploy --verify                     # Run diagnostics and score deployment
/cc-deploy --auto                       # Non-interactive, best-guess deployment
/cc-deploy docs                         # Treat docs as the deployment target
/cc-deploy sub-repos --force --verify   # Re-propagate all nested repos, then audit
```

---

## Positioning Relative to Existing Commands

| Command | Best for | What `/cc-deploy` adds |
|---------|----------|------------------------|
| `/cc-setup` | First-time 4-layer setup | Re-runnable refresh path, sub-repo propagation, docs scaffold, LSP install |
| `/cc-debug` | Deep troubleshooting after failure | Post-deploy verification checklist and pass/warn/skip report |
| `/cc-memory` | Long-lived context architecture | `docs/context/` tree that complements split memory tiers |
| `/cc-config` | Config generation/audit | Idempotent update workflow using the same config conventions |
| `/cc-migrate` | Legacy format upgrades | After migration, rebuild generated assets to current project fingerprint |

### Idempotency Rules

`/cc-deploy` should be safe to run repeatedly.

- Never duplicate generated sections or append the same boilerplate twice.
- Prefer diff-aware updates over blind rewrites.
- Skip existing files by default unless `--update` or `--force` is used.
- Preserve human-authored content where possible via markers, merge blocks, or section replacement.
- Treat `--dry-run` as fully read-only.
- Treat `--docs-only` and `--lsp-only` as narrow execution modes that bypass unrelated phases.

---

## Phase 1: Fingerprint & Drift Audit

Reuse `/cc-setup` detection maps as the authoritative baseline:
`DETECT_MAP`, `FRAMEWORK_MAP`, `INFRA_MAP`, `SERVICE_MAP`, `TEST_MAP`, `PM_MAP`,
and `MONOREPO_MAP`.

### 1.1 Core Fingerprint

Run the same detection passes as `/cc-setup`, then extend the fingerprint with deployment-specific
state:

```bash
FINGERPRINT_FIELDS=(
  "languages"
  "frameworks"
  "infrastructure"
  "services"
  "test_frameworks"
  "package_managers"
  "monorepo_signals"
  "project_scale"
  "sub_repos"
  "existing_claude_state"
  "deployment_drift"
)
```

### 1.2 Sub-Repo Scan

Scan for nested `.git/` directories at depth 1–2 while ignoring noisy directories.

```bash
find . \
  -path './node_modules' -prune -o \
  -path './vendor' -prune -o \
  -path './.git' -prune -o \
  -type d -name .git -mindepth 2 -maxdepth 4 -print
```

Normalize the result to repo roots and classify each entry:

- **workspace package** — nested package that deserves its own `.claude/`
- **vendored repo** — skip by default
- **generated checkout** — skip by default
- **tooling sandbox** — optional, include only with `--force`

### 1.3 Project Scale Assessment

Determine deployment shape from scale:

| Scale | Heuristic | Deployment behavior |
|-------|-----------|---------------------|
| Small | <10k LOC and <50 top-level source files | Minimal rules, lean docs, no LSP prompting flood |
| Medium | 10k–100k LOC | Standard docs scaffold and stack-specific assets |
| Large | 100k+ LOC | Split CLAUDE routing, stronger docs generation, verify by default |
| Monorepo | Workspace markers or multiple packages/repos | Parent + sub-repo propagation, cross-links, per-area skills |

### 1.4 Existing `.claude/` Audit

Measure what is already present versus missing:

```bash
AUDIT_TARGETS=(
  "CLAUDE.md"
  ".claude/settings.json"
  ".claude/rules/"
  ".claude/skills/"
  ".claude/agents/"
  ".claude/hooks/"
  ".claude/templates/"
  "docs/context/"
  ".mcp.json"
)
```

For each target, classify as:

- `configured` — present and appears current
- `partial` — present but missing stack-specific content
- `stale` — generated from an older plugin or project fingerprint
- `missing` — absent

### 1.5 Diff Summary: “What Changed Since Last Deploy”

Produce a summary before writing anything.

Example output:

```text
=== Deploy Drift Summary ===
[NEW] Framework detected: FastAPI
[NEW] Service detected: PostgreSQL
[CHANGED] Project scale: medium -> monorepo
[MISSING] docs/context/api-contracts.md
[STALE] .claude/templates/pr.md references old review checklist
[SUB-REPO] packages/admin detected with no .claude/ config
```

If a prior deployment manifest exists, compare against it. Recommended state file:

```text
.claude/deploy-manifest.json
```

Suggested fields:

- plugin version
- timestamp
- fingerprint hash
- generated files
- skipped files
- sub-repo records
- installed LSPs
- verification score

---

## Phase 2: Sub-Repo Detection & Propagation

This phase activates when either of these is true:

- `--sub-repos` is passed
- the fingerprint classifies the project as a monorepo

### 2.1 Scan Rules

Search for nested repo roots with these guardrails:

```bash
EXCLUDE_DIRS=(node_modules vendor .git dist build coverage .next .turbo)
SEARCH_DEPTH_ROOTS="1-2"
```

Rules:

- Ignore the current repo root.
- Ignore hidden tool caches unless explicitly targeted.
- Collapse `.git` paths to their parent directories.
- De-duplicate paths when worktrees or submodules point to the same location.

### 2.2 Per-Sub-Repo Fingerprint

For each discovered sub-repo, re-run the fingerprint on the sub-repo root only.

Collect:

- primary languages/frameworks
- package manager
- test framework
- deployment target hints
- whether a local `.claude/` already exists

### 2.3 Sub-Repo Assets to Generate

For each eligible sub-repo, create:

```text
{subrepo}/CLAUDE.md
{subrepo}/.claude/settings.json
{subrepo}/.claude/rules/code-style.md
{subrepo}/.claude/rules/testing.md
{subrepo}/.claude/rules/git-workflow.md
```

Root-to-child propagation rules:

- inherit top-level contribution and safety conventions
- tailor build/test commands to the sub-repo stack
- include a cross-reference back to the parent repo CLAUDE routing file
- keep sub-repo CLAUDE.md concise and routing-oriented

Example cross-reference block:

```markdown
> Parent project context: see `../CLAUDE.md` (or repo-root `CLAUDE.md`) for shared workflow,
> architectural constraints, and organization-wide Claude Code policies.
```

### 2.4 Skip / Update / Force Logic

| Condition | Default action | With `--update` | With `--force` |
|-----------|----------------|-----------------|----------------|
| No `.claude/` exists | Create | Create | Create |
| `.claude/` exists, no managed markers | Skip | Patch selective sections | Overwrite generated assets |
| `.claude/` exists, managed markers present | Skip unchanged files | Refresh managed blocks | Rewrite all generated files |

### 2.5 Sub-Repo Output Table

Always report a compact table:

```text
| Sub-repo path     | Detected stack         | Existing .claude | Action   |
|-------------------|------------------------|------------------|----------|
| packages/web      | Next.js + pnpm + Jest  | no               | CREATED  |
| services/api      | FastAPI + Pytest       | yes              | UPDATED  |
| tools/migrations  | Go + go test           | yes              | SKIPPED  |
```

---

## Phase 3: Docs Scaffolding

Generate a rich `docs/context/` tree that can be safely refreshed over time.

### 3.1 Docs Tree

```text
docs/context/
├── project-overview.md
├── architecture.md
├── architecture-runtime.md
├── architecture-deployment.md
├── domain-glossary.md
├── api-contracts.md
├── api-guidelines.md
├── data-model.md
├── data-migrations.md
├── testing-strategy.md
├── test-inventory.md
├── security-rules.md
├── compliance.md
├── ops-and-runbooks.md
├── performance.md
├── constraints.md
├── personas-and-use-cases.md
├── ux-flows.md
├── ux-principles.md
├── vision-and-roadmap.md
├── changelog.md
├── plan.md
└── decisions/
    └── adr-template.md
```

### 3.2 Auto-Populated Files

These files should be seeded from the fingerprint rather than left blank:

| File | Auto-populated content |
|------|------------------------|
| `project-overview.md` | Project type, language/framework summary, package manager, key services |
| `architecture.md` | High-level component map from detected top-level directories |
| `api-contracts.md` | OpenAPI/Swagger summary if `openapi.*`, `swagger.*`, or spec directories are found |
| `testing-strategy.md` | Test framework map and recommended command matrix from `TEST_MAP` |
| `security-rules.md` | Auth, secret handling, infra, and permission expectations inferred from services/infra |
| `ops-and-runbooks.md` | Deployment/runtime hints from Docker/Kubernetes/Terraform/CI detection |

### 3.3 Template-Driven Files

The rest should use opinionated scaffolds with explicit placeholders and author guidance.

Example placeholder style:

```markdown
## TODO: Fill in domain language
- Add canonical business terms.
- Link to code owners or directories that implement each concept.
- Record synonyms that new contributors are likely to search for.
```

### 3.4 `.claude/templates/` Assets

Generate reusable authoring templates:

```text
.claude/templates/
├── pr.md
├── design-doc.md
├── test-plan.md
└── incident-report.md
```

Suggested contents:

- **PR template** — summary, risk, validation, rollout notes
- **design-doc** — problem, options, trade-offs, rollout plan
- **test-plan** — scope, environments, cases, tooling, exit criteria
- **incident-report** — impact, timeline, root cause, remediation, follow-up

### 3.5 File Creation Rules

- Skip existing files by default.
- Update only managed sections with `--update`.
- Overwrite entire generated files with `--force`.
- If `--docs-only` is set, execute this phase plus verification/reporting only.

### 3.6 Recommended Managed Markers

Use durable markers for repeatable updates:

```markdown
<!-- BEGIN GENERATED: cc-deploy project-overview -->
...
<!-- END GENERATED: cc-deploy project-overview -->
```

This makes `--update` safe while preserving handwritten notes outside the block.

---

## Phase 4: CLAUDE.md & README Generation

### 4.1 Root `CLAUDE.md` as Routing OS

Generate or refresh a concise routing file under 150 lines.

Required sections:

1. **Project summary** — stack + scale derived from the fingerprint
2. **Build/test commands** — most likely commands for current package manager and languages
3. **Where to read next** — pointers to `.claude/rules/`, `docs/context/`, `.claude/skills/`
4. **Decision trees** — if task is feature work, debugging, docs, infra, tests, etc.
5. **Read-when triggers** — when to open architecture docs, ADRs, security rules, or sub-repo CLAUDE files

Suggested structure:

```markdown
# Claude Operating Guide

## Project Snapshot
...

## Fast Paths
- Feature work -> read `docs/context/project-overview.md`
- Debugging -> read `.claude/rules/testing.md` and `docs/context/ops-and-runbooks.md`
- API changes -> read `docs/context/api-contracts.md`

## Commands
...
```

### 4.2 README Refresh

Generate or update the main `README.md` with:

- project overview from the fingerprint
- setup instructions appropriate to detected stack
- architecture section linking to `docs/context/architecture.md`
- contributing section referencing Claude Code setup (`CLAUDE.md`, `.claude/`, docs/context)

Update strategy:

- patch existing sections when headings match
- create new sections only if missing
- preserve badges, screenshots, and bespoke business copy

### 4.3 Command Discovery Links

If this plugin repo exposes command docs, add `/cc-deploy` alongside `/cc-setup`, `/cc-memory`,
`/cc-config`, and `/cc-debug` in relevant summary tables and quick-start lists.

---

## Phase 5: LSP Detection & Installation

This phase activates in full deploy mode or `--lsp-only` mode.

### 5.1 Language → LSP Mapping

| Detected language | Preferred LSP |
|-------------------|---------------|
| TypeScript / JavaScript | `typescript-language-server` |
| Python | `pyright` or `pylsp` |
| Go | `gopls` |
| Rust | `rust-analyzer` |
| Java | `jdtls` |
| C# / .NET | `omnisharp` |
| Ruby | `solargraph` |
| PHP | `phpactor` or `intelephense` |
| Elixir | `elixir-ls` |
| Swift | `sourcekit-lsp` |

### 5.2 Detection

Check whether each recommended binary is already present.

```bash
command -v typescript-language-server
command -v pyright
command -v gopls
command -v rust-analyzer
```

### 5.3 Install Strategy

Use ecosystem-native installers where practical:

| LSP | Typical install path |
|-----|----------------------|
| `typescript-language-server` | `npm i -g typescript typescript-language-server` |
| `pyright` | `npm i -g pyright` |
| `pylsp` | `pip install python-lsp-server` |
| `gopls` | `go install golang.org/x/tools/gopls@latest` |
| `rust-analyzer` | system package / rustup channel tooling |
| `solargraph` | `gem install solargraph` |

Behavior:

- Prompt before installation when running interactively.
- Skip prompts with `--auto` and install best-guess defaults.
- In `--dry-run`, show exact install commands without executing them.
- If multiple valid LSPs exist (for example `pyright` vs `pylsp`), prefer the one that best fits the existing toolchain.

### 5.4 Install Report

Example:

```text
[LSP] TypeScript -> typescript-language-server: already installed
[LSP] Python -> pyright: missing, installed via npm
[LSP] Go -> gopls: missing, skipped (Go toolchain not available)
```

---

## Phase 6: Enrichment — Skills, Agents, Hooks

After core config and docs are refreshed, generate stack-aware enrichments.

### 6.1 Skills

Create project-tailored skills under `.claude/skills/`:

```text
.claude/skills/
├── code-review/
│   └── SKILL.md
├── release-notes/
│   └── SKILL.md
├── migration-planner/
│   └── SKILL.md   # if DB / schema tooling detected
└── bug-triage/
    └── SKILL.md
```

Tailoring rules:

- **code-review** — checklist derived from stack, testing, linting, and deployment footprint
- **release-notes** — categories and examples aligned with repo type
- **migration-planner** — only create when DB, ORM, or migration tooling is detected
- **bug-triage** — heuristics for reproducing issues in the detected runtime/test ecosystem

### 6.2 Agents

Generate specialist agent briefs under `.claude/agents/`.

Examples:

- `backend-architect.md` for API/service-heavy repos
- `frontend-architect.md` for SPA/Next.js/UI-heavy repos
- `qa-analyst.md` based on the detected test framework
- `platform-ops.md` when infra tooling is present

### 6.3 Hooks

Generate hooks tailored to the repo’s formatter/linter choices:

```text
.claude/hooks/post-edit/auto-format.sh
.claude/hooks/pre-commit/lint-check.sh
```

Hook selection rules:

- If Prettier/Biome/ESLint is detected, wire the matching formatter/linter command.
- If Ruff/Black/Pytest is detected, tailor Python hook commands.
- If Go/Rust tools are detected, use `gofmt`, `go test`, `cargo fmt`, `cargo clippy`, etc.

### 6.4 Settings Integration

Ensure `.claude/settings.json` references generated hooks and assigns practical permissions for:

- common build/test/package manager commands
- repo-local formatters/linters
- safe docs generation workflows
- optional deny rules for destructive shell patterns

---

## Phase 7: Verification & Report

This phase runs when `--verify` is set and is recommended automatically after full deploys.

### 7.1 Verification Style

Reuse `/cc-debug` diagnostic patterns for consistency.

Report each phase as one of:

- `[PASS]` completed successfully
- `[WARN]` partially configured or blocked by environment/tooling
- `[SKIP]` intentionally not run because flags or project shape made it irrelevant
- `[FAIL]` attempted but did not complete

### 7.2 Scoring Model (0–100)

| Area | Points |
|------|--------|
| CLAUDE.md completeness | 20 |
| Rules coverage | 15 |
| Skills deployed | 15 |
| Hooks configured | 15 |
| Agents created | 10 |
| Docs scaffolded | 10 |
| LSPs installed | 10 |
| Sub-repos configured | 5 |

Example:

```text
=== /cc-deploy Verification ===
[PASS] Fingerprint and drift audit
[PASS] Root CLAUDE.md refreshed
[PASS] Docs scaffolded: 24 files created, 3 updated
[WARN] LSP install: gopls skipped (Go missing)
[PASS] Skills/agents/hooks enriched
[SKIP] Sub-repo propagation (no nested repos found)

Deployment Score: 86/100
```

### 7.3 Diff Summary

Always finish with a file action summary:

```text
Created: 18 files
Updated: 6 files
Skipped: 12 files
Unchanged: 21 files
```

Break it down by category when possible:

- config
- docs
- templates
- skills
- agents
- hooks
- sub-repo assets

### 7.4 Suggested Next Steps

Recommend the most relevant follow-up actions, for example:

- run `/cc-debug --report` for a deep validation pass
- run `/cc-memory --init` if long-lived context files are still missing
- review generated docs placeholders with domain owners
- commit generated files after confirming install/output changes

---

## Execution Flow

When `/cc-deploy` is invoked:

1. Parse mode flags (`--docs-only`, `--lsp-only`, `--sub-repos`, `--update`, `--force`, `--verify`, `--auto`, `--dry-run`)
2. Run the Phase 1 fingerprint and drift audit
3. If not `--lsp-only`, refresh root config/docs/templates and optional sub-repo assets
4. If not `--docs-only`, run LSP detection/installation as applicable
5. Generate enrichment assets (skills, agents, hooks) unless mode flags narrow the scope
6. Save/update `.claude/deploy-manifest.json`
7. If `--verify`, execute the verification report and deployment scoring
8. Print a concise summary table plus next steps

### Recommended Flag Semantics

```text
--docs-only  -> run phases 1, 3, 4, 7
--lsp-only   -> run phases 1, 5, 7
--sub-repos  -> ensure phase 2 runs even if monorepo signals are weak
--update     -> refresh managed blocks in existing generated files
--force      -> overwrite generated files fully
--auto       -> skip confirmation prompts and install defaults
--dry-run    -> no writes, no installs, report intended actions only
```

---

## Example Output

```text
=== /cc-deploy ===
Mode: full refresh (--update --verify)
Project: monorepo | TypeScript, Python | Next.js, FastAPI | pnpm

Phase 1 — Fingerprint
  [PASS] Stack re-detected from repo
  [PASS] Drift summary generated (7 changes)

Phase 2 — Sub-repos
  [PASS] 2 nested repos detected
  [PASS] 1 sub-repo configured, 1 updated

Phase 3 — Docs
  [PASS] docs/context scaffold present
  [PASS] 6 docs created, 4 refreshed

Phase 4 — Root files
  [PASS] CLAUDE.md refreshed
  [PASS] README.md updated with architecture and contributing links

Phase 5 — LSPs
  [PASS] typescript-language-server already installed
  [WARN] pyright missing; install queued

Phase 6 — Enrichment
  [PASS] 4 skills, 3 agents, 2 hooks generated

Phase 7 — Verification
  [PASS] Deployment score: 91/100

Summary: created 14, updated 9, skipped 11
Next: review docs/context placeholders and run /cc-debug --report
```

---

## Design Notes

- Favor reference-by-detection over hard-coded stack assumptions.
- Keep root `CLAUDE.md` short; push detail into rules and `docs/context/`.
- Sub-repo propagation should feel additive, not invasive.
- Docs scaffolding should accelerate onboarding without pretending to know business details.
- LSP installation must be explicit, reversible, and environment-aware.
- Verification should make repeated deploys measurable over time.
