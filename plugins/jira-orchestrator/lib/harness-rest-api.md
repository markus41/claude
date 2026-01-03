# Harness REST API Integration

## Overview

This plugin uses **Harness REST API with PAT** (Personal Access Token) for CI/CD operations.
**NOT MCP** - Harness operations are limited scope and use direct REST API calls.

## Scope Limitations

Harness API access is strictly limited to:
- **Development** - Code repository operations
- **CI/CD** - Pipeline execution and monitoring
- **Repository** - Branch, commit, PR operations via Harness Code
- **Pipeline** - Trigger, monitor, and manage pipelines

**NOT IN SCOPE**: User management, billing, organization settings, secrets management

## Authentication

```bash
# Environment variables required
HARNESS_ACCOUNT_ID=your-account-id
HARNESS_API_KEY=pat.your-pat-token
HARNESS_ORG_ID=default
HARNESS_PROJECT_ID=your-project-id
HARNESS_API_URL=https://app.harness.io
```

## API Endpoints

### Pipeline Operations

#### List Pipelines
```bash
curl -X GET "${HARNESS_API_URL}/pipeline/api/pipelines/list" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "orgIdentifier": "'${HARNESS_ORG_ID}'",
    "projectIdentifier": "'${HARNESS_PROJECT_ID}'"
  }'
```

#### Get Pipeline Details
```bash
curl -X GET "${HARNESS_API_URL}/pipeline/api/pipelines/${PIPELINE_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### Execute Pipeline
```bash
curl -X POST "${HARNESS_API_URL}/pipeline/api/pipeline/execute/${PIPELINE_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}" \
  -d '{
    "inputSet": {
      "branch": "main"
    }
  }'
```

#### Get Execution Status
```bash
curl -X GET "${HARNESS_API_URL}/pipeline/api/pipelines/execution/v2/${EXECUTION_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

### Repository Operations (Harness Code)

#### List Repositories
```bash
curl -X GET "${HARNESS_API_URL}/code/api/v1/repos" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### Get Repository
```bash
curl -X GET "${HARNESS_API_URL}/code/api/v1/repos/${REPO_IDENTIFIER}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### List Branches
```bash
curl -X GET "${HARNESS_API_URL}/code/api/v1/repos/${REPO_IDENTIFIER}/branches" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### Create Pull Request
```bash
curl -X POST "${HARNESS_API_URL}/code/api/v1/repos/${REPO_IDENTIFIER}/pullreq" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}" \
  -d '{
    "title": "PR Title",
    "description": "PR Description",
    "source_branch": "feature-branch",
    "target_branch": "main"
  }'
```

#### Get Pull Request
```bash
curl -X GET "${HARNESS_API_URL}/code/api/v1/repos/${REPO_IDENTIFIER}/pullreq/${PR_NUMBER}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### Merge Pull Request
```bash
curl -X POST "${HARNESS_API_URL}/code/api/v1/repos/${REPO_IDENTIFIER}/pullreq/${PR_NUMBER}/merge" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -H "Content-Type: application/json" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}" \
  -d '{
    "method": "squash",
    "source_sha": "abc123"
  }'
```

### Build Operations

#### List Builds
```bash
curl -X GET "${HARNESS_API_URL}/ci/api/builds" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountIdentifier=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "orgIdentifier=${HARNESS_ORG_ID}" \
  --data-urlencode "projectIdentifier=${HARNESS_PROJECT_ID}"
```

#### Get Build Logs
```bash
curl -X GET "${HARNESS_API_URL}/log-service/blob/download" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Harness-Account: ${HARNESS_ACCOUNT_ID}" \
  -G --data-urlencode "accountID=${HARNESS_ACCOUNT_ID}" \
  --data-urlencode "key=${LOG_KEY}"
```

## Error Handling

All Harness API calls should include error handling:

```bash
response=$(curl -s -w "\n%{http_code}" ...)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 400 ]; then
  echo "Error: Harness API returned $http_code"
  echo "$body" | jq '.message // .error // .'
  exit 1
fi
```

## Rate Limiting

Harness API has rate limits. Implement exponential backoff:

```bash
max_retries=3
retry_delay=1

for i in $(seq 1 $max_retries); do
  response=$(curl -s -w "\n%{http_code}" ...)
  http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" -eq 429 ]; then
    sleep $((retry_delay * i))
    continue
  fi
  break
done
```

## Integration with Jira

When linking Harness operations to Jira issues:

1. **Always validate the issue first** using `issue-validator` agent
2. Use smart commit messages: `[PROJ-123] Commit message`
3. Link PRs to Jira issues via remote links
4. Update Jira status after pipeline completion

## Security Notes

- Never log or expose `HARNESS_API_KEY`
- Use environment variables, not hardcoded values
- PAT tokens should have minimal required permissions
- Rotate tokens regularly
