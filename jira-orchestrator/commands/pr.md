---
name: jira:pr
description: Create a pull request for completed Jira issue work
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
---

# Jira PR Creation Command

Create a comprehensive pull request for completed Jira issue work with automated validation, PR generation, and Jira updates.

## Issue Details

**Issue Key:** ${issue_key}
**Base Branch:** ${base}
**Draft PR:** ${draft}
**Reviewers:** ${reviewers}

## Step 1: Pre-flight Validation

Before creating the PR, validate that all work is complete and meets quality standards.

### Actions:
```
1. Validate issue key format matches pattern: [A-Z]+-[0-9]+
2. If invalid, respond with error and exit
3. Check git repository status:
   - Verify we are in a git repository
   - Check for uncommitted changes
   - Identify current branch
4. Verify work is complete:
   - All changes committed
   - Tests are passing
   - No merge conflicts with base branch
5. If any validation fails, halt and provide clear error message
```

### Validation Commands:
```bash
# Check git repository
git rev-parse --git-dir 2>&1

# Check for uncommitted changes
git status --porcelain

# Get current branch
git rev-parse --abbrev-ref HEAD

# Check if tests pass (project-specific, adapt as needed)
npm test || pytest || mvn test || ./gradlew test || echo "No test command configured"
```

### Validation Checklist:
- [ ] Valid Jira issue key format
- [ ] In a git repository
- [ ] No uncommitted changes (clean working directory)
- [ ] On a feature branch (not on main/master directly)
- [ ] All tests passing
- [ ] No merge conflicts with base branch

## Step 2: Fetch Jira Issue Details

Retrieve complete issue information to generate comprehensive PR description.

### Actions:
```
1. Use mcp__atlassian__jira_get_issue with issue_key parameter
2. Extract all relevant fields:
   - summary: Issue title
   - description: Full description with formatting
   - issuetype: Bug, Story, Task, Epic, etc.
   - status: Current status
   - priority: Issue priority
   - assignee: Assigned user
   - reporter: Reporter
   - labels: All labels
   - components: Components
   - fixVersions: Target versions
   - customfield_10016: Story points (adjust field ID for your instance)
   - customfield_10037: Acceptance criteria (adjust field ID for your instance)
   - subtasks: All subtasks if any
   - parent: Parent issue if exists
   - attachment: Screenshots or files
3. Parse acceptance criteria from description or custom field
4. Extract related issues and dependencies
5. Get issue history to understand recent changes
```

### Issue Data Structure:
```json
{
  "key": "${issue_key}",
  "fields": {
    "summary": "Issue title",
    "description": "Full description",
    "issuetype": {"name": "Story"},
    "status": {"name": "In Progress"},
    "priority": {"name": "High"},
    "assignee": {"displayName": "Developer"},
    "labels": ["backend", "api"],
    "components": [{"name": "Auth Service"}],
    "customfield_10016": 5,
    "customfield_10037": "Acceptance criteria text"
  }
}
```

## Step 3: Create or Verify Feature Branch

Ensure we're on the correct feature branch for this issue.

### Branch Naming Convention:
```
feature/${issue_key}-{short-description}

Examples:
  feature/ABC-123-user-authentication
  feature/PROJ-456-fix-memory-leak
  feature/DEV-789-add-logging
```

### Actions:
```
1. Get current branch name
2. Check if current branch follows convention (contains issue key)
3. If on main/master or incorrect branch:
   a. Check if feature branch already exists remotely
   b. If exists, checkout existing branch
   c. If not exists, create new feature branch from current HEAD
   d. Use kebab-case for description from issue summary
4. If already on correct feature branch, continue
5. Fetch latest base branch changes
6. Check for merge conflicts with base branch
```

### Branch Creation Commands:
```bash
# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create feature branch if needed
BRANCH_NAME="feature/${issue_key}-$(echo '${summary}' | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-50)"

# Check if branch exists remotely
git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"

# Create or checkout branch
if [ $? -eq 0 ]; then
  git checkout "$BRANCH_NAME"
  git pull origin "$BRANCH_NAME"
else
  git checkout -b "$BRANCH_NAME"
fi

# Fetch base branch
git fetch origin "${base}:${base}"

# Check for conflicts (don't merge, just check)
git merge-tree $(git merge-base HEAD origin/${base}) HEAD origin/${base} | grep -q '^<<<<<'
```

## Step 4: Analyze Changes

Review all changes since branching from base to generate accurate PR description.

### Actions:
```
1. Get commit history since branching from base branch
2. Analyze changed files and their purposes
3. Identify categories of changes:
   - Features added
   - Bugs fixed
   - Refactoring done
   - Tests added/modified
   - Documentation updated
   - Dependencies changed
   - Configuration modified
4. Count lines added/removed by category
5. Identify breaking changes or migrations needed
6. Extract key implementation details from commits
```

### Analysis Commands:
```bash
# Get commit history
git log origin/${base}..HEAD --oneline

# Get detailed diff
git diff origin/${base}...HEAD --stat

# Get changed files by type
git diff origin/${base}...HEAD --name-only | grep -E '\.(ts|tsx|js|jsx)$' # Frontend
git diff origin/${base}...HEAD --name-only | grep -E '\.(py|java|go)$' # Backend
git diff origin/${base}...HEAD --name-only | grep -E 'test|spec' # Tests
git diff origin/${base}...HEAD --name-only | grep -E '\.md$|docs/' # Docs

# Count changes
git diff origin/${base}...HEAD --shortstat
```

## Step 5: Generate PR Title

Create a clear, concise PR title following best practices.

### Title Format:
```
${issue_key}: ${summary}

Examples:
  ABC-123: Implement user authentication with OAuth2
  PROJ-456: Fix memory leak in image processing
  DEV-789: Add structured logging to payment service
```

### Title Rules:
```
1. Always prefix with Jira issue key
2. Use imperative mood (e.g., "Add", "Fix", "Update", not "Added", "Fixed", "Updated")
3. Keep under 72 characters
4. Capitalize first word after colon
5. No period at the end
6. Be specific and descriptive
```

### Title Generation:
```
# Extract summary from Jira
SUMMARY="${summary from Jira}"

# Clean and format
CLEAN_SUMMARY=$(echo "$SUMMARY" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | cut -c1-60)

# Build title
PR_TITLE="${issue_key}: $CLEAN_SUMMARY"
```

## Step 6: Generate PR Description

Create comprehensive PR description using structured template.

### PR Description Template:
```markdown
## Summary

{Brief overview of changes - 2-3 sentences}

Jira Issue: [{issue_key}]({jira_url}/browse/{issue_key})

## Changes

### Features
- {Feature 1 description}
- {Feature 2 description}

### Bug Fixes
- {Bug fix 1 description}
- {Bug fix 2 description}

### Refactoring
- {Refactoring 1 description}
- {Refactoring 2 description}

### Documentation
- {Documentation change 1}
- {Documentation change 2}

## Acceptance Criteria

{Parse from Jira issue}

- [x] Criterion 1 from Jira
- [x] Criterion 2 from Jira
- [x] Criterion 3 from Jira

## Testing

### Test Coverage
- Unit tests: {coverage percentage}
- Integration tests: {pass/fail}
- E2E tests: {pass/fail}

### Manual Testing Instructions
1. {Step 1 to test the feature}
2. {Step 2 to test the feature}
3. {Step 3 to verify expected behavior}

### Test Results
```
{Paste test output summary}
```

## Screenshots

{Add screenshots if applicable - especially for UI changes}

**Before:**
<!-- Add screenshot -->

**After:**
<!-- Add screenshot -->

## Deployment Notes

### Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented below

{If breaking changes:}
- Change 1: Migration steps...
- Change 2: Configuration updates needed...

### Database Migrations
- [ ] No database migrations
- [ ] Database migrations included

{If migrations:}
Migration files:
- {migration file 1}
- {migration file 2}

### Environment Variables
- [ ] No new environment variables
- [ ] New environment variables required

{If new variables:}
```bash
NEW_VAR_NAME=value # Description
ANOTHER_VAR=value # Description
```

### Dependencies
- [ ] No new dependencies
- [ ] New dependencies added

{If new dependencies:}
- Package: version - Purpose
- Package: version - Purpose

## Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Accessibility standards met (for UI changes)
- [ ] Performance impact assessed
- [ ] Security implications reviewed

## Related Issues

- Jira: [{issue_key}]({jira_url}/browse/{issue_key})
{If parent issue:}
- Parent: [{parent_key}]({jira_url}/browse/{parent_key})
{If subtasks:}
- Subtask: [{subtask_key}]({jira_url}/browse/{subtask_key})
{If related issues:}
- Related: [{related_key}]({jira_url}/browse/{related_key})

## Additional Notes

{Any additional context, decisions, or considerations}

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### PR Description Generation Steps:
```
1. Extract summary from Jira description
2. Categorize changed files into sections
3. Parse acceptance criteria from Jira custom field or description
4. Generate test coverage report
5. Create manual testing steps based on acceptance criteria
6. Identify breaking changes from commit messages
7. Extract migration files from changes
8. Identify new environment variables from config changes
9. List new dependencies from package.json/requirements.txt/pom.xml changes
10. Build related issues section from Jira links
11. Combine all sections into final PR body
```

## Step 7: Push Changes to Remote

Ensure all commits are pushed to remote repository.

### Actions:
```
1. Verify current branch is correct feature branch
2. Push branch to remote with -u flag to set upstream tracking
3. If push fails due to remote changes:
   a. Fetch and rebase on remote branch
   b. Resolve any conflicts
   c. Re-run tests after rebase
   d. Push again
4. Capture remote branch URL for PR creation
```

### Push Commands:
```bash
# Get current branch
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)

# Push with upstream tracking
git push -u origin "$BRANCH_NAME"

# If push fails, try rebase
if [ $? -ne 0 ]; then
  git fetch origin "$BRANCH_NAME"
  git rebase origin/"$BRANCH_NAME"

  # Re-run tests after rebase
  npm test || pytest || mvn test || ./gradlew test

  # Force push if rebase was needed (use with caution)
  git push -u origin "$BRANCH_NAME" --force-with-lease
fi
```

## Step 8: Create Pull Request via GitHub CLI

Use gh CLI to create the pull request with all metadata.

### Actions:
```
1. Verify gh CLI is installed and authenticated
2. Build PR creation command with all parameters:
   - Title from Step 5
   - Body from Step 6
   - Base branch from argument (default: main)
   - Head branch (current feature branch)
   - Draft flag if specified
   - Reviewers if specified
   - Labels from Jira issue labels
   - Milestone from Jira fixVersion
   - Project if configured
3. Execute gh pr create command
4. Capture PR number and URL from output
5. If PR creation fails, provide detailed error and rollback instructions
```

### PR Creation Command:
```bash
# Verify gh CLI
gh --version

# Check authentication
gh auth status

# Build labels from Jira
LABELS=$(echo "${labels from Jira}" | tr ',' '\n' | sed 's/^/--label /' | tr '\n' ' ')

# Build reviewers
REVIEWERS=$(echo "${reviewers}" | tr ',' '\n' | sed 's/^/--reviewer /' | tr '\n' ' ')

# Create PR with heredoc for body
gh pr create \
  --title "$PR_TITLE" \
  --body "$(cat <<'EOF'
{PR_BODY from Step 6}
EOF
)" \
  --base "${base}" \
  --head "$BRANCH_NAME" \
  $(if [ "${draft}" = "true" ]; then echo "--draft"; fi) \
  $LABELS \
  $REVIEWERS \
  --web

# Capture PR URL
PR_URL=$(gh pr view --json url --jq .url)
PR_NUMBER=$(gh pr view --json number --jq .number)
```

### PR Metadata Configuration:
```
Title: From Step 5 (max 72 chars)
Body: From Step 6 (full markdown template)
Base: ${base} argument (default: main)
Head: Current feature branch
Draft: ${draft} argument (default: false)
Labels: Mapped from Jira labels + issue type
  - bug (if issuetype = Bug)
  - feature (if issuetype = Story)
  - task (if issuetype = Task)
  - {jira_label_1}
  - {jira_label_2}
Reviewers: ${reviewers} argument (comma-separated)
Assignees: Jira assignee (if mapping exists)
Milestone: Jira fixVersion (if exists)
Project: From repo configuration (if exists)
```

## Step 9: Update Jira Issue

Link the PR back to Jira and update issue status.

### Actions:
```
1. Add comment to Jira issue with PR details
2. Add PR URL to issue's development section (if supported)
3. Transition issue status based on PR state:
   - If draft PR: Keep in "In Progress"
   - If regular PR: Move to "In Review" or "Code Review"
4. Update issue with additional metadata:
   - Add label "has-pr"
   - Update custom field for PR URL if exists
5. If reviewers specified, mention them in Jira comment
```

### Jira Update Commands:
```
# Add comment with PR link
mcp__atlassian__jira_add_comment(
  issue_key="${issue_key}",
  comment="Pull request created: ${PR_URL}

## PR Summary
{Brief summary from PR description}

## Review Status
- State: $(if [ "${draft}" = "true" ]; then echo "Draft"; else echo "Ready for Review"; fi)
- Reviewers: ${reviewers}
- Base branch: ${base}
- Feature branch: ${BRANCH_NAME}

## Checklist
- [x] All tests passing
- [x] Code review checklist completed
- [x] Documentation updated
- [x] No breaking changes OR breaking changes documented

Ready for code review and testing."
)

# Transition issue status
mcp__atlassian__jira_transition_issue(
  issue_key="${issue_key}",
  status="In Review" # Or "Code Review" based on your workflow
)

# Add PR label
mcp__atlassian__jira_update_issue(
  issue_key="${issue_key}",
  labels=["existing labels", "has-pr"]
)
```

### Jira Comment Format:
```markdown
Pull request created: {PR_URL}

## PR Summary
{1-2 sentence summary}

## Review Status
- State: Ready for Review | Draft
- Reviewers: @reviewer1, @reviewer2
- Base branch: main
- Feature branch: feature/ABC-123-description

## Checklist
- [x] All tests passing
- [x] Code review checklist completed
- [x] Documentation updated
- [x] No breaking changes OR breaking changes documented

Ready for code review and testing.
```

## Step 10: Request Reviews

If reviewers were specified, send review requests via GitHub.

### Actions:
```
1. Parse reviewers from argument (comma-separated)
2. For each reviewer:
   a. Validate reviewer has access to repository
   b. Request review via gh CLI
   c. Handle errors if reviewer not found
3. If team reviewers specified (team:team-name):
   a. Request team review
4. Optionally notify reviewers via Slack/Teams integration
5. Log all review requests
```

### Review Request Commands:
```bash
# Split reviewers by comma
IFS=',' read -ra REVIEWER_ARRAY <<< "${reviewers}"

# Request reviews
for reviewer in "${REVIEWER_ARRAY[@]}"; do
  # Trim whitespace
  reviewer=$(echo "$reviewer" | xargs)

  # Check if team review
  if [[ $reviewer == team:* ]]; then
    TEAM_NAME=${reviewer#team:}
    gh pr edit "$PR_NUMBER" --add-reviewer "$TEAM_NAME"
  else
    # Individual reviewer
    gh pr edit "$PR_NUMBER" --add-reviewer "$reviewer"
  fi
done

# Add comment mentioning reviewers
gh pr comment "$PR_NUMBER" --body "Review requested from: ${reviewers/,/, }"
```

## Error Handling

Comprehensive error handling for all failure scenarios.

### Error Scenarios:

#### 1. Invalid Issue Key
```
If issue_key does not match [A-Z]+-[0-9]+ pattern:
  Message: "Invalid issue key format. Expected: PROJECT-123"
  Exit code: 1
  No API calls made
```

#### 2. Issue Not Found
```
If Jira API returns 404:
  Message: "Issue ${issue_key} not found. Verify issue exists and you have access."
  Exit code: 1
  Suggest: Check issue key spelling, verify Jira permissions
```

#### 3. Uncommitted Changes
```
If git status --porcelain shows changes:
  Message: "Uncommitted changes detected. Commit or stash changes before creating PR."
  Show: List of uncommitted files
  Exit code: 1
  Suggest: git add . && git commit -m "..." or git stash
```

#### 4. Tests Failing
```
If test command exits with non-zero:
  Message: "Tests are failing. Fix tests before creating PR."
  Show: Test failure output
  Exit code: 1
  Suggest: Review test failures, fix issues, re-run tests
```

#### 5. Merge Conflicts with Base
```
If merge-tree shows conflicts:
  Message: "Merge conflicts detected with ${base} branch."
  Show: Conflicting files
  Exit code: 1
  Suggest: git fetch origin ${base} && git rebase origin/${base}
```

#### 6. Push Failed
```
If git push fails:
  Message: "Failed to push to remote."
  Show: Git error output
  Exit code: 1
  Suggest: Check network, verify write permissions, check branch protection
```

#### 7. GitHub CLI Not Installed
```
If gh command not found:
  Message: "GitHub CLI (gh) not installed."
  Exit code: 1
  Suggest: Install from https://cli.github.com/
```

#### 8. GitHub CLI Not Authenticated
```
If gh auth status fails:
  Message: "GitHub CLI not authenticated."
  Exit code: 1
  Suggest: Run 'gh auth login'
```

#### 9. PR Creation Failed
```
If gh pr create fails:
  Message: "Failed to create pull request."
  Show: GitHub CLI error
  Exit code: 1
  Fallback: Provide manual PR creation instructions with pre-filled title and body
```

#### 10. Jira Update Failed
```
If Jira API calls fail:
  Message: "Warning: PR created but Jira update failed."
  Show: Jira API error
  Exit code: 0 (warning only)
  Suggest: Manually update Jira with PR link: ${PR_URL}
```

#### 11. Reviewer Not Found
```
If gh pr edit --add-reviewer fails:
  Message: "Warning: Reviewer '${reviewer}' not found or lacks access."
  Exit code: 0 (warning only)
  Continue: Process remaining reviewers
  Suggest: Verify GitHub username, check repository access
```

## Success Output

After successful PR creation, display comprehensive summary.

### Success Message Format:
```
✅ Pull Request Created Successfully!

Issue: ${issue_key}
Title: ${PR_TITLE}
URL: ${PR_URL}
Number: #${PR_NUMBER}

Status: $(if [ "${draft}" = "true" ]; then echo "Draft"; else echo "Ready for Review"; fi)
Base: ${base}
Branch: ${BRANCH_NAME}

Changes:
  Files changed: ${FILES_CHANGED}
  Insertions: +${INSERTIONS}
  Deletions: -${DELETIONS}

Tests: ✅ Passing
Coverage: ${COVERAGE}%

Reviewers: ${reviewers}

Jira: Updated with PR link
Status: Transitioned to "In Review"

Next Steps:
  1. Address reviewer feedback
  2. Monitor CI/CD pipeline
  3. Merge when approved
  4. Close Jira issue after merge

View PR: ${PR_URL}
```

## Example Usage

```bash
# Basic PR creation
/jira:pr ABC-123

# PR with specific base branch
/jira:pr ABC-123 develop

# Draft PR
/jira:pr ABC-123 main true

# PR with reviewers
/jira:pr ABC-123 main false user1,user2,team:backend-team

# All options
/jira:pr PROJ-456 develop true senior-dev1,senior-dev2
```

## Integration with Workflow

This command integrates with the complete development workflow:

```
/jira:work ABC-123          # Start work on issue
  ↓
  (Development happens)
  ↓
/jira:status ABC-123        # Check progress
  ↓
  (All phases complete)
  ↓
/jira:pr ABC-123            # Create PR (THIS COMMAND)
  ↓
  (Code review happens)
  ↓
  (PR merged)
  ↓
/jira:sync                  # Sync Jira status
```

## Advanced Features

### Automatic Screenshot Detection

If UI changes detected, prompt for screenshots:
```
1. Analyze changed files for UI components (.tsx, .vue, .jsx, .html, .css)
2. If UI changes found:
   - Remind to add screenshots to PR description
   - Provide placeholder sections in PR body
   - Suggest using playwright for automated screenshots
```

### Automatic Changelog Generation

Generate changelog entry from commits:
```
1. Parse commit messages since base branch
2. Categorize by conventional commit type:
   - feat: Features
   - fix: Bug fixes
   - docs: Documentation
   - refactor: Refactoring
   - test: Tests
   - chore: Maintenance
3. Format as changelog entry
4. Add to PR body
```

### Breaking Change Detection

Automatically detect breaking changes:
```
1. Scan commit messages for "BREAKING CHANGE:"
2. Check for major version bumps in package.json
3. Detect API signature changes
4. Warn if breaking changes not documented
5. Add breaking change section to PR body
```

## Configuration

Environment variables and defaults:

```bash
# Jira Configuration
JIRA_URL=https://your-instance.atlassian.net
JIRA_API_TOKEN=<from-environment>
JIRA_CUSTOM_FIELD_STORY_POINTS=customfield_10016
JIRA_CUSTOM_FIELD_ACCEPTANCE_CRITERIA=customfield_10037

# GitHub Configuration
GITHUB_TOKEN=<from-environment>
GITHUB_REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)

# Default Values
DEFAULT_BASE_BRANCH=main
DEFAULT_DRAFT=false
PR_TEMPLATE_PATH=.github/PULL_REQUEST_TEMPLATE.md

# Test Commands (project-specific)
TEST_COMMAND="npm test"  # or pytest, mvn test, etc.
COVERAGE_COMMAND="npm run coverage"
```

## Notes

- Always validate work is complete before creating PR
- Use Context7 MCP for library documentation if needed
- PR description should be comprehensive enough for reviewers to understand changes without reading all code
- Screenshots are critical for UI changes
- Breaking changes must be clearly documented
- Keep PR focused on single issue (avoid scope creep)
- Link all related Jira issues
- Update PR description if scope changes during review
