# Upstream Asks — Claude Code CLI / Agent Tool

Items that require changes to Claude Code itself (the CLI, the Agent tool, the hooks subsystem
or plugin-manifest schema) and cannot be shipped from plugin-land alone. Each has empirical
evidence from session telemetry; file one Anthropic issue per group with links back to this
document.

---

## O1 — Context preflight in the Agent tool

### Problem
The Agent tool rejects prompts with "Prompt is too long" **after** forwarding context and
attempting a spawn, costing ~2.3-2.7s per rejection. The caller has no way to know the budget
in advance.

### Evidence
- One session observed 2 rejections in 9 spawns (22% reject rate).
- Both rejections had prompts around ~900 words — not objectively long in isolation, but
  combined with the forwarded CLAUDE.md chain + plugin CLAUDE.md + rules, total context
  exceeded the subagent budget.
- Same prompt shape sent to **named specialists** (which have their own focused system prompts)
  succeeded at ~200-400 words.

### Ask
Expose a pre-spawn context estimate in the Agent tool:

```
Agent({...}) → returns one of:
  - { ok: true, spawned: agentId }
  - { ok: false, reason: "over_budget", budgetTokens: N, promptTokens: M, inheritedTokens: K }
```

Callers can react (shrink, switch subagent_type) before eating the 2.3s roundtrip.

---

## O2 — `autoLoadInSubagentCwd` plugin-manifest flag

### Problem
When a subagent's `cwd` is inside a plugin directory, that plugin's `CLAUDE.md` is auto-loaded.
For some plugins (e.g. `scrapin-aint-easy`'s interview-first philosophy prose at 6KB) this is
user-facing guidance that is pure overhead during a read-only upgrade audit. There is no
per-plugin opt-out today.

### Ask
Plugin manifest field:

```json
{
  "contextEntry": {
    "autoLoadInSubagentCwd": false
  }
}
```

When `false`, the plugin's `CLAUDE.md` is not auto-loaded in subagent contexts (main session
still loads it). Defaults to `true` for back-compat.

---

## O4 — Auto-retry on "Prompt is too long"

### Problem
When a spawn rejects for prompt-length reasons, the Agent tool gives up immediately. A well-
known mitigation (compress tool definitions, drop subsystem summaries, try again once) is not
attempted automatically.

### Ask
On "Prompt is too long" rejection, the Agent tool transparently retries once with a compressed
context envelope (drop optional tool schemas / non-essential metadata). Only if the retry
still rejects does it surface the failure to the caller.

---

## O5 — Per-agent deadline parameter

### Problem
Agents can run for an arbitrary amount of time. In one session, the architecture-specialist ran
**490 seconds** (8 minutes, 43 tool uses) — 8× the fastest agent in the same council. No way to
say "give me what you have at T=300s".

### Ask
Add to `Agent` tool input:

```
{
  maxDurationMs: 300000,
  onDeadline: "return_partial" | "kill"  // default "kill"
}
```

When `return_partial`, the Agent tool signals the subagent to produce its best current
summary. Subagents opt-in by honoring a deadline check in their system prompt.

---

## O6 — Background-aware Stop hook

### Problem
The Stop hook fires when the foreground turn ends, even when background Agent / Bash tasks are
still healthily running. In one session, the hook fired 8+ times during a legitimate 7-agent
parallel wait, with each firing burning a turn on a "task incomplete" false-positive.

### Evidence
- 7 parallel specialist agents, longest running 490s.
- Stop hook fired ≥8 times across the wait period.
- Each firing required the orchestrator to produce a "still waiting" ack, consuming context
  and tokens.

### Ask
Stop hook sees a new field in its input JSON:

```json
{
  "hook_event_name": "Stop",
  "background_tasks_active": [
    { "type": "agent", "id": "...", "started_at": "...", "duration_ms": 123456 },
    { "type": "bash", "id": "...", "started_at": "...", "duration_ms": 123456 }
  ]
}
```

The hook can decide (via its own script) whether to treat the turn as complete. Claude itself
gains a reflex rule: if `background_tasks_active.length > 0 && all_healthy`, the Stop event is
a healthy wait, not an incomplete task.

Alternatively: a first-class `background_tasks_active` flag in the runtime prevents the hook
from firing until the last background task terminates.

---

## Filing notes

- Each of O1, O4, O5 maps to one or two small Agent-tool changes; file as separate issues.
- O2 is a plugin-manifest schema addition; file under the plugin system.
- O6 is a hooks-subsystem change; file under hooks.

Track responses back to this file; if any get implemented upstream, remove from here and update
the `claude-code-expert` plugin to use the new capabilities.

## Evidence archive

Session telemetry supporting the asks above lives in the PR that accompanied this document
(see commit history). Includes: per-agent wall-clock distribution, reject rate, Stop hook
firing count, and prompt-size histogram.
