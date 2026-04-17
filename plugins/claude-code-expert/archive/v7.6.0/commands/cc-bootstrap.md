# /cc-bootstrap — Repo Scanner & .claude/ Architecture Generator

Scan an existing repository, detect its full tech stack, and generate a deployable
`.claude/` architecture: CLAUDE.md, rules, agents, skills, settings.json, .mcp.json,
and docs/context starter files. Zero manual configuration required.

## Usage

```bash
/cc-bootstrap                        # Full scan + generate in current repo
/cc-bootstrap --dry-run              # Show what would be generated without writing
/cc-bootstrap --target <path>        # Run against a different directory
/cc-bootstrap --skip rules           # Skip generating rules files
/cc-bootstrap --skip agents          # Skip generating agent stubs
/cc-bootstrap --skip mcp             # Skip MCP server detection
/cc-bootstrap --only claudemd        # Generate only CLAUDE.md
/cc-bootstrap --force                # Overwrite existing files (default: skip existing)
/cc-bootstrap --audit                # Score an existing .claude/ setup and suggest improvements
```

---

## Phase 1: Repo Scan

Run all detection in parallel. Build a fingerprint:

### Language Detection
Scan root for: `package.json`, `tsconfig.json`, `requirements.txt`, `pyproject.toml`,
`go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Gemfile`, `composer.json`,
`*.csproj`, `mix.exs`, `deno.json`

### Framework Detection
Scan for: `next.config.*`, `vite.config.*`, `nuxt.config.*`, `angular.json`,
`svelte.config.*`, `remix.config.*`, `astro.config.*`, `nest-cli.json`,
`manage.py`, `app.py`, `main.py+fastapi`, `config/routes.rb`, `expo-env.d.ts`,
`tauri.conf.json`, `electron-builder.*`

### Infrastructure Detection
Scan for: `Dockerfile`, `docker-compose*`, `kubernetes/`, `helm/`, `terraform/`,
`pulumi/`, `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `.circleci/`,
`serverless.yml`, `cdk.json`, `*.bicep`, `fly.toml`, `vercel.json`, `netlify.toml`,
`wrangler.toml`, `.harness/`

### Service Detection
Scan `.env*` files and `package.json` deps for: postgres, mysql, mongodb, redis,
supabase, firebase, stripe, sentry, slack, openai, anthropic, auth0, keycloak,
twilio, sendgrid, linear, notion, prisma, drizzle

### Test Framework Detection
Scan for: `jest.config*`, `vitest.config*`, `cypress.config*`, `playwright.config*`,
`pytest.ini`, `conftest.py`, `.mocharc*`, `karma.conf*`, `*.test.go`, `*_test.rs`

### Monorepo Detection
Scan for: `lerna.json`, `nx.json`, `turbo.json`, `rush.json`, `pnpm-workspace.yaml`

### Scale Assessment
Count source files to determine: small (<10k LOC), medium (10k-100k), large (100k+)

---

## Phase 2: Generate CLAUDE.md

Generate a **routing file** (≤ 150 lines) — not a knowledge dump.

```markdown
# Project Instructions

## Build & Test
- Install: `{detected_install_cmd}`
- Build: `{detected_build_cmd}`
- Test: `{detected_test_cmd}`
- Lint: `{detected_lint_cmd}`
- Type check: `{detected_typecheck_cmd}`

## Tech Stack
{detected_stack_summary_table}

## Key Paths
- Source: {src_dir}
- Tests: {test_dir}
- Config: {config_files_list}

## Architecture
{one_paragraph_summary_from_readme_or_inference}

## Decision Trees
{domain_routing_based_on_detected_dirs}

## Conventions
{extracted_from_eslint_prettier_editorconfig_pyproject}

## Don't Touch
- node_modules/, dist/, build/, coverage/
- {lock_file}
- {auto_generated_dirs}
```

**Per-directory CLAUDE.md** (large codebases and monorepos only):
For each major subdirectory with >50 files, generate a sub-CLAUDE.md covering:
- What this directory is responsible for
- Key files and their roles
- Local conventions

---

## Phase 3: Generate .claude/rules/

Generate only rules relevant to the detected stack:

| File | When Generated | Content |
|------|---------------|---------|
| `architecture.md` | Always | Plugin structure, MCP config, registry paths |
| `code-style.md` | Always | Language conventions from linter config |
| `git-workflow.md` | Always | Commit format, no-force-push, branch strategy |
| `testing.md` | Test framework detected | Test conventions, coverage targets, TDD guide |
| `security.md` | Auth/payment/credentials detected | Credential handling, OWASP rules |
| `infra.md` | Docker/K8s/CI detected | Image tagging, Helm, GitHub Actions conventions |
| `self-healing.md` | Always | Error capture → lessons-learned protocol |
| `lessons-learned.md` | Always | Empty starter (auto-populated by hook) |
| `memory-profile.md` | Always | Project identity, tech stack, owner |
| `memory-preferences.md` | Always | Workflow preferences, model routing |
| `memory-decisions.md` | Always | Empty ADR starter |
| `memory-patterns.md` | Always | Detected code patterns |

---

## Phase 4: Generate .claude/agents/

Generate agent stubs for detected domains. Each agent gets:
- YAML frontmatter (name, description, model, allowed-tools)
- Role definition
- Activation conditions
- Output format

| Detected Signal | Agent | Model |
|----------------|-------|-------|
| Any project | `code-reviewer` | opus |
| Any project | `test-writer` | sonnet |
| API routes detected | `api-designer` | opus |
| Docker/K8s | `infra-reviewer` | sonnet |
| Auth detected | `security-auditor` | opus |
| Frontend | `ui-reviewer` | sonnet |
| Large codebase | `architecture-advisor` | opus |
| Database | `db-specialist` | sonnet |

---

## Phase 5: Generate settings.json with Hooks

Generate `.claude/settings.json` with the full hook stack for the detected stack:

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "bash .claude/hooks/security-guard.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "bash .claude/hooks/auto-format.sh" }] }
    ],
    "PostToolUseFailure": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "bash .claude/hooks/lessons-learned-capture.sh" }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "bash .claude/hooks/on-stop.sh" }] }
    ],
    "UserPromptSubmit": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "bash .claude/hooks/inject-context.sh" }] }
    ],
    "SessionStart": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "bash .claude/hooks/session-init.sh" }] }
    ]
  }
}
```

Stack-specific additions:
- TypeScript detected → add `auto-typecheck.sh` on PostToolUse matching `*.ts`
- ESLint detected → add `auto-lint.sh` on PostToolUse matching `*.ts|*.js`
- Docker detected → add `no-latest-tag.sh` on PreToolUse matching Bash

Also generate all hook scripts in `.claude/hooks/` — see `hook-script-library` skill
for the full security-hardened implementations.

---

## Phase 6: Generate .mcp.json

Detect and configure MCP servers based on project signals:

| Signal | MCP Server | Config |
|--------|-----------|--------|
| Always | `code-quality-gate` (custom) | Lint, typecheck, security scan |
| Always | `deploy-intelligence` (custom) | Build log, image history, k8s images |
| Always | `lessons-learned` (custom) | Capture and search errors |
| Always | `project-metrics` (custom) | DORA, git stats, hotspots |
| Always | `workflow-bridge` (custom) | Pipeline status, rollback plans |
| API key in env | `perplexity` | Web research |
| API key in env | `firecrawl` | Web scraping |
| Always | `context7` | Library documentation |
| Postgres detected | `postgres` MCP | Database queries |
| GitHub token | `github` MCP | PR and issue management |

**Note:** External MCP servers (perplexity, firecrawl, context7) require API keys in
environment variables. Bootstrap generates the `.mcp.json` structure but leaves keys
as `${ENV_VAR_NAME}` placeholders.

---

## Phase 7: Generate docs/context/ Starters

Generate placeholder context docs for teams to fill in:

```
docs/context/
├── architecture.md          # Starter: fill in deployment, data flow, components
├── data-model.md            # Starter: fill in entities, relationships, migrations
├── api-contracts.md         # Starter: fill in endpoints, auth, error formats
├── testing-strategy.md      # Pre-filled based on detected test framework
├── security-rules.md        # Pre-filled based on detected auth/payment signals
├── domain-glossary.md       # Empty starter
└── decisions/
    └── adr-template.md      # ADR template
```

---

## Phase 8: Audit Mode

When run with `--audit`, score an existing `.claude/` setup:

### Scoring Rubric (0-100)

| Layer | Max Points | Check |
|-------|-----------|-------|
| CLAUDE.md | 20 | Exists, ≤ 150 lines, has build commands, has architecture note |
| Rules | 20 | Has code-style, git-workflow, testing, self-healing, lessons-learned |
| Agents | 15 | Has ≥ 2 agents matching detected domains |
| Skills | 15 | Has relevant skills for detected stack |
| Hooks | 15 | Has security-guard, auto-format, lessons-learned-capture registered |
| MCP | 10 | Has ≥ 1 MCP server configured |
| Docs | 5 | Has docs/context/ with ≥ 3 files |

### Output Format

```
=== .claude/ Audit Report ===

Score: 73/100 (Good)

Layer Results:
  CLAUDE.md       [20/20] ✓ Well-structured, 98 lines
  Rules           [14/20] ✗ Missing: testing.md, lessons-learned.md
  Agents          [15/15] ✓ 4 agents detected
  Skills          [10/15] ✗ Missing skills for detected TypeScript/Next.js stack
  Hooks           [ 8/15] ✗ Missing: lessons-learned-capture, inject-context
  MCP             [10/10] ✓ 3 servers configured
  Docs            [ 0/ 5] ✗ docs/context/ not found

Top Recommendations:
  1. Add .claude/rules/testing.md for Vitest test conventions
  2. Add .claude/rules/lessons-learned.md (empty starter)
  3. Register PostToolUseFailure hook: lessons-learned-capture.sh
  4. Register UserPromptSubmit hook: inject-context.sh
  5. Create docs/context/ directory with starter files

Run /cc-bootstrap --force to auto-generate missing pieces.
```

---

## Implementation Steps

When `/cc-bootstrap` is invoked:

1. **Scan** — Run all detectors in parallel (read-only, never write during scan)
2. **Plan** — Build the generation plan, list files to create
3. **Confirm** — Show the plan to the user, ask for approval (unless `--auto` flag)
4. **Generate** — Write files in this order: CLAUDE.md → rules → settings.json → hooks → .mcp.json → agents → docs/context
5. **Report** — Show a summary of what was created, with next steps

### Next Steps After Bootstrap

```
Bootstrap complete. Next steps:
1. Review CLAUDE.md and fill in the architecture paragraph
2. Fill in docs/context/architecture.md with your deployment topology
3. Add API keys to your environment for MCP servers (see .mcp.json comments)
4. Run /cc-setup --audit to verify the setup scores 80+
5. Commit the .claude/ directory to version control
```

---

## Comparison: /cc-bootstrap vs /cc-setup vs /cc-sync

| | /cc-bootstrap | /cc-setup | /cc-sync |
|--|--------------|-----------|----------|
| **Purpose** | Generate full .claude/ from scratch | Configure + audit interactively | Update existing config after changes |
| **When to use** | New project, first time | Any project setup | After adding skills, plugins, or team changes |
| **Interactivity** | Confirm before write | Interactive Q&A | Automated |
| **Scope** | Full architecture | Full architecture + MCP + agents | Delta updates only |
| **Best for** | Onboarding a bare repo | Power users wanting control | Ongoing maintenance |

See also: `runtime-selection` skill for choosing the right execution environment,
`hook-script-library` skill for all hook implementations, `common-workflows` skill
for standard engineering workflow packs.
