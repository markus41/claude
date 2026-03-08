# Exec Automator Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/exec-automator`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `analyze` (see `commands/analyze.md`)
- `customize` (see `commands/customize.md`)
- `dashboard` (see `commands/dashboard.md`)
- `deploy` (see `commands/deploy.md`)
- `export` (see `commands/export.md`)
- `generate` (see `commands/generate.md`)
- `integrate` (see `commands/integrate.md`)
- `map` (see `commands/map.md`)
- `orchestrate` (see `commands/orchestrate.md`)
- `report` (see `commands/report.md`)
- `score` (see `commands/score.md`)
- `simulate` (see `commands/simulate.md`)
- `template` (see `commands/template.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/exec-automator`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
