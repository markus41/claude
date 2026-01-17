# Claude Code Templating Plugin

> Universal templating and Harness expert plugin for Claude Code - enables fully autonomous project generation, pipeline creation, and deployment automation through a unified template interface.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## Overview

The Claude Code Templating Plugin streamlines development workflows by providing:

- **Universal Template Processing** - Support for Handlebars, Cookiecutter, Copier, Maven Archetype, and Harness formats
- **Harness Expert Agent** - Deep expertise for pipeline creation, templates, and deployments
- **Project Scaffolding** - Intelligent template selection and project generation
- **Code Generation** - API clients, models, tests, and database migrations
- **MCP Integration** - Seamless connection to Harness, GitHub, and scaffolding servers

## Installation

```bash
# From the plugin directory
cd plugins/claude-code-templating-plugin
npm install
npm run build
```

## Configuration

### Environment Variables

```bash
# Required for Harness integration
export HARNESS_API_KEY="your_harness_api_key"
export HARNESS_ACCOUNT_ID="your_account_id"
export HARNESS_ORG_ID="your_organization_id"
export HARNESS_PROJECT_ID="your_project_id"

# Optional for GitHub integration
export GITHUB_TOKEN="your_github_token"
```

### Plugin Configuration

The plugin can be configured via the `.claude-plugin/plugin.json` manifest or runtime configuration.

## Commands

### `/template` - Template Management

```bash
# List available templates
/template list

# Search templates by keyword
/template search microservice

# Get template details
/template info fastapi-microservice

# Generate from template
/template generate fastapi-microservice --output ./my-service

# Validate a template
/template validate ./my-template
```

### `/scaffold` - Project Scaffolding

```bash
# Scaffold a new project
/scaffold <template> <name> [options]

# Examples
/scaffold fastapi-microservice user-service
/scaffold react-typescript dashboard --harness
/scaffold spring-boot-service api-gateway --env dev,staging,prod

# Options
--output <dir>    # Output directory (default: ./<name>)
--harness         # Include Harness pipeline
--env <envs>      # Target environments (comma-separated)
--force           # Overwrite existing files
--dry-run         # Preview without writing
```

### `/harness` - Harness Operations

```bash
# Pipeline operations
/harness pipeline create <name>        # Create a new pipeline
/harness pipeline validate <file>      # Validate pipeline YAML
/harness pipeline list                 # List pipelines

# Template operations
/harness template create step <name>      # Create step template
/harness template create stage <name>     # Create stage template
/harness template create pipeline <name>  # Create pipeline template
/harness template list                    # List templates

# Deployment operations
/harness deploy <pipeline>             # Trigger deployment
```

### `/generate` - Code Generation

```bash
# Generate API client from OpenAPI spec
/generate api-client --spec openapi.yaml --language typescript

# Generate models from schema
/generate models --schema schema.json --language python

# Generate tests for source files
/generate tests --source ./src --framework vitest

# Generate database migrations
/generate migrations --from v1 --to v2
```

## Template Formats

The plugin supports multiple template formats:

| Format | Config File | Use Case |
|--------|-------------|----------|
| **Handlebars** | `*.hbs` | Simple variable substitution |
| **Cookiecutter** | `cookiecutter.json` | Python ecosystem templates |
| **Copier** | `copier.yml` | Modern Python templating |
| **Maven Archetype** | `archetype-metadata.xml` | Java/JVM projects |
| **Harness** | `*.yaml` | CI/CD pipelines |

## Agents

### Harness Expert Agent

Deep expertise in Harness CI/CD platform:
- Pipeline YAML generation
- Step, Stage, and Pipeline templates
- Deployment strategies (Rolling, Canary, Blue-Green)
- Runtime inputs and expressions
- Failure strategies and notifications

### Scaffold Agent

Project scaffolding specialist:
- Template selection based on requirements
- Variable collection and validation
- CLAUDE.md generation for new projects
- Post-generation hooks

### Codegen Agent

Code generation from specifications:
- API clients from OpenAPI/Swagger
- Models from JSON Schema, Prisma, GraphQL
- Type-safe implementations
- Documentation generation

### Database Agent

Database operations specialist:
- Schema design and generation
- Migration file creation
- Seed data generation
- Index optimization suggestions

### Testing Agent

Test generation and coverage:
- Unit test scaffolding
- Integration test setup
- Fixture generation
- Coverage gap analysis

## Bundled Templates

### Pipeline Templates

- `ci-cd-standard.yaml` - Standard CI/CD with build, test, deploy
- `gitops-pipeline.yaml` - GitOps with ArgoCD
- `canary-deployment.yaml` - Canary deployment pattern
- `blue-green.yaml` - Blue-Green deployment pattern

### Stage Templates

- `kubernetes-deploy.yaml` - K8s rolling deployment
- `terraform-apply.yaml` - IaC provisioning
- `approval-stage.yaml` - Manual approval gates

### Step Templates

- `shell-script.yaml` - Generic shell execution
- `docker-build.yaml` - Build and push container
- `terraform-plan.yaml` - Terraform planning
- `database-migration.yaml` - DB migrations

### Project Templates

- `fastapi-microservice/` - FastAPI Python microservice
- `spring-boot-service/` - Spring Boot Java service
- `react-typescript/` - React with TypeScript
- `etl-pipeline/` - Data ETL pipeline

## Development

### Building

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm run typecheck    # Type checking only
```

### Testing

```bash
npm test                  # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:mcp:harness # MCP integration tests
```

### Linting

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
```

## Architecture

```
plugins/claude-code-templating-plugin/
├── src/
│   ├── index.ts                 # Plugin entry point
│   ├── core/
│   │   ├── orchestrator.ts      # Template orchestration
│   │   ├── template-engine.ts   # Template processing
│   │   ├── pattern-matcher.ts   # Intent detection
│   │   └── context-manager.ts   # Context handling
│   ├── agents/                  # Agent implementations
│   ├── mcp/                     # MCP integration
│   ├── templates/               # Template loaders
│   ├── harness/                 # Harness-specific
│   └── types/                   # TypeScript types
├── agents/                      # Agent markdown definitions
├── skills/                      # Skill definitions
├── commands/                    # Command definitions
├── templates/                   # Bundled templates
└── test/                        # Test suites
```

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

- Documentation: See `CLAUDE.md` for plugin-specific guidance
- Issues: Report bugs via GitHub Issues
- Questions: Join the Claude Code community
