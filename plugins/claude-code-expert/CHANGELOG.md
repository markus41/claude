# Changelog

## v7.9.0 (2026-04-17)

### Orchestration Infrastructure (new category)

This release ships the infrastructure the 7-agent upgrade council surfaced
as the top gaps: shared multi-round state, prompt-budget discipline,
specialist-first routing, and per-spawn telemetry. All changes are local
to `plugins/claude-code-expert/` and its MCP server; no Claude Code core
changes required.

### New MCP tools (+4)

- **`cc_blackboard_append`** — Append a finding to a multi-agent run's
  blackboard. Append-only per `(run_id, round, role)` triple. Path-traversal
  guarded. Filesystem-backed at `.claude/orchestration/blackboard/<run_id>/`.
- **`cc_blackboard_read`** — Read blackboard entries with optional
  `round` / `role` filters. Subsequent-round agents use this to see peer
  findings without the orchestrator forwarding them through prompt context.
- **`cc_blackboard_list_runs`** — Enumerate runs present on disk for
  audit / resume / cleanup.
- **`cc_telemetry_recent_agents`** — Read the `.jsonl` telemetry log
  populated by the new `SubagentStop` hook. Supports `--summarize` for
  reject-rate / mean-duration stats.

### New MCP resources (+2)

- **`cc://blackboard/<run_id>`** — Full read of a run's entries as YAML.
- **`cc://telemetry/agents`** — JSONL stream of per-spawn telemetry records.

The server now declares the `resources` capability alongside `tools`.

### New skills (+3)

- **`orchestration-blackboard`** — Usage patterns for fan-out with real
  Round-2 critique, run_id conventions, failure modes, cross-references to
  Templates 11 and 13.
- **`prompt-budget-preflight`** — 5-section minimum-viable-prompt template
  and preflight checklist. Cites observed 22% reject rate on generic
  `Explore` with 900-word prompts vs 0/7 on named specialists with
  ~300-word prompts.
- **`verify-between-waves`** — Codifies the tsc/test/commit cadence used
  across 7 waves this session; 9/9 clean commits + 2 regressions caught
  inside the wave they were introduced.

### New commands (+1)

- **`/cc-skills`** — Browsable skill index grouped by inferred category,
  with triggers and one-line descriptions. Supports `--category`,
  `--search`, `--trigger`, `--show <name>`, `--unused` (telemetry-backed),
  `--by-size` (C3 diagnostic aid). Direct fix for UX council finding C5
  ("53 skills are completely invisible without reading source files").

### New hooks (+1)

- **`capture-agent-telemetry.sh`** — `SubagentStop` hook; appends one
  JSONL record per completion to
  `.claude/orchestration/telemetry/agents.jsonl`. Safe-by-default:
  telemetry write errors log to stderr but always approve.

### Updated

- **`agents/pattern-router.md`** — Adds Decision Protocol dimension 4,
  "Specialist Availability" with the reject-rate evidence; encodes the
  per-subagent lookup rule (prefer named specialist over generic + run
  preflight before fallback).
- **`skills/agentic-patterns/SKILL.md`** — Part 4 gains a "Reliability
  override: specialist-first" subsection; Part 5 (Anti-Patterns) adds
  three new rows: prompt bloat → reject, faked multi-round, no wave-wise
  verification.
- **`commands/cc-orchestrate.md`** — Adds Template 13 "Specialist Fan-Out";
  documents the 7-specialist parallel pattern with wall-clock distribution,
  token cost, and the upgrade path to Template 11 (Blackboard Council).
  Updates Template Comparison table.
- **`commands/cc-memory.md`** — Extends "Lessons-Learned Management" with
  an operational `/cc-memory --graduate` subcommand: 6-step algorithm
  (scan → group by (tool, error-signature) → classify → propose → apply
  → report), target rule-file routing, safety rails (flock, 500-entry
  cap, report-before-apply), and verification recipe.
- **`commands/cc-setup.md`** — `--auto` is now preview-first (C8).
  Behaves as `--dry-run` by default; requires `--confirm` to write.
  Mirrors `terraform plan` → `terraform apply`. Same rule applies to
  `--preset`. `--audit` and `--mcp-only` remain read-only.
- **`mcp-server/src/index.js`** — Also drive-by fix for a pre-existing
  malformed ternary in `cc_docs_schedule_recommend` output that broke
  `node --check`.

### New docs (+1)

- **`docs/upstream-asks.md`** — Five Agent-tool / CLI / hook-subsystem
  asks that require Claude Code core changes, each with session evidence:
  O1 context preflight, O2 plugin opt-out of CLAUDE.md auto-load,
  O4 auto-retry on reject, O5 per-agent deadline,
  O6 background-aware Stop hook.

### Verification

- `node --check plugins/claude-code-expert/mcp-server/src/index.js` — clean
- Live stdio smoke: initialize + tools/list + resources/list +
  cc_blackboard_append + cc_blackboard_read + cc_telemetry_recent_agents
  — all return successfully
- Blackboard round-trip verified: entry lands at
  `.claude/orchestration/blackboard/<run_id>/<round>-<role>.yaml` with
  correct YAML shape

### Totals

| Category | v7.8.0 | v7.9.0 | Delta |
|----------|--------|--------|-------|
| Commands | 21 | 22 | +1 (/cc-skills) |
| Skills | 53 | 56 | +3 |
| Agents | 26 | 26 | — |
| MCP Tools | 15 | 19 | +4 |
| MCP Resources | 0 | 2 | +2 |
| Hooks (shipped) | 8 | 9 | +1 |

---

## v7.8.0 (2026-04-16)

### New Skills (+3)

- **`auto-mode`** — Classifier-based auto permission handling. Covers the three permission modes (default/auto/bypassPermissions), Shift+Tab cycling, `defaultMode: "auto"` setting, how the classifier scores actions, `PermissionDenied` hook (with `retry: true`), and `defer` permissionDecision for SDK/headless workflows.
- **`monitor-tool`** — Monitor tool for streaming background events into conversations without Bash sleep loops. Covers tailing logs, watching CI, auto-fixing dev server crashes, `/loop` self-pacing, and pairing Monitor with PreToolUse hooks.
- **`ultraplan`** — Ultraplan cloud planning. Kick off plan mode in the cloud from your terminal, review sections in the browser, request revisions, then execute remotely or send back to CLI. Includes decision table, cost notes, and `/autofix-pr` integration.

### Updated Skills

- **`computer-use`** — Fixed stale "Desktop-only" claim. Computer use is now available in the CLI (v2.1.86+, research preview) via the `computer-use` MCP. Added CLI enablement steps. Added PowerShell tool section for Windows users: `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`, cmdlet use cases, and when to prefer it over Bash.
- **`hook-script-library`** — Added: conditional hooks (`if` field with permission rule syntax), `CwdChanged`/`FileChanged` events, `PermissionDenied` event with audit logging, `UserPromptSubmit` sessionTitle output, and 50K hook output size limit behavior.
- **`mcp-servers`** — Added per-tool result size override: `anthropic/maxResultSizeChars` in `tools/list` `_meta`, up to 500K chars. Includes TypeScript server example.
- **`plugin-development`** — Added: plugin `bin/` executables on PATH (v2.1.91), `userConfig` for prompting at enable time with keychain-backed secrets (v2.1.83), `initialPrompt` in agent frontmatter, `disableSkillShellExecution` setting, and `managed-settings.d/` drop-in directory for enterprise policy layering.

### Totals

| Category | v7.7.0 | v7.8.0 | Delta |
|----------|--------|--------|-------|
| Commands | 21 | 21 | — |
| Skills | 50 | 53 | +3 |
| Agents | 26 | 26 | — |
| MCP Tools | 15 | 15 | — |

---

## v7.7.0 (2026-04-16)

### New Skills (+1)

- **`worktree-management`** — Git worktree patterns for parallel agent isolation. Covers `EnterWorktree`/`ExitWorktree` Claude Code tools, `isolation: "worktree"` agent parameter, branch-per-worktree naming, fan-out orchestration, safe removal checklist, conflict avoidance rules, and decision table for when worktrees beat in-context subagents.

### Updated Skills

- **`model-routing`** — Corrected model family to Opus 4.7 (`claude-opus-4-7`). All decision matrix entries and the model switching code example updated to the current model ID.

### Marketplace Sync (cowork-marketplace v2.1.0)

- `catalog.json` claude-code-mastery item updated to reflect v7.6.0 reality: 49 skills, 26 agents, 21 commands (was stale at 19/8/11)
- `bundles/registry.json` claude-code-expert-suite totals corrected to 49 skills, 26 agents, 21 commands
- `CLAUDE.md` catalog count corrected: 20 items (was 18)

### Totals

| Category | v7.6.0 | v7.7.0 | Delta |
|----------|--------|--------|-------|
| Commands | 21 | 21 | — |
| Skills | 49 | 50 | +1 |
| Agents | 26 | 26 | — |
| MCP Tools | 15 | 15 | — |

---

## v7.6.0 (2026-03-31)

### New Commands (+1)

- **`/cc-autonomy`** — Autonomy operating mode deployer with 4 profiles:
  - `conservative` — plan-first, all writes require approval, full gate stack
  - `balanced` — auto reads + analysis, approve writes, single verification pass
  - `aggressive` — auto mode enabled, parallelization, approve only destructive ops
  - `unattended-review` — read-only scheduled review mode (PR review, dep audit)
  - Sub-commands: `deploy <profile>`, `status`, `switch <profile>`, `verify`, `plan <task>`

### New Skills (+3)

- **`autonomy-profiles`** — Runtime behavior for all 4 autonomy profiles. Planner/verifier/reviewer agent protocols. Memory integration via `active-task.md`. Context survival. 8 anti-patterns. Quick reference card.
- **`hook-policy-engine`** — 8 installable hook packs with full security-hardened bash implementations:
  - `protect-sensitive-files` — blocks Write/Edit to .env, *.key, *.pem, credentials files
  - `auto-format-after-edit` — runs prettier/black/rustfmt + eslint --fix after Write/Edit
  - `stop-until-tests-pass` — blocks Stop event if test suite reports failures
  - `post-compact-context-restoration` — injects active-task.md after Compact tool
  - `direnv-reload-on-cwd-change` — reloads direnv on each prompt submission
  - `task-created-governance` — validates task descriptions are ≥20 chars
  - `task-completed-quality-gate` — runs tsc --noEmit after task completion
  - `teammate-idle-enforcement` — logs stop timestamps for idle detection
  - If-based filtering via `matcher` regex. Composable — install multiple packs.
- **`agent-team-topologies`** — 5 production-ready topology kits:
  - **Frontend-Backend-Test Squad** — 3 Sonnet + 1 Opus, clear file ownership, worktree isolation per layer
  - **Architect-Implementer-Reviewer Trio** — 2 Opus + 1 Sonnet, design gate before code, spec-driven
  - **Competing-Hypotheses Debug Council** — 3 parallel Sonnet investigators + Opus synthesis
  - **Security-Performance-Test Review Board** — parallel review disciplines, aggregated verdict
  - **Docs Migration Sprint** — 3 Sonnet batch workers + Opus editor, worktree-per-batch

### New Agents (+8)

Autonomy gate trio:
- **`autonomy-planner`** (Opus) — reads codebase, decomposes task into phases, writes `active-task.md`, stops for approval
- **`autonomy-verifier`** (Sonnet) — 5 checks: tsc, eslint, tests, git-diff vs plan, secret scan
- **`autonomy-reviewer`** (Opus) — 10 BLOCK criteria + 5 APPROVE criteria, plan compliance table

Role-based subagent pack:
- **`implementer`** (Sonnet) — write-only execution worker; stops on first type error
- **`debugger`** (Opus) — read-only, 3-hypothesis protocol, proposes fix without applying
- **`migration-lead`** (Opus) — writes migration plan first, STOP before code, then executes
- **`dependency-auditor`** (Haiku) — runs pnpm/pip/cargo audit, outputs prioritized action report
- **`release-coordinator`** (Sonnet) — semver bump from commit history, changelog, tag, CI check

### Updated Commands (+2)

- **`/cc-hooks`** — Pack installer section added: `install <pack>`, `install --all`, `list-packs`, `status`. If-based filtering explained with matcher patterns.
- **`/cc-memory`** — Layered deployment section added: `--deploy-layered`, `--subdirs`, `--exclusions`, `--auto-conventions`, `--scan`. 5-layer hierarchy explanation, token budget table.

### Totals

| Category | v7.5.0 | v7.6.0 | Delta |
|----------|--------|--------|-------|
| Commands | 20 | 21 | +1 |
| Skills | 46 | 49 | +3 |
| Agents | 18 | 26 | +8 |
| MCP Tools | 15 | 15 | — |

---

## v7.5.0 (2026-03-31)

### New Commands (+1)

- **`/cc-channels`** — Event-driven channel bootstrap and management. Sub-commands:
  - `bootstrap [ci-webhook|mobile|discord|fakechat|--all]` — writes TypeScript channel server files, updates `.mcp.json`, prints step-by-step setup instructions per pattern
  - `security` — audits all registered channels for allowlist coverage, secret exposure, port binding, HMAC verification, and `.gitignore` hygiene
  - `status` — lists registered channels and last event timestamps
  - `test [name]` — sends a curl test event to a registered channel
  - `pair <code>` — confirms a device pairing code from mobile/Discord

### New Skills (+1)

- **`channels-bootstrap`** — 4 production-ready channel server implementations (TypeScript/Bun, copy-paste ready):
  - **CI Webhook Receiver** — HTTP POST listener with HMAC-SHA256 signature verification, GitHub Actions event parsing (workflow_run, push, pull_request, deployment_status), smart filtering (only failure/merged/completed events), severity meta tagging. Includes ngrok and Cloudflare Tunnel setup.
  - **Mobile Approval Relay** — Full permission relay via Telegram (requires v2.1.81+). Long-poll Telegram API, allowlisted sender gate, pairing flow with expiring codes, persistent paired-chat state (`.claude/channels/mobile-approval-paired.json`), permission verdict parsing (`yes/no <id>`).
  - **Discord Bridge** — Two-way bidirectional bridge. `discord_reply` MCP tool for Claude to reply, allowlist-gated per-channel polling, 2000-char message splitting, permission relay forwarding, persistent paired-channel state.
  - **Fakechat Dev Profile** — Built-in channel startup commands, HTTP API for scripted test events, sample `test-channel.sh` bash script.
  - **Sender Allowlist Patterns** — Three patterns: env var (simple), file-based hot-reload (`allowlist.txt` via `watchFile`), pairing-based enrollment. Always gate on `user_id` not `chat_id`. Content sanitization (XML tag stripping, null bytes, length cap).
  - **Security Checklist** — 10-item pre-deployment checklist, `.gitignore` additions for paired files and allowlists.

### Totals

| Category | v7.4.0 | v7.5.0 | Delta |
|----------|--------|--------|-------|
| Commands | 18 | 20 | +2 (cc-channels + cc-bootstrap was already counted) |
| Skills | 45 | 46 | +1 |
| Agents | 18 | 18 | — |
| MCP Tools | 15 | 15 | — |

---

## v7.4.0 (2026-03-31)

### New Commands (+2)

- **`/cc-schedule`** — Autonomous maintenance blueprint generator with 6 blueprints: `pr-review` (daily, read-only, cloud), `ci-triage` (bi-hourly, root-cause + PR comment, cloud), `dep-audit` (weekly, creates `claude/dep-audit-{date}` branch, cloud), `docs-drift` (weekly, creates `claude/docs-drift-{date}` branch, cloud), `release-check` (daily, 10-item checklist, cloud), `branch-hygiene` (Friday EOD, max 20 deletions, merged-only, desktop). Three deployment profiles (desktop/cloud/loop), skip conditions, verification blocks, guardrails.

- **`/cc-bootstrap`** — Full repo scanner and `.claude/` architecture generator. Detects language, framework, infrastructure, services, test framework, monorepo structure, and project scale. Generates: CLAUDE.md (≤150 lines), `.claude/rules/` (12 files), `.claude/agents/` stubs (8 domain-matched agents), `.claude/hooks/` (all hook scripts), `settings.json` with full hook stack, `.mcp.json` (5 custom + 3 external), `docs/context/` starters. Includes audit mode with 0-100 scoring rubric across 7 layers.

### New Skills (+4)

- **`common-workflows`** — 7 structured engineering workflow packs: Understand a Codebase (3-phase: structure→architecture→snapshot), Fix Bug from Error Trace (5-phase: parse→locate→hypothesize→fix→verify), Refactor Safely (4-phase: baseline→characterize→refactor→verify), TDD Implementation (5-phase: RED→GREEN→REFACTOR→edge cases→integration), Repo Review Before Merge (4-phase: diff→systematic→cross-cutting→BLOCK/REQUEST/SUGGEST/PRAISE), Generate CLAUDE.md (3-phase: detect→extract→write), Migration Plan Before Edits (4-phase: inventory→risk→sequencing→write plan, STOP before code).

- **`runtime-selection`** — Decision matrix for all 7 Claude Code runtimes: CLI (local files, full toolchain), Desktop (scheduled tasks, computer use), Web (no local files, connectors), Cowork (pair programming), SSH (remote servers), Cloud Scheduled Tasks (off-machine, 1hr min), GitHub Actions (CI/CD, PR triggers). Per-runtime "choose when" guidance, comparison tables, decision flowchart.

- **`computer-use`** — GUI automation patterns: tool selection priority (shell/MCP/Playwright preferred), 4 use cases (native app validation, visual regression, GUI-only admin tools, iOS/Android simulators), verification confidence levels (HIGH/MEDIUM/LOW), safety guardrails (never-without-confirmation list, screenshot audit trail, dry-run protocol), Playwright MCP vs computer use comparison, cost-per-step awareness, Desktop-only note.

- **`lsp-integration`** *(from v7.3.0, now listed in full)*

### Updated Skills (+2)

- **`mcp-servers`** — MCP Prompts section added (from v7.3.0)
- **`checkpointing`** — Context Survival Pack appended: `active-task.md` template with Current Phase / Completed Phases / Modified Files / Verification Ledger / Next Action / Restart Prompt, post-compact restoration hook script, verification ledger protocol, session restart prompt template, when-to-create-vs-update table.
- **`scheduled-tasks`** — Cloud Scheduled Tasks section added, `/cc-schedule` blueprint references, Prompt Guardrails standard.

### MCP Server Upgrade (10 → 15 tools)

Added 5 advisory tools to `mcp-server/src/index.js` (server version 3.0.0 → 4.0.0):

- **`cc_docs_autonomy_plan`** — Takes task + repo signals (languages, projectScale, hasDocker, hasGit, hasCI, teamSize), returns execution shape (main/subagent/agent-team), model recommendation, session type, hook packs to enable, memory files to touch.
- **`cc_docs_workflow_pack_recommend`** — Maps task description to 1-3 common workflow packs from the `common-workflows` skill.
- **`cc_docs_hook_pack_recommend`** — Takes stack signals (languages, hasDocker, hasGit), returns hook packs grouped by lifecycle event with settings.json-ready configuration block.
- **`cc_docs_team_topology_recommend`** — Maps task + complexity + team size to optimal orchestration topology (builder-validator, qa-swarm, feature-squad, research-council, refactor-pipeline, pr-review-board, docs-sprint, continuous-monitor).
- **`cc_docs_schedule_recommend`** — Maps task description + local-file requirement to `/cc-schedule` blueprint, deployment profile, cron expression, and `/cc-schedule` command.

### Totals

| Category | v7.3.0 | v7.4.0 | Delta |
|----------|--------|--------|-------|
| Commands | 16 | 18 | +2 |
| Skills | 41 | 45 | +4 |
| Agents | 18 | 18 | — |
| MCP Tools | 10 | 15 | +5 |

---

## v7.3.0 (2026-03-30)

### New Skills (+2)

- **`lsp-integration`** — 18-server LSP detection matrix with language-to-server mapping, installation commands for TypeScript/Python/Go/Rust/Java/C#/Ruby/PHP/Elixir/Svelte/Vue/Tailwind/GraphQL/Prisma/YAML/Dockerfile/Bash. Includes PostToolUse diagnostic hook implementations for TypeScript (`tsc --noEmit`), Python (`pyright`), and Rust (`cargo check`). Explains CLI vs IDE (built-in `mcp__ide__getDiagnostics`) integration patterns.

- **`hook-script-library`** — 6 production-ready, security-hardened hook script implementations: `security-guard.sh` (PreToolUse, blocks dangerous bash), `auto-format.sh` (PostToolUse, path traversal protection + `realpath`), `inject-context.sh` (UserPromptSubmit, injects date/branch/uncommitted count), `session-init.sh` (SessionStart, status + stale memory warning), `on-stop.sh` (Stop, uncommitted file reminder), `lessons-learned-capture.sh` (PostToolUseFailure, `flock` atomic writes + input sanitization). Includes full `settings.json` registration block.

### Updated Skills (+1)

- **`mcp-servers`** — Added **MCP Prompts as a first-class section** (previously zero coverage). Covers: Tools vs Prompts vs Resources distinction, TypeScript and Python Prompt server implementations with `GetPromptRequestSchema`, 8 real-world Prompt patterns (deploy-checklist, security-audit, architecture-review, incident-response, db-migration-review, api-review, pr-summary, test-strategy), and cost analysis (on-demand load vs always-loaded CLAUDE.md bloat).

### Totals

| Category | v7.2.0 | v7.3.0 | Delta |
|----------|--------|--------|-------|
| Commands | 16 | 16 | — |
| Skills | 39 | 41 | +2 |
| Agents | 18 | 18 | — |
| MCP Tools | 10 | 10 | — |

---

## v6.1.0 (2026-03-19)

### New Commands (+1)

- **`/cc-sync`** — Idempotent project sync: re-fingerprint the project, propagate `.claude/` to sub-repositories, scaffold `docs/context/` knowledge base, section-merge README.md and CLAUDE.md with comprehensive nested structure, auto-install missing LSPs, and produce a scored sync report with delta tracking

### New Skills (+1)

- **project-sync** — Reusable sync workflow powering `/cc-sync`: sub-repo discovery, docs/context scaffolding, configuration drift detection, section-aware merging, and sync state persistence

### Enhanced cc-setup

- **Phase 10A**: Sub-repository discovery and `.claude/` propagation (scans up to 2 levels deep for nested git repos)
- **Phase 10B**: `docs/context/` knowledge base scaffolding (22 template files covering architecture, data model, API contracts, security, testing, ADRs, and more)
- **Phase 10B.2**: `.claude/` enrichment with templates/, skills/ (code-review, release-notes, migration-planner, bug-triage), and agents/ (backend-architect, frontend-specialist, infra-guardian, qa-analyst)
- **Phase 10B.3**: Comprehensive README.md generation with nested structure (ToC, Getting Started, Architecture, Claude Code Integration, Documentation index)
- **Phase 10B.4**: CLAUDE.md cross-reference update pointing to all `@docs/context/` and `@.claude/rules/` files
- **Phase 10C**: LSP auto-installation for all detected languages
- **Phase 10D**: .gitignore hygiene and sync state persistence via `.claude/sync-state.json`
- Post-setup section now directs users to `/cc-sync` for ongoing maintenance

### Totals

| Category | v6.0.0 | v6.1.0 | Delta |
|----------|--------|--------|-------|
| Commands | 16 | 17 | +1 |
| Skills | 33 | 34 | +1 |
| Agents | 16 | 16 | — |
| MCP Tools | 10 | 10 | — |

---

## v6.0.0 (2026-03-19)

### New Commands (+4)
- **`/cc-budget`** — Context budget calculator: audit token consumers, optimize context allocation, plan anchor strategies
- **`/cc-cicd`** — CI/CD pipeline generator: GitHub Actions, GitLab CI, pre-commit hooks, automated PR review workflows
- **`/cc-perf`** — Session performance analyzer: token tracking, bottleneck identification, cost optimization recommendations
- **`/cc-learn`** — Interactive tutorial runner: 8 step-by-step walkthroughs for common Claude Code workflows

### New Skills (+9)
- **model-routing** — Intelligent model selection with decision matrices, cost tables, and budget planning
- **context-budgeting** — Advanced context window management: token arithmetic, anchor budgets, compact strategies
- **cicd-integration** — CI/CD patterns: GitHub Actions, headless mode, automated reviews, secrets management
- **plugin-development** — Complete guide to building Claude Code plugins: manifest schema, authoring, marketplace publishing
- **prompt-engineering** — Crafting effective CLAUDE.md, rules, agent prompts, and task instructions
- **session-analytics** — Token tracking, bottleneck identification, caching behavior, cost estimation
- **enterprise-security** — Enterprise patterns: audit logging, SOC2/HIPAA/GDPR compliance, secrets management, permission hardening
- **worked-examples** — 8 end-to-end tutorials: setup, hooks, review, agents, optimization, debugging, memory, CI/CD
- **agent-teams-advanced** — Advanced Agent Teams: topology design, worktree coordination, failure handling, cost management

### New Agents (+3)
- **plugin-architect** (Sonnet) — Plugin design, scaffolding, manifest validation, and marketplace publishing
- **security-compliance-advisor** (Opus) — Security audit, compliance assessment, remediation planning
- **teams-architect** (Sonnet) — Agent Team topology design, sizing, cost estimation, coordination optimization

### MCP Server v3.0.0 (+3 tools)
- **`cc_docs_model_recommend`** — Recommend optimal model for a task with cost estimate and budget awareness
- **`cc_docs_checklist`** — Step-by-step checklists for setup, review, debug, deploy, and security tasks
- **`cc_docs_compare`** — Side-by-side comparison of any 2-3 commands, skills, or agents
- Updated TASK_HINTS with 10 new categories: ci-cd, model, security, context, plugin, performance, teams, prompt, tutorial

### Manifest & Marketplace
- Version bumped to 6.0.0
- Added 12 new keywords for marketplace discovery
- Added 5 new capabilities
- Updated context summary and lazy-load sections
- MCP server package bumped to 3.0.0

### Totals

| Category | v5.0.0 | v6.0.0 | Delta |
|----------|--------|--------|-------|
| Commands | 12 | 16 | +4 |
| Skills | 24 | 33 | +9 |
| Agents | 13 | 16 | +3 |
| MCP Tools | 7 | 10 | +3 |

## v5.0.0

- Deep Code Intelligence (`cc-intel`) with 7-phase analysis loop
- Principal Engineer Strategist agent
- Audit Reviewer agent with Context7 validation
- Agent Lifecycle Manager
- Research Orchestrator with MCP routing
- Context Anchoring skill
- Self-Healing Advanced skill
- CONTEXT_SUMMARY.md bootstrap context
- MCP server v2.0.0 with `cc_docs_resolve_task`

## v4.0.0

- Council review system with 6 protocols
- 10 orchestration templates
- Settings deep-dive skill
- Teams collaboration skill
- Extended thinking skill

## v3.0.0

- Initial MCP documentation server
- Core skills: CLI, configuration, hooks, MCP, permissions
- IDE integrations skill
- Git integration skill

## v2.0.0

- Setup command with audit scoring
- Memory command with 3-tier architecture
- Basic troubleshooting and debugging

## v1.0.0

- Initial release with `cc-help` documentation lookup
