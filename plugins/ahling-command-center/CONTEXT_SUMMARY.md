# ahling-command-center Context Summary

## Plugin purpose
Infrastructure and smart home automation command center with Ollama, Home Assistant, and multi-agent coordination

## Command index
- `commands/acc-agent.md`
- `commands/acc-compose.md`
- `commands/acc-config.md`
- `commands/acc-deploy.md`
- `commands/acc-ha.md`
- `commands/acc-init.md`
- `commands/acc-knowledge.md`
- `commands/acc-logs.md`
- `commands/acc-ollama.md`
- `commands/acc-orchestrate.md`
- `commands/acc-repo.md`
- `commands/acc-resource.md`
- _... 3 more entries omitted for bootstrap brevity; lazy-load on demand._

## Agent index
- `agents/agent-architect.md`
- `agents/compose-builder.md`
- `agents/config-generator.md`
- `agents/ha-coordinator.md`
- `agents/health-monitor.md`
- `agents/infrastructure-architect.md`
- `agents/ollama-orchestrator.md`
- `agents/resource-optimizer.md`
- `agents/troubleshooter.md`
- `agents/vault-manager.md`

## Skill index
- `skills/ai-core/SKILL.md`
- `skills/home-assistant-brain/SKILL.md`
- `skills/home-automation/SKILL.md`
- `skills/infrastructure-foundation/SKILL.md`
- `skills/intelligence-layer/SKILL.md`
- `skills/microsoft-agents/SKILL.md`
- `skills/ollama-mastery/SKILL.md`
- `skills/perception-pipeline/SKILL.md`

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

