# Ahling Command Center Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/ahling-command-center`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `acc-agent` (see `commands/acc-agent.md`)
- `acc-compose` (see `commands/acc-compose.md`)
- `acc-config` (see `commands/acc-config.md`)
- `acc-deploy` (see `commands/acc-deploy.md`)
- `acc-ha` (see `commands/acc-ha.md`)
- `acc-init` (see `commands/acc-init.md`)
- `acc-knowledge` (see `commands/acc-knowledge.md`)
- `acc-logs` (see `commands/acc-logs.md`)
- `acc-ollama` (see `commands/acc-ollama.md`)
- `acc-orchestrate` (see `commands/acc-orchestrate.md`)
- `acc-repo` (see `commands/acc-repo.md`)
- `acc-resource` (see `commands/acc-resource.md`)
- `acc-status` (see `commands/acc-status.md`)
- `acc-vault` (see `commands/acc-vault.md`)
- `acc-voice` (see `commands/acc-voice.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/ahling-command-center`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
