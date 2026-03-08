# Lobbi Platform Manager Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/lobbi-platform-manager`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `env-generate` (see `commands/env-generate.md`)
- `env-validate` (see `commands/env-validate.md`)
- `health` (see `commands/health.md`)
- `keycloak-setup` (see `commands/keycloak-setup.md`)
- `keycloak-theme` (see `commands/keycloak-theme.md`)
- `keycloak-user` (see `commands/keycloak-user.md`)
- `service` (see `commands/service.md`)
- `test-gen` (see `commands/test-gen.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/lobbi-platform-manager`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
