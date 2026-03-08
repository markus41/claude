# marketplace-pro Context Summary

## Plugin purpose
Advanced plugin marketplace platform with intent-based composition, supply chain security, contextual intelligence, dev studio hot-reload, and federated registry protocol. Transforms the marketplace from a package manager into an enterprise orchestration platform.

## Command index
- `commands/compose.md`
- `commands/dev.md`
- `commands/help.md`
- `commands/lock.md`
- `commands/policy.md`
- `commands/quick.md`
- `commands/recommend.md`
- `commands/registry.md`
- `commands/setup.md`
- `commands/status.md`
- `commands/trust.md`
- `commands/verify.md`

## Agent index
- `agents/marketplace-advisor.md`

## Skill index
- `skills/composition/SKILL.md`
- `skills/devstudio/SKILL.md`
- `skills/federation/SKILL.md`
- `skills/intelligence/SKILL.md`
- `skills/security/SKILL.md`

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

