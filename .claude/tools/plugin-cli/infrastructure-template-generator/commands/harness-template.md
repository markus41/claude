---
name: itg:harness-template
description: Generate reusable Harness Templates for standardization across projects and organizations
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: template-name
    description: Name for the Harness template
    required: true
    type: string
flags:
  - name: type
    description: Template type to generate
    type: choice
    choices: [stage, step, pipeline, stepgroup]
    default: stage
  - name: scope
    description: Template scope level
    type: choice
    choices: [project, org, account]
    default: org
  - name: category
    description: Template category/use case
    type: choice
    choices: [build, deploy, security, approval, notification, terraform, kubernetes, custom]
    default: deploy
  - name: output
    description: Output directory
    type: string
    default: "./templates/harness"
  - name: version
    description: Initial version label
    type: string
    default: "1.0.0"
  - name: include-inputs
    description: Include runtime input definitions
    type: boolean
    default: true
  - name: include-outputs
    description: Include output variable definitions
    type: boolean
    default: false
presets:
  - name: k8s-deploy
    description: Kubernetes deployment stage template
    flags:
      type: stage
      category: kubernetes
  - name: docker-build
    description: Docker build and push step template
    flags:
      type: step
      category: build
  - name: terraform-apply
    description: Terraform apply stage template
    flags:
      type: stage
      category: terraform
  - name: security-scan
    description: Security scanning step template
    flags:
      type: step
      category: security
  - name: approval-gate
    description: Approval workflow stepgroup template
    flags:
      type: stepgroup
      category: approval
  - name: full-cicd
    description: Complete CI/CD pipeline template
    flags:
      type: pipeline
      category: deploy
---

# Harness Template Generator

Generate production-ready, reusable Harness Templates that standardize deployment patterns across your organization. Templates enable teams to maintain consistency, reduce errors, and accelerate delivery by codifying best practices into reusable components.

## Command Description

The `itg:harness-template` command creates Harness Template definitions in YAML format, complete with runtime inputs, validation, versioning, and documentation. Templates serve as building blocks that teams can instantiate in their pipelines while maintaining centralized control over the underlying configuration.

### Business Value

- **Standardization** - Enforce organizational best practices across all pipelines
- **Governance** - Centrally manage and version critical deployment patterns
- **Velocity** - Teams reuse proven patterns instead of rebuilding from scratch
- **Safety** - Reduce configuration errors through validated, tested templates
- **Compliance** - Embed security and compliance requirements into reusable components

## Template Types Explained

### Stage Templates

**Purpose:** Define complete deployment stages with multiple steps, infrastructure requirements, and execution strategies.

**When to Use:**
- Kubernetes deployments with manifests, secrets, and validation
- Terraform workflows with plan, approval, and apply stages
- Multi-step security scanning with SAST, DAST, and SCA
- Complete deployment workflows for specific technologies

**Benefits:**
- Encapsulate complex multi-step workflows
- Define infrastructure requirements once
- Standardize deployment strategies across services
- Include failure strategies and rollback logic

### Step Templates

**Purpose:** Define individual execution steps that perform specific tasks.

**When to Use:**
- Docker image build and push operations
- Security scanning with specific tools
- Custom script execution patterns
- Integration with external systems

**Benefits:**
- Fine-grained reusability
- Easy to compose into larger workflows
- Version individual operations independently
- Simple to test and validate

### Pipeline Templates

**Purpose:** Define complete end-to-end pipelines with multiple stages.

**When to Use:**
- Standard CI/CD workflows for microservices
- Release management pipelines
- Environment promotion workflows
- Compliance-required deployment patterns

**Benefits:**
- Complete workflow standardization
- Enforce gate checks and approvals
- Standardize entire deployment lifecycle
- Reduce pipeline creation time from hours to minutes

### StepGroup Templates

**Purpose:** Group related steps that should be executed together as a unit.

**When to Use:**
- Multi-step approval workflows
- Sequential validation checks
- Related deployment operations
- Conditional execution groups

**Benefits:**
- Logical grouping of related operations
- Conditional execution of multiple steps
- Shared context across grouped steps
- Simplified pipeline visualization

## Workflow Steps

When you run this command, the following occurs:

1. **Template Analysis** - Determines optimal structure based on type and category
2. **Input Definition** - Generates runtime input specifications with validation
3. **Content Generation** - Creates template YAML with best practices
4. **Versioning Setup** - Initializes version tracking and changelog
5. **Documentation** - Generates usage guide and examples
6. **Output Organization** - Structures files by scope and category
7. **Validation** - Checks YAML syntax and Harness schema compliance

## Generated Template Structure

### Directory Layout

```
templates/harness/
├── account/                    # Account-level templates
│   ├── pipelines/
│   │   └── enterprise-cicd-v1.0.0.yaml
│   └── stages/
│       └── security-gate-v1.0.0.yaml
├── org/                        # Organization-level templates
│   ├── stages/
│   │   ├── k8s-deployment-v1.0.0.yaml
│   │   └── terraform-apply-v1.0.0.yaml
│   ├── steps/
│   │   ├── docker-build-v1.0.0.yaml
│   │   └── security-scan-v1.0.0.yaml
│   └── stepgroups/
│       └── approval-workflow-v1.0.0.yaml
├── project/                    # Project-level templates
│   └── stages/
│       └── custom-deploy-v1.0.0.yaml
└── README.md                   # Template library documentation
```

### File Naming Convention

```
{template-name}-v{version}.yaml
```

Examples:
- `k8s-deployment-v1.0.0.yaml`
- `docker-build-v2.1.0.yaml`
- `microservice-cicd-v1.5.2.yaml`

## Runtime Input Patterns

Harness templates support sophisticated runtime input patterns for flexibility:

### Basic Input

```yaml
# Simple runtime input
spec:
  image: <+input>
```

User must provide value at pipeline execution.

### Input with Default Value

```yaml
# Runtime input with fallback
spec:
  replicas: <+input>.default(3)
```

Defaults to 3 if not provided.

### Input with Allowed Values

```yaml
# Constrained input choices
spec:
  environment: <+input>.allowedValues(dev,staging,prod)
```

User must select from dropdown.

### Execution-Time Input

```yaml
# Prompt during pipeline execution
spec:
  approvers: <+input>.executionInput()
```

Prompts user when step executes, not at pipeline start.

### Input with Validation Regex

```yaml
# Pattern validation
spec:
  version: <+input>.regex(^v[0-9]+\.[0-9]+\.[0-9]+$)
```

Validates semantic version format.

### Complex Input Objects

```yaml
# Structured input
spec:
  deployment:
    strategy: <+input>.allowedValues(Rolling,Canary,BlueGreen)
    replicas: <+input>.default(3)
    namespace: <+input>
    timeout: <+input>.default(10m)
```

Multiple related inputs grouped together.

## Usage Examples

### Kubernetes Deployment Stage

```bash
# Generate Kubernetes deployment stage template
/itg:harness-template k8s-deploy-stage --preset k8s-deploy

# With custom scope and inputs
/itg:harness-template k8s-deploy-stage \
  --type stage \
  --category kubernetes \
  --scope org \
  --include-inputs true \
  --include-outputs true \
  --version 1.0.0
```

### Docker Build Step

```bash
# Generate Docker build step template
/itg:harness-template docker-build-step --preset docker-build

# With custom configuration
/itg:harness-template docker-build-step \
  --type step \
  --category build \
  --scope project \
  --output ./templates/custom
```

### Terraform Apply Stage

```bash
# Generate Terraform workflow stage
/itg:harness-template terraform-apply-stage --preset terraform-apply

# Account-level template for enterprise use
/itg:harness-template terraform-apply-stage \
  --type stage \
  --category terraform \
  --scope account \
  --version 2.0.0
```

### Security Scanning Step

```bash
# Generate security scan step
/itg:harness-template security-scan-step --preset security-scan

# With outputs for downstream stages
/itg:harness-template security-scan-step \
  --type step \
  --category security \
  --include-outputs true
```

### Approval Workflow StepGroup

```bash
# Generate approval workflow
/itg:harness-template approval-gate --preset approval-gate

# Multi-tier approval process
/itg:harness-template multi-tier-approval \
  --type stepgroup \
  --category approval \
  --scope org
```

### Complete CI/CD Pipeline

```bash
# Generate full pipeline template
/itg:harness-template microservice-cicd --preset full-cicd

# Enterprise pipeline with all gates
/itg:harness-template microservice-cicd \
  --type pipeline \
  --category deploy \
  --scope account \
  --include-inputs true \
  --include-outputs true \
  --version 1.0.0
```

### Custom Template

```bash
# Generate custom notification template
/itg:harness-template slack-notification \
  --type step \
  --category notification \
  --scope org

# Custom deployment strategy
/itg:harness-template canary-deploy \
  --type stage \
  --category custom \
  --scope project
```

## Complete YAML Examples

### Stage Template: Kubernetes Deployment

```yaml
# File: templates/harness/org/stages/k8s-deployment-v1.0.0.yaml
template:
  name: Kubernetes Deployment Stage
  identifier: k8s_deployment_stage
  versionLabel: 1.0.0
  type: Stage
  projectIdentifier: <+input>
  orgIdentifier: <+input>
  tags:
    category: kubernetes
    platform: harness
  spec:
    type: Deployment
    spec:
      deploymentType: Kubernetes
      service:
        serviceRef: <+input>
        serviceInputs: <+input>
      environment:
        environmentRef: <+input>
        deployToAll: false
        infrastructureDefinitions: <+input>
      execution:
        steps:
          - step:
              type: K8sRollingDeploy
              name: Rolling Deployment
              identifier: rollingDeployment
              spec:
                skipDryRun: false
                pruningEnabled: false
              timeout: <+input>.default(10m)
          - step:
              type: K8sApply
              name: Apply Manifests
              identifier: applyManifests
              spec:
                filePaths: <+input>
                skipDryRun: false
                skipSteadyStateCheck: false
              timeout: <+input>.default(10m)
          - step:
              type: K8sScale
              name: Scale Deployment
              identifier: scaleDeployment
              spec:
                workload: <+input>
                instanceSelection:
                  type: Count
                  spec:
                    count: <+input>.default(3)
              timeout: <+input>.default(5m)
        rollbackSteps:
          - step:
              type: K8sRollingRollback
              name: Rollback Deployment
              identifier: rollbackDeployment
              spec:
                pruningEnabled: false
              timeout: <+input>.default(10m)
    failureStrategies:
      - onFailure:
          errors:
            - AllErrors
          action:
            type: StageRollback
    when:
      pipelineStatus: Success
```

### Step Template: Docker Build and Push

```yaml
# File: templates/harness/org/steps/docker-build-v1.0.0.yaml
template:
  name: Docker Build and Push
  identifier: docker_build_push
  versionLabel: 1.0.0
  type: Step
  projectIdentifier: <+input>
  orgIdentifier: <+input>
  tags:
    category: build
    technology: docker
  spec:
    type: BuildAndPushDockerRegistry
    spec:
      connectorRef: <+input>
      repo: <+input>
      tags:
        - <+input>.default(latest)
        - <+pipeline.sequenceId>
      dockerfile: <+input>.default(Dockerfile)
      context: <+input>.default(.)
      labels:
        app: <+pipeline.name>
        commit: <+codebase.commitSha>
        branch: <+codebase.branch>
      buildArgs:
        BUILD_DATE: <+pipeline.startTs>
        VERSION: <+input>
      optimize: true
      target: <+input>.default(production)
      remoteCacheRepo: <+input>.default(<+repo>-cache)
    timeout: <+input>.default(10m)
    failureStrategies:
      - onFailure:
          errors:
            - AllErrors
          action:
            type: Retry
            spec:
              retryCount: 2
              retryIntervals:
                - 10s
              onRetryFailure:
                action:
                  type: MarkAsFailure
    when:
      stageStatus: Success
      condition: <+codebase.branch> == "main" || <+codebase.branch> startsWith "release/"
```

### Pipeline Template: Complete CI/CD

```yaml
# File: templates/harness/account/pipelines/microservice-cicd-v1.0.0.yaml
template:
  name: Microservice CI/CD Pipeline
  identifier: microservice_cicd_pipeline
  versionLabel: 1.0.0
  type: Pipeline
  projectIdentifier: <+input>
  orgIdentifier: <+input>
  tags:
    category: cicd
    platform: harness
    template: microservice
  spec:
    stages:
      # BUILD STAGE
      - stage:
          name: Build and Test
          identifier: build_test
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
                      shell: Bash
                      command: <+input>.default(npm install)
                - step:
                    type: Run
                    name: Run Tests
                    identifier: run_tests
                    spec:
                      shell: Bash
                      command: <+input>.default(npm test)
                      reports:
                        type: JUnit
                        spec:
                          paths:
                            - "**/*.xml"
                - step:
                    type: Run
                    name: Build Application
                    identifier: build_app
                    spec:
                      shell: Bash
                      command: <+input>.default(npm run build)
                - step:
                    type: BuildAndPushDockerRegistry
                    name: Build and Push Image
                    identifier: build_push_image
                    spec:
                      connectorRef: <+input>
                      repo: <+input>
                      tags:
                        - <+pipeline.sequenceId>
                        - latest

      # SECURITY STAGE
      - stage:
          name: Security Scanning
          identifier: security_scan
          type: SecurityTests
          spec:
            cloneCodebase: false
            infrastructure:
              type: KubernetesDirect
              spec:
                connectorRef: <+input>
                namespace: <+input>.default(harness-delegate)
            execution:
              steps:
                - step:
                    type: AquaTrivy
                    name: Container Scan
                    identifier: container_scan
                    spec:
                      mode: orchestration
                      config: default
                      target:
                        type: container
                        detection: auto
                      advanced:
                        log:
                          level: info
                      resources:
                        limits:
                          memory: 2Gi
                - step:
                    type: Owasp
                    name: Dependency Check
                    identifier: dependency_check
                    spec:
                      mode: orchestration
                      config: default
                      target:
                        type: repository
                        detection: auto
          when:
            pipelineStatus: Success

      # DEPLOYMENT STAGES
      - stage:
          name: Deploy to Dev
          identifier: deploy_dev
          type: Deployment
          spec:
            deploymentType: Kubernetes
            service:
              serviceRef: <+input>
              serviceInputs:
                serviceDefinition:
                  type: Kubernetes
                  spec:
                    artifacts:
                      primary:
                        primaryArtifactRef: <+input>
                        sources: <+input>
            environment:
              environmentRef: <+input>.default(dev)
              deployToAll: false
              infrastructureDefinitions: <+input>
            execution:
              steps:
                - step:
                    type: K8sRollingDeploy
                    name: Rolling Deployment
                    identifier: rolling_deploy
                    spec:
                      skipDryRun: false
                      pruningEnabled: false
                    timeout: 10m
              rollbackSteps:
                - step:
                    type: K8sRollingRollback
                    name: Rollback
                    identifier: rollback
                    timeout: 10m
          when:
            pipelineStatus: Success

      - stage:
          name: Approval for Production
          identifier: prod_approval
          type: Approval
          spec:
            execution:
              steps:
                - step:
                    type: HarnessApproval
                    name: Production Approval
                    identifier: prod_approval_step
                    spec:
                      approvalMessage: Deploy to production?
                      includePipelineExecutionHistory: true
                      approvers:
                        userGroups: <+input>
                        minimumCount: 2
                        disallowPipelineExecutor: true
                      approverInputs:
                        - name: comments
                          defaultValue: ""
                    timeout: 1d
          when:
            pipelineStatus: Success
            condition: <+input>.default(<+codebase.branch> == "main")

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
              environmentRef: <+input>.default(production)
              deployToAll: false
              infrastructureDefinitions: <+input>
            execution:
              steps:
                - step:
                    type: K8sCanaryDeploy
                    name: Canary Deployment
                    identifier: canary_deploy
                    spec:
                      instanceSelection:
                        type: Count
                        spec:
                          count: 1
                      skipDryRun: false
                    timeout: 10m
                - step:
                    type: K8sCanaryDelete
                    name: Canary Delete
                    identifier: canary_delete
                    timeout: 10m
                - step:
                    type: K8sRollingDeploy
                    name: Rolling Deployment
                    identifier: rolling_deploy
                    spec:
                      skipDryRun: false
                      pruningEnabled: false
                    timeout: 10m
              rollbackSteps:
                - step:
                    type: K8sRollingRollback
                    name: Rollback
                    identifier: rollback
                    timeout: 10m
          when:
            pipelineStatus: Success

      # NOTIFICATION STAGE
      - stage:
          name: Notify
          identifier: notify
          type: Custom
          spec:
            execution:
              steps:
                - step:
                    type: Http
                    name: Slack Notification
                    identifier: slack_notify
                    spec:
                      url: <+input>
                      method: POST
                      requestBody: |
                        {
                          "text": "Deployment Complete",
                          "blocks": [
                            {
                              "type": "section",
                              "text": {
                                "type": "mrkdwn",
                                "text": "*Pipeline:* <+pipeline.name>\n*Status:* <+pipeline.status>\n*Environment:* Production"
                              }
                            }
                          ]
                        }
          when:
            pipelineStatus: All

    properties:
      ci:
        codebase:
          connectorRef: <+input>
          repoName: <+input>
          build: <+input>
    notificationRules:
      - name: Pipeline Failure Notification
        pipelineEvents:
          - type: PipelineFailed
        notificationMethod:
          type: Slack
          spec:
            userGroups: <+input>
            webhookUrl: <+input>
      - name: Pipeline Success Notification
        pipelineEvents:
          - type: PipelineSuccess
        notificationMethod:
          type: Email
          spec:
            userGroups: <+input>
```

### StepGroup Template: Approval Workflow

```yaml
# File: templates/harness/org/stepgroups/approval-workflow-v1.0.0.yaml
template:
  name: Multi-Tier Approval Workflow
  identifier: multi_tier_approval
  versionLabel: 1.0.0
  type: StepGroup
  projectIdentifier: <+input>
  orgIdentifier: <+input>
  tags:
    category: approval
    governance: true
  spec:
    steps:
      # Technical Review
      - step:
          type: HarnessApproval
          name: Technical Review
          identifier: technical_review
          spec:
            approvalMessage: |-
              Technical review required for deployment

              **Service:** <+service.name>
              **Environment:** <+env.name>
              **Artifacts:** <+artifacts.primary.tag>
            includePipelineExecutionHistory: true
            approvers:
              userGroups:
                - <+input>.default(tech_leads)
              minimumCount: 1
              disallowPipelineExecutor: false
            approverInputs:
              - name: technical_comments
                defaultValue: ""
              - name: risk_assessment
                defaultValue: "Low"
          timeout: 1d
          failureStrategies:
            - onFailure:
                errors:
                  - ApprovalRejection
                action:
                  type: StageRollback

      # Security Review
      - step:
          type: HarnessApproval
          name: Security Review
          identifier: security_review
          spec:
            approvalMessage: |-
              Security review required

              **Security Scan Results:** <+pipeline.stages.security_scan.status>
              **Critical Issues:** <+input>.executionInput()
            includePipelineExecutionHistory: true
            approvers:
              userGroups:
                - <+input>.default(security_team)
              minimumCount: 1
              disallowPipelineExecutor: true
            approverInputs:
              - name: security_sign_off
                defaultValue: ""
              - name: exceptions_granted
                defaultValue: "None"
          timeout: 2d
          when:
            stageStatus: Success
            condition: <+env.type> == "Production"

      # Business Approval
      - step:
          type: HarnessApproval
          name: Business Approval
          identifier: business_approval
          spec:
            approvalMessage: |-
              Business approval required for production deployment

              **Release Notes:** <+input>.executionInput()
              **Impact Assessment:** <+input>.executionInput()
            includePipelineExecutionHistory: true
            approvers:
              userGroups:
                - <+input>.default(product_owners)
              minimumCount: 1
              disallowPipelineExecutor: true
            approverInputs:
              - name: business_justification
                defaultValue: ""
              - name: rollback_plan
                defaultValue: ""
              - name: communication_plan
                defaultValue: ""
          timeout: 3d
          when:
            stageStatus: Success
            condition: <+env.type> == "Production"

      # Change Management Integration
      - step:
          type: ServiceNow
          name: Create Change Request
          identifier: create_change_request
          spec:
            connectorRef: <+input>
            ticketType: change_request
            templateName: <+input>.default(standard_change)
            fields:
              - name: short_description
                value: "Deployment: <+service.name> to <+env.name>"
              - name: description
                value: |-
                  Automated deployment via Harness
                  Pipeline: <+pipeline.name>
                  Execution: <+pipeline.executionUrl>
              - name: priority
                value: <+input>.default(3)
              - name: risk
                value: <+input>.default(Low)
              - name: implementation_plan
                value: <+input>.executionInput()
          timeout: 10m

      # Notification
      - step:
          type: Http
          name: Notify Approvers
          identifier: notify_approvers
          spec:
            url: <+input>
            method: POST
            requestBody: |
              {
                "message": "All approvals complete - deployment proceeding",
                "pipeline": "<+pipeline.name>",
                "service": "<+service.name>",
                "environment": "<+env.name>"
              }
          timeout: 30s

    failureStrategy:
      onFailure:
        errors:
          - AllErrors
        action:
          type: Abort
    when:
      stageStatus: Success
    delegateSelectors: <+input>
```

## Template Versioning

### Version Lifecycle

1. **Initial Creation** - Version 1.0.0 created and tested
2. **Active Use** - Teams reference template in pipelines
3. **Updates Required** - Bug fixes or enhancements needed
4. **Version Increment** - New version created (1.0.1 or 1.1.0)
5. **Migration Period** - Both versions available
6. **Deprecation** - Old version marked deprecated
7. **Archive** - Old version removed after migration

### Semantic Versioning

```
MAJOR.MINOR.PATCH

Example: 2.3.1
  │   │   └─ Patch: Bug fixes, no breaking changes
  │   └───── Minor: New features, backward compatible
  └─────────  Major: Breaking changes, requires migration
```

### Version Labels in Templates

```yaml
template:
  name: Kubernetes Deployment
  identifier: k8s_deployment
  versionLabel: 2.1.0  # Semantic version
  type: Stage
```

### Version Management

```yaml
# templates/harness/org/stages/k8s-deployment-versions.yaml
versions:
  - version: 1.0.0
    status: deprecated
    created: 2024-01-15
    deprecated: 2024-06-01
    notes: Initial release, use 2.x for new pipelines

  - version: 1.5.0
    status: deprecated
    created: 2024-03-10
    deprecated: 2024-08-01
    notes: Added health checks, superseded by 2.0.0

  - version: 2.0.0
    status: active
    created: 2024-06-01
    notes: Major refactor with improved rollback
    breaking_changes:
      - Renamed 'replicas' input to 'instanceCount'
      - Changed timeout format from seconds to duration
    migration_guide: docs/migration-1.x-to-2.x.md

  - version: 2.1.0
    status: stable
    created: 2024-09-15
    notes: Added canary deployment support
    new_features:
      - Canary deployment strategy
      - Traffic splitting configuration
      - Progressive rollout controls
```

### Changelog Format

```markdown
# Kubernetes Deployment Template Changelog

## [2.1.0] - 2024-09-15

### Added
- Canary deployment strategy support
- Traffic splitting with progressive rollout
- Advanced health check configurations
- Prometheus metrics collection

### Changed
- Improved rollback detection logic
- Enhanced timeout handling

### Fixed
- Race condition in rolling deployment
- Memory leak in health check monitoring

## [2.0.0] - 2024-06-01

### Breaking Changes
- Renamed `replicas` to `instanceCount` for clarity
- Changed timeout format from seconds to Go duration strings (e.g., "10m")
- Removed deprecated `v1` manifest support

### Added
- Automated rollback on health check failures
- Support for init containers
- Resource quota validation

### Migration
See docs/migration-1.x-to-2.x.md for detailed upgrade instructions.
```

## Template Library Integration

### Creating a Template Catalog

```yaml
# templates/harness/catalog.yaml
catalog:
  name: Platform Engineering Templates
  description: Curated collection of production-ready Harness templates
  version: 1.0.0
  organization: platform-team

  categories:
    - name: Deployment
      description: Service deployment templates
      templates:
        - k8s-deployment-v2.1.0
        - docker-deploy-v1.0.0
        - serverless-deploy-v1.0.0

    - name: Build
      description: CI build templates
      templates:
        - docker-build-v1.0.0
        - npm-build-v1.0.0
        - maven-build-v1.0.0

    - name: Security
      description: Security scanning templates
      templates:
        - trivy-scan-v1.0.0
        - snyk-scan-v1.0.0
        - sonarqube-v1.0.0

    - name: Infrastructure
      description: IaC templates
      templates:
        - terraform-apply-v1.0.0
        - cloudformation-v1.0.0

    - name: Governance
      description: Approval and compliance templates
      templates:
        - multi-tier-approval-v1.0.0
        - change-management-v1.0.0

  recommended_workflows:
    - name: Microservice Deployment
      stages:
        - template: docker-build-v1.0.0
          scope: org
        - template: trivy-scan-v1.0.0
          scope: org
        - template: k8s-deployment-v2.1.0
          scope: org

    - name: Infrastructure Provisioning
      stages:
        - template: terraform-apply-v1.0.0
          scope: account
        - template: multi-tier-approval-v1.0.0
          scope: org

  documentation:
    getting_started: docs/getting-started.md
    best_practices: docs/best-practices.md
    examples: docs/examples/
    api_reference: docs/api-reference.md
```

### Template Discovery Interface

```yaml
# templates/harness/discovery.yaml
discovery:
  search_tags:
    - kubernetes
    - docker
    - terraform
    - security
    - approval
    - cicd

  filters:
    by_scope:
      - account
      - org
      - project
    by_type:
      - stage
      - step
      - pipeline
      - stepgroup
    by_category:
      - build
      - deploy
      - security
      - approval
      - infrastructure

  metadata:
    author: platform-team@company.com
    support: https://wiki.company.com/harness-templates
    slack_channel: "#platform-engineering"

  metrics:
    total_templates: 47
    active_pipelines_using_templates: 342
    average_deployment_time_reduction: 67%
    error_rate_reduction: 43%
```

### Template Usage Tracking

```yaml
# templates/harness/usage-stats.yaml
usage:
  k8s-deployment-v2.1.0:
    total_pipelines: 142
    total_executions: 8734
    success_rate: 97.3%
    avg_execution_time: 8m 23s
    top_users:
      - team: backend-services
        pipelines: 45
      - team: frontend-services
        pipelines: 38
    adoption_trend: increasing

  docker-build-v1.0.0:
    total_pipelines: 98
    total_executions: 5421
    success_rate: 99.1%
    avg_execution_time: 4m 12s
    adoption_trend: stable

  terraform-apply-v1.0.0:
    total_pipelines: 23
    total_executions: 456
    success_rate: 94.2%
    avg_execution_time: 12m 45s
    adoption_trend: increasing
```

## Best Practices

### Naming Conventions

#### Template Identifiers

Use snake_case for identifiers:
```yaml
identifier: k8s_rolling_deployment
identifier: docker_build_push
identifier: terraform_plan_apply
```

#### Template Names

Use Title Case for display names:
```yaml
name: Kubernetes Rolling Deployment
name: Docker Build and Push
name: Terraform Plan and Apply
```

#### Version Labels

Use semantic versioning:
```yaml
versionLabel: 1.0.0    # Initial release
versionLabel: 1.1.0    # New feature
versionLabel: 2.0.0    # Breaking change
```

#### File Names

Include version in filename:
```
k8s-deployment-v1.0.0.yaml
docker-build-v2.1.0.yaml
terraform-apply-v1.5.2.yaml
```

### Input Validation

#### Required vs Optional Inputs

```yaml
# Required input (no default)
spec:
  connectorRef: <+input>

# Optional input (with default)
spec:
  timeout: <+input>.default(10m)
```

#### Input Constraints

```yaml
# Dropdown selection
environment: <+input>.allowedValues(dev,staging,prod)

# Pattern validation
version: <+input>.regex(^v[0-9]+\.[0-9]+\.[0-9]+$)

# Numeric range (via validation in UI)
replicas: <+input>.default(3)  # Document: 1-10 range
```

#### Input Documentation

```yaml
spec:
  # Service connector - connects to Kubernetes cluster
  # Required: Yes
  # Type: Connector reference
  connectorRef: <+input>

  # Deployment replicas - number of pod instances
  # Required: No (defaults to 3)
  # Range: 1-100
  # Recommendation: 3 for production, 1 for dev
  replicas: <+input>.default(3)
```

### Documentation Standards

#### Template Header

```yaml
template:
  name: Kubernetes Canary Deployment
  identifier: k8s_canary_deployment
  versionLabel: 1.0.0
  type: Stage
  tags:
    category: deployment
    strategy: canary
    platform: kubernetes
    owner: platform-team
    support: "#platform-engineering"
  description: |
    Performs canary deployment to Kubernetes with traffic shifting.

    Features:
    - Progressive traffic rollout (10% -> 50% -> 100%)
    - Automated health checks between phases
    - Automatic rollback on failure
    - Prometheus metrics validation

    Use Cases:
    - Production deployments requiring gradual rollout
    - High-risk changes needing validation
    - A/B testing scenarios

    Prerequisites:
    - Istio or similar service mesh for traffic splitting
    - Prometheus for metrics collection
    - Kubernetes cluster v1.20+

    Documentation: https://wiki.company.com/k8s-canary-deployment
    Examples: https://github.com/company/harness-examples/k8s-canary
```

#### Inline Comments

```yaml
execution:
  steps:
    # Deploy canary pods (10% of total replicas)
    # This creates a small number of pods running the new version
    # while keeping most traffic on the stable version
    - step:
        type: K8sCanaryDeploy
        name: Deploy 10% Canary
        identifier: deploy_canary_10
        spec:
          instanceSelection:
            type: Percentage
            spec:
              percentage: 10  # 10% of desired replicas
          skipDryRun: false
        timeout: 10m
```

#### README Documentation

Create companion README files:

```markdown
# Kubernetes Canary Deployment Template

## Overview

Progressive canary deployment strategy for Kubernetes workloads.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| connectorRef | Yes | - | Kubernetes cluster connector |
| serviceRef | Yes | - | Service to deploy |
| environmentRef | Yes | - | Target environment |
| replicas | No | 3 | Total desired replicas |
| canaryPercentages | No | [10,50] | Progressive rollout percentages |
| healthCheckTimeout | No | 5m | Time to wait for health checks |

## Outputs

| Output | Description |
|--------|-------------|
| deploymentStatus | Final deployment status |
| canaryVersion | Version deployed to canary |
| rollbackExecuted | Whether rollback occurred |

## Usage Example

See docs/examples/k8s-canary-example.yaml

## Troubleshooting

Common issues and solutions documented at:
https://wiki.company.com/k8s-canary-troubleshooting
```

### Testing Templates

#### Validation Checklist

```yaml
# templates/harness/testing/validation-checklist.yaml
validation:
  syntax:
    - [ ] Valid YAML syntax
    - [ ] No duplicate keys
    - [ ] Proper indentation

  schema:
    - [ ] Matches Harness template schema
    - [ ] All required fields present
    - [ ] Valid field types

  inputs:
    - [ ] All inputs documented
    - [ ] Defaults specified where appropriate
    - [ ] Validation rules defined
    - [ ] No hardcoded values that should be inputs

  logic:
    - [ ] Failure strategies defined
    - [ ] Rollback steps included
    - [ ] Timeout values reasonable
    - [ ] Conditional execution tested

  documentation:
    - [ ] Template purpose clear
    - [ ] Prerequisites listed
    - [ ] Examples provided
    - [ ] Troubleshooting guide available

  integration:
    - [ ] Works in test pipeline
    - [ ] Inputs validate correctly
    - [ ] Outputs accessible to downstream stages
    - [ ] Failure handling works as expected
```

#### Test Pipeline

```yaml
# templates/harness/testing/template-test-pipeline.yaml
pipeline:
  name: Template Validation Pipeline
  identifier: template_validation
  projectIdentifier: platform_engineering
  orgIdentifier: default

  stages:
    - stage:
        name: Validate Template
        identifier: validate_template
        type: Custom
        spec:
          execution:
            steps:
              # Syntax validation
              - step:
                  type: Run
                  name: YAML Syntax Check
                  identifier: yaml_syntax
                  spec:
                    shell: Bash
                    command: |
                      yamllint templates/harness/**/*.yaml

              # Schema validation
              - step:
                  type: Run
                  name: Schema Validation
                  identifier: schema_validation
                  spec:
                    shell: Bash
                    command: |
                      harness template validate \
                        --template templates/harness/org/stages/k8s-deployment-v2.1.0.yaml

              # Test instantiation
              - step:
                  name: Test Template
                  identifier: test_template
                  template:
                    templateRef: k8s_deployment
                    versionLabel: 2.1.0
                    templateInputs:
                      serviceRef: test-service
                      environmentRef: test-env
                      replicas: 1
```

### Governance and Compliance

#### Template Approval Process

```yaml
# templates/harness/governance/approval-process.yaml
approval_process:
  template_creation:
    steps:
      1: Developer creates template in feature branch
      2: Template passes automated validation
      3: PR created with template and documentation
      4: Platform team reviews template design
      5: Security team reviews for compliance
      6: Template merged to main branch
      7: Template promoted to org/account scope

    reviewers:
      technical:
        - platform-team
      security:
        - security-team
      business:
        - engineering-managers

    criteria:
      - Follows naming conventions
      - Includes comprehensive documentation
      - Has test pipeline demonstrating usage
      - Passes security scan
      - Has rollback strategy
      - Defines failure handling
      - Includes monitoring/observability
```

#### Compliance Checks

```yaml
# templates/harness/governance/compliance-checks.yaml
compliance:
  required_elements:
    all_templates:
      - failure_strategies: Must define error handling
      - timeout: Must have reasonable timeout
      - tags: Must include category and owner
      - documentation: Must have description

    deployment_templates:
      - rollback_steps: Must define rollback procedure
      - health_checks: Must validate deployment health
      - approval: Production requires approval step

    security_templates:
      - artifact_scanning: Must scan artifacts
      - vulnerability_threshold: Must fail on critical CVEs
      - sbom_generation: Must generate SBOM

  prohibited_patterns:
    - hardcoded_secrets: No secrets in template YAML
    - hardcoded_credentials: No credentials in template
    - production_defaults: No production values as defaults
    - skip_validation: Cannot skip security validation
```

## Advanced Patterns

### Conditional Template Logic

```yaml
# Conditional execution based on environment
execution:
  steps:
    - step:
        type: K8sCanaryDeploy
        name: Canary Deploy
        identifier: canary_deploy
        when:
          condition: <+env.type> == "Production"
    - step:
        type: K8sRollingDeploy
        name: Rolling Deploy
        identifier: rolling_deploy
        when:
          condition: <+env.type> != "Production"
```

### Dynamic Step Generation

```yaml
# Loop over environments for multi-environment deployment
execution:
  steps:
    - stepGroup:
        identifier: deploy_all_regions
        steps:
          - step:
              type: K8sRollingDeploy
              name: Deploy to <+repeat.item>
              identifier: deploy_<+repeat.item>
              spec:
                infrastructure:
                  infrastructureRef: <+repeat.item>
        strategy:
          repeat:
            items: <+input>  # ["us-east-1", "us-west-2", "eu-west-1"]
```

### Template Composition

```yaml
# Use step templates within stage template
execution:
  steps:
    - step:
        name: Build Image
        identifier: build
        template:
          templateRef: docker_build_push
          versionLabel: 1.0.0
          templateInputs:
            connectorRef: <+input>
            repo: <+input>
    - step:
        name: Scan Image
        identifier: scan
        template:
          templateRef: trivy_scan
          versionLabel: 1.0.0
          templateInputs:
            image: <+pipeline.stages.build.spec.artifacts.primary.tag>
```

## Troubleshooting

### Common Issues

#### Input Validation Errors

**Problem:** Pipeline fails at template instantiation with "Invalid input"

**Solutions:**
```yaml
# Ensure input matches expected format
serviceRef: <+input>  # Not: <+input.serviceRef>

# Provide defaults for optional inputs
timeout: <+input>.default(10m)

# Use correct input type
replicas: <+input>.default(3)  # Number, not string
```

#### Template Not Found

**Problem:** "Template not found" error when referencing template

**Solutions:**
- Verify template scope matches usage (project template can't be used at org level)
- Check template identifier spelling
- Ensure template exists in correct org/project
- Verify version label is correct

#### Runtime Input Not Prompted

**Problem:** Expected input prompt doesn't appear

**Solutions:**
```yaml
# Use executionInput() for runtime prompts
approvers: <+input>.executionInput()

# Regular <+input> only prompts at pipeline start
environment: <+input>
```

## Performance Optimization

### Template Caching

Templates are cached by Harness for performance. To force refresh:
- Increment version label
- Update template via API
- Clear pipeline cache in UI

### Large Template Management

For templates with many inputs:
```yaml
# Group related inputs
spec:
  deployment:
    strategy: <+input>
    replicas: <+input>
    timeout: <+input>
  infrastructure:
    connectorRef: <+input>
    namespace: <+input>
    cluster: <+input>
```

## Integration with Other Tools

### Terraform Integration

```yaml
# Reference Terraform outputs in template
spec:
  infrastructure:
    cluster: <+pipeline.stages.terraform.spec.execution.steps.apply.output.cluster_endpoint>
```

### ServiceNow Integration

```yaml
# Create change request from template
- step:
    type: ServiceNow
    name: Create Change
    identifier: create_change
    spec:
      connectorRef: <+input>
      ticketType: change_request
      fields:
        - name: short_description
          value: "Deploy <+service.name> v<+artifacts.primary.tag>"
```

### Jira Integration

```yaml
# Update Jira ticket from template
- step:
    type: JiraUpdate
    name: Update Deployment Ticket
    identifier: update_jira
    spec:
      connectorRef: <+input>
      issueKey: <+input>
      fields:
        - name: status
          value: "Deployed"
        - name: environment
          value: <+env.name>
```

## Related Commands

- `/itg:harness` - Generate complete Harness pipeline configurations
- `/itg:terraform` - Generate Terraform configurations for infrastructure
- `/itg:kubernetes` - Generate Kubernetes manifests
- `/itg:docker` - Generate Dockerfiles and compose configurations

## Additional Resources

### Official Documentation

- [Harness Templates Overview](https://developer.harness.io/docs/platform/templates/template/)
- [Template Library](https://developer.harness.io/docs/platform/templates/create-a-remote-template/)
- [Runtime Inputs](https://developer.harness.io/docs/platform/variables-and-expressions/runtime-inputs/)
- [Template Best Practices](https://developer.harness.io/docs/platform/templates/templates-best-practices/)

### Example Repositories

- Internal: `templates/harness/examples/`
- GitHub: `github.com/company/harness-template-library`

### Support

- Slack: `#platform-engineering`
- Wiki: `https://wiki.company.com/harness-templates`
- Office Hours: Tuesdays 2pm EST

## Version History

- **1.0.0** (2025-01-19) - Initial release with support for stage, step, pipeline, and stepgroup templates
