# Team Accelerator Hooks

Production-ready hooks for quality gates, deployment notifications, test analysis, and documentation sync.

## Overview

This hooks system provides automated quality checks and team notifications throughout the development lifecycle. All hooks are configurable with advisory (warn-only) or strict (blocking) modes.

## Hooks

### 1. Pre-Commit Validator

**Event:** `PreToolUse` (Write, Edit)
**Purpose:** Validate code quality before changes are written
**Mode:** Configurable (advisory/strict)

**Checks:**
- Hardcoded secrets (API keys, passwords, tokens)
- Debug statements (console.log, print, etc.)
- TODO/FIXME comments without tracking
- Proper error handling for async operations
- Security vulnerabilities (SQL injection, XSS, command injection)
- File syntax validation
- Package file validation

**Configuration:**
```bash
# Set strict mode (blocks on issues)
export HOOK_STRICT_MODE=true

# Advisory mode (warns only)
export HOOK_STRICT_MODE=false
```

**Script:** `scripts/validate-code.sh`

**Usage:**
```bash
# Advisory mode
./scripts/validate-code.sh --file src/app.ts --advisory

# Strict mode
./scripts/validate-code.sh --file src/app.ts --strict
```

**Exit Codes:**
- `0` - All checks passed
- `1` - Critical issues (strict mode blocks)
- `2` - Warnings found (advisory mode)

---

### 2. Post-Deploy Notifier

**Event:** `PostToolUse` (Bash)
**Purpose:** Notify team on deployment-related actions
**Triggers:** deploy, kubectl, helm, docker, npm publish, terraform apply

**Features:**
- Parses deployment commands
- Extracts deployment type, action, target
- Logs activity to file
- Sends webhook notifications
- Slack integration support

**Configuration:**
```bash
# Set webhook URL for notifications
export DEPLOY_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Set project name
export PROJECT_NAME="my-awesome-app"
```

**Script:** `scripts/notify-deploy.sh`

**Usage:**
```bash
# Log deployment
./scripts/notify-deploy.sh --command "kubectl apply -f deploy.yaml" --project my-app

# With webhook
./scripts/notify-deploy.sh \
  --command "helm upgrade my-app ./chart" \
  --webhook-url "https://hooks.slack.com/..." \
  --channels log,webhook
```

**Notification Channels:**
- `log` - Write to log file (default)
- `webhook` - Send to webhook URL
- `slack` - Send formatted Slack message

---

### 3. Test Analyzer

**Event:** `Stop`
**Purpose:** Summarize test results at task completion

**Features:**
- Parses JUnit XML and Jest JSON test results
- Extracts coverage data
- Identifies failed tests
- Detects slow tests (>1s)
- Generates recommendations
- Creates markdown or JSON reports

**Script:** `scripts/analyze-tests.sh`

**Usage:**
```bash
# Analyze tests in current workspace
./scripts/analyze-tests.sh --workspace . --output-format markdown

# Generate report with task ID
./scripts/analyze-tests.sh \
  --task-id ABC123 \
  --report-path ./test-report.md \
  --output-format markdown
```

**Output Formats:**
- `markdown` - Human-readable markdown report
- `json` - Machine-readable JSON format

**Test Result Files Supported:**
- JUnit XML (`test-results.xml`, `junit.xml`, `pytest-report.xml`)
- Jest JSON (`test-results.json`)
- Coverage files (`coverage/coverage-final.json`, `.nyc_output/`)

---

### 4. Documentation Sync

**Event:** `PostToolUse` (Write)
**Purpose:** Auto-update documentation when code changes
**Triggers:** Writing to source files (ts, tsx, js, jsx, py, go, rs, java)

**Features:**
- Detects API changes (breaking changes)
- Identifies new exports (new features)
- Finds related documentation files
- Provides Obsidian vault integration
- Generates action item checklist

**Configuration:**
```bash
# Set Obsidian vault path
export OBSIDIAN_VAULT_PATH="$HOME/obsidian"

# Set project root
export PROJECT_ROOT="/path/to/project"
```

**Script:** `scripts/docs-sync.sh`

**Usage:**
```bash
# Check documentation for a file
./scripts/docs-sync.sh --file src/api/users.ts --project-root .

# With Obsidian integration
./scripts/docs-sync.sh \
  --file src/core.py \
  --obsidian-vault ~/obsidian
```

**Detected Changes:**
- Exported functions/classes/interfaces
- React components
- API routes (Next.js, Express, FastAPI, Flask)
- Public members (Python, Go, Rust, Java)

---

## Configuration

### Global Configuration

All hooks can be configured via environment variables or the `hooks.json` configuration file.

**Environment Variables:**
```bash
# Hook behavior
export HOOK_STRICT_MODE=false              # Advisory (default) or strict mode
export PROJECT_NAME="team-accelerator"     # Project identifier
export PROJECT_ROOT="/path/to/project"     # Project root directory

# Obsidian integration
export OBSIDIAN_VAULT_PATH="$HOME/obsidian"  # Path to Obsidian vault

# Deployment notifications
export DEPLOY_WEBHOOK_URL="https://..."     # Webhook for deployment notifications

# Plugin paths
export CLAUDE_PLUGIN_ROOT="/path/to/team-accelerator"  # Plugin root directory
```

### Hook Configuration File

Edit `hooks.json` to customize hook behavior:

```json
{
  "config": {
    "strictMode": false,
    "enableNotifications": true,
    "logLevel": "info",
    "timeout": 30000
  },
  "hooks": [
    {
      "id": "pre-commit-validator",
      "enabled": true,
      "config": {
        "strictMode": false,
        "blockOnFailure": false
      }
    }
  ]
}
```

---

## Usage Examples

### Enable Strict Mode for CI/CD

```bash
# In CI pipeline
export HOOK_STRICT_MODE=true

# Run with strict validation
claude code --workspace . "implement feature X"
```

### Advisory Mode for Development

```bash
# Local development (default)
export HOOK_STRICT_MODE=false

# Warnings only, no blocking
claude code "fix bug in user service"
```

### Deployment Notifications

```bash
# Set webhook for Slack notifications
export DEPLOY_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"

# Deploy with automatic notifications
kubectl apply -f k8s/deployment.yaml
# Hook will automatically notify team
```

### Test Analysis

```bash
# Run tests
npm test

# Analyze results at session end
# Hook automatically runs on Stop event and generates report
```

### Documentation Sync

```bash
# Edit source file
claude code "update API endpoint"

# Hook automatically checks for documentation updates
# Provides checklist of docs to update
```

---

## Installation

### 1. Copy hooks to plugin directory

```bash
cp -r hooks/ /path/to/team-accelerator/hooks/
```

### 2. Make scripts executable

```bash
chmod +x team-accelerator/hooks/scripts/*.sh
```

### 3. Configure environment

```bash
# Create .env file
cat > .env <<EOF
HOOK_STRICT_MODE=false
PROJECT_NAME=my-app
PROJECT_ROOT=\$PWD
OBSIDIAN_VAULT_PATH=\$HOME/obsidian
DEPLOY_WEBHOOK_URL=https://hooks.slack.com/...
CLAUDE_PLUGIN_ROOT=\$PWD/team-accelerator
EOF

# Load environment
source .env
```

### 4. Enable plugin in Claude Code

Add to Claude Code configuration:

```json
{
  "plugins": [
    {
      "name": "team-accelerator",
      "path": "/path/to/team-accelerator",
      "enabled": true
    }
  ]
}
```

---

## Hook Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Workflow                      │
└─────────────────────────────────────────────────────────────┘

1. Write/Edit Files
   ↓
   pre-commit-validator (PreToolUse)
   • Validates code quality
   • Checks for secrets, security issues
   • Warns or blocks based on mode

2. Execute Bash Commands
   ↓
   post-deploy-notifier (PostToolUse)
   • Detects deployment commands
   • Logs activity
   • Sends notifications

3. Modify Source Files
   ↓
   docs-sync (PostToolUse)
   • Analyzes changes
   • Identifies documentation needs
   • Provides update checklist

4. Complete Task
   ↓
   test-analyzer (Stop)
   • Parses test results
   • Generates summary report
   • Provides recommendations
```

---

## Logging

All hooks write logs to workspace log directory:

```
.claude/logs/
├── hooks.log              # All hook events
├── deployments.log        # Deployment notifications
└── test-summary-*.md      # Test analysis reports
```

**View logs:**
```bash
# All hook activity
tail -f .claude/logs/hooks.log

# Deployment notifications
tail -f .claude/logs/deployments.log

# Latest test report
cat .claude/reports/test-summary-*.md | tail -n 1
```

---

## Troubleshooting

### Hook not triggering

1. Check hook is enabled in `hooks.json`
2. Verify event matcher pattern
3. Check condition filters (file patterns, regex)
4. Review hook logs: `.claude/logs/hooks.log`

### Script not executing

1. Verify script is executable: `chmod +x scripts/*.sh`
2. Check script path uses `${CLAUDE_PLUGIN_ROOT}`
3. Verify environment variables are set
4. Test script directly: `./scripts/validate-code.sh --help`

### Strict mode blocking unnecessarily

1. Review validation output for specific issues
2. Switch to advisory mode: `export HOOK_STRICT_MODE=false`
3. Fix critical issues first
4. Gradually increase strictness

### Notifications not sending

1. Verify webhook URL is set: `echo $DEPLOY_WEBHOOK_URL`
2. Test webhook with curl:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"text":"Test"}' "$DEPLOY_WEBHOOK_URL"
   ```
3. Check notification channel configuration in `hooks.json`

---

## Best Practices

### 1. Start with Advisory Mode

Begin with advisory mode to understand common issues without blocking development:

```bash
export HOOK_STRICT_MODE=false
```

### 2. Gradually Increase Strictness

Once team is familiar with checks, enable strict mode for CI/CD:

```bash
# Local development: advisory
export HOOK_STRICT_MODE=false

# CI/CD pipeline: strict
export HOOK_STRICT_MODE=true
```

### 3. Customize for Your Project

Edit `hooks.json` to adjust checks for your project:

```json
{
  "hooks": [
    {
      "id": "pre-commit-validator",
      "config": {
        "excludePatterns": [
          "**/legacy/**",
          "**/vendor/**"
        ]
      }
    }
  ]
}
```

### 4. Monitor Hook Performance

Review hook execution times and adjust timeouts:

```json
{
  "hooks": [
    {
      "id": "test-analyzer",
      "config": {
        "timeout": 20000
      }
    }
  ]
}
```

### 5. Integrate with CI/CD

Use hooks in CI pipelines for consistent quality gates:

```yaml
# .github/workflows/ci.yml
steps:
  - name: Run tests
    run: npm test

  - name: Analyze results
    run: |
      export HOOK_STRICT_MODE=true
      ./.claude/hooks/scripts/analyze-tests.sh \
        --workspace . \
        --output-format markdown \
        --report-path test-report.md

  - name: Upload report
    uses: actions/upload-artifact@v2
    with:
      name: test-report
      path: test-report.md
```

---

## Contributing

### Adding New Hooks

1. Create script in `scripts/` directory
2. Add hook configuration to `hooks.json`
3. Update this README with documentation
4. Test in both advisory and strict modes

### Hook Template

```bash
#!/usr/bin/env bash
set -euo pipefail

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --option) OPTION="$2"; shift 2 ;;
            *) echo "Unknown: $1"; exit 1 ;;
        esac
    done
}

# Main logic
main() {
    parse_args "$@"
    # Your hook logic here
}

main "$@"
```

---

## License

MIT License - See LICENSE file for details

## Support

- Issues: https://github.com/markus41/alpha-0.1/issues
- Docs: https://github.com/markus41/obsidian/blob/main/System/Claude-Instructions/Hooks.md

---

**Version:** 1.0.0
**Last Updated:** 2025-12-12
**Maintained By:** Claude Team Accelerator
