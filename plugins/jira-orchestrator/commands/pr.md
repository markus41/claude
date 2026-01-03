---
name: jira:pr
description: Create, fix, or iterate on pull requests for Jira issues
arguments:
  - name: issue_key
    description: Jira issue key for PR
    required: true
  - name: base
    description: Base branch for PR
    default: main
  - name: draft
    description: Create as draft PR
    default: false
  - name: reviewers
    description: Comma-separated list of reviewers
    required: false
  - name: fix
    description: Fix review comments and re-review (replaces /pr-fix)
    default: false
  - name: iterate
    description: Iterate on feedback with auto-review (replaces /iterate)
    default: false
  - name: max_iterations
    description: Max fix attempts before escalation (with --iterate)
    default: 3
tags:
  - jira
  - git
  - pull-request
  - automation
examples:
  - command: /jira:pr ABC-123
  - command: /jira:pr ABC-123 --fix
  - command: /jira:pr ABC-123 --iterate --max_iterations 5
  - command: /jira:pr ABC-123 main false user1,user2
aliases:
  - pr-fix (deprecated -> use --fix)
  - iterate (deprecated -> use --iterate)
---

> ⚠️ **Migration Notice:** This command now consolidates `/pr-fix` and `/jira:iterate`.
> - Old: `/pr-fix <pr-url> --jira PROJ-123` → New: `/jira:pr PROJ-123 --fix`
> - Old: `/jira:iterate PROJ-123 --max_iterations 3` → New: `/jira:pr PROJ-123 --iterate --max_iterations 3`
>
> The deprecated commands still work but will be removed in a future release.

# Jira PR Creation Command

Create comprehensive pull requests for completed Jira issues with automated validation, generation, and Jira updates.

## Prerequisites

- Git repository initialized
- All work committed and pushed
- No uncommitted changes
- Tests passing
- No merge conflicts with base branch
- GitHub CLI (gh) installed and authenticated

## Flag Validation

**Mutual Exclusivity Rules:**
```yaml
# --fix and --iterate cannot be used together
validation:
  mutually_exclusive:
    - [fix, iterate]

# Error if both specified
if: fix == true AND iterate == true
error: "Cannot use --fix and --iterate together. Use --fix for one-time fixes, --iterate for continuous fix-review loops."

# Mode determination
mode:
  create: fix == false AND iterate == false  # Default: create new PR
  fix:    fix == true                         # One-time fix cycle
  iterate: iterate == true                    # Continuous fix-review loop
```

**Validation Example:**
```bash
# Valid usage
/jira:pr ABC-123                           # Create PR
/jira:pr ABC-123 --fix                     # Fix review comments
/jira:pr ABC-123 --iterate --max_iterations 5  # Iterate until approved

# Invalid - will error
/jira:pr ABC-123 --fix --iterate  # ERROR: mutually exclusive flags
```

## Core Workflow

**Validate → Fetch Issue → Branch → Analyze Changes → Generate PR → Push → Create PR → Update Jira**

## Quick Start

```bash
# Basic PR creation
/jira:pr ABC-123

# PR with specific base branch
/jira:pr ABC-123 develop

# Draft PR
/jira:pr ABC-123 main true

# PR with reviewers
/jira:pr ABC-123 main false user1,user2,team:backend-team
```

## PR Generation Details

**Title Format:** `ISSUE-KEY: Summary` (max 72 chars)

**Description Includes:**
- Summary overview
- Feature list with categorized changes
- Acceptance criteria from Jira
- Test coverage report
- Manual testing instructions
- Deployment notes (breaking changes, migrations, env vars, dependencies)
- Related issues
- Code review checklist

**Example Generated Title:**
```
ABC-123: Implement user authentication with OAuth2
```

## Step-by-Step Execution

### 1. Pre-flight Validation
- Check git repository status
- Verify no uncommitted changes
- Validate tests are passing
- Check for merge conflicts with base branch

### 2. Fetch Jira Issue Details
- Retrieve issue summary, description, type
- Extract acceptance criteria
- Get issue labels, priority, story points
- Identify subtasks and related issues

### 3. Create/Verify Feature Branch
- Auto-detect or create feature branch
- Follow convention: `feature/ISSUE-KEY-description`
- Fetch base branch for conflict check

### 4. Analyze Changes
- Get commit history since base branch
- Categorize changed files (frontend/backend/tests/docs)
- Count insertions/deletions
- Identify breaking changes

### 5. Generate PR Metadata
- Build title with issue key and summary
- Categorize commits into sections
- Extract test results
- Generate manual testing steps

### 6. Push to Remote
- Push feature branch with upstream tracking
- Handle push conflicts (rebase and retry)
- Re-run tests after rebase

### 7. Dynamic Reviewer Selection
Agent-router automatically selects domain-specific reviewers:

| File Domain | Recommended Reviewers |
|---|---|
| Frontend (.tsx, .jsx, .css) | react-component-architect, accessibility-expert |
| Backend (api/, service/) | backend-architect, api-security-expert |
| Database (.prisma, .sql) | database-specialist, data-architect |
| Testing (.test.ts, .spec.ts) | test-writer-fixer, coverage-analyzer |
| Documentation (.md, ADR) | codebase-documenter, technical-writer |

Manual override via `--reviewers` argument merges with auto-selected reviewers.

### 8. Create PR via GitHub CLI
- Build labels from Jira issue type and labels
- Add milestone from Jira fixVersion
- Create PR with all metadata
- Capture PR URL and number

### 9. Update Jira Issue
- Add comment with PR link and summary
- Transition issue to "In Review" (unless draft)
- Log dynamic reviewer selection details
- Add "has-pr" label

### 10. Request Reviews
- Request reviews from dynamically selected agents
- Document which reviewers were auto-selected vs. manual
- Mention reviewers in Jira comment

## Error Handling

| Error | Solution |
|-------|----------|
| Invalid issue key | Must match PROJECT-123 format |
| Issue not found | Verify issue exists and you have access |
| Uncommitted changes | Commit all changes first |
| Tests failing | Fix failing tests before PR |
| Merge conflicts | Rebase on base branch |
| Push failed | Check permissions and network |
| gh CLI not installed | Install from https://cli.github.com/ |
| gh not authenticated | Run `gh auth login` |
| Reviewer not found | Verify GitHub username and repo access |

## Output

Success message shows:
- PR URL and number
- Issue key and branch info
- File changes summary
- Test status and coverage
- Dynamically selected reviewers
- Jira updates confirmation

## Configuration

```bash
# Environment variables
JIRA_URL=https://your-instance.atlassian.net
GITHUB_REPO=org/repo
DEFAULT_BASE_BRANCH=main

# Customizable
JIRA_CUSTOM_FIELD_STORY_POINTS=customfield_10016
TEST_COMMAND="npm test"  # or pytest, mvn test
COVERAGE_COMMAND="npm run coverage"
```

## Dynamic Reviewer Selection Notes

- Agent-router analyzes changed files during PR creation
- Selection based on file-agent-mapping.yaml patterns
- Manual reviewers specified via `--reviewers` merge with auto-selected
- Selection logic documented in Jira comments
- Enables focused code reviews by domain experts

---

## Fix Mode (`--fix`)

When `--fix` is enabled, the command enters PR fix workflow:

### Fix Workflow
1. **Collect Issues** - Fetch PR comments, categorize by severity (critical/high/medium/low)
2. **Plan Fixes** - Group by file, order by dependency (security→structural→quality)
3. **Execute Fixes** - Apply fixes, run tests, verify resolution
4. **Update PR** - Push commits, reply to comments, update description
5. **Council Review** - Run focused council review (code-reviewer + domain specialists)

### Fix Priorities
```yaml
critical: always fix (security, breaking changes)
high: always fix (quality, performance)
medium: fix if time permits
low: optional (nitpicks)
```

---

## Iterate Mode (`--iterate`)

When `--iterate` is enabled, runs iterative fix-review loop:

### Iterate Workflow
1. **Gather Feedback** - Auto-detect PR, fetch comments
2. **Categorize** - critical | warning | suggestion | question | resolved
3. **Apply Fixes** - Per-file fixes with test validation
4. **Push & Update** - Commit, push, update PR description
5. **Re-Review** - Spawn focused council, verify fixes
6. **Loop** - Repeat until approved or max_iterations reached

### Escalation (after max_iterations)
- Same comment unfixed 2x → escalate
- Critical count not decreasing → escalate
- Iteration > 30 min → escalate

---

## Query Optimization

All Jira/Confluence queries use optimized patterns:
- Field limiting: `fields: ["key", "summary", "status"]`
- Pagination: `maxResults: 25`
- Indexed fields first in JQL

---

## Troubleshooting

**PR created but Jira not updated:**
- Check Jira API connectivity and permissions
- Verify issue key is valid
- Manually add PR link to Jira comment

**Reviewers not requested:**
- Verify GitHub usernames are correct
- Check repository access permissions
- Confirm account exists

**Tests not detected:**
- Configure TEST_COMMAND for your project type
- Ensure test runner is installed

## Integration

Complete development workflow:
```
/jira:work ABC-123 → develop → /jira:commit → /jira:pr ABC-123 → review → merge
```

## Related Commands

- `/jira:commit` - Create smart commit with Jira updates
- `/jira:sync` - Manually sync PR to Jira
- `/jira:work` - Start work on issue

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
