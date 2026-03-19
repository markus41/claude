---
name: deep-code-intelligence
description: Evidence-driven workflow for hard coding problems, architecture decisions, root-cause analysis, and high-stakes implementation planning in Claude Code
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
triggers:
  - hard bug
  - deep analysis
  - root cause
  - architecture decision
  - smartest approach
  - evidence driven
  - principal engineer
---

# Deep Code Intelligence

Use this skill when the task is too important, ambiguous, or coupled for a fast “implement first” approach.

## Goal
Increase solution quality by forcing Claude to gather evidence, expose hidden assumptions, and compare multiple paths before changing code.

## Core loop

### 1. Build a repo fingerprint
Collect only the facts that change the decision:
- key modules and ownership boundaries
- hot paths and integration seams
- build/test entrypoints
- persistence and migration surfaces
- feature flags / config gates

### 2. Extract constraints
Split into:
- **explicit constraints** — user asks, tests, types, configs, docs
- **implicit constraints** — backward compatibility, ordering, idempotency, auth, observability, performance envelopes

### 3. Create a hypothesis ladder
Do not settle on one explanation early.
Generate:
- most likely explanation,
- strongest competing explanation,
- weird but costly explanation.

Prefer the next step that invalidates bad theories quickly.

### 4. Build an evidence matrix
Use a compact table:

| Topic | Evidence | Confidence | Next check |
|---|---|---:|---|
| Cause of failure | stack trace + source path + failing test | 0.78 | reproduce with logging |

If confidence is low, say so plainly.

### 5. Compare options
Every serious recommendation should beat at least one credible alternative.
Score options on:
- correctness
- complexity
- blast radius
- reversibility
- validation speed
- long-term maintainability

### 6. Stage validation
Front-load cheap validation:
1. static checks / grep / type clues
2. unit or focused tests
3. integration checks
4. runtime observation
5. broad regression sweep

### 7. Capture residual risk
End with what is still unknown and what would change the recommendation.

## Heuristics
- Prefer narrow fixes when system understanding is weak.
- Prefer structural fixes when the same class of defect is likely to recur.
- Prefer observability improvements when certainty is low.
- Prefer reversible migrations over one-shot transformations.
- Prefer behavior-oriented tests over implementation snapshots.

## Escalation guide
| Situation | Escalate to | Why |
|---|---|---|
| Need repo-wide synthesis | `principal-engineer-strategist` | Better architectural judgement and option scoring. |
| Need multi-track execution | `team-orchestrator` | Handles parallel work and audit loops. |
| Need library or framework truth | `research-orchestrator` + Context7 | Reduces hallucination risk and validates API usage. |
| Need final pressure-test | `audit-reviewer` or `/cc-council` | Catches blind spots before delivery. |

## Minimal output standard
A good response should include:
- problem frame,
- evidence summary,
- constraints,
- at least 2 options,
- recommendation,
- validation plan,
- residual risk.
