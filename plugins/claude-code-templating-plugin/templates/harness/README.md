# Harness YAML Templates

Comprehensive collection of production-ready Harness YAML templates for CI/CD pipelines, deployment stages, and execution steps.

## Template Structure

```
harness/
├── pipelines/       # Complete pipeline templates
├── stages/          # Reusable stage templates
└── steps/           # Individual step templates
```

## Pipeline Templates

### 1. CI/CD Standard (`pipelines/ci-cd-standard.yaml`)

**Description:** Complete CI/CD pipeline with build, test, security scanning, and multi-environment deployment.

**Features:**
- Build and test stage with Docker image creation
- Security scanning (Trivy, OWASP Dependency Check)
- Automated deployment to dev
- Manual approval gate for production
- Rolling deployment with health checks
- Comprehensive rollback capabilities
- Notification rules for success/failure

**Use Cases:**
- Standard microservice deployments
- API services
- Web applications

**Variables:**
- `service_name` - Service to deploy
- `docker_registry` - Docker registry URL
- `environment` - Target environment (dev/staging/prod)
- `run_security_scan` - Enable security scanning
- `replicas` - Number of pod replicas

### 2. GitOps Pipeline (`pipelines/gitops-pipeline.yaml`)

**Description:** GitOps-based deployment with ArgoCD synchronization.

**Features:**
- Build and push Docker image
- Update GitOps repository manifests
- Trigger ArgoCD sync
- Automated verification of deployment
- Support for Kustomize, Helm, and raw manifests

**Use Cases:**
- GitOps workflows
- ArgoCD deployments
- Infrastructure as Code repositories

**Variables:**
- `service_name` - Service to deploy
- `gitops_repo` - GitOps repository URL
- `argocd_app_name` - ArgoCD application name
- `auto_sync` - Automatically sync ArgoCD

### 3. Canary Deployment (`pipelines/canary-deployment.yaml`)

**Description:** Progressive canary rollout with automated verification.

**Features:**
- Multi-phase canary: 10% → 25% → 50% → 100%
- Automated metrics analysis between phases
- Error rate and latency monitoring
- Prometheus integration for metrics
- Rollback on failure at any phase

**Use Cases:**
- High-risk production deployments
- New feature rollouts
- Performance-sensitive applications

**Variables:**
- `canary_phase_1_percentage` - Phase 1 percentage (default: 10%)
- `canary_phase_2_percentage` - Phase 2 percentage (default: 25%)
- `canary_phase_3_percentage` - Phase 3 percentage (default: 50%)
- `phase_duration_minutes` - Monitoring duration per phase
- `error_rate_threshold` - Max acceptable error rate
- `latency_threshold_ms` - Max acceptable latency

### 4. Blue-Green Deployment (`pipelines/blue-green.yaml`)

**Description:** Zero-downtime blue-green deployment with atomic traffic switch.

**Features:**
- Deploy new version to green environment
- Comprehensive testing on green
- Atomic traffic switch from blue to green
- Easy rollback by swapping back
- Optional cleanup of old version

**Use Cases:**
- Zero-downtime deployments
- Database migration scenarios
- Version rollbacks

**Variables:**
- `service_name` - Service to deploy
- `image_tag` - Docker image tag
- `verification_timeout` - Green verification timeout
- `auto_promote` - Auto-promote after tests
- `cleanup_old_version` - Cleanup old blue environment

## Stage Templates

### 5. Kubernetes Deploy (`stages/kubernetes-deploy.yaml`)

**Description:** Reusable Kubernetes rolling deployment stage.

**Features:**
- Pre-deployment health checks
- Rolling deployment with configurable strategy
- Post-deployment verification
- Smoke tests
- Metrics monitoring
- Automated rollback

**Inputs:**
- Service reference
- Image tag
- Replicas count
- Resource limits
- Manifest paths

### 6. Terraform Apply (`stages/terraform-apply.yaml`)

**Description:** Complete Terraform infrastructure deployment.

**Features:**
- Terraform init, validate, format check
- Security scanning (tfsec, checkov, trivy)
- Terraform plan with resource analysis
- Cost estimation (Infracost)
- Manual approval
- Terraform apply
- Infrastructure verification

**Inputs:**
- Terraform workspace
- Terraform directory
- Backend configuration
- Approval groups

### 7. Approval Stage (`stages/approval-stage.yaml`)

**Description:** Configurable manual approval gate.

**Features:**
- Customizable approval message
- Configurable approvers
- Minimum approver count
- Timeout handling
- Pipeline execution history

**Inputs:**
- Approval message
- User groups
- Timeout duration
- Minimum approvers

## Step Templates

### 8. Shell Script (`steps/shell-script.yaml`)

**Description:** Generic shell script execution with best practices.

**Features:**
- Error handling (set -e, -u, -o pipefail)
- Environment variables
- Output variables
- Secret output variables
- Retry logic

**Inputs:**
- Script content
- Environment variables
- Output variables

### 9. Docker Build (`steps/docker-build.yaml`)

**Description:** Build and push Docker image with multi-tag support.

**Features:**
- Multi-tag support
- Build arguments
- Labels (version, commit, branch)
- Build optimization
- Remote caching
- Multi-stage builds

**Inputs:**
- Docker registry
- Repository name
- Tags
- Dockerfile path
- Build args

### 10. Terraform Plan (`steps/terraform-plan.yaml`)

**Description:** Execute Terraform plan with configuration.

**Features:**
- Backend configuration
- Variable files (inline and remote)
- Environment variables
- Resource targeting
- Workspace support
- Export plan in JSON and human-readable formats

**Inputs:**
- Provisioner identifier
- Config file location
- Variable files
- Backend config
- Workspace

### 11. Database Migration (`steps/database-migration.yaml`)

**Description:** Execute database migrations with multiple tool support.

**Features:**
- Support for Flyway, Liquibase, Custom SQL
- Support for TypeORM, Django, Rails
- Connection verification
- Migration verification
- Manual intervention on failure

**Inputs:**
- Migration tool (Flyway/Liquibase/Custom/TypeORM/Django/Rails)
- Migration scripts path
- Database credentials (from secrets)

## Usage

### Using Pipeline Templates

1. Copy the desired pipeline template
2. Replace all `<+input>` placeholders with actual values
3. Customize variables, stages, and steps as needed
4. Import into Harness via UI or YAML

### Using Stage Templates

1. Copy the stage template
2. Insert into your pipeline's `stages` array
3. Configure all required inputs
4. Adjust failure strategies as needed

### Using Step Templates

1. Copy the step template
2. Insert into your stage's `execution.steps` array
3. Fill in all `<+input>` placeholders
4. Configure environment variables and outputs

## Variable Expressions

Common Harness expressions used in templates:

- `<+pipeline.name>` - Pipeline name
- `<+pipeline.sequenceId>` - Build number
- `<+pipeline.executionId>` - Unique execution ID
- `<+codebase.commitSha>` - Git commit SHA
- `<+codebase.branch>` - Git branch name
- `<+service.name>` - Service name
- `<+env.name>` - Environment name
- `<+secrets.getValue("secret_name")>` - Retrieve secret

## Best Practices

### Pipeline Design
- Use meaningful stage and step names
- Add descriptive comments
- Configure appropriate timeouts
- Implement failure strategies
- Add notification rules

### Security
- Store credentials in Harness secrets
- Use secret output variables for sensitive data
- Enable security scanning in CI
- Implement approval gates for production
- Scan Terraform and Docker images

### Reliability
- Implement health checks
- Add smoke tests after deployment
- Configure rollback strategies
- Monitor metrics during deployment
- Use progressive rollouts for high-risk changes

### Observability
- Add logging at each step
- Export output variables for tracking
- Configure notifications
- Include execution URLs in messages
- Log deployment metrics

## Customization

### Adding Custom Steps

```yaml
- step:
    name: Custom Step
    identifier: custom_step
    type: ShellScript
    spec:
      shell: Bash
      source:
        type: Inline
        spec:
          script: |
            # Your custom logic
```

### Adding Custom Variables

```yaml
variables:
  - name: custom_var
    type: String
    description: Custom variable description
    value: <+input>
    required: true
```

### Adding Custom Notifications

```yaml
notificationRules:
  - name: Custom Notification
    identifier: custom_notification
    pipelineEvents:
      - type: PipelineSuccess
    notificationMethod:
      type: Slack
      spec:
        webhookUrl: <+secrets.getValue("webhook")>
```

## Integration Examples

### Prometheus Metrics

```bash
ERROR_RATE=$(curl -s 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=rate(http_errors_total[5m])' \
  | jq -r '.data.result[0].value[1]')
```

### ArgoCD CLI

```bash
argocd app sync myapp --prune
argocd app wait myapp --health --timeout 600
```

### Kubernetes Commands

```bash
kubectl rollout status deployment/myapp -n production
kubectl get pods -l app=myapp -n production
```

### Terraform Commands

```bash
terraform init -backend-config="bucket=mybucket"
terraform plan -out=tfplan
terraform apply tfplan
```

## Support

For issues, questions, or contributions:
- Harness Documentation: https://developer.harness.io/docs/
- Harness Community: https://community.harness.io/
- Template Issues: Create an issue in this repository

## License

These templates are provided as examples and should be customized for your specific use case.
