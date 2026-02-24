# claude-code-templating-plugin Context Summary

## Plugin purpose
Universal templating and Harness expert plugin for Claude Code - enables fully autonomous project generation, pipeline creation, and deployment automation through a unified template interface. Supports Handlebars, Cookiecutter, Copier, Maven archetypes, and Harness pipelines. 4 commands, 5 agents, 3 skills.

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
