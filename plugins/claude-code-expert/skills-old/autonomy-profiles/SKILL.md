---
description: Runtime behavior specs for the four autonomy profiles, the three autonomy agents (planner, verifier, reviewer), memory integration, context survival, and anti-patterns. Activate this skill to run the autonomy system — not just to read about it.
model: claude-opus-4-6
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
---

# Autonomy Profiles — Runtime Skill

This skill activates the autonomy system. When invoked, read the current profile from `.claude/rules/autonomy.md`, load the active task from `.claude/active-task.md`, and operate according to the profile spec below.

---

## 1. Runtime Behavior by Profile

### 1.1 Conservative Runtime

**Entry sequence** (every session):
1. Read `.claude/active-task.md` — if it does not exist, create it from the template
2. Call `mem_context` to load cross-session memory
3. Read `.claude/rules/autonomy.md` to confirm profile
4. If task status is `implementing` or later, read the Phase Log and resume from the last completed phase
5. Announce current state: "Resuming [task name], Phase [N], last verified [timestamp]"

**Per-task loop**:
```
invoke autonomy-planner
  → receive structured plan
  → display plan to user
  → WAIT for user confirmation before proceeding

for each phase in plan:
  implement phase (one logical unit)
  invoke autonomy-verifier
    → if PASS: update active-task.md phase log, save memory, proceed
    → if FAIL: stop, show failures, ask user for direction
  WAIT for user to confirm continuation

invoke autonomy-reviewer
  → receive BLOCK / APPROVE decision
  → if BLOCK: address issues, re-verify, re-review
  → if APPROVE: stage files, show diff, ask user to confirm commit
```

**Context management**:
- Count exchanges. At exchange 20 (or when context > 80%): call `mem_session_summary`, then `/compact`
- After compact: re-read active-task.md and call `mem_context` before continuing

---

### 1.2 Balanced Runtime

**Entry sequence** (every session):
1. Read `.claude/active-task.md` if present
2. Call `mem_context`
3. Estimate task complexity: < 30 min → skip planner; > 30 min → invoke planner

**Per-task loop**:
```
if task_estimate > 30min:
  invoke autonomy-planner
  show plan (proceed without waiting for approval — but surface risks)

implement (read tools auto-approved, write/bash require case-by-case)

on completion:
  invoke autonomy-verifier
    → report results
    → if critical failures: stop and surface
    → if warnings only: continue with note
  
before PR:
  invoke autonomy-reviewer
    → address BLOCKs before opening PR
    → REQUESTs are noted in PR description

mem_save after each task completion
```

**Context management**:
- Count exchanges. At exchange 25: `mem_session_summary`, then `/compact`

---

### 1.3 Aggressive Runtime

**Entry sequence** (every session):
1. Check for `.claude/active-task.md` — if present and in-progress, resume without ceremony
2. Call `mem_context` (fast, non-blocking — do not wait for slow memory retrieval before starting)

**Per-task loop**:
```
assess task:
  if involves > 3 files or > 2 domains:
    spawn parallel subagents via Agent tool
    each subagent: scoped file list + objective + output contract
    synthesize in main session
  else:
    implement directly

all tool calls proceed without prompting (auto mode)

on completion:
  invoke autonomy-verifier (advisory — failures surface but do not block)
  mem_save with outcome summary

Exception: git push to main/master requires explicit user confirmation regardless of auto mode
```

**Parallelization pattern**:
```
Agent 1: "Implement [component A] in [files X, Y]. Return: list of changed files + summary."
Agent 2: "Implement [component B] in [files P, Q]. Return: list of changed files + summary."
Wait for both → merge → verify combined result
```

**Context management**:
- Count exchanges. At exchange 30: background `mem_session_summary`, then `/compact`
- Aggressive profile does not pause for memory ops — do them in background when possible

---

### 1.4 Unattended Review Runtime

**Entry sequence**:
1. This profile runs without human interaction — do not prompt for input
2. Read scope from session prompt or `.claude/review-scope.md`
3. Confirm read-only mode: no Write, Edit, or mutating Bash

**Review loop**:
```
determine scope:
  - PR diff (git diff main...HEAD)
  - specified files (from session prompt)
  - full repo scan (fallback)

spawn parallel review agents:
  Agent 1: security-reviewer — OWASP Top 10, secrets, injection, path traversal
  Agent 2: correctness-reviewer — logic errors, edge cases, missing null checks, type safety
  Agent 3: performance-reviewer — N+1 queries, unbounded loops, memory leaks
  Agent 4: style-reviewer — naming, complexity, dead code, test coverage

wait for all agents → synthesize into unified report

output:
  if gh CLI available: post as PR comment
  else: write to review-output.md in repo root

exit — do not loop or wait
```

**Output contract**: Every finding must include:
- Severity: BLOCK / REQUEST / SUGGEST / PRAISE
- File path and line range
- What the issue is (1 sentence)
- Why it matters (1 sentence)
- Concrete fix (code snippet or specific action) for BLOCK and REQUEST

---

## 2. Planner Agent Protocol

**Agent file**: `.claude/agents/autonomy-planner.md`

```yaml
---
name: autonomy-planner
description: Decomposes a task into a structured, phase-by-phase plan with risk assessment, file list, verification steps, and rollback path. Invoked before implementation on conservative and balanced profiles.
model: claude-opus-4-6
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---
```

**Invocation**:
```
Task: [task description from active-task.md or user input]

Produce a structured plan. Do not implement anything.
```

**Required output format**:
```markdown
# Plan: [task name]

## Summary
[2-3 sentence description of what will be done and why]

## Complexity Estimate
[Low / Medium / High] — estimated [N] sessions for conservative, [N] for balanced

## Phases

### Phase 1: [name]
**Goal**: [one sentence]
**Files**:
  - `path/to/file.ts` — [what changes]
  - `path/to/other.ts` — [what changes]
**Verification**: [specific command or check to confirm phase success]
**Rollback**: [how to undo if this phase fails]

### Phase 2: [name]
[same structure]

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [risk description] | Low/Med/High | Low/Med/High | [mitigation] |

## Dependencies
[List any external services, env vars, or tools that must be available]

## Out of Scope
[Explicitly list what this plan does NOT include to prevent scope creep]
```

**Planner constraints**:
- Do not include implementation code in the plan — phases describe what changes, not how
- Each phase must be independently verifiable
- Rollback path is mandatory for any phase that modifies a database schema, environment config, or public API contract
- If the task requires > 5 phases, recommend splitting into multiple tasks

---

## 3. Verifier Agent Protocol

**Agent file**: `.claude/agents/autonomy-verifier.md`

```yaml
---
name: autonomy-verifier
description: Runs the project's verification suite (type check, tests, lint, diff audit) and reports pass/fail with actionable output. On conservative profile, runs after each file change. On balanced, runs after task completion.
model: claude-sonnet-4-6
allowed-tools:
  - Bash
  - Read
  - Glob
---
```

**Invocation**:
```
Run the full verification suite for this project. Report pass/fail for each check.
```

**Detection → execution**:

Step 1: Detect stack
```bash
# Check for package.json → Node/TypeScript
# Check for pyproject.toml or setup.py → Python
# Check for *.csproj → .NET
# Check for go.mod → Go
# Check for Cargo.toml → Rust
```

Step 2: Run checks in order (stop on first BLOCK-level failure in conservative mode, continue in all others):

| Check | Command | Pass Condition |
|-------|---------|----------------|
| TypeScript | `npx tsc --noEmit` | Exit 0, 0 errors |
| Tests | `pnpm test` / `npm test` / `pytest` / `dotnet test` / `go test ./...` | Exit 0, 0 failures |
| Lint | `npx eslint . --max-warnings 0` / `ruff check .` | Exit 0, no new errors |
| Diff audit | `git diff --stat HEAD` | No unexpected files (files outside current task scope) |

Step 3: Write results to `.claude/active-task.md` under Verification Results section

**Output format**:
```
=== Verification: [PASS | FAIL] ===

TypeScript  [PASS | FAIL]  [error count or "0 errors"]
Tests       [PASS | FAIL]  [test count or failure summary]
Lint        [PASS | FAIL]  [warning/error count]
Diff audit  [PASS | FAIL]  [files changed, any unexpected files flagged]

[If FAIL:]
Action required:
  1. [specific file:line error]
  2. [specific file:line error]
```

**Pass criteria by profile**:
- Conservative: ALL checks must pass. Any failure stops the loop.
- Balanced: TypeScript and test failures stop the loop. Lint warnings surface but do not stop.
- Aggressive: Results are advisory. All failures are reported but do not block.
- Unattended: TypeScript and lint run in report-only mode. No test execution (side effects risk).

---

## 4. Reviewer Agent Protocol

**Agent file**: `.claude/agents/autonomy-reviewer.md`

```yaml
---
name: autonomy-reviewer
description: Reviews completed implementation against the original plan. Checks for scope creep, missing tests, broken contracts, and unresolved issues. Produces BLOCK or APPROVE decision with itemized findings.
model: claude-opus-4-6
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---
```

**Invocation**:
```
Review the implementation against the plan in .claude/active-task.md.
Check: scope adherence, test coverage, API contract integrity, and code quality.
Produce a BLOCK or APPROVE decision.
```

**Review checklist**:

Scope:
- [ ] All planned phases are complete
- [ ] No files modified outside the plan's file list (unless justified)
- [ ] Out-of-scope items from the plan are not implemented

Tests:
- [ ] New behavior has at least one test
- [ ] Bug fixes have a regression test
- [ ] No test coverage was deleted without justification

Contracts:
- [ ] Public API signatures unchanged (or version bumped if intentionally changed)
- [ ] Database schema changes have a migration file
- [ ] Environment variables have `.env.example` entries

Code quality:
- [ ] No `any` types without comment justification (TypeScript)
- [ ] No functions exceeding 50 lines
- [ ] No hardcoded credentials or secrets
- [ ] No commented-out code blocks

**Output format**:
```
=== Review: [BLOCK | APPROVE] ===

[If BLOCK:]
Must fix before merge:
  BLOCK: [file:line] [issue description] — [fix suggestion]
  BLOCK: [file:line] [issue description] — [fix suggestion]

Should fix before merge:
  REQUEST: [file:line] [issue description] — [fix suggestion]

[If APPROVE:]
Implementation matches plan. [N] phases complete, verification passed.

Suggestions (optional):
  SUGGEST: [file:line] [improvement]

Good patterns noted:
  PRAISE: [file:line] [what was done well]
```

**BLOCK criteria** (automatic BLOCK on any of these):
- Missing tests for new public behavior
- TypeScript errors not caught by verifier (manual code review finds type unsafety)
- Security issues: unsanitized user input, hardcoded secrets, path traversal, SQL injection
- API contract broken without version bump
- Implementation deviates materially from plan without explanation

**APPROVE criteria**:
- All planned phases complete
- Verification passed
- No BLOCK-level issues found
- REQUESTs documented (can be addressed in follow-up)

---

## 5. Memory Integration

The autonomy system uses engram MCP for cross-session state. These are the canonical save points.

### 5.1 What to save and when

| Trigger | Tool | Key pattern | Content |
|---------|------|-------------|---------|
| Phase complete (conservative) | `mem_save` | `autonomy/[task-slug]/phase-[N]` | Phase name, files changed, verification result |
| Task complete | `mem_save` | `autonomy/[task-slug]/done` | Summary, what was done, outcome |
| Plan generated | `mem_save` | `autonomy/[task-slug]/plan` | Full plan text |
| Blocker encountered | `mem_save` | `autonomy/[task-slug]/blocker` | What blocked, what was tried, resolution needed |
| Session end | `mem_session_summary` | auto | Summary of all work done this session |

### 5.2 Session start memory load

At the start of any autonomy session:
```
1. mem_context                           → load recent session history
2. mem_search("autonomy [task-slug]")    → find prior phase outcomes
3. Read .claude/active-task.md           → get current status and phase log
4. Cross-reference: mem results vs active-task.md to catch discrepancies
```

If mem results and active-task.md disagree (e.g., mem shows phase 3 complete but active-task.md shows phase 2), trust active-task.md as the authoritative source (it was written to disk, memory may have been truncated).

### 5.3 active-task.md update protocol

Update active-task.md at these events:
- Status changes (planning → implementing → verifying → reviewing → done)
- Phase completion (add row to Phase Log)
- Verification results (update Verification Results section)
- Session IDs (append session ID to Session IDs list)

Never truncate active-task.md — append only (except status field, which overwrites).

---

## 6. Context Survival

Long autonomy tasks survive session loss and compaction through layered state.

### 6.1 State layers

```
Layer 1: .claude/active-task.md     — disk, always survives
Layer 2: engram memory              — cross-session, searchable
Layer 3: git log                    — implicit record of what was committed
Layer 4: .claude/rules/autonomy.md  — profile and workflow rules
```

### 6.2 Recovery sequence after session loss

```
1. Read .claude/active-task.md
   → What is the task?
   → What phase are we on?
   → What was the last verified state?

2. mem_search("autonomy [task-slug]")
   → Any phases completed that aren't in active-task.md?

3. git status && git diff
   → What files are changed and unstaged?
   → Do they match the current phase's file list?

4. Re-run autonomy-verifier
   → Confirm current state is clean before continuing

5. Resume from last verified phase
   → Conservative: re-verify current files before proceeding
   → Balanced/Aggressive: trust verifier output and continue
```

### 6.3 Pre-compaction checklist

Before running `/compact`:
- [ ] Call `mem_session_summary` with current phase and next step
- [ ] Update active-task.md status and Phase Log
- [ ] Ensure all changed files are staged (`git add` specific files — never `git add -A`)
- [ ] Note the exact next action in active-task.md so resumption is unambiguous

Post-compaction first action:
```
Read .claude/active-task.md → mem_context → announce current state → continue
```

### 6.4 Mid-task profile switch

If `/cc-autonomy switch [profile]` is called mid-task:
1. Complete the current phase before the switch takes effect
2. Re-run autonomy-verifier after the switch (new profile may have different pass criteria)
3. Update active-task.md: note the profile switch and timestamp
4. mem_save: "Switched from [old] to [new] at phase [N]"

---

## 7. Anti-Patterns

These patterns break the autonomy system. Recognize and avoid them.

### 7.1 Skipping the plan on conservative

**Pattern**: Starting implementation without invoking autonomy-planner.
**Why it breaks**: Conservative profile's verification gates assume a phase structure. Without phases, there is nothing to verify against, and scope creep is undetectable.
**Fix**: Always invoke autonomy-planner first. For trivial tasks, the plan is short — it takes 30 seconds and saves hours.

### 7.2 Not updating active-task.md

**Pattern**: Completing phases but not updating the Phase Log or status field.
**Why it breaks**: Session recovery is impossible without current state on disk. Memory alone is not reliable — it can be truncated or miss writes.
**Fix**: After every phase, write to active-task.md before calling mem_save. Disk first, memory second.

### 7.3 Using auto mode on unfamiliar codebases

**Pattern**: Deploying aggressive profile in a repo you have not worked in before.
**Why it breaks**: Aggressive profile skips mandatory planning. Without understanding the codebase, Claude may modify the wrong files or introduce changes that conflict with existing patterns.
**Fix**: Run conservative or balanced on first contact with a codebase. Switch to aggressive after at least one full task cycle establishes codebase familiarity.

### 7.4 Letting the verifier pass without reading its output

**Pattern**: Seeing "PASS" and immediately continuing without reading the full verifier report.
**Why it breaks**: Verifier can pass on TypeScript and tests while flagging unexpected diff files or lint regressions. These are early warnings that become blockers later.
**Fix**: Read the full verifier output on every run. A pass with warnings is not the same as a clean pass.

### 7.5 Running unattended-review with write permissions

**Pattern**: Deploying unattended-review profile but forgetting to set the read-only permission block.
**Why it breaks**: The review agent's prompts assume it cannot modify files. If it can, it may attempt to auto-fix issues — creating unreviewed commits in a scheduled context.
**Fix**: Always deploy the `settings.json` permission block from `/cc-autonomy deploy unattended-review` before scheduling. Verify with `/cc-autonomy status`.

### 7.6 Spawning unbounded parallel agents in aggressive mode

**Pattern**: Spawning one agent per file in a large refactor.
**Why it breaks**: Context window cost scales linearly with agents. 20 parallel agents on a 200-file refactor hits rate limits and produces incoherent synthesis.
**Fix**: Cap parallel agents at 4-6. Group related files per agent. Use sequential agents for phases that have ordering dependencies.

### 7.7 Skipping mem_session_summary before /compact

**Pattern**: Running `/compact` without saving session summary.
**Why it breaks**: Compaction discards the conversation. If active-task.md is not fully current and memory has no summary, recovery requires reconstructing state from git log — slow and error-prone.
**Fix**: `mem_session_summary` is mandatory before every compaction. Make it a reflex.

### 7.8 Committing between phases in conservative mode

**Pattern**: Committing after each phase rather than after full implementation + review.
**Why it breaks**: Conservative profile's reviewer operates on the full implementation. Committing between phases bypasses the reviewer and creates a commit history that is hard to revert cleanly.
**Fix**: Stage changes after each verified phase, but commit only after autonomy-reviewer approves the full implementation.

---

## 8. Quick Reference

### Invocation patterns

```bash
# Start a new task (conservative)
/cc-autonomy plan "Implement pagination on the /users endpoint"
# → planner produces plan → confirm → implement → verify per file → review → stage → confirm commit

# Start a new task (balanced, > 30 min)
/cc-autonomy plan "Migrate all API routes from Express to Fastify"
# → planner produces plan → proceed without waiting → implement → verify on completion → review before PR

# Start a new task (aggressive)
# No plan invocation needed — implement directly, verify after
# If multi-domain: spawn agents via cc-orchestrate

# Check current state
/cc-autonomy status

# Run verification manually
/cc-autonomy verify

# Switch profiles mid-task (complete current phase first)
/cc-autonomy switch conservative

# Deploy fresh profile
/cc-autonomy deploy balanced
```

### Agent invocation syntax

```
# Planner (conservative + balanced)
Use the autonomy-planner agent.
Task: [description]
Output a structured plan to .claude/active-task.md.

# Verifier
Use the autonomy-verifier agent.
Run full verification suite. Write results to .claude/active-task.md.

# Reviewer
Use the autonomy-reviewer agent.
Review implementation against plan in .claude/active-task.md.
Produce BLOCK or APPROVE with itemized findings.
```

### Memory commands

```
mem_context                          → session start load
mem_save("autonomy/[slug]/phase-N")  → after each phase
mem_save("autonomy/[slug]/done")     → after task complete
mem_session_summary                  → before /compact
mem_search("autonomy [slug]")        → recovery after session loss
```
