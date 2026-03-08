# claude-code-templating-plugin Context Summary

## Plugin purpose
Universal templating and Harness expert plugin for Claude Code - enables fully autonomous project generation, pipeline creation, and deployment automation through a unified template interface. Supports Handlebars, Cookiecutter, Copier, Maven archetypes, and Harness pipelines. 5 commands, 6 agents, 3 skills.

## Command index
- `commands/archetype.md`
- `commands/generate.md`
- `commands/harness.md`
- `commands/scaffold.md`
- `commands/template.md`

## Agent index
- `agents/README.md`
- `agents/archetype-creator.md`
- `agents/codegen-agent.md`
- `agents/database-agent.md`
- `agents/harness-expert.md`
- `agents/scaffold-agent.md`
- `agents/testing-agent.md`

## Skill index
- `skills/harness-expert/SKILL.md`
- `skills/project-scaffolding/SKILL.md`
- `skills/universal-templating/SKILL.md`

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

