# Project Management Plugin

Universal AI project manager for Claude Code. Interview-first initialization, recursive
micro-task decomposition, deep research before every execution, and an autonomous work
loop with human-in-the-loop controls and 9 PM platform integrations.

---

## Quick Start

**Step 1 — Install the plugin**

```
/plugin install project-management-plugin
```

**Step 2 — Initialize your project**

```
/pm:init
```

Claude runs an 8-phase interview to understand your project goals, scope, constraints,
stakeholders, timeline, and success criteria. Takes 5-10 minutes. Never skipped.

**Step 3 — Let it work autonomously**

```
/pm:auto
```

Claude enters a loop: pick next task → research → execute → validate → mark complete →
repeat. Pauses automatically when it needs human input or encounters risk > 7.

---

## Keep-Claude-on-Task Guardrails

Beyond the PM loop, this plugin ships four commands + five hooks that keep
Claude locked on the current task during long sessions. Works with or
without a formal `/pm:init` project — ephemeral session state lives at
`.claude/pm-session/` when no project is active.

| Command | What it does |
|---------|--------------|
| `/pm:anchor` | Set/clear a two-line focus receipt; injected on every user turn |
| `/pm:scope` | File/command allowlist; `PreToolUse` blocks out-of-scope writes |
| `/pm:done-when` | Explicit completion criteria; `Stop` hook blocks until all have evidence |
| `/pm:drift` | Replay the breadcrumb trail and classify each turn vs the anchor/scope/criteria |
| `/pm:budget` | Cap tool calls per task; `PostToolUse` warns at 80% and screams at 120% |
| `/pm:handoff` | Force-write (or inspect) the compaction-safe task snapshot |

Hooks enforcing the above:

- `anchor-inject.sh` (SessionStart + UserPromptSubmit) — injects the focus reminder.
- `handoff-read.sh` (SessionStart) — re-surfaces `handoff.md` after `/compact` or a new session.
- `prompt-archive.sh` (UserPromptSubmit) — appends every user prompt verbatim.
- `scope-guard.sh` (PreToolUse Write|Edit|MultiEdit) — blocks unlisted paths.
- `overengineering-detector.sh` (PostToolUse Write|Edit|MultiEdit) — flags CLAUDE.md anti-patterns.
- `breadcrumb-logger.sh` (PostToolUse \*) — appends every tool call to `breadcrumbs.jsonl`.
- `budget-warn.sh` (PostToolUse \*) — surfaces turn-budget warnings at 80% / 120%.
- `handoff-write.sh` (Stop) — snapshots anchor/scope/done-when/budget/breadcrumbs to `handoff.md`.
- `done-gate.sh` (Stop) — refuses session end while any criterion lacks evidence.

## Command Reference

| Command | Purpose |
|---------|---------|
| `/pm:init` | 8-phase interview → project initialization |
| `/pm:plan` | Recursive task decomposition to micro-tasks |
| `/pm:work` | Single cycle: research → execute → validate |
| `/pm:auto` | Autonomous loop until done or blocked |
| `/pm:status` | ASCII progress dashboard |
| `/pm:task` | Task CRUD (add / edit / complete / block) |
| `/pm:research` | Manual deep research for a task |
| `/pm:review` | Quality council review |
| `/pm:checkpoint` | Save or restore state snapshot |
| `/pm:focus` | Narrow scope to a phase, epic, or story |
| `/pm:report` | Full project report |
| `/pm:risk` | Risk assessment |
| `/pm:integrate` | Connect a PM platform |
| `/pm:sync` | Bidirectional sync with connected platform |
| `/pm:next` | Show next actionable tasks |
| `/pm:delegate` | Delegate a task to a specific agent |
| `/pm:retrospective` | Post-completion analysis |
| `/pm:template` | Use or create a project template |
| `/pm:backlog` | Backlog grooming session |
| `/pm:debug` | Inspect and repair state |

---

## How It Works

```
/pm:init
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  8-Phase Interview                                       │
│  1. Goals & success criteria                            │
│  2. Scope & constraints                                 │
│  3. Stakeholders & ownership                            │
│  4. Timeline & milestones                               │
│  5. Tech stack & environment                            │
│  6. Risks & blockers                                    │
│  7. Definition of done                                  │
│  8. PM platform preferences                             │
└─────────────────────────────────────────────────────────┘
    │
    ▼
/pm:plan  — Scope Architect decomposes into Phases → Epics → Stories → Tasks
    │         Each task: 5-15 min, typed, risk-scored, dependency-linked
    ▼
/pm:auto  ─────────────────────────────────────────────────┐
    │                                                       │
    ▼                                                       │
┌─────────────────────────────────┐                        │
│  Autonomous Work Loop           │                        │
│                                 │                        │
│  1. Pick next READY task        │                        │
│  2. Deep research (Perplexity,  │  ◄── HITL pause if:    │
│     Context7, codebase grep)    │      · risk > 7        │
│  3. Execute (write code, docs,  │      · blocked          │
│     config, tests, ...)         │      · user flag        │
│  4. Validate (tests, lint, QA)  │                        │
│  5. Mark DONE, log progress     │                        │
│  6. Checkpoint state            │                        │
│  7. → back to step 1            │                        │
└─────────────────────────────────┘                        │
    │                                                       │
    └───────────────────────────────────────────────────────┘
    │  (loop ends when all tasks DONE or project COMPLETE)
    ▼
/pm:retrospective
```

---

## PM Platform Integrations

| Platform | Auth Method | Sync Capabilities |
|----------|-------------|-------------------|
| GitHub Issues | `CLAUDE_PLUGIN_OPTION_GITHUB_TOKEN` | Issues, milestones, labels, assignees |
| Linear | `CLAUDE_PLUGIN_OPTION_LINEAR_API_KEY` | Issues, cycles, projects, teams |
| Notion | `CLAUDE_PLUGIN_OPTION_NOTION_TOKEN` | Database pages, properties, relations |
| Asana | `CLAUDE_PLUGIN_OPTION_ASANA_TOKEN` | Tasks, projects, sections, custom fields |
| Trello | `CLAUDE_PLUGIN_OPTION_TRELLO_API_KEY` + `CLAUDE_PLUGIN_OPTION_TRELLO_TOKEN` | Cards, lists, boards, checklists |
| ClickUp | `CLAUDE_PLUGIN_OPTION_CLICKUP_TOKEN` | Tasks, lists, spaces, custom fields |
| Monday.com | `CLAUDE_PLUGIN_OPTION_MONDAY_API_KEY` | Items, boards, groups, status columns |
| Todoist | `CLAUDE_PLUGIN_OPTION_TODOIST_TOKEN` | Tasks, projects, sections, labels |
| Jira | `CLAUDE_PLUGIN_OPTION_JIRA_TOKEN` | Issues, sprints, epics, components |

Credentials are set once at `/plugin enable` time and stored in userConfig. They are
never written to project state files or committed to the repository.

---

## Project State Structure

```
.claude/projects/{project-id}/
├── project.json          # Project metadata (name, status, created_at, owner)
├── tasks.json            # All tasks — authoritative source of truth
├── research/
│   └── {task-id}.md      # Cached research brief per task
├── checkpoints/
│   └── {timestamp}.json  # Rolling window of last 10 state snapshots
├── progress/
│   └── log.md            # Append-only session activity log
├── artifacts/
│   └── {task-id}/        # Output files produced by task execution
├── .locks/
│   └── {name}.lock       # Exclusive O_EXCL locks (stale >30s are broken)
└── temp/
    └── .write-{uuid}     # Temporary files used during atomic rename
```

State writes are transactional: the shared library (`lib/pm-state.mjs`) takes
an exclusive lock, validates against the JSON schemas, writes to a temp file,
then atomically renames into place. The `pm-mcp` MCP server (registered in the
plugin manifest) is the only supported way for agents to mutate tasks —
never hand-edit `tasks.json`.

## pm-mcp Server Tools

The plugin ships a stdio MCP server that agents call via `mcp__pm-mcp__*`:

| Tool | Purpose |
|------|---------|
| `pm_list_projects` | Enumerate every project with status + task counts |
| `pm_get_project` / `pm_get_tasks` / `pm_get_task` | Read project + task state |
| `pm_next_task` / `pm_unblocked_tasks` | Scheduler queries (priority × critical-path) |
| `pm_update_task_status` | Validated status transitions |
| `pm_add_task` / `pm_complete_task` / `pm_block_task` | Mutations |
| `pm_checkpoint` | Force-write a state snapshot |
| `pm_get_research` / `pm_put_research` | Manage research briefs |
| `pm_validate` | Run schema validation on the project |

---

## Design Principles

**Interview first**
Every project starts with a structured 8-phase interview. No assumptions are made
about goals, scope, or timeline. The interview output feeds directly into the
decomposition phase.

**Research before execution**
No task is executed without a research brief. The deep-researcher agent gathers
context from the codebase, documentation, and external sources before the
task-executor touches any files.

**Human in the loop**
Tasks with risk score > 7 automatically pause and ask for confirmation. Blocked
tasks surface to the user immediately. The `/pm:focus` command lets users steer
the autonomous loop toward specific areas.

**Atomic state**
All writes to `tasks.json` go through a temp-file → rename pattern. Checkpoints
are saved automatically on Stop and can be restored at any time with `/pm:checkpoint`.

**Micro-tasks only**
No task over 30 minutes executes directly. The decomposer enforces 5-15 minute
granularity. This keeps progress granular, makes validation tractable, and
reduces the blast radius of any single failure.

**Model routing**
Opus handles architecture, interviewing, and council review. Sonnet handles
decomposition, research, execution, and quality review. Haiku handles monitoring,
checkpointing, and reporting. This keeps costs proportional to task complexity.

---

## Requirements

- Claude Code with the plugin system enabled
- Node.js 20+ (used by hook scripts, shared lib, and pm-mcp server)
- Internet access for deep research (Perplexity MCP or Context7 MCP)
- Optional: PM platform API credentials for sync features

## Development

Run the plugin's unit + integration tests from the repo root:

```
pnpm test:pm-plugin
```

Tests live under `plugins/project-management-plugin/tests/` and cover the
shared state library (atomic writes, O_EXCL locking, schema validation,
scheduler scoring) plus the pm-mcp server (end-to-end JSON-RPC round-trips).
