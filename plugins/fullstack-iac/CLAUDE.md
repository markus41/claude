# Fullstack Iac Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/fullstack-iac`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `ansible` (see `commands/ansible.md`)
- `api` (see `commands/api.md`)
- `docker` (see `commands/docker.md`)
- `frontend` (see `commands/frontend.md`)
- `infra` (see `commands/infra.md`)
- `k8s` (see `commands/k8s.md`)
- `monorepo` (see `commands/monorepo.md`)
- `new` (see `commands/new.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/fullstack-iac`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
