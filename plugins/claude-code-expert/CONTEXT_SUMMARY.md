# Claude Code Expert Context Summary

High-intelligence Claude Code expert plugin (v7.8.0) with 21 commands, 53 skills, 26 agents, and a 15-tool MCP server for deep code reasoning, agentic design patterns, orchestrated execution, model routing, CI/CD integration, enterprise security, context budgeting, LSP integration, hook script library, MCP Prompts, common workflow packs, runtime selection, computer-use patterns (CLI + Desktop), checkpointing, scheduled-task blueprints, repo bootstrap scanner, autonomy operating mode (4 profiles + 3 gate agents), hook policy engine (8 installable packs), layered memory deployment, role-based subagent packs, 5 agent-team topology kits, autonomy advisor, event-driven channels (CI webhook, mobile approval relay, Discord bridge, fakechat), git worktree management for parallel agent isolation, auto mode permission handling (classifier-based approvals, PermissionDenied hook, defer), Monitor tool for background event streaming and /loop self-pacing, and Ultraplan cloud planning.

## What this plugin is best at
- Turning vague engineering requests into evidence-backed plans.
- Building repo fingerprints, invariant maps, and failure-mode analyses before code changes.
- Delegating broad work to teams while preserving a principal-engineer level synthesis pass.
- Diagnosing Claude Code, plugin, MCP, hook, and workflow problems systematically.
- Routing tasks to optimal models with cost awareness.
- Integrating Claude Code into CI/CD pipelines and enterprise environments.

## Core assets
- `commands/cc-intel.md`: deep-analysis command for repo intelligence, hypothesis trees, and execution strategy.
- `agents/principal-engineer-strategist.md`: senior reviewer for architecture, tradeoffs, and hidden-risk detection.
- `skills/deep-code-intelligence/SKILL.md`: reusable reasoning workflow for hard coding tasks.
- `mcp-server/src/index.js`: 10-tool searchable docs index with model recommendations, checklists, and comparisons.

## v7.8.0 additions

- **Auto Mode Permission Handling**: `skills/auto-mode/SKILL.md` — covers three permission modes (default/auto/bypass), how the classifier scores tool calls, PermissionDenied hook (bash example with `retry: true` for audit logging), defer permissionDecision pattern for SDK/headless workflows (`{"permissionDecision": "defer"}`), and mode comparison table. Use when configuring headless pipelines or enterprise approval gates.
- **Monitor Tool**: `skills/monitor-tool/SKILL.md` — streams background watcher events into the active conversation; replaces Bash sleep polling loops. Covers tail-log, watch-CI, auto-fix-crash, and training-run use cases. Documents `/loop` self-pacing with `ScheduleWakeup` (270s for warm cache, 1200s+ for long idle). Decision table: Monitor vs ScheduleWakeup vs Bash sleep.
- **Ultraplan**: `skills/ultraplan/SKILL.md` — cloud planning from the terminal. Run `/ultraplan "..."` to open a browser planning session powered by Opus 4.7; revise interactively; execute remotely or send the plan back to CLI. Covers when to prefer over local `/plan`, step-by-step flow, cost/model info.

### Updated skills (v7.8.0)
- **`computer-use`** — Corrected stale "Desktop-only" claim. CLI now available as of v2.1.86 (research preview, enable via `/mcp` toggle). Added PowerShell tool section for Windows (`CLAUDE_CODE_USE_POWERSHELL_TOOL=1`).
- **`hook-script-library`** — Added: conditional hooks via `if` field (scope to specific commands e.g. `"Bash(git commit *)"`), `CwdChanged`/`FileChanged` events for reactive setups, `PermissionDenied` event with audit-log example, `UserPromptSubmit` sessionTitle output, 50K hook output size limit note.
- **`mcp-servers`** — Added per-tool result size override: annotate tool in `tools/list` with `_meta: { "anthropic/maxResultSizeChars": 500000 }` for schema-heavy tools (ceiling 500K chars).
- **`plugin-development`** — Added: `bin/` directory executables added to Bash PATH automatically, `userConfig` for prompting API keys at enable time (keychain-backed), `initialPrompt` in agent frontmatter for auto-submitting first turn, `disableSkillShellExecution` flag, `managed-settings.d/` lexical merge for enterprise policy layering.

## v7.7.0 additions

- **Worktree Management**: `skills/worktree-management/SKILL.md` — `EnterWorktree`/`ExitWorktree` tools, `isolation: "worktree"` agent parameter, branch-per-worktree naming convention, fan-out orchestration patterns, safe removal checklist (status check → remove → branch delete), conflict avoidance rules, decision table for worktree vs in-context subagents.
- **Model routing corrected**: `skills/model-routing/SKILL.md` — Opus 4.7 (`claude-opus-4-7`) is the current flagship model. All decision matrix entries and code examples updated.

## v7.6.0 additions

- **Autonomy Operating Mode**: `commands/cc-autonomy.md` + `skills/autonomy-profiles/SKILL.md` — 4 profiles (conservative, balanced, aggressive, unattended-review) with complete generated files (autonomy.md rules, settings.json permission blocks, startup commands). 3 gate agents: `autonomy-planner` (Opus, writes active-task.md), `autonomy-verifier` (Sonnet, 5 checks: tsc/eslint/tests/git-diff/secret-scan), `autonomy-reviewer` (Opus, 10 BLOCK criteria).
- **Hook Policy Engine**: `skills/hook-policy-engine/SKILL.md` — 8 installable hook packs with full security-hardened bash: protect-sensitive-files, auto-format-after-edit, stop-until-tests-pass, post-compact-context-restoration, direnv-reload-on-cwd-change, task-created-governance, task-completed-quality-gate, teammate-idle-enforcement. `/cc-hooks install <pack>` generates scripts + updates settings.json with if-based matcher filtering.
- **Layered Memory Deployment**: `commands/cc-memory.md` upgraded — `--deploy-layered` generates root CLAUDE.md + split rules + path-scoped rules from repo scan. `--subdirs` generates per-module CLAUDE.md stubs. `--scan` proposes path-scoped rules by detected stack. Token budget table with 5 optimization levers.
- **Role-Based Subagent Packs**: 5 new agents — `implementer` (Sonnet, write tools), `debugger` (Opus, read-only + hypothesis protocol), `migration-lead` (Opus, writes migration plan before any code), `dependency-auditor` (Haiku, runs pnpm/pip/cargo audit), `release-coordinator` (Sonnet, semver bump + changelog + tag).
- **Agent-Team Topology Kits**: `skills/agent-team-topologies/SKILL.md` — 5 production-ready topologies: Frontend-Backend-Test Squad (3 Sonnet + 1 Opus), Architect-Implementer-Reviewer Trio (2 Opus + 1 Sonnet with design gate), Competing-Hypotheses Debug Council (3 parallel Sonnet investigators + Opus synthesis), Security-Performance-Test Review Board (parallel discipline reviewers), Docs Migration Sprint (3 Sonnet + 1 Opus editor). Each includes team composition, file ownership rules, worktree guidance, coordination protocol, output formats, cost estimates.

## v7.5.0 additions

- **Channels Bootstrap**: `skills/channels-bootstrap/SKILL.md` — 4 production-ready channel server implementations with full TypeScript source:
  - **Pattern 1 (CI Webhook)**: HTTP receiver with HMAC-SHA256 signature verification, smart event filtering (workflow_run failures, deploys, pushes, PRs), and automatic severity tagging. ngrok/Cloudflare Tunnel setup guide.
  - **Pattern 2 (Mobile Approval Relay)**: Telegram-based permission relay (requires Claude Code v2.1.81+). Forwards tool approval prompts to phone, parses `yes/no <id>` replies, relays verdicts. Pairing flow with expiring codes. Persistent paired-chat state.
  - **Pattern 3 (Discord Bridge)**: Two-way Discord ↔ Claude bridge with `discord_reply` tool, allowlist-gated polling, message splitting for Discord's 2000-char limit, permission relay support, and persistent paired-channel state.
  - **Pattern 4 (Fakechat Dev Profile)**: Built-in local dev channel with startup commands, HTTP API usage, and sample test script.
  - Sender allowlist patterns (env var, file-based hot-reload, pairing-based enrollment), content sanitization, full security checklist.

- **`/cc-channels` Command**: `commands/cc-channels.md` — bootstrap command with 5 sub-commands:
  - `bootstrap [pattern]` — interactive or direct channel installation, writes TypeScript server files, updates `.mcp.json`, prints per-pattern setup instructions with exact commands
  - `security` — audits registered channels for allowlist, secret exposure, port binding, HMAC verification, and `.gitignore` coverage
  - `status` — shows which channels are registered and running
  - `test [name]` — sends a test event through a registered channel
  - `pair <code>` — confirms a device pairing code

## v7.4.0 additions

- **Common Workflow Packs**: `skills/common-workflows/SKILL.md` — 7 standard engineering workflow packs: Understand a Codebase, Fix Bug from Error Trace, Refactor Safely, TDD Implementation, Repo Review Before Merge, Generate CLAUDE.md, Migration Plan Before Edits. Each is a multi-phase structured playbook.
- **Runtime Selection Guide**: `skills/runtime-selection/SKILL.md` — decision matrix for 7 Claude Code runtimes (CLI, Desktop, Web, Cowork, SSH, Cloud Scheduled Tasks, GitHub Actions) with "choose when" guidance and flowchart.
- **Computer-Use Patterns**: `skills/computer-use/SKILL.md` — tool selection priority (prefer shell/MCP/Playwright over computer use), 4 use cases, verification confidence levels, safety guardrails, cost awareness, Desktop-only note.
- **Checkpointing & Context Recovery**: `skills/checkpointing/SKILL.md` updated — Context Survival Pack section added: `active-task.md` template, post-compact restoration hook, verification ledger protocol, session restart prompt template.
- **Scheduled-Task Blueprints**: `commands/cc-schedule.md` — `/cc-schedule` command with 6 autonomous maintenance blueprints (pr-review, ci-triage, dep-audit, docs-drift, release-check, branch-hygiene), 3 deployment profiles (desktop/cloud/loop), full generated prompts, guardrails, and verification blocks.
- **Repo Bootstrap Scanner**: `commands/cc-bootstrap.md` — `/cc-bootstrap` command that scans an existing repo and generates a full deployable `.claude/` architecture: CLAUDE.md, rules, agents, settings.json, hooks, .mcp.json, docs/context starters. Includes audit mode with 0-100 scoring rubric.
- **MCP Autonomy Advisor**: `mcp-server/src/index.js` upgraded from 10 to 15 tools — added `cc_docs_autonomy_plan`, `cc_docs_workflow_pack_recommend`, `cc_docs_hook_pack_recommend`, `cc_docs_team_topology_recommend`, `cc_docs_schedule_recommend`. These advisory tools take natural-language tasks + repo signals and output execution shapes, model recommendations, hook configurations, team topologies, and schedule blueprints.

## v7.3.0 additions

- **LSP Integration**: `skills/lsp-integration/SKILL.md` — 18-server LSP detection matrix (TypeScript, Python, Go, Rust, Java, C#, Ruby, PHP, Elixir, Svelte, Vue, Tailwind, GraphQL, Prisma, YAML, Dockerfile, Bash), installation commands, TypeScript/Python/Rust diagnostics hook implementations, CLI vs IDE integration distinction.
- **Hook Script Library**: `skills/hook-script-library/SKILL.md` — 6 production-ready, security-hardened hook script implementations (security-guard, auto-format, inject-context, session-init, on-stop, lessons-learned-capture) with `flock`, `realpath`, `jq`-only JSON, and input sanitization. Ready-to-paste with full settings.json registration.
- **MCP Prompts coverage**: `skills/mcp-servers/SKILL.md` updated — MCP Prompts added as a first-class section. Covers Tools vs Prompts vs Resources distinction, TypeScript/Python Prompt implementation, real-world Prompt patterns, and cost impact analysis (on-demand vs always-loaded).

## v7.2.0 additions
- **Agentic patterns overhaul**: `skills/agentic-patterns/SKILL.md` — integrated Anthropic's workflow/agent taxonomy with Andrew Ng's four foundational patterns. 13 patterns with concrete 4-layer implementation templates.
- **Evaluator-Optimizer agent**: `agents/evaluator-optimizer.md` — generate→evaluate→refine loop with rubric scoring and quality thresholds.
- **Pattern Router agent**: `agents/pattern-router.md` — analyzes tasks and selects optimal agentic pattern (chain, routing, parallelization, eval-optimizer, orchestrator-workers, reflection, ReAct).
- **4 new orchestration templates**: eval-optimizer loop, orchestrator-workers, blackboard council, ReAct debugger — in `commands/cc-orchestrate.md`.
- **Pattern wiring in cc-setup**: Phase 11 auto-deploys agentic pattern artifacts across all 4 layers based on project scale.

## v6.1.0 additions

- **Project Sync**: `commands/cc-sync.md` — idempotent update command that re-fingerprints the project, propagates `.claude/` to sub-repos, scaffolds `docs/context/` knowledge base, section-merges README.md/CLAUDE.md, and auto-installs LSPs.
- **Project Sync skill**: `skills/project-sync/SKILL.md` — reusable sync workflow for sub-repo discovery, docs scaffolding, and configuration drift detection.
- **Enhanced cc-setup**: Phases 10A-10D added for sub-repo propagation, docs/context scaffolding, LSP auto-install, and sync state persistence.

## v6.0.0 additions
- **Model routing**: `skills/model-routing/SKILL.md` — intelligent model selection with cost tables.
- **Context budgeting**: `commands/cc-budget.md`, `skills/context-budgeting/SKILL.md` — token arithmetic and compact strategies.
- **CI/CD**: `commands/cc-cicd.md`, `skills/cicd-integration/SKILL.md` — GitHub Actions, headless mode, automated reviews.
- **Enterprise security**: `skills/enterprise-security/SKILL.md`, `agents/security-compliance-advisor.md` — compliance, audit logging, secrets management.
- **Plugin development**: `skills/plugin-development/SKILL.md`, `agents/plugin-architect.md` — build your own plugins.
- **Tutorials**: `commands/cc-learn.md`, `skills/worked-examples/SKILL.md` — 8 step-by-step walkthroughs.

## When to open deeper docs
| Signal | Open docs | Why |
|---|---|---|
| User asks for the "best" approach or a major refactor | `commands/cc-intel.md` | Evidence-driven analysis loop and output contract. |
| Need architectural judgement or root-cause isolation | `agents/principal-engineer-strategist.md` | Principal-level decomposition, invariants, and tradeoff review. |
| Need model or cost guidance | `skills/model-routing/SKILL.md` | Decision matrix, cost tables, budget planning. |
| Need CI/CD integration | `commands/cc-cicd.md` | GitHub Actions, pre-commit, headless mode patterns. |
| Need enterprise security patterns | `skills/enterprise-security/SKILL.md` | Compliance, audit logging, permission hardening. |
| Need task routing across plugin docs | `CLAUDE.md` and `mcp-server/src/index.js` | Fast path and queryable retrieval model. |
| Need parallel agents or worktree isolation | `skills/worktree-management/SKILL.md` | EnterWorktree/ExitWorktree, branch-per-worktree, cleanup lifecycle. |
| Need auto vs manual permission mode or PermissionDenied hook | `skills/auto-mode/SKILL.md` | Classifier-based approvals, defer pattern for SDK/headless, audit logging. |
| Need to stream background process events or self-pace a loop | `skills/monitor-tool/SKILL.md` | Monitor tool vs Bash sleep, /loop with ScheduleWakeup, cache-warm timing. |
| Need cloud-based planning session for complex tasks | `skills/ultraplan/SKILL.md` | Ultraplan via /ultraplan, browser review/revise, remote or send-to-CLI execution. |
