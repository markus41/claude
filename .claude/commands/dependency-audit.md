# /dependency-audit - Dependency Health & Security Analysis

## Description
Comprehensive audit of all project dependencies for security vulnerabilities, outdated packages, conflicts, and licensing issues.

## Usage
```bash
/dependency-audit [scope] [report_type]
```

## Parameters
- **scope**: `security` | `updates` | `conflicts` | `licenses` | `all` (default: `all`)
- **report_type**: `summary` | `detailed` | `json` | `html` (default: `summary`)

## Examples

### Security audit only
```bash
/dependency-audit security
```

### Check for outdated packages
```bash
/dependency-audit updates detailed
```

### Identify dependency conflicts
```bash
/dependency-audit conflicts
```

### Full audit with HTML report
```bash
/dependency-audit all html
```

## Actions Performed
1. **Vulnerability Scan**: Checks npm audit, Snyk, GitHub advisories
2. **Version Analysis**: Detects outdated, insecure, or deprecated versions
3. **Conflict Detection**: Finds peer dependency and version conflicts
4. **License Check**: Validates license compatibility (MIT, Apache, GPL, etc.)
5. **Size Impact**: Analyzes bundle size contributions
6. **Update Suggestions**: Recommends safe upgrade paths

## Output Format
```
DEPENDENCY AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━━

🔒 SECURITY (2 vulnerabilities)
  🔴 lodash: 4.17.19 → CVE-2021-23337 (High)
     Fix: npm install lodash@4.17.21
  🟡 minimist: 1.2.0 → CVE-2021-44906 (Medium)
     Fix: npm install minimist@1.2.6

⚠️  OUTDATED (12 packages)
  react: 17.0.2 → 18.2.0 (Major)
  typescript: 4.5.0 → 5.0.0 (Major)
  jest: 27.5.0 → 29.0.0 (Major)

🔗 CONFLICTS (1 found)
  webpack@5.0 requires node-sass@5.x but got 6.x

📜 LICENSES (OK)
  All packages: Compatible

📦 BUNDLE IMPACT
  Total: 2.4 MB
  Largest: react (850 KB)

RECOMMENDATIONS:
  [Update] 10 safe updates available
  [Fix] 2 security vulnerabilities (CRITICAL)
  [Review] 2 major version upgrades needed
```

## Configuration
- Auto-check on install
- Fail build on critical vulnerabilities
- Allowed licenses whitelist
- Update frequency schedule
- Slack/email notifications

## Related Commands
- `/test` - Run tests after dependency updates
- `/build` - Build after changes
- `/security-scan` - Deeper security analysis
