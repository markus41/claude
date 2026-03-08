# jira-orchestrator Context Summary

## Plugin purpose
Enterprise Jira orchestration with 81 agents, 16 teams, 46 commands, 11 skills. Features Atlassian MCP OAuth, Harness integration, Neon PostgreSQL, Redis caching, Temporal workflows, and structured reasoning frameworks.

## Command index
- `commands/approve.md`
- `commands/batch.md`
- `commands/branch.md`
- `commands/bulk-commit.md`
- `commands/cancel.md`
- `commands/commit-template.md`
- `commands/commit.md`
- `commands/compliance.md`
- `commands/confluence.md`
- `commands/council.md`
- `commands/create-repo.md`
- `commands/deploy.md`
- _... 34 more entries omitted for bootstrap brevity; lazy-load on demand._

## Agent index
- `agents/advanced-orchestration-patterns.md`
- `agents/agent-router.md`
- `agents/approval-orchestrator.md`
- `agents/batch-commit-processor.md`
- `agents/batch-processor.md`
- `agents/bulk-importer.md`
- `agents/chain-of-thought-reasoner.md`
- `agents/checkpoint-pr-manager.md`
- `agents/code-quality-enforcer.md`
- `agents/code-reviewer.md`
- `agents/commit-message-generator.md`
- `agents/commit-orchestrator.md`
- _... 69 more entries omitted for bootstrap brevity; lazy-load on demand._

## Skill index
- `skills/clean-architecture/SKILL.md`
- `skills/code-review/SKILL.md`
- `skills/confluence/SKILL.md`
- `skills/harness-cd/SKILL.md`
- `skills/harness-ci/SKILL.md`
- `skills/harness-mcp/SKILL.md`
- `skills/harness-pipeline.md`
- `skills/harness-platform/SKILL.md`
- `skills/jira-orchestration/SKILL.md`
- `skills/pr-workflow/SKILL.md`
- `skills/reasoning/complex-reasoning.md`
- `skills/reasoning/documentation-lookup.md`
- _... 2 more entries omitted for bootstrap brevity; lazy-load on demand._

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

