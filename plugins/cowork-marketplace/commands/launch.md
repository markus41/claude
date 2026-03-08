---
name: cowork-marketplace:launch
intent: Launch a cowork session using an installed marketplace item with its bound agents and skills
tags:
  - cowork-marketplace
  - command
  - launch
inputs: []
risk: medium
cost: medium
description: Start an interactive cowork session powered by the agents, skills, and commands bound to a marketplace item
---

# Launch Cowork Session

Start a cowork session using an installed marketplace item. The session orchestrates the item's bound plugin agents to complete a task collaboratively.

## Usage
```
/cowork-marketplace:launch <item-name> [--task DESCRIPTION] [--parallel AGENTS]
```

## Options
- `--task` - Description of what to accomplish in the session (prompted if omitted)
- `--parallel` - Max parallel agents to run (default: from item config)
- `--dry-run` - Show session plan without executing

## Examples

### Launch a template
```
/cowork-marketplace:launch fastapi-scaffold --task "Create a REST API for user management with PostgreSQL"
```
Launches the FastAPI scaffold template to generate project structure, models, endpoints, tests, and Docker configuration.

### Launch a workflow
```
/cowork-marketplace:launch jira-to-pr --task "PROJ-123"
```
Runs the Jira-to-PR workflow: analyzes the ticket, creates a branch, implements changes, runs tests, and opens a PR.

### Launch an agent config
```
/cowork-marketplace:launch enterprise-code-reviewer --task "Review the authentication module"
```
Activates the enterprise code reviewer with its security-reviewer, quality-analyzer, and commit-tracker agents.

### Launch a blueprint
```
/cowork-marketplace:launch enterprise-release --task "Prepare v2.3.0 release"
```
Orchestrates the full release pipeline: changelog, version bumps, test suite, build validation, and deploy preparation.

## How It Works

1. **Item validation** - Confirms the item is installed and its plugins are available
2. **Task analysis** - Breaks the task into subtasks matched to available agents
3. **Agent coordination** - Assigns subtasks to the bound plugin agents
4. **Parallel execution** - Runs independent subtasks concurrently (up to max agents)
5. **Output assembly** - Collects results from all agents and presents a unified output
6. **Session tracking** - Records progress, tokens used, and completion metrics

## Session Lifecycle

```
Task submitted
    |
    v
Analyze & decompose into subtasks
    |
    v
Assign agents from plugin bindings
    |
    +---> Agent 1 (e.g., code-reviewer)
    +---> Agent 2 (e.g., test-strategist)
    +---> Agent 3 (e.g., security-reviewer)
    |
    v
Collect & merge outputs
    |
    v
Present unified results
```

## Session Controls

During a running session:
- **Pause** - Suspend agent execution (resume later)
- **Resume** - Continue a paused session
- **Cancel** - Stop all agents and discard incomplete work

## Agent Assignment
This command activates the **session-orchestrator** agent.

## Skills Used
- cowork-sessions
- plugin-catalog
