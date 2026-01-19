---
name: itg:registry:publish
description: Publish infrastructure templates to the registry with versioning and metadata
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: template-path
    description: Path to template directory to publish
    required: true
    type: string
flags:
  - name: version
    description: Semantic version for this template release (e.g., 1.0.0, 2.1.3)
    type: string
    required: true
  - name: status
    description: Template maturity status
    type: choice
    choices: [stable, beta, deprecated]
    default: stable
  - name: category
    description: Template category for organization
    type: string
  - name: tags
    description: Comma-separated tags for searchability
    type: string
  - name: sync-harness
    description: Also sync to Harness Template Library
    type: boolean
    default: false
  - name: changelog
    description: Changelog entry for this version
    type: string
aliases:
  - itg:publish-template
  - itg:registry:push
presets:
  - name: stable-release
    description: Publish stable production-ready template
    flags:
      status: stable
      sync-harness: true
  - name: beta-release
    description: Publish beta template for testing
    flags:
      status: beta
      sync-harness: false
---

# Infrastructure Template Generator: Registry Publish Command

**Best for:** Publishing infrastructure templates to centralized registries with proper versioning, metadata, and discoverability, enabling organization-wide template sharing and standardization.

## Overview

The `itg:registry:publish` command publishes infrastructure templates to the ITG template registry with comprehensive versioning, metadata, and change tracking. It creates a centralized, discoverable catalog of infrastructure templates that teams can search, consume, and contribute to.

**Business Value:**
- Centralized template catalog for organization-wide standardization
- Version control and change tracking for template evolution
- Dependency management between template versions
- Automated documentation generation and maintenance
- Quality gates and approval workflows for template changes
- Integration with Harness Template Library for seamless deployment
- Reduced duplication through template reusability
- Accelerated project onboarding with curated template catalog

## Command Workflow

### Phase 1: Template Validation
1. Load template directory structure
2. Validate required files (cookiecutter.json, README.md, etc.)
3. Check template syntax (Jinja2, YAML, etc.)
4. Verify documentation completeness
5. Validate version format (SemVer)
6. Check for breaking changes vs. previous version

### Phase 2: Metadata Extraction
1. Parse template configuration
2. Extract variable definitions and constraints
3. Identify dependencies and requirements
4. Generate template fingerprint (hash)
5. Collect usage examples and documentation
6. Extract tags and categorization hints

### Phase 3: Version Management
1. Check for existing template versions in registry
2. Validate version increment rules (major.minor.patch)
3. Generate version changelog
4. Update template compatibility matrix
5. Archive previous versions
6. Set deprecation notices if applicable

### Phase 4: Registry Publication
1. Package template with metadata
2. Generate registry entry JSON
3. Upload template artifacts to registry storage
4. Update registry index
5. Generate searchable metadata
6. Create version history entry

### Phase 5: Harness Sync (if enabled)
1. Convert template to Harness format
2. Upload to Harness Template Library
3. Configure template permissions
4. Set up template versioning in Harness
5. Link to registry entry for bidirectional sync

### Phase 6: Documentation & Notification
1. Generate template documentation page
2. Update registry catalog
3. Create release notes
4. Send notification to subscribers
5. Update dependent templates

## Registry Structure

```
registry/
├── index.json                          # Searchable registry index
├── templates/
│   ├── terraform-aws-vpc/
│   │   ├── versions/
│   │   │   ├── 1.0.0/
│   │   │   │   ├── template/          # Template files
│   │   │   │   ├── metadata.json      # Version metadata
│   │   │   │   └── CHANGELOG.md       # Version changelog
│   │   │   ├── 1.1.0/
│   │   │   └── 2.0.0/
│   │   ├── latest -> versions/2.0.0   # Symlink to latest
│   │   └── README.md                  # Template overview
│   ├── kubernetes-deployment/
│   └── docker-compose-stack/
├── categories/
│   ├── terraform/
│   ├── kubernetes/
│   ├── docker/
│   └── harness/
└── metadata/
    ├── dependencies.json              # Dependency graph
    ├── compatibility.json             # Version compatibility
    └── statistics.json                # Usage statistics
```

## Registry Metadata Schema

### Template Registry Entry

```json
{
  "identifier": "terraform-aws-vpc",
  "name": "Terraform AWS VPC Template",
  "description": "Production-ready AWS VPC with public/private subnets, NAT gateways, and VPN support",
  "version": "2.1.0",
  "status": "stable",
  "category": "terraform",
  "tags": [
    "aws",
    "networking",
    "vpc",
    "terraform",
    "multi-az"
  ],
  "author": {
    "name": "Platform Engineering Team",
    "email": "platform@example.com",
    "organization": "Brookside BI"
  },
  "published": "2025-01-15T10:30:00Z",
  "updated": "2025-01-15T10:30:00Z",
  "downloads": 247,
  "rating": 4.8,

  "versions": [
    {
      "version": "2.1.0",
      "status": "stable",
      "published": "2025-01-15T10:30:00Z",
      "changelog": "Added VPN support and improved NAT gateway configuration",
      "breaking_changes": false,
      "deprecated": false
    },
    {
      "version": "2.0.0",
      "status": "stable",
      "published": "2024-12-10T14:20:00Z",
      "changelog": "Major refactor with multi-AZ support",
      "breaking_changes": true,
      "deprecated": false
    },
    {
      "version": "1.2.1",
      "status": "deprecated",
      "published": "2024-10-05T09:15:00Z",
      "changelog": "Security patch for subnet CIDR calculation",
      "breaking_changes": false,
      "deprecated": true,
      "deprecation_reason": "Superseded by v2.0.0 with enhanced features"
    }
  ],

  "requirements": {
    "terraform_version": ">=1.6.0",
    "providers": {
      "aws": ">=5.0.0"
    }
  },

  "variables": {
    "vpc_name": {
      "type": "string",
      "description": "Name of the VPC",
      "required": true,
      "default": null
    },
    "vpc_cidr": {
      "type": "string",
      "description": "CIDR block for VPC",
      "required": true,
      "default": "10.0.0.0/16",
      "validation": "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    },
    "availability_zones": {
      "type": "list",
      "description": "List of availability zones",
      "required": true,
      "default": ["us-east-1a", "us-east-1b", "us-east-1c"]
    },
    "enable_vpn": {
      "type": "boolean",
      "description": "Enable VPN gateway",
      "required": false,
      "default": false
    }
  },

  "dependencies": [],

  "compatibility": {
    "harness_version": ">=1.0.0",
    "cookiecutter_version": ">=2.0.0"
  },

  "files": {
    "template": "s3://itg-registry/templates/terraform-aws-vpc/versions/2.1.0/template.tar.gz",
    "checksum": "sha256:a3f4e8b2c1d6...",
    "size_bytes": 45632
  },

  "documentation": {
    "readme": "https://registry.itg.dev/templates/terraform-aws-vpc/README.md",
    "examples": "https://registry.itg.dev/templates/terraform-aws-vpc/examples",
    "changelog": "https://registry.itg.dev/templates/terraform-aws-vpc/CHANGELOG.md"
  },

  "harness": {
    "synced": true,
    "template_identifier": "terraform_aws_vpc",
    "harness_version": "2.1.0",
    "last_sync": "2025-01-15T10:35:00Z"
  },

  "statistics": {
    "downloads_total": 247,
    "downloads_30d": 42,
    "projects_using": 18,
    "average_rating": 4.8,
    "rating_count": 12
  }
}
```

## Usage Examples

### Basic Template Publication

Publish a template with version and basic metadata:

```bash
/itg:registry:publish ./templates/terraform-aws-vpc \
  --version 2.1.0 \
  --status stable \
  --changelog "Added VPN support and improved NAT gateway configuration"
```

**Expected Output:**
```
Publishing Template to Registry: terraform-aws-vpc
====================================================================

Phase 1: Template Validation
  ✓ Loaded template from ./templates/terraform-aws-vpc
  ✓ Verified required files (cookiecutter.json, README.md, hooks/)
  ✓ Validated Jinja2 syntax in 23 files
  ✓ Checked YAML syntax in 8 files
  ✓ Verified documentation completeness
  ✓ Validated version format: 2.1.0 (SemVer compliant)
  ✓ No breaking changes detected

Phase 2: Metadata Extraction
  ✓ Parsed template configuration
  ✓ Extracted 15 variable definitions
  ✓ Identified 0 dependencies
  ✓ Generated template fingerprint: sha256:a3f4e8b2c1d6...
  ✓ Collected 5 usage examples
  ✓ Extracted tags: aws, networking, vpc, terraform, multi-az

Phase 3: Version Management
  ✓ Found previous versions: 2.0.0, 1.2.1, 1.2.0, 1.1.0, 1.0.0
  ✓ Version increment: 2.0.0 -> 2.1.0 (minor)
  ✓ Generated changelog entry
  ✓ Updated compatibility matrix
  ✓ Previous version (2.0.0) remains stable

Phase 4: Registry Publication
  ✓ Packaged template (45.6 KB)
  ✓ Generated registry entry JSON
  ✓ Uploaded template artifacts to registry storage
  ✓ Updated registry index
  ✓ Generated searchable metadata
  ✓ Created version history entry

Template published successfully!
Registry URL: https://registry.itg.dev/templates/terraform-aws-vpc/2.1.0
Downloads: https://registry.itg.dev/templates/terraform-aws-vpc/2.1.0/download

Next steps:
  1. Share template URL with teams
  2. Update dependent projects if needed
  3. Monitor usage statistics
  4. Gather feedback for future improvements

Users can now consume this template:
  cookiecutter https://registry.itg.dev/templates/terraform-aws-vpc/2.1.0/download
```

### Publish with Category and Tags

Publish with enhanced discoverability metadata:

```bash
/itg:registry:publish ./templates/k8s-microservice \
  --version 1.5.0 \
  --category kubernetes \
  --tags "kubernetes,microservices,deployment,service-mesh,observability" \
  --changelog "Added Istio service mesh support and Prometheus monitoring"
```

**Use Case:** Ensure template is easily discoverable by teams searching for specific technologies.

### Stable Production Release with Harness Sync

Publish production-ready template and sync to Harness:

```bash
/itg:registry:publish ./templates/terraform-gcp-gke \
  --preset stable-release \
  --version 3.0.0 \
  --category terraform \
  --tags "gcp,kubernetes,gke,terraform" \
  --changelog "Major version: GKE 1.29 support, Workload Identity, and enhanced security"
```

**Generated Actions:**
1. Publishes to ITG registry as stable
2. Syncs to Harness Template Library
3. Creates Harness template with proper versioning
4. Configures template permissions
5. Establishes bidirectional sync

**Use Case:** Enterprise-grade template release with full Harness integration for deployment pipelines.

### Beta Release for Testing

Publish beta template for team testing:

```bash
/itg:registry:publish ./templates/docker-compose-nextjs \
  --preset beta-release \
  --version 0.9.0 \
  --category docker \
  --tags "docker,nextjs,react,beta" \
  --changelog "Beta: Next.js 15 support with Turbopack"
```

**Characteristics:**
- Marked as `beta` status
- Not synced to Harness (internal testing only)
- Visible in registry with beta badge
- Excluded from stable template listings

### Deprecate Old Version

Publish new version and mark previous as deprecated:

```bash
/itg:registry:publish ./templates/terraform-aws-ecs \
  --version 4.0.0 \
  --status stable \
  --changelog "Migrated to ECS Fargate with enhanced autoscaling"

# Previous version (3.x.x) automatically marked deprecated in registry
```

## Version Management

### Semantic Versioning Rules

**Major Version (X.0.0):**
- Breaking changes to template structure
- Incompatible variable changes
- Removed or renamed variables
- Changed default behaviors

**Example:**
```bash
/itg:registry:publish ./templates/my-template \
  --version 2.0.0 \
  --changelog "BREAKING: Renamed 'app_name' to 'application_name', removed legacy 'use_old_config' flag"
```

**Minor Version (X.Y.0):**
- New features or variables
- Backward-compatible additions
- Enhanced functionality

**Example:**
```bash
/itg:registry:publish ./templates/my-template \
  --version 1.5.0 \
  --changelog "Added support for multi-region deployments, new variables: 'secondary_region', 'enable_replication'"
```

**Patch Version (X.Y.Z):**
- Bug fixes
- Documentation updates
- Security patches
- No new features

**Example:**
```bash
/itg:registry:publish ./templates/my-template \
  --version 1.4.3 \
  --changelog "Fixed CIDR block calculation bug, updated documentation for AWS region constraints"
```

### Version Compatibility Matrix

Registry automatically generates compatibility matrix:

```json
{
  "terraform-aws-vpc": {
    "2.1.0": {
      "compatible_with": ["2.0.0"],
      "breaking_changes_from": ["1.x.x"],
      "upgrade_path": {
        "from_1.x.x": "Manual migration required, see migration guide",
        "from_2.0.0": "Direct upgrade, no changes needed"
      }
    }
  }
}
```

## Harness Template Library Integration

### Sync Process

When `--sync-harness` is enabled:

1. **Template Conversion:**
   - Convert Cookiecutter template to Harness template format
   - Map variables to Harness runtime inputs
   - Convert hooks to Harness custom steps

2. **Upload to Harness:**
   ```bash
   # Automated by command
   harness template create \
     --identifier terraform_aws_vpc \
     --name "Terraform AWS VPC" \
     --version 2.1.0 \
     --type Stage \
     --file ./converted-harness-template.yaml
   ```

3. **Version Management:**
   - Create new Harness template version
   - Link to ITG registry version
   - Set up version labels (stable, latest)

4. **Permissions:**
   - Configure organization/project scope
   - Set up RBAC permissions
   - Enable template sharing

### Harness Template Format

```yaml
template:
  name: Terraform AWS VPC
  identifier: terraform_aws_vpc
  versionLabel: 2.1.0
  type: Stage
  projectIdentifier: platform_engineering
  orgIdentifier: engineering
  tags:
    itg_registry_id: terraform-aws-vpc
    itg_version: 2.1.0
  spec:
    type: Custom
    spec:
      execution:
        steps:
          - step:
              type: ShellScript
              name: Generate Project from Template
              identifier: generate_project
              spec:
                shell: Bash
                onDelegate: true
                source:
                  type: Inline
                  spec:
                    script: |
                      #!/bin/bash
                      # Download template from ITG registry
                      curl -o template.tar.gz https://registry.itg.dev/templates/terraform-aws-vpc/2.1.0/download
                      tar -xzf template.tar.gz

                      # Generate project with cookiecutter
                      cookiecutter ./terraform-aws-vpc \
                        --no-input \
                        vpc_name="<+input>" \
                        vpc_cidr="<+input>" \
                        availability_zones="<+input>" \
                        enable_vpn="<+input>"
                environmentVariables: []
                outputVariables:
                  - name: project_path
                    type: String
                    value: output.project_path
```

## Template Catalog & Search

### Registry Index Structure

```json
{
  "version": "1.0.0",
  "last_updated": "2025-01-15T10:30:00Z",
  "total_templates": 47,
  "templates": [
    {
      "id": "terraform-aws-vpc",
      "name": "Terraform AWS VPC Template",
      "category": "terraform",
      "latest_version": "2.1.0",
      "status": "stable",
      "downloads": 247,
      "rating": 4.8,
      "tags": ["aws", "networking", "vpc", "terraform", "multi-az"]
    }
  ],
  "categories": [
    {
      "name": "terraform",
      "count": 18,
      "description": "Terraform infrastructure templates"
    },
    {
      "name": "kubernetes",
      "count": 12,
      "description": "Kubernetes deployment templates"
    }
  ]
}
```

### Search Integration

Registry provides REST API for template search:

```bash
# Search by keyword
curl https://registry.itg.dev/api/v1/search?q=aws+vpc

# Filter by category
curl https://registry.itg.dev/api/v1/search?category=terraform

# Filter by tags
curl https://registry.itg.dev/api/v1/search?tags=kubernetes,microservices

# Sort by popularity
curl https://registry.itg.dev/api/v1/search?sort=downloads

# Get template details
curl https://registry.itg.dev/api/v1/templates/terraform-aws-vpc

# Get specific version
curl https://registry.itg.dev/api/v1/templates/terraform-aws-vpc/2.1.0
```

## Best Practices

### Version Numbering Strategy

**Pre-1.0.0 (Beta/Alpha):**
- `0.1.0` - Initial development
- `0.5.0` - Feature-complete alpha
- `0.9.0` - Release candidate
- `1.0.0` - First stable release

**Post-1.0.0:**
- Increment major for breaking changes
- Increment minor for new features
- Increment patch for bug fixes

### Changelog Quality

**Good changelog entries:**
- ✅ "Added VPN support with VGW and CGW configuration"
- ✅ "BREAKING: Renamed 'environment' variable to 'deployment_environment'"
- ✅ "Fixed CIDR block overlap validation logic"
- ✅ "Improved documentation for multi-AZ subnet configuration"

**Poor changelog entries:**
- ❌ "Updates"
- ❌ "Bug fixes"
- ❌ "Changes"

### Tagging Strategy

**Use specific, searchable tags:**
- Technology: `terraform`, `kubernetes`, `docker`, `ansible`
- Cloud provider: `aws`, `azure`, `gcp`, `multi-cloud`
- Use case: `networking`, `security`, `monitoring`, `ci-cd`
- Complexity: `beginner`, `intermediate`, `advanced`
- Pattern: `microservices`, `serverless`, `container`, `vm`

### Documentation Requirements

**Before publishing, ensure template includes:**
- ✅ Comprehensive README.md
- ✅ VARIABLES.md with all variable documentation
- ✅ EXAMPLES.md with usage scenarios
- ✅ CONTRIBUTING.md for maintainers
- ✅ CHANGELOG.md with version history
- ✅ LICENSE file
- ✅ Inline code comments

### Status Lifecycle

```
beta -> stable -> deprecated -> archived
```

**Beta (0.x.x or flagged):**
- Active development
- Breaking changes allowed
- Limited distribution

**Stable (1.x.x+):**
- Production-ready
- SemVer compliance required
- Wide distribution

**Deprecated:**
- Superseded by newer version
- Maintenance mode only
- Migration guide provided

**Archived:**
- No longer maintained
- Removed from search results
- Historical access only

## Troubleshooting

### Version Already Exists

**Problem:** Attempting to publish version that already exists in registry

**Solution:**
1. Check existing versions: `curl https://registry.itg.dev/api/v1/templates/{template-id}/versions`
2. Increment version number appropriately
3. Use patch version for minor updates
4. Use minor/major for new features/breaking changes

### Template Validation Fails

**Problem:** Template fails validation during publication

**Solution:**
1. Review validation errors in output
2. Common issues:
   - Missing required files (README.md, cookiecutter.json)
   - Invalid Jinja2 syntax
   - Malformed YAML
   - Incomplete documentation
3. Fix issues and republish

### Harness Sync Fails

**Problem:** Template publishes to registry but Harness sync fails

**Solution:**
1. Verify Harness API credentials configured
2. Check organization/project permissions
3. Review Harness template format conversion
4. Manually upload to Harness if needed
5. Check Harness API logs for errors

### Dependency Resolution Issues

**Problem:** Template depends on other templates that don't exist or are wrong version

**Solution:**
1. Publish dependency templates first
2. Verify dependency versions exist in registry
3. Update dependency constraints in template
4. Use version ranges for flexibility

## Related Commands

- `/itg:registry:search` - Search template registry catalog
- `/itg:generate` - Generate templates (typically published after generation)
- `/itg:validate` - Validate template before publishing
- `/itg:harness-template` - Create Harness-specific templates

## Technical Implementation Notes

### Registry Storage

**Storage Backend:**
- S3-compatible object storage for template artifacts
- PostgreSQL for metadata and search index
- Redis for caching and statistics

**File Structure:**
```
s3://itg-registry/
├── templates/
│   └── {template-id}/
│       └── versions/
│           └── {version}/
│               ├── template.tar.gz
│               ├── metadata.json
│               └── checksums.txt
```

### Security

**Authentication:**
- API token required for publishing
- RBAC for template permissions
- Template signing with GPG keys

**Validation:**
- Template scanning for secrets
- Dependency vulnerability checks
- Malware scanning

### Statistics Tracking

Registry tracks:
- Download counts (total, 30-day, 7-day)
- Project usage (how many projects use template)
- Ratings and reviews
- Search frequency
- Version adoption rates

## See Also

- **Infrastructure Template Generator Plugin:** `.claude/tools/plugin-cli/infrastructure-template-generator/README.md`
- **Registry Search Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/registry-search.md`
- **Generate Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/generate.md`
- **Semantic Versioning:** https://semver.org/
- **Harness Templates:** https://developer.harness.io/docs/platform/templates/template/
