# Jira Orchestrator Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/jira-orchestrator`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `approve` (see `commands/approve.md`)
- `batch` (see `commands/batch.md`)
- `branch` (see `commands/branch.md`)
- `bulk-commit` (see `commands/bulk-commit.md`)
- `cancel` (see `commands/cancel.md`)
- `commit-template` (see `commands/commit-template.md`)
- `commit` (see `commands/commit.md`)
- `compliance` (see `commands/compliance.md`)
- `confluence` (see `commands/confluence.md`)
- `council` (see `commands/council.md`)
- `create-repo` (see `commands/create-repo.md`)
- `deploy` (see `commands/deploy.md`)
- `docs-external` (see `commands/docs-external.md`)
- `docs` (see `commands/docs.md`)
- `enterprise` (see `commands/enterprise.md`)
- `events` (see `commands/events.md`)
- `export` (see `commands/export.md`)
- `harness-review` (see `commands/harness-review.md`)
- `infra` (see `commands/infra.md`)
- `install-hooks` (see `commands/install-hooks.md`)
- `intelligence` (see `commands/intelligence.md`)
- `iterate` (see `commands/iterate.md`)
- `metrics` (see `commands/metrics.md`)
- `notify` (see `commands/notify.md`)
- `orchestrate-advanced` (see `commands/orchestrate-advanced.md`)
- `plan-prs` (see `commands/plan-prs.md`)
- `portfolio` (see `commands/portfolio.md`)
- `pr-fix` (see `commands/pr-fix.md`)
- `pr` (see `commands/pr.md`)
- `prepare` (see `commands/prepare.md`)
- `process-worklogs` (see `commands/process-worklogs.md`)
- `qa-review` (see `commands/qa-review.md`)
- `quality` (see `commands/quality.md`)
- `reason` (see `commands/reason.md`)
- `release` (see `commands/release.md`)
- `review` (see `commands/review.md`)
- `setup` (see `commands/setup.md`)
- `ship` (see `commands/ship.md`)
- `sla` (see `commands/sla.md`)
- `sprint-plan` (see `commands/sprint-plan.md`)
- `sprint` (see `commands/sprint.md`)
- `status` (see `commands/status.md`)
- `sync` (see `commands/sync.md`)
- `team` (see `commands/team.md`)
- `triage` (see `commands/triage.md`)
- `work` (see `commands/work.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/jira-orchestrator`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
