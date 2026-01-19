---
name: itg:repo:scaffold
description: Apply infrastructure template to an existing repository with configurable merge strategies
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: template
    description: Template name from registry or path to custom template directory
    required: true
    type: string
flags:
  - name: target
    description: Target directory to apply template (default: current directory)
    type: string
  - name: merge-strategy
    description: How to handle existing files
    type: choice
    choices: [overwrite, skip, merge]
    default: merge
  - name: variables
    description: JSON string of template variables for substitution
    type: string
  - name: dry-run
    description: Preview changes without applying them
    type: boolean
    default: false
presets:
  - name: microservice
    description: Apply microservice template with Docker and CI/CD
    flags:
      template: service
      merge-strategy: merge
  - name: add-ci
    description: Add CI/CD pipelines to existing repository
    flags:
      template: ci-cd
      merge-strategy: skip
  - name: add-docker
    description: Add Docker configuration to existing repository
    flags:
      template: docker
      merge-strategy: merge
aliases:
  - itg:scaffold
  - itg:apply-template
---

# /itg:repo:scaffold - Apply Template to Existing Repository

## Purpose

The `/itg:repo:scaffold` command applies infrastructure templates to existing repositories, adding missing configurations, standardizing project structure, and modernizing legacy codebases. Unlike `/itg:repo:init` which creates new repositories, this command enhances existing projects with proven patterns and best practices while preserving your existing code and configuration.

**Best for:**
- Adding CI/CD pipelines to repositories without automation
- Standardizing project structure across multiple repositories
- Modernizing legacy codebases with current best practices
- Adding Docker/Kubernetes support to existing applications
- Applying organization-wide configuration standards
- Migrating repositories to new infrastructure patterns

## Command Workflow

When you run `/itg:repo:scaffold`, the following steps occur:

### 1. Template Loading and Validation
- Resolves template name from registry or loads from custom path
- Validates template structure and required files
- Checks template compatibility with target repository
- Loads template variables and substitution rules
- Verifies all template dependencies are available

### 2. Target Repository Analysis
- Scans target directory for existing files and structure
- Identifies project type and technology stack
- Detects existing configuration files
- Maps current directory structure
- Identifies potential conflicts with template files

### 3. Variable Substitution Planning
- Parses `--variables` JSON or prompts for required values
- Extracts variables from target repository (project name, etc.)
- Validates all required template variables are provided
- Prepares variable substitution map
- Generates preview of variable replacements

### 4. Merge Strategy Application
- **Overwrite**: Replaces existing files with template versions
  - Backs up existing files to `.scaffold-backup/`
  - Completely replaces file content
  - Use when standardizing across all repositories

- **Skip**: Preserves existing files, only adds new ones
  - Leaves existing files untouched
  - Only creates files that don't exist
  - Use when adding new capabilities without disrupting current setup

- **Merge** (Default): Intelligently combines existing and template content
  - Preserves existing configuration while adding new sections
  - Merges package.json dependencies and scripts
  - Combines environment variables and config files
  - Maintains existing code while adding infrastructure
  - Use for most scenarios to get best of both worlds

### 5. File Operations (or Dry Run Preview)
- Creates backup of existing files (if overwriting)
- Applies template files with variable substitution
- Merges configuration files (JSON, YAML, etc.)
- Updates package.json, requirements.txt, etc.
- Creates new directories if needed
- Preserves file permissions and attributes

### 6. Post-Scaffold Configuration
- Updates repository documentation (README.md)
- Generates CHANGELOG entry for template application
- Configures new CI/CD pipelines
- Updates `.gitignore` with template patterns
- Creates PR template for template adoption review

### 7. Validation and Testing
- Validates generated configuration files (syntax check)
- Runs linters on new files
- Checks for broken dependencies
- Verifies CI/CD pipeline syntax
- Reports any issues or warnings

### 8. Obsidian Documentation Update
- Documents template application in repository notes
- Records template version and application date
- Links to template documentation
- Notes any manual steps required
- Updates repository metadata

## Usage Examples

### Basic Template Application (Current Directory)

```bash
/itg:repo:scaffold service
```

**Output:**
```
🔧 Scaffolding template: service

Target: C:\Users\MarkusAhling\projects\my-service (current directory)
Template: service (Node.js microservice)
Merge Strategy: merge (preserve existing, add new)

📊 Analyzing target repository...
  ✓ Detected: Node.js project (package.json found)
  ✓ Project name: my-service
  ✓ Existing files: 47
  ✓ Existing directories: 12

📋 Template Preview:
  Files to add:
    + .github/workflows/ci.yml
    + .github/workflows/deploy.yml
    + Dockerfile
    + docker-compose.yml
    + .dockerignore
    + .vscode/settings.json
    + .vscode/launch.json

  Files to merge:
    ~ package.json (add scripts, dependencies)
    ~ .gitignore (add patterns)
    ~ README.md (add sections)
    ~ tsconfig.json (merge compiler options)

  Files to preserve:
    ✓ src/ (all existing code)
    ✓ tests/ (existing tests)
    ✓ .env.local (local configuration)

🔀 Applying merge strategy: merge

  ✓ Created .github/workflows/ci.yml
  ✓ Created .github/workflows/deploy.yml
  ✓ Created Dockerfile
  ✓ Created docker-compose.yml
  ✓ Created .dockerignore
  ✓ Created .vscode/settings.json
  ✓ Created .vscode/launch.json
  ✓ Merged package.json (added 8 scripts, 12 dependencies)
  ✓ Merged .gitignore (added 15 patterns)
  ✓ Merged README.md (added Development, Deployment sections)
  ✓ Merged tsconfig.json (updated compiler options)

✅ Scaffolding complete!

Summary:
  Files added: 7
  Files merged: 4
  Files preserved: 47
  Backup created: .scaffold-backup/ (2026-01-19-10-30-00)

Next Steps:
  1. Review changes: git diff
  2. Install new dependencies: npm install
  3. Test CI pipeline: .github/workflows/ci.yml
  4. Build Docker image: docker-compose build
  5. Commit changes: git add . && git commit -m "Apply service template"

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\my-service.md
```

### Dry Run to Preview Changes

```bash
/itg:repo:scaffold service --dry-run
```

**Output:**
```
🔍 DRY RUN MODE: No files will be modified

Target: C:\Users\MarkusAhling\projects\my-service
Template: service
Merge Strategy: merge

📊 Analysis Results:
  Project Type: Node.js (TypeScript)
  Existing Files: 47
  Template Files: 23

🔮 Planned Changes:

NEW FILES (would be created):
  + .github/workflows/ci.yml
    Purpose: Continuous Integration pipeline
    Content: Build, test, lint on every PR

  + .github/workflows/deploy.yml
    Purpose: Deployment pipeline
    Content: Deploy to dev/staging/prod on merge

  + Dockerfile
    Purpose: Container image definition
    Content: Multi-stage Node.js build

  + docker-compose.yml
    Purpose: Local development environment
    Content: Service + database + redis

MERGED FILES (would be updated):
  ~ package.json
    Add scripts:
      "docker:build": "docker build -t my-service ."
      "docker:up": "docker-compose up -d"
      "docker:down": "docker-compose down"
      "test:ci": "jest --ci --coverage"
      "lint:fix": "eslint --fix src/**/*.ts"

    Add dependencies:
      @types/node: ^20.10.0
      @types/jest: ^29.5.0
      eslint: ^8.55.0
      ... (9 more)

  ~ .gitignore
    Add patterns:
      .DS_Store
      *.log
      .env.local
      .env.*.local
      dist/
      coverage/
      ... (10 more)

  ~ README.md
    Add sections:
      - Development Setup
      - Docker Commands
      - CI/CD Pipeline
      - Deployment Guide

PRESERVED FILES (no changes):
  ✓ src/**/*.ts (all source code)
  ✓ tests/**/*.test.ts (all tests)
  ✓ .env.local (local environment)
  ✓ node_modules/ (dependencies)

⚠️ Potential Issues:
  None detected - safe to proceed

To apply these changes, run without --dry-run:
  /itg:repo:scaffold service
```

### Apply Template to Specific Directory

```bash
/itg:repo:scaffold api-template --target=./backend
```

**Output:**
```
🔧 Scaffolding template: api-template

Target: C:\Users\MarkusAhling\projects\monorepo\backend
Template: api-template (REST API)
Merge Strategy: merge

📊 Analyzing target repository...
  ✓ Detected: Express.js API
  ✓ Directory: backend/
  ✓ Existing files: 32

📋 Template Preview:
  Files to add:
    + backend/src/controllers/README.md
    + backend/src/middleware/error-handler.ts
    + backend/src/middleware/request-logger.ts
    + backend/docs/api/openapi.yml
    + backend/docs/api/postman-collection.json
    + backend/tests/integration/api.test.ts

  Files to merge:
    ~ backend/src/app.ts (add middleware)
    ~ backend/package.json (add dependencies)
    ~ backend/.env.example (add API config)

🔀 Applying changes...

✅ Scaffolding complete!

Summary:
  Files added: 6
  Files merged: 3
  Target: ./backend

Next Steps:
  1. Review changes in backend/ directory
  2. Update API documentation: backend/docs/api/openapi.yml
  3. Test endpoints with Postman collection
  4. Run integration tests: npm run test:integration

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\monorepo.md
```

### Overwrite Existing Files for Standardization

```bash
/itg:repo:scaffold service --merge-strategy=overwrite
```

**Output:**
```
🔧 Scaffolding template: service

⚠️  OVERWRITE MODE: Existing files will be replaced
Backup will be created: .scaffold-backup/

Target: C:\Users\MarkusAhling\projects\legacy-service
Template: service
Merge Strategy: overwrite

📊 Analyzing target repository...
  ✓ Detected: Node.js project (outdated structure)
  ⚠️  Files will be overwritten: 11

🔀 Creating backup...
  ✓ Backup created: .scaffold-backup/2026-01-19-10-30-00/

📋 Files to be overwritten:
  ⚠️  Dockerfile (current → template version)
  ⚠️  docker-compose.yml (current → template version)
  ⚠️  .github/workflows/ci.yml (current → template version)
  ⚠️  tsconfig.json (current → template version)
  ⚠️  .eslintrc.json (current → template version)
  ... (6 more files)

Proceed with overwrite? [y/N]: y

🔀 Applying overwrite strategy...

  ✓ Replaced Dockerfile
  ✓ Replaced docker-compose.yml
  ✓ Replaced .github/workflows/ci.yml
  ✓ Replaced tsconfig.json
  ✓ Replaced .eslintrc.json
  ... (6 more replacements)

✅ Scaffolding complete!

Summary:
  Files overwritten: 11
  Files added: 5
  Backup location: .scaffold-backup/2026-01-19-10-30-00/

⚠️  IMPORTANT: Review changes carefully before committing

To restore backup if needed:
  cp -r .scaffold-backup/2026-01-19-10-30-00/* .

Next Steps:
  1. Review all replaced files: git diff
  2. Test build: npm run build
  3. Test Docker: docker-compose up
  4. Update any custom configurations
  5. Commit standardized structure

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\legacy-service.md
```

### Apply Template with Custom Variables

```bash
/itg:repo:scaffold service --variables='{"service_name":"payment-api","port":3001,"database":"postgres","cache":"redis"}'
```

**Output:**
```
🔧 Scaffolding template: service

Target: C:\Users\MarkusAhling\projects\payment-api
Template: service
Merge Strategy: merge
Variables: 4 custom values provided

📊 Variable Substitution:
  {{service_name}} → payment-api
  {{port}} → 3001
  {{database}} → postgres
  {{cache}} → redis

📋 Applying template with variables...

Files generated with variables:
  ✓ docker-compose.yml
    - Service name: payment-api
    - Exposed port: 3001
    - Database: postgres:15
    - Cache: redis:7

  ✓ .env.example
    - SERVICE_NAME=payment-api
    - PORT=3001
    - DATABASE_URL=postgresql://...
    - REDIS_URL=redis://...

  ✓ README.md
    - Title: Payment API
    - Port references: 3001

  ✓ Dockerfile
    - EXPOSE 3001

✅ Scaffolding complete with custom variables!

Summary:
  Files added: 7
  Files merged: 4
  Variables applied: 4

Next Steps:
  1. Copy .env.example to .env
  2. Update database connection: DATABASE_URL
  3. Start services: docker-compose up
  4. Access API: http://localhost:3001

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\payment-api.md
```

### Skip Existing Files (Only Add New)

```bash
/itg:repo:scaffold docker --merge-strategy=skip
```

**Output:**
```
🔧 Scaffolding template: docker

Target: C:\Users\MarkusAhling\projects\existing-app
Template: docker
Merge Strategy: skip (preserve all existing files)

📊 Analyzing target repository...
  ✓ Detected: Python application
  ✓ Existing Dockerfile found (will be skipped)
  ✓ Existing docker-compose.yml found (will be skipped)

📋 Template Preview:
  Files to add:
    + .dockerignore
    + docker/production.Dockerfile
    + docker/development.Dockerfile
    + scripts/docker-build.sh
    + scripts/docker-deploy.sh

  Files to skip (already exist):
    - Dockerfile (existing version preserved)
    - docker-compose.yml (existing version preserved)

🔀 Applying skip strategy...

  ✓ Created .dockerignore
  ✓ Created docker/production.Dockerfile
  ✓ Created docker/development.Dockerfile
  ✓ Created scripts/docker-build.sh
  ✓ Created scripts/docker-deploy.sh
  ⊝ Skipped Dockerfile (already exists)
  ⊝ Skipped docker-compose.yml (already exists)

✅ Scaffolding complete!

Summary:
  Files added: 5
  Files skipped: 2
  Existing files preserved: 100%

💡 TIP: To update existing files, use --merge-strategy=merge or --merge-strategy=overwrite

Next Steps:
  1. Review new Docker configurations in docker/ directory
  2. Compare with existing Dockerfile
  3. Consider migrating to multi-stage builds (docker/production.Dockerfile)
  4. Use build scripts for consistency: ./scripts/docker-build.sh

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\existing-app.md
```

### Use Preset for Quick CI/CD Addition

```bash
/itg:repo:scaffold --preset=add-ci
```

**Output:**
```
🔧 Scaffolding with preset: add-ci

Target: C:\Users\MarkusAhling\projects\app-without-ci
Template: ci-cd
Merge Strategy: skip (only add new files)

📊 Analyzing target repository...
  ✓ Detected: Node.js application
  ✓ No CI/CD configuration found

📋 Adding CI/CD pipeline:
  + .github/workflows/ci.yml
  + .github/workflows/deploy.yml
  + .github/workflows/release.yml
  + .github/dependabot.yml

🔀 Applying changes...

  ✓ Created .github/workflows/ci.yml
    - Build and test on every PR
    - Run linting and type checking
    - Upload test coverage

  ✓ Created .github/workflows/deploy.yml
    - Deploy to dev on push to main
    - Deploy to staging on release branch
    - Deploy to prod on tag push

  ✓ Created .github/workflows/release.yml
    - Automated semantic versioning
    - Generate CHANGELOG
    - Create GitHub release

  ✓ Created .github/dependabot.yml
    - Automated dependency updates
    - Weekly schedule

✅ CI/CD pipeline added successfully!

Summary:
  Files added: 4
  Pipelines configured: 3
  Automation enabled: Dependabot

Next Steps:
  1. Review pipeline configurations in .github/workflows/
  2. Configure GitHub secrets for deployments
  3. Update deploy.yml with your deployment targets
  4. Commit and push to trigger first CI run

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\app-without-ci.md
```

### Apply Custom Template from Path

```bash
/itg:repo:scaffold ../templates/my-custom-template --target=./new-project
```

**Output:**
```
🔧 Scaffolding custom template

Target: C:\Users\MarkusAhling\projects\new-project
Template: ../templates/my-custom-template (custom)
Merge Strategy: merge

📊 Loading custom template...
  ✓ Template structure validated
  ✓ Template files: 18
  ✓ Template variables: 6

📋 Required variables:
  Enter values for template variables:

  project_name: [new-project] new-project
  author: [current user] Markus Ahling
  license: [MIT] MIT
  database: [postgres] postgres
  deployment_target: [docker] kubernetes
  monitoring: [none] prometheus

🔀 Applying custom template...

  ✓ Created custom template files (18 files)
  ✓ Applied variable substitutions (6 variables)

✅ Custom template applied successfully!

Summary:
  Files added: 18
  Variables applied: 6
  Template source: ../templates/my-custom-template

Next Steps:
  1. Review generated files
  2. Update README.md with project-specific details
  3. Configure deployment settings
  4. Initialize git: git init && git add . && git commit -m "Initial commit"

📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\new-project.md
```

## Merge Strategies Explained

### Merge Strategy: `merge` (Default - Recommended)

**Best for**: Most scenarios where you want to enhance existing repositories without losing customizations.

**Behavior**:
- **Configuration files** (JSON, YAML): Merges objects/arrays intelligently
  - `package.json`: Combines scripts, dependencies (no duplicates)
  - `.env.example`: Adds new variables, preserves existing
  - `tsconfig.json`: Merges compiler options
  - `docker-compose.yml`: Combines services

- **Documentation files** (Markdown): Adds sections without removing existing content
  - `README.md`: Adds new sections while preserving existing content
  - `CONTRIBUTING.md`: Appends guidelines

- **Code files**: Preserved (never modified)
  - `src/**/*.ts`: All existing code untouched
  - `tests/**/*.test.ts`: All existing tests preserved

- **New files**: Added if they don't exist
  - CI/CD pipelines, Docker configs, etc.

**Example**:
```json
// Existing package.json
{
  "scripts": {
    "start": "node index.js",
    "custom-script": "echo custom"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}

// After merge with service template
{
  "scripts": {
    "start": "node index.js",          // Preserved
    "custom-script": "echo custom",    // Preserved
    "test": "jest",                    // Added
    "lint": "eslint .",                // Added
    "docker:build": "docker build ."   // Added
  },
  "dependencies": {
    "express": "^4.18.0",              // Preserved
    "winston": "^3.11.0",              // Added
    "helmet": "^7.1.0"                 // Added
  }
}
```

### Merge Strategy: `skip`

**Best for**: Adding new capabilities to repositories with custom configurations you want to preserve completely.

**Behavior**:
- **Existing files**: Never modified or merged (100% preserved)
- **New files**: Created if they don't exist
- **Result**: Only adds files that are missing

**Use cases**:
- Adding CI/CD to repository with custom build configuration
- Adding Docker support to repository with existing Dockerfile
- Adding documentation templates without modifying existing docs

**Example**:
```
Before:
  my-repo/
    ├── Dockerfile (custom)
    ├── src/
    └── package.json

After /itg:repo:scaffold docker --merge-strategy=skip:
  my-repo/
    ├── Dockerfile (unchanged - existing version preserved)
    ├── .dockerignore (added)
    ├── docker-compose.yml (skipped - already exists)
    ├── docker/
    │   ├── production.Dockerfile (added)
    │   └── development.Dockerfile (added)
    ├── src/
    └── package.json (unchanged)
```

### Merge Strategy: `overwrite`

**Best for**: Standardizing repositories across organization or updating outdated configurations to current standards.

**Behavior**:
- **All template files**: Replace existing versions completely
- **Backup created**: Existing files backed up to `.scaffold-backup/`
- **Result**: Repository structure matches template exactly

**Use cases**:
- Standardizing legacy repositories to current patterns
- Replacing outdated configurations with current best practices
- Enforcing organization-wide standards
- Migrating to new infrastructure patterns

**⚠️ Warning**: This is destructive. Always review backup before committing.

**Example**:
```
Before:
  legacy-service/
    ├── Dockerfile (outdated)
    └── .github/workflows/old-ci.yml

After /itg:repo:scaffold service --merge-strategy=overwrite:
  legacy-service/
    ├── Dockerfile (replaced with template version)
    ├── .github/workflows/ci.yml (replaced)
    ├── .github/workflows/deploy.yml (added)
    └── .scaffold-backup/
        └── 2026-01-19-10-30-00/
            ├── Dockerfile (original backed up)
            └── .github/workflows/old-ci.yml (backed up)
```

## Template Variables

Templates support variable substitution using Handlebars syntax:

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{project_name}}` | Repository/project name | `payment-service` |
| `{{service_name}}` | Service name for Docker/K8s | `payment-api` |
| `{{port}}` | Application port | `3000` |
| `{{database}}` | Database type | `postgres`, `mysql` |
| `{{cache}}` | Cache system | `redis`, `memcached` |
| `{{author}}` | Author name | `Markus Ahling` |
| `{{organization}}` | Organization name | `your-org` |
| `{{license}}` | License type | `MIT`, `Apache-2.0` |

### Providing Variables

**Via JSON string**:
```bash
/itg:repo:scaffold service --variables='{"port":3001,"database":"mysql"}'
```

**Via JSON file**:
```bash
/itg:repo:scaffold service --variables=@variables.json
```

**Interactive prompt** (if not provided):
```bash
/itg:repo:scaffold service
# Prompts for: project_name, port, database, etc.
```

### Template Variable Examples

**In Dockerfile**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
EXPOSE {{port}}
CMD ["npm", "start"]
```

**In docker-compose.yml**:
```yaml
version: '3.8'
services:
  {{service_name}}:
    build: .
    ports:
      - "{{port}}:{{port}}"
    environment:
      DATABASE_URL: postgresql://{{database}}:5432/{{project_name}}
```

**In README.md**:
```markdown
# {{project_name}}

## Quick Start

```bash
docker-compose up
# Access API: http://localhost:{{port}}
```
```

## Available Templates

### Built-in Templates

| Template | Purpose | Files Included |
|----------|---------|----------------|
| `service` | Node.js microservice | Dockerfile, CI/CD, tests, configs |
| `api` | REST API with OpenAPI | API docs, Postman, contract tests |
| `library` | npm/pip package | Semantic versioning, publishing |
| `ui` | Frontend application | Storybook, E2E tests, build configs |
| `infrastructure` | Terraform + K8s | IaC, Helm charts, pipelines |
| `documentation` | MkDocs site | Documentation structure, GitHub Pages |
| `docker` | Docker configuration | Dockerfiles, compose, scripts |
| `ci-cd` | CI/CD pipelines | GitHub Actions, Harness |
| `terraform` | Terraform modules | AWS/Azure/GCP modules |
| `kubernetes` | K8s manifests | Deployments, services, ingress |

### Custom Templates

Create custom templates in:
```
.claude/templates/repository/{template-name}/
```

**Template structure**:
```
custom-template/
  ├── template.json           # Template metadata
  ├── variables.json          # Variable definitions
  └── files/                  # Template files
      ├── Dockerfile
      ├── .github/workflows/
      └── ...
```

**template.json**:
```json
{
  "name": "custom-template",
  "version": "1.0.0",
  "description": "Custom template for XYZ",
  "author": "Your Name",
  "variables": [
    {
      "name": "project_name",
      "description": "Project name",
      "type": "string",
      "required": true
    },
    {
      "name": "port",
      "description": "Application port",
      "type": "number",
      "default": 3000
    }
  ]
}
```

### List Available Templates

```bash
/itg:list-templates
```

**Output**:
```
📚 Available Templates:

Built-in Templates:
  ✓ service - Node.js microservice
  ✓ api - REST API with OpenAPI
  ✓ library - npm/pip package
  ✓ ui - Frontend application
  ✓ infrastructure - Terraform + Kubernetes
  ✓ documentation - MkDocs documentation
  ✓ docker - Docker configuration
  ✓ ci-cd - CI/CD pipelines

Custom Templates:
  ✓ internal-api - Internal API standard
  ✓ data-pipeline - ETL pipeline template

Template Registry: .claude/templates/repository/
```

## Related Commands

### Initialize New Repository
```bash
/itg:repo:init my-service --template=service
```
Creates a brand new repository from template.

### Generate Custom Template
```bash
/itg:generate --type=repo-template --from=./reference-repo --output=./templates/
```
Creates a template from an existing repository.

### Analyze Repository Structure
```bash
/itg:analyze --output=json
```
Analyzes repository to identify missing patterns that templates can provide.

## Troubleshooting

### "Template not found"
- Verify template name: `/itg:list-templates`
- Check custom template path exists
- Ensure template structure is valid

### "Variable not provided"
- Use `--variables` flag with JSON string
- Or let command prompt interactively
- Check `variables.json` in template

### "Merge conflict detected"
- Review conflict files in output
- Use `--dry-run` to preview
- Consider `--merge-strategy=skip` to preserve existing
- Manually resolve after scaffolding

### "Permission denied"
- Ensure write access to target directory
- Check file permissions on existing files
- Run with appropriate user privileges

### "Backup creation failed"
- Verify disk space available
- Check `.scaffold-backup/` directory permissions
- Use `--merge-strategy=skip` to avoid backups

## Best Practices

### Before Scaffolding

1. **Commit current state**: `git add . && git commit -m "Pre-scaffold checkpoint"`
2. **Use dry run**: `/itg:repo:scaffold template --dry-run`
3. **Review template**: Check what will be added/merged
4. **Backup manually**: Copy important files if concerned

### Choosing Merge Strategy

- **merge**: Default, safest option for most cases
- **skip**: When you have custom configs to preserve
- **overwrite**: Only for standardization across multiple repos

### After Scaffolding

1. **Review changes**: `git diff`
2. **Test build**: Ensure everything builds correctly
3. **Update configurations**: Adjust template defaults to your needs
4. **Run tests**: Verify functionality
5. **Commit**: `git add . && git commit -m "Apply template: service"`

### Variable Management

- **Create variables.json**: For reusable configurations
- **Use organization defaults**: Standardize across teams
- **Document variables**: In template README

## Obsidian Vault Integration

Template application is automatically documented:

```
C:\Users\MarkusAhling\obsidian\Repositories\{org}\{repo-name}.md
```

**Metadata captured**:
- Template applied and version
- Application date and user
- Merge strategy used
- Variables provided
- Files added/merged
- Manual steps required

## API Integration

For programmatic scaffolding:

```typescript
import { ITGScaffolder } from '@claude/plugins/infrastructure-template-generator';

const scaffolder = new ITGScaffolder();

const result = await scaffolder.scaffold({
  template: 'service',
  target: './my-service',
  mergeStrategy: 'merge',
  variables: {
    project_name: 'payment-service',
    port: 3001,
    database: 'postgres'
  },
  dryRun: false
});

console.log(`Files added: ${result.filesAdded}`);
console.log(`Files merged: ${result.filesMerged}`);
```

## Version History

- **1.0.0** (2026-01-19): Initial release with merge strategies and variable substitution

## Support

For issues or feature requests:
- GitHub: https://github.com/brookside-bi/claude-itg
- Documentation: Obsidian vault at `C:\Users\MarkusAhling\obsidian\Projects\ITG/`
- Email: support@brooksidebi.com

---

**Next Steps After Scaffolding:**

1. Review all changes with `git diff`
2. Test build and deployment processes
3. Update any template defaults to your specific needs
4. Run tests to verify functionality
5. Commit changes with descriptive message
6. Update team on new repository structure
