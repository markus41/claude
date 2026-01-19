---
name: itg:inputset
description: Generate Harness input sets and overlays for pipeline configurations
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: pipeline-name
    description: Name of the pipeline to create input set for
    required: true
    type: string
flags:
  - name: name
    description: Custom name for the input set (defaults to {pipeline-name}-inputs)
    type: string
  - name: environments
    description: Comma-separated list of environments to generate input sets for
    type: string
    default: "dev,staging,prod"
  - name: overlay
    description: Create overlay input set instead of regular input set
    type: boolean
    default: false
  - name: output
    description: Output directory for generated input sets
    type: string
    default: "./inputsets"
  - name: org
    description: Harness organization identifier
    type: string
  - name: project
    description: Harness project identifier
    type: string
aliases:
  - itg:inputs
  - itg:harness-inputs
presets:
  - name: multi-env
    description: Generate input sets for all standard environments
    flags:
      environments: "dev,staging,prod"
      overlay: false
  - name: overlay-only
    description: Generate overlay input set for runtime variable overrides
    flags:
      overlay: true
---

# Infrastructure Template Generator: Input Set Command

**Best for:** Creating standardized Harness input sets and overlays for pipeline configurations, enabling consistent deployment parameter management across environments and reducing manual pipeline configuration errors.

## Overview

The `itg:inputset` command generates Harness input sets and overlay input sets for pipeline configurations. Input sets define the runtime parameters for pipeline executions, while overlays allow selective parameter overrides for different environments or deployment scenarios.

**Business Value:**
- Eliminates manual parameter entry errors during deployments
- Ensures consistency across environment configurations
- Enables self-service deployments with predefined parameters
- Reduces deployment setup time from minutes to seconds
- Codifies deployment best practices and guardrails
- Facilitates environment-specific configuration management

## Command Workflow

### Phase 1: Pipeline Discovery
1. Query Harness API to retrieve pipeline definition
2. Extract all input parameters and their types
3. Identify required vs. optional parameters
4. Parse parameter constraints and validation rules
5. Detect environment-specific parameters

### Phase 2: Input Set Structure Generation
1. Create base input set structure per environment
2. Populate default values from pipeline definition
3. Add environment-specific parameter variations
4. Generate metadata (name, description, tags)
5. Apply organizational naming conventions

### Phase 3: Overlay Generation (if enabled)
1. Create overlay input set structure
2. Define override hierarchy
3. Specify selectively overridable parameters
4. Add overlay-specific validation rules
5. Configure merge strategy

### Phase 4: File Generation
1. Generate YAML files for each input set
2. Create directory structure by environment
3. Add inline documentation comments
4. Generate usage examples
5. Create README with input set catalog

### Phase 5: Validation
1. Validate YAML syntax
2. Check parameter type compatibility
3. Verify required parameter coverage
4. Validate against pipeline schema
5. Test overlay merge logic

## Generated Structure

### Multi-Environment Input Sets

```
inputsets/
├── README.md                           # Input set catalog and usage guide
├── {pipeline-name}/
│   ├── dev/
│   │   └── {pipeline-name}-dev-inputs.yaml
│   ├── staging/
│   │   └── {pipeline-name}-staging-inputs.yaml
│   ├── prod/
│   │   └── {pipeline-name}-prod-inputs.yaml
│   └── overlays/
│       └── {pipeline-name}-overlay.yaml
```

### Input Set YAML Structure

```yaml
inputSet:
  identifier: terraform_plan_dev_inputs
  name: Terraform Plan - Dev Environment
  description: Input set for dev environment Terraform plan execution
  orgIdentifier: platform_engineering
  projectIdentifier: infrastructure
  pipeline:
    identifier: terraform_plan_apply
    stages:
      - stage:
          identifier: plan_stage
          type: Custom
          spec:
            execution:
              steps:
                - step:
                    identifier: terraform_plan
                    type: TerraformPlan
                    spec:
                      configuration:
                        # Environment: Development
                        workspace: dev
                        varFiles:
                          - /harness/terraform/environments/dev/terraform.tfvars
                        environmentVariables:
                          TF_LOG: INFO
                          AWS_REGION: us-east-1
                        targets: []

                      # Backend Configuration
                      backendConfig:
                        type: Remote
                        spec:
                          region: us-east-1
                          bucket: terraform-state-dev
                          key: infrastructure/dev/terraform.tfstate

                      # Variable Overrides
                      variables:
                        environment: dev
                        instance_type: t3.medium
                        instance_count: 2
                        enable_monitoring: true
                        enable_backups: false
                        auto_scaling_enabled: false
  tags:
    environment: dev
    owner: platform-team
    auto_approval: "true"
```

### Overlay Input Set Structure

```yaml
overlayInputSet:
  identifier: terraform_plan_hotfix_overlay
  name: Terraform Plan - Hotfix Override
  description: Overlay for emergency hotfix deployments with expedited settings
  orgIdentifier: platform_engineering
  projectIdentifier: infrastructure
  tags:
    use_case: hotfix
    approval_required: "false"

  # Base input sets to overlay on
  inputSetReferences:
    - terraform_plan_dev_inputs
    - terraform_plan_staging_inputs
    - terraform_plan_prod_inputs

  # Selective parameter overrides
  pipeline:
    stages:
      - stage:
          identifier: plan_stage
          type: Custom
          spec:
            execution:
              steps:
                - step:
                    identifier: terraform_plan
                    type: TerraformPlan
                    spec:
                      configuration:
                        # Override: Verbose logging for hotfix debugging
                        environmentVariables:
                          TF_LOG: DEBUG
                          HOTFIX_MODE: "true"

                        # Override: Expedited execution
                        timeout: 5m

                      # Override: Skip optional validations
                      variables:
                        skip_optional_checks: true
                        expedited_deployment: true
```

## Usage Examples

### Basic Input Set Generation

Generate input sets for a pipeline with default environments:

```bash
/itg:inputset terraform-plan-apply \
  --org platform_engineering \
  --project infrastructure
```

**Expected Output:**
```
Generating Harness Input Sets: terraform-plan-apply
====================================================================

Phase 1: Pipeline Discovery
  ✓ Retrieved pipeline definition from Harness
  ✓ Pipeline: terraform-plan-apply (org: platform_engineering, project: infrastructure)
  ✓ Identified 24 input parameters
  ✓ Required parameters: 12
  ✓ Optional parameters: 12
  ✓ Detected environment-specific parameters: 8

Phase 2: Generating Input Sets
  ✓ Created dev input set (terraform-plan-apply-dev-inputs)
  ✓ Created staging input set (terraform-plan-apply-staging-inputs)
  ✓ Created prod input set (terraform-plan-apply-prod-inputs)
  ✓ Applied environment-specific configurations
  ✓ Set default values from pipeline definition

Phase 3: File Generation
  ✓ Generated ./inputsets/terraform-plan-apply/dev/terraform-plan-apply-dev-inputs.yaml
  ✓ Generated ./inputsets/terraform-plan-apply/staging/terraform-plan-apply-staging-inputs.yaml
  ✓ Generated ./inputsets/terraform-plan-apply/prod/terraform-plan-apply-prod-inputs.yaml
  ✓ Created README.md with usage instructions

Phase 4: Validation
  ✓ Validated YAML syntax (3 files)
  ✓ Verified parameter type compatibility
  ✓ Confirmed required parameter coverage
  ✓ Validated against pipeline schema

Input sets generated successfully!
Location: ./inputsets/terraform-plan-apply
Files created: 4 (3 input sets + 1 README)

Next steps:
  1. Review generated input sets for accuracy
  2. Customize environment-specific values
  3. Upload to Harness: harness input-set create --file <path>
  4. Test with: harness pipeline execute --pipeline terraform-plan-apply --input-set terraform-plan-apply-dev-inputs
```

### Custom Environments

Generate input sets for custom environment list:

```bash
/itg:inputset deployment-pipeline \
  --environments "dev,qa,staging,prod,dr" \
  --org cloud_ops \
  --project microservices
```

**Use Case:** Organizations with non-standard environment tiers (e.g., QA, DR environments).

**Generated Structure:**
```
inputsets/deployment-pipeline/
├── dev/
├── qa/
├── staging/
├── prod/
└── dr/
```

### Overlay Input Set Generation

Generate an overlay input set for runtime parameter overrides:

```bash
/itg:inputset terraform-plan-apply \
  --overlay \
  --name hotfix-overlay \
  --org platform_engineering \
  --project infrastructure
```

**Use Case:** Emergency hotfix deployments requiring expedited settings without modifying base input sets.

**Generated Overlay:**
- References existing base input sets
- Defines selective parameter overrides
- Maintains traceability to base configurations
- Enables one-time execution variations

### Custom Output Location

Generate input sets to a specific directory:

```bash
/itg:inputset api-deployment \
  --output ~/harness-configs/inputsets \
  --org backend_services \
  --project api_platform
```

### Multi-Environment Preset

Generate comprehensive input sets for all standard environments:

```bash
/itg:inputset infrastructure-provisioning \
  --preset multi-env \
  --org platform_engineering \
  --project infrastructure
```

**Generated:**
- Dev, staging, prod input sets
- Environment-specific configurations
- Consistent naming conventions
- Complete parameter coverage

## Input Set Templates

### Terraform Pipeline Input Set

```yaml
inputSet:
  identifier: terraform_apply_prod_inputs
  name: Terraform Apply - Production
  description: Production environment Terraform deployment parameters
  orgIdentifier: platform_engineering
  projectIdentifier: infrastructure
  pipeline:
    identifier: terraform_plan_apply
    stages:
      - stage:
          identifier: terraform_apply_stage
          type: Custom
          spec:
            execution:
              steps:
                - step:
                    identifier: terraform_apply
                    type: TerraformApply
                    spec:
                      configuration:
                        workspace: prod
                        varFiles:
                          - /harness/terraform/environments/prod/terraform.tfvars
                        environmentVariables:
                          TF_LOG: WARN
                          AWS_REGION: us-east-1

                      backendConfig:
                        type: Remote
                        spec:
                          region: us-east-1
                          bucket: terraform-state-prod
                          key: infrastructure/prod/terraform.tfstate

                      variables:
                        environment: prod
                        instance_type: m5.xlarge
                        instance_count: 5
                        enable_monitoring: true
                        enable_backups: true
                        auto_scaling_enabled: true
                        min_capacity: 3
                        max_capacity: 10
                        high_availability: true
                        multi_az: true
  tags:
    environment: prod
    criticality: high
    approval_required: "true"
    change_window: "tue-thu-2am-4am"
```

### Kubernetes Deployment Input Set

```yaml
inputSet:
  identifier: k8s_deployment_staging_inputs
  name: K8s Deployment - Staging
  description: Staging environment Kubernetes deployment parameters
  orgIdentifier: platform_engineering
  projectIdentifier: microservices
  pipeline:
    identifier: k8s_rolling_deploy
    stages:
      - stage:
          identifier: deploy_stage
          type: Deployment
          spec:
            service:
              serviceInputs:
                serviceDefinition:
                  type: Kubernetes
                  spec:
                    manifests:
                      - manifest:
                          identifier: deployment_manifest
                          type: K8sManifest
                          spec:
                            valuesPaths:
                              - /harness/k8s/values/staging.yaml

            environment:
              environmentInputs:
                identifier: staging_k8s
                type: PreProduction
                variables:
                  - name: namespace
                    type: String
                    value: app-staging
                  - name: replicas
                    type: String
                    value: "3"
                  - name: cpu_limit
                    type: String
                    value: "1000m"
                  - name: memory_limit
                    type: String
                    value: "2Gi"
                  - name: image_tag
                    type: String
                    value: <+trigger.artifact.tag>

            infrastructure:
              infrastructureDefinition:
                type: KubernetesDirect
                spec:
                  connectorRef: staging_k8s_cluster
                  namespace: app-staging
                  releaseName: app-<+service.name>
  tags:
    environment: staging
    deployment_type: rolling
    auto_rollback: "true"
```

### CI/CD Pipeline Input Set

```yaml
inputSet:
  identifier: ci_build_dev_inputs
  name: CI Build - Development
  description: Development branch CI build configuration
  orgIdentifier: engineering
  projectIdentifier: backend_services
  pipeline:
    identifier: ci_build_test_deploy
    stages:
      - stage:
          identifier: build_stage
          type: CI
          spec:
            execution:
              steps:
                - step:
                    identifier: build_app
                    type: Run
                    spec:
                      shell: Bash
                      envVariables:
                        ENVIRONMENT: dev
                        BUILD_TYPE: debug
                        ENABLE_CODE_COVERAGE: "true"
                        RUN_INTEGRATION_TESTS: "false"
                        DOCKER_REGISTRY: ghcr.io
                        DOCKER_IMAGE_PREFIX: myorg
                        NODE_ENV: development

                - step:
                    identifier: run_tests
                    type: Run
                    spec:
                      shell: Bash
                      envVariables:
                        TEST_SUITE: unit
                        PARALLEL_TESTS: "4"
                        COVERAGE_THRESHOLD: "70"

                - step:
                    identifier: publish_artifact
                    type: BuildAndPushDockerRegistry
                    spec:
                      connectorRef: docker_hub
                      repo: myorg/myapp
                      tags:
                        - dev-<+pipeline.sequenceId>
                        - dev-latest
  tags:
    environment: dev
    branch: develop
    auto_deploy: "true"
```

## Integration with Harness

### Upload Input Sets to Harness

After generating input sets locally, upload them to Harness:

```bash
# Upload single input set
harness input-set create \
  --file ./inputsets/terraform-plan-apply/dev/terraform-plan-apply-dev-inputs.yaml \
  --org platform_engineering \
  --project infrastructure

# Upload all input sets in directory
for file in ./inputsets/terraform-plan-apply/*/*.yaml; do
  harness input-set create --file "$file" --org platform_engineering --project infrastructure
done
```

### Execute Pipeline with Input Set

```bash
# Execute with specific input set
harness pipeline execute \
  --pipeline terraform-plan-apply \
  --input-set terraform-plan-apply-dev-inputs \
  --org platform_engineering \
  --project infrastructure

# Execute with overlay
harness pipeline execute \
  --pipeline terraform-plan-apply \
  --input-set terraform-plan-apply-dev-inputs \
  --overlay hotfix-overlay \
  --org platform_engineering \
  --project infrastructure
```

### List Available Input Sets

```bash
# List input sets for pipeline
harness input-set list \
  --pipeline terraform-plan-apply \
  --org platform_engineering \
  --project infrastructure
```

## Best Practices

### Naming Conventions

**Use consistent, descriptive names:**
- ✅ `{pipeline-name}-{environment}-inputs`
- ✅ `terraform-apply-prod-inputs`
- ✅ `k8s-deploy-staging-inputs`
- ❌ `inputs-1`, `prod`, `config`

**Overlay naming:**
- ✅ `{pipeline-name}-{purpose}-overlay`
- ✅ `terraform-apply-hotfix-overlay`
- ✅ `deploy-canary-overlay`

### Environment-Specific Configuration

**Differentiate environments clearly:**

| Environment | Instance Size | Replicas | Monitoring | Auto-scaling |
|-------------|---------------|----------|------------|--------------|
| Dev         | Small         | 1-2      | Basic      | Disabled     |
| Staging     | Medium        | 2-3      | Enhanced   | Enabled      |
| Prod        | Large         | 5+       | Full       | Enabled      |

**Set appropriate defaults:**
- Dev: Fast feedback, lower cost
- Staging: Production parity
- Prod: High availability, performance

### Parameter Organization

**Group related parameters:**
```yaml
# Infrastructure
instance_type: t3.medium
instance_count: 3
availability_zones: [us-east-1a, us-east-1b]

# Monitoring
enable_monitoring: true
log_retention_days: 30
metrics_interval: 60

# Security
enable_encryption: true
ssl_certificate_arn: arn:aws:acm:...
```

### Documentation

**Include inline comments:**
```yaml
variables:
  # Infrastructure Sizing
  # - Dev: t3.medium (2 vCPU, 4GB RAM)
  # - Prod: m5.xlarge (4 vCPU, 16GB RAM)
  instance_type: t3.medium

  # Auto-scaling Configuration
  # Min: Ensure baseline capacity
  # Max: Cost protection ceiling
  min_capacity: 2
  max_capacity: 10
```

### Version Control

**Track input sets in Git:**
```bash
# Commit generated input sets
git add inputsets/
git commit -m "feat: Add Terraform plan input sets for all environments"
git push origin main
```

**Use branches for changes:**
```bash
# Create branch for input set updates
git checkout -b update-prod-input-sets
# Modify input sets
git add inputsets/terraform-plan-apply/prod/
git commit -m "chore: Update prod instance types to m5.xlarge"
git push origin update-prod-input-sets
```

## Troubleshooting

### Pipeline Not Found

**Problem:** Command fails with "Pipeline not found" error

**Solution:**
1. Verify pipeline exists in Harness
2. Check org and project identifiers are correct
3. Ensure API access token has read permissions
4. Verify pipeline identifier spelling

### Parameter Type Mismatch

**Problem:** Generated input set has incorrect parameter types

**Solution:**
1. Review pipeline definition for correct types
2. Check for custom type definitions
3. Manually adjust generated YAML
4. Validate against pipeline schema

### Environment Variables Not Populating

**Problem:** Environment-specific values are identical across environments

**Solution:**
1. Check pipeline has environment-specific parameters
2. Review parameter detection logic
3. Manually customize per environment
4. Use environment variable references

### Overlay Not Merging Correctly

**Problem:** Overlay parameters not overriding base input set

**Solution:**
1. Verify overlay references correct base input sets
2. Check parameter paths match exactly
3. Review Harness overlay merge rules
4. Test merge locally before upload

## Related Commands

- `/itg:harness` - Generate complete Harness pipeline templates
- `/itg:harness-template` - Create reusable Harness template definitions
- `/itg:registry:publish` - Publish input sets to template registry
- `/itg:validate` - Validate input set syntax and schema

## Technical Implementation Notes

### Harness API Integration

The command uses Harness API to:
- Retrieve pipeline definitions
- Extract parameter schemas
- Validate input set compatibility
- Upload generated input sets

**Required API Permissions:**
- `core_pipeline_view`
- `core_inputset_create`

### Parameter Type Mapping

| Harness Type | YAML Representation | Validation |
|--------------|---------------------|------------|
| String       | Plain text          | None       |
| Number       | Numeric value       | Range check|
| Boolean      | true/false          | None       |
| Secret       | `<+secrets.getValue("...")>` | Reference check |
| Connector    | `account.connector_id` | Exists check |

### Environment Variable Resolution

Supports Harness expression syntax:
- `<+pipeline.name>` - Pipeline name
- `<+stage.name>` - Stage name
- `<+env.name>` - Environment name
- `<+service.name>` - Service name
- `<+trigger.artifact.tag>` - Trigger artifact tag

## See Also

- **Infrastructure Template Generator Plugin:** `.claude/tools/plugin-cli/infrastructure-template-generator/README.md`
- **Harness Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/harness.md`
- **Harness Template Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/harness-template.md`
- **Harness Input Sets Documentation:** https://developer.harness.io/docs/platform/pipelines/input-sets/
- **Harness Overlays Documentation:** https://developer.harness.io/docs/platform/pipelines/input-sets/#overlay-input-sets
