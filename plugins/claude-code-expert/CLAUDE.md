# Claude Code Expert

## Purpose
Use this plugin when the task needs unusually strong code intelligence: deep repo understanding, evidence-backed planning, architecture tradeoff analysis, root-cause debugging, multi-agent orchestration, or Claude Code setup guidance.

## Fast routing
- Need full repository setup or audit? Open `commands/cc-setup.md`.
- Need to update/sync an existing setup, propagate to sub-repos, or scaffold docs? Open `commands/cc-sync.md`.
- Need orchestration or review council? Open `commands/cc-orchestrate.md` and `commands/cc-council.md`.
- Need the highest reasoning depth for a coding problem? Open `commands/cc-intel.md`, `skills/deep-code-intelligence/SKILL.md`, and `agents/principal-engineer-strategist.md`.
- Need debugging or recovery? Open `commands/cc-debug.md`, `commands/cc-troubleshoot.md`, and `skills/self-healing-advanced/SKILL.md`.
- Need research or library verification? Open `skills/research-routing/SKILL.md` and `agents/research-orchestrator.md`.
- Need auto mode, PermissionDenied hook, or defer pattern? Open `skills/auto-mode/SKILL.md`.
- Need to stream background events or self-pace a loop? Open `skills/monitor-tool/SKILL.md`.
- Need cloud-based planning? Open `skills/ultraplan/SKILL.md`.
- Need CI auto-fix from the terminal (`/autofix-pr`)? Open `skills/cicd-integration/SKILL.md`.
- Need cost/quality tradeoffs, `/effort` control, or thinking summaries? Open `skills/model-routing/SKILL.md`.

## New CLI commands (w13–w15, 2026)

| Command | What it does |
|---------|-------------|
| `/autofix-pr` | Enable PR auto-fix loop for current branch's open PR (CLI, v2.1.92) |
| `/ultraplan` | Cloud planning session via browser, execute or send back to CLI (v2.1.92) |
| `/powerup` | Interactive in-terminal feature lessons with animated demos (v2.1.90) |
| `/team-onboarding` | Generate teammate ramp-up guide from local Claude Code usage (v2.1.101) |
| `/effort [low\|medium\|high]` | Control reasoning depth; default is now `high` for paid users (v2.1.101) |

**Transcript search** (v2.1.83): Press `Ctrl+O` to open transcript, then `/` to search. Use `n`/`N` to step through matches. Find any command or output from earlier in long sessions.

## Operating rules
1. Build an evidence table before making major claims.
2. Prefer repo-specific facts over generic best practices.
3. For non-trivial work, decompose into constraints, hypotheses, validation steps, and rollback paths.
4. Use orchestration for breadth; use `cc-intel` for depth.
5. If a framework or library is involved, validate against official docs before finalizing recommendations.
