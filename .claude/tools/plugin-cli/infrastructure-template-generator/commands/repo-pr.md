---
description: Create pull request with auto-generated description and Jira linking
aliases: [itg:pr, itg:pull-request]
---

# ITG Repository Pull Request

Create a pull request with automatically generated descriptions from commit history and optional Jira ticket linking for infrastructure repositories.

**Best for:** Infrastructure engineers finalizing feature branches and needing standardized PR descriptions with full change context.

## Usage

```bash
/itg:repo:pr <branch> [--target main] [--jira-ticket IE-1234] [--reviewers user1,user2] [--draft] [--auto-merge] [--labels label1,label2]
```

## Arguments

- `branch` (required) - Source branch name to create PR from

## Flags

- `--target <string>` - Target branch for PR (default: main)
- `--jira-ticket <string>` - Jira ticket to link (e.g., IE-1234, INFRA-567)
- `--reviewers <string>` - Comma-separated list of reviewer usernames
- `--draft` - Create PR as draft
- `--auto-merge` - Enable auto-merge when checks pass
- `--labels <string>` - Comma-separated list of labels to add

## Examples

### Basic PR to main
```bash
/itg:repo:pr feature/terraform-modules
```

### PR with Jira linking and reviewers
```bash
/itg:repo:pr feature/harness-pipeline --jira-ticket IE-1234 --reviewers alice,bob
```

### Draft PR with labels
```bash
/itg:repo:pr feature/k8s-manifests --draft --labels infrastructure,needs-review
```

### PR to staging with auto-merge
```bash
/itg:repo:pr hotfix/config-update --target staging --auto-merge --labels hotfix
```

### Full example with all options
```bash
/itg:repo:pr feature/complete-deployment \
  --target main \
  --jira-ticket INFRA-789 \
  --reviewers devops-team,security-team \
  --labels infrastructure,terraform,harness \
  --auto-merge
```

## Workflow

The command executes the following steps:

1. **Branch Validation**
   - Verify source branch exists locally and remotely
   - Confirm target branch exists
   - Check for uncommitted changes

2. **Change Analysis**
   - Parse commit history since branch diverged from target
   - Identify modified infrastructure files (Terraform, Harness YAML, K8s manifests)
   - Extract change patterns and impact areas

3. **Description Generation**
   - Create structured PR description with:
     - Summary of changes by type (Terraform, Harness, K8s, etc.)
     - List of modified resources with impact assessment
     - Testing checklist based on infrastructure type
     - Deployment considerations

4. **Jira Integration** (if --jira-ticket provided)
   - Validate ticket exists and is accessible
   - Link PR to Jira ticket
   - Add PR link to Jira ticket comments
   - Update ticket with PR status

5. **PR Creation**
   - Push branch if not already remote
   - Create GitHub PR with generated description
   - Add requested reviewers
   - Apply labels
   - Set draft status if requested
   - Enable auto-merge if requested

6. **Output**
   - Display PR URL
   - Show linked Jira ticket (if applicable)
   - List assigned reviewers
   - Provide quick commands for PR management

## Generated PR Description Structure

```markdown
## Summary
[Auto-generated summary of infrastructure changes]

## Changes by Type

### Terraform
- Modified: [list of .tf files with resource counts]
- Impact: [infrastructure components affected]

### Harness Pipelines
- Modified: [list of pipeline YAML files]
- Changes: [pipeline modifications summary]

### Kubernetes Manifests
- Modified: [list of K8s YAML files]
- Resources: [deployment, service, configmap changes]

### Configuration
- Modified: [config files, secrets, variables]

## Testing Checklist

- [ ] `terraform plan` executed successfully
- [ ] No unexpected resource changes
- [ ] Harness pipeline validation passed
- [ ] K8s manifests validated with kubeval
- [ ] Secrets/sensitive data not committed
- [ ] Documentation updated

## Deployment Considerations

[Auto-generated deployment notes based on change analysis]

## Jira Ticket

[Link to Jira ticket if provided]
```

## Agent Assignment

This command activates the **itg-pr-generator** agent for execution.

## Prerequisites

- Git repository with remote configured
- GitHub CLI (`gh`) authenticated
- Branch pushed to remote (or will be pushed automatically)
- Jira credentials configured (if using --jira-ticket)

## Related Commands

- `/itg:validate` - Validate infrastructure templates before PR
- `/itg:harness:publish` - Publish templates directly to Harness
- `/jira-pr` - Standard Jira PR workflow

## Error Handling

The command handles common scenarios:

- **Branch not found**: Suggests creating branch or checking name
- **Uncommitted changes**: Prompts to commit or stash changes
- **Jira ticket not found**: Creates PR without Jira link and warns user
- **GitHub API errors**: Provides fallback manual PR creation instructions
- **Reviewer not found**: Creates PR without invalid reviewers and lists valid ones

## Configuration

Command behavior can be customized in `.itg/config.json`:

```json
{
  "pr": {
    "defaultTarget": "main",
    "defaultReviewers": ["devops-team"],
    "defaultLabels": ["infrastructure"],
    "autoAnalyzeImpact": true,
    "includeTestingChecklist": true,
    "jiraAutoLink": true
  }
}
```

## Best Practices

1. **Always validate before PR**: Run `/itg:validate` on your branch first
2. **Link Jira tickets**: Use `--jira-ticket` for full traceability
3. **Request appropriate reviewers**: Infrastructure changes need DevOps review
4. **Use draft PRs**: For work-in-progress or discussion-needed changes
5. **Apply descriptive labels**: Help with PR filtering and automation triggers

## Security Considerations

- Command checks for secrets/credentials in changed files
- Warns if sensitive patterns detected in diffs
- Does NOT commit or push if security issues found
- Recommends using secret management tools

## Output Format

```
✓ Branch validated: feature/terraform-modules
✓ Analyzing 12 commits since main
✓ Detected changes:
  - Terraform: 5 files, 23 resources
  - Harness: 2 pipelines
  - K8s: 3 manifests

✓ Generated PR description (1,234 characters)
✓ Linked to Jira ticket: IE-1234
✓ Created PR: https://github.com/org/repo/pull/567
✓ Added reviewers: alice, bob
✓ Applied labels: infrastructure, terraform

Next steps:
  View PR:    gh pr view 567
  Edit PR:    gh pr edit 567
  Merge PR:   gh pr merge 567
```
