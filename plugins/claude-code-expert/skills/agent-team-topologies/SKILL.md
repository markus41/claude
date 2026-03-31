---
description: Agent-team topology kits — 5 production-ready team configurations with task decomposition, file ownership, worktree guidance, and quality-gate hooks
model: claude-opus-4-6
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
---

# Agent-Team Topology Kits

## Overview

Agent teams parallelize work that would be serial in a single agent. The right topology depends on:
- **Complexity**: How many independent concerns are there?
- **Risk**: How many reversibility gates are needed?
- **Speed**: Can phases run in parallel or must they sequence?

Use the topology selector below, then follow the kit for your chosen topology.

## Topology Selector

| Signal | Topology | Why |
|--------|----------|-----|
| Frontend + backend + tests all need changes | Frontend-Backend-Test Squad | Clear file ownership separation |
| Need architecture review before implementation | Architect-Implementer-Reviewer Trio | Design gate before code |
| Hard bug, multiple hypotheses | Competing-Hypotheses Debug Council | Parallel root-cause exploration |
| PR needs security + perf + test review | Security-Performance-Test Review Board | Parallel review disciplines |
| Large doc migration or README overhaul | Docs Migration Sprint | Parallel document processing |

---

## Topology 1: Frontend-Backend-Test Squad

**Use when:** A feature requires coordinated changes across UI, API, and test layers.

**Team composition:**
- `frontend-agent` (Sonnet) — edits `src/components/`, `src/pages/`, `src/hooks/`
- `backend-agent` (Sonnet) — edits `src/api/`, `src/services/`, `src/db/`
- `test-agent` (Sonnet) — edits `src/test/`, `*.test.ts`, `*.spec.ts`
- `coordinator` (Opus, main context) — decomposes, coordinates, merges results

**File ownership rules:**
- frontend-agent: ONLY files matching `src/components/**`, `src/pages/**`, `src/hooks/**`
- backend-agent: ONLY files matching `src/api/**`, `src/services/**`, `src/db/**`
- test-agent: ONLY files matching `**/*.test.*`, `**/*.spec.*`, `src/test/**`
- Shared files (types, constants): backend-agent owns, frontend-agent reads

**Worktree guidance:**
- Run frontend-agent and backend-agent in separate worktrees (`isolation: "worktree"`) when their changes don't share files
- Keep test-agent in main worktree until frontend and backend complete — it reads both outputs
- Merge order: backend → frontend → tests

**Coordination protocol:**
```
Phase 1 (parallel): frontend-agent + backend-agent implement their slices
Phase 2 (sequential): test-agent writes tests covering both slices
Phase 3 (main): coordinator reviews, resolves any type conflicts, commits
```

**Quality gate hooks:**
- After Phase 1: Run TypeScript type-check across all changed files
- After Phase 2: Run test suite; block if any new tests fail
- Merge condition: All 3 agents report DONE with 0 type errors

**Example decomposition:**
```
Feature: Add user profile editing

frontend-agent: ProfileEditForm.tsx, useProfile.ts, profile.css
backend-agent: /api/users/[id].ts, userService.ts, userRepository.ts
test-agent: ProfileEditForm.test.tsx, userService.test.ts, api/users.test.ts
```

**Cost estimate:** Medium (3 Sonnet agents + 1 Opus coordinator) — ~$0.05-0.15 per feature

---

## Topology 2: Architect-Implementer-Reviewer Trio

**Use when:** The task involves design decisions that should be validated before code is written.

**Team composition:**
- `architect` (Opus) — reads codebase, proposes design, writes spec
- `implementer` (Sonnet) — executes the spec
- `reviewer` (Opus) — reviews against spec and quality criteria

**File ownership rules:**
- architect: READ-ONLY. Writes only to `.claude/designs/<feature>.md`
- implementer: Writes to all production code files per spec
- reviewer: READ-ONLY. Writes only to `.claude/reviews/<feature>.md`

**Worktree guidance:**
- architect runs in main context (needs full codebase visibility)
- implementer runs in a worktree branch (`feature/<name>`)
- reviewer runs in main context on the implementer's diff

**Coordination protocol:**
```
Phase 1: architect analyzes codebase and writes design spec to .claude/designs/<name>.md
Phase 2: [HUMAN GATE] Review spec before implementation — stop here
Phase 3: implementer reads spec and implements
Phase 4: reviewer reads spec + diff, writes verdict to .claude/reviews/<name>.md
Phase 5: [HUMAN GATE] Review verdict before merge
```

**Design spec format (architect output):**
```markdown
# Design: <feature>

## Goal
<one paragraph>

## Approach
<chosen approach with rationale>

## Alternatives considered
| Option | Why rejected |
|--------|-------------|

## Files to create/modify
| File | Change | Risk |
|------|--------|------|

## Interface contracts
<API signatures, data shapes, event types>

## Acceptance criteria
- [ ] <testable criterion>
```

**Cost estimate:** High (2 Opus + 1 Sonnet) — ~$0.20-0.50 per feature. Justified for architectural decisions.

---

## Topology 3: Competing-Hypotheses Debug Council

**Use when:** A hard bug with multiple plausible root causes. Single-agent debugging gets anchored on the first plausible explanation.

**Team composition:**
- `hypothesis-a-agent` (Sonnet) — investigates first hypothesis
- `hypothesis-b-agent` (Sonnet) — investigates second hypothesis
- `hypothesis-c-agent` (Sonnet) — investigates third hypothesis
- `synthesis-agent` (Opus) — reads all 3 reports, picks winner, proposes fix

**File ownership rules:**
- All hypothesis agents: READ-ONLY (no writes during investigation)
- synthesis-agent: writes fix proposal to `.claude/debug/<issue>.md`

**Worktree guidance:**
- All in main worktree (read-only — no isolation needed)
- Run all 3 hypothesis agents in parallel for maximum speed

**Coordination protocol:**
```
Phase 1 (coordinator): Parse error, form 3 hypotheses, assign one to each agent
Phase 2 (parallel): 3 hypothesis agents independently investigate their hypothesis
Phase 3 (synthesis): synthesis-agent reads all 3 reports, selects most evidence-backed root cause
Phase 4 (coordinator): Present synthesis to user, await approval to fix
```

**Hypothesis agent output format:**
```
HYPOTHESIS: <one sentence>
Evidence FOR:
  - <file:line>: <what it shows>
Evidence AGAINST:
  - <fact that doesn't fit>
Confidence: HIGH / MEDIUM / LOW
If true, fix would be: <description>
```

**Synthesis agent output format:**
```
DEBUG SYNTHESIS

Winning hypothesis: <agent> — <hypothesis>
Confidence: HIGH / MEDIUM / LOW
Key evidence: <2-3 bullet points>

Rejected hypotheses:
  - Hypothesis A: <why eliminated>
  - Hypothesis B: <why eliminated>

PROPOSED FIX:
  File: <path>
  Change: <description>
  Risk: <side effects>
```

**Cost estimate:** Low-Medium (3 Sonnet + 1 Opus, all read-only) — ~$0.05-0.10 per bug

---

## Topology 4: Security-Performance-Test Review Board

**Use when:** A PR or change needs parallel review across multiple disciplines.

**Team composition:**
- `security-reviewer` (Opus) — checks for security vulnerabilities, injection, credentials exposure
- `performance-reviewer` (Sonnet) — checks for N+1 queries, bundle size, rendering performance
- `test-coverage-reviewer` (Sonnet) — checks for missing tests, flaky patterns, coverage gaps
- `chair` (Opus, main context) — aggregates all reviews into final verdict

**File ownership rules:**
- All reviewers: READ-ONLY
- chair: writes aggregated verdict to PR description or `.claude/reviews/pr-<n>.md`

**Worktree guidance:**
- All reviewers in main worktree (read-only, no isolation needed)
- Run all 3 reviewers in parallel — they're independent

**Review scope:**
- security-reviewer: every changed file, git diff, dependency changes
- performance-reviewer: React components (render count), DB queries, bundle imports
- test-coverage-reviewer: changed files without corresponding test files, coverage delta

**Output format (each reviewer):**
```
REVIEW: <discipline>
Verdict: PASS | REQUEST_CHANGES | BLOCK

BLOCK items:
  - <file:line>: <critical issue>

REQUEST items:
  - <file:line>: <should fix>

SUGGEST items:
  - <file:line>: <optional improvement>

PASS items:
  - <what was checked and found clean>
```

**Chair aggregated verdict:**
```
PR REVIEW BOARD VERDICT
Final verdict: APPROVE | REQUEST_CHANGES | BLOCK

Security: PASS | ⚠️ REQUEST | 🚫 BLOCK
Performance: PASS | ⚠️ REQUEST | 🚫 BLOCK
Test Coverage: PASS | ⚠️ REQUEST | 🚫 BLOCK

Consolidated action items:
  MUST FIX: <list>
  SHOULD FIX: <list>
  CONSIDER: <list>
```

**Cost estimate:** Medium (2 Opus + 2 Sonnet, read-only) — ~$0.10-0.20 per PR

---

## Topology 5: Docs Migration Sprint

**Use when:** Large documentation update — multiple files need rewriting, restructuring, or migrating to a new format.

**Team composition:**
- `doc-agent-1` (Sonnet) — first batch of documents
- `doc-agent-2` (Sonnet) — second batch of documents
- `doc-agent-3` (Sonnet) — third batch of documents
- `editor-agent` (Opus) — reviews consistency, cross-references, tone

**File ownership rules:**
- Divide document set equally among doc agents (no overlapping files)
- editor-agent: read-only until all doc agents complete; then edits for consistency

**Worktree guidance:**
- Each doc-agent in its own worktree (prevents file conflicts)
- Merge worktrees back to main after each doc-agent completes
- editor-agent runs in main context on merged result

**Coordination protocol:**
```
Phase 1 (coordinator): List all docs, divide into 3 batches, generate style guide
Phase 2 (parallel): 3 doc-agents rewrite/migrate their assigned batch
Phase 3 (sequential): Merge all 3 worktrees (resolve conflicts if any)
Phase 4 (serial): editor-agent does consistency pass
Phase 5 (coordinator): Final review
```

**Style guide injection:** Coordinator writes `.claude/doc-sprint-style.md` before launching agents. All agents read it first.

**Cost estimate:** Low (3 Sonnet + 1 Opus, mostly write) — ~$0.10-0.30 per sprint. Very cost-effective for large doc migrations.

---

## Choosing Between Topologies

```
Is it a bug?
  └─ Multiple plausible causes? → Competing-Hypotheses Debug Council
  └─ Single obvious area? → debugger subagent (not a topology)

Is it a feature?
  └─ Crosses multiple layers (UI + API + DB)? → Frontend-Backend-Test Squad
  └─ Significant architecture decision? → Architect-Implementer-Reviewer Trio
  └─ Pure implementation with clear spec? → implementer subagent (not a topology)

Is it a review?
  └─ Security + performance + test concerns? → Security-Performance-Test Review Board
  └─ Quick review? → code-reviewer subagent (not a topology)

Is it documentation?
  └─ > 10 documents to update? → Docs Migration Sprint
  └─ Single doc? → doc-writer subagent (not a topology)
```

---

## When NOT to use an agent team

Avoid agent teams for:
- **Single-file changes** — overhead exceeds benefit
- **Exploratory work** — single agent with cc-intel is better
- **Tight feedback loops** — when back-and-forth is needed, teams have coordination cost
- **Unclear decomposition** — if you can't clearly assign file ownership, don't parallelize

Rule of thumb: agent teams are worth it when the parallel work takes > 5 minutes per agent and agents won't block each other.

---

## See Also
- `agent-teams` skill — core team patterns, worktree coordination
- `agent-teams-advanced` skill — eval-optimizer loop, blackboard council
- `autonomy-profiles` skill — how to deploy teams in autonomous mode
- `agents/autonomy-planner.md` — task decomposition before team launch
