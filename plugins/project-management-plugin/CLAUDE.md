# Project Management Plugin (project-management-plugin)

## Overview
Universal project manager with interview-first initialization, micro-task decomposition,
deep research before every execution, autonomous work loop, and 9 PM platform integrations.

## Commands (prefix: /pm:)
| Command | Purpose |
|---------|---------|
| `/pm:init` | 8-phase interview → project initialization |
| `/pm:plan` | Recursive task decomposition to micro-tasks |
| `/pm:work` | Single cycle: research → execute → validate |
| `/pm:auto` | Autonomous loop until done/blocked |
| `/pm:status` | ASCII progress dashboard |
| `/pm:task` | Task CRUD (add/edit/complete/block) |
| `/pm:research` | Manual deep research for a task |
| `/pm:review` | Quality council review |
| `/pm:checkpoint` | Save/restore state |
| `/pm:focus` | Narrow scope to phase/epic/story |
| `/pm:report` | Full project report |
| `/pm:risk` | Risk assessment |
| `/pm:integrate` | Connect PM platform |
| `/pm:sync` | Bidirectional platform sync |
| `/pm:next` | Show next actionable tasks |
| `/pm:delegate` | Delegate task to specific agent |
| `/pm:retrospective` | Post-completion analysis |
| `/pm:template` | Use/create project templates |
| `/pm:backlog` | Backlog grooming |
| `/pm:debug` | Inspect/repair state |

## Core Invariants (never break these)
1. **Interview first**: `/pm:init` always runs the full 8-phase interview — never skip
2. **Research before execution**: tasks are never executed without a research brief
3. **Atomic state writes**: always write tasks.json via temp-file → rename
4. **HITL on high-risk**: tasks with risk > 7 always pause for user
5. **Micro-task cap**: no task over 30 min executes — must decompose first
6. **Credentials from env**: PM platform tokens from CLAUDE_PLUGIN_OPTION_* only

## State Location
All project state is in `.claude/projects/{project-id}/`:
- `project.json` — project metadata
- `tasks.json` — all tasks (authoritative source of truth)
- `research/{task-id}.md` — cached research per task
- `checkpoints/{timestamp}.json` — rolling window of last 10
- `progress/log.md` — append-only session log
- `artifacts/{task-id}/` — task output files

## Agent Routing
- **Opus**: project-orchestrator, project-interviewer, scope-architect, council-reviewer, adaptive replanning
- **Sonnet**: task-decomposer, dependency-resolver, deep-researcher, task-executor, quality-reviewer, risk-assessor, pm-integrator
- **Haiku**: progress-monitor, context-guardian, pattern-recognizer, checkpoint-manager, project-reporter

## PM Platform Credentials
Set via `/plugin enable` prompts (userConfig). Available as env vars:
- `CLAUDE_PLUGIN_OPTION_GITHUB_TOKEN`
- `CLAUDE_PLUGIN_OPTION_LINEAR_API_KEY`
- `CLAUDE_PLUGIN_OPTION_NOTION_TOKEN`
- `CLAUDE_PLUGIN_OPTION_ASANA_TOKEN`
- `CLAUDE_PLUGIN_OPTION_TRELLO_API_KEY` + `CLAUDE_PLUGIN_OPTION_TRELLO_TOKEN`
- `CLAUDE_PLUGIN_OPTION_CLICKUP_TOKEN`
- `CLAUDE_PLUGIN_OPTION_MONDAY_API_KEY`
- `CLAUDE_PLUGIN_OPTION_TODOIST_TOKEN`
