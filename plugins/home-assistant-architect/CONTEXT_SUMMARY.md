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
