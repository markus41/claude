---
description: Manage CI/CD workflows with GitHub Actions and Harness pipelines - create, validate, trigger, and monitor workflows
arguments:
  - name: action
    description: "Action: create, validate, trigger, status, or list"
    required: true
  - name: platform
    description: "Platform: github or harness (default: github)"
    required: false
  - name: workflow
    description: "Workflow name or ID"
    required: false
---

# Workflow Command

Manage CI/CD workflows across GitHub Actions and Harness pipelines with comprehensive tooling for creation, validation, and monitoring.

## Usage

```bash
/workflow <action> [platform] [workflow]
```

## Examples

```bash
# List all workflows
/workflow list

# Create new GitHub Actions workflow
/workflow create github ci-cd

# Validate workflow syntax
/workflow validate github

# Trigger a workflow
/workflow trigger github deploy

# Check workflow status
/workflow status github

# Create Harness pipeline
/workflow create harness production-deploy
```

## Execution Flow

### 1. List Workflows

#### GitHub Actions
```bash
# List all workflows
gh workflow list

# List with status
gh workflow list --all

# Get workflow details
gh workflow view ${WORKFLOW_NAME}
```

#### Harness Pipelines
```bash
# List pipelines via API
curl -s -X GET \
  "https://app.harness.io/pipeline/api/pipelines?accountIdentifier=${ACCOUNT_ID}&orgIdentifier=${ORG_ID}&projectIdentifier=${PROJECT_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

### 2. Create Workflows

#### GitHub Actions - CI/CD Template

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Type check
        run: npm run type-check

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        test-type: [unit, integration]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.test-type == 'unit'

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: [test, e2e]
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          helm upgrade --install ${{ github.event.repository.name }} \
            ./deployment/helm \
            --namespace staging \
            --set image.tag=${{ github.sha }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          helm upgrade --install ${{ github.event.repository.name }} \
            ./deployment/helm \
            --namespace production \
            --values ./deployment/helm/values-prod.yaml \
            --set image.tag=${{ github.sha }}
```

#### Harness Pipeline Template

```yaml
# harness/pipeline.yaml
pipeline:
  name: Production Pipeline
  identifier: production_pipeline
  projectIdentifier: ${PROJECT_ID}
  orgIdentifier: ${ORG_ID}
  tags: {}

  stages:
    - stage:
        name: Build
        identifier: build
        type: CI
        spec:
          cloneCodebase: true
          platform:
            os: Linux
            arch: Amd64
          runtime:
            type: Cloud
            spec: {}
          execution:
            steps:
              - step:
                  type: Run
                  name: Install & Test
                  identifier: install_test
                  spec:
                    shell: Bash
                    command: |
                      npm ci
                      npm run lint
                      npm run test

              - step:
                  type: BuildAndPushDockerRegistry
                  name: Build Image
                  identifier: build_image
                  spec:
                    connectorRef: docker_connector
                    repo: ${DOCKER_REGISTRY}/${PROJECT_NAME}
                    tags:
                      - <+pipeline.sequenceId>
                      - latest
                    dockerfile: Dockerfile

    - stage:
        name: Deploy Staging
        identifier: deploy_staging
        type: Deployment
        spec:
          deploymentType: Kubernetes
          service:
            serviceRef: app_service
          environment:
            environmentRef: staging
            deployToAll: false
            infrastructureDefinitions:
              - identifier: staging_k8s
          execution:
            steps:
              - step:
                  type: K8sRollingDeploy
                  name: Rolling Deploy
                  identifier: rolling_deploy
                  spec:
                    skipDryRun: false

    - stage:
        name: Approval
        identifier: approval
        type: Approval
        spec:
          execution:
            steps:
              - step:
                  type: HarnessApproval
                  name: Production Approval
                  identifier: prod_approval
                  spec:
                    approvalMessage: Approve deployment to production?
                    includePipelineExecutionHistory: true
                    approvers:
                      userGroups:
                        - engineering_leads
                      minimumCount: 1
                    approverInputs: []

    - stage:
        name: Deploy Production
        identifier: deploy_production
        type: Deployment
        spec:
          deploymentType: Kubernetes
          service:
            serviceRef: app_service
          environment:
            environmentRef: production
            infrastructureDefinitions:
              - identifier: production_k8s
          execution:
            steps:
              - step:
                  type: K8sBlueGreenDeploy
                  name: Blue Green Deploy
                  identifier: bg_deploy
                  spec:
                    skipDryRun: false
            rollbackSteps:
              - step:
                  type: K8sBlueGreenRollback
                  name: Rollback
                  identifier: rollback
```

### 3. Validate Workflows

#### GitHub Actions
```bash
# Validate syntax with actionlint
actionlint .github/workflows/*.yml

# Validate with GitHub CLI
gh workflow view ${WORKFLOW_NAME} --yaml

# Dry run (when supported)
act -n
```

#### Harness
```bash
# Validate pipeline YAML
harness pipeline validate \
  --org ${HARNESS_ORG} \
  --project ${HARNESS_PROJECT} \
  --file harness/pipeline.yaml
```

### 4. Trigger Workflows

#### GitHub Actions
```bash
# Trigger workflow dispatch
gh workflow run ${WORKFLOW_NAME} \
  --ref ${BRANCH} \
  -f environment=staging

# Trigger with inputs
gh workflow run deploy.yml \
  -f environment=production \
  -f version=v1.2.3
```

#### Harness
```bash
# Trigger pipeline execution
harness pipeline execute \
  --org ${HARNESS_ORG} \
  --project ${HARNESS_PROJECT} \
  --pipeline ${PIPELINE_ID} \
  --inputSet environment=staging
```

### 5. Check Workflow Status

#### GitHub Actions
```bash
# List recent runs
gh run list --workflow=${WORKFLOW_NAME}

# View specific run
gh run view ${RUN_ID}

# Watch run in progress
gh run watch ${RUN_ID}

# View logs
gh run view ${RUN_ID} --log
```

#### Harness
```bash
# Get execution status
curl -s -X GET \
  "https://app.harness.io/pipeline/api/pipelines/execution/${EXECUTION_ID}?accountIdentifier=${ACCOUNT_ID}" \
  -H "x-api-key: ${HARNESS_API_KEY}"
```

## Workflow Templates

### PR Validation
```yaml
name: PR Validation
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Scheduled Jobs
```yaml
name: Scheduled Maintenance
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup old artifacts
        run: ./scripts/cleanup.sh
```

### Release Workflow
```yaml
name: Release
on:
  release:
    types: [published]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                   WORKFLOW STATUS                             ║
╠══════════════════════════════════════════════════════════════╣
║ Platform: GitHub Actions                                      ║
║ Repository: org/repo                                          ║
╠══════════════════════════════════════════════════════════════╣
║ RECENT RUNS                                                   ║
║                                                               ║
║ #1234  CI/CD Pipeline    ✅ success   main    2m ago         ║
║ #1233  CI/CD Pipeline    ✅ success   develop 15m ago        ║
║ #1232  PR Validation     ✅ success   PR #45  1h ago         ║
║ #1231  CI/CD Pipeline    ❌ failure   main    2h ago         ║
║ #1230  Scheduled         ✅ success   main    6h ago         ║
╠══════════════════════════════════════════════════════════════╣
║ WORKFLOW HEALTH                                               ║
║   Success Rate (7d): 94.2%                                   ║
║   Avg Duration: 4m 32s                                        ║
║   Failures: 3 in last 7 days                                 ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub authentication | For GitHub |
| `HARNESS_API_KEY` | Harness API key | For Harness |
| `HARNESS_ORG` | Harness organization ID | For Harness |
| `HARNESS_PROJECT` | Harness project ID | For Harness |

## Related Commands

- `/deploy` - Deploy applications
- `/test` - Run test suites
- `/status` - View team dashboard
