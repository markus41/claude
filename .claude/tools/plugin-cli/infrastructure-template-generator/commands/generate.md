---
name: itg:generate
description: Generate Cookiecutter templates from analyzed source patterns
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: name
    description: Name for the generated template
    required: true
    type: string
flags:
  - name: analysis
    description: Path to analysis results JSON file
    type: string
  - name: output
    description: Output directory for generated template
    type: string
    default: "./templates"
  - name: engine
    description: Template engine to use
    type: choice
    choices: [cookiecutter, copier]
    default: cookiecutter
  - name: include-hooks
    description: Include pre/post generation hooks
    type: boolean
    default: true
  - name: validate
    description: Validate generated template syntax
    type: boolean
    default: true
presets:
  - name: minimal
    description: Generate minimal template structure
    flags:
      include-hooks: false
  - name: full
    description: Generate complete template with all features
    flags:
      include-hooks: true
      validate: true
---

# Infrastructure Template Generator: Generate Command

**Best for:** Creating reusable Cookiecutter templates from analyzed infrastructure patterns, enabling rapid project scaffolding and standardization across teams.

## Overview

The `itg:generate` command transforms infrastructure pattern analysis results into production-ready Cookiecutter templates. It extracts configuration patterns, file structures, and common conventions from your source infrastructure, creating templates that codify organizational best practices.

**Business Value:**
- Reduces project setup time from hours to minutes
- Ensures consistency across infrastructure deployments
- Captures and distributes organizational knowledge
- Eliminates manual configuration errors
- Scales expertise across teams

## Command Workflow

### Phase 1: Analysis Loading
1. Load pattern analysis results from JSON file
2. Extract identified patterns (configuration, file structure, naming conventions)
3. Parse variable definitions and their constraints
4. Identify common file templates and their variations

### Phase 2: Template Structure Generation
1. Create template directory structure based on source patterns
2. Generate `cookiecutter.json` with discovered variables
3. Create templated versions of source files with variable substitutions
4. Build directory structure with conditional paths
5. Generate `.cookiecutterrc` for defaults

### Phase 3: Hook Generation (if enabled)
1. Create `hooks/pre_gen_project.py` for validation
2. Create `hooks/post_gen_project.py` for initialization
3. Add dependency installation logic
4. Include environment setup scripts
5. Generate cleanup and finalization tasks

### Phase 4: Documentation Generation
1. Create `README.md` with usage instructions
2. Generate `VARIABLES.md` documenting all template variables
3. Create `EXAMPLES.md` with common usage scenarios
4. Build `CONTRIBUTING.md` for template maintenance
5. Add inline documentation to template files

### Phase 5: Validation (if enabled)
1. Validate Jinja2 syntax in all template files
2. Check `cookiecutter.json` schema validity
3. Verify hook script syntax
4. Test variable substitution logic
5. Validate directory structure conventions

## Generated Template Structure

```
templates/
└── {{name}}/
    ├── cookiecutter.json              # Template variables and defaults
    ├── .cookiecutterrc                # Default configuration
    ├── README.md                      # Usage documentation
    ├── VARIABLES.md                   # Variable reference
    ├── EXAMPLES.md                    # Usage examples
    ├── CONTRIBUTING.md                # Maintenance guide
    ├── hooks/                         # Generation lifecycle hooks
    │   ├── pre_gen_project.py         # Pre-generation validation
    │   └── post_gen_project.py        # Post-generation setup
    └── {{cookiecutter.project_slug}}/ # Template content
        ├── {{cookiecutter.app_name}}/
        │   ├── __init__.py
        │   └── config.py
        ├── infrastructure/
        │   ├── terraform/
        │   │   ├── main.tf
        │   │   ├── variables.tf
        │   │   └── outputs.tf
        │   ├── kubernetes/
        │   │   ├── deployment.yaml
        │   │   └── service.yaml
        │   └── docker/
        │       └── Dockerfile
        ├── .github/
        │   └── workflows/
        │       └── ci.yml
        ├── tests/
        │   └── test_{{cookiecutter.app_name}}.py
        ├── requirements.txt
        ├── setup.py
        └── README.md
```

## cookiecutter.json Example

Based on analysis results, the generator creates a comprehensive variable definition file:

```json
{
  "project_name": "My Infrastructure Project",
  "project_slug": "{{ cookiecutter.project_name.lower().replace(' ', '_').replace('-', '_') }}",
  "app_name": "{{ cookiecutter.project_slug }}",
  "author_name": "Your Organization",
  "author_email": "devops@example.com",
  "description": "Infrastructure project description",
  "version": "0.1.0",

  "cloud_provider": ["aws", "azure", "gcp"],
  "region": "us-east-1",
  "environment": ["dev", "staging", "prod"],

  "use_terraform": "y",
  "terraform_version": "1.9.0",

  "use_kubernetes": "y",
  "kubernetes_version": "1.30",
  "cluster_name": "{{ cookiecutter.project_slug }}-cluster",

  "use_docker": "y",
  "docker_registry": "ghcr.io",
  "docker_image_prefix": "{{ cookiecutter.author_name.lower() }}",

  "use_ci_cd": "y",
  "ci_provider": ["github-actions", "gitlab-ci", "jenkins"],

  "monitoring_enabled": "y",
  "monitoring_stack": ["prometheus", "datadog", "cloudwatch"],

  "secrets_backend": ["aws-secrets-manager", "azure-keyvault", "hashicorp-vault"],

  "include_examples": "y",
  "include_tests": "y",
  "license": ["MIT", "Apache-2.0", "proprietary"],

  "_copy_without_render": [
    "*.svg",
    "*.png",
    "*.jpg",
    "*.jpeg",
    "*.gif"
  ],

  "_extensions": [
    "jinja2_time.TimeExtension"
  ]
}
```

## Hook Script Examples

### Pre-Generation Hook (`hooks/pre_gen_project.py`)

Validates input and enforces constraints before template generation:

```python
#!/usr/bin/env python
"""
Pre-generation hook for infrastructure template.
Validates inputs and enforces business rules.
"""
import re
import sys

# Load cookiecutter context
project_slug = "{{ cookiecutter.project_slug }}"
cloud_provider = "{{ cookiecutter.cloud_provider }}"
terraform_version = "{{ cookiecutter.terraform_version }}"
kubernetes_version = "{{ cookiecutter.kubernetes_version }}"

# Validation rules
SLUG_REGEX = r"^[a-z][a-z0-9_]*$"
VERSION_REGEX = r"^\d+\.\d+(\.\d+)?$"
CLOUD_PROVIDERS = ["aws", "azure", "gcp"]

errors = []

# Validate project slug format
if not re.match(SLUG_REGEX, project_slug):
    errors.append(
        f"ERROR: project_slug '{project_slug}' is invalid. "
        "Must start with lowercase letter and contain only lowercase letters, numbers, and underscores."
    )

# Validate cloud provider selection
if cloud_provider not in CLOUD_PROVIDERS:
    errors.append(
        f"ERROR: cloud_provider must be one of: {', '.join(CLOUD_PROVIDERS)}"
    )

# Validate version formats
if "{{ cookiecutter.use_terraform }}" == "y":
    if not re.match(VERSION_REGEX, terraform_version):
        errors.append(
            f"ERROR: terraform_version '{terraform_version}' is invalid. "
            "Must be in format X.Y or X.Y.Z"
        )

if "{{ cookiecutter.use_kubernetes }}" == "y":
    if not re.match(VERSION_REGEX, kubernetes_version):
        errors.append(
            f"ERROR: kubernetes_version '{kubernetes_version}' is invalid. "
            "Must be in format X.Y or X.Y.Z"
        )

# Cloud-specific validations
if cloud_provider == "aws":
    region = "{{ cookiecutter.region }}"
    if not region.startswith(("us-", "eu-", "ap-", "sa-", "ca-", "me-", "af-")):
        errors.append(
            f"WARNING: region '{region}' may not be a valid AWS region"
        )

# Report errors and exit if validation fails
if errors:
    print("\n" + "=" * 70)
    print("Template Generation Validation Failed")
    print("=" * 70)
    for error in errors:
        print(f"\n{error}")
    print("\n" + "=" * 70)
    sys.exit(1)

print("✓ Pre-generation validation passed")
```

### Post-Generation Hook (`hooks/post_gen_project.py`)

Initializes the generated project with required dependencies and configuration:

```python
#!/usr/bin/env python
"""
Post-generation hook for infrastructure template.
Initializes project structure and installs dependencies.
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path.cwd()

def run_command(cmd, cwd=None, check=True):
    """Execute shell command with error handling."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd or PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=check
        )
        if result.stdout:
            print(result.stdout)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error executing: {cmd}")
        print(e.stderr)
        return False

def initialize_git():
    """Initialize git repository if not already initialized."""
    if not (PROJECT_ROOT / ".git").exists():
        print("Initializing git repository...")
        run_command("git init")
        run_command("git add .")
        run_command('git commit -m "Initial commit from template"')
        print("✓ Git repository initialized")

def setup_terraform():
    """Initialize Terraform configuration."""
    if "{{ cookiecutter.use_terraform }}" == "y":
        tf_dir = PROJECT_ROOT / "infrastructure" / "terraform"
        if tf_dir.exists():
            print("Initializing Terraform...")
            if run_command("terraform init", cwd=tf_dir, check=False):
                print("✓ Terraform initialized")
            else:
                print("⚠ Terraform initialization failed (this is normal if providers aren't configured)")

def setup_python_environment():
    """Set up Python virtual environment and install dependencies."""
    requirements_file = PROJECT_ROOT / "requirements.txt"
    if requirements_file.exists():
        print("Setting up Python environment...")

        # Create virtual environment
        venv_path = PROJECT_ROOT / "venv"
        if not venv_path.exists():
            run_command(f"{sys.executable} -m venv venv", check=False)

        print("✓ Python environment setup complete")
        print("  Activate with: source venv/bin/activate (Unix) or .\\venv\\Scripts\\activate (Windows)")

def setup_pre_commit():
    """Install and configure pre-commit hooks if .pre-commit-config.yaml exists."""
    pre_commit_config = PROJECT_ROOT / ".pre-commit-config.yaml"
    if pre_commit_config.exists():
        print("Setting up pre-commit hooks...")
        if run_command("pre-commit install", check=False):
            print("✓ Pre-commit hooks installed")

def remove_unused_files():
    """Remove files based on template choices."""
    # Remove Terraform if not used
    if "{{ cookiecutter.use_terraform }}" == "n":
        tf_dir = PROJECT_ROOT / "infrastructure" / "terraform"
        if tf_dir.exists():
            shutil.rmtree(tf_dir)
            print("✓ Removed unused Terraform directory")

    # Remove Kubernetes if not used
    if "{{ cookiecutter.use_kubernetes }}" == "n":
        k8s_dir = PROJECT_ROOT / "infrastructure" / "kubernetes"
        if k8s_dir.exists():
            shutil.rmtree(k8s_dir)
            print("✓ Removed unused Kubernetes directory")

    # Remove Docker if not used
    if "{{ cookiecutter.use_docker }}" == "n":
        dockerfile = PROJECT_ROOT / "Dockerfile"
        if dockerfile.exists():
            dockerfile.unlink()
            print("✓ Removed unused Dockerfile")

    # Remove examples if not requested
    if "{{ cookiecutter.include_examples }}" == "n":
        examples_dir = PROJECT_ROOT / "examples"
        if examples_dir.exists():
            shutil.rmtree(examples_dir)
            print("✓ Removed examples directory")

    # Remove tests if not requested
    if "{{ cookiecutter.include_tests }}" == "n":
        tests_dir = PROJECT_ROOT / "tests"
        if tests_dir.exists():
            shutil.rmtree(tests_dir)
            print("✓ Removed tests directory")

def generate_summary():
    """Print project generation summary."""
    print("\n" + "=" * 70)
    print("Project Generated Successfully!")
    print("=" * 70)
    print(f"\nProject: {{ cookiecutter.project_name }}")
    print(f"Location: {PROJECT_ROOT}")
    print(f"Cloud Provider: {{ cookiecutter.cloud_provider }}")
    print(f"Environment: {{ cookiecutter.environment }}")

    print("\nEnabled Features:")
    if "{{ cookiecutter.use_terraform }}" == "y":
        print("  • Terraform (v{{ cookiecutter.terraform_version }})")
    if "{{ cookiecutter.use_kubernetes }}" == "y":
        print("  • Kubernetes (v{{ cookiecutter.kubernetes_version }})")
    if "{{ cookiecutter.use_docker }}" == "y":
        print("  • Docker")
    if "{{ cookiecutter.use_ci_cd }}" == "y":
        print("  • CI/CD ({{ cookiecutter.ci_provider }})")
    if "{{ cookiecutter.monitoring_enabled }}" == "y":
        print("  • Monitoring ({{ cookiecutter.monitoring_stack }})")

    print("\nNext Steps:")
    print("  1. Review and customize configuration files")
    print("  2. Configure cloud provider credentials")
    print("  3. Update infrastructure variables in terraform/variables.tf")
    print("  4. Review README.md for detailed instructions")
    print("  5. Run 'terraform plan' to validate infrastructure")

    print("\n" + "=" * 70)

def main():
    """Execute all post-generation tasks."""
    print("\nRunning post-generation setup...")
    print("=" * 70)

    remove_unused_files()
    initialize_git()
    setup_terraform()
    setup_python_environment()
    setup_pre_commit()
    generate_summary()

if __name__ == "__main__":
    main()
```

## Usage Examples

### Basic Template Generation

Generate a template from analysis results with default settings:

```bash
/itg:generate my-infra-template \
  --analysis ./analysis/terraform-patterns.json
```

**Expected Output:**
```
Generating Infrastructure Template: my-infra-template
====================================================================

Phase 1: Loading Analysis Results
  ✓ Loaded analysis from terraform-patterns.json
  ✓ Identified 47 configuration patterns
  ✓ Extracted 23 template variables
  ✓ Found 15 file templates

Phase 2: Generating Template Structure
  ✓ Created template directory structure
  ✓ Generated cookiecutter.json with 23 variables
  ✓ Created 15 templated files
  ✓ Built conditional directory structure
  ✓ Generated .cookiecutterrc

Phase 3: Generating Hooks
  ✓ Created pre_gen_project.py with validation logic
  ✓ Created post_gen_project.py with setup tasks
  ✓ Added dependency installation logic
  ✓ Included environment setup scripts

Phase 4: Generating Documentation
  ✓ Created README.md (342 lines)
  ✓ Generated VARIABLES.md (23 variables documented)
  ✓ Created EXAMPLES.md (5 usage scenarios)
  ✓ Built CONTRIBUTING.md
  ✓ Added inline documentation to 15 files

Phase 5: Validating Template
  ✓ Validated Jinja2 syntax in 15 files
  ✓ Verified cookiecutter.json schema
  ✓ Checked hook script syntax
  ✓ Tested variable substitution logic
  ✓ Validated directory structure

Template generated successfully!
Location: ./templates/my-infra-template
Files created: 37
Lines of code: 1,245

Next steps:
  1. Review generated template structure
  2. Test template: cookiecutter ./templates/my-infra-template
  3. Customize variables in cookiecutter.json
  4. Update documentation as needed
```

### Minimal Template (No Hooks)

Generate a minimal template without lifecycle hooks:

```bash
/itg:generate lightweight-template \
  --analysis ./analysis/simple-project.json \
  --preset minimal \
  --output ./templates
```

**Use Case:** When you need a simple scaffolding template without validation or post-generation setup.

### Full-Featured Template

Generate a comprehensive template with all features enabled:

```bash
/itg:generate enterprise-template \
  --analysis ./analysis/enterprise-patterns.json \
  --preset full \
  --engine cookiecutter
```

**Generated Features:**
- Comprehensive variable validation
- Pre-generation constraint checking
- Post-generation initialization
- Dependency installation
- Environment setup
- Git initialization
- Pre-commit hook installation

### Custom Output Location

Generate template to a specific directory:

```bash
/itg:generate cloud-infra \
  --analysis ./analysis/aws-terraform.json \
  --output ~/my-templates/infrastructure
```

### Generate Without Validation

Skip validation for faster generation during development:

```bash
/itg:generate dev-template \
  --analysis ./analysis/local-dev.json \
  --validate false \
  --include-hooks false
```

### Generate with Copier Engine

Use Copier instead of Cookiecutter as the template engine:

```bash
/itg:generate modern-template \
  --analysis ./analysis/patterns.json \
  --engine copier
```

**Note:** Copier templates use `copier.yml` instead of `cookiecutter.json` and support more advanced templating features.

## Generated Documentation Examples

### README.md Structure

The generator creates comprehensive README documentation:

```markdown
# {{cookiecutter.project_name}}

{{cookiecutter.description}}

## Quick Start

Generate a new project from this template:

\`\`\`bash
cookiecutter gh:your-org/my-infra-template
\`\`\`

## Features

- ✅ Terraform infrastructure as code
- ✅ Kubernetes deployment manifests
- ✅ Docker containerization
- ✅ CI/CD pipeline configuration
- ✅ Monitoring and observability setup
- ✅ Security best practices

## Requirements

- Terraform >= {{cookiecutter.terraform_version}}
- Kubernetes >= {{cookiecutter.kubernetes_version}}
- Docker >= 20.10
- Python >= 3.9

## Template Variables

See [VARIABLES.md](VARIABLES.md) for detailed variable documentation.

## Usage Examples

See [EXAMPLES.md](EXAMPLES.md) for common usage scenarios.

## Project Structure

\`\`\`
{{cookiecutter.project_slug}}/
├── infrastructure/       # Infrastructure as code
├── {{cookiecutter.app_name}}/  # Application code
├── tests/               # Test suites
├── .github/             # CI/CD workflows
└── README.md            # Project documentation
\`\`\`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for template maintenance guidelines.
```

### VARIABLES.md Structure

Documents all template variables with descriptions and examples:

```markdown
# Template Variables Reference

## Required Variables

### project_name
- **Description:** Human-readable project name
- **Type:** String
- **Example:** `My Infrastructure Project`
- **Validation:** Must not be empty

### project_slug
- **Description:** Python/filesystem-safe project identifier
- **Type:** String
- **Default:** Computed from `project_name`
- **Example:** `my_infrastructure_project`
- **Validation:** Must match pattern `^[a-z][a-z0-9_]*$`

## Cloud Configuration

### cloud_provider
- **Description:** Cloud provider for infrastructure deployment
- **Type:** Choice
- **Options:** `aws`, `azure`, `gcp`
- **Default:** `aws`
- **Example:** `aws`

### region
- **Description:** Cloud provider region for resource deployment
- **Type:** String
- **Default:** `us-east-1`
- **Example:** `us-west-2`

## Feature Toggles

### use_terraform
- **Description:** Include Terraform infrastructure code
- **Type:** Boolean (y/n)
- **Default:** `y`
- **Impact:** Includes/excludes `infrastructure/terraform/` directory

### use_kubernetes
- **Description:** Include Kubernetes deployment manifests
- **Type:** Boolean (y/n)
- **Default:** `y`
- **Impact:** Includes/excludes `infrastructure/kubernetes/` directory

## Version Configuration

### terraform_version
- **Description:** Required Terraform version
- **Type:** Version String
- **Default:** `1.9.0`
- **Example:** `1.8.5`
- **Validation:** Must match pattern `^\d+\.\d+(\.\d+)?$`
```

## Integration with Other Commands

### Workflow: Analyze → Generate → Test

```bash
# Step 1: Analyze existing infrastructure
/itg:analyze ./reference-projects/terraform-infra \
  --output ./analysis/terraform-patterns.json

# Step 2: Generate template from analysis
/itg:generate terraform-template \
  --analysis ./analysis/terraform-patterns.json \
  --output ./templates

# Step 3: Test generated template
/itg:test terraform-template \
  --template-dir ./templates/terraform-template
```

### Workflow: Generate → Preview → Refine

```bash
# Generate initial template
/itg:generate initial-template \
  --analysis ./analysis/patterns.json

# Preview what the template will generate
/itg:preview initial-template \
  --template-dir ./templates/initial-template

# Refine template based on preview
# (manual editing of cookiecutter.json and template files)

# Re-validate after refinements
/itg:validate ./templates/initial-template
```

## Best Practices

### Variable Naming Conventions

**Use descriptive, hierarchical names:**
- ✅ `cloud_provider`, `aws_region`, `kubernetes_cluster_name`
- ❌ `provider`, `region`, `name`

**Group related variables with prefixes:**
- ✅ `monitoring_enabled`, `monitoring_stack`, `monitoring_retention_days`
- ❌ `enable_mon`, `stack`, `retention`

### Template Organization

**Organize files logically:**
```
{{cookiecutter.project_slug}}/
├── infrastructure/    # Infrastructure code
├── application/       # Application code
├── configuration/     # Configuration files
├── documentation/     # Project docs
└── scripts/          # Automation scripts
```

**Use conditional directories:**
```
{% if cookiecutter.use_docker == 'y' %}
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
{% endif %}
```

### Validation Strategy

**Pre-generation validation should check:**
- Variable format and constraints
- Required variable presence
- Cross-variable dependencies
- Business rule enforcement

**Post-generation validation should verify:**
- File structure completeness
- Syntax validity
- Dependency availability
- Configuration coherence

### Documentation Quality

**Always include:**
- Quick start guide
- Complete variable reference
- Multiple usage examples
- Troubleshooting section
- Contributing guidelines

**Make documentation discoverable:**
- Link related documentation
- Use clear section headings
- Include table of contents
- Provide search-friendly keywords

## Troubleshooting

### Template Generation Fails

**Problem:** Generation fails with Jinja2 syntax error

**Solution:**
1. Review analysis results for malformed patterns
2. Check for special characters in variable names
3. Validate Jinja2 syntax manually
4. Run with `--validate false` to bypass validation
5. Review generated files for syntax issues

### Missing Variables

**Problem:** Generated template is missing expected variables

**Solution:**
1. Review analysis results JSON file
2. Check pattern extraction configuration
3. Verify variable detection thresholds
4. Manually add missing variables to `cookiecutter.json`

### Hook Scripts Don't Execute

**Problem:** Pre/post generation hooks don't run

**Solution:**
1. Verify hooks have execute permissions
2. Check Python shebang line is correct
3. Validate Python syntax in hook scripts
4. Test hooks manually with sample data
5. Review Cookiecutter logs for error messages

### Template Variables Not Substituting

**Problem:** Template variables remain as `{{...}}` after generation

**Solution:**
1. Check Jinja2 syntax is correct
2. Verify variable names match `cookiecutter.json`
3. Review `_copy_without_render` exclusions
4. Test template generation with Cookiecutter CLI
5. Check for escaped braces `\{\{...\}\}`

## Related Commands

- `/itg:analyze` - Analyze infrastructure patterns to extract templates
- `/itg:test` - Test generated templates with sample data
- `/itg:validate` - Validate template syntax and structure
- `/itg:preview` - Preview template output without generation
- `/itg:refine` - Iteratively improve generated templates
- `/itg:publish` - Publish templates to template repository

## Technical Implementation Notes

### Template Engine Support

**Cookiecutter (default):**
- Jinja2 templating
- JSON configuration
- Python hooks
- Wide ecosystem support

**Copier:**
- Jinja2 templating with extensions
- YAML configuration
- Python/Shell hooks
- Task automation
- Update capabilities

### Variable Type Detection

The generator detects variable types from analysis:

| Pattern | Detected Type |
|---------|---------------|
| `true`/`false` values | Boolean (`y`/`n`) |
| Multiple distinct values | Choice list |
| Numeric values | Number/String |
| Path-like strings | Path |
| Email-like strings | String with validation |
| Version strings | Version with regex |

### Hook Execution Context

Hooks execute with these environment variables available:

```python
{
    "cookiecutter": {
        # All template variables
    },
    "PROJECT_ROOT": "/path/to/generated/project",
    "TEMPLATE_ROOT": "/path/to/template"
}
```

### Performance Considerations

**Large templates (100+ files):**
- Generation time: 5-30 seconds
- Validation time: 10-60 seconds
- Hook execution: 10-120 seconds

**Optimization strategies:**
- Disable validation for development
- Skip hooks for faster iteration
- Use minimal preset for quick tests
- Cache analysis results

## See Also

- **Infrastructure Template Generator Plugin:** `.claude/tools/plugin-cli/infrastructure-template-generator/README.md`
- **Analysis Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/analyze.md`
- **Testing Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/test.md`
- **Cookiecutter Documentation:** https://cookiecutter.readthedocs.io/
- **Copier Documentation:** https://copier.readthedocs.io/
- **Jinja2 Documentation:** https://jinja.palletsprojects.com/
