# Agent Lifecycle Management

Complete guide to managing sub-agent and teammate lifecycle in Claude Code — health checks, idle detection, cleanup, retention, and the mandatory audit loop.

## The Orchestration-First Principle

Claude should **prefer to orchestrate** rather than do work directly. When a task has multiple components or would benefit from specialized review:

1. Break the task into work units
2. Assign each to the best-fit agent type
3. Run agents in parallel where possible
4. Audit every agent's output
5. Clean up when done

**Direct work is the fallback, not the default.**

## Agent Lifecycle States

```
                    ┌──────────┐
          ┌────────→│  active   │──────────┐
          │         └──────────┘           │
          │              │                 │
     spawn/resume    no output          completes
          │           >60s                 │
          │              ↓                 ↓
    ┌──────────┐   ┌──────────┐    ┌──────────┐
    │ spawning │   │   idle   │    │ completed│
    └──────────┘   └──────────┘    └──────────┘
                        │                 │
                   no response         collected?
                     >120s                │
                        ↓            yes/   \no
                   ┌──────────┐      ↓       ↓
                   │ stalled  │   released  orphaned
                   └──────────┘
                        │
                   terminate
                        ↓
                   ┌──────────┐
                   │ errored  │
                   └──────────┘
```

## Health Check Protocol

### When to Check
- **During orchestration**: Every 2 minutes
- **After fan-out**: Once all agents are spawned
- **Before fan-in**: Before collecting results
- **On completion**: Before producing final output

### How to Check

For **foreground agents**: They return results when complete. No polling needed.

For **background agents**: Use `SendMessage` to check in:
```
SendMessage(to: "agent-id", message: "Status check: progress on your task?")
```

For **agent teams**: Teammates communicate via shared task list. Check `TaskList` for stale assignments.

### Check-In Message Template
```
"Status check on your assigned task: [{task}].
Reply with one of:
- WORKING: {current activity}
- BLOCKED: {what's blocking}
- DONE: {summary}
- NEEDS_HELP: {what you need}"
```

## Idle Detection & Cleanup

### Detection Signals
| Signal | Threshold | Action |
|--------|-----------|--------|
| No output | 60s | Send check-in |
| No response to check-in | 30s | Mark stalled |
| Stalled | 180s | Terminate, reassign |
| Completed but uncollected | 60s | Collect results |
| Errored | Immediate | Collect partial, log |

### Cleanup Procedure

```yaml
cleanup_steps:
  1_identify:
    - List all agent IDs from spawn records
    - Check each agent's last known state
    - Identify: completed, idle, stalled, errored

  2_collect:
    - For completed agents: gather results
    - For errored agents: gather partial output + error
    - For stalled agents: attempt final check-in

  3_terminate:
    - Release completed agents (results collected)
    - Terminate stalled agents (no response after 3 min)
    - Terminate errored agents (unrecoverable)
    - Keep active agents running

  4_report:
    - Log cleanup summary
    - Report any lost work
    - Suggest task reassignment if needed
```

### Token-Aware Cleanup

Track cumulative token usage across all agents:

```
Per-agent budget = total_budget / num_agents
If agent exceeds 150% of per-agent budget → flag for review
If total usage exceeds 80% of budget → switch to cheaper models
If total usage exceeds 95% → terminate non-essential agents
```

## The Mandatory Audit Loop

**Every agent's work must be audited before acceptance.**

### Audit Flow

```
Agent completes task
       ↓
Orchestrator spawns audit agent (code-reviewer or audit-reviewer)
       ↓
Audit agent reviews:
  - Completeness (did it do everything asked?)
  - Correctness (is the output right?)
  - Consistency (does it match project style?)
  - Security (any vulnerabilities introduced?)
  - Tests (are new things tested?)
       ↓
Audit verdict:
  PASS → accept, merge into deliverables
  PASS_WITH_NOTES → accept, log improvement notes
  FAIL → send back to original agent with specific fixes
           ↓
         Re-do (max 2 rework rounds)
           ↓
         Re-audit
           ↓
         If still fails → escalate to user
```

### Audit Agent Selection

| Original Agent | Audit Agent | Focus |
|----------------|-------------|-------|
| Builder/Implementer | `code-reviewer` | Correctness, completeness |
| Test writer | `code-reviewer` | Test quality, coverage |
| Security reviewer | `audit-reviewer` (opus) | False positives, missed vectors |
| Researcher | `audit-reviewer` (opus) | Source quality, bias |
| Doc writer | `code-reviewer` | Accuracy, completeness |
| Infrastructure | `security-reviewer` | Misconfigs, blast radius |

### Audit Depth Levels

```yaml
audit_levels:
  quick:
    checks: [completeness, correctness]
    model: haiku
    cost: low

  standard:
    checks: [completeness, correctness, consistency, security]
    model: sonnet
    cost: medium

  thorough:
    checks: [completeness, correctness, consistency, security, testing, documentation]
    model: opus
    cost: high
```

## Agent Team Lifecycle

### For Claude Code Agent Teams (Experimental)

Teams have additional lifecycle considerations:

```yaml
team_lifecycle:
  spawn:
    - Lead session creates team
    - Lead defines task list with dependencies
    - Teammates join and claim tasks

  active:
    - Teammates self-coordinate via TaskList
    - Direct messaging via SendMessage
    - Lead monitors overall progress

  idle_detection:
    - Teammate hasn't claimed new task in 120s
    - Teammate's current task hasn't progressed
    - TeammateIdle hook fires

  cleanup:
    - Lead sends final status check to all teammates
    - Collect all teammate outputs
    - TeamDelete to dissolve team
    - Prune any worktrees created

  audit:
    - Lead reviews each teammate's work
    - Cross-check: teammate A audits teammate B's output
    - Final synthesis by lead
```

### Cross-Audit Pattern

In teams of 3+, use cross-auditing:

```
Agent A completes → Agent B audits A's work
Agent B completes → Agent C audits B's work
Agent C completes → Agent A audits C's work
```

This distributes audit load and provides diverse perspectives.

## Retention Policies

### When to Keep an Agent Alive
- **Pipeline stage**: Agent is between steps, waiting for upstream input
- **Expensive context**: Agent has loaded large codebase context that would cost tokens to rebuild
- **Follow-up planned**: User may ask for iterations on agent's work
- **Background monitoring**: Agent is running periodic checks

### When to Terminate
- **Task complete, results collected**: No further value
- **Idle >3 minutes, no planned follow-up**: Wasting potential tokens
- **Stalled despite check-ins**: Likely stuck, won't recover
- **Budget exceeded**: Cost ceiling reached
- **Circular work**: Agent is repeating itself

## Best Practices

1. **Always track agent IDs** — maintain a mental or written registry of every agent spawned
2. **Collect results immediately** — don't let completed agents sit uncollected
3. **Use background mode sparingly** — foreground is easier to manage
4. **Match model to task** — haiku for research, sonnet for implementation, opus for architecture/audit
5. **Set max_turns** — prevent agents from running indefinitely
6. **Use worktree isolation** — for agents that write code, prevent conflicts
7. **Audit before accepting** — never skip the second-round review
8. **Clean up before finishing** — no orphaned agents when orchestration ends
