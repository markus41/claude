# deployment-pipeline Context Summary

## Plugin purpose
Harness CD integration pipeline with state-machine workflow orchestration

## Command index
- `commands/approve.md`
- `commands/history.md`
- `commands/rollback.md`
- `commands/start.md`
- `commands/status.md`

## Agent index
- `agents/orchestrator.md`
- `agents/rollback.md`
- `agents/validator.md`

## Skill index
- _No skill docs in `skills/`._

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

