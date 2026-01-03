---
name: pr-fix
description: Fix issues from PR review comments, update PR, then run 20-agent council review
usage: /pr-fix <pr-url-or-number> [--jira <issue-key>]
---

# PR Fix Command

Comprehensive PR issue fixing workflow with multi-agent council review.

## Usage

```bash
/pr-fix <pr-url-or-number> [--jira <issue-key>]
```

## Workflow

### Phase 1: Issue Collection

1. **Fetch PR Details**
   - Get PR from Harness Code or GitHub
   - Extract all review comments
   - Identify actionable issues (not just praise)

2. **Categorize Issues**
   ```yaml
   categories:
     critical: # Must fix before merge
       - Security vulnerabilities
       - Breaking changes
       - Missing tests for core logic

     high: # Should fix
       - Code quality issues
       - Performance concerns
       - Missing documentation

     medium: # Nice to fix
       - Style inconsistencies
       - Minor refactoring suggestions

     low: # Optional
       - Nitpicks
       - Alternative approaches
   ```

3. **Validate Jira Issue (if provided)**
   - Use `issue-validator` agent
   - Confirm correct issue before linking

### Phase 2: Issue Resolution

1. **Create Fix Plan**
   - Analyze each issue
   - Determine files affected
   - Plan changes in dependency order

2. **Execute Fixes**
   - For each critical/high issue:
     - Read affected files
     - Apply fix
     - Run relevant tests
     - Verify fix resolves issue

3. **Commit Changes**
   - Group related fixes
   - Use smart commit messages linking to Jira
   - Follow conventional commit format

### Phase 3: PR Update

1. **Push Changes**
   - Push fix commits to PR branch
   - Update PR description with fixes summary

2. **Reply to Comments**
   - Reply to each addressed comment
   - Mark as resolved where appropriate

3. **Update Jira (if linked)**
   - Add comment with fix summary
   - Update status if configured

### Phase 4: 20-Agent Council Review

Launch comprehensive multi-agent review:

```yaml
council_agents:
  # Code Quality (5 agents)
  - code-quality-enforcer
  - pattern-analyzer
  - code-reviewer
  - policy-enforcer
  - test-strategist

  # Architecture (4 agents)
  - requirements-analyzer
  - dependency-mapper
  - infrastructure-orchestrator
  - epic-decomposer

  # Documentation (3 agents)
  - documentation-writer
  - confluence-documentation-creator
  - documentation-sync-agent

  # Quality Assurance (4 agents)
  - qa-ticket-reviewer
  - smart-commit-validator
  - compliance-reporter
  - governance-auditor

  # Performance & Security (4 agents)
  - performance-tracker
  - sla-monitor
  - intelligence-analyzer
  - quality-intelligence
```

### Phase 5: Council Summary

1. **Aggregate Reviews**
   - Collect all agent findings
   - Deduplicate issues
   - Prioritize by severity

2. **Generate Report**
   ```markdown
   ## PR Council Review Summary

   ### Critical Issues
   - [List any blocking issues]

   ### Recommendations
   - [Prioritized list of improvements]

   ### Approval Status
   - Agents Approved: X/20
   - Agents Requested Changes: Y/20
   - Overall: APPROVED/NEEDS_WORK
   ```

3. **Post Results**
   - Add council review as PR comment
   - Update Jira with review status

## Example

```bash
# Fix PR from URL
/pr-fix https://app.harness.io/code/org/proj/repo/pulls/42 --jira PROJ-163

# Fix PR by number (uses current repo)
/pr-fix 42 --jira PROJ-163
```

## Output

```
============================================================
PR FIX WORKFLOW - PR #42
============================================================

PHASE 1: COLLECTING ISSUES
- Found 8 review comments
- Critical: 1, High: 3, Medium: 4, Low: 0

PHASE 2: RESOLVING ISSUES
[1/4] Fixing: Add input validation (critical)
      File: src/api/handlers.ts
      Status: FIXED

[2/4] Fixing: Add error handling (high)
      File: src/services/auth.ts
      Status: FIXED

[3/4] Fixing: Add unit tests (high)
      File: tests/api/handlers.test.ts
      Status: FIXED

[4/4] Fixing: Improve error messages (high)
      File: src/utils/errors.ts
      Status: FIXED

PHASE 3: UPDATING PR
- Pushed 4 commits to branch feature/PROJ-163
- Replied to 8 review comments
- Updated Jira PROJ-163 with fix summary

PHASE 4: COUNCIL REVIEW (20 agents)
[====================================] 20/20 Complete

PHASE 5: COUNCIL SUMMARY
============================================================
COUNCIL REVIEW RESULT: APPROVED

Agents Approved: 18/20
Agents Requested Minor Changes: 2/20

Minor Recommendations:
1. Consider adding integration tests
2. Update API documentation

No blocking issues found.
============================================================

PR is ready for final review and merge.
```

## Safety Features

1. **Issue Validation**
   - Always validates Jira issue before linking
   - Prevents off-by-one errors

2. **Non-Destructive**
   - Creates new commits, never force pushes
   - Preserves review history

3. **Rollback Support**
   - All changes are in separate commits
   - Easy to revert individual fixes

4. **Audit Trail**
   - All actions logged
   - Jira comments track full history
