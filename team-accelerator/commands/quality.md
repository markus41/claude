---
description: Run comprehensive code quality checks including linting, static analysis, security scanning, and dependency audits
arguments:
  - name: scope
    description: "Check scope: all, lint, security, deps, or metrics"
    required: false
  - name: fix
    description: "Auto-fix issues where possible: true or false (default: false)"
    required: false
---

# Quality Command

Run comprehensive code quality checks to ensure your codebase meets enterprise standards.

## Usage

```bash
/quality [scope] [--fix]
```

## Examples

```bash
# Run all quality checks
/quality

# Run only linting with auto-fix
/quality lint --fix

# Run security scans only
/quality security

# Check dependency vulnerabilities
/quality deps

# Get code metrics
/quality metrics
```

## Execution Flow

### 1. Detect Project Type

```bash
# Detect project type and available tools
if [ -f "package.json" ]; then
  PROJECT_TYPE="node"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  PROJECT_TYPE="python"
elif [ -f "go.mod" ]; then
  PROJECT_TYPE="go"
elif [ -f "Cargo.toml" ]; then
  PROJECT_TYPE="rust"
elif [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
  PROJECT_TYPE="java"
fi
```

### 2. Linting Checks

#### JavaScript/TypeScript
```bash
# ESLint
npx eslint . --ext .js,.jsx,.ts,.tsx ${FIX_FLAG}

# Prettier formatting
npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}" ${FIX_FLAG}

# TypeScript type checking
npx tsc --noEmit
```

#### Python
```bash
# Ruff (fast Python linter)
ruff check . ${FIX_FLAG}

# Black formatting
black --check . ${FIX_FLAG}

# mypy type checking
mypy .
```

#### Go
```bash
# golangci-lint
golangci-lint run ${FIX_FLAG}

# go vet
go vet ./...

# gofmt
gofmt -l .
```

### 3. Security Scanning

#### Dependency Vulnerabilities
```bash
# Node.js
npm audit --audit-level=moderate
npx snyk test

# Python
pip-audit
safety check

# Go
go list -json -m all | nancy sleuth

# Container images
trivy image ${DOCKER_IMAGE}
```

#### Static Application Security Testing (SAST)
```bash
# Multi-language SAST with Semgrep
semgrep --config=auto .

# SonarQube analysis
sonar-scanner \
  -Dsonar.projectKey=${PROJECT_NAME} \
  -Dsonar.sources=. \
  -Dsonar.host.url=${SONAR_URL} \
  -Dsonar.login=${SONAR_TOKEN}

# CodeQL (for GitHub repositories)
# Runs automatically via GitHub Actions
```

#### Secret Detection
```bash
# Detect hardcoded secrets
gitleaks detect --source . --verbose

# TruffleHog
trufflehog filesystem . --only-verified

# git-secrets
git secrets --scan
```

#### OWASP Checks
```bash
# OWASP Dependency Check
dependency-check --project ${PROJECT_NAME} --scan . --format HTML

# OWASP ZAP (for web applications)
zap-cli quick-scan --self-contained --start-options "-config api.disablekey=true" ${APP_URL}
```

### 4. Code Metrics

```bash
# Lines of code and complexity
cloc . --exclude-dir=node_modules,dist,build,.git

# Cyclomatic complexity (JavaScript/TypeScript)
npx complexity-report --format json src/

# Code coverage from tests
npx jest --coverage --coverageReporters=text-summary

# Technical debt estimation (SonarQube)
curl -s "${SONAR_URL}/api/measures/component?component=${PROJECT_NAME}&metricKeys=sqale_index,code_smells,bugs,vulnerabilities"
```

### 5. Quality Gates

Define and check quality gates:

```javascript
const qualityGates = {
  coverage: { min: 80 },           // Minimum 80% code coverage
  duplications: { max: 3 },        // Maximum 3% code duplication
  complexity: { max: 15 },         // Maximum cyclomatic complexity
  maintainability: { min: 'A' },   // Maintainability rating
  security: { rating: 'A' },       // Security rating
  reliability: { rating: 'A' },    // Reliability rating
  vulnerabilities: { max: 0 },     // Zero high/critical vulnerabilities
  codeSmells: { max: 50 },         // Maximum code smells
};
```

### 6. Generate Reports

```bash
# Create quality report directory
mkdir -p .quality-reports

# Generate HTML report
cat > .quality-reports/summary.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Quality Report - ${PROJECT_NAME}</title></head>
<body>
  <h1>Code Quality Report</h1>
  <h2>Generated: $(date)</h2>

  <h3>Linting</h3>
  <pre>${LINT_OUTPUT}</pre>

  <h3>Security</h3>
  <pre>${SECURITY_OUTPUT}</pre>

  <h3>Metrics</h3>
  <pre>${METRICS_OUTPUT}</pre>
</body>
</html>
EOF
```

## Quality Check Matrix

| Check | Tool | Scope | Auto-Fix |
|-------|------|-------|----------|
| Linting | ESLint, Ruff, golangci-lint | `lint` | ✅ |
| Formatting | Prettier, Black, gofmt | `lint` | ✅ |
| Type Checking | TypeScript, mypy | `lint` | ❌ |
| Dependencies | npm audit, pip-audit | `deps` | ⚠️ |
| SAST | Semgrep, SonarQube | `security` | ❌ |
| Secrets | Gitleaks, TruffleHog | `security` | ❌ |
| Containers | Trivy | `security` | ❌ |
| Complexity | complexity-report | `metrics` | ❌ |
| Coverage | Jest, pytest-cov | `metrics` | ❌ |

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/quality.yml
name: Quality Checks

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run linting
        run: npm run lint

      - name: Run security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Pre-commit Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: quality-check
        name: Quality Check
        entry: /quality lint --fix
        language: system
        pass_filenames: false
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                    CODE QUALITY REPORT                        ║
╠══════════════════════════════════════════════════════════════╣
║ Project: ${PROJECT_NAME}                                      ║
║ Date: ${DATE}                                                 ║
║ Scope: ${SCOPE}                                               ║
╠══════════════════════════════════════════════════════════════╣
║ LINTING                                                       ║
║   ESLint:     ✅ 0 errors, 3 warnings                        ║
║   Prettier:   ✅ All files formatted                         ║
║   TypeScript: ✅ No type errors                              ║
╠══════════════════════════════════════════════════════════════╣
║ SECURITY                                                      ║
║   Vulnerabilities: ⚠️ 2 moderate, 0 high, 0 critical         ║
║   Secrets:         ✅ No secrets detected                    ║
║   SAST:            ✅ 0 issues found                         ║
╠══════════════════════════════════════════════════════════════╣
║ METRICS                                                       ║
║   Coverage:    85.2%  ✅ (target: 80%)                       ║
║   Complexity:  12     ✅ (max: 15)                           ║
║   Duplication: 1.8%   ✅ (max: 3%)                           ║
║   Tech Debt:   2h     ✅ (max: 4h)                           ║
╠══════════════════════════════════════════════════════════════╣
║ QUALITY GATE: ✅ PASSED                                       ║
╚══════════════════════════════════════════════════════════════╝
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SONAR_URL` | SonarQube server URL | For SonarQube |
| `SONAR_TOKEN` | SonarQube auth token | For SonarQube |
| `SNYK_TOKEN` | Snyk API token | For Snyk scans |

## Related Commands

- `/test` - Run test suites
- `/deploy` - Deploy after quality checks pass
- `/status` - View quality trends
