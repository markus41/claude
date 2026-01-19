# /itg:service

Generate Harness service definitions with configurable manifest and artifact types.

## Aliases
- `/itg:svc`
- `/itg:harness-service`

## Description

Creates production-ready Harness service definitions optimized for your deployment strategy. Generates service YAML configurations with proper artifact sources, manifest types, and optional GitOps integration.

**Best for:**
- Setting up new microservices in Harness
- Standardizing service definitions across teams
- Bootstrapping CI/CD pipelines with consistent service configurations
- Migrating existing services to Harness

## Arguments

### name (required)
- **Type:** string
- **Description:** Name of the service to generate
- **Example:** `payment-api`, `frontend-app`, `data-processor`

## Flags

### --manifest-type
- **Type:** choice
- **Options:** `kubernetes`, `helm`, `kustomize`, `serverless`, `ecs`
- **Default:** `kubernetes`
- **Description:** Type of deployment manifest to configure
- **Example:** `--manifest-type helm`

### --artifact-type
- **Type:** choice
- **Options:** `docker`, `gcr`, `acr`, `ecr`, `artifactory`
- **Default:** `docker`
- **Description:** Container registry type for artifact sources
- **Example:** `--artifact-type gcr`

### --output
- **Type:** string
- **Default:** `./services`
- **Description:** Output directory for generated service definitions
- **Example:** `--output ./harness/services`

### --gitops
- **Type:** boolean
- **Default:** `false`
- **Description:** Include GitOps configuration and repository references
- **Example:** `--gitops`

### --org
- **Type:** string
- **Description:** Harness organization identifier (required for API sync)
- **Example:** `--org my-organization`

### --project
- **Type:** string
- **Description:** Harness project identifier (required for API sync)
- **Example:** `--project backend-services`

## Usage Examples

### Basic Kubernetes Service

```bash
/itg:service payment-api
```

Generates a standard Kubernetes service definition with Docker artifact source.

### Helm Service with GitOps

```bash
/itg:service frontend-app --manifest-type helm --gitops --output ./deployment/services
```

Creates a Helm-based service with GitOps configuration for declarative deployments.

### ECS Service with ECR Registry

```bash
/itg:service data-processor --manifest-type ecs --artifact-type ecr --org production --project data-platform
```

Generates an ECS service definition configured for AWS ECR registry with organization and project context.

### Serverless Service

```bash
/itg:service api-gateway --manifest-type serverless --artifact-type artifactory
```

Creates a serverless service definition with Artifactory artifact source.

## Output Structure

```
{output}/
├── {service-name}/
│   ├── service.yaml           # Main service definition
│   ├── artifact-source.yaml   # Artifact source configuration
│   ├── manifest-config.yaml   # Manifest configuration
│   └── gitops.yaml            # GitOps config (if --gitops enabled)
```

## Generated Service Configuration

The command generates a complete Harness service with:

- **Service Metadata**: Name, description, tags
- **Artifact Source**: Configured for specified registry type
- **Manifest Configuration**: Deployment strategy based on manifest type
- **GitOps Integration**: Repository references and sync policies (optional)
- **Service Variables**: Placeholder variables for environment-specific values
- **Configuration Files**: References to config maps and secrets

## Validation

The command validates:
- Service name follows Harness naming conventions
- Organization and project exist (when provided)
- Output directory is writable
- Manifest and artifact type compatibility
- GitOps requirements (repository URL, branch) when enabled

## Integration with Environments

After generating a service, create associated environments with:

```bash
/itg:environment {service-name} --envs dev,staging,prod
```

## Related Commands

- `/itg:environment` - Generate environment configurations for this service
- `/itg:pipeline` - Create deployment pipelines for this service
- `/itg:validate` - Validate generated service definitions

## Notes

- Service definitions use placeholder values that should be customized for your environment
- GitOps integration requires repository URL configuration
- Organization and project flags enable direct API sync to Harness
- All generated files follow Harness YAML schema v0 specification

## Troubleshooting

**Issue:** Service name conflicts with existing service
**Solution:** Use unique service names or namespace with project prefix

**Issue:** GitOps flag requires additional configuration
**Solution:** Ensure repository URL and credentials are configured in Harness

**Issue:** Manifest type not supported for artifact type
**Solution:** Verify compatibility matrix in Harness documentation
