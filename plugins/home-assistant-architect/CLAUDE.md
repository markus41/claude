# Home Assistant Architect Plugin Guide

## Purpose
- Operational guide for working safely in `plugins/home-assistant-architect`.
- Keep edits scoped, minimal, and aligned with this plugin's existing architecture.

## Supported Commands
- `ha-automation` (see `commands/ha-automation.md`)
- `ha-camera` (see `commands/ha-camera.md`)
- `ha-control` (see `commands/ha-control.md`)
- `ha-dashboard` (see `commands/ha-dashboard.md`)
- `ha-deploy` (see `commands/ha-deploy.md`)
- `ha-energy` (see `commands/ha-energy.md`)
- `ha-mcp` (see `commands/ha-mcp.md`)
- `ha-sensor` (see `commands/ha-sensor.md`)
- `ollama-setup` (see `commands/ollama-setup.md`)

## Prohibited Actions
- Do not delete or rename `.claude-plugin/plugin.json`.
- Do not introduce secrets, credentials, or tenant-specific IDs in tracked files.
- Do not modify unrelated plugins from this plugin workflow unless explicitly requested.

## Required Validation Checks
- Run `npm run check:plugin-context`.
- Run `npm run check:plugin-schema`.
- If code/scripts changed in this plugin, run targeted tests for `plugins/home-assistant-architect`.

## Context Budget
Load in this order and stop when you have enough context:
1. `CONTEXT_SUMMARY.md`
2. `commands/index` (or list files in `commands/`)
3. `README.md` and only the specific docs needed for the current task

## Escalation Path
- If requirements conflict with plugin guardrails, pause implementation and document the conflict.
- If validation fails and root cause is unclear, escalate with failing command output and touched files.
- For production-impacting changes, request maintainer review before release/publish steps.
