---
name: team-accelerator:status
intent: Display team dashboard with deployment status, test results, quality metrics, and workflow health across all environments
tags:
  - team-accelerator
  - command
  - status
inputs: []
risk: medium
cost: medium
description: Display team dashboard with deployment status, test results, quality metrics, and workflow health across all environments
---

# Status Command

Display a comprehensive team dashboard showing deployment status, test results, quality metrics, and workflow health across all environments.

## Usage

```bash
/status [view] [environment]
```

## Examples

```bash
# Full team dashboard
/status

# Deployment status only
/status deployments

# Test results summary
/status tests

# Quality metrics
/status quality

# Workflow health
/status workflows

# Production environment only
/status all prod
```

## Execution Flow

### 1. Gather Deployment Status

```bash
# Kubernetes deployments across namespaces
for ns in dev staging production; do
  echo "=== $ns ==="
  kubectl get deployments -n $ns -o wide
  kubectl get pods -n $ns -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp
done

# Get deployment versions
kubectl get deployments -n production -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.template.spec.containers[0].image}{"\n"}{end}'

# Check rollout status
kubectl rollout status deployment/${APP_NAME} -n production

# Get recent deployment history
helm history ${RELEASE_NAME} -n production --max 5
```

### 2. Aggregate Test Results

```bash
# Get latest test run results from CI
gh run list --workflow=ci-cd.yml --limit 5 --json conclusion,createdAt,headBranch,name

# Parse test coverage from artifacts
gh run download ${RUN_ID} -n coverage-report
cat coverage/coverage-summary.json | jq '.total'

# Get E2E test results
gh run download ${RUN_ID} -n playwright-report
cat playwright-report/results.json | jq '.stats'
```

### 3. Collect Quality Metrics

```bash
# SonarQube metrics
curl -s "${SONAR_URL}/api/measures/component?component=${PROJECT_KEY}&metricKeys=coverage,bugs,vulnerabilities,code_smells,sqale_rating,reliability_rating,security_rating" \
  -H "Authorization: Bearer ${SONAR_TOKEN}" | jq '.component.measures'

# Snyk vulnerabilities
snyk test --json | jq '.vulnerabilities | group_by(.severity) | map({severity: .[0].severity, count: length})'

# Code complexity
npx plato -r -d report src/
cat report/report.json | jq '.summary'
```

### 4. Check Workflow Health

```bash
# GitHub Actions workflow runs
gh api repos/${OWNER}/${REPO}/actions/runs --jq '.workflow_runs[:10] | .[] | {name: .name, status: .status, conclusion: .conclusion, created_at: .created_at}'

# Calculate success rate
gh run list --limit 100 --json conclusion | jq '[.[] | select(.conclusion == "success")] | length / 100 * 100'

# Average duration
gh run list --limit 20 --json createdAt,updatedAt | jq 'map((.updatedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) | add / length / 60'
```

### 5. Service Health Checks

```bash
# Health endpoints
for env in dev staging production; do
  url=$(kubectl get ingress -n $env -o jsonpath='{.items[0].spec.rules[0].host}')
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://${url}/health")
  echo "$env: $status"
done

# Response times
for env in dev staging production; do
  url=$(kubectl get ingress -n $env -o jsonpath='{.items[0].spec.rules[0].host}')
  time=$(curl -s -o /dev/null -w "%{time_total}" "https://${url}/health")
  echo "$env: ${time}s"
done
```

## Dashboard Output

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          TEAM DASHBOARD                                       ║
║                          ${PROJECT_NAME}                                      ║
║                          ${TIMESTAMP}                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ DEPLOYMENT STATUS                                                             ║
╠═══════════════╦═══════════════╦═══════════════╦═══════════════════════════════╣
║ Environment   ║ Version       ║ Status        ║ Last Deploy                   ║
╠═══════════════╬═══════════════╬═══════════════╬═══════════════════════════════╣
║ Production    ║ v2.3.1        ║ ✅ Healthy    ║ 2h ago (main@abc1234)         ║
║ Staging       ║ v2.4.0-rc1    ║ ✅ Healthy    ║ 30m ago (develop@def5678)     ║
║ Development   ║ v2.4.0-dev    ║ ⚠️ Degraded   ║ 15m ago (feature/x@ghi9012)   ║
╠═══════════════╩═══════════════╩═══════════════╩═══════════════════════════════╣
║                                                                               ║
║ PODS STATUS                                                                   ║
║   Production:  6/6 Running  │  Staging: 3/3 Running  │  Dev: 2/3 Running     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ TEST RESULTS (Last 24h)                                                       ║
╠═══════════════╦═══════════════╦═══════════════╦═══════════════════════════════╣
║ Type          ║ Passed        ║ Failed        ║ Coverage                      ║
╠═══════════════╬═══════════════╬═══════════════╬═══════════════════════════════╣
║ Unit          ║ 342/345       ║ 3             ║ 87.4%                         ║
║ Integration   ║ 48/48         ║ 0             ║ 72.1%                         ║
║ E2E           ║ 24/24         ║ 0             ║ N/A                           ║
╠═══════════════╩═══════════════╩═══════════════╩═══════════════════════════════╣
║                                                                               ║
║ FAILED TESTS:                                                                 ║
║   ❌ src/auth/token.test.ts:45 - should refresh expired token                ║
║   ❌ src/auth/token.test.ts:67 - should handle refresh failure               ║
║   ❌ src/api/users.test.ts:23 - should validate email format                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ CODE QUALITY                                                                  ║
╠═════════════════════════════════╦════════════════════════════════════════════╣
║ Metric                          ║ Value                                      ║
╠═════════════════════════════════╬════════════════════════════════════════════╣
║ Coverage                        ║ 87.4%  ✅ (target: 80%)                    ║
║ Bugs                            ║ 2      ⚠️ (target: 0)                      ║
║ Vulnerabilities                 ║ 0      ✅                                  ║
║ Code Smells                     ║ 23     ⚠️ (target: 20)                     ║
║ Technical Debt                  ║ 2d 4h  ✅ (limit: 5d)                      ║
║ Maintainability Rating          ║ A      ✅                                  ║
║ Reliability Rating              ║ B      ⚠️ (target: A)                      ║
║ Security Rating                 ║ A      ✅                                  ║
╠═════════════════════════════════╩════════════════════════════════════════════╣
║                                                                               ║
║ DEPENDENCY VULNERABILITIES:                                                   ║
║   Critical: 0 │ High: 1 │ Medium: 3 │ Low: 12                                ║
║   ⚠️ lodash@4.17.19 - Prototype Pollution (High) - Upgrade to 4.17.21       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ WORKFLOW HEALTH (7 days)                                                      ║
╠═════════════════════════════════╦════════════════════════════════════════════╣
║ Workflow                        ║ Success Rate │ Avg Duration │ Runs        ║
╠═════════════════════════════════╬════════════════════════════════════════════╣
║ CI/CD Pipeline                  ║ 94.2%        │ 4m 32s       │ 156         ║
║ PR Validation                   ║ 98.1%        │ 2m 15s       │ 203         ║
║ Nightly Tests                   ║ 100%         │ 12m 48s      │ 7           ║
║ Security Scan                   ║ 100%         │ 8m 22s       │ 7           ║
╠═════════════════════════════════╩════════════════════════════════════════════╣
║                                                                               ║
║ RECENT FAILURES:                                                              ║
║   ❌ CI/CD Pipeline #1234 - Build failed (2h ago)                            ║
║   ❌ CI/CD Pipeline #1228 - E2E tests failed (1d ago)                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ SERVICE HEALTH                                                                ║
╠═════════════════════════════════╦════════════════════════════════════════════╣
║ Service                         ║ Status │ Response Time │ Uptime (30d)     ║
╠═════════════════════════════════╬════════════════════════════════════════════╣
║ API Gateway                     ║ ✅     │ 45ms          │ 99.98%           ║
║ Auth Service                    ║ ✅     │ 32ms          │ 99.99%           ║
║ Database                        ║ ✅     │ 12ms          │ 99.95%           ║
║ Redis Cache                     ║ ✅     │ 2ms           │ 100%             ║
║ Message Queue                   ║ ⚠️     │ 156ms         │ 99.82%           ║
╠═════════════════════════════════╩════════════════════════════════════════════╣
║                                                                               ║
║ ALERTS:                                                                       ║
║   ⚠️ Message Queue latency elevated (>100ms threshold)                       ║
║   ⚠️ 3 failed unit tests need attention                                      ║
║   ⚠️ 1 high severity dependency vulnerability                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ QUICK ACTIONS                                                                 ║
║                                                                               ║
║   /deploy prod          - Deploy to production                               ║
║   /test unit            - Run unit tests                                     ║
║   /quality deps         - Check dependencies                                 ║
║   /workflow trigger     - Trigger CI pipeline                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## Data Sources

| Metric | Source | API/Command |
|--------|--------|-------------|
| Deployments | Kubernetes | `kubectl get deployments` |
| Pod Status | Kubernetes | `kubectl get pods` |
| Test Results | GitHub Actions | `gh run list` |
| Coverage | Codecov/SonarQube | API calls |
| Quality | SonarQube | `/api/measures/component` |
| Vulnerabilities | Snyk | `snyk test --json` |
| Workflows | GitHub Actions | `gh api repos/.../actions/runs` |
| Service Health | HTTP endpoints | `curl /health` |

## Refresh Intervals

For continuous monitoring, set up refresh intervals:

```bash
# Watch mode (refresh every 30s)
watch -n 30 '/status'

# CI/CD integration
# Add to post-deploy hooks for automatic updates
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `KUBECONFIG` | Kubernetes config path | For K8s metrics |
| `GITHUB_TOKEN` | GitHub API token | For workflow data |
| `SONAR_URL` | SonarQube server URL | For quality metrics |
| `SONAR_TOKEN` | SonarQube auth token | For quality metrics |

## Related Commands

- `/deploy` - Deploy applications
- `/test` - Run tests
- `/quality` - Quality checks
- `/workflow` - Workflow management
