# home-assistant-architect Context Summary

## Plugin purpose
Complete Home Assistant platform with frontend design, energy management, cameras, sensors, local LLM integration, and Ubuntu server deployment

## Command index
- `commands/ha-automation.md`
- `commands/ha-camera.md`
- `commands/ha-control.md`
- `commands/ha-dashboard.md`
- `commands/ha-deploy.md`
- `commands/ha-energy.md`
- `commands/ha-mcp.md`
- `commands/ha-sensor.md`
- `commands/ollama-setup.md`

## Agent index
- `agents/ha-automation-architect.md`
- `agents/ha-camera-nvr.md`
- `agents/ha-customization-expert.md`
- `agents/ha-dashboard-designer.md`
- `agents/ha-data-writer.md`
- `agents/ha-device-controller.md`
- `agents/ha-diagnostics.md`
- `agents/ha-energy-management.md`
- `agents/ha-energy-optimizer.md`
- `agents/ha-frontend-builder.md`
- `agents/ha-security-auditor.md`
- `agents/ha-sensor-manager.md`
- _... 3 more entries omitted for bootstrap brevity; lazy-load on demand._

## Skill index
- `skills/camera-nvr/SKILL.md`
- `skills/energy-management/SKILL.md`
- `skills/ha-automation/SKILL.md`
- `skills/ha-core/SKILL.md`
- `skills/local-llm/SKILL.md`
- `skills/lovelace-design/SKILL.md`
- `skills/sensor-management/SKILL.md`
- `skills/ubuntu-deployment/SKILL.md`

## When-to-load guidance
- Load this summary first for routing, scope checks, and high-level capability matching.
- Open specific command/agent files only when the user asks for those workflows.
- Defer `skills/**` and long `README.md` documents until implementation details are needed.

## When to open deeper docs
Use this table to decide when to move beyond this summary.

| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup, install, or execution details | `README.md`, `INSTALLATION.md`, or setup guides | Captures exact commands and prerequisites. |
| You are changing implementation behavior | `CONTEXT.md` and relevant source folders | Contains architecture, conventions, and deeper implementation context. |
| You are validating security, compliance, or rollout risk | `SECURITY*.md`, workstream/review docs | Provides controls, risk notes, and release constraints. |
| The summary omits edge cases you need | Any referenced deep-dive docs linked above | Ensures decisions are based on complete plugin-specific details. |

