---
description: Deep security vulnerability and secret scanning.
---

# /security-scan

Deep security vulnerability and secret scanning.

## Usage

```bash
/security-scan [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--deep` | Full deep scan (slower) | false |
| `--secrets` | Only scan for secrets | false |
| `--deps` | Only scan dependencies | false |
| `--sast` | Only run SAST analysis | false |
| `--severity=<level>` | Minimum severity | medium |
| `--fail-on=<level>` | Fail on severity | high |
| `--ignore=<pattern>` | Ignore paths | node_modules |

## Examples

```bash
# Standard security scan
/security-scan

# Deep scan with all checks
/security-scan --deep

# Only check for exposed secrets
/security-scan --secrets

# Fail only on critical issues
/security-scan --fail-on=critical

# CI mode
/security-scan --ci --severity=high --fail-on=high
```

## Scan Types

### Secret Detection
- API keys (AWS, GCP, Azure, etc.)
- Database credentials
- Private keys (SSH, GPG)
- OAuth tokens
- JWT secrets

### Vulnerability Scanning
- Known CVEs in dependencies
- Insecure code patterns
- OWASP Top 10 issues

### SAST Analysis
- SQL injection
- XSS vulnerabilities
- Command injection
- Path traversal
- Insecure deserialization

## Output

```
🔒 SECURITY SCAN REPORT
═══════════════════════════════════════════════════════

Secrets Detection:     ✓ PASS (0 secrets found)
Dependency Vulnerabilities:  ⚠ WARN (2 medium)
SAST Analysis:         ✓ PASS (0 critical issues)

Findings:
┌─────────┬────────────┬─────────────────────────────┐
│ Severity│ Type       │ Description                 │
├─────────┼────────────┼─────────────────────────────┤
│ MEDIUM  │ CVE        │ lodash@4.17.19 - CVE-2021-23337 │
│ MEDIUM  │ CVE        │ axios@0.21.0 - CVE-2021-3749    │
└─────────┴────────────┴─────────────────────────────┘

Recommendations:
• Upgrade lodash to 4.17.21
• Upgrade axios to 0.21.4+
```
