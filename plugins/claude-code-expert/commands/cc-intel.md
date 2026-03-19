---
name: cc-intel
intent: Run a deep code intelligence pass that builds repo fingerprints, extracts constraints, evaluates options, and produces an evidence-backed implementation strategy
inputs:
  - task
  - scope
  - depth
  - mode
risk: medium
cost: medium
tags:
  - claude-code-expert
  - command
  - intelligence
  - planning
  - debugging
  - architecture
---

# /cc-intel — Deep Code Intelligence Mode

Use `/cc-intel` when a task is ambiguous, high impact, architecturally risky, or likely to hide non-obvious coupling. This command upgrades Claude from “helpful implementer” into a **principal engineer with receipts**.

## What it does

`/cc-intel` runs a seven-part analysis loop before implementation:

1. **Repo fingerprint** — identify modules, ownership boundaries, architecture seams, dependency gravity, and likely change surface.
2. **Constraint extraction** — list explicit requirements, hidden invariants, contracts, backward-compatibility needs, and operational limits.
3. **Hypothesis tree** — enumerate likely root causes or solution shapes instead of locking onto the first idea.
4. **Evidence collection** — tie each important claim to code evidence, tests, configs, docs, or command output.
5. **Option scoring** — compare at least 2-4 approaches on correctness, complexity, blast radius, reversibility, and time-to-validate.
6. **Execution strategy** — define sequencing, safety checks, validation checkpoints, and rollback plan.
7. **Post-change review** — verify that the chosen fix actually resolves the original problem without creating nearby regressions.

## Recommended use cases
- Large refactors
- Cross-cutting bug hunts
- Performance regressions
- Architectural decisions
- “Make this much smarter” requests
- Plugin / agent / MCP design work
- Any task where a wrong assumption would waste hours

## Usage

```bash
/cc-intel "upgrade the auth flow"
/cc-intel "find the real cause of flaky websocket reconnects" --mode debug
/cc-intel "evaluate 3 approaches for plugin memory persistence" --mode architecture
/cc-intel "plan the safest migration for our workflow store" --depth exhaustive
```

## Flags

- `--mode [implementation|debug|architecture|performance|migration|review]`
- `--scope <path-or-module>`
- `--depth [standard|deep|exhaustive]`
- `--options <n>` minimum number of options to compare (default 3)
- `--changed-only` bias analysis to current diff or selected files
- `--with-council` run a follow-up `/cc-council` review on the proposed approach
- `--with-research` require official-doc validation for external libraries
- `--dry-run` print the intelligence plan without executing it

## Operating protocol

### Phase 1 — Frame the problem
Produce:
- problem statement
- success criteria
- non-goals
- confidence risks
- missing information list

### Phase 2 — Build the evidence table
For each major claim, record:

| Claim | Evidence | Confidence | Gaps |
|---|---|---:|---|
| e.g. reconnect loop is timer-driven | `src/lib/websocket/reconnection.ts` + failing test | 0.84 | need runtime log |

Do **not** move into solutioning until the main claims have evidence.

### Phase 3 — Map constraints and invariants
Always check for:
- API contracts
- persistence/data-shape compatibility
- concurrency assumptions
- retry/idempotency behavior
- security boundaries
- migration ordering
- test harness assumptions
- generated files or codegen boundaries

### Phase 4 — Generate competing options
Every option must include:
- concise description
- expected benefits
- expected risks
- blast radius
- reversibility
- easiest validation command

### Phase 5 — Choose and stage execution
Prefer plans with:
- narrower blast radius
- stronger observability
- earlier validation checkpoints
- cheaper rollback
- less hidden coupling

### Phase 6 — Implement or hand off
If the task needs broad execution, hand the plan to `/cc-orchestrate` or the `team-orchestrator`.
If the task needs high-judgement synthesis, invoke `principal-engineer-strategist` before code changes.

### Phase 7 — Verify original intent
Re-check the exact user ask and compare it to the delivered change. Catch “technically correct, strategically wrong” outcomes.

## Output contract

Return results in this shape:

```markdown
## Deep Intelligence Summary
### Problem Frame
### Repo Fingerprint
### Constraints & Invariants
### Hypothesis Tree
### Option Scorecard
### Recommended Approach
### Execution Plan
### Validation Matrix
### Residual Risks
### Follow-up Questions
```

## Quality bar

A strong `/cc-intel` run should leave the user with:
- a sharper problem definition than they started with,
- fewer hidden assumptions,
- an explicit reason the chosen path beats alternatives,
- and a plan that can survive scrutiny from senior engineers.
