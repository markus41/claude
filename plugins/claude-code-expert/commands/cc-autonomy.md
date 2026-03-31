---
name: cc-autonomy
intent: Deploy a full autonomy operating profile that composes memory, workflow, orchestration, hooks, and verification into one deployable system with four preset profiles from conservative to unattended
tags:
  - claude-code-expert
  - command
  - autonomy
  - workflow
  - orchestration
  - agents
arguments:
  - name: subcommand
    description: Action to take — deploy, status, switch, verify, plan
    required: true
    type: choice
    choices: [deploy, status, switch, verify, plan]
  - name: profile
    description: Autonomy profile name (for deploy and switch)
    required: false
    type: choice
    choices: [conservative, balanced, aggressive, unattended-review]
  - name: task
    description: Task description (for plan subcommand)
    required: false
    type: string
flags:
  - name: dry-run
    description: Show what would be written without writing any files
    type: boolean
    default: false
  - name: force
    description: Overwrite existing autonomy.md and settings.json without prompting
    type: boolean
    default: false
risk: medium
cost: low
---

# /cc-autonomy — Autonomy Operating Mode

Deploy a first-class autonomy operating profile that composes memory, workflow, orchestration, hooks, and verification into one deployable system. More than documentation — generates preset files, enforcement hooks, and specialized agents.

## Usage

```bash
/cc-autonomy deploy [profile]          # Deploy a profile to current repo
/cc-autonomy deploy conservative       # Cautious: plan-first, all approvals required
/cc-autonomy deploy balanced           # Default: auto mode for reads, approvals for writes
/cc-autonomy deploy aggressive         # Speed: auto mode, parallelization, minimal gates
/cc-autonomy deploy unattended-review  # Safe: read-only analysis + PR comments, no writes

/cc-autonomy status                    # Show active profile and agent health
/cc-autonomy switch <profile>          # Switch profiles without full redeployment
/cc-autonomy verify                    # Run verification suite against current codebase state
/cc-autonomy plan <task>              # Invoke planner agent for a specific task
```

---

## The Four Profiles

### Profile: conservative

**When to use**: High-stakes code, production systems, unfamiliar codebases. Maximum human control with Claude as a structured assistant.

**Settings**:
- Permission mode: `default` — every tool call requires approval
- Plan-first: required for all tasks. Planner agent produces written plan before any implementation.
- Verifier: runs after every file change
- Memory: full 5-file split memory architecture
- Context: compact every 20 exchanges

**Generated files**:

`.claude/rules/autonomy.md` conservative content:
```markdown
# Autonomy Rules — Conservative Profile

## Mandatory Workflow

1. PLAN before any implementation. Invoke the autonomy-planner agent first.
   Output the plan. Do not proceed until the user confirms.
2. Implement one logical unit at a time. Not one file — one unit of behavior.
3. After each file write, invoke autonomy-verifier. Do not continue until it passes.
4. After full implementation, invoke autonomy-reviewer before declaring done.
5. Never commit. Stage changes, show diff, ask for confirmation.

## Context Management

- Run /compact at 20 exchanges or when context exceeds 80% capacity.
- Save memory after each verified phase: mem_save with phase outcome.
- Start next session by reading .claude/active-task.md and running mem_context.

## Never Do Without Explicit Approval

- `git push`
- `git commit`
- Any Bash command modifying files outside the project root
- Any API call with side effects (POST, PUT, DELETE, PATCH)
- Any `npm publish`, `docker push`, `helm upgrade --install` in production

## Verification Gate

Each phase must pass before proceeding:
1. TypeScript: `npx tsc --noEmit` — 0 errors
2. Tests: test command passes
3. Lint: no new errors introduced
4. Diff: no unexpected files in diff
```

`settings.json` permission block for conservative:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Edit",
      "Write",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(npx tsc --noEmit)",
      "Bash(npx eslint *)",
      "Bash(pnpm test)",
      "Bash(npm test)",
      "Bash(pnpm build)"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(git commit *)",
      "Bash(rm *)",
      "Bash(curl * | sh)",
      "Bash(curl * | bash)"
    ]
  }
}
```

Startup command:
```bash
# Conservative profile startup
claude --model claude-opus-4-6
# Then in session: /cc-autonomy plan "<task description>"
```

CLAUDE.md autonomy section to append:
```markdown
## Autonomy Mode: Conservative

Active profile: conservative. All tasks use the planner→implement→verify→review cycle.

Plan first. Always. Run: /cc-autonomy plan "<task>" before implementing anything.

Verification gate is mandatory before each commit:
  npx tsc --noEmit && pnpm test && npx eslint . --max-warnings 0

Memory: save phase outcomes with mem_save. Read .claude/active-task.md on session start.
```

---

### Profile: balanced

**When to use**: Normal development on a familiar codebase. Good for daily feature work and bug fixes. Best default for most teams.

**Settings**:
- Permission mode: `auto` for reads and searches, `default` for writes and bash
- Plan-first: for tasks estimated > 30 min
- Verifier: runs after implementation complete (not after each file)
- Reviewer: runs before PR creation
- Memory: full memory architecture
- Context: compact every 25 exchanges

**Generated files**:

`.claude/rules/autonomy.md` balanced content:
```markdown
# Autonomy Rules — Balanced Profile

## Workflow

For tasks > 30 min: run autonomy-planner first, get written plan, then implement.
For quick fixes (< 30 min): implement directly, then run verify.

## Auto-Approved Tools

Reads, searches, and git inspection are auto-approved. Write/Bash requires case-by-case.

## Verification (run after implementation, before PR)

```bash
npx tsc --noEmit && pnpm test && npx eslint .
```

## Memory Protocol

- mem_save after each logical task completion
- mem_context at session start
- mem_session_summary before /compact
- .claude/active-task.md for tasks > 30 min

## Commit Policy

Stage and review diff before committing. Commit message format: type(scope): description.
```

`settings.json` permission block for balanced:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(git stash *)"
    ],
    "deny": [
      "Bash(git push --force *)",
      "Bash(rm -rf *)",
      "Bash(curl * | sh)"
    ]
  }
}
```

Startup command:
```bash
claude  # standard startup, balanced is the default profile
```

---

### Profile: aggressive

**When to use**: Speed-first. Deadline work, batch refactoring, large migrations. You trust Claude and want maximum parallelization with minimal gate prompts.

**Settings**:
- Permission mode: `auto` — all tool calls proceed without prompting
- No mandatory planner (Claude decides when to plan)
- Agent teams for tasks involving > 3 files or > 2 domains
- Verifier: runs after, but non-blocking (advisory output only)
- Context: compact every 30 exchanges
- Model: sonnet for implementation, opus for architectural decisions

**Generated files**:

`.claude/rules/autonomy.md` aggressive content:
```markdown
# Autonomy Rules — Aggressive Profile

## Workflow

Execute directly. For multi-domain tasks, spawn an agent team (use cc-orchestrate).
Do not stop to ask for plan approval — produce plan and execute in same session.

## Parallelization

For tasks with independent components, spawn parallel subagents.
Each subagent gets: scoped files, clear objective, output contract.
Synthesize results in main session.

## Verification

Run after completion. Failures are reported but do not block — user decides follow-up.

## Auto Mode

All tools run without approval. Trust the session context.
Exception: git push to main/master always requires explicit user confirmation.

## Quality

Speed over polish, but never skip tests. A fast broken implementation is negative value.
```

`settings.json` for aggressive (auto mode):
```json
{
  "autoApprove": true,
  "permissions": {
    "deny": [
      "Bash(git push origin main)",
      "Bash(git push origin master)",
      "Bash(git push --force *)"
    ]
  }
}
```

Startup command:
```bash
claude --auto-approve  # or toggle auto mode in session with /auto
```

---

### Profile: unattended-review

**When to use**: Scheduled review tasks, overnight analysis, CI-triggered code audits. Claude reads and comments, never writes to production code.

**Settings**:
- Permission mode: strict read-only — only Read, Glob, Grep, Bash(git *) allowed
- No write/edit tools
- Agent team: pr-review-board topology (parallel security + correctness + style agents)
- Output: PR comments, GitHub issues, or summary report file
- Run as: Cloud scheduled task or Desktop task

**Generated files**:

`.claude/rules/autonomy.md` unattended-review content:
```markdown
# Autonomy Rules — Unattended Review Profile

## This session is read-only.

NEVER use Write, Edit, or any Bash command that modifies files.

## Workflow

1. Read scope: PR diff, specified files, or full repo scan
2. Spawn parallel review agents (security, correctness, performance, style)
3. Synthesize findings into structured report
4. Post findings as PR comment or write to review-output.md
5. Exit cleanly — do not loop

## Output Format

All findings use BLOCK / REQUEST / SUGGEST / PRAISE severity levels.
Group by file, then by severity within each file.
Include: what, why, and a concrete fix suggestion for each BLOCK and REQUEST.

## Never

- Modify any source file
- Create branches or commits
- Push to any remote
- Run tests that have side effects (database writes, API calls with mutations)
```

`settings.json` for unattended-review:
```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git status)",
      "Bash(git show *)",
      "Bash(npx tsc --noEmit)",
      "Bash(npx eslint * --max-warnings 9999)"
    ],
    "deny": [
      "Write",
      "Edit",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(rm *)",
      "Bash(mv *)"
    ]
  }
}
```

Startup for Cloud scheduled task:
See `/cc-schedule release-check` for the full blueprint.

---

## Phase 1: Pre-Deployment Scan

Before writing any files, scan the repo to detect:
- Existing `.claude/settings.json` (merge, not overwrite)
- Existing `.claude/rules/autonomy.md` (ask before overwriting unless `--force`)
- Available MCP servers (engram, lessons-learned, etc.)
- Tech stack (to set correct verification commands)
- Existing agents (don't duplicate)

```bash
# Detection sequence
ls .claude/settings.json 2>/dev/null && echo "settings.json exists — will merge"
ls .claude/rules/autonomy.md 2>/dev/null && echo "autonomy.md exists — will confirm before overwrite"
ls .claude/agents/autonomy-planner.md 2>/dev/null && echo "planner agent already present"
```

---

## Phase 2: Generate Files

For the selected profile, write in order:

1. `.claude/rules/autonomy.md` — autonomy rules for the profile
2. `.claude/settings.json` — merge permissions block into existing or create new
3. `.claude/active-task.md` — create empty template (user fills in task details)
4. `CLAUDE.md` — append autonomy section (do not overwrite existing content)

`.claude/active-task.md` template:
```markdown
# Active Task

## Task
<!-- Describe the task in 1-3 sentences -->

## Profile
<!-- conservative | balanced | aggressive | unattended-review -->

## Status
<!-- planning | implementing | verifying | reviewing | done -->

## Plan
<!-- Filled by autonomy-planner -->

## Phase Log
<!-- Updated after each completed phase -->
| Phase | Status | Notes |
|-------|--------|-------|
|       |        |       |

## Verification Results
<!-- Updated by autonomy-verifier -->

## Session IDs
<!-- Add session ID each time you pick up this task -->
```

---

## Phase 3: Deploy Agents

For conservative and balanced profiles, create these agents in `.claude/agents/` if not present:

**autonomy-planner** — decomposes task into a structured plan before any implementation begins
**autonomy-verifier** — runs verification suite (tsc, tests, lint, diff check) and reports pass/fail with actionable output
**autonomy-reviewer** — reviews completed work against the original plan, checks for scope creep, missing tests, and unresolved issues

For aggressive and unattended-review, also offer:
**Team preset** — pr-review-board topology (from cc-orchestrate)

Agent files are written to `.claude/agents/` using the standard YAML frontmatter format.
See the `autonomy-profiles` skill for agent definitions and interaction protocols.

---

## Phase 4: Confirmation Output

After deployment, print:
```
=== Autonomy Profile Deployed: [profile] ===

Files written:
  .claude/rules/autonomy.md          [profile rules]
  .claude/settings.json              [permission block merged]
  .claude/active-task.md             [task template]
  CLAUDE.md                          [autonomy section appended]

Agents available:
  autonomy-planner     → /cc-autonomy plan "<task>"
  autonomy-verifier    → /cc-autonomy verify
  autonomy-reviewer    → invoked automatically before PR

Startup command:
  [profile-specific startup command]

Next step:
  [profile-specific first action]

Run /cc-autonomy status to confirm everything is active.
```

---

## Subcommand: status

Show the active profile, agent health, and task state:

```
=== Autonomy Status ===

Profile:  balanced (set in .claude/rules/autonomy.md)
Agents:   autonomy-planner ✓  autonomy-verifier ✓  autonomy-reviewer ✓
Task:     .claude/active-task.md → status: implementing
Memory:   engram MCP available ✓
Settings: .claude/settings.json — permissions block present ✓

Last verification: PASS (2 min ago)
  TypeScript: 0 errors
  Tests:      47 passed, 0 failed
  Lint:       0 new errors
```

If any component is missing, print a remediation line:
```
  autonomy-planner ✗ — run /cc-autonomy deploy [profile] to recreate
```

---

## Subcommand: switch

Switch the active profile without full redeployment. Only rewrites `.claude/rules/autonomy.md` and the permissions block in `.claude/settings.json`. Does not modify agents or CLAUDE.md.

```bash
/cc-autonomy switch conservative   # Tighten controls mid-task
/cc-autonomy switch aggressive     # Loosen for a batch operation
```

Print confirmation:
```
Switched from balanced → aggressive
  .claude/rules/autonomy.md  [updated]
  .claude/settings.json      [permissions updated]

Note: Agents unchanged. Run /cc-autonomy status to confirm.
```

---

## Subcommand: verify

Run the full verification suite for the current tech stack and report results:

```bash
/cc-autonomy verify
```

Detection → execution → report:
1. Detect stack: check for `package.json` (Node), `pyproject.toml` (Python), `*.csproj` (.NET), `go.mod` (Go)
2. Run applicable checks in order:
   - TypeScript: `npx tsc --noEmit`
   - Tests: `pnpm test` or `npm test` or `pytest` or `dotnet test` or `go test ./...`
   - Lint: `npx eslint .` or `ruff check .` or `dotnet format --verify-no-changes`
   - Diff: `git diff --stat` — report unexpected files
3. Write results to `.claude/active-task.md` under Verification Results
4. Exit with clear PASS / FAIL and action items

---

## Subcommand: plan

Invoke the autonomy-planner agent for a specific task. Outputs a structured plan in `.claude/active-task.md` and prints a summary.

```bash
/cc-autonomy plan "Add rate limiting to the /api/auth endpoints"
```

The planner agent produces:
- Phase breakdown with per-phase file list
- Risk assessment (what could go wrong, likelihood, mitigation)
- Verification steps for each phase
- Rollback path if implementation fails
- Estimated session count for conservative and balanced profiles

---

## Comparison: Profile Selection Guide

| | Conservative | Balanced | Aggressive | Unattended |
|--|------------|---------|-----------|------------|
| Permission mode | default | mixed | auto | read-only |
| Plan first | Always | > 30 min | Optional | N/A |
| Verifier | Per file | Per task | Advisory | N/A |
| Reviewer | Always | Before PR | Optional | N/A |
| Human gates | Many | Some | Minimal | None |
| Best for | Production, unfamiliar code | Daily dev | Deadline, batch | Scheduled analysis |
| Startup cost | High | Medium | Low | Zero |

Use conservative when the cost of a mistake is high. Use aggressive when the cost of speed is low. Use unattended for always-on code quality monitoring.

---

## See Also

- `autonomy-profiles` skill — runtime behavior specs, agent definitions, and interaction protocols
- `common-workflows` skill — workflow packs for standard engineering tasks
- `scheduled-tasks` skill — deploying unattended-review as a scheduled task
- `agent-teams-advanced` skill — team topology for aggressive + unattended profiles
- `/cc-schedule` — generate scheduled task blueprint for unattended-review
- `/cc-orchestrate` — launch agent team for aggressive profile
