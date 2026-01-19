---
name: itg:analyze
description: Analyze a codebase to extract patterns for template generation
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: path
    description: Path to the codebase to analyze (default: current directory)
    required: false
    type: string
flags:
  - name: output
    description: Output format for analysis results
    type: choice
    choices: [json, yaml, summary]
    default: summary
  - name: depth
    description: Analysis depth level
    type: choice
    choices: [quick, standard, deep]
    default: standard
  - name: include
    description: File patterns to include
    type: string
    default: "**/*"
  - name: exclude
    description: File patterns to exclude
    type: string
    default: "node_modules/**,vendor/**,.git/**"
presets:
  - name: node
    description: Optimize for Node.js projects
    flags:
      include: "**/*.{js,ts,jsx,tsx,json}"
  - name: python
    description: Optimize for Python projects
    flags:
      include: "**/*.{py,toml,cfg,ini}"
  - name: terraform
    description: Optimize for Terraform projects
    flags:
      include: "**/*.{tf,tfvars}"
---

# /itg:analyze - Codebase Pattern Analysis

## Purpose

The `/itg:analyze` command performs intelligent analysis of codebases to extract reusable patterns, configuration structures, and infrastructure requirements. This analysis serves as the foundation for generating infrastructure templates, Terraform configurations, and CI/CD pipelines that accurately reflect your codebase's needs.

**Best for:**
- Understanding infrastructure requirements before template generation
- Identifying patterns across multiple microservices or repositories
- Extracting configuration schemas for standardization
- Discovering dependencies and service relationships
- Validating existing infrastructure against codebase requirements

## Command Workflow

When you run `/itg:analyze`, the following steps occur:

### 1. Initial Scan
- Discovers files matching include/exclude patterns
- Identifies project type(s) and technology stack
- Maps directory structure and key files
- Estimates analysis scope and time

### 2. Pattern Extraction
- **Configuration Patterns**: Environment variables, config files, secrets requirements
- **Dependency Analysis**: Package managers, external services, database connections
- **Infrastructure Signals**: Docker, Kubernetes, cloud provider integrations
- **Build Patterns**: Build systems, compilation steps, artifact outputs
- **Service Architecture**: API endpoints, service boundaries, communication patterns

### 3. Deep Analysis (if depth=deep)
- Static code analysis for resource usage patterns
- Security scanning for hardcoded credentials or sensitive data
- Performance profiling for resource estimation
- Compliance checking for standard adherence

### 4. Synthesis
- Aggregates findings into structured output
- Identifies template generation opportunities
- Suggests infrastructure improvements
- Generates recommendations for next steps

### 5. Integration with Source-Analyzer Agent
- Invokes specialized `source-analyzer` agent for code-level inspection
- Delegates language-specific analysis to expert sub-agents
- Consolidates multi-repository analysis into unified view
- Caches analysis results for incremental updates

## Usage Examples

### Basic Analysis (Current Directory)

```bash
/itg:analyze
```

**Output:**
```
🔍 Analyzing codebase...
📁 Found: 247 files across 12 directories
🔧 Detected: Node.js/TypeScript application

=== Analysis Summary ===

Project Type: Node.js Microservice
Primary Language: TypeScript (87%)
Framework: NestJS 10.x

Infrastructure Requirements:
  ✓ Container: Docker (Dockerfile found)
  ✓ Database: PostgreSQL (connection strings in config)
  ✓ Cache: Redis (redis client configured)
  ✓ Queue: Bull/Redis (job processors detected)

Configuration Patterns:
  - Environment Variables: 23 unique keys
  - Config Files: .env, config/*.yml
  - Secrets Required: 8 (database, API keys, JWT)

Service Architecture:
  - API Endpoints: 47 REST routes
  - External Services: 3 (Stripe, SendGrid, Auth0)
  - Internal Services: 2 (user-service, notification-service)

Recommendations:
  → Run /itg:generate --type=docker to create Dockerfile template
  → Run /itg:terraform --provider=aws to generate infrastructure
  → Run /itg:harness to create CI/CD pipeline

Next Steps:
  Use --output=json for detailed analysis results
  Use --depth=deep for security and performance insights
```

### Analyze Specific Directory with JSON Output

```bash
/itg:analyze ./backend --output=json
```

**Output (JSON):**
```json
{
  "analysis_metadata": {
    "timestamp": "2026-01-19T10:30:00Z",
    "path": "./backend",
    "duration_ms": 4521,
    "files_scanned": 247,
    "depth": "standard"
  },
  "project_info": {
    "type": "nodejs_microservice",
    "language": "typescript",
    "language_version": "5.3.x",
    "framework": "nestjs",
    "framework_version": "10.2.1"
  },
  "infrastructure_requirements": {
    "container": {
      "type": "docker",
      "dockerfile_found": true,
      "base_image": "node:20-alpine",
      "exposed_ports": [3000, 9229]
    },
    "database": {
      "type": "postgresql",
      "version": "15.x",
      "connection_pooling": true,
      "migrations": "typeorm"
    },
    "cache": {
      "type": "redis",
      "version": "7.x",
      "usage": ["session", "cache", "queue"]
    },
    "storage": {
      "type": "s3",
      "buckets": ["uploads", "exports"]
    }
  },
  "configuration_patterns": {
    "environment_variables": [
      {
        "key": "DATABASE_URL",
        "type": "secret",
        "required": true,
        "default": null
      },
      {
        "key": "REDIS_HOST",
        "type": "config",
        "required": true,
        "default": "localhost"
      },
      // ... 21 more variables
    ],
    "config_files": [
      {
        "path": ".env.example",
        "type": "environment_template",
        "variables": 23
      },
      {
        "path": "config/database.yml",
        "type": "database_config",
        "environments": ["development", "staging", "production"]
      }
    ],
    "secrets_required": [
      "DATABASE_PASSWORD",
      "REDIS_PASSWORD",
      "JWT_SECRET",
      "STRIPE_API_KEY",
      "SENDGRID_API_KEY",
      "AUTH0_CLIENT_SECRET",
      "AWS_SECRET_ACCESS_KEY",
      "ENCRYPTION_KEY"
    ]
  },
  "service_architecture": {
    "api_endpoints": [
      {
        "path": "/api/v1/users",
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "authentication": "jwt"
      },
      // ... 46 more endpoints
    ],
    "external_dependencies": [
      {
        "service": "stripe",
        "purpose": "payment_processing",
        "api_version": "2023-10-16"
      },
      {
        "service": "sendgrid",
        "purpose": "email_delivery",
        "api_version": "v3"
      },
      {
        "service": "auth0",
        "purpose": "authentication",
        "api_version": "v2"
      }
    ],
    "internal_dependencies": [
      {
        "service": "user-service",
        "protocol": "grpc",
        "endpoints": 12
      },
      {
        "service": "notification-service",
        "protocol": "http",
        "endpoints": 5
      }
    ]
  },
  "recommendations": [
    {
      "type": "template_generation",
      "command": "/itg:generate --type=docker",
      "priority": "high",
      "reason": "Dockerfile exists but may be outdated"
    },
    {
      "type": "infrastructure",
      "command": "/itg:terraform --provider=aws",
      "priority": "high",
      "reason": "AWS resources detected but no IaC found"
    },
    {
      "type": "ci_cd",
      "command": "/itg:harness",
      "priority": "medium",
      "reason": "No CI/CD pipeline configuration found"
    },
    {
      "type": "security",
      "action": "review_secrets",
      "priority": "high",
      "reason": "8 secrets required - ensure proper secret management"
    }
  ]
}
```

### Deep Analysis for Production Readiness

```bash
/itg:analyze --depth=deep --output=yaml
```

**Output (YAML):**
```yaml
---
analysis_metadata:
  timestamp: 2026-01-19T10:30:00Z
  path: .
  duration_ms: 12847
  files_scanned: 247
  depth: deep

# ... standard analysis sections ...

security_analysis:
  vulnerabilities_found: 3
  severity_breakdown:
    critical: 0
    high: 1
    medium: 2
    low: 0
  findings:
    - type: hardcoded_credential
      severity: high
      file: src/legacy/old-service.ts
      line: 42
      description: API key hardcoded in source file
      recommendation: Move to environment variable
    - type: weak_crypto
      severity: medium
      file: src/utils/encryption.ts
      line: 18
      description: Using deprecated crypto algorithm
      recommendation: Upgrade to AES-256-GCM
    - type: dependency_vulnerability
      severity: medium
      package: axios
      version: 0.21.1
      cve: CVE-2021-3749
      recommendation: Upgrade to axios@1.6.0+

performance_analysis:
  estimated_resources:
    cpu:
      idle: 0.1 cores
      average: 0.5 cores
      peak: 2.0 cores
    memory:
      idle: 256 MB
      average: 512 MB
      peak: 1024 MB
    disk:
      app_size: 150 MB
      data_estimate: 10 GB
      logs_per_day: 500 MB
  bottlenecks:
    - location: src/services/report-generator.ts
      type: cpu_intensive
      description: PDF generation blocks event loop
      recommendation: Move to worker thread or separate service
    - location: src/services/data-processor.ts
      type: memory_intensive
      description: Loads entire dataset into memory
      recommendation: Implement streaming or pagination

compliance_analysis:
  standards_checked:
    - standard: OWASP Top 10
      status: pass
      findings: 2 minor issues
    - standard: CIS Docker Benchmark
      status: review_needed
      findings: 5 recommendations
    - standard: 12-Factor App
      status: pass
      adherence: 11/12 factors
  data_handling:
    pii_detected: true
    pii_types: [email, name, phone_number]
    gdpr_relevant: true
    encryption_at_rest: false # ⚠️ RECOMMENDATION
    encryption_in_transit: true
    audit_logging: partial # ⚠️ RECOMMENDATION
```

### Analyze with Preset for Node.js

```bash
/itg:analyze --preset=node --output=summary
```

This filters analysis to only Node.js-relevant files (`.js`, `.ts`, `.jsx`, `.tsx`, `.json`), providing focused results.

### Multi-Repository Analysis

```bash
/itg:analyze ./microservices/** --depth=standard --output=json > analysis-results.json
```

Analyzes multiple repositories in parallel, aggregating results into a unified view showing cross-service dependencies and shared infrastructure patterns.

### Exclude Test and Build Artifacts

```bash
/itg:analyze --exclude="**/*.test.ts,**/*.spec.ts,dist/**,build/**,coverage/**"
```

Focuses analysis on production code, ignoring test files and build outputs.

## Output Formats

### Summary Format (Default)
- Human-readable text output
- Key findings highlighted
- Actionable recommendations
- Perfect for initial exploration and quick checks

### JSON Format
- Complete structured data
- Machine-readable for automation
- Enables integration with other tools
- Best for programmatic processing

### YAML Format
- Structured but human-friendly
- Easy to review and diff
- Good for documentation
- Ideal for configuration management workflows

## Integration with Source-Analyzer Agent

The `/itg:analyze` command delegates deep code analysis to the specialized `source-analyzer` agent:

```typescript
// Internal workflow
const analysis = await orchestrator.invoke('source-analyzer', {
  action: 'analyze_codebase',
  path: args.path,
  options: {
    depth: flags.depth,
    include: flags.include,
    exclude: flags.exclude,
    extractPatterns: true,
    detectInfrastructure: true,
    analyzeArchitecture: true
  }
});

// Source-analyzer agent spawns sub-agents for language-specific analysis
const subAgents = [
  'typescript-analyzer',  // For TS/JS code
  'python-analyzer',      // For Python code
  'terraform-analyzer',   // For IaC
  'docker-analyzer',      // For containers
  'config-analyzer'       // For configs
];
```

The agent architecture ensures:
- **Parallel Processing**: Multiple sub-agents work simultaneously
- **Specialized Expertise**: Each agent has deep domain knowledge
- **Incremental Caching**: Results cached for faster re-analysis
- **Context Preservation**: Maintains cross-file relationships

## Analysis Depth Levels

### Quick (1-2 minutes)
- File discovery and classification
- Basic pattern matching
- Dependency extraction from package managers
- Dockerfile/config file parsing
- **Use when**: Initial exploration or rapid feedback needed

### Standard (3-5 minutes)
- Everything in Quick, plus:
- Code structure analysis
- Configuration schema extraction
- Service boundary identification
- Resource requirement estimation
- **Use when**: Generating templates or infrastructure (default)

### Deep (10-15 minutes)
- Everything in Standard, plus:
- Static code analysis (security, performance)
- Compliance checking
- Cross-repository relationship mapping
- Optimization recommendations
- **Use when**: Production readiness assessment or comprehensive audit

## Common Workflows

### 1. New Project Template Generation

```bash
# Step 1: Analyze existing service
/itg:analyze ./reference-service --output=json > reference-analysis.json

# Step 2: Generate template from patterns
/itg:generate --from-analysis=reference-analysis.json --output=./templates/

# Step 3: Apply template to new service
/itg:apply --template=./templates/microservice --target=./new-service
```

### 2. Infrastructure Audit and Update

```bash
# Step 1: Deep analysis with security focus
/itg:analyze --depth=deep --output=yaml > current-state.yml

# Step 2: Generate updated Terraform
/itg:terraform --from-analysis=current-state.yml --provider=aws

# Step 3: Review and apply changes
# (Manual review of generated Terraform, then apply)
```

### 3. Multi-Service Standardization

```bash
# Step 1: Analyze all services
for service in services/*; do
  /itg:analyze "$service" --output=json > "analysis-$(basename $service).json"
done

# Step 2: Find common patterns
/itg:consolidate --analyses=analysis-*.json --output=patterns.json

# Step 3: Generate standard template
/itg:generate --from-patterns=patterns.json --type=standard-microservice
```

## Related Commands

### Generate Templates
```bash
/itg:generate --from-analysis=analysis.json
```
Creates infrastructure templates based on analysis results.

### Generate Terraform
```bash
/itg:terraform --from-analysis=analysis.json --provider=aws
```
Converts analysis into Terraform infrastructure code.

### Generate CI/CD Pipeline
```bash
/itg:harness --from-analysis=analysis.json
```
Creates Harness pipeline configurations based on detected build patterns.

### Apply Templates
```bash
/itg:apply --template=generated-template --target=./new-project
```
Applies generated templates to new or existing projects.

## Best Practices

### Analysis Strategy

1. **Start with Quick**: Get rapid feedback before committing to deep analysis
2. **Use Presets**: Leverage presets for faster, more focused analysis
3. **Exclude Noise**: Always exclude test files, build artifacts, and dependencies
4. **Save Results**: Use `--output=json` and save for later template generation
5. **Incremental Updates**: Re-run analysis after significant changes

### Pattern Recognition

The analyzer looks for these key signals:

**Container Signals**:
- Dockerfile, docker-compose.yml
- .dockerignore, container registries in config

**Database Signals**:
- Connection strings in config/environment
- Migration directories, ORM configurations
- Database client libraries in dependencies

**Cloud Provider Signals**:
- SDK imports (aws-sdk, @azure/*, @google-cloud/*)
- Cloud-specific config files
- IAM role/service principal references

**CI/CD Signals**:
- .github/workflows, .gitlab-ci.yml, .harness/
- Build scripts in package.json or Makefile
- Deployment configurations

### Security Considerations

When `--depth=deep`:
- **Scans for hardcoded secrets**: API keys, passwords, tokens
- **Checks for vulnerable dependencies**: CVEs in package versions
- **Validates encryption usage**: Crypto algorithms, key management
- **Reviews access patterns**: File permissions, API authentication

**Important**: Deep analysis results may contain sensitive information. Use `--output=json` with caution in shared environments.

### Performance Tips

- **Use `--include` patterns**: Reduce scan scope for faster results
- **Leverage presets**: Pre-configured patterns for common project types
- **Cache results**: Analysis results include cache keys for incremental updates
- **Parallel execution**: Analyzing multiple projects? Run in parallel for speed

## Troubleshooting

### "No patterns found"
- Check `--include` and `--exclude` patterns
- Verify path is correct
- Try `--depth=deep` for more thorough analysis

### "Analysis timeout"
- Large codebase? Use `--include` to focus on specific files
- Try `--depth=quick` first to validate patterns
- Exclude large binary or generated files

### "Agent invocation failed"
- Ensure `source-analyzer` agent is installed
- Check agent logs: `.claude/logs/source-analyzer.log`
- Verify agent dependencies are available

## Output Storage

Analysis results are automatically saved to:

```
.claude/analysis/
  ├── {timestamp}-analysis.json          # Full analysis results
  ├── {timestamp}-summary.txt            # Human-readable summary
  └── cache/
      └── {path-hash}.json               # Cached results for incremental updates
```

Results are also sent to **Obsidian vault** for long-term documentation:

```
C:\Users\MarkusAhling\obsidian\Projects\{project}\Analysis\
  └── {date}-infrastructure-analysis.md
```

## API Integration

The command exposes a programmatic API for custom workflows:

```typescript
import { ITGAnalyzer } from '@claude/plugins/infrastructure-template-generator';

const analyzer = new ITGAnalyzer();

const results = await analyzer.analyze({
  path: './backend',
  depth: 'standard',
  include: '**/*.ts',
  exclude: '**/*.test.ts'
});

console.log(results.infrastructure_requirements);
console.log(results.recommendations);
```

## Version History

- **1.0.0** (2026-01-19): Initial release with core analysis capabilities

## Support

For issues or feature requests:
- GitHub: https://github.com/brookside-bi/claude-itg
- Documentation: Obsidian vault at `C:\Users\MarkusAhling\obsidian\Projects/ITG/`
- Email: support@brooksidebi.com

---

**Next Steps After Analysis:**

1. Review recommendations in analysis output
2. Run `/itg:generate` to create templates from patterns
3. Run `/itg:terraform` to generate infrastructure code
4. Run `/itg:harness` to create CI/CD pipelines
5. Document findings in Obsidian vault
