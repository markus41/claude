---
name: itg:repo:init
description: Initialize a new repository from template with branch protection and Jira integration
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: name
    description: Repository name (e.g., payment-service, user-api)
    required: true
    type: string
flags:
  - name: template
    description: Repository template type
    type: choice
    choices: [service, api, library, ui, infrastructure, documentation]
    default: service
  - name: provider
    description: Git provider platform
    type: choice
    choices: [github, gitlab, harness]
    default: github
  - name: visibility
    description: Repository visibility level
    type: choice
    choices: [public, private]
    default: private
  - name: branch-strategy
    description: Git branching strategy to implement
    type: choice
    choices: [gitflow, github-flow, trunk-based]
    default: github-flow
  - name: enable-protection
    description: Enable branch protection rules
    type: boolean
    default: true
  - name: jira-project
    description: Jira project key to link repository (e.g., PROJ, TEAM)
    type: string
presets:
  - name: microservice
    description: Microservice with standard CI/CD and branch protection
    flags:
      template: service
      branch-strategy: github-flow
      enable-protection: true
  - name: public-library
    description: Public library with semantic versioning
    flags:
      template: library
      visibility: public
      branch-strategy: trunk-based
  - name: docs
    description: Documentation repository with wiki integration
    flags:
      template: documentation
      visibility: public
      branch-strategy: github-flow
aliases:
  - itg:init
  - itg:new-repo
---

# /itg:repo:init - Initialize Repository from Template

## Purpose

The `/itg:repo:init` command creates a new repository from a standardized template, automatically configuring branch protection rules, CI/CD integration, and Jira project linking. This ensures every repository starts with production-ready infrastructure, consistent standards, and proper governance from day one.

**Best for:**
- Starting new microservices or applications with proven patterns
- Establishing consistent repository standards across teams
- Automating repository setup with pre-configured security and compliance
- Linking code repositories to project management workflows
- Reducing time from project initiation to first commit

## Command Workflow

When you run `/itg:repo:init`, the following steps occur:

### 1. Template Selection and Validation
- Validates repository name follows naming conventions
- Selects appropriate template based on `--template` flag
- Verifies template exists in registry or local templates directory
- Checks for naming conflicts with existing repositories
- Validates Jira project key if provided

### 2. Repository Creation
- Creates new repository on specified provider (GitHub/GitLab/Harness)
- Applies template structure (directories, files, configs)
- Initializes git with proper `.gitignore` and `.gitattributes`
- Sets up README.md with repository metadata
- Configures remote origin and initial branch

### 3. Branch Strategy Configuration
- Creates branches based on selected strategy:
  - **github-flow**: `main` branch only (feature branches on-demand)
  - **gitflow**: `main`, `develop`, `release/*`, `hotfix/*` branches
  - **trunk-based**: `main` branch with short-lived feature branches
- Sets default branch for pull requests
- Configures branch naming conventions

### 4. Branch Protection Rules (if enabled)
- **Main/Master Branch Protection**:
  - Require pull request reviews (minimum 1 approval)
  - Require status checks to pass before merging
  - Require branches to be up to date before merging
  - Require conversation resolution before merging
  - Enforce for administrators (optional based on team policy)
  - Require signed commits (for compliance-critical repos)

- **Additional Protections**:
  - Restrict who can push to protected branches
  - Require linear history (no merge commits)
  - Lock branch (prevent deletion)
  - Required status checks: CI, tests, security scans

### 5. CI/CD Integration
- Generates initial CI/CD pipeline configuration
- Sets up automated testing on pull requests
- Configures build and deployment workflows
- Integrates with Harness (if provider is Harness)
- Adds quality gates and security scanning

### 6. Jira Integration (if `--jira-project` provided)
- Links repository to Jira project
- Enables smart commits (commits with issue keys)
- Configures branch naming with issue key prefix
- Sets up pull request → Jira issue linking
- Adds Jira webhook for deployment tracking

### 7. Documentation Generation
- Creates comprehensive README.md with:
  - Repository purpose and overview
  - Getting started guide
  - Development workflow
  - Contribution guidelines
  - Branch strategy documentation
  - Links to related Jira project
- Generates CONTRIBUTING.md
- Creates CODEOWNERS file (for review assignments)
- Adds issue and PR templates

### 8. Initial Commit and Push
- Commits all template files with descriptive message
- Tags initial commit as `v0.1.0` (for libraries)
- Pushes to remote repository
- Verifies all protections are active

### 9. Obsidian Vault Documentation
- Creates repository entry in Obsidian vault
- Links to Jira project and related documentation
- Documents repository purpose and architecture decisions
- Adds to organization repository index

## Usage Examples

### Basic Repository Creation (Default: Service)

```bash
/itg:repo:init payment-service
```

**Output:**
```
🚀 Initializing repository: payment-service

✓ Template selected: service (Node.js microservice)
✓ Repository created on GitHub (private)
✓ Branch strategy: github-flow (main branch)
✓ Branch protection enabled on main

Repository Structure:
  ├── src/                    # Source code
  ├── tests/                  # Test files
  ├── .github/workflows/      # CI/CD pipelines
  ├── .vscode/                # Editor configuration
  ├── Dockerfile              # Container definition
  ├── docker-compose.yml      # Local development
  ├── package.json            # Dependencies
  ├── tsconfig.json           # TypeScript config
  ├── README.md               # Documentation
  └── CONTRIBUTING.md         # Contribution guide

Branch Protection Rules (main):
  ✓ Require 1 PR review before merge
  ✓ Require status checks: [CI, Tests, Security Scan]
  ✓ Require branch up to date
  ✓ Require conversation resolution
  ✓ Restrict push access

CI/CD Pipeline:
  ✓ Pull Request: Build + Test + Lint
  ✓ Main Branch: Build + Test + Deploy to Dev
  ✓ Release Tag: Deploy to Staging → Production

📍 Repository URL: https://github.com/your-org/payment-service
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\payment-service.md

Next Steps:
  1. Clone repository: git clone https://github.com/your-org/payment-service
  2. Review README.md for getting started guide
  3. Create first feature branch: git checkout -b feature/initial-setup
  4. Start development!
```

### Create API Repository with Jira Integration

```bash
/itg:repo:init user-api --template=api --jira-project=PLAT
```

**Output:**
```
🚀 Initializing repository: user-api

✓ Template selected: api (REST API)
✓ Repository created on GitHub (private)
✓ Branch strategy: github-flow (main branch)
✓ Branch protection enabled on main
✓ Jira project linked: PLAT

Repository Structure:
  ├── src/
  │   ├── controllers/        # API controllers
  │   ├── services/           # Business logic
  │   ├── models/             # Data models
  │   ├── middleware/         # Express middleware
  │   ├── routes/             # Route definitions
  │   └── utils/              # Utilities
  ├── tests/
  ├── docs/
  │   ├── api/                # OpenAPI/Swagger specs
  │   └── postman/            # Postman collections
  ├── .github/workflows/
  ├── Dockerfile
  ├── package.json
  └── README.md

Jira Integration:
  ✓ Repository linked to PLAT project
  ✓ Smart commits enabled (e.g., "PLAT-123 Add user endpoint")
  ✓ Branch naming convention: feature/PLAT-123-description
  ✓ PR → Jira issue linking active
  ✓ Deployment webhook configured

Branch Protection Rules (main):
  ✓ Require 1 PR review
  ✓ Require status checks: [CI, Tests, API Tests, Security]
  ✓ Require Jira issue linked in PR
  ✓ Require branch naming: feature/PLAT-*

📍 Repository URL: https://github.com/your-org/user-api
🎫 Jira Project: https://your-org.atlassian.net/browse/PLAT
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\user-api.md

Next Steps:
  1. Clone repository and install dependencies
  2. Create Jira issue for initial development (or use existing)
  3. Create branch: git checkout -b feature/PLAT-XXX-initial-api
  4. Develop endpoints following API design patterns
  5. Submit PR with Jira issue reference
```

### Create Public Library with Semantic Versioning

```bash
/itg:repo:init data-utils --template=library --visibility=public --branch-strategy=trunk-based
```

**Output:**
```
🚀 Initializing repository: data-utils

✓ Template selected: library (npm package)
✓ Repository created on GitHub (public)
✓ Branch strategy: trunk-based (main branch + short-lived features)
✓ Branch protection enabled on main
✓ Semantic versioning configured

Repository Structure:
  ├── src/
  │   ├── index.ts            # Main entry point
  │   └── lib/                # Library code
  ├── tests/
  ├── docs/
  ├── examples/               # Usage examples
  ├── .github/workflows/
  │   ├── ci.yml              # Continuous integration
  │   ├── release.yml         # Automated releases
  │   └── publish.yml         # npm publishing
  ├── package.json            # Library metadata
  ├── tsconfig.json
  ├── LICENSE                 # MIT License (for public)
  ├── README.md
  └── CHANGELOG.md            # Version history

Branch Protection Rules (main):
  ✓ Require 1 PR review
  ✓ Require status checks: [CI, Tests, Build, Docs]
  ✓ Require branch up to date
  ✓ Require semantic commit messages

Release Configuration:
  ✓ Automated semantic versioning
  ✓ CHANGELOG generation from commits
  ✓ npm publishing on version tags
  ✓ GitHub Releases created automatically

Semantic Commit Format:
  - feat: New feature (minor version bump)
  - fix: Bug fix (patch version bump)
  - BREAKING CHANGE: Breaking change (major version bump)
  - docs: Documentation only (no version bump)

📍 Repository URL: https://github.com/your-org/data-utils
📦 npm package: @your-org/data-utils
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\data-utils.md

Next Steps:
  1. Clone repository and install dependencies
  2. Review examples/ directory for usage patterns
  3. Develop first feature with semantic commit
  4. Submit PR for review
  5. After merge, tag release: npm run release
  6. Package published automatically to npm
```

### Create Infrastructure Repository with GitFlow

```bash
/itg:repo:init platform-infrastructure --template=infrastructure --branch-strategy=gitflow --provider=harness
```

**Output:**
```
🚀 Initializing repository: platform-infrastructure

✓ Template selected: infrastructure (Terraform + Kubernetes)
✓ Repository created on Harness (private)
✓ Branch strategy: gitflow (main, develop, release/*, hotfix/*)
✓ Branch protection enabled on main and develop
✓ Harness pipelines configured

Repository Structure:
  ├── terraform/
  │   ├── modules/            # Reusable Terraform modules
  │   ├── environments/       # Environment-specific configs
  │   │   ├── dev/
  │   │   ├── staging/
  │   │   └── production/
  │   └── global/             # Shared infrastructure
  ├── kubernetes/
  │   ├── base/               # Base Kustomize configs
  │   └── overlays/           # Environment overlays
  ├── .harness/
  │   ├── pipelines/          # CD pipelines
  │   ├── services/           # Service definitions
  │   └── environments/       # Environment configs
  ├── docs/
  ├── scripts/                # Automation scripts
  └── README.md

GitFlow Branches:
  ✓ main: Production releases only
  ✓ develop: Active development branch
  ✓ release/*: Release candidates
  ✓ hotfix/*: Emergency production fixes
  ✓ feature/*: New features (merge to develop)

Branch Protection Rules:
  main:
    ✓ Require 2 PR reviews (senior approval)
    ✓ Require status checks: [Terraform Plan, Security Scan, Manual Approval]
    ✓ Restrict push (only release branches)
  develop:
    ✓ Require 1 PR review
    ✓ Require status checks: [Terraform Validate, Lint]

Harness Integration:
  ✓ Terraform Plan pipeline (on PR)
  ✓ Terraform Apply pipeline (on merge to main)
  ✓ Environment-specific deployment pipelines
  ✓ Rollback pipelines for hotfixes

📍 Repository URL: https://harness.io/your-org/platform-infrastructure
🚢 Harness Pipelines: https://harness.io/your-org/pipelines
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\platform-infrastructure.md

Next Steps:
  1. Clone repository
  2. Review terraform/README.md for setup guide
  3. Initialize Terraform: cd terraform/environments/dev && terraform init
  4. Create feature branch from develop: git checkout -b feature/initial-setup develop
  5. Make infrastructure changes
  6. Submit PR to develop for review
  7. After testing in dev, create release branch: git checkout -b release/1.0.0 develop
  8. Merge release to main for production deployment
```

### Create Documentation Repository (Wiki)

```bash
/itg:repo:init project-wiki --template=documentation --visibility=public
```

**Output:**
```
🚀 Initializing repository: project-wiki

✓ Template selected: documentation (MkDocs)
✓ Repository created on GitHub (public)
✓ Branch strategy: github-flow (main branch)
✓ Branch protection enabled on main
✓ GitHub Pages configured

Repository Structure:
  ├── docs/
  │   ├── index.md            # Home page
  │   ├── getting-started/
  │   ├── guides/
  │   ├── api-reference/
  │   ├── architecture/
  │   └── contributing/
  ├── .github/workflows/
  │   ├── deploy-docs.yml     # Deploy to GitHub Pages
  │   └── link-checker.yml    # Validate internal links
  ├── mkdocs.yml              # MkDocs configuration
  ├── README.md
  └── STYLE_GUIDE.md

Documentation Tools:
  ✓ MkDocs with Material theme
  ✓ Mermaid diagrams support
  ✓ Search functionality
  ✓ Version dropdown (for releases)
  ✓ Dark mode support

GitHub Pages:
  ✓ Site URL: https://your-org.github.io/project-wiki
  ✓ Auto-deploy on push to main
  ✓ Custom domain support available

Branch Protection Rules (main):
  ✓ Require 1 PR review (for quality control)
  ✓ Require status checks: [Build Docs, Link Check, Spell Check]
  ✓ Require conversation resolution

📍 Repository URL: https://github.com/your-org/project-wiki
🌐 Documentation Site: https://your-org.github.io/project-wiki
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\project-wiki.md

Next Steps:
  1. Clone repository
  2. Install MkDocs: pip install mkdocs-material
  3. Run locally: mkdocs serve (preview at http://localhost:8000)
  4. Edit docs in docs/ directory
  5. Submit PR for review
  6. After merge, site auto-deploys to GitHub Pages
```

### Use Preset for Quick Microservice Setup

```bash
/itg:repo:init notification-service --preset=microservice --jira-project=NOTIF
```

**Output:**
```
🚀 Initializing repository: notification-service

✓ Preset applied: microservice
✓ Template: service (Node.js microservice)
✓ Repository created on GitHub (private)
✓ Branch strategy: github-flow (main branch)
✓ Branch protection: enabled
✓ Jira project linked: NOTIF

Repository Structure:
  ├── src/
  ├── tests/
  ├── .github/workflows/
  │   ├── pr.yml              # PR validation
  │   ├── main.yml            # Deploy to dev
  │   └── release.yml         # Deploy to prod
  ├── Dockerfile
  ├── docker-compose.yml
  ├── package.json
  ├── README.md
  └── CONTRIBUTING.md

✓ All standard microservice configurations applied
✓ CI/CD pipeline configured
✓ Branch protection enabled on main
✓ Jira integration active

📍 Repository URL: https://github.com/your-org/notification-service
🎫 Jira Project: https://your-org.atlassian.net/browse/NOTIF
📝 Documented in: C:\Users\MarkusAhling\obsidian\Repositories\your-org\notification-service.md

Next Steps:
  1. Clone repository
  2. Create Jira issue for first feature
  3. Create branch: git checkout -b feature/NOTIF-XXX-description
  4. Start development!
```

## Template Types

### Service Template
- **Purpose**: Backend microservices, REST APIs, gRPC services
- **Includes**: Docker, CI/CD, testing framework, logging, monitoring
- **Best for**: Node.js, Python, Java microservices

### API Template
- **Purpose**: API-first services with OpenAPI/Swagger
- **Includes**: API documentation, Postman collections, contract testing
- **Best for**: REST APIs, GraphQL APIs

### Library Template
- **Purpose**: Reusable npm/pip packages
- **Includes**: Semantic versioning, automated publishing, examples
- **Best for**: Shared utilities, SDKs, component libraries

### UI Template
- **Purpose**: Frontend applications
- **Includes**: React/Vue/Angular setup, Storybook, E2E testing
- **Best for**: Web applications, component libraries

### Infrastructure Template
- **Purpose**: Infrastructure as Code repositories
- **Includes**: Terraform, Kubernetes, Helm charts, Harness pipelines
- **Best for**: Cloud infrastructure, platform management

### Documentation Template
- **Purpose**: Documentation websites and wikis
- **Includes**: MkDocs, GitHub Pages, link validation
- **Best for**: Project documentation, API references, guides

## Branch Strategy Comparison

| Strategy | Branches | Best For | Complexity |
|----------|----------|----------|------------|
| **GitHub Flow** | `main` + feature branches | Small teams, continuous deployment | Low |
| **GitFlow** | `main`, `develop`, `release/*`, `hotfix/*` | Large teams, scheduled releases | High |
| **Trunk-Based** | `main` + short-lived features | High-frequency releases, monorepos | Low |

### GitHub Flow (Default)
- Simple and effective for most projects
- Feature branches merge directly to `main`
- `main` is always deployable
- Release tags mark production deployments

### GitFlow
- Structured release management
- `develop` branch for active development
- `release/*` branches for release candidates
- `hotfix/*` branches for emergency production fixes
- Best for projects with scheduled releases

### Trunk-Based Development
- Minimal branching (main branch only)
- Feature flags for incomplete features
- Very short-lived feature branches (< 1 day)
- Requires high test coverage and CI maturity

## Jira Integration Features

When `--jira-project` is specified:

### Smart Commits
Commits automatically update Jira issues:
```bash
git commit -m "PROJ-123 Add user authentication"
# Updates PROJ-123 with commit message
```

### Branch Naming Convention
Branches must include Jira issue key:
```bash
git checkout -b feature/PROJ-123-user-auth
git checkout -b bugfix/PROJ-456-fix-login
```

### Pull Request Integration
- PR description links to Jira issue
- PR status updates Jira issue status
- PR merge triggers Jira workflow transitions
- Deployment events sent to Jira

### Workflow Automation
- Issue transitions on commit (e.g., "In Progress")
- Issue transitions on PR open (e.g., "In Review")
- Issue transitions on merge (e.g., "Done")
- Issue transitions on deployment (e.g., "Deployed")

## Branch Protection Best Practices

### Production Repositories (High Risk)
```bash
/itg:repo:init critical-service --enable-protection=true
```
- Require 2+ reviews
- Require administrator approval for breaking changes
- Require all status checks to pass
- Require signed commits
- Restrict force push and deletion

### Development Repositories (Medium Risk)
```bash
/itg:repo:init experimental-service --enable-protection=true
```
- Require 1 review
- Require core status checks (CI, tests)
- Allow force push for maintainers
- Require conversation resolution

### Personal/Prototype Repositories (Low Risk)
```bash
/itg:repo:init prototype-app --enable-protection=false
```
- No protection (faster iteration)
- Use for proofs of concept only
- Enable protection before production use

## Related Commands

### Apply Template to Existing Repository
```bash
/itg:repo:scaffold service-template --target=./my-existing-repo
```
Applies a template to an existing repository without recreating it.

### Generate Custom Template
```bash
/itg:generate --type=repo-template --from=./reference-repo
```
Creates a custom template from an existing repository.

### Update Repository Configuration
```bash
/itg:repo:update my-repo --enable-protection=true --jira-project=PROJ
```
Updates repository settings without recreating it.

## Troubleshooting

### "Repository already exists"
- Check if repository exists on provider
- Use `--force` to overwrite (⚠️ destructive)
- Consider using `/itg:repo:scaffold` for existing repos

### "Jira project not found"
- Verify Jira project key is correct
- Ensure you have access to the Jira project
- Check Jira integration is configured: `.claude/config/jira.json`

### "Branch protection failed"
- Verify you have admin permissions on repository
- Check provider supports requested protection rules
- Review provider-specific requirements (GitHub Apps, etc.)

### "Template not found"
- Verify template name matches available templates
- Check `.claude/templates/repository/` directory
- List available templates: `/itg:list-templates`

## Obsidian Vault Integration

All repositories are automatically documented in:

```
C:\Users\MarkusAhling\obsidian\Repositories\{org}\{repo-name}.md
```

**Metadata captured:**
- Repository URL and visibility
- Template used and configuration
- Branch strategy and protection rules
- Jira project linkage
- CI/CD pipeline configuration
- Related repositories and dependencies

**Cross-references created:**
- Links to Jira project documentation
- Links to related microservices
- Links to infrastructure repositories
- Links to team documentation

## API Integration

For programmatic repository creation:

```typescript
import { ITGRepoManager } from '@claude/plugins/infrastructure-template-generator';

const repoManager = new ITGRepoManager();

const repo = await repoManager.initialize({
  name: 'payment-service',
  template: 'service',
  provider: 'github',
  visibility: 'private',
  branchStrategy: 'github-flow',
  enableProtection: true,
  jiraProject: 'PLAT'
});

console.log(`Repository created: ${repo.url}`);
```

## Version History

- **1.0.0** (2026-01-19): Initial release with template-based repository initialization

## Support

For issues or feature requests:
- GitHub: https://github.com/brookside-bi/claude-itg
- Documentation: Obsidian vault at `C:\Users\MarkusAhling\obsidian\Projects\ITG/`
- Email: support@brooksidebi.com

---

**Next Steps After Repository Creation:**

1. Clone the repository to your local machine
2. Review README.md and CONTRIBUTING.md
3. Set up local development environment
4. Create first feature branch (following branch strategy)
5. Start development with confidence in production-ready infrastructure
