---
description: Workflow packs for the 7 most common Claude Code tasks — codebase exploration, bug fixing, safe refactoring, TDD, repo review before merge, CLAUDE.md generation, and migration planning. Each pack has a start prompt, verification steps, subagent opportunities, failure modes, and completion checklist.
model: claude-sonnet-4-6
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
---

# Common Workflow Packs

Seven battle-tested workflow packs that mirror the official Claude Code common-workflows guide. Each pack is a complete playbook, not generic advice.

---

## Pack 1: Understand a Codebase

**When:** First time in an unfamiliar repo, onboarding a new project, or before making large changes.

### Start Prompt
```
You are a senior engineer exploring this codebase for the first time.

Phase 1 — Structure mapping:
1. Read CLAUDE.md, README.md, and package.json/pyproject.toml
2. Map the top-level directory structure (2 levels deep)
3. Identify: entry points, main business logic, data layer, API layer, test layer
4. Identify: tech stack, framework version, package manager

Phase 2 — Architecture extraction:
5. Find the 3 most important source files (highest import count or central routing)
6. Read each one and extract: purpose, key abstractions, dependencies
7. Map data flow: where does data enter, transform, and exit?
8. Identify patterns: are there service layers, repositories, DTOs, event buses?

Phase 3 — Output:
9. Write a 1-page architecture summary to .claude/context-snapshot.md with:
   - Tech stack table
   - 3-sentence architecture description
   - Key file map (path → purpose, one line each)
   - Entry points and their routes/triggers
   - Known complexity hotspots (files > 300 lines or deeply nested logic)
```

### Verification Steps
- [ ] Tech stack correctly identified (check package.json/Cargo.toml/pyproject.toml)
- [ ] All entry points found (check for main.ts, index.ts, manage.py, main.go)
- [ ] Architecture snapshot written to `.claude/context-snapshot.md`
- [ ] No assumptions made that weren't verified in code

### Subagent Opportunities
- Delegate framework-specific analysis: spawn a subagent for `src/auth/` while you explore `src/api/`
- Use a Haiku subagent to list imports and build the dependency graph (fast, cheap)
- Use an Opus subagent only for the final architecture synthesis

### Common Failure Modes
- **Over-reading**: reading every file instead of tracing from entry points inward
- **Missing the glue**: forgetting to read middleware, config loaders, and DI containers
- **Stale docs**: trusting README over what's actually in the code

### Completion Checklist
- [ ] `.claude/context-snapshot.md` written
- [ ] Can explain the system in 3 sentences without looking at the code
- [ ] Know where to find: routing, data models, auth, config, tests

---

## Pack 2: Fix a Bug from an Error Trace

**When:** You have a stack trace, error message, or failing test and need to find and fix the root cause.

### Start Prompt
```
You are debugging the following error:

{PASTE ERROR TRACE HERE}

Evidence-based debugging protocol:

Phase 1 — Parse:
1. Extract: error type, message, file, line number, call stack
2. Identify the proximate cause (where it failed) vs. likely root cause (why)

Phase 2 — Locate:
3. Read the file at the error line + 20 lines of context
4. Trace the call stack: read each frame's function to understand data flow
5. Find where the problematic value was created or last mutated

Phase 3 — Hypothesize:
6. Form 2-3 specific hypotheses about root cause
7. For each hypothesis: identify a code path that would produce this error
8. Pick the most likely hypothesis based on evidence

Phase 4 — Fix:
9. Write the minimal fix for the chosen hypothesis
10. Explain why the fix works
11. Identify if there are other call sites with the same bug

Phase 5 — Verify:
12. Run the failing test: {test_cmd}
13. Run the full test suite to check for regressions: {test_cmd}
14. If tests pass: commit with message "fix({scope}): {one-line description}"
```

### Verification Steps
- [ ] Error is reproducible before fix (confirm test fails)
- [ ] Root cause identified (not just symptom masked)
- [ ] Fix is minimal (no unrelated changes in the same commit)
- [ ] Tests pass after fix
- [ ] Other call sites checked for same bug

### Subagent Opportunities
- Use a subagent to search for similar patterns across the codebase: `Grep "same_pattern" --all`
- Delegate test writing to a test-writer subagent after the fix is confirmed

### Common Failure Modes
- **Symptom masking**: adding null checks without finding why null appears
- **Over-engineering**: refactoring instead of fixing
- **Regression**: fixing one thing, breaking another — always run full suite
- **Wrong hypothesis**: jumping to a fix without verifying the hypothesis first

### Completion Checklist
- [ ] Failing test was confirmed before fix
- [ ] Root cause statement written in commit message
- [ ] All tests pass
- [ ] No unrelated changes in the commit

---

## Pack 3: Refactor Safely

**When:** You need to restructure code without changing behavior. Extract a function, rename a module, split a large file, introduce an abstraction.

### Start Prompt
```
You are a refactoring engineer. Goal: {DESCRIBE REFACTOR GOAL}.

Safety protocol:

Phase 1 — Baseline:
1. Identify the exact scope of change (files, functions, types affected)
2. Run the test suite and confirm it passes: {test_cmd}
3. Count the test coverage for the affected code: check coverage report
4. If coverage < 80% for the target code: write missing tests first

Phase 2 — Characterize:
5. List every call site for the code being changed: Grep for function/class name
6. List every import of the modules being changed
7. Identify any reflection, dynamic dispatch, or string-based lookups that might miss a grep

Phase 3 — Refactor (small steps):
8. Make one structural change at a time
9. After each change: compile/typecheck and run affected tests
10. Never have the codebase in a broken state between steps
11. Commit each step separately with message "refactor({scope}): {step description}"

Phase 4 — Verify:
12. Run the full test suite
13. Check that all call sites compile correctly
14. Run linter/formatter on changed files
15. Read the final version: does it actually read better than before?
```

### Verification Steps
- [ ] Full test suite passes before refactor starts
- [ ] Full test suite passes after refactor ends
- [ ] No behavior changes (same inputs → same outputs)
- [ ] All call sites updated (no missed references)
- [ ] Commits are granular (one logical step per commit)

### Subagent Opportunities
- Delegate test writing for uncovered code before refactoring starts
- Use a subagent to find all import sites across a large monorepo

### Common Failure Modes
- **Big bang refactor**: changing too many files at once → hard to debug if tests break
- **Missing call sites**: grepping for the wrong pattern, missing dynamic usages
- **No baseline**: not confirming tests pass before starting
- **Scope creep**: refactoring adjacent code that "looked messy"

### Completion Checklist
- [ ] Tests passed before and after
- [ ] Commits are atomic and descriptive
- [ ] No new TODO comments added (fix or defer explicitly)
- [ ] Code is demonstrably more readable

---

## Pack 4: TDD Implementation

**When:** Building a new feature or fixing a bug with a test-first approach.

### Start Prompt
```
You are implementing {FEATURE DESCRIPTION} using TDD.

Red-Green-Refactor protocol:

Phase 1 — RED (write failing test):
1. Write the smallest possible test that captures the desired behavior
2. Run it: {test_cmd} — confirm it FAILS
3. If it passes without implementation, the test is wrong — fix the test

Phase 2 — GREEN (minimal implementation):
4. Write the simplest code that makes the test pass
5. No gold-plating: no error handling, no edge cases, no abstractions yet
6. Run tests: confirm it PASSES
7. Commit: "test({scope}): add test for {behavior}" + "feat({scope}): minimal implementation"

Phase 3 — REFACTOR:
8. Now improve the implementation: add error handling, extract functions, add types
9. After each change: run tests
10. When satisfied: commit "refactor({scope}): clean up {thing}"

Phase 4 — Edge cases:
11. List 3-5 edge cases: empty input, null, max values, concurrent access, etc.
12. Write a test for each
13. Make each pass with minimal changes
14. Commit per case

Phase 5 — Integration:
15. Write an integration test that exercises the full flow
16. Run the complete suite: {test_cmd}
```

### Verification Steps
- [ ] First test confirmed to fail before implementation
- [ ] Each test written before the code that makes it pass
- [ ] All edge cases listed and tested
- [ ] Integration test covers end-to-end flow
- [ ] All tests pass before PR

### Subagent Opportunities
- Use a test-writer subagent to generate edge case tests after the happy path is done
- Delegate integration test writing to a separate agent

### Common Failure Modes
- **Test after code**: writing tests after implementation — defeats the purpose, biases toward what works
- **Trivial tests**: testing implementation details instead of behavior
- **Skipping refactor**: stopping at green, never cleaning up
- **Too large a first test**: write the smallest useful test, not the full feature in one shot

### Completion Checklist
- [ ] Each feature commit has a corresponding test commit
- [ ] No test accesses private/internal state
- [ ] Coverage >= 80% for new code
- [ ] Tests document expected behavior clearly

---

## Pack 5: Repo Review Before Merge

**When:** Reviewing a PR or branch before merging to main. Catch issues a human reviewer might miss.

### Start Prompt
```
You are a senior code reviewer. Review branch {BRANCH_NAME} before merge.

Phase 1 — Diff analysis:
1. git diff main...{branch} --stat — get the scope of change
2. git diff main...{branch} — read the full diff
3. Classify each changed file: new feature / bug fix / refactor / config / test

Phase 2 — Systematic review:
For each changed source file:
a. Does the change do what the PR description says?
b. Are there any obvious bugs (null deref, off-by-one, race condition)?
c. Is there missing error handling at I/O or network boundaries?
d. Are there hardcoded values that should be config?
e. Are there any security concerns (injection, auth bypass, secret exposure)?
f. Is the change covered by tests?

Phase 3 — Cross-cutting checks:
5. Are there any new dependencies? Check their license and security posture.
6. Does the diff include any changes to .env files or secrets? BLOCK if yes.
7. Does the migration (if any) have a rollback plan?
8. Does the API change break existing consumers?

Phase 4 — Report:
9. Output structured report with sections:
   BLOCK: must fix before merge
   REQUEST: should fix before merge
   SUGGEST: optional improvements
   PRAISE: good patterns worth keeping
```

### Verification Steps
- [ ] Full diff was read (not just summary)
- [ ] All BLOCK items documented with specific line references
- [ ] Security check completed (secrets, injection, auth)
- [ ] Test coverage assessed for changed code
- [ ] Migration/rollback plan verified if applicable

### Subagent Opportunities
- Use `/cc-council` for adversarial multi-perspective review (security + performance + architecture)
- Delegate security scan to a security-reviewer subagent

### Common Failure Modes
- **Shallow review**: skimming the diff without reading full context
- **Ignoring tests**: not checking if tests cover the change
- **Missing cross-cutting**: not checking auth, logging, config for new features
- **Blocking on style**: using BLOCK for minor style preferences instead of REQUEST/SUGGEST

### Completion Checklist
- [ ] Structured report produced (BLOCK / REQUEST / SUGGEST / PRAISE)
- [ ] All BLOCK items have file:line references
- [ ] Security checklist completed
- [ ] No opinions stated without evidence from the code

---

## Pack 6: Generate CLAUDE.md for an Existing Repo

**When:** A project has no CLAUDE.md and you need to bootstrap one from the existing codebase.

### Start Prompt
```
You are a Claude Code architect. Generate a CLAUDE.md for this repository.

Phase 1 — Detect:
1. Read: package.json / pyproject.toml / Cargo.toml / go.mod (whichever exists)
2. Check for: .eslintrc, .prettierrc, .editorconfig, tsconfig.json, pyproject.toml [tool.black]
3. Find test runner: jest.config*, vitest.config*, pytest.ini, conftest.py
4. Find CI: .github/workflows/, .gitlab-ci.yml, Jenkinsfile
5. Read README.md (first 50 lines)

Phase 2 — Extract:
6. Install command (from package.json scripts.install or README)
7. Build command (from scripts.build or Makefile)
8. Test command (from scripts.test or CI config)
9. Lint command (from scripts.lint or linter config)
10. Key directories (src/, lib/, app/, tests/, docs/)

Phase 3 — Write CLAUDE.md:
Output a CLAUDE.md under 150 lines that is a routing file, not a knowledge dump:
- Build & Test section (all commands)
- Tech stack table (5-10 rows max)
- Key paths (3-6 entries)
- Architecture (1 paragraph, repo-specific — not generic)
- Decision trees (3-5 entries pointing to specific directories)
- Conventions (extracted from linter configs, not invented)
- Don't Touch (lock files, generated dirs, build output)

Write to: CLAUDE.md
```

### Verification Steps
- [ ] All commands verified to actually work (run install, build, test)
- [ ] Architecture paragraph is specific to this repo (not generic)
- [ ] Decision trees point to real directories that exist
- [ ] Conventions extracted from actual config files, not assumed
- [ ] File is under 150 lines

### Subagent Opportunities
- Use `/cc-setup --audit` after generating CLAUDE.md to get a setup score
- Delegate rules file generation to a second pass

### Common Failure Modes
- **Generic CLAUDE.md**: using template boilerplate without customizing to the actual codebase
- **Wrong commands**: not verifying commands actually run
- **Too long**: adding documentation instead of routing

### Completion Checklist
- [ ] CLAUDE.md written, under 150 lines
- [ ] All build/test commands verified
- [ ] Architecture paragraph is specific and accurate

---

## Pack 7: Create a Migration Plan Before Making Edits

**When:** About to make large structural changes (database schema, API refactor, framework upgrade, module reorganization). Plan before touching code.

### Start Prompt
```
You are a migration architect. Before any code changes, produce a complete migration plan for: {DESCRIBE MIGRATION}.

Phase 1 — Inventory:
1. Map everything affected: files, tables, API endpoints, consumers, configs
2. List all dependencies (what depends on what you're changing)
3. Identify the blast radius: small (1-3 files) / medium (4-20 files) / large (20+)

Phase 2 — Risk assessment:
4. Identify data-loss risks (especially for database migrations)
5. Identify breaking changes (API changes that affect consumers)
6. Identify rollback complexity: can this be undone in < 30 minutes?

Phase 3 — Sequencing:
7. Break the migration into atomic phases that each leave the system working
8. Phase ordering rule: never leave the system broken between phases
9. Identify which phases can be deployed independently vs. require coordinated deployment

Phase 4 — Write the plan:
Output to .claude/migration-plan.md:
- Summary (1 paragraph)
- Blast radius assessment
- Phase breakdown (each phase: what changes, how to verify, how to rollback)
- Data migration scripts (if applicable)
- Rollback procedure
- Validation checklist

STOP here. Do not write any code yet. Wait for plan approval.
```

### Verification Steps
- [ ] All affected files/tables/endpoints inventoried
- [ ] Rollback procedure is concrete and testable
- [ ] Each phase leaves the system in a working state
- [ ] Plan written to `.claude/migration-plan.md`
- [ ] Plan reviewed and approved before any code written

### Subagent Opportunities
- Use a subagent to enumerate all import sites of modules being moved
- Use the principal-engineer-strategist agent for risk review of the plan

### Common Failure Modes
- **Skipping the plan**: going straight to code on large migrations
- **Missing consumers**: not finding all callers of an API or all readers of a database table
- **No rollback**: planning forward-only migrations
- **Big bang**: not breaking the migration into deployable phases

### Completion Checklist
- [ ] `.claude/migration-plan.md` written and reviewed
- [ ] Rollback procedure documented and tested mentally
- [ ] Go-ahead explicitly given before any code changes
