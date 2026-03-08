# Aws Eks Helm Keycloak Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/aws-eks-helm-keycloak`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `debug` (see `commands/debug.md`)
- `dev-up` (see `commands/dev-up.md`)
- `pipeline-scaffold` (see `commands/pipeline-scaffold.md`)
- `preview` (see `commands/preview.md`)
- `service-onboard` (see `commands/service-onboard.md`)
- `setup` (see `commands/setup.md`)
- `ship` (see `commands/ship.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/aws-eks-helm-keycloak`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
