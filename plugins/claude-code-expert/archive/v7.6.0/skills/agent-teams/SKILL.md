# Agent Teams

> Orchestrate teams of Claude Code sessions working together with shared tasks, inter-agent messaging, and centralized management.
> Experimental feature — requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` environment variable.
> Requires Claude Code v2.1.32+.

## Overview

Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the **team lead**, coordinating work, assigning tasks, and synthesizing results. Teammates work independently, each in its own context window, and communicate directly with each other.

Unlike subagents (which run within a single session and only report back), you can interact with individual teammates directly without going through the lead.

## When to Use Agent Teams

Best use cases:
- **Research and review**: multiple teammates investigate different aspects simultaneously, share and challenge findings
- **New modules or features**: teammates each own a separate piece without stepping on each other
- **Debugging with competing hypotheses**: test different theories in parallel, converge faster
- **Cross-layer coordination**: changes spanning frontend, backend, and tests, each owned by different teammate

**When NOT to use**: Sequential tasks, same-file edits, or work with many dependencies → use single session or subagents.

### Subagents vs Agent Teams

|                   | Subagents | Agent Teams |
|:-----------------|:----------|:------------|
| **Context** | Own window; results return to caller | Own window; fully independent |
| **Communication** | Report back to main agent only | Message each other directly |
| **Coordination** | Main agent manages all work | Shared task list with self-coordination |
| **Best for** | Focused tasks where only result matters | Complex work requiring discussion |
| **Token cost** | Lower: results summarized back | Higher: each is a separate Claude instance |

## Enable Agent Teams

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## Starting a Team

Describe the task and team structure in natural language:

```
I'm designing a CLI tool that helps developers track TODO comments.
Create an agent team: one on UX, one on technical architecture, one as devil's advocate.
```

Claude creates the team, spawns teammates, coordinates work, and cleans up when finished.

## Display Modes

| Mode | Description | Setup |
|------|-------------|-------|
| **In-process** | All teammates in main terminal. `Shift+Down` to cycle. | Works anywhere |
| **Split panes** | Each teammate gets own pane. Click to interact. | Requires tmux or iTerm2 |
| **Auto** (default) | Split panes if in tmux, in-process otherwise | — |

Configure in settings.json:
```json
{ "teammateMode": "in-process" }
```

Or per-session:
```bash
claude --teammate-mode in-process
```

## Controlling Teams

### Specify Teammates and Models
```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### Require Plan Approval
```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```
Teammate works in read-only plan mode until lead approves. Lead reviews and approves/rejects autonomously — influence with criteria like "only approve plans that include test coverage."

### Talk to Teammates Directly
- **In-process**: `Shift+Down` to cycle, type to message. `Enter` to view session, `Esc` to interrupt. `Ctrl+T` for task list.
- **Split panes**: Click into pane to interact.

### Task Management
Shared task list coordinates work. Tasks have states: pending → in progress → completed. Tasks support dependencies.

- **Lead assigns**: Tell lead which task for which teammate
- **Self-claim**: Teammate picks up next unassigned, unblocked task automatically

Task claiming uses file locking to prevent race conditions.

### Shutdown
```
Ask the researcher teammate to shut down
```
Then clean up:
```
Clean up the team
```
Always use the lead to clean up (not teammates).

## Quality Gates with Hooks

| Hook | When it runs | Exit code 2 behavior |
|------|-------------|---------------------|
| `TeammateIdle` | Teammate about to go idle | Send feedback, keep working |
| `TaskCreated` | Task being created | Prevent creation with feedback |
| `TaskCompleted` | Task being marked complete | Prevent completion with feedback |

## Architecture

| Component | Role |
|:----------|:-----|
| **Team lead** | Main session that creates team, spawns teammates, coordinates |
| **Teammates** | Separate Claude Code instances working on assigned tasks |
| **Task list** | Shared work items that teammates claim and complete |
| **Mailbox** | Messaging system for inter-agent communication |

Storage:
- Team config: `~/.claude/teams/{team-name}/config.json`
- Task list: `~/.claude/tasks/{team-name}/`

### Permissions
Teammates inherit lead's permission settings. Can change individual modes after spawning.

### Context and Communication
- Each teammate has own context window, loads same project context (CLAUDE.md, MCP, skills)
- Lead's conversation history does NOT carry over
- Messages delivered automatically between teammates
- Idle notifications sent automatically to lead
- Shared task list visible to all agents

### Git Integration
Each teammate gets its own git worktree (isolated branch). On completion, changes merge back. If conflicts occur:
- Fast-forward merges when possible
- Lead resolves conflicts when they arise
- Teammates can also resolve conflicts themselves

## Best Practices

1. **Define clear boundaries**: Give each teammate a distinct area (frontend, backend, tests)
2. **Start small**: 2-3 teammates before scaling up
3. **Use plan approval for risky tasks**: Require review before implementation
4. **Set quality criteria**: Tell the lead what "done" means
5. **Monitor token usage**: Each teammate is a full Claude instance

## Use Case Examples

### Feature Development
```
Create a team to implement user authentication:
- Backend teammate: API routes, middleware, JWT handling
- Frontend teammate: login form, token storage, protected routes
- Test teammate: integration tests for the full auth flow
```

### Code Review
```
Create a review team for PR #456:
- Security reviewer: check for vulnerabilities
- Performance reviewer: identify bottlenecks
- Architecture reviewer: evaluate design decisions
Have them discuss findings and produce a unified review.
```

### Debugging
```
The /api/orders endpoint is returning 500 errors intermittently.
Create a debugging team:
- One teammate investigates the database layer
- One teammate traces the request handling pipeline
- One teammate analyzes recent deployments and config changes
```

## Limitations

- **Session resumption**: Resumed sessions may not fully restore team state
- **Task coordination**: Complex task dependency graphs can cause deadlocks
- **Shutdown**: Teammates may not always shut down cleanly; always clean up via lead
- **Token cost**: Significantly more expensive than single sessions or subagents
- **No cross-machine**: All teammates run on the same machine

## See Also

- [Subagents](https://code.claude.com/docs/en/sub-agents) — Lighter-weight parallel workers
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode) — Keyboard shortcuts and task list
- [Hooks](https://code.claude.com/docs/en/hooks) — Quality gates for team workflows
- [Settings](https://code.claude.com/docs/en/settings) — Configuration options
