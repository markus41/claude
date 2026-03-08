# Tvs Microsoft Deploy Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/tvs-microsoft-deploy`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `browser-fallback` (see `commands/browser-fallback.md`)
- `cost-report` (see `commands/cost-report.md`)
- `deploy-all` (see `commands/deploy-all.md`)
- `deploy-azure` (see `commands/deploy-azure.md`)
- `deploy-dataverse` (see `commands/deploy-dataverse.md`)
- `deploy-fabric` (see `commands/deploy-fabric.md`)
- `deploy-identity` (see `commands/deploy-identity.md`)
- `deploy-portal` (see `commands/deploy-portal.md`)
- `deploy-teams` (see `commands/deploy-teams.md`)
- `extract-a3` (see `commands/extract-a3.md`)
- `health` (see `commands/health.md`)
- `identity-attestation` (see `commands/identity-attestation.md`)
- `identity-drift` (see `commands/identity-drift.md`)
- `normalize-carriers` (see `commands/normalize-carriers.md`)
- `orchestrate-planner` (see `commands/orchestrate-planner.md`)
- `quick-start` (see `commands/quick-start.md`)
- `status-check` (see `commands/status-check.md`)
- `taia-readiness` (see `commands/taia-readiness.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/tvs-microsoft-deploy`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
