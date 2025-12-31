# Harness Platform Knowledge Base

Complete reference for the Harness Software Delivery Platform - CI, CD, Feature Flags, STO, CCM, SRM, Chaos Engineering, IaCM, and Platform Administration.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Harness CI (Continuous Integration)](#harness-ci)
3. [Harness CD (Continuous Delivery)](#harness-cd)
4. [Harness Code Repository](#harness-code-repository)
5. [Harness Feature Flags](#harness-feature-flags)
6. [Harness STO (Security Testing Orchestration)](#harness-sto)
7. [Harness CCM (Cloud Cost Management)](#harness-ccm)
8. [Harness SRM (Service Reliability Management)](#harness-srm)
9. [Harness Chaos Engineering](#harness-chaos-engineering)
10. [Harness IaCM (Infrastructure as Code Management)](#harness-iacm)
11. [Harness Delegates](#harness-delegates)
12. [Harness RBAC](#harness-rbac)
13. [Harness Policy as Code (OPA)](#harness-policy-as-code)
14. [Harness Templates](#harness-templates)
15. [Harness Secrets Management](#harness-secrets-management)
16. [Harness API Reference](#harness-api-reference)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Best Practices](#best-practices)

---

## Platform Overview

### Harness Hierarchy

```
Account
└── Organization (Org)
    └── Project
        ├── Pipelines
        ├── Services
        ├── Environments
        ├── Connectors
        ├── Secrets
        ├── Templates
        └── Delegates
```

### Module Summary

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **CI** | Build & Test | Containers, caching, test intelligence |
| **CD** | Deploy | K8s, Terraform, Helm, GitOps |
| **Code** | Git Repository | PRs, code review, branch protection |
| **FF** | Feature Flags | Progressive rollouts, targeting |
| **STO** | Security | SAST, DAST, SCA, container scanning |
| **CCM** | Cost Management | Cloud cost visibility, optimization |
| **SRM** | Reliability | SLOs, error tracking, change impact |
| **CE** | Chaos Engineering | Fault injection, resilience testing |
| **IaCM** | Infrastructure | Terraform workspaces, drift detection |

### Common Environment Variables

```bash
# Core Configuration
export HARNESS_ACCOUNT_ID="your-account-id"
export HARNESS_API_KEY="your-api-key"
export HARNESS_BASE_URL="https://app.harness.io"

# Organization & Project
export HARNESS_ORG_ID="default"
export HARNESS_PROJECT_ID="your-project"

# Delegate
export DELEGATE_NAME="harness-delegate"
export DELEGATE_TOKEN="your-delegate-token"
```

---

## Harness CI

### Overview

Harness CI provides container-native continuous integration with intelligent test selection, caching, and parallelization.

### Pipeline Structure

```yaml
pipeline:
  name: Build Pipeline
  identifier: build_pipeline
  projectIdentifier: my_project
  orgIdentifier: default
  stages:
    - stage:
        name: Build
        identifier: build
        type: CI
        spec:
          cloneCodebase: true
          infrastructure:
            type: KubernetesDirect
            spec:
              connectorRef: k8s_connector
              namespace: harness-builds
              automountServiceAccountToken: true
              nodeSelector: {}
              os: Linux
          execution:
            steps:
              - step:
                  name: Build
                  identifier: build
                  type: Run
                  spec:
                    connectorRef: docker_connector
                    image: node:18
                    shell: Sh
                    command: |
                      npm ci
                      npm run build
```

### Build Infrastructure Types

| Type | Use Case | Configuration |
|------|----------|---------------|
| **Kubernetes** | Scalable, isolated builds | Cluster connector required |
| **Harness Cloud** | Managed infrastructure | No setup needed |
| **VM** | Windows/.NET builds | AWS/Azure/GCP VMs |
| **Local** | Self-hosted runners | Docker on local machine |

### Kubernetes Infrastructure

```yaml
infrastructure:
  type: KubernetesDirect
  spec:
    connectorRef: k8s_connector
    namespace: harness-ci
    automountServiceAccountToken: true
    nodeSelector:
      kubernetes.io/os: linux
    tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "ci"
        effect: "NoSchedule"
    harnessImageConnectorRef: docker_connector
    os: Linux
```

### Harness Cloud Infrastructure

```yaml
infrastructure:
  type: Cloud
  spec:
    os: Linux  # or MacOS, Windows
```

### Step Types

#### Run Step (Shell Commands)

```yaml
- step:
    name: Run Tests
    identifier: run_tests
    type: Run
    spec:
      connectorRef: docker_connector
      image: node:18-alpine
      shell: Sh
      command: |
        npm ci
        npm test -- --coverage
      envVariables:
        NODE_ENV: test
      outputVariables:
        - name: COVERAGE
      reports:
        type: JUnit
        spec:
          paths:
            - "**/*.xml"
```

#### Run Tests Step (Test Intelligence)

```yaml
- step:
    name: Run Tests with TI
    identifier: run_tests_ti
    type: RunTests
    spec:
      connectorRef: docker_connector
      image: maven:3.8-openjdk-17
      language: Java
      buildTool: Maven
      args: test
      packages: com.myapp
      runOnlySelectedTests: true  # Test Intelligence
      testAnnotations: org.junit.Test
      preCommand: |
        echo "Pre-test setup"
      postCommand: |
        echo "Post-test cleanup"
      reports:
        type: JUnit
        spec:
          paths:
            - "**/surefire-reports/*.xml"
```

#### Build and Push Step

```yaml
- step:
    name: Build and Push
    identifier: build_push
    type: BuildAndPushDockerRegistry
    spec:
      connectorRef: docker_connector
      repo: myorg/myapp
      tags:
        - <+pipeline.sequenceId>
        - latest
      dockerfile: Dockerfile
      context: .
      optimize: true
      caching: true
      buildArgs:
        VERSION: <+pipeline.sequenceId>
      labels:
        maintainer: team@company.com
```

### Caching

#### Save Cache

```yaml
- step:
    name: Save Cache
    identifier: save_cache
    type: SaveCacheS3
    spec:
      connectorRef: aws_connector
      region: us-east-1
      bucket: harness-cache
      key: node-modules-{{ checksum "package-lock.json" }}
      sourcePaths:
        - node_modules
      archiveFormat: Tar
```

#### Restore Cache

```yaml
- step:
    name: Restore Cache
    identifier: restore_cache
    type: RestoreCacheS3
    spec:
      connectorRef: aws_connector
      region: us-east-1
      bucket: harness-cache
      key: node-modules-{{ checksum "package-lock.json" }}
      archiveFormat: Tar
      failIfKeyNotFound: false
```

### Parallelism and Matrix

```yaml
- step:
    name: Test Matrix
    identifier: test_matrix
    type: Run
    spec:
      connectorRef: docker_connector
      image: node:<+matrix.nodeVersion>
      command: npm test
    strategy:
      matrix:
        nodeVersion:
          - "16"
          - "18"
          - "20"
        browser:
          - chrome
          - firefox
      maxConcurrency: 4
```

### Test Intelligence

Test Intelligence analyzes code changes and runs only affected tests:

```yaml
- stage:
    name: Build and Test
    type: CI
    spec:
      execution:
        steps:
          - step:
              type: RunTests
              spec:
                language: Java
                buildTool: Maven
                runOnlySelectedTests: true  # Enable TI
                testGlobs: "**/*Test.java"
                preCommand: |
                  # TI analyzes git diff to select tests
                  echo "Running selected tests only"
```

### Background Services

```yaml
- step:
    name: Start PostgreSQL
    identifier: postgres
    type: Background
    spec:
      connectorRef: docker_connector
      image: postgres:14
      shell: Sh
      envVariables:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: testdb
      portBindings:
        "5432": "5432"
```

### Plugins

```yaml
- step:
    name: Slack Notification
    identifier: slack
    type: Plugin
    spec:
      connectorRef: docker_connector
      image: plugins/slack
      settings:
        webhook: <+secrets.getValue("slack_webhook")>
        channel: builds
        template: |
          Build {{build.status}} for {{repo.name}}
```

### CI Expressions

| Expression | Description |
|------------|-------------|
| `<+codebase.branch>` | Git branch name |
| `<+codebase.commitSha>` | Full commit SHA |
| `<+codebase.shortCommitSha>` | Short commit SHA |
| `<+codebase.repoUrl>` | Repository URL |
| `<+codebase.gitUserId>` | Git user ID |
| `<+codebase.sourceBranch>` | PR source branch |
| `<+codebase.targetBranch>` | PR target branch |
| `<+codebase.prNumber>` | Pull request number |
| `<+codebase.prTitle>` | Pull request title |

---

## Harness CD

### Deployment Types

| Type | Description | Steps |
|------|-------------|-------|
| **Kubernetes** | Native K8s deployments | Rolling, Blue-Green, Canary |
| **Helm** | Helm chart deployments | Helm Install/Upgrade |
| **Serverless** | AWS Lambda, Azure Functions | Serverless Deploy |
| **ECS** | Amazon ECS deployments | ECS Rolling, Blue-Green |
| **SSH** | Traditional VM deployments | SSH commands |
| **WinRM** | Windows deployments | PowerShell remoting |
| **Azure Web Apps** | Azure PaaS | Slot swaps |
| **Tanzu** | VMware Tanzu | TAS deployments |
| **Custom** | Any deployment | Shell scripts |

### Service Definition

```yaml
service:
  name: My Application
  identifier: my_application
  serviceDefinition:
    type: Kubernetes
    spec:
      manifests:
        - manifest:
            identifier: k8s_manifest
            type: K8sManifest
            spec:
              store:
                type: Harness
                spec:
                  files:
                    - /manifests/deployment.yaml
                    - /manifests/service.yaml
              valuesPaths:
                - /manifests/values.yaml
              skipResourceVersioning: false
      artifacts:
        primary:
          primaryArtifactRef: docker_image
          sources:
            - identifier: docker_image
              type: DockerRegistry
              spec:
                connectorRef: docker_connector
                imagePath: myorg/myapp
                tag: <+input>
      variables:
        - name: replicas
          type: String
          value: "3"
        - name: cpu_limit
          type: String
          value: "500m"
```

### Environment Definition

```yaml
environment:
  name: Production
  identifier: production
  type: Production
  orgIdentifier: default
  projectIdentifier: my_project
  variables:
    - name: namespace
      type: String
      value: prod
    - name: domain
      type: String
      value: app.company.com
  overrides:
    manifests:
      - manifest:
          identifier: prod_values
          type: Values
          spec:
            store:
              type: Harness
              spec:
                files:
                  - /manifests/prod-values.yaml
```

### Infrastructure Definition

```yaml
infrastructureDefinition:
  name: Production K8s Cluster
  identifier: prod_k8s
  environmentRef: production
  deploymentType: Kubernetes
  type: KubernetesDirect
  spec:
    connectorRef: k8s_prod_connector
    namespace: <+env.variables.namespace>
    releaseName: release-<+INFRA_KEY>
  allowSimultaneousDeployments: false
```

### Deployment Strategies

#### Rolling Deployment

```yaml
execution:
  steps:
    - step:
        name: Rollout Deployment
        identifier: rolloutDeployment
        type: K8sRollingDeploy
        timeout: 10m
        spec:
          skipDryRun: false
          pruningEnabled: false
  rollbackSteps:
    - step:
        name: Rollback
        identifier: rollback
        type: K8sRollingRollback
        timeout: 10m
        spec: {}
```

#### Blue-Green Deployment

```yaml
execution:
  steps:
    - step:
        name: Stage Deployment
        identifier: stageDeployment
        type: K8sBGStageDeployment
        timeout: 10m
        spec:
          skipDryRun: false
    - step:
        name: BG Swap Services
        identifier: bgSwapServices
        type: K8sBGSwapServices
        timeout: 10m
        spec:
          skipDryRun: false
  rollbackSteps:
    - step:
        name: Swap Rollback
        identifier: swapRollback
        type: K8sBGSwapServicesRollback
        timeout: 10m
        spec: {}
```

#### Canary Deployment

```yaml
execution:
  steps:
    - step:
        name: Canary Deployment
        identifier: canaryDeployment
        type: K8sCanaryDeploy
        timeout: 10m
        spec:
          instanceSelection:
            type: Count
            spec:
              count: 1
          skipDryRun: false
    - step:
        name: Verify Canary
        identifier: verifyCanary
        type: Verify
        timeout: 2h
        spec:
          type: Canary
          monitoredService:
            type: Default
            spec: {}
          spec:
            sensitivity: MEDIUM
            duration: 15m
            deploymentTag: <+artifacts.primary.tag>
    - step:
        name: Canary Delete
        identifier: canaryDelete
        type: K8sCanaryDelete
        timeout: 10m
        spec: {}
    - step:
        name: Rolling Deployment
        identifier: rollingDeployment
        type: K8sRollingDeploy
        timeout: 10m
        spec:
          skipDryRun: false
```

### CD Expressions

| Expression | Description |
|------------|-------------|
| `<+service.name>` | Service name |
| `<+service.identifier>` | Service identifier |
| `<+env.name>` | Environment name |
| `<+env.type>` | Environment type (Production/PreProduction) |
| `<+infra.name>` | Infrastructure name |
| `<+infra.namespace>` | Kubernetes namespace |
| `<+artifact.tag>` | Primary artifact tag |
| `<+artifact.image>` | Full artifact image path |
| `<+artifact.imagePath>` | Image path without tag |
| `<+manifest.name>` | Manifest name |

---

## Harness Code Repository

### Overview

Harness Code is a built-in Git repository with native CI/CD integration, code review, and branch protection.

### Repository Operations

```bash
# Environment setup
export HARNESS_CODE_API="${HARNESS_BASE_URL}/code/api/v1"

# Create repository
curl -X POST "${HARNESS_CODE_API}/repos" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "my-service",
    "description": "My microservice",
    "default_branch": "main",
    "is_public": false
  }'

# List repositories
curl -X GET "${HARNESS_CODE_API}/repos" \
  -H "x-api-key: ${HARNESS_API_KEY}"

# Get repository details
curl -X GET "${HARNESS_CODE_API}/repos/my-service" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

### Pull Request Operations

```bash
# Create pull request
curl -X POST "${HARNESS_CODE_API}/repos/my-service/pullreq" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PROJ-123: Add user authentication",
    "source_branch": "feature/PROJ-123",
    "target_branch": "main",
    "description": "Implements user authentication feature"
  }'

# List pull requests
curl -X GET "${HARNESS_CODE_API}/repos/my-service/pullreq?state=open" \
  -H "x-api-key: ${HARNESS_API_KEY}"

# Get PR details
curl -X GET "${HARNESS_CODE_API}/repos/my-service/pullreq/42" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

### Code Review Operations

```bash
# Add comment to PR
curl -X POST "${HARNESS_CODE_API}/repos/my-service/pullreq/42/comments" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"text": "LGTM! Great implementation."}'

# Add inline code comment
curl -X POST "${HARNESS_CODE_API}/repos/my-service/pullreq/42/comments" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Consider adding error handling here",
    "path": "src/auth.ts",
    "line_start": 42,
    "line_end": 45,
    "line_start_new": true,
    "line_end_new": true
  }'

# Submit review
curl -X POST "${HARNESS_CODE_API}/repos/my-service/pullreq/42/reviews" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "commit_sha": "abc123def456",
    "decision": "approved"
  }'

# Merge PR
curl -X POST "${HARNESS_CODE_API}/repos/my-service/pullreq/42/merge" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "squash",
    "source_sha": "abc123def456",
    "title": "feat: Add user authentication",
    "delete_source_branch": true
  }'
```

### Branch Protection Rules

```yaml
# Configure via Harness UI or API
branch_rules:
  - pattern: "main"
    require_pull_request: true
    require_approvals: 2
    require_code_owners: true
    require_status_checks:
      - "ci/build"
      - "ci/test"
      - "security/scan"
    restrict_pushes: true
    allow_force_push: false
    allow_deletion: false
```

### Webhooks

```yaml
webhook:
  name: CI Trigger
  identifier: ci_trigger
  enabled: true
  events:
    - push
    - pull_request
  target_url: https://app.harness.io/pipeline/trigger/...
  secret_ref: webhook_secret
```

---

## Harness Feature Flags

### Overview

Feature Flags enable progressive rollouts, A/B testing, and kill switches with minimal risk.

### Flag Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Boolean** | On/Off toggle | Feature toggle |
| **Multivariate** | Multiple values | A/B testing, gradual rollout |
| **JSON** | Complex configuration | Feature configuration |

### SDK Integration

#### JavaScript/TypeScript

```typescript
import { initialize, Event } from '@harnessio/ff-javascript-client-sdk';

const client = initialize(
  'your-client-sdk-key',
  {
    identifier: 'user-123',
    name: 'John Doe',
    attributes: {
      email: 'john@company.com',
      plan: 'enterprise'
    }
  }
);

client.on(Event.READY, flags => {
  if (client.variation('dark_mode', false)) {
    enableDarkMode();
  }
});

client.on(Event.CHANGED, flagInfo => {
  console.log('Flag changed:', flagInfo);
});
```

#### Python

```python
from featureflags.client import CfClient
from featureflags.evaluations.feature import FeatureConfigKind

client = CfClient(sdk_key="your-server-sdk-key")

target = Target(
    identifier="user-123",
    name="John Doe",
    attributes={"plan": "enterprise"}
)

# Boolean flag
if client.bool_variation("dark_mode", target, False):
    enable_dark_mode()

# Multivariate flag
variant = client.string_variation("button_color", target, "blue")
```

#### Go

```go
import (
    harness "github.com/harness/ff-golang-server-sdk/client"
    "github.com/harness/ff-golang-server-sdk/evaluation"
)

client, _ := harness.NewCfClient(sdkKey)
defer client.Close()

target := evaluation.Target{
    Identifier: "user-123",
    Name:       "John Doe",
    Attributes: &map[string]interface{}{
        "plan": "enterprise",
    },
}

enabled, _ := client.BoolVariation("dark_mode", &target, false)
if enabled {
    enableDarkMode()
}
```

### Targeting Rules

```yaml
flag:
  identifier: new_checkout_flow
  name: New Checkout Flow
  kind: boolean
  variations:
    - identifier: "true"
      value: true
    - identifier: "false"
      value: false
  defaultServe:
    variation: "false"
  rules:
    - priority: 1
      clauses:
        - attribute: email
          op: endsWith
          values: ["@company.com"]
      serve:
        variation: "true"
    - priority: 2
      clauses:
        - attribute: plan
          op: equal
          values: ["enterprise", "pro"]
      serve:
        distribution:
          variations:
            - variation: "true"
              weight: 50
            - variation: "false"
              weight: 50
```

### Percentage Rollouts

```yaml
flag:
  identifier: new_feature
  percentageRollout:
    variations:
      - variation: "true"
        weight: 10  # 10% of users
      - variation: "false"
        weight: 90  # 90% of users
    bucketBy: identifier  # Consistent bucketing
```

### Pipeline Integration

```yaml
- step:
    name: Enable Feature Flag
    identifier: enableFF
    type: FlagConfiguration
    spec:
      feature: new_checkout_flow
      environment: production
      instructions:
        - kind: setFeatureFlagState
          parameters:
            state: "on"
```

---

## Harness STO

### Overview

Security Testing Orchestration (STO) integrates security scanning into CI/CD pipelines with unified vulnerability management.

### Scanner Types

| Category | Tools Supported |
|----------|----------------|
| **SAST** | SonarQube, Checkmarx, Semgrep, Bandit |
| **DAST** | OWASP ZAP, Burp Suite, Nikto |
| **SCA** | Snyk, OWASP Dependency-Check, WhiteSource |
| **Container** | Aqua Trivy, Grype, Prisma Cloud |
| **Secrets** | Gitleaks, TruffleHog |
| **IaC** | Checkov, Terrascan, KICS |

### SAST Scanner Step

```yaml
- step:
    name: SAST Scan
    identifier: sast_scan
    type: Security
    spec:
      privileged: true
      settings:
        product_name: sonarqube
        product_config_name: sonarqube-agent
        policy_type: orchestratedScan
        scan_type: repository
        repository_project: my-app
        repository_branch: <+codebase.branch>
      imagePullPolicy: Always
```

### Container Scan Step

```yaml
- step:
    name: Container Scan
    identifier: container_scan
    type: AquaTrivy
    spec:
      mode: orchestration
      config: default
      target:
        type: container
        detection: auto
      advanced:
        log:
          level: info
      privileged: true
      image:
        type: docker_v2
        name: myorg/myapp
        tag: <+pipeline.sequenceId>
        domain: docker.io
```

### SCA Scan Step

```yaml
- step:
    name: Dependency Scan
    identifier: sca_scan
    type: Snyk
    spec:
      mode: orchestration
      config: default
      target:
        type: repository
        detection: auto
      advanced:
        log:
          level: info
      auth:
        access_token: <+secrets.getValue("snyk_token")>
```

### Security Policy Enforcement

```yaml
- step:
    name: Security Gate
    identifier: security_gate
    type: SecurityTests
    spec:
      type: container
      failOnSeverity: CRITICAL
      exemptions:
        - cve: CVE-2023-12345
          reason: "False positive - not applicable"
          expires: "2024-12-31"
```

### Governance Rules

```yaml
# OPA Policy for security gates
package harness.sto

deny[msg] {
    input.severity == "CRITICAL"
    not input.exempted
    msg := sprintf("Critical vulnerability found: %s", [input.cve])
}

warn[msg] {
    input.severity == "HIGH"
    msg := sprintf("High severity vulnerability: %s", [input.cve])
}
```

---

## Harness CCM

### Overview

Cloud Cost Management provides visibility into cloud spending with optimization recommendations.

### Cost Categories

```yaml
costCategory:
  name: Engineering Teams
  identifier: engineering_teams
  rules:
    - name: Platform Team
      conditions:
        - viewField:
            fieldId: label
            fieldName: team
            identifier: LABEL
          operator: IN
          values:
            - platform
    - name: Backend Team
      conditions:
        - viewField:
            fieldId: label
            fieldName: team
            identifier: LABEL
          operator: IN
          values:
            - backend
    - name: Unallocated
      conditions:
        - viewField:
            fieldId: label
            fieldName: team
            identifier: LABEL
          operator: NULL
```

### Budget Configuration

```yaml
budget:
  name: Q1 Production Budget
  identifier: q1_prod_budget
  scope:
    type: PERSPECTIVE
    perspectiveId: production_costs
  amount: 50000
  period: MONTHLY
  alertThresholds:
    - percentage: 75
      alertType: ACTUAL
      notificationChannels:
        - slack_finance
    - percentage: 90
      alertType: ACTUAL
      notificationChannels:
        - slack_finance
        - email_leadership
    - percentage: 100
      alertType: FORECASTED
      notificationChannels:
        - slack_finance
```

### AutoStopping Rules

```yaml
autoStoppingRule:
  name: Dev Environment AutoStop
  identifier: dev_autostop
  cloudProvider: AWS
  resourceType: EC2
  filter:
    tags:
      - key: Environment
        value: development
  schedule:
    timezone: America/New_York
    fixedSchedule:
      - days: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY]
        startTime: "09:00"
        endTime: "18:00"
  idleTimeout: 30  # minutes
  dryRun: false
```

### Recommendations

```yaml
# Query recommendations via API
GET /ccm/api/recommendations
{
  "filter": {
    "resourceType": "EC2",
    "savingsPercentage": { "gte": 20 }
  },
  "sort": {
    "field": "monthlySavings",
    "order": "DESC"
  }
}
```

---

## Harness SRM

### Overview

Service Reliability Management provides SLO tracking, error tracking, and change impact analysis.

### Monitored Service

```yaml
monitoredService:
  name: Payment Service
  identifier: payment_service
  serviceRef: payment_svc
  environmentRef: production
  type: Application
  sources:
    healthSources:
      - name: Datadog APM
        identifier: datadog_apm
        type: DatadogMetrics
        spec:
          connectorRef: datadog_connector
          feature: Datadog Cloud Metrics
          metricDefinitions:
            - identifier: response_time
              metricName: trace.http.request.duration
              riskCategory: Performance
              thresholds:
                - type: greaterThan
                  value: 500  # ms
            - identifier: error_rate
              metricName: trace.http.request.errors
              riskCategory: Errors
    changeSources:
      - name: Harness CD
        identifier: harness_cd
        type: HarnessCDNextGen
        enabled: true
```

### SLO Configuration

```yaml
slo:
  name: Payment API Availability
  identifier: payment_api_availability
  monitoredServiceRef: payment_service
  type: Simple
  sloTarget:
    type: Rolling
    sloTargetPercentage: 99.9
    spec:
      periodLength: 7d
  serviceLevelIndicators:
    - name: Success Rate
      identifier: success_rate
      type: Window
      spec:
        type: Threshold
        spec:
          metric1: good_requests
          metric2: total_requests
          thresholdType: Ratio
          thresholdValue: 0.999
```

### Error Tracking

```yaml
errorTracking:
  connectorRef: error_tracking_connector
  serviceName: payment-service
  environmentName: production
  notificationRules:
    - name: New Errors
      condition:
        type: NEW_ERROR
      notificationChannels:
        - type: SLACK
          spec:
            webhookUrl: <+secrets.getValue("slack_webhook")>
    - name: Critical Regression
      condition:
        type: REGRESSION
        threshold:
          count: 100
          period: 1h
      notificationChannels:
        - type: PAGERDUTY
          spec:
            integrationKey: <+secrets.getValue("pd_key")>
```

---

## Harness Chaos Engineering

### Overview

Chaos Engineering enables proactive resilience testing through controlled fault injection.

### Chaos Infrastructure

```yaml
chaosInfrastructure:
  name: Production K8s Chaos
  identifier: prod_k8s_chaos
  type: Kubernetes
  environmentRef: production
  spec:
    serviceAccount: litmus-admin
    namespace: litmus
    tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "chaos"
        effect: "NoSchedule"
```

### Chaos Experiments

#### Pod Delete Experiment

```yaml
experiment:
  name: Pod Delete Chaos
  identifier: pod_delete
  chaosInfrastructureRef: prod_k8s_chaos
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: CHAOS_INTERVAL
              value: "10"
            - name: PODS_AFFECTED_PERC
              value: "50"
        probe:
          - name: healthcheck
            type: httpProbe
            httpProbe/inputs:
              url: "http://payment-service/health"
              method:
                get:
                  criteria: ==
                  responseCode: "200"
            mode: Continuous
            runProperties:
              probeTimeout: 5
              interval: 2
              retry: 3
```

#### Network Latency Experiment

```yaml
experiment:
  name: Network Latency
  identifier: network_latency
  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: NETWORK_LATENCY
              value: "200"  # ms
            - name: TOTAL_CHAOS_DURATION
              value: "120"
            - name: TARGET_PODS
              value: "payment-service"
            - name: CONTAINER_RUNTIME
              value: "containerd"
```

#### CPU Stress Experiment

```yaml
experiment:
  name: CPU Stress
  identifier: cpu_stress
  experiments:
    - name: pod-cpu-hog
      spec:
        components:
          env:
            - name: CPU_CORES
              value: "2"
            - name: TOTAL_CHAOS_DURATION
              value: "60"
            - name: PODS_AFFECTED_PERC
              value: "100"
```

### Chaos Probes

```yaml
probes:
  - name: Application Health
    type: httpProbe
    mode: SOT  # Start of Test
    httpProbe/inputs:
      url: "http://service/health"
      method:
        get:
          criteria: ==
          responseCode: "200"
    runProperties:
      probeTimeout: 10
      interval: 5
      retry: 3
      probePollingInterval: 2

  - name: Database Connectivity
    type: cmdProbe
    mode: Continuous
    cmdProbe/inputs:
      command: "pg_isready -h db-host -p 5432"
      comparator:
        type: int
        criteria: ==
        value: "0"
    runProperties:
      probeTimeout: 5
      interval: 10
```

### GameDay Configuration

```yaml
gameday:
  name: Q4 Resilience GameDay
  identifier: q4_gameday
  description: "Quarterly resilience testing"
  experiments:
    - experimentRef: pod_delete
      weight: 30
    - experimentRef: network_latency
      weight: 40
    - experimentRef: cpu_stress
      weight: 30
  schedule:
    type: OneTime
    spec:
      startTime: "2024-12-15T10:00:00Z"
  notifications:
    - type: SLACK
      webhookUrl: <+secrets.getValue("slack_webhook")>
```

---

## Harness IaCM

### Overview

Infrastructure as Code Management provides Terraform workspace management with drift detection and policy enforcement.

### Workspace Configuration

```yaml
workspace:
  name: Production Infrastructure
  identifier: prod_infra
  description: "Production cloud infrastructure"
  repository:
    connectorRef: harness_code
    path: terraform/production
    branch: main
  terraformVersion: "1.5.7"
  environmentVariables:
    - name: TF_LOG
      value: INFO
      valueType: string
  terraformVariables:
    - name: environment
      value: production
      valueType: string
    - name: region
      value: us-east-1
      valueType: string
  providerCredentials:
    - name: AWS
      connectorRef: aws_connector
```

### Terraform Pipeline Steps

#### Terraform Init

```yaml
- step:
    name: Terraform Init
    identifier: tf_init
    type: IACMTerraformPlugin
    spec:
      command: init
      workspace: prod_infra
```

#### Terraform Plan

```yaml
- step:
    name: Terraform Plan
    identifier: tf_plan
    type: IACMTerraformPlugin
    spec:
      command: plan
      workspace: prod_infra
```

#### Terraform Apply

```yaml
- step:
    name: Terraform Apply
    identifier: tf_apply
    type: IACMTerraformPlugin
    spec:
      command: apply
      workspace: prod_infra
```

### Drift Detection

```yaml
driftDetection:
  workspaceRef: prod_infra
  schedule:
    type: Cron
    expression: "0 */6 * * *"  # Every 6 hours
  notifications:
    - type: SLACK
      condition: DRIFT_DETECTED
      webhookUrl: <+secrets.getValue("slack_webhook")>
  autoRemediation:
    enabled: false
```

### Cost Estimation

```yaml
- step:
    name: Cost Estimate
    identifier: cost_estimate
    type: IACMTerraformPlugin
    spec:
      command: plan
      workspace: prod_infra
      enableCostEstimation: true
      costEstimationBreakpoint:
        monthlyEstimate: 10000
        action: REQUIRE_APPROVAL
```

---

## Harness Delegates

### Overview

Delegates are lightweight workers that execute tasks in your infrastructure, connecting Harness to your environments.

### Delegate Types

| Type | Use Case | Deployment |
|------|----------|------------|
| **Kubernetes** | K8s clusters, cloud-native | Helm/YAML |
| **Docker** | Single host, development | Docker run |
| **Shell** | Legacy systems, on-prem | Shell script |
| **ECS** | AWS ECS environments | Task definition |

### Kubernetes Delegate Installation

```bash
# Install via Helm
helm repo add harness-delegate https://app.harness.io/storage/harness-download/delegate-helm-chart/
helm repo update

helm install harness-delegate harness-delegate/harness-delegate-ng \
  --namespace harness-delegate \
  --create-namespace \
  --set accountId=${HARNESS_ACCOUNT_ID} \
  --set delegateToken=${DELEGATE_TOKEN} \
  --set delegateName=prod-delegate \
  --set managerEndpoint=https://app.harness.io \
  --set delegateDockerImage=harness/delegate:latest \
  --set replicas=2 \
  --set k8sPermissionsType=CLUSTER_ADMIN
```

### Delegate YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: harness-delegate
  namespace: harness-delegate
spec:
  replicas: 2
  selector:
    matchLabels:
      app: harness-delegate
  template:
    metadata:
      labels:
        app: harness-delegate
    spec:
      serviceAccountName: harness-delegate
      containers:
        - name: delegate
          image: harness/delegate:latest
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
          env:
            - name: ACCOUNT_ID
              value: "${HARNESS_ACCOUNT_ID}"
            - name: DELEGATE_TOKEN
              valueFrom:
                secretKeyRef:
                  name: harness-delegate-token
                  key: token
            - name: DELEGATE_NAME
              value: "prod-delegate"
            - name: MANAGER_HOST_AND_PORT
              value: "https://app.harness.io"
            - name: DELEGATE_TYPE
              value: "KUBERNETES"
            - name: DELEGATE_TAGS
              value: "production,k8s,aws"
            - name: INIT_SCRIPT
              value: |
                # Install additional tools
                apt-get update && apt-get install -y awscli kubectl helm
          volumeMounts:
            - name: delegate-storage
              mountPath: /opt/harness-delegate
      volumes:
        - name: delegate-storage
          emptyDir: {}
```

### Docker Delegate

```bash
docker run -d --name harness-delegate \
  -e ACCOUNT_ID=${HARNESS_ACCOUNT_ID} \
  -e DELEGATE_TOKEN=${DELEGATE_TOKEN} \
  -e DELEGATE_NAME=docker-delegate \
  -e MANAGER_HOST_AND_PORT=https://app.harness.io \
  -e DELEGATE_TYPE=DOCKER \
  -e DELEGATE_TAGS="docker,dev" \
  --restart always \
  harness/delegate:latest
```

### Delegate Selectors

```yaml
# Use specific delegates for steps
- step:
    name: Deploy to Production
    identifier: deploy_prod
    type: K8sRollingDeploy
    spec:
      delegateSelectors:
        - production
        - aws
```

### Delegate Profiles

```yaml
delegateProfile:
  name: Production Profile
  identifier: prod_profile
  startupScript: |
    #!/bin/bash
    # Install required tools
    curl -LO "https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl"
    chmod +x kubectl && mv kubectl /usr/local/bin/

    # Install Helm
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

    # Install AWS CLI
    pip3 install awscli
  selectors:
    - production
    - k8s
```

### Delegate Metrics

```yaml
# Prometheus metrics endpoint
# Available at :3460/api/metrics

# Key metrics
harness_delegate_connected{account_id="xxx"} 1
harness_delegate_task_completed_total{account_id="xxx", status="SUCCESS"} 1234
harness_delegate_task_duration_seconds{account_id="xxx", quantile="0.99"} 45.2
harness_delegate_resource_usage{resource="cpu", account_id="xxx"} 0.45
harness_delegate_resource_usage{resource="memory", account_id="xxx"} 0.67
```

---

## Harness RBAC

### Overview

Role-Based Access Control provides fine-grained permissions at Account, Organization, and Project levels.

### Built-in Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **Account Admin** | Account | Full access to everything |
| **Organization Admin** | Org | Full access within org |
| **Project Admin** | Project | Full access within project |
| **Pipeline Executor** | Project | Execute pipelines |
| **Pipeline Viewer** | Project | View pipelines only |
| **Connector Manager** | Project | Manage connectors |
| **Secret Manager** | Project | Manage secrets |

### Custom Role

```yaml
role:
  name: Deployment Manager
  identifier: deployment_manager
  description: "Can manage deployments but not modify pipelines"
  permissions:
    - resourceType: PIPELINE
      actions:
        - core_pipeline_view
        - core_pipeline_execute
    - resourceType: SERVICE
      actions:
        - core_service_view
    - resourceType: ENVIRONMENT
      actions:
        - core_environment_view
    - resourceType: CONNECTOR
      actions:
        - core_connector_view
    - resourceType: SECRET
      actions:
        - core_secret_view
```

### Resource Groups

```yaml
resourceGroup:
  name: Production Resources
  identifier: prod_resources
  description: "All production environment resources"
  includedScopes:
    - filter: ByResourceType
      resourceType: ENVIRONMENT
      attributeFilter:
        attributeName: type
        attributeValues:
          - Production
    - filter: ByResourceType
      resourceType: SERVICE
      attributeFilter:
        attributeName: tag
        attributeValues:
          - production
```

### User Groups

```yaml
userGroup:
  name: Platform Engineers
  identifier: platform_engineers
  description: "Platform engineering team"
  users:
    - user1@company.com
    - user2@company.com
  notificationConfigs:
    - type: SLACK
      slackWebhookUrl: <+secrets.getValue("slack_webhook")>
    - type: EMAIL
      groupEmail: platform-team@company.com
```

### Role Binding

```yaml
roleBinding:
  name: Platform Team Production Access
  identifier: platform_prod_access
  roleIdentifier: deployment_manager
  resourceGroupIdentifier: prod_resources
  principals:
    - type: USER_GROUP
      identifier: platform_engineers
```

### Service Account

```yaml
serviceAccount:
  name: CI Pipeline Service
  identifier: ci_pipeline_sa
  description: "Service account for CI pipelines"
  tags:
    purpose: automation
  roleBindings:
    - roleIdentifier: pipeline_executor
      resourceGroupIdentifier: all_project_resources
```

---

## Harness Policy as Code

### Overview

Policy as Code uses Open Policy Agent (OPA) Rego policies to enforce governance across the platform.

### Policy Structure

```rego
package pipeline

# Deny pipelines without approval step for production
deny[msg] {
    input.pipeline.stages[_].stage.spec.environment.environmentRef == "production"
    not has_approval_step
    msg := "Production deployments require an approval step"
}

has_approval_step {
    input.pipeline.stages[_].stage.spec.execution.steps[_].step.type == "HarnessApproval"
}

# Require specific delegate selectors for production
deny[msg] {
    stage := input.pipeline.stages[_].stage
    stage.spec.environment.environmentRef == "production"
    not stage.spec.infrastructure.spec.delegateSelectors
    msg := "Production stages must specify delegate selectors"
}

# Enforce naming conventions
deny[msg] {
    not startswith(input.pipeline.identifier, "deploy_")
    not startswith(input.pipeline.identifier, "build_")
    msg := "Pipeline identifier must start with 'deploy_' or 'build_'"
}

# Limit parallel executions
warn[msg] {
    input.pipeline.allowStageExecutions == true
    count(input.pipeline.stages) > 5
    msg := "Consider limiting parallel stage executions for pipelines with more than 5 stages"
}
```

### Policy Set

```yaml
policySet:
  name: Production Governance
  identifier: prod_governance
  description: "Governance policies for production deployments"
  policies:
    - policyRef: require_approval
      severity: error
    - policyRef: enforce_delegate_selectors
      severity: error
    - policyRef: naming_conventions
      severity: warning
  entitySelector:
    - type: PIPELINE
      filter:
        - key: tags
          value: production
```

### Policy Evaluation Points

| Evaluation Point | Triggered When |
|-----------------|----------------|
| **On Save** | Pipeline/Template saved |
| **On Run** | Pipeline execution starts |
| **On Step** | Before step execution |
| **On Approval** | Approval requested |

### Common Policies

#### Require Tests Before Deploy

```rego
package pipeline

deny[msg] {
    has_deploy_stage
    not has_test_stage_before_deploy
    msg := "Deployment stages must be preceded by a test stage"
}

has_deploy_stage {
    input.pipeline.stages[_].stage.type == "Deployment"
}

has_test_stage_before_deploy {
    some i, j
    input.pipeline.stages[i].stage.type == "CI"
    input.pipeline.stages[j].stage.type == "Deployment"
    i < j
}
```

#### Enforce Secret References

```rego
package pipeline

deny[msg] {
    step := input.pipeline.stages[_].stage.spec.execution.steps[_].step
    env := step.spec.envVariables[_]
    contains(lower(env.name), "password")
    not startswith(env.value, "<+secrets.")
    msg := sprintf("Environment variable '%s' appears to contain a password but doesn't use secret reference", [env.name])
}
```

---

## Harness Templates

### Overview

Templates enable reusable pipeline components at Step, Stage, and Pipeline levels.

### Template Types

| Type | Scope | Use Case |
|------|-------|----------|
| **Step** | Step | Reusable steps (build, test, deploy) |
| **Stage** | Stage | Complete stage definitions |
| **Pipeline** | Pipeline | Full pipeline templates |
| **StepGroup** | Step Group | Group of related steps |

### Step Template

```yaml
template:
  name: Build Docker Image
  identifier: build_docker_image
  versionLabel: "1.0.0"
  type: Step
  projectIdentifier: default
  orgIdentifier: default
  spec:
    type: BuildAndPushDockerRegistry
    spec:
      connectorRef: <+input>
      repo: <+input>
      tags:
        - <+input>
      dockerfile: <+input>.default("Dockerfile")
      context: <+input>.default(".")
      optimize: true
      caching: true
```

### Stage Template

```yaml
template:
  name: Standard Deployment
  identifier: standard_deployment
  versionLabel: "1.0.0"
  type: Stage
  spec:
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        serviceRef: <+input>
      environment:
        environmentRef: <+input>
        infrastructureDefinitions:
          - identifier: <+input>
      execution:
        steps:
          - step:
              name: Rollout Deployment
              identifier: rolloutDeployment
              type: K8sRollingDeploy
              timeout: 10m
              spec:
                skipDryRun: false
        rollbackSteps:
          - step:
              name: Rollback
              identifier: rollback
              type: K8sRollingRollback
              timeout: 10m
              spec: {}
```

### Pipeline Template

```yaml
template:
  name: Standard CI/CD Pipeline
  identifier: standard_cicd
  versionLabel: "1.0.0"
  type: Pipeline
  spec:
    stages:
      - stage:
          name: Build
          identifier: build
          template:
            templateRef: build_stage
            versionLabel: "1.0.0"
      - stage:
          name: Deploy to Dev
          identifier: deploy_dev
          template:
            templateRef: standard_deployment
            versionLabel: "1.0.0"
            templateInputs:
              type: Deployment
              spec:
                service:
                  serviceRef: <+input>
                environment:
                  environmentRef: development
```

### Using Templates

```yaml
pipeline:
  name: My Application Pipeline
  identifier: my_app_pipeline
  stages:
    - stage:
        name: Build
        identifier: build
        template:
          templateRef: build_docker_image
          versionLabel: "1.0.0"
          templateInputs:
            type: BuildAndPushDockerRegistry
            spec:
              connectorRef: docker_connector
              repo: myorg/myapp
              tags:
                - <+pipeline.sequenceId>
              dockerfile: Dockerfile
```

---

## Harness Secrets Management

### Secret Managers

| Type | Description | Use Case |
|------|-------------|----------|
| **Harness Built-in** | Encrypted with Google KMS | Default, simple setup |
| **HashiCorp Vault** | Enterprise secret management | Production, compliance |
| **AWS Secrets Manager** | AWS-native secrets | AWS workloads |
| **GCP Secret Manager** | GCP-native secrets | GCP workloads |
| **Azure Key Vault** | Azure-native secrets | Azure workloads |

### Vault Connector

```yaml
connector:
  name: HashiCorp Vault
  identifier: vault_connector
  type: Vault
  spec:
    vaultUrl: https://vault.company.com
    basePath: harness
    authToken: <+secrets.getValue("vault_token")>
    renewalIntervalMinutes: 60
    secretEngineManuallyConfigured: true
    secretEngineName: secret
    secretEngineVersion: 2
    delegateSelectors:
      - vault-delegate
```

### Secret Reference Patterns

```yaml
# Harness Secret Manager
value: <+secrets.getValue("my_secret")>

# Vault Secret
value: <+secrets.getValue("vault://secret/data/myapp#api_key")>

# AWS Secrets Manager
value: <+secrets.getValue("awsSecretsManager://my-secret")>

# GCP Secret Manager
value: <+secrets.getValue("gcpSecretManager://projects/my-project/secrets/my-secret/versions/latest")>

# Azure Key Vault
value: <+secrets.getValue("azureVault://my-vault/secrets/my-secret")>
```

### Dynamic Secrets

```yaml
# Use Vault dynamic secrets for database credentials
- step:
    name: Database Migration
    identifier: db_migration
    type: Run
    spec:
      command: |
        # Vault generates temporary credentials
        export DB_USER=<+secrets.getValue("vault://database/creds/my-role#username")>
        export DB_PASS=<+secrets.getValue("vault://database/creds/my-role#password")>
        flyway migrate
```

---

## Harness API Reference

### Authentication

```bash
# API Key Authentication
curl -X GET "https://app.harness.io/gateway/ng/api/..." \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json"

# Bearer Token (Service Account)
curl -X GET "https://app.harness.io/gateway/ng/api/..." \
  -H "Authorization: Bearer ${HARNESS_TOKEN}" \
  -H "Content-Type: application/json"
```

### Common Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| **Platform** | `/ng/api/` | Account, Org, Project, Users |
| **Pipeline** | `/pipeline/api/` | Pipelines, Executions |
| **CD** | `/ng/api/` | Services, Environments |
| **CI** | `/ci/api/` | Build info |
| **Code** | `/code/api/v1/` | Repositories, PRs |
| **FF** | `/cf/admin/` | Feature Flags |
| **STO** | `/sto/api/` | Security scans |
| **CCM** | `/ccm/api/` | Cost data |
| **Chaos** | `/chaos/api/` | Experiments |

### Pipeline Execution

```bash
# Trigger pipeline
curl -X POST "https://app.harness.io/pipeline/api/pipeline/execute/${PIPELINE_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "image_tag": "v1.2.3",
      "environment": "production"
    }
  }'

# Get execution status
curl -X GET "https://app.harness.io/pipeline/api/pipelines/execution/${EXECUTION_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"

# List executions
curl -X GET "https://app.harness.io/pipeline/api/pipelines/execution/summary?accountIdentifier=${ACCOUNT_ID}&orgIdentifier=${ORG_ID}&projectIdentifier=${PROJECT_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

### GraphQL API

```graphql
# Query pipeline executions
query {
  executions(
    filters: [
      { pipeline: { operator: EQUALS, values: ["my_pipeline"] } }
      { status: { operator: IN, values: [SUCCESS, FAILED] } }
    ]
    limit: 10
  ) {
    nodes {
      id
      status
      startedAt
      endedAt
      pipeline {
        name
      }
    }
  }
}
```

---

## Troubleshooting Guide

### Delegate Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Delegate not connecting | "No delegate available" | Check network, token, logs |
| Task timeout | Steps hang indefinitely | Increase resources, check delegate health |
| Version mismatch | Compatibility errors | Update delegate to latest |
| OOM errors | Delegate restarts | Increase memory limits |

```bash
# Check delegate logs
kubectl logs -n harness-delegate -l app=harness-delegate --tail=100

# Check delegate status
kubectl get pods -n harness-delegate

# Restart delegate
kubectl rollout restart deployment/harness-delegate -n harness-delegate
```

### Pipeline Failures

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_REQUEST` | YAML syntax error | Validate YAML structure |
| `DELEGATE_NOT_AVAILABLE` | No matching delegate | Check delegate selectors/tags |
| `CONNECTOR_NOT_FOUND` | Missing connector | Create or fix connector reference |
| `SECRET_NOT_FOUND` | Missing secret | Create secret or fix reference |
| `TIMEOUT` | Step exceeded timeout | Increase timeout or optimize step |

```bash
# Validate pipeline YAML
curl -X POST "https://app.harness.io/pipeline/api/pipelines/validate" \
  -H "x-api-key: ${HARNESS_API_KEY}" \
  -H "Content-Type: application/yaml" \
  --data-binary @pipeline.yaml
```

### Connector Issues

```bash
# Test connector
curl -X POST "https://app.harness.io/gateway/ng/api/connectors/testConnection/${CONNECTOR_ID}?accountIdentifier=${ACCOUNT_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"

# Get connector details
curl -X GET "https://app.harness.io/gateway/ng/api/connectors/${CONNECTOR_ID}?accountIdentifier=${ACCOUNT_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

### Debug Logging

```yaml
# Enable debug in pipeline
- step:
    name: Debug Step
    identifier: debug
    type: ShellScript
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            echo "=== Debug Info ==="
            echo "Pipeline: <+pipeline.name>"
            echo "Stage: <+stage.name>"
            echo "Service: <+service.name>"
            echo "Environment: <+env.name>"
            echo "Artifact: <+artifact.image>:<+artifact.tag>"
            env | sort
```

---

## Best Practices

### Pipeline Design

1. **Use Templates** for reusable components
2. **Implement Approval Gates** for production deployments
3. **Enable Rollback** strategies for all deployments
4. **Use Failure Strategies** to handle errors gracefully
5. **Implement Notifications** for pipeline events

### Security

1. **Store Secrets** in external secret managers (Vault, AWS SM)
2. **Use Service Accounts** for automation
3. **Implement RBAC** with least privilege principle
4. **Enable Audit Logs** for compliance
5. **Use OPA Policies** for governance enforcement

### Performance

1. **Use Caching** in CI pipelines
2. **Enable Test Intelligence** to reduce test time
3. **Parallelize** independent steps and stages
4. **Right-size Delegates** for workload
5. **Use Harness Cloud** for managed infrastructure

### Reliability

1. **Implement Canary Deployments** for risk reduction
2. **Define SLOs** with SRM
3. **Run Chaos Experiments** regularly
4. **Monitor Costs** with CCM
5. **Integrate Security Scanning** with STO

### Delegate Management

1. **Deploy Multiple Delegates** for high availability
2. **Use Delegate Profiles** for consistent configuration
3. **Tag Delegates** for workload isolation
4. **Monitor Delegate Health** with metrics
5. **Automate Delegate Updates** with immutable deployments

---

## Related Documentation

- [Harness Developer Hub](https://developer.harness.io/)
- [Harness CI Docs](https://developer.harness.io/docs/continuous-integration)
- [Harness CD Docs](https://developer.harness.io/docs/continuous-delivery)
- [Harness Code Docs](https://developer.harness.io/docs/code-repository)
- [Harness Feature Flags](https://developer.harness.io/docs/feature-flags)
- [Harness STO Docs](https://developer.harness.io/docs/security-testing-orchestration)
- [Harness CCM Docs](https://developer.harness.io/docs/cloud-cost-management)
- [Harness SRM Docs](https://developer.harness.io/docs/service-reliability-management)
- [Harness Chaos Engineering](https://developer.harness.io/docs/chaos-engineering)
- [Harness IaCM Docs](https://developer.harness.io/docs/infra-as-code-management)
- [Harness Platform Docs](https://developer.harness.io/docs/platform)
- [Harness API Reference](https://apidocs.harness.io/)
