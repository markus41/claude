---
name: harness-mcp
description: Harness MCP (Model Context Protocol) server integration for AI-powered CD operations, pipeline management, Git repositories, pull requests, code review comments, and bidirectional Jira synchronization
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - WebFetch
  - WebSearch
dependencies:
  - harness-cd
  - jira-orchestration
triggers:
  - harness mcp
  - harness ai
  - harness connector
  - harness pipeline
  - harness jira
  - harness git
  - harness pr
  - harness pull request
  - harness repository
  - harness comment
  - mcp server
  - cd automation
---

# Harness MCP Skill

Comprehensive Harness MCP (Model Context Protocol) server integration for AI-powered CD operations, Git repository management, and pull request workflows with the Jira Orchestrator.

## Overview

The Harness MCP Server enables AI agents to interact with Harness tools using a unified protocol, providing endpoints for:
- **Connectors**: Get details, list catalogue, list with filtering
- **Pipelines**: List, get details, trigger executions
- **Executions**: Get details, list, fetch URLs
- **Dashboards**: List all, retrieve specific data
- **Repositories**: List, get details, track changes
- **Pull Requests**: Create, list, get details, track status checks
- **PR Activities**: Get comments, reviews, and activities

## Prerequisites

### Environment Variables

```bash
# Required Harness Configuration
export HARNESS_API_KEY="your-harness-api-key"
export HARNESS_DEFAULT_ORG_ID="your-org-id"
export HARNESS_DEFAULT_PROJECT_ID="your-project-id"
export HARNESS_BASE_URL="https://app.harness.io"  # Optional, defaults to this
export HARNESS_ACCOUNT_ID="your-account-id"
```

### Harness API Token Generation

1. Navigate to **Account Settings > API Keys** in Harness UI
2. Click **+ API Key** to create a new token
3. Set appropriate permissions (minimum: pipeline execution, connector management)
4. Copy the token and store securely

## MCP Server Configuration

### Claude Code Configuration

Add Harness MCP to your Claude Code configuration:

```json
{
  "mcpServers": {
    "harness": {
      "command": "npx",
      "args": [
        "-y",
        "@anthropic-ai/mcp-harness"
      ],
      "env": {
        "HARNESS_API_KEY": "${HARNESS_API_KEY}",
        "HARNESS_DEFAULT_ORG_ID": "${HARNESS_DEFAULT_ORG_ID}",
        "HARNESS_DEFAULT_PROJECT_ID": "${HARNESS_DEFAULT_PROJECT_ID}",
        "HARNESS_BASE_URL": "${HARNESS_BASE_URL}"
      }
    }
  }
}
```

### Docker Configuration

```bash
docker run -e HARNESS_API_KEY=$HARNESS_API_KEY \
           -e HARNESS_DEFAULT_ORG_ID=$HARNESS_DEFAULT_ORG_ID \
           -e HARNESS_DEFAULT_PROJECT_ID=$HARNESS_DEFAULT_PROJECT_ID \
           harness/mcp-server:latest
```

### VS Code / Cursor Configuration

```json
{
  "mcp.servers": {
    "harness": {
      "command": "npx",
      "args": ["-y", "@harness/mcp-server"],
      "env": {
        "HARNESS_API_KEY": "${env:HARNESS_API_KEY}",
        "HARNESS_DEFAULT_ORG_ID": "${env:HARNESS_DEFAULT_ORG_ID}",
        "HARNESS_DEFAULT_PROJECT_ID": "${env:HARNESS_DEFAULT_PROJECT_ID}"
      }
    }
  }
}
```

## Available MCP Tools

### Connector Management

| Tool | Description |
|------|-------------|
| `harness_get_connector` | Get details of a specific connector |
| `harness_list_connectors` | List all connectors with filtering |
| `harness_get_connector_catalogue` | Get available connector types |

### Pipeline Operations

| Tool | Description |
|------|-------------|
| `harness_list_pipelines` | List pipelines in project |
| `harness_get_pipeline` | Get pipeline details and YAML |
| `harness_trigger_pipeline` | Trigger pipeline execution |

### Execution Tracking

| Tool | Description |
|------|-------------|
| `harness_get_execution` | Get execution details |
| `harness_list_executions` | List recent executions |
| `harness_get_execution_url` | Get execution dashboard URL |

### Dashboard Functions

| Tool | Description |
|------|-------------|
| `harness_list_dashboards` | List all dashboards |
| `harness_get_dashboard` | Get specific dashboard data |

### Repository Operations

| Tool | Description |
|------|-------------|
| `harness_get_repository` | Get details of a specific repository |
| `harness_list_repositories` | List all repositories in project |

### Pull Request Operations

| Tool | Description |
|------|-------------|
| `harness_get_pull_request` | Get details of a specific pull request |
| `harness_list_pull_requests` | List pull requests in a repository |
| `harness_create_pull_request` | Create a new pull request |
| `harness_get_pull_request_checks` | Get status checks for a PR |
| `harness_get_pull_request_activities` | Get comments and activities for a PR |

## Git & Pull Request Workflows

### Repository Management

```python
# List all repositories
repos = harness_list_repositories(
    org_id="${HARNESS_ORG_ID}",
    project_id="${HARNESS_PROJECT_ID}"
)

# Get specific repository details
repo = harness_get_repository(
    repo_id="my-application",
    org_id="${HARNESS_ORG_ID}",
    project_id="${HARNESS_PROJECT_ID}"
)
```

### Creating Pull Requests

```python
# Create a PR linked to a Jira issue
pr = harness_create_pull_request(
    repo_id="my-application",
    title="PROJ-123: Implement user authentication",
    source_branch="feature/PROJ-123-user-auth",
    target_branch="main",
    description="""
    ## Summary
    Implements user authentication feature.

    ## Jira Issue
    [PROJ-123](https://company.atlassian.net/browse/PROJ-123)

    ## Changes
    - Added login/logout endpoints
    - Implemented JWT token handling
    - Added authentication middleware
    - Unit tests included

    ## Testing
    - [x] Unit tests passing
    - [x] Integration tests passing
    - [ ] Manual testing required
    """
)

print(f"PR created: {pr.url}")
```

### Monitoring PR Status

```python
# Get PR details
pr = harness_get_pull_request(
    repo_id="my-application",
    pr_number=42
)

print(f"PR Status: {pr.state}")
print(f"Mergeable: {pr.mergeable}")
print(f"Conflicts: {pr.has_conflicts}")

# Get status checks (pipeline results)
checks = harness_get_pull_request_checks(
    repo_id="my-application",
    pr_number=42
)

for check in checks:
    print(f"  {check.name}: {check.status}")
```

### Retrieving PR Comments & Activities

```python
# Get all activities (comments, reviews, status changes)
activities = harness_get_pull_request_activities(
    repo_id="my-application",
    pr_number=42
)

for activity in activities:
    if activity.type == "comment":
        print(f"Comment by {activity.author}:")
        print(f"  File: {activity.file_path}:{activity.line_number}")
        print(f"  Body: {activity.body}")

    elif activity.type == "review":
        print(f"Review by {activity.author}: {activity.state}")
        # States: APPROVED, CHANGES_REQUESTED, COMMENTED

    elif activity.type == "status_change":
        print(f"Status changed to: {activity.new_status}")
```

### Syncing PR Activities to Jira

```python
# Sync PR comments to Jira
activities = harness_get_pull_request_activities(
    repo_id="my-application",
    pr_number=42
)

# Build summary for Jira comment
review_summary = []
for activity in activities:
    if activity.type == "review":
        review_summary.append(
            f"- **{activity.author}**: {activity.state}"
        )
    elif activity.type == "comment":
        review_summary.append(
            f"- Comment on `{activity.file_path}`: {activity.body[:100]}..."
        )

# Add summary to Jira
jira_add_comment(
    issue_key="PROJ-123",
    body=f"""
    ## PR Review Update

    **PR:** [#42 - Implement user auth]({pr.url})
    **Status:** {pr.state}

    ### Reviews & Comments
    {chr(10).join(review_summary)}
    """
)
```

### PR-to-Jira Status Mapping

Configure automatic status transitions based on PR events:

```yaml
# .jira/pr-sync.yml
pr_sync:
  enabled: true

  # Extract Jira keys from PR metadata
  jira_key_patterns:
    - title: "^([A-Z]+-\\d+)"          # PROJ-123: Title
    - branch: "feature/([A-Z]+-\\d+)"   # feature/PROJ-123
    - branch: "bugfix/([A-Z]+-\\d+)"    # bugfix/PROJ-456

  # Map PR events to Jira transitions
  transitions:
    pr_created:
      transition: "In Review"
      comment: "Pull request created: {pr_url}"

    pr_approved:
      transition: "Approved"
      comment: "PR approved by {approver}"

    pr_changes_requested:
      transition: "In Progress"
      comment: "Changes requested by {reviewer}"

    pr_merged:
      transition: "Done"
      comment: "PR merged to {target_branch}"

    pr_closed:
      transition: "Cancelled"
      comment: "PR closed without merging"

  # Fields to update
  fields:
    pr_url: "customfield_10200"
    pr_status: "customfield_10201"
    reviewers: "customfield_10202"
```

### Code Review Commenting Patterns

```python
# When a reviewer adds comments, sync to Jira
def sync_review_comments_to_jira(repo_id, pr_number, jira_key):
    activities = harness_get_pull_request_activities(
        repo_id=repo_id,
        pr_number=pr_number
    )

    # Group comments by file
    comments_by_file = {}
    for activity in activities:
        if activity.type == "comment":
            file = activity.file_path
            if file not in comments_by_file:
                comments_by_file[file] = []
            comments_by_file[file].append({
                "line": activity.line_number,
                "author": activity.author,
                "body": activity.body,
                "resolved": activity.resolved
            })

    # Format for Jira
    jira_body = "## Code Review Comments\n\n"
    for file, comments in comments_by_file.items():
        jira_body += f"### `{file}`\n"
        for c in comments:
            status = "✅" if c["resolved"] else "💬"
            jira_body += f"- {status} Line {c['line']} ({c['author']}): {c['body']}\n"

    jira_add_comment(issue_key=jira_key, body=jira_body)
```

## Jira Connector Setup in Harness

### Step 1: Navigate to Connectors

1. Go to **Project Setup** > **Connectors**
2. Click **+ New Connector**
3. Select **Jira** under Ticketing Systems

### Step 2: Configure Basic Settings

```yaml
connector:
  name: jira-connector
  identifier: jira_connector
  orgIdentifier: default
  projectIdentifier: your_project
  type: Jira
  spec:
    jiraUrl: https://your-company.atlassian.net
```

### Step 3: Authentication Options

#### Option A: Username + API Key (Recommended for Cloud)

```yaml
spec:
  jiraUrl: https://your-company.atlassian.net
  auth:
    type: UsernamePassword
    spec:
      username: your.email@company.com
      passwordRef: jira_api_token  # Harness secret reference
```

**Required Scopes:**
- `read:jira-user`
- `read:jira-work`
- `write:jira-work`

#### Option B: Personal Access Token (Jira Server/Data Center)

```yaml
spec:
  jiraUrl: https://jira.internal.company.com
  delegateSelectors:
    - delegate-name
  auth:
    type: PersonalAccessToken
    spec:
      patRef: jira_pat_secret  # Harness secret reference
```

**Note:** Requires Harness Delegate version 78707+

#### Option C: OAuth (Advanced)

```yaml
spec:
  jiraUrl: https://api.atlassian.com/ex/jira/{cloud_id}
  auth:
    type: OAuth
    spec:
      clientId: your_oauth_client_id
      clientSecretRef: oauth_secret
      tokenEndpoint: https://auth.atlassian.com/oauth/token
```

### Step 4: Configure Delegate

Select Harness Delegates that have network access to your Jira instance:

```yaml
spec:
  delegateSelectors:
    - primary-delegate
    - backup-delegate
```

### Step 5: Test Connection

Click **Save and Continue** - Harness automatically tests the connection.

## Using Jira Steps in Pipelines

### Jira Create Step

```yaml
- step:
    name: Create Jira Issue
    identifier: createJiraIssue
    type: JiraCreate
    timeout: 5m
    spec:
      connectorRef: jira_connector
      projectKey: PROJ
      issueType: Task
      fields:
        - name: Summary
          value: "Deployment: <+pipeline.name> - <+pipeline.sequenceId>"
        - name: Description
          value: |
            Deployment triggered by: <+pipeline.triggeredBy.name>
            Environment: <+env.name>
            Service: <+service.name>
            Artifact: <+artifact.image>
        - name: Priority
          value: Medium
        - name: Labels
          value: ["deployment", "automation", "<+env.name>"]
```

### Jira Update Step

```yaml
- step:
    name: Update Jira Issue
    identifier: updateJiraIssue
    type: JiraUpdate
    timeout: 5m
    spec:
      connectorRef: jira_connector
      issueKey: <+pipeline.variables.jiraIssueKey>
      fields:
        - name: Status
          value: Done
        - name: customfield_10100
          value: <+artifact.tag>
      transitionTo:
        transitionName: Done
        status: Done
```

### Jira Approval Step

```yaml
- step:
    name: Jira Approval
    identifier: jiraApproval
    type: JiraApproval
    timeout: 1d
    spec:
      connectorRef: jira_connector
      projectKey: PROJ
      issueKey: <+pipeline.variables.jiraIssueKey>
      approvalCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: true
          conditions:
            - key: Status
              operator: equals
              value: Approved
      rejectionCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: true
          conditions:
            - key: Status
              operator: equals
              value: Rejected
```

## Integration with Jira Orchestrator

### Automatic Deployment Tracking

The `harness-jira-sync` agent automatically:
1. Extracts Jira issue keys from pipeline tags
2. Updates Jira with deployment status
3. Transitions issues based on deployment events
4. Records artifact versions and environment info

### Configuration

Add to `.jira/config.yml`:

```yaml
harness:
  account:
    account_id: "${HARNESS_ACCOUNT_ID}"
    org_id: "${HARNESS_ORG_ID}"
    project_id: "${HARNESS_PROJECT_ID}"
  api:
    base_url: "https://app.harness.io"
    api_key: "${HARNESS_API_KEY}"

  # MCP Integration
  mcp:
    enabled: true
    tools:
      - harness_get_connector
      - harness_list_pipelines
      - harness_get_execution
      - harness_list_executions

  # Jira Connector Reference
  jira_connector_ref: "jira_connector"

  # Sync Configuration
  sync:
    auto_create_issues: true
    auto_transition: true
    environments:
      dev: "In Development"
      staging: "In QA"
      prod: "Released"
```

### MCP Tool Usage Examples

```python
# Get Jira connector details
connector = harness_get_connector(
    connector_id="jira_connector",
    org_id="default",
    project_id="my_project"
)

# List recent pipeline executions
executions = harness_list_executions(
    pipeline_id="deploy_pipeline",
    limit=10
)

# Get specific execution details
execution = harness_get_execution(
    execution_id="abc123",
    org_id="default",
    project_id="my_project"
)
```

## Troubleshooting

### Connection Issues

| Issue | Solution |
|-------|----------|
| API Key invalid | Regenerate token in Harness UI |
| Network timeout | Check delegate connectivity |
| Permission denied | Verify API key permissions |
| Jira unreachable | Check firewall/proxy settings |

### Common Errors

```
Error: INVALID_CREDENTIAL
Solution: Verify HARNESS_API_KEY is correct and not expired

Error: DELEGATE_NOT_AVAILABLE
Solution: Ensure delegate is running and selected in connector

Error: JIRA_AUTHENTICATION_FAILED
Solution: Verify Jira credentials (email + API token or PAT)
```

### Debug Logging

Enable verbose logging:

```bash
export HARNESS_LOG_LEVEL=debug
export MCP_DEBUG=true
```

## Best Practices

1. **Use Secrets Management**: Store all credentials in Harness Secrets
2. **Delegate Selection**: Use delegates with direct network access to Jira
3. **Error Handling**: Configure retry strategies for transient failures
4. **Audit Trail**: Enable logging for all Jira operations
5. **Least Privilege**: Scope API tokens to minimum required permissions

## Related Documentation

- [Harness MCP Server](https://developer.harness.io/docs/platform/harness-aida/harness-mcp-server/)
- [Connect to Jira](https://developer.harness.io/docs/platform/connectors/ticketing-systems/connect-to-jira/)
- [Jira Connector Settings Reference](https://developer.harness.io/docs/platform/approvals/w_approval-ref/jira-connector-settings-reference/)
- [Create Jira Issues in CD Stages](https://developer.harness.io/docs/continuous-delivery/x-platform-cd-features/cd-steps/ticketing-systems/create-jira-issues-in-cd-stages/)
