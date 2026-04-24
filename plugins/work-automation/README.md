# work-automation

Universal internal work-automation kit. Project-agnostic. Internal-only (no external services beyond Claude Code + Harness MCP).

## What's inside

| Surface | Content |
|---|---|
| **rules/ultra-mode.md** | ULTRA-mode constitution (20 sections). Auto-loads every session. Extends — never replaces — existing rules. |
| **skills/work-unit-protocol** | ULTRA §13 Work Unit Protocol — what/why/tests/deps/reuse/risks/follow-ups/completion report template. |
| **skills/claude-code-automation** | Coverage of Claude Code surface: hooks, skills, commands, plugins, agents, MCP, scheduled tasks, headless, SDK, fullscreen, channels, routines, checkpointing. |
| **skills/harness-automation** | Harness Code + CI/CD + Pipelines + PR-workflow patterns. Uses `mcp__harness__*` tools when available; shell `hc` CLI otherwise. |
| **commands/wa-work-unit** | Start a new work unit (scope, ULTRA checklist, report stub). |
| **commands/wa-report** | Generate Work Unit Protocol report from current session. |
| **commands/wa-schedule** | Create a scheduled Claude task via Desktop scheduled-tasks MCP. |
| **commands/wa-pipeline** | Harness pipeline ops (list/get/execute/status). |
| **agents/work-automation-orchestrator** | Coordinate multi-step work per ULTRA §13. |
| **agents/work-unit-reporter** | Produce ULTRA-compliant reports on demand. |

## Design principles

1. **Universal** — no project-specific hard-coding. All tenant/project/repo IDs come from env or prompts.
2. **Internal-only** — relies on installed MCPs and CLIs the user already has. No new outbound services.
3. **Reuse first** — defers to existing plugins (`harness-platform`, `claude-code-expert`, `tenant-management-kit`, `jira-orchestrator`) rather than duplicating them.
4. **ULTRA-governed** — every command and skill honors the ULTRA constitution: idempotence, observability, reversibility, reuse, simplification.

## Install

Already registered in the claude-orchestration marketplace. Enable with:

```
/plugin install work-automation
```
