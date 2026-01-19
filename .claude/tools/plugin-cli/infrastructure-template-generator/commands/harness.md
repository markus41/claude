---
name: itg:harness
description: Generate Harness CI/CD pipelines from analyzed build patterns
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: pipeline-name
    description: Name for the pipeline
    required: true
    type: string
flags:
  - name: type
    description: Pipeline type
    type: choice
    choices: [ci, cd, ci-cd, iacm]
    default: ci-cd
  - name: output
    description: Output directory
    type: string
    default: "./pipelines/harness"
  - name: environments
    description: Deployment environments
    type: string
    default: "dev,staging,prod"
  - name: include-triggers
    description: Include webhook triggers
    type: boolean
    default: true
  - name: include-approvals
    description: Include approval gates for production
    type: boolean
    default: true
  - name: connector-prefix
    description: Prefix for Harness connector references
    type: string
    default: "org"
presets:
  - name: ci-only
    description: CI pipeline only (build and test)
    flags:
      type: ci
      include-approvals: false
  - name: full-deployment
    description: Complete CI/CD with approvals
    flags:
      type: ci-cd
      include-triggers: true
      include-approvals: true
  - name: iacm
    description: Infrastructure deployment with IaCM
    flags:
      type: iacm
---

# Generate Harness CI/CD Pipeline

Generate complete Harness CI/CD pipelines from analyzed build patterns, including CI stages, CD stages, IaCM integration, triggers, and approval gates.

## Overview

The `itg:harness` command creates production-ready Harness pipeline YAML files based on project analysis. It supports:

- **CI Pipelines**: Build, test, scan, and publish artifacts
- **CD Pipelines**: Multi-environment deployment with approvals
- **CI/CD Combined**: End-to-end delivery pipeline
- **IaCM Pipelines**: Infrastructure-as-Code provisioning
- **Webhook Triggers**: Automated pipeline execution
- **Approval Gates**: Production deployment controls
- **Service/Environment**: Auto-generated service and environment definitions

## Pipeline Structure

### Base Pipeline YAML

```yaml
pipeline:
  name: <pipeline-name>
  identifier: <pipeline_id>
  projectIdentifier: <project>
  orgIdentifier: <org>
  tags:
    generated_by: infrastructure-template-generator
    version: "1.0"
  stages:
    - stage:
        name: Build
        identifier: build
        type: CI
        spec: {...}
    - stage:
        name: Deploy
        identifier: deploy
        type: Deployment
        spec: {...}
  properties:
    ci:
      codebase:
        connectorRef: <connector-prefix>.github_connector
        repoName: <detected-repo>
        build: <+input>
```

## CI Stage Examples

### Build Stage (Node.js)

```yaml
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
              name: Install Dependencies
              identifier: install_deps
              spec:
                shell: Sh
                command: |
                  npm ci

          - step:
              type: Run
              name: Run Tests
              identifier: run_tests
              spec:
                shell: Sh
                command: |
                  npm test -- --coverage
                reports:
                  type: JUnit
                  spec:
                    paths:
                      - "**/junit.xml"

          - step:
              type: Run
              name: Build Application
              identifier: build_app
              spec:
                shell: Sh
                command: |
                  npm run build

          - step:
              type: BuildAndPushDockerRegistry
              name: Build and Push Image
              identifier: build_push_image
              spec:
                connectorRef: <connector-prefix>.docker_hub
                repo: <+pipeline.variables.docker_repo>
                tags:
                  - <+pipeline.sequenceId>
                  - latest
                dockerfile: Dockerfile
                context: .
```

### Build Stage (Python)

```yaml
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
              name: Setup Python
              identifier: setup_python
              spec:
                shell: Sh
                command: |
                  python -m pip install --upgrade pip
                  pip install -r requirements.txt

          - step:
              type: Run
              name: Run Tests
              identifier: run_tests
              spec:
                shell: Sh
                command: |
                  pytest --junitxml=test-results/junit.xml --cov
                reports:
                  type: JUnit
                  spec:
                    paths:
                      - "test-results/junit.xml"

          - step:
              type: Run
              name: Security Scan
              identifier: security_scan
              spec:
                shell: Sh
                command: |
                  pip install safety
                  safety check --json > safety-report.json
```

### Build Stage (Java/Maven)

```yaml
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
              name: Maven Build
              identifier: maven_build
              spec:
                shell: Sh
                command: |
                  mvn clean package -DskipTests

          - step:
              type: Run
              name: Run Tests
              identifier: run_tests
              spec:
                shell: Sh
                command: |
                  mvn test
                reports:
                  type: JUnit
                  spec:
                    paths:
                      - "**/target/surefire-reports/*.xml"
```

### Build Stage with STO (Security Testing)

```yaml
- stage:
    name: Security Scan
    identifier: security_scan
    type: SecurityTests
    spec:
      cloneCodebase: false
      platform:
        os: Linux
        arch: Amd64
      runtime:
        type: Cloud
        spec: {}
      execution:
        steps:
          - step:
              type: Owasp
              name: OWASP Dependency Check
              identifier: owasp_scan
              spec:
                mode: orchestration
                config: default
                target:
                  name: <+pipeline.name>
                  type: repository
                  variant: <+codebase.branch>
                advanced:
                  log:
                    level: info
                  fail_on_severity: high
```

## CD Stage Examples

### Kubernetes Deployment

```yaml
- stage:
    name: Deploy to Dev
    identifier: deploy_dev
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        serviceRef: <service_id>
        serviceInputs:
          serviceDefinition:
            type: Kubernetes
            spec:
              artifacts:
                primary:
                  primaryArtifactRef: <+input>
                  sources:
                    - identifier: docker_image
                      type: DockerRegistry
                      spec:
                        tag: <+pipeline.sequenceId>
      environment:
        environmentRef: dev
        deployToAll: false
        infrastructureDefinitions:
          - identifier: dev_k8s_cluster
      execution:
        steps:
          - step:
              type: K8sRollingDeploy
              name: Rolling Deployment
              identifier: rolling_deploy
              spec:
                skipDryRun: false
                pruningEnabled: false
          - step:
              type: K8sRollingRollback
              name: Rollback on Failure
              identifier: rollback
              when:
                stageStatus: Failure
        rollbackSteps:
          - step:
              type: K8sRollingRollback
              name: Rollback
              identifier: rollback
```

### Multi-Environment Deployment with Approval

```yaml
- stage:
    name: Deploy to Staging
    identifier: deploy_staging
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        useFromStage:
          stage: deploy_dev
      environment:
        environmentRef: staging
        infrastructureDefinitions:
          - identifier: staging_k8s_cluster
      execution:
        steps:
          - step:
              type: K8sRollingDeploy
              name: Rolling Deployment
              identifier: rolling_deploy

- stage:
    name: Production Approval
    identifier: prod_approval
    type: Approval
    spec:
      execution:
        steps:
          - step:
              type: HarnessApproval
              name: Approve Production Deploy
              identifier: approve_prod
              spec:
                approvalMessage: Please approve deployment to production
                includePipelineExecutionHistory: true
                approvers:
                  userGroups:
                    - org._organization_all_users
                  minimumCount: 1
                approverInputs: []

- stage:
    name: Deploy to Production
    identifier: deploy_prod
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        useFromStage:
          stage: deploy_dev
      environment:
        environmentRef: prod
        infrastructureDefinitions:
          - identifier: prod_k8s_cluster
      execution:
        steps:
          - step:
              type: K8sRollingDeploy
              name: Rolling Deployment
              identifier: rolling_deploy
              spec:
                skipDryRun: false
          - step:
              type: K8sRollingRollback
              name: Rollback on Failure
              identifier: rollback
              when:
                stageStatus: Failure
```

### Blue-Green Deployment

```yaml
- stage:
    name: Blue-Green Deploy
    identifier: bluegreen_deploy
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        serviceRef: <service_id>
      environment:
        environmentRef: prod
        infrastructureDefinitions:
          - identifier: prod_k8s_cluster
      execution:
        steps:
          - step:
              type: K8sBlueGreenDeploy
              name: Blue Green Deployment
              identifier: bluegreen_deploy
              spec:
                skipDryRun: false
                pruningEnabled: false
          - step:
              type: ShellScript
              name: Smoke Tests
              identifier: smoke_tests
              spec:
                shell: Bash
                source:
                  type: Inline
                  spec:
                    script: |
                      # Run smoke tests against staging environment
                      curl -f https://staging.example.com/health || exit 1
          - step:
              type: K8sBGSwapServices
              name: Swap Services
              identifier: swap_services
              spec:
                skipDryRun: false
        rollbackSteps:
          - step:
              type: K8sBlueGreenRollback
              name: Rollback
              identifier: rollback
```

## IaCM Integration

### IaCM Provisioning Stage

```yaml
- stage:
    name: Provision Infrastructure
    identifier: provision_infra
    type: IACM
    spec:
      platform:
        os: Linux
        arch: Amd64
      runtime:
        type: Cloud
        spec: {}
      execution:
        steps:
          - step:
              type: IACMTerraformPlugin
              name: Terraform Plan
              identifier: terraform_plan
              spec:
                command: plan
                workspace: <+pipeline.variables.workspace>
                connectorRef: <connector-prefix>.github_connector

          - step:
              type: IACMApproval
              name: Approve Infrastructure Changes
              identifier: approve_infra
              spec:
                approvalMessage: Review Terraform plan and approve

          - step:
              type: IACMTerraformPlugin
              name: Terraform Apply
              identifier: terraform_apply
              spec:
                command: apply
                workspace: <+pipeline.variables.workspace>
```

### IaCM with Dynamic Provisioning

```yaml
- stage:
    name: Dynamic Infrastructure
    identifier: dynamic_infra
    type: IACM
    spec:
      execution:
        steps:
          - step:
              type: IACMTerraformPlugin
              name: Create Environment
              identifier: create_env
              spec:
                command: apply
                workspace: <+stage.variables.environment>
                variables:
                  region: us-west-2
                  instance_count: 3
                outputs:
                  - name: cluster_endpoint
                  - name: cluster_name

- stage:
    name: Deploy to Dynamic Infra
    identifier: deploy_dynamic
    type: Deployment
    spec:
      service:
        serviceRef: <service_id>
      environment:
        environmentRef: <+pipeline.stages.dynamic_infra.output.cluster_name>
      execution:
        steps:
          - step:
              type: K8sRollingDeploy
              name: Deploy
              identifier: deploy
```

## Trigger Configuration

### GitHub Webhook Trigger

```yaml
trigger:
  name: GitHub Push Trigger
  identifier: github_push_trigger
  enabled: true
  orgIdentifier: <org>
  projectIdentifier: <project>
  pipelineIdentifier: <pipeline_id>
  source:
    type: Webhook
    spec:
      type: Github
      spec:
        type: Push
        spec:
          connectorRef: <connector-prefix>.github_connector
          autoAbortPreviousExecutions: true
          payloadConditions:
            - key: targetBranch
              operator: Equals
              value: main
          headerConditions: []
          jexlCondition: <+trigger.payload.repository.full_name> == "<org>/<repo>"
  inputYaml: |
    pipeline:
      identifier: <pipeline_id>
      properties:
        ci:
          codebase:
            build:
              type: branch
              spec:
                branch: <+trigger.branch>
```

### Pull Request Trigger

```yaml
trigger:
  name: GitHub PR Trigger
  identifier: github_pr_trigger
  enabled: true
  orgIdentifier: <org>
  projectIdentifier: <project>
  pipelineIdentifier: <pipeline_id>
  source:
    type: Webhook
    spec:
      type: Github
      spec:
        type: PullRequest
        spec:
          connectorRef: <connector-prefix>.github_connector
          autoAbortPreviousExecutions: true
          payloadConditions:
            - key: targetBranch
              operator: Equals
              value: main
            - key: sourceBranch
              operator: NotEquals
              value: main
          actions:
            - Open
            - Reopen
            - Synchronize
```

### Scheduled Trigger

```yaml
trigger:
  name: Nightly Build
  identifier: nightly_build
  enabled: true
  orgIdentifier: <org>
  projectIdentifier: <project>
  pipelineIdentifier: <pipeline_id>
  source:
    type: Scheduled
    spec:
      type: Cron
      spec:
        expression: 0 2 * * *  # 2 AM daily
  inputYaml: |
    pipeline:
      identifier: <pipeline_id>
      properties:
        ci:
          codebase:
            build:
              type: branch
              spec:
                branch: main
```

## Approval Gate Patterns

### Manual Approval with User Groups

```yaml
- step:
    type: HarnessApproval
    name: Production Deployment Approval
    identifier: prod_approval
    spec:
      approvalMessage: |
        Please review the following before approving:
        - Service: <+service.name>
        - Environment: <+env.name>
        - Artifact: <+artifact.tag>
        - Previous execution: <+pipeline.executionUrl>
      includePipelineExecutionHistory: true
      approvers:
        userGroups:
          - org.platform_team
          - org.security_team
        minimumCount: 2
      approverInputs:
        - name: deployment_notes
          defaultValue: ""
      isAutoRejectEnabled: true
      approvalRejectionCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: false
          conditions:
            - key: deployment_notes
              operator: equals
              value: ""
```

### Jira Approval

```yaml
- step:
    type: JiraApproval
    name: Jira Change Ticket Approval
    identifier: jira_approval
    spec:
      connectorRef: <connector-prefix>.jira_connector
      projectKey: <+pipeline.variables.jira_project>
      issueKey: <+pipeline.variables.change_ticket>
      approvalCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: false
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

### ServiceNow Approval

```yaml
- step:
    type: ServiceNowApproval
    name: ServiceNow Change Request
    identifier: snow_approval
    spec:
      connectorRef: <connector-prefix>.servicenow_connector
      ticketType: change_request
      ticketNumber: <+pipeline.variables.change_request_id>
      approvalCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: false
          conditions:
            - key: state
              operator: equals
              value: authorized
      rejectionCriteria:
        type: KeyValues
        spec:
          matchAnyCondition: true
          conditions:
            - key: state
              operator: equals
              value: closed_rejected
```

### Conditional Approval (Production Only)

```yaml
- stage:
    name: Conditional Approval
    identifier: conditional_approval
    type: Approval
    when:
      condition: <+stage.variables.environment> == "prod"
      stageStatus: Success
    spec:
      execution:
        steps:
          - step:
              type: HarnessApproval
              name: Production Gate
              identifier: prod_gate
              spec:
                approvalMessage: Production deployment requires approval
                approvers:
                  userGroups:
                    - org.prod_approvers
                  minimumCount: 1
```

## Pipeline Variables

```yaml
pipeline:
  variables:
    - name: docker_repo
      type: String
      description: Docker repository
      required: true
      value: <+input>

    - name: workspace
      type: String
      description: Terraform workspace
      required: true
      value: <+input>.default(default)

    - name: environment
      type: String
      description: Deployment environment
      required: true
      value: <+input>.allowedValues(dev,staging,prod)

    - name: enable_rollback
      type: String
      description: Enable automatic rollback
      required: false
      value: "true"

    - name: notification_channel
      type: String
      description: Slack channel for notifications
      required: false
      value: "#deployments"
```

## Service Definition

```yaml
service:
  name: <service-name>
  identifier: <service_id>
  serviceDefinition:
    type: Kubernetes
    spec:
      manifests:
        - manifest:
            identifier: k8s_manifests
            type: K8sManifest
            spec:
              store:
                type: Github
                spec:
                  connectorRef: <connector-prefix>.github_connector
                  gitFetchType: Branch
                  paths:
                    - k8s/
                  branch: main
              skipResourceVersioning: false
      artifacts:
        primary:
          primaryArtifactRef: docker_image
          sources:
            - identifier: docker_image
              type: DockerRegistry
              spec:
                connectorRef: <connector-prefix>.docker_hub
                imagePath: <org>/<service-name>
                tag: <+input>
```

## Environment Definition

```yaml
environment:
  name: <env-name>
  identifier: <env_id>
  type: PreProduction  # or Production
  tags:
    managed_by: infrastructure-template-generator
  variables:
    - name: namespace
      type: String
      value: <env-name>
      description: Kubernetes namespace
    - name: replicas
      type: String
      value: "3"
      description: Number of replicas
  overrides:
    manifests:
      - manifest:
          identifier: values_override
          type: Values
          spec:
            store:
              type: Github
              spec:
                connectorRef: <connector-prefix>.github_connector
                gitFetchType: Branch
                paths:
                  - k8s/values-<env-name>.yaml
                branch: main
```

## Usage Examples

### Generate CI-only Pipeline

```bash
itg:harness my-build-pipeline --type ci --output ./pipelines
```

**Output:**
```
✓ Analyzing project structure...
✓ Detected: Node.js with npm
✓ Generating CI pipeline...
✓ Created: ./pipelines/harness/my-build-pipeline.yaml
✓ Created: ./pipelines/harness/github-push-trigger.yaml
```

### Generate Full CI/CD Pipeline

```bash
itg:harness my-app-pipeline \
  --type ci-cd \
  --environments "dev,staging,prod" \
  --include-approvals \
  --connector-prefix org
```

**Output:**
```
✓ Analyzing project structure...
✓ Detected: Python with pytest
✓ Generating CI/CD pipeline...
✓ Created: ./pipelines/harness/my-app-pipeline.yaml
✓ Created: ./pipelines/harness/my-app-service.yaml
✓ Created: ./pipelines/harness/environments/dev.yaml
✓ Created: ./pipelines/harness/environments/staging.yaml
✓ Created: ./pipelines/harness/environments/prod.yaml
✓ Created: ./pipelines/harness/triggers/github-webhook.yaml
```

### Generate IaCM Pipeline

```bash
itg:harness infra-pipeline \
  --type iacm \
  --output ./pipelines/infrastructure \
  --include-approvals
```

**Output:**
```
✓ Analyzing Terraform configuration...
✓ Detected: AWS provider with EKS module
✓ Generating IaCM pipeline...
✓ Created: ./pipelines/infrastructure/infra-pipeline.yaml
✓ Created: ./pipelines/infrastructure/approval-stage.yaml
```

### Use Preset

```bash
itg:harness production-pipeline --preset full-deployment
```

**Output:**
```
✓ Using preset: full-deployment
✓ Pipeline type: ci-cd
✓ Triggers: enabled
✓ Approvals: enabled
✓ Generated complete CI/CD pipeline with production gates
```

### Custom Connector Prefix

```bash
itg:harness microservice-pipeline \
  --connector-prefix account \
  --environments "qa,uat,prod"
```

**Output:**
```
✓ Using account-level connectors
✓ Configured connectors:
  - account.github_connector
  - account.docker_hub
  - account.k8s_cluster
```

## Generated File Structure

```
pipelines/harness/
├── <pipeline-name>.yaml              # Main pipeline definition
├── <service-name>-service.yaml       # Service definition
├── triggers/
│   ├── github-push-trigger.yaml     # Push trigger
│   └── github-pr-trigger.yaml       # PR trigger
├── environments/
│   ├── dev.yaml                     # Dev environment
│   ├── staging.yaml                 # Staging environment
│   └── prod.yaml                    # Production environment
└── README.md                        # Deployment instructions
```

## Integration with Other Commands

### Complete Workflow

```bash
# 1. Analyze project
itg:analyze

# 2. Generate Dockerfile
itg:docker my-app

# 3. Generate Kubernetes manifests
itg:k8s my-app --environments "dev,staging,prod"

# 4. Generate Harness pipeline
itg:harness my-app-pipeline --type ci-cd --include-approvals

# 5. Deploy using Harness API
itg:deploy harness --pipeline my-app-pipeline --environment dev
```

### Chain with Terraform

```bash
# Generate infrastructure
itg:terraform aws-infrastructure

# Generate IaCM pipeline for infrastructure
itg:harness infra-pipeline --type iacm

# Generate application pipeline that depends on infrastructure
itg:harness app-pipeline --type ci-cd
```

## Advanced Features

### Matrix Strategy for Multiple Environments

```yaml
- stage:
    name: Deploy to All Environments
    identifier: deploy_all
    type: Deployment
    strategy:
      matrix:
        environment:
          - dev
          - staging
          - prod
        exclude:
          - environment: prod
            when:
              condition: <+trigger.type> == "PR"
    spec:
      deploymentType: Kubernetes
      service:
        serviceRef: <service_id>
      environment:
        environmentRef: <+matrix.environment>
```

### Parallel Stages

```yaml
- parallel:
    - stage:
        name: Unit Tests
        identifier: unit_tests
        type: CI
        spec: {...}
    - stage:
        name: Integration Tests
        identifier: integration_tests
        type: CI
        spec: {...}
    - stage:
        name: Security Scan
        identifier: security_scan
        type: SecurityTests
        spec: {...}
```

### Failure Strategy

```yaml
- stage:
    name: Deploy
    identifier: deploy
    type: Deployment
    spec: {...}
    failureStrategies:
      - onFailure:
          errors:
            - AllErrors
          action:
            type: StageRollback
      - onFailure:
          errors:
            - Timeout
          action:
            type: Retry
            spec:
              retryCount: 2
              retryIntervals:
                - 30s
                - 1m
```

## Best Practices

1. **Use Runtime Inputs**: Define variables with `<+input>` for flexibility
2. **Enable Auto-Abort**: Cancel previous executions on new commits
3. **Add Smoke Tests**: Verify deployments before swapping traffic
4. **Use Rollback Steps**: Always define rollback strategies
5. **Tag Resources**: Add tags for cost tracking and compliance
6. **Scope Connectors**: Use org/account connectors for shared resources
7. **Enable Notifications**: Configure Slack/email for deployment status
8. **Store Secrets**: Use Harness Secret Manager for sensitive data

## Troubleshooting

### Pipeline Fails to Execute

- Check connector configurations and test connections
- Verify service account permissions
- Review pipeline execution logs in Harness UI

### Deployment Hangs

- Check infrastructure availability
- Review Kubernetes cluster health
- Verify delegate connectivity

### Approval Not Working

- Confirm user groups exist
- Check approval criteria conditions
- Review RBAC permissions

## Related Commands

- `itg:analyze` - Analyze project structure
- `itg:docker` - Generate Dockerfile
- `itg:k8s` - Generate Kubernetes manifests
- `itg:terraform` - Generate Terraform code
- `itg:deploy` - Deploy using generated templates
- `itg:validate` - Validate generated pipelines

## API Integration

The generated pipeline can be deployed via Harness API:

```bash
curl -X POST "https://app.harness.io/pipeline/api/pipelines/v2" \
  -H "x-api-key: $HARNESS_API_KEY" \
  -H "Content-Type: application/yaml" \
  --data-binary @pipelines/harness/my-app-pipeline.yaml
```

## See Also

- Harness Platform Skill: `skills/harness-platform/SKILL.md`
- Harness API Reference: `docs/harness/API.md`
- Pipeline Best Practices: `docs/harness/PIPELINES.md`
- IaCM Integration: `docs/harness/IACM.md`
