# Marketplace Pro Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/marketplace-pro`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `compose` (see `commands/compose.md`)
- `dev` (see `commands/dev.md`)
- `help` (see `commands/help.md`)
- `lock` (see `commands/lock.md`)
- `policy` (see `commands/policy.md`)
- `quick` (see `commands/quick.md`)
- `recommend` (see `commands/recommend.md`)
- `registry` (see `commands/registry.md`)
- `setup` (see `commands/setup.md`)
- `status` (see `commands/status.md`)
- `trust` (see `commands/trust.md`)
- `verify` (see `commands/verify.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/marketplace-pro`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
