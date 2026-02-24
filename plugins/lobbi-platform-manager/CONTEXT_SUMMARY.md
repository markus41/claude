# lobbi-platform-manager Context Summary

## Plugin purpose
Streamline development on the-lobbi/keycloak-alpha with Keycloak management, service orchestration, and test generation

## Command index
- `commands/env-generate.md`
- `commands/env-validate.md`
- `commands/health.md`
- `commands/keycloak-setup.md`
- `commands/keycloak-theme.md`
- `commands/keycloak-user.md`
- `commands/service.md`
- `commands/test-gen.md`

## Agent index
- `agents/env-manager.md`
- `agents/keycloak-admin.md`
- `agents/service-orchestrator.md`
- `agents/test-generator.md`

## Skill index
- `skills/keycloak-admin/SKILL.md`
- `skills/mern-patterns/SKILL.md`
- `skills/multi-tenant/SKILL.md`

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

