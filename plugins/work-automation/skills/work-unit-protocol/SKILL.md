---
name: work-unit-protocol
description: Use when starting, tracking, or closing a discrete unit of work. Enforces ULTRA §13 reporting contract — what/why/tests/deps/reuse/risks/follow-ups/completion table. Invoke when user says "start work unit", "close work unit", "work unit report", or when a multi-step implementation task begins.
---

# Work Unit Protocol

A work unit is one scope-bounded outcome with a measurable completion criterion. This skill is the rhythm each unit follows — from kickoff through closing report.

## Phases

### 1. Kickoff
- Scope stated in **one sentence** with a measurable completion criterion.
- Scan existing tooling (installed plugins, skills, commands, agents, MCPs) — never re-build.
- Identify dependencies and blocked-by relationships.
- If creating or modifying a library, confirm no parallel module already exists.

### 2. Plan
- List artifacts to be produced with paths.
- List tests to be written (success path / idempotent / WhatIf / error).
- Identify library modules to extend vs. create. Default: extend.
- Note any policy files (`policies/*.json`) that must stay in sync.

### 3. Execute
- Each action emits an entry to `state/change-log.jsonl`.
- New code gets comment-based help + at least one Pester (or equivalent) test.
- Refactors preserve behavior; a paired test proves no regression.
- Commit cadence: small commits per sub-repo during multi-repo work.

### 4. Verify
- `tools/run-all-tests.ps1` (or project equivalent) is green.
- For live-impacting scripts, re-run against real target — must be a no-op (idempotence check).
- `tools/validate-all-policies.ps1` reports no drift (when policies apply).

### 5. Close — the report
Produce a Work Unit Report with these sections:

```markdown
# Work Unit <NN> — <title>

## What was implemented
- `<path>` — one-line purpose
- ...

## Test totals
`<suite>`: N/N PASS
=== TOTAL: N/N PASS (Xs) ===

## Why (ULTRA §13 answers)
- What breaks if this changes?
- What proves this works?
- Can this be reused?
- Can this be simplified?
- Is this observable?
- Is this documented?
- Is this the best long-term design?

## What's COMPLETE (Section 20)
| Artifact | Status | Evidence |
|---|---|---|
| ... | ✅ | path |

## What's INCOMPLETE
- <item> — <time estimate>

## Risks flagged
- ...

## Awaiting decision
- <blocking user decision>
```

## Invocation patterns

| User says | Do |
|---|---|
| "Let's start a work unit for X" | Run phase 1. Produce one-sentence scope + criterion. Confirm before phase 2. |
| "Close work unit" or "work unit report" | Produce phase-5 report from current session artifacts. |
| "Ship it" / "merge it" | Block until phases 4 and 5 are done and green. |

## Non-negotiables

- No "done" without evidence (file path + test result).
- No "complete" without green tests across the affected suite.
- No "shipped" without an idempotent re-run for live-impacting code.
- No hidden state — every fact in the report must be verifiable from files in the repo.

## Related

- `rules/ultra-mode.md` — the governing constitution.
- `skills/harness-automation` — CI pipeline is part of verification.
- `commands/wa-report` — one-shot report generator.
