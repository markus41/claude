---
name: cicd-integration
description: Patterns for integrating Claude Code into CI/CD pipelines — GitHub Actions, GitLab CI, pre-commit hooks, automated PR reviews, headless mode, and cost control
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
triggers:
  - ci cd
  - github actions
  - gitlab ci
  - pre-commit
  - automated review
  - headless mode
  - pipeline
  - continuous integration
---

# CI/CD Integration Patterns

Integrate Claude Code into CI/CD pipelines for automated PR reviews, code generation, test validation, security scanning, and documentation updates. This skill covers GitHub Actions, GitLab CI, pre-commit hooks, and headless execution modes.

## GitHub Actions Integration

Use the official `anthropics/claude-code-action@v1` action for turnkey GitHub integration.

### Supported Features

- Trigger on pull requests, push, schedule, or workflow dispatch
- Environment variable support: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`
- Pipe mode (`claude -p`) with JSON output
- Tool access filtering via `--allowedTools`
- Multiple model routing (Opus for reviews, Haiku for checks)
- Cost tracking and budget enforcement

### Setup

```yaml
# .github/workflows/claude-pr-review.yml
name: Claude PR Review

on:
  pull_request:
    types: [opened, synchronize]
  workflow_dispatch:

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: anthropics/claude-code-action@v1
        with:
          task: |
            Review the changes in this PR and provide:
            1. Security issues found (if any)
            2. Code style or complexity concerns
            3. Test coverage gaps
            4. Performance suggestions
            Format as JSON for PR comment automation.
          model: claude-opus-4-1-20250805
          allowed-tools: Read,Grep,Glob
          output-format: json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### Usage in PR Comments

```yaml
# .github/workflows/claude-pr-analysis.yml
name: Claude PR Analysis with Comments

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        id: claude
        with:
          task: |
            {
              "goal": "Review files in this PR",
              "files": "${{ github.event.pull_request.title }}",
              "output": "json"
            }
          output-format: json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Comment Review on PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const result = JSON.parse('${{ steps.claude.outputs.result }}');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Claude Code Review\n\n${result.summary}`
            });
```

### Code Generation Workflow

```yaml
# .github/workflows/claude-codegen.yml
name: Generate Code on Dispatch

on:
  workflow_dispatch:
    inputs:
      feature:
        description: Feature to generate
        required: true
      model:
        description: Model to use
        default: claude-opus-4-1-20250805
        required: false

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        with:
          task: Generate ${{ github.event.inputs.feature }}
          model: ${{ github.event.inputs.model }}
          output-format: json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Create PR with Generated Code
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: "feat: ${{ github.event.inputs.feature }}"
          title: "Generate: ${{ github.event.inputs.feature }}"
          body: "Auto-generated code from Claude Code Expert"
```

## GitLab CI Integration

Configure Claude Code in GitLab CI pipelines using Docker containers and the CLI.

### Setup

```yaml
# .gitlab-ci.yml
stages:
  - review
  - test
  - generate

variables:
  CLAUDE_MODEL: claude-haiku-4-5-20251001
  CLAUDE_MAX_TURNS: "5"

claude_review:
  stage: review
  image: node:20-alpine
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - |
      claude \
        -p "Review the MR changes and identify issues" \
        --allowedTools Read,Grep,Glob \
        --output-format json > review_output.json
  artifacts:
    paths:
      - review_output.json
    expire_in: 1 day
  only:
    - merge_requests

claude_test_gap:
  stage: test
  image: node:20-alpine
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - |
      claude \
        -p "Find test coverage gaps in changed files" \
        --allowedTools Read,Grep,Glob \
        --max-turns 3
  allow_failure: true
```

### With Caching

```yaml
claude_cached_analysis:
  stage: review
  image: node:20-alpine
  cache:
    key: claude-analysis-${CI_COMMIT_SHA}
    paths:
      - .claude/cache/
      - .claude/memory/
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - claude -p "Cached analysis of repo structure"
```

## Pre-Commit Hook Integration

Validate code locally before pushing using Claude Code as a pre-commit hook.

### Husky Setup

```bash
# Install dependencies
npm install husky lint-staged -D

# Initialize husky
npx husky install

# Create Claude hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged (including Claude)
npx lint-staged
EOF

chmod +x .husky/pre-commit
```

### Lint-Staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "claude -p 'Quick style check' --allowedTools Read,Grep"
    ],
    "*.{md,mdx}": [
      "markdown-lint",
      "claude -p 'Check documentation clarity' --allowedTools Read"
    ]
  }
}
```

### Direct Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Check staged files with Claude Code

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

echo "Running Claude Code check on staged files..."

if ! claude -p "Security check: $STAGED_FILES" \
      --allowedTools Read,Grep,Glob \
      --max-turns 2; then
  echo "Claude Code check failed. Use 'git commit --no-verify' to bypass."
  exit 1
fi
```

## Automated PR Reviews with Structured Output

Use JSON formatting to post structured reviews to PRs.

### Review Configuration

```bash
#!/bin/bash
# scripts/claude-pr-review.sh

set -euo pipefail

REPO=$1
PR_NUMBER=$2
GITHUB_TOKEN=$3

# Clone PR branch
git clone "https://github.com/$REPO.git" /tmp/pr-check
cd /tmp/pr-check
git fetch origin pull/$PR_NUMBER/head
git checkout FETCH_HEAD

# Run Claude review
REVIEW_JSON=$(claude -p \
  "Analyze this PR for: security issues, code quality, test coverage, performance" \
  --allowedTools Read,Grep,Glob \
  --max-turns 3 \
  --output-format json)

# Parse results and post
SECURITY=$(echo "$REVIEW_JSON" | jq -r '.security // "None found"')
QUALITY=$(echo "$REVIEW_JSON" | jq -r '.quality // "Pass"')
TESTS=$(echo "$REVIEW_JSON" | jq -r '.test_coverage // "Adequate"')

curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$REPO/issues/$PR_NUMBER/comments" \
  -d @- << EOF
{
  "body": "## Claude Code Review\n\n**Security:** $SECURITY\n\n**Quality:** $QUALITY\n\n**Tests:** $TESTS"
}
EOF

rm -rf /tmp/pr-check
```

## Headless Mode Patterns

Execute Claude Code in fully automated environments without interaction.

### Read-Only Checks

```bash
# Security scan (no write access)
claude -p "Security audit" \
  --allowedTools Read,Grep,Glob \
  --output-format json \
  --max-turns 2
```

### Constrained Sessions

```bash
# Limit turn count to prevent runaway costs
claude -p "Generate test stubs" \
  --allowedTools Read,Glob,Bash \
  --max-turns 5 \
  --output-format json
```

### Model Selection for CI

```bash
# Haiku for fast checks (cheaper)
CLAUDE_MODEL=claude-haiku-4-5-20251001 claude -p "Style check"

# Opus for complex analysis (more capable)
CLAUDE_MODEL=claude-opus-4-1-20250805 claude -p "Architecture review"
```

### Exit Code Handling

```bash
#!/bin/bash
# scripts/claude-ci-validator.sh

if claude -p "Validate build output" \
         --allowedTools Read,Glob \
         --output-format json; then
  echo "Validation passed"
  exit 0
else
  echo "Validation failed"
  exit 1
fi
```

## SDK-Based CI Integration

Use the `@anthropic-ai/claude-code` npm package for programmatic control.

### Installation

```bash
npm install @anthropic-ai/claude-code
```

### Basic Usage

```javascript
// scripts/ci-validator.mjs
import { claudeCode } from '@anthropic-ai/claude-code';

const result = await claudeCode.executeHeadless({
  task: 'Analyze test coverage and report gaps',
  allowedTools: ['Read', 'Grep', 'Glob'],
  outputFormat: 'json',
  maxTurns: 3,
  model: 'claude-haiku-4-5-20251001'
});

console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
```

### Streaming Output

```javascript
// scripts/ci-streaming.mjs
import { claudeCode } from '@anthropic-ai/claude-code';

const stream = await claudeCode.streamHeadless({
  task: 'Generate missing test files',
  allowedTools: ['Read', 'Glob'],
  model: 'claude-opus-4-1-20250805'
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text || '');
  if (chunk.status === 'complete') {
    process.exit(chunk.exitCode);
  }
}
```

## Cost Control in CI

Manage Claude API costs in automated environments.

### Budget Estimation

```bash
# Haiku: ~$0.80 per million input tokens, $2.40 per million output
# Estimated cost per CI run with Haiku: $0.01-0.05

# Opus: ~$15 per million input tokens, $45 per million output
# Estimated cost per CI run with Opus: $0.10-0.30

# Strategy: Use Haiku for checks, Opus for analysis on schedule
```

### Cost-Optimized Workflow

```yaml
# .github/workflows/claude-optimized.yml
on:
  pull_request:
    types: [opened, synchronize]
  schedule:
    - cron: '0 2 * * *'  # Deep analysis daily

jobs:
  fast-check:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          task: Quick lint check
          model: claude-haiku-4-5-20251001
          allowed-tools: Grep,Glob
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  deep-analysis:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          task: Full architecture review
          model: claude-opus-4-1-20250805
          allowed-tools: Read,Grep,Glob,Bash
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Secrets Management

Safely handle API keys and credentials in CI/CD.

### GitHub Secrets

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          task: Review changes
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### GitLab CI Secrets

```yaml
claude_review:
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY  # Set in GitLab UI
  script:
    - claude -p "Run analysis" --output-format json
```

### Never Log Sensitive Data

```bash
#!/bin/bash
# Safe logging in CI

# DON'T do this:
# echo "API Key: $ANTHROPIC_API_KEY"

# DO this:
echo "Starting Claude review (API key configured)"

# Output result without exposing key
claude -p "Review files" 2>&1 | grep -v "Authorization" > output.log
```

## Example Workflows (Copy-Paste Ready)

### 1. PR Review Bot (GitHub Actions)

```yaml
# .github/workflows/claude-review-pr.yml
name: Claude PR Review Bot

on:
  pull_request:
    types: [opened, synchronize]
    paths-ignore:
      - '**.md'
      - 'docs/**'

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    if: github.event.action != 'closed'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: anthropics/claude-code-action@v1
        id: review
        with:
          task: |
            Review this PR and provide assessment in JSON:
            {
              "overall_score": 1-10,
              "security_issues": [],
              "code_quality": "pass|warning|fail",
              "test_coverage": "adequate|needs_improvement",
              "suggestions": []
            }
          model: claude-opus-4-1-20250805
          allowed-tools: Read,Grep,Glob
          output-format: json
          max-turns: 3
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Post Review Comment
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            const review = JSON.parse(`${{ steps.review.outputs.result }}`);
            const comment = `
## Claude Code Review

**Overall Score:** ${review.overall_score}/10
**Code Quality:** ${review.code_quality}
**Test Coverage:** ${review.test_coverage}

${review.suggestions.length > 0 ? '**Suggestions:**\n' + review.suggestions.map(s => `- ${s}`).join('\n') : 'No suggestions'}
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 2. Test Gap Detector (GitHub Actions)

```yaml
# .github/workflows/claude-test-gaps.yml
name: Detect Test Gaps

on:
  pull_request:
    paths:
      - 'src/**'

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        with:
          task: |
            Identify test coverage gaps in changed files:
            1. List files without tests
            2. Find untested functions
            3. Suggest test cases
            Output as JSON array.
          model: claude-haiku-4-5-20251001
          allowed-tools: Read,Grep,Glob
          output-format: json
          max-turns: 2
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Fail if critical gaps
        run: |
          gaps=$(cat ${{ steps.claude.outputs.result }} | jq '.critical_gaps | length')
          if [ "$gaps" -gt 0 ]; then
            echo "Critical test gaps found!"
            exit 1
          fi
```

### 3. Security Scanner (GitHub Actions)

```yaml
# .github/workflows/claude-security-scan.yml
name: Security Scan

on:
  pull_request:
  schedule:
    - cron: '0 3 * * 1'  # Monday 3 AM

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        with:
          task: |
            Security audit:
            - Check for hardcoded secrets
            - Identify SQL injection risks
            - Review authentication logic
            - Check dependency vulnerabilities
            Format: { "vulnerabilities": [], "risk_level": "low|medium|high" }
          model: claude-opus-4-1-20250805
          allowed-tools: Read,Grep,Glob
          output-format: json
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Block on high risk
        run: |
          risk=$(jq -r '.risk_level' ${{ steps.claude.outputs.result }})
          if [ "$risk" = "high" ]; then
            echo "High security risk detected!"
            exit 1
          fi
```

### 4. Documentation Updater (GitHub Actions)

```yaml
# .github/workflows/claude-docs-update.yml
name: Auto-Update Docs

on:
  push:
    branches: [main]
    paths:
      - 'src/**'

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        id: docs
        with:
          task: |
            Update API documentation based on code changes:
            1. Regenerate parameter descriptions
            2. Update return type docs
            3. Add code examples where missing
            Output updated markdown files.
          model: claude-opus-4-1-20250805
          allowed-tools: Read,Glob,Write
          max-turns: 5
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Create Documentation PR
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'docs: auto-update from code changes'
          title: 'docs: regenerated from source'
          body: 'Auto-generated documentation updates'
          branch: auto-docs-update
```

---

## /autofix-pr — CLI PR Auto-Fix (v2.1.92)

Enable Claude's PR auto-fix loop without leaving the terminal. Claude watches CI results and review comments, pushes fixes, and repeats until the PR is green.

```text
> /autofix-pr
```

Claude infers the open PR for your current branch and enables auto-fix for it on Claude Code web in one step. Walk away; Claude handles the CI/review iteration loop.

**When to use:**
- After pushing a branch with expected CI failures (lint, types, test)
- When addressing PR review nits — Claude applies suggestions and pushes
- During overnight runs — PR auto-fix is fully unattended

**Prerequisites:**
- Branch must have an open PR
- Must be authenticated to Claude Code web (same account)

**Workflow:**
```bash
git push origin my-feature
/autofix-pr
# Claude enables auto-fix on the web PR — CI loop runs unattended
```
