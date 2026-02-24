# fastapi-backend Context Summary

## Plugin purpose
Comprehensive FastAPI backend development plugin with MongoDB/Beanie, Keycloak auth, Docker/K8s deployment, background tasks, caching, observability, and real-time features

## Command index
- `commands/deploy.md`
- `commands/dev.md`
- `commands/docker.md`
- `commands/endpoint.md`
- `commands/migrate.md`
- `commands/model.md`
- `commands/scaffold.md`
- `commands/task.md`
- `commands/test.md`
- `commands/ws.md`

## Agent index
- `agents/api-architect.md`
- `agents/performance-optimizer.md`
- `agents/security-reviewer.md`
- `agents/test-generator.md`

## Skill index
- `skills/beanie-odm/SKILL.md`
- `skills/fastapi-background/SKILL.md`
- `skills/fastapi-caching/SKILL.md`
- `skills/fastapi-k8s/SKILL.md`
- `skills/fastapi-observability/SKILL.md`
- `skills/fastapi-patterns/SKILL.md`
- `skills/fastapi-realtime/SKILL.md`
- `skills/keycloak-fastapi/SKILL.md`

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

