---
description: Publish pipeline/template directly to Harness via API
aliases: [itg:publish, itg:deploy-harness]
---

# ITG Harness Publish

Publish infrastructure templates, pipelines, services, or environments directly to Harness via API without requiring git workflow.

**Best for:** Direct deployment of validated Harness configurations to specific organizations and projects, bypassing git-based sync for rapid iteration or emergency updates.

## Usage

```bash
/itg:harness:publish <file> --type pipeline --org my-org --project my-project [--account acc-id] [--dry-run] [--validate-only] [--force]
```

## Arguments

- `file` (required) - Path to YAML file to publish (relative or absolute)

## Flags

- `--type <choice>` - Type of Harness entity (required)
  - `pipeline` - Harness CD/CI pipeline
  - `template` - Reusable template
  - `service` - Service definition
  - `environment` - Environment configuration
  - Default: `pipeline`

- `--org <string>` - Harness organization identifier (required)
- `--project <string>` - Harness project identifier (required)
- `--account <string>` - Override default account ID from config
- `--dry-run` - Validate and show what would be published without making changes
- `--validate-only` - Run validation checks only, don't publish
- `--force` - Overwrite existing entity if it already exists

## Examples

### Publish new pipeline
```bash
/itg:harness:publish pipelines/deployment.yaml \
  --type pipeline \
  --org integration-engine \
  --project prod-services
```

### Publish template with dry-run
```bash
/itg:harness:publish templates/terraform-provision.yaml \
  --type template \
  --org platform \
  --project infrastructure \
  --dry-run
```

### Update existing service (force overwrite)
```bash
/itg:harness:publish services/api-gateway.yaml \
  --type service \
  --org backend \
  --project microservices \
  --force
```

### Validate environment configuration only
```bash
/itg:harness:publish environments/production.yaml \
  --type environment \
  --org operations \
  --project deployments \
  --validate-only
```

### Publish to specific account
```bash
/itg:harness:publish pipelines/multi-region-deploy.yaml \
  --type pipeline \
  --org global-ops \
  --project regional-services \
  --account px7xd_BFRCi-pfWPYXVjvw
```

### Emergency hotfix deployment
```bash
/itg:harness:publish pipelines/hotfix-rollback.yaml \
  --type pipeline \
  --org production \
  --project critical-services \
  --force
```

## Workflow

The command executes the following steps:

1. **File Validation**
   - Verify file exists and is readable
   - Parse YAML and validate structure
   - Check for required Harness fields (name, identifier, type)

2. **Pre-publish Checks**
   - Validate Harness API credentials
   - Verify organization and project exist
   - Check if entity already exists (unless --force)
   - Validate entity-specific requirements

3. **Schema Validation**
   - Validate against Harness API schema
   - Check field types and required properties
   - Verify relationships (e.g., service references in pipeline)
   - Validate expressions and runtime inputs

4. **Dry-run Mode** (if --dry-run)
   - Show full API request payload
   - Display what would be created/updated
   - Validate without making changes
   - Exit without publishing

5. **API Publishing**
   - Authenticate with Harness API
   - Transform YAML to Harness API format
   - POST or PUT based on existence check
   - Handle versioning and metadata

6. **Verification**
   - Confirm entity created/updated in Harness
   - Retrieve entity URL
   - Display access details
   - Log publish event

7. **Output**
   - Show publish status
   - Display entity URL in Harness UI
   - List any warnings or recommendations
   - Provide rollback instructions if applicable

## Entity Type Requirements

### Pipeline (`--type pipeline`)
Required fields:
- `name` - Pipeline display name
- `identifier` - Unique pipeline ID
- `stages` - Array of pipeline stages

Optional:
- `description` - Pipeline description
- `tags` - Key-value tags
- `variables` - Pipeline variables

### Template (`--type template`)
Required fields:
- `name` - Template name
- `identifier` - Unique template ID
- `type` - Template type (Step, Stage, Pipeline)
- `spec` - Template specification

Optional:
- `versionLabel` - Template version
- `tags` - Template tags

### Service (`--type service`)
Required fields:
- `name` - Service name
- `identifier` - Unique service ID

Optional:
- `description` - Service description
- `tags` - Service tags
- `serviceDefinition` - Deployment type config

### Environment (`--type environment`)
Required fields:
- `name` - Environment name
- `identifier` - Unique environment ID
- `type` - Environment type (Production, PreProduction)

Optional:
- `description` - Environment description
- `tags` - Environment tags
- `variables` - Environment variables

## Agent Assignment

This command activates the **itg-harness-publisher** agent for execution.

## Prerequisites

- Harness API key configured in environment or `.itg/config.json`
- Network access to Harness API endpoints
- Valid organization and project identifiers
- Appropriate Harness permissions for entity type

## Configuration

API credentials are loaded from `.itg/config.json`:

```json
{
  "harness": {
    "apiKey": "pat.xxxxx.xxxxx",
    "accountId": "px7xd_BFRCi-pfWPYXVjvw",
    "apiUrl": "https://app.harness.io/gateway",
    "defaultOrg": "integration-engine",
    "defaultProject": "infrastructure",
    "validateBeforePublish": true,
    "createBackup": true
  }
}
```

Alternatively, set environment variables:
```bash
export HARNESS_API_KEY="pat.xxxxx.xxxxx"
export HARNESS_ACCOUNT_ID="px7xd_BFRCi-pfWPYXVjvw"
```

## Validation Rules

The command performs comprehensive validation:

### Syntax Validation
- Valid YAML structure
- No duplicate keys
- Proper indentation
- Valid UTF-8 encoding

### Schema Validation
- Required fields present
- Field types match schema
- Valid enums and choices
- Proper nesting structure

### Semantic Validation
- Referenced entities exist (services, environments, connectors)
- Variable references are valid
- Expression syntax correct
- No circular dependencies

### Harness-Specific
- Identifiers match naming conventions
- Tags format valid
- Runtime input fields properly defined
- Approval steps configured correctly

## Dry-run Output

When using `--dry-run`, the command shows:

```yaml
# API Request Details
Endpoint: POST /v1/orgs/integration-engine/projects/infrastructure/pipelines
Method: POST

# Request Headers
Content-Type: application/json
x-api-key: [REDACTED]

# Request Payload
{
  "pipeline": {
    "name": "Terraform Deployment",
    "identifier": "terraform_deploy",
    "orgIdentifier": "integration-engine",
    "projectIdentifier": "infrastructure",
    "stages": [...]
  }
}

# What Would Happen
✓ New pipeline would be created
✓ No existing pipeline to overwrite
✓ All validations passed
⚠ Warning: Pipeline references connector 'aws-prod' - ensure it exists

# To actually publish, run without --dry-run
```

## Error Handling

The command provides detailed error messages:

- **File not found**: Shows absolute path attempted and suggests corrections
- **Invalid YAML**: Shows line/column of syntax error with context
- **Schema validation failure**: Lists all field issues with remediation steps
- **API authentication failure**: Provides credential configuration instructions
- **Entity already exists**: Shows existing entity details and suggests --force or different identifier
- **Referenced entity not found**: Lists missing dependencies with suggestions
- **API rate limit**: Shows retry-after time and suggests batching

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to git
   - Store in `.itg/config.json` (add to .gitignore)
   - Use environment variables for CI/CD
   - Rotate keys regularly

2. **Force Flag Caution**
   - `--force` overwrites production pipelines
   - Always use `--dry-run` first
   - Consider backup before force updates
   - Requires confirmation for production orgs

3. **Validation Bypass**
   - Command never allows skipping schema validation
   - `--validate-only` prevents accidental publishes
   - Validates secrets/credentials not in plain text

## Rollback Procedure

If publish causes issues:

1. **Via Harness UI**
   - Navigate to published entity
   - View version history
   - Restore previous version

2. **Via API** (automated rollback)
   ```bash
   /itg:harness:rollback <entity-type> <identifier> \
     --org integration-engine \
     --project infrastructure \
     --to-version 3
   ```

3. **Re-publish Previous Version**
   ```bash
   /itg:harness:publish backups/pipeline-v3.yaml \
     --type pipeline \
     --org integration-engine \
     --project infrastructure \
     --force
   ```

## Output Format

### Success
```
✓ File validated: pipelines/deployment.yaml
✓ YAML parsed successfully
✓ Schema validation passed
✓ Pre-publish checks completed
  - Organization: integration-engine ✓
  - Project: infrastructure ✓
  - Entity does not exist (new creation)

Publishing to Harness...

✓ Pipeline published successfully
  - Name: Terraform Deployment
  - Identifier: terraform_deploy
  - Version: 1
  - URL: https://app.harness.io/ng/#/account/px7xd_BFRCi-pfWPYXVjvw/cd/orgs/integration-engine/projects/infrastructure/pipelines/terraform_deploy

Next steps:
  View in Harness: [Open URL]
  Execute pipeline: /itg:harness:execute terraform_deploy --org integration-engine --project infrastructure
```

### Validation Errors
```
✗ Validation failed for pipelines/deployment.yaml

Errors (3):
  1. Line 12: Missing required field 'identifier'
  2. Line 45: Invalid stage type 'CustomDeploy' (must be: Deployment, Approval, Custom)
  3. Line 78: Referenced service 'api-gateway' not found in project

Fix these issues and try again.
```

## Best Practices

1. **Always validate first**
   ```bash
   /itg:harness:publish file.yaml --validate-only
   ```

2. **Use dry-run before production**
   ```bash
   /itg:harness:publish file.yaml --dry-run
   ```

3. **Tag entities appropriately**
   - Include version tags
   - Add owner/team tags
   - Mark environment applicability

4. **Test in lower environments first**
   - Publish to dev/staging before production
   - Verify execution in non-prod
   - Use same file with environment-specific projects

5. **Backup before force updates**
   - Download existing entity before overwriting
   - Store in version control
   - Document reason for force update

6. **Use descriptive identifiers**
   - Follow naming convention: `{service}_{type}_{env}`
   - Example: `api_gateway_deploy_prod`
   - Avoid generic names like `pipeline1`

## Related Commands

- `/itg:validate` - Validate Harness YAML before publishing
- `/itg:harness:list` - List existing entities in org/project
- `/itg:harness:get` - Download entity from Harness
- `/itg:harness:execute` - Execute published pipeline
- `/itg:harness:rollback` - Rollback to previous version
- `/itg:repo:pr` - Create PR for git-based sync

## Performance Considerations

- **Large files**: Pipelines >1MB may take longer to publish
- **API rate limits**: Max 100 requests per minute per account
- **Validation time**: Complex pipelines may take 10-30s to validate
- **Batch publishing**: Use separate commands in parallel for multiple files

## Troubleshooting

### "Organization not found"
- Verify org identifier (case-sensitive)
- Check API key has access to org
- List orgs: `/itg:harness:list-orgs`

### "API authentication failed"
- Check API key is valid and not expired
- Verify account ID matches API key
- Regenerate key if needed

### "Schema validation failed"
- Update to latest Harness schema
- Check Harness API documentation for changes
- Use `/itg:harness:schema pipeline` to see current schema

### "Referenced entity not found"
- Create dependencies first (connectors, secrets)
- Use correct identifiers (check spelling)
- Verify entity exists in same org/project
