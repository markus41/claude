# /itg:environment

Generate Harness environment configurations with infrastructure definitions and service overrides.

## Aliases
- `/itg:env`
- `/itg:harness-env`

## Description

Creates complete Harness environment configurations for multi-stage deployment pipelines. Generates environment YAML files with infrastructure definitions, service overrides, and environment-specific configuration values.

**Best for:**
- Setting up deployment environments (dev, staging, prod)
- Standardizing environment configurations across services
- Managing environment-specific overrides and variables
- Establishing infrastructure definitions per environment

## Arguments

### service-name (required)
- **Type:** string
- **Description:** Name of the service these environments are associated with
- **Example:** `payment-api`, `frontend-app`, `data-processor`

## Flags

### --envs
- **Type:** string
- **Default:** `dev,staging,prod`
- **Description:** Comma-separated list of environment names to generate
- **Example:** `--envs dev,qa,staging,prod`, `--envs local,dev`

### --type
- **Type:** choice
- **Options:** `production`, `pre-production`
- **Default:** `pre-production` for dev/staging, `production` for prod
- **Description:** Environment classification (auto-detected based on name)
- **Example:** `--type production`

### --output
- **Type:** string
- **Default:** `./environments`
- **Description:** Output directory for generated environment configurations
- **Example:** `--output ./harness/environments`

### --infrastructure-type
- **Type:** choice
- **Options:** `kubernetes`, `serverless`, `ssh`, `winrm`
- **Default:** `kubernetes`
- **Description:** Type of infrastructure for deployments
- **Example:** `--infrastructure-type kubernetes`

### --include-overrides
- **Type:** boolean
- **Default:** `true`
- **Description:** Generate service override files for environment-specific values
- **Example:** `--include-overrides false`

### --org
- **Type:** string
- **Description:** Harness organization identifier (required for API sync)
- **Example:** `--org my-organization`

### --project
- **Type:** string
- **Description:** Harness project identifier (required for API sync)
- **Example:** `--project backend-services`

## Usage Examples

### Standard Multi-Environment Setup

```bash
/itg:environment payment-api
```

Generates dev, staging, and prod environments with default Kubernetes infrastructure.

### Custom Environment List

```bash
/itg:environment frontend-app --envs local,dev,qa,staging,prod --output ./deployment/environments
```

Creates five environments with Kubernetes infrastructure and service overrides.

### Production Environment with Serverless

```bash
/itg:environment api-gateway --envs prod --type production --infrastructure-type serverless
```

Generates a production-grade serverless environment configuration.

### Environments Without Overrides

```bash
/itg:environment data-processor --envs dev,prod --include-overrides false
```

Creates environments without service-specific override files (uses service defaults).

### Full Configuration with Organization Context

```bash
/itg:environment payment-api --envs dev,staging,prod --org production --project payments --infrastructure-type kubernetes
```

Generates complete environment setup with organization and project context for API sync.

## Output Structure

```
{output}/{service-name}/
├── dev/
│   ├── environment.yaml          # Environment definition
│   ├── infrastructure-def.yaml   # Infrastructure configuration
│   └── service-overrides.yaml    # Service-specific overrides (optional)
├── staging/
│   ├── environment.yaml
│   ├── infrastructure-def.yaml
│   └── service-overrides.yaml
└── prod/
    ├── environment.yaml
    ├── infrastructure-def.yaml
    └── service-overrides.yaml
```

## Generated Environment Configuration

Each environment includes:

- **Environment Metadata**: Name, description, type (production/pre-production), tags
- **Infrastructure Definition**:
  - Kubernetes: Cluster, namespace, release name
  - Serverless: Provider, region, stage configuration
  - SSH/WinRM: Host configurations, credentials
- **Service Overrides**: Environment-specific variables, resource limits, replica counts
- **Configuration Variables**: Database URLs, API endpoints, feature flags
- **GitOps Settings**: Repository paths, sync policies (if service uses GitOps)

## Environment Type Auto-Detection

The command intelligently sets environment types based on naming:

| Environment Name | Detected Type | Characteristics |
|-----------------|---------------|-----------------|
| `dev`, `development` | Pre-production | Lower resources, debug enabled |
| `qa`, `test`, `staging` | Pre-production | Testing configurations |
| `prod`, `production` | Production | High availability, monitoring |
| `local` | Pre-production | Local development settings |

Override auto-detection with `--type` flag for custom naming.

## Service Override Examples

Generated override files include environment-specific values:

**Dev Environment:**
- Replica count: 1
- Resource limits: Low
- Debug logging: Enabled
- Feature flags: All enabled

**Staging Environment:**
- Replica count: 2
- Resource limits: Medium
- Debug logging: Conditional
- Feature flags: Beta features enabled

**Production Environment:**
- Replica count: 3+ (high availability)
- Resource limits: High
- Debug logging: Disabled
- Feature flags: Stable features only

## Validation

The command validates:
- Service name exists (if generated with `/itg:service`)
- Environment names follow Harness conventions
- Infrastructure type compatibility with service manifest type
- Output directory is writable
- Organization and project exist (when provided)

## Integration with Services

Ensure service is created first:

```bash
# 1. Generate service
/itg:service payment-api --manifest-type kubernetes

# 2. Generate environments
/itg:environment payment-api --envs dev,staging,prod
```

## Infrastructure Type Matching

Match infrastructure type to service manifest type:

| Service Manifest | Compatible Infrastructure Types |
|-----------------|--------------------------------|
| `kubernetes` | `kubernetes` |
| `helm` | `kubernetes` |
| `kustomize` | `kubernetes` |
| `serverless` | `serverless` |
| `ecs` | `kubernetes` (EKS) |

## Related Commands

- `/itg:service` - Generate service definition first
- `/itg:pipeline` - Create deployment pipelines using these environments
- `/itg:validate` - Validate generated environment configurations

## Notes

- Environment configurations include placeholder values for infrastructure identifiers
- Kubernetes infrastructure requires cluster connector configuration in Harness
- Service overrides use hierarchical precedence (service defaults < environment overrides)
- Production environments automatically include additional monitoring and alerting tags
- All generated files follow Harness YAML schema v0 specification

## Troubleshooting

**Issue:** Environment names conflict with existing environments
**Solution:** Use project-scoped or namespaced environment naming

**Issue:** Infrastructure type mismatch with service
**Solution:** Ensure infrastructure type matches service manifest type

**Issue:** Service overrides not applying
**Solution:** Verify override file paths and service association in environment YAML

**Issue:** Missing infrastructure connectors
**Solution:** Configure Kubernetes/cloud connectors in Harness before deploying

## Best Practices

1. **Consistent Naming**: Use standard environment names across services
2. **Override Hierarchy**: Define common values in service, specific values in overrides
3. **Resource Planning**: Size environments appropriately (dev < staging < prod)
4. **Secret Management**: Use Harness secrets for sensitive configuration
5. **GitOps Integration**: Enable for production environments with change tracking
