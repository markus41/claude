# Scheduled Tasks

> Use `/loop` and cron scheduling tools to run prompts repeatedly, poll for status, or set one-time reminders within a Claude Code session.
> Requires Claude Code v2.1.72+.

## Overview

Scheduled tasks let Claude re-run a prompt automatically on an interval. Use them to:
- Poll a deployment status
- Babysit a PR review cycle
- Check on a long-running build
- Set reminders during a session

Tasks are **session-scoped**: they live in the current process and are gone when you exit. For durable scheduling, use Cloud, Desktop, or GitHub Actions.

## Scheduling Options Comparison

| | Cloud | Desktop | `/loop` |
|:--|:------|:--------|:--------|
| **Runs on** | Anthropic cloud | Your machine | Your machine |
| **Requires machine on** | No | Yes | Yes |
| **Requires open session** | No | No | Yes |
| **Persistent across restarts** | Yes | Yes | No |
| **Access to local files** | No (fresh clone) | Yes | Yes |
| **MCP servers** | Connectors per task | Config files + connectors | Inherits from session |
| **Permission prompts** | No (autonomous) | Configurable | Inherits from session |
| **Minimum interval** | 1 hour | 1 minute | 1 minute |

## Schedule with /loop

The quickest way to schedule a recurring prompt:

```
/loop 5m check if the deployment finished and tell me what happened
```

### Interval Syntax

| Form | Example | Parsed |
|:-----|:--------|:-------|
| Leading token | `/loop 30m check the build` | Every 30 minutes |
| Trailing `every` clause | `/loop check the build every 2 hours` | Every 2 hours |
| No interval | `/loop check the build` | Default: every 10 minutes |

Units: `s` (seconds, rounded to nearest minute), `m` (minutes), `h` (hours), `d` (days).

### Loop Over Commands

Schedule any command or skill:
```
/loop 20m /review-pr 1234
```

## One-Time Reminders

Use natural language for single-fire tasks:
```
remind me at 3pm to push the release branch
```
```
in 45 minutes, check whether the integration tests passed
```

## Manage Tasks

```
what scheduled tasks do I have?
cancel the deploy check job
```

### Underlying Tools

| Tool | Purpose |
|:-----|:--------|
| `CronCreate` | Schedule new task (5-field cron, prompt, recurrence flag) |
| `CronList` | List all tasks with IDs, schedules, prompts |
| `CronDelete` | Cancel task by ID |

Max 50 tasks per session. Each has an 8-character ID.

## How Tasks Run

- Scheduler checks every second for due tasks
- Tasks fire **between your turns** (low priority), not mid-response
- If Claude is busy, task waits until current turn ends
- All times in **local timezone** (not UTC)

### Jitter
- Recurring: fire up to 10% of period late, capped at 15 min
- One-shot at :00 or :30: fire up to 90 seconds early
- Offset derived from task ID (deterministic)

### Three-Day Expiry
Recurring tasks auto-expire after 3 days. Fires one final time, then deletes itself. Recreate before expiry for longer runs, or use Cloud/Desktop for durable scheduling.

## Cron Expression Reference

5-field format: `minute hour day-of-month month day-of-week`

| Expression | Meaning |
|:-----------|:--------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour on the hour |
| `7 * * * *` | Every hour at :07 |
| `0 9 * * *` | Daily at 9am local |
| `0 9 * * 1-5` | Weekdays at 9am local |
| `30 14 15 3 *` | March 15 at 2:30pm local |

Day-of-week: `0`/`7` = Sunday through `6` = Saturday. No extended syntax (`L`, `W`, `?`, name aliases).

## CI/CD and Pipeline Integration

Scheduled tasks are powerful for build and deployment monitoring:

### Deploy Watch
```
/loop 2m check the deployment status of staging and report any failures
```

### Build Monitor
```
/loop 5m check if CI pipeline #1234 has completed. If it failed, analyze the logs and suggest fixes
```

### PR Babysitter
```
/loop 10m check PR #456 for new review comments and CI status changes
```

### Health Check Polling
```
/loop 1m curl the /health endpoint and alert me if it returns non-200
```

## Disable

Set `CLAUDE_CODE_DISABLE_CRON=1` to disable the scheduler entirely. Tools and `/loop` become unavailable.

## Limitations

- Tasks only fire while Claude Code is running and idle
- No catch-up for missed fires (fires once when idle, not once per missed interval)
- No persistence across restarts
- Session-scoped only (max 50 tasks)

## Cloud Scheduled Tasks

Cloud tasks run on Anthropic's infrastructure without your machine. They get a fresh repo clone via GitHub connector.

**Minimum interval:** 1 hour. **No local files.** Requires connector per task.

```bash
# Create via API
POST https://api.anthropic.com/v1/scheduled_tasks
{
  "name": "Weekly dep audit",
  "schedule": "0 8 * * 1",
  "model": "claude-sonnet-4-6",
  "prompt": "Audit npm dependencies for vulnerabilities...",
  "connectors": [{ "type": "github", "repo": "owner/repo" }]
}
```

**Best for:** Nightly/weekly jobs that run unattended. GitHub-native workflows. Tasks that must survive machine off.

## Desktop Scheduled Tasks

Desktop tasks run on your local machine via the Claude Desktop app. Full local file + MCP access. Require Desktop open.

**Minimum interval:** 1 minute. **Full local access.** Config files + connectors.

```
In Claude Desktop → Settings → Scheduled Tasks → New Task
Name: Daily PR Review
Schedule: 0 9 * * 1-5
Prompt: {your prompt}
Working directory: /path/to/repo
```

**Best for:** Daily dev workflows, tasks needing local filesystem, git, or local MCP servers.

## Use /cc-schedule for Blueprint Prompts

`/cc-schedule` generates optimized, guardrailed prompts for 6 common maintenance workflows, pre-configured for each target:

```bash
/cc-schedule pr-review --target desktop     # Daily PR review → Desktop task
/cc-schedule ci-triage --target loop        # CI triage → /loop command
/cc-schedule dep-audit --target cloud       # Dep audit → Cloud task
/cc-schedule docs-drift                     # Docs drift check
/cc-schedule release-check                  # Release readiness
/cc-schedule branch-hygiene                 # Branch cleanup
```

Each blueprint includes skip conditions, guardrails, branch naming policy, and a verification block. See `commands/cc-schedule.md` for full specifications.

## Prompt Guardrails for Scheduled Tasks

Every effective scheduled prompt needs these four sections:

```
SKIP CONDITIONS:
- If [condition], output "[message]" and stop.

STEPS:
1. [action]
2. [action]

GUARDRAILS:
- Never [dangerous action]
- Maximum [N] operations per run

VERIFICATION:
Output: {N} items processed, {M} actions taken, {K} skipped.
```

**Why:** Without skip conditions, tasks run wastefully. Without guardrails, autonomous tasks cause incidents.

## See Also

- [Cloud Scheduled Tasks](https://code.claude.com/docs/en/web-scheduled-tasks) — Durable cloud-based scheduling
- [Desktop Scheduled Tasks](https://code.claude.com/docs/en/desktop) — Local persistent scheduling
- [GitHub Actions](https://code.claude.com/docs/en/github-actions) — CI/CD schedule triggers
- [Channels](../channels-user-guide/SKILL.md) — Push events instead of polling
- [cc-schedule command](../../commands/cc-schedule.md) — Blueprint generator for 6 maintenance workflows
