# team-accelerator Context Summary

## Plugin purpose
Enterprise development toolkit for teams - DevOps, code quality, integrations, workflow automation, documentation, and performance optimization across multi-cloud and full-stack platforms

## Command index
- `commands/deploy.md`
- `commands/docs.md`
- `commands/integrate.md`
- `commands/perf.md`
- `commands/quality.md`
- `commands/status.md`
- `commands/test.md`
- `commands/workflow.md`

## Agent index
- `agents/code-reviewer.md`
- `agents/devops-engineer.md`
- `agents/documentation-writer.md`
- `agents/integration-specialist.md`
- `agents/performance-engineer.md`
- `agents/workflow-automator.md`

## Skill index
- `skills/code-quality/SKILL.md`
- `skills/devops-practices/SKILL.md`
- `skills/integration-patterns/SKILL.md`
- `skills/workflow-automation/SKILL.md`

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

