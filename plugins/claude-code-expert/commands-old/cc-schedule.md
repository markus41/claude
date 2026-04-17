---
name: cc-schedule
intent: Generate optimized scheduled-task prompts for desktop, cloud, and loop-based autonomous maintenance with guardrails for branching, verification, and skip conditions
tags:
  - claude-code-expert
  - command
  - scheduling
  - automation
  - maintenance
  - autonomous
arguments:
  - name: blueprint
    description: Name of the maintenance blueprint to generate (omit to list all)
    required: false
    type: string
flags:
  - name: target
    description: Deployment target for the generated task
    type: choice
    choices: [desktop, cloud, loop]
    default: desktop
  - name: list
    description: List all available blueprints without generating
    type: boolean
    default: false
  - name: dry-run
    description: Show the generated prompt without writing any task
    type: boolean
    default: false
  - name: interval
    description: Override the default schedule interval (e.g. 30m, 4h, daily, weekly)
    type: string
  - name: branch
    description: Branch to create work on (blueprints that write code use this)
    type: string
    default: claude/scheduled-maintenance
risk: low
cost: medium
---

# /cc-schedule — Scheduled-Task Blueprint Generator

Turn Claude Code into a recurring autonomous operator. `/cc-schedule` produces optimized, guardrailed prompts for common engineering maintenance workflows — ready to run on Desktop, Cloud, or in-session via `/loop`.

## Usage

```bash
/cc-schedule                              # Interactive: pick blueprint + target
/cc-schedule --list                       # Show all available blueprints
/cc-schedule pr-review                    # Daily PR review prompt → desktop task
/cc-schedule pr-review --target loop      # Same prompt → /loop command
/cc-schedule pr-review --target cloud     # Same prompt → cloud API payload
/cc-schedule ci-triage --interval 2h      # Override default interval
/cc-schedule dep-audit --dry-run          # Preview prompt without scheduling
/cc-schedule branch-hygiene --branch claude/hygiene-$(date +%Y%m%d)
```

---

## Available Blueprints

| Blueprint | Default Schedule | Target | What It Does |
|-----------|-----------------|--------|--------------|
| `pr-review` | Daily 9am weekdays | Desktop/Cloud | Review all open PRs for staleness, missing reviews, CI status |
| `ci-triage` | Every 2h | Loop/Desktop | Triage CI failures, post root-cause analysis as PR comments |
| `dep-audit` | Weekly Monday 8am | Desktop/Cloud | Audit dependencies for vulnerabilities and outdated packages |
| `docs-drift` | On push to main (via hook) | Cloud | Check if docs are in sync with code after merges |
| `release-check` | Daily during release weeks | Desktop | Release-readiness checklist: tests, changelogs, version bumps |
| `branch-hygiene` | Weekly Friday 5pm | Desktop/Cloud | Close stale PRs, delete merged branches, report inactivity |

---

## Deployment Profiles

### Profile 1: Desktop Task (`--target desktop`)

Runs on your local machine via Claude Desktop. Requires Desktop app to be open. Has full access to local files, git, MCP servers, and project context.

**When to use:** Daily dev workflows, tasks needing local filesystem or MCP access, tasks requiring git operations.

**Output format:** Desktop task configuration you can paste into Desktop settings.

```
Name: {blueprint_name}
Schedule: {cron_expression}
Prompt: {generated_prompt}
Working directory: {cwd}
Allowed tools: Bash, Read, Glob, Grep, Write, Edit
```

### Profile 2: Cloud Task (`--target cloud`)

Runs on Anthropic's cloud infrastructure. No machine required. Gets a fresh clone of your repo via GitHub connector. No local file access.

**When to use:** Nightly/weekly tasks that must run without your machine being on. Continuous monitoring. GitHub-native workflows.

**Output format:** JSON payload for the Cloud Scheduled Tasks API + setup instructions.

**Limitations:**
- No local MCP servers (only connectors configured per task)
- No write access to local files (must push via GitHub API)
- Minimum interval: 1 hour

### Profile 3: In-Session Loop (`--target loop`)

Runs inside your current Claude Code session. Lowest setup cost. Session-scoped (lost on restart). Good for temporary babysitting.

**When to use:** Monitoring a deployment in progress, watching CI on a PR, temporary polling during a focused work session.

**Output format:** `/loop` command you can paste directly.

```
/loop {interval} {generated_prompt}
```

---

## Blueprint Specifications

### `pr-review` — Daily PR Review

**Default schedule:** `0 9 * * 1-5` (weekdays at 9am local)  
**Target:** Desktop or Cloud  
**Branch policy:** Read-only (no commits)

**Generated prompt:**
```
You are a senior engineer running the daily PR review triage for this repository.

SKIP CONDITIONS:
- If today is a weekend or holiday, output "Skipping: non-business day" and stop.
- If there are no open PRs, output "No open PRs found. Done." and stop.

STEPS:
1. Run: git fetch origin && gh pr list --state open --json number,title,author,createdAt,reviews,statusCheckRollup,isDraft
2. For each open PR (excluding drafts):
   a. Check CI status (passing/failing/pending)
   b. Check review status (approved/changes-requested/awaiting review)
   c. Calculate days open
3. Classify each PR:
   - STALE: open > 7 days with no activity
   - BLOCKED: failing CI or changes-requested with no response > 48h
   - READY: CI passing + approved, not yet merged
   - NEEDS_REVIEW: CI passing, 0 reviews
   - IN_PROGRESS: CI pending or active review happening
4. Output a markdown table:
   | PR # | Title | Status | Days Open | Blocking Reason |

GUARDRAILS:
- Do not approve, merge, or close any PR
- Do not push any commits
- If you encounter an error fetching PR data, log it and continue with the remaining PRs
- Maximum 50 PRs per run

VERIFICATION:
After outputting the table, count: total / stale / blocked / ready / needs-review.
If stale > 5, add a priority alert: "⚠️ 5+ stale PRs detected — team follow-up recommended."
```

---

### `ci-triage` — Nightly CI Failure Triage

**Default schedule:** `0 */2 * * *` (every 2 hours)  
**Target:** Loop or Desktop  
**Branch policy:** Read-only (analysis only, no fixes)

**Generated prompt:**
```
You are a CI reliability engineer monitoring this repository's pipelines.

SKIP CONDITIONS:
- If no CI failures exist in the last 2 hours, output "All CI checks passing. Done." and stop.
- If the same failure has been reported in the last run, output "No new failures since last check. Done." and stop.

STEPS:
1. Fetch recent CI runs: gh run list --limit 20 --json status,conclusion,name,headBranch,createdAt,url
2. Filter for failures in the last 2 hours: conclusion == "failure"
3. For each failing run:
   a. Get the failed step: gh run view {id} --log-failed | head -100
   b. Categorize the failure:
      - FLAKY: same test failed then passed on retry
      - ENV: missing env var, secret, or infrastructure issue
      - CODE: actual test or build failure from a code change
      - INFRA: runner outage, timeout, or Docker issue
4. For CODE failures on non-main branches: post a comment on the associated PR with root-cause analysis
5. For INFRA failures: alert with "Infrastructure issue detected — may resolve on retry"

GUARDRAILS:
- Do not trigger re-runs automatically
- Do not modify any workflow files
- Only post comments on PRs where a human has already commented (avoid spamming abandoned PRs)
- If posting a comment fails, log the error and skip that PR

VERIFICATION:
Output summary: {N} failures analyzed, {M} root-cause comments posted, {K} skipped.
```

---

### `dep-audit` — Weekly Dependency Audit

**Default schedule:** `0 8 * * 1` (Monday 8am local)  
**Target:** Desktop or Cloud  
**Branch policy:** Creates branch `claude/dep-audit-{YYYYMMDD}` for PRs with fixes

**Generated prompt:**
```
You are a dependency security engineer running the weekly audit.

SKIP CONDITIONS:
- If a dep-audit PR was merged in the last 7 days, output "Recent audit already completed. Done." and stop.
- If the repo has no package.json, requirements.txt, Cargo.toml, or go.mod, output "No dependency manifests found. Done." and stop.

STEPS:
1. Detect package manager(s):
   - Node.js: run `npm audit --json` or `pnpm audit --json`
   - Python: run `pip-audit --format json` or `safety check --json`
   - Rust: run `cargo audit --json`
   - Go: run `govulncheck ./...`
2. Parse results and classify:
   - CRITICAL: CVSS >= 9.0 — must fix
   - HIGH: CVSS 7.0-8.9 — fix this sprint
   - MEDIUM: CVSS 4.0-6.9 — fix next sprint
   - LOW: CVSS < 4.0 — log only
3. Also run: npm outdated --json (or equivalent)
4. For CRITICAL and HIGH vulnerabilities:
   a. Create branch: claude/dep-audit-{YYYYMMDD}
   b. Apply auto-fixable updates: npm audit fix or pip install --upgrade {package}
   c. Run tests: {detected_test_cmd}
   d. If tests pass: commit with message "fix(deps): resolve {N} security vulnerabilities"
   e. Open a PR with the full audit report in the description
5. For MEDIUM/LOW: add to a markdown report only (no auto-fix)

GUARDRAILS:
- Never run npm audit fix --force (breaks semver compatibility)
- If tests fail after update, revert the change and note it as "manual fix required"
- Only auto-fix packages with patch or minor version bumps
- Maximum 20 packages updated in a single run

VERIFICATION:
Output: {N} critical, {M} high, {K} medium, {J} low. PR created: {url or "none"}.
```

---

### `docs-drift` — Documentation Drift Check

**Default schedule:** `0 10 * * 1` (Monday 10am) or triggered post-merge  
**Target:** Desktop or Cloud  
**Branch policy:** Creates branch `claude/docs-drift-{YYYYMMDD}` for minor fixes

**Generated prompt:**
```
You are a technical writer auditing documentation accuracy after recent code changes.

SKIP CONDITIONS:
- If HEAD has not changed since last docs check (compare git hash to stored value), output "No new commits. Done." and stop.
- If the only changes since last check are to non-source files (only *.md, *.json config), output "No source changes affecting docs. Done." and stop.

STEPS:
1. Get changed source files since last week: git log --since="7 days ago" --name-only --pretty=format: | sort -u | grep -v ".md"
2. For each changed file:
   a. Find related docs: grep -r "{module_name}" docs/ README.md --include="*.md" -l
   b. Check if API signatures changed: git diff HEAD~{N} -- {file} | grep "^+" | grep -E "export (function|class|const|interface)"
   c. Compare with docs mentions
3. Categorize drift:
   - BROKEN_LINK: docs reference a function/class that no longer exists
   - OUTDATED_PARAM: function signature changed but docs show old params
   - MISSING_DOC: exported symbol has no documentation
   - STALE_EXAMPLE: code example in docs won't run with current API
4. For BROKEN_LINK and STALE_EXAMPLE (high-confidence fixes):
   a. Create branch: claude/docs-drift-{YYYYMMDD}
   b. Apply fix
   c. Open PR with diff
5. For OUTDATED_PARAM and MISSING_DOC: open a GitHub issue per item

GUARDRAILS:
- Never delete documentation sections — only update or add
- If unsure whether a change is correct, create an issue instead of a PR
- Do not modify CHANGELOG.md or ADR files

VERIFICATION:
Output: {N} drifts found: {M} auto-fixed (PR: {url}), {K} issues created, {J} skipped.
```

---

### `release-check` — Release Readiness Review

**Default schedule:** `0 9 * * *` during release sprint (daily)  
**Target:** Desktop  
**Branch policy:** Read-only

**Generated prompt:**
```
You are a release manager running the daily release-readiness checklist.

SKIP CONDITIONS:
- If there is no active release branch (release/*, hotfix/*), output "No active release branch. Done." and stop.
- If today is more than 3 days past the planned release date (check CHANGELOG.md or milestone), output warning and stop.

CHECKLIST (run each item and report PASS/FAIL/WARN):

1. TESTS: Run {test_cmd} on the release branch. PASS if all green.
2. COVERAGE: Check coverage report. WARN if below {coverage_threshold}%.
3. CHANGELOG: Verify CHANGELOG.md has an entry for this version. FAIL if missing.
4. VERSION_BUMP: Check package.json/pyproject.toml/Cargo.toml version matches release branch name. FAIL if mismatch.
5. OPEN_BLOCKERS: Query gh issue list --label "release-blocker" --state open. FAIL if any exist.
6. MIGRATION: Check if db/migrations/ has new files. If yes, verify migration runbook exists in docs/.
7. ROLLBACK: Check if rollback procedure is documented. WARN if not found.
8. DOCKER: If Dockerfile exists, verify image is not tagged :latest. WARN if it is.
9. ENV_VARS: Diff .env.example between main and release branch. FAIL if new required vars have no docs.
10. APPROVALS: gh pr view {release_pr} --json reviews. FAIL if not approved by 2+ reviewers.

GUARDRAILS:
- Do not merge the release branch
- Do not trigger deployments
- Report all FAIL items to the team via a GitHub comment on the release PR

VERIFICATION:
Output: {N}/10 checks passing. BLOCKERS: {list of FAIL items}.
Post checklist as a comment on the release PR.
```

---

### `branch-hygiene` — Branch & PR Cleanup

**Default schedule:** `0 17 * * 5` (Friday 5pm local)  
**Target:** Desktop or Cloud  
**Branch policy:** Deletes only merged branches; never deletes active branches

**Generated prompt:**
```
You are a repository maintainer running the weekly branch hygiene pass.

SKIP CONDITIONS:
- If a hygiene run was completed in the last 6 days, output "Recent hygiene run found. Done." and stop.

STEPS:

PHASE 1 — Merged branch cleanup:
1. List merged branches: git branch -r --merged origin/main | grep -v "origin/main\|origin/HEAD"
2. For each merged remote branch:
   a. Verify it's not a protected branch (main, develop, release/*, hotfix/*)
   b. Delete: git push origin --delete {branch}
3. Count deleted, report list.

PHASE 2 — Stale PR identification:
1. gh pr list --state open --json number,title,author,updatedAt,isDraft
2. Flag PRs where updatedAt > 14 days ago as STALE
3. Flag PRs where updatedAt > 30 days ago as ABANDONED
4. For STALE PRs: post a comment "@{author} — this PR has been inactive for 14+ days. Is it still in progress?"
5. For ABANDONED PRs: post a comment and apply label "stale" if not already applied

PHASE 3 — Empty or test branches:
1. List branches with no PRs: compare `git branch -r` to `gh pr list --state all`
2. For branches with no associated PR older than 30 days: list as candidates for deletion (do NOT delete automatically)

GUARDRAILS:
- NEVER delete: main, master, develop, staging, production, release/*, hotfix/*, feature/* with open PR
- NEVER close PRs automatically — only comment and label
- Before deleting any branch, verify it is fully merged: git log origin/main..origin/{branch} | wc -l == 0
- Maximum 20 branch deletions per run

VERIFICATION:
Output: {N} merged branches deleted, {M} stale PRs commented, {K} abandoned PRs labeled, {J} candidate branches for manual review.
```

---

## Guardrail Standard

Every generated prompt includes these standard guardrails:

### Branch Naming
```
Branch convention for automated work:
- Analysis only:     No branch (read-only)
- Minor fixes:       claude/scheduled-maintenance-{YYYYMMDD}
- Dep updates:       claude/dep-audit-{YYYYMMDD}
- Doc fixes:         claude/docs-drift-{YYYYMMDD}
- Never use:         main, master, develop, or any protected branch
```

### Skip Conditions
Every prompt starts with explicit skip conditions to prevent unnecessary runs:
- Non-business day check
- Recent same-type run check
- No applicable content check (no open PRs, no failures, etc.)

### Verification Block
Every prompt ends with a verification step that counts outcomes and flags anomalies.

### Fail-Safe Defaults
- Never merge, approve, or deploy automatically
- Never force-push
- Never delete branches that aren't fully merged
- Always run tests before committing any automated changes
- If tests fail, revert and report — do not push broken code

---

## Output Examples

### Desktop task output

```
=== Desktop Task Configuration ===
Name: Daily PR Review
Schedule: 0 9 * * 1-5 (Weekdays at 9:00 AM)
Working Directory: /path/to/your/repo
Allowed Tools: Bash, Read, Glob, Grep

Prompt:
---
{full generated prompt for pr-review}
---

To create this task:
1. Open Claude Desktop
2. Navigate to Settings → Scheduled Tasks
3. Click "New Task"
4. Paste the configuration above
```

### Cloud task output

```
=== Cloud Scheduled Task ===
POST https://api.anthropic.com/v1/scheduled_tasks

{
  "name": "Weekly Dependency Audit",
  "schedule": "0 8 * * 1",
  "model": "claude-sonnet-4-6",
  "system_prompt": "You are an autonomous dependency security engineer...",
  "prompt": "{generated_prompt}",
  "connectors": [
    { "type": "github", "repo": "{owner}/{repo}" }
  ]
}

Note: Cloud tasks require GitHub connector configured for your repo.
Minimum interval: 1 hour. No local file access.
```

### Loop output

```
=== In-Session Loop Command ===
Paste this into your Claude Code session:

/loop 2h You are a CI reliability engineer. SKIP CONDITIONS: [...]

Note: This loop runs in your current session and is lost on restart.
Use Desktop or Cloud for persistent scheduling.
```

---

## Interactive Mode

When invoked without arguments, `/cc-schedule` runs interactively:

```
=== /cc-schedule — Maintenance Blueprint Generator ===

Available blueprints:
  1. pr-review       — Daily PR review (default: weekdays 9am)
  2. ci-triage       — CI failure triage (default: every 2h)
  3. dep-audit       — Dependency security audit (default: Monday 8am)
  4. docs-drift      — Documentation drift check (default: Monday 10am)
  5. release-check   — Release readiness review (default: daily)
  6. branch-hygiene  — Branch and PR cleanup (default: Friday 5pm)

Select blueprint (1-6):
> _

Target:
  1. desktop  — Local machine via Desktop app (recommended for most tasks)
  2. cloud    — Anthropic cloud (runs without your machine)
  3. loop     — In-session polling (temporary, lost on restart)

Select target (1-3):
> _

[Generates and displays the configured prompt]
[Optionally schedules the task directly if target is loop]
```
