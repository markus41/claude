---
name: cc-cicd
intent: Generate and manage CI/CD pipeline configurations that integrate Claude Code for automated reviews, testing, and code generation
tags:
  - claude-code-expert
  - command
  - ci-cd
  - github-actions
  - automation
arguments:
  - name: action
    description: What to do — generate, audit, or template
    required: true
    type: choice
    choices: [generate, audit, template]
flags:
  - name: platform
    description: CI platform to target
    type: choice
    choices: [github-actions, gitlab-ci, azure-pipelines]
    default: github-actions
  - name: template
    description: Pre-built template to deploy
    type: choice
    choices: [pr-review, pre-commit, test-gen, security-scan, docs-update, all]
  - name: model
    description: Default model for CI runs
    type: string
    default: claude-haiku-4-5-20251001
  - name: dry-run
    description: Show what would be generated without writing files
    type: boolean
    default: false
risk: low
cost: low
---

# /cc-cicd — CI/CD Pipeline Configuration & Deployment

Detect your project's CI/CD setup, generate Claude Code workflows optimized for your platform, and deploy production-ready automation for PR reviews, code generation, test validation, and security scanning.

## Usage

```bash
/cc-cicd generate --platform github-actions --template pr-review
# Generate PR review workflow for GitHub Actions

/cc-cicd template --template all --dry-run
# Show all available templates without writing files

/cc-cicd audit --platform github-actions
# Audit existing workflows and recommend Claude Code integrations

/cc-cicd generate --template test-gen --model claude-opus-4-1-20250805
# Use Opus for higher-quality test gap detection

/cc-cicd template --template security-scan --dry-run
# Preview security scan workflow before deploying
```

---

## Operating Protocol

The `/cc-cicd` command executes three phases:

### Phase 1: Detect CI Setup
- Scan for existing workflows (GitHub Actions, GitLab CI, Azure Pipelines)
- Identify current test runner, linter, and build process
- Map project structure and tool stack
- Determine cost optimization strategy

### Phase 2: Generate or Audit
- **generate**: Create Claude Code workflows configured for your platform
- **audit**: Review existing workflows and suggest Claude Code additions
- **template**: Deploy pre-built, battle-tested workflow templates

### Phase 3: Output
- Write workflow files to proper location (`.github/workflows/`, `.gitlab-ci.yml`, etc.)
- Configure secrets requirements
- Document cost estimates and model recommendations
- Show integration verification steps

---

## Template Options

### pr-review
Automated code review on pull requests. Analyzes changes for security, style, and test coverage. Posts structured JSON results to PR comments.

**Best for:**
- Catching issues before human review
- Enforcing code standards automatically
- Security-conscious teams

**Estimated cost:** $0.02-0.10 per PR (using Haiku for speed, Opus on schedule)

**Default model:** claude-haiku-4-5-20251001 (PR checks), claude-opus-4-1-20250805 (deep analysis on schedule)

### pre-commit
Local validation before pushing. Runs Claude Code checks on staged files using Husky + lint-staged. Blocks commits if issues found.

**Best for:**
- Catching problems locally before pushing
- Reducing CI load
- Developer feedback loops

**Estimated cost:** Free locally (runs on developer machine)

**Requires:** Node.js, Husky, lint-staged

### test-gen
Detects test coverage gaps in changed files and suggests test cases. Identifies untested functions and missing edge cases.

**Best for:**
- Improving test coverage metrics
- Preventing regressions
- Quality gates on PR merge

**Estimated cost:** $0.01-0.05 per PR (using Haiku)

**Default model:** claude-haiku-4-5-20251001 (fast detection)

### security-scan
Comprehensive security audit: hardcoded secrets, SQL injection risks, authentication issues, dependency vulnerabilities. Can run on schedule or per-PR.

**Best for:**
- Security-first teams
- Compliance requirements
- Continuous threat scanning

**Estimated cost:** $0.05-0.20 per scan (using Opus for depth)

**Default model:** claude-opus-4-1-20250805 (security requires reasoning)

**Note:** Blocks merge on high-risk findings.

### docs-update
Auto-generates or updates API documentation from source code. Updates parameter descriptions, return types, and code examples.

**Best for:**
- Keeping docs in sync with code
- Developer experience
- API clarity

**Estimated cost:** $0.10-0.30 per trigger (using Opus for quality)

**Default model:** claude-opus-4-1-20250805

**Note:** Creates PR with updated documentation.

### all
Deploy all five templates for comprehensive Claude Code CI integration.

---

## Platform Differences

### GitHub Actions (`--platform github-actions`)
- Uses official `anthropics/claude-code-action@v1` action
- Stores API key in GitHub Secrets
- Supports PR comments, status checks, and automated PRs
- Recommended: Start here (easiest integration)

```bash
/cc-cicd generate --platform github-actions --template pr-review
```

### GitLab CI (`--platform gitlab-ci`)
- Uses Docker containers with npm CLI
- Stores API key in GitLab CI/CD Variables
- Artifacts for caching and result preservation
- Manual trigger support via pipeline dispatch

```bash
/cc-cicd generate --platform gitlab-ci --template test-gen
```

### Azure Pipelines (`--platform azure-pipelines`)
- Uses Microsoft-hosted agents
- Stores secret in Azure Key Vault or Pipeline Secrets
- Integration with Azure DevOps work items
- Stage-based pipeline configuration

```bash
/cc-cicd generate --platform azure-pipelines --template security-scan
```

---

## Model Selection Guide

### For PR Checks (Speed Over Depth)
Use **claude-haiku-4-5-20251001** by default.
- Fast: 50-100ms latency
- Cost-effective: ~$0.01-0.02 per run
- Good for: Style, lint, basic structure validation
- Acceptable accuracy: 95%+

```bash
--model claude-haiku-4-5-20251001
```

### For Complex Analysis (Depth Over Speed)
Use **claude-opus-4-1-20250805** on schedule or critical paths.
- Slower: 500-2000ms latency
- Higher cost: ~$0.10-0.30 per run
- Good for: Architecture review, security audit, test strategy
- Accuracy: 98%+

```bash
--model claude-opus-4-1-20250805
```

**Recommended strategy:**
- Every PR: Haiku checks (fast gate)
- Nightly schedule: Opus deep analysis (comprehensive review)
- Manual dispatch: User chooses model (flexibility)

---

## Cost Estimation

### Per-Run Costs (Approximate)

| Template | Model | Cost |
|----------|-------|------|
| pr-review | Haiku | $0.01-0.05 |
| pr-review | Opus | $0.10-0.30 |
| test-gen | Haiku | $0.01-0.02 |
| security-scan | Opus | $0.10-0.20 |
| docs-update | Opus | $0.15-0.30 |

### Monthly Budget Examples

**Small team (5 PRs/day, Haiku checks):**
- 5 PRs × 22 days × $0.03 = $3.30/month

**Medium team (20 PRs/day, Haiku + nightly Opus):**
- 20 × 22 × $0.03 + 30 × $0.15 = $18.40/month

**Large team (100 PRs/day, Opus checks, all templates):**
- 100 × 22 × $0.15 + 22 × $1.00 = $352/month

---

## Secrets Configuration

### GitHub Actions

1. Navigate to repo > Settings > Secrets and variables > Actions
2. Create `ANTHROPIC_API_KEY` with your API key
3. Workflows reference as `${{ secrets.ANTHROPIC_API_KEY }}`

```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### GitLab CI

1. Go to project > Settings > CI/CD > Variables
2. Add `ANTHROPIC_API_KEY` with your API key
3. Reference in pipeline as `$ANTHROPIC_API_KEY`

```yaml
variables:
  ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

### Azure Pipelines

1. Create variable group in Pipelines > Library
2. Add `ANTHROPIC_API_KEY` and mark as secret
3. Link variable group in pipeline

```yaml
variables:
  - group: claude-secrets
```

---

## Workflow Files Output

### GitHub Actions
```
.github/workflows/
  ├── claude-pr-review.yml
  ├── claude-test-gaps.yml
  ├── claude-security-scan.yml
  └── claude-docs-update.yml
```

### GitLab CI
```
(Updates .gitlab-ci.yml with new stages)
  stages:
    - claude-review
    - claude-test-gen
    - claude-security
```

### Azure Pipelines
```
azure-pipelines.yml (or separate files in pipelines/)
  stages:
    - ClaudeReview
    - ClaudeTestGen
    - ClaudeSecurity
```

---

## Verification Steps

After deploying workflows:

1. **Test trigger:** Open a PR or commit to verify workflow fires
2. **Check logs:** Review workflow run to confirm API key works
3. **Validate output:** Ensure PR comments or artifacts are generated
4. **Monitor costs:** Check API usage dashboard first week
5. **Iterate:** Adjust max-turns, model choice, or schedule based on results

---

## Common Patterns

### Read-Only Checks
Only allow Read, Grep, Glob tools (no modifications).
```bash
--allowed-tools Read,Grep,Glob
```

### Bounded Sessions
Prevent runaway costs with max-turns limit.
```bash
--max-turns 3
```

### Scheduled Deep Analysis
Run expensive Opus checks on schedule, not per-PR.
```yaml
on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday 2 AM
```

### Conditional Gating
Fail workflow if high-risk issues found.
```bash
if [ "$(jq -r '.risk_level' output.json)" = "high" ]; then
  exit 1
fi
```

---

## Troubleshooting

**Workflow fails with "API key not found"**
- Verify `ANTHROPIC_API_KEY` is set in secrets
- Ensure workflow references correct secret name
- Check API key hasn't expired

**PR comments not posting**
- Verify `pull-requests: write` permission in workflow
- Check GitHub Actions permissions for repo (Settings > Actions)
- Review workflow logs for API errors

**High costs unexpectedly**
- Reduce `max-turns` to limit session length
- Switch to Haiku for routine checks
- Add path filters to skip documentation-only changes

**Workflows timing out**
- Reduce `max-turns` (default 5, try 2-3)
- Use Haiku instead of Opus
- Constrain allowed tools to read-only set

---

## Examples by Use Case

### I want PR review automation
```bash
/cc-cicd generate --template pr-review
# Deploys: claude-pr-review.yml
# Cost: $0.01-0.05 per PR with Haiku
```

### I want to catch missing tests
```bash
/cc-cicd generate --template test-gen
# Deploys: claude-test-gaps.yml
# Cost: $0.01-0.02 per PR with Haiku
# Blocks merge if gaps > threshold
```

### I need security scanning
```bash
/cc-cicd generate --template security-scan
# Deploys: claude-security-scan.yml
# Cost: $0.10-0.20 per scan with Opus
# Runs on every PR + nightly schedule
```

### I want everything
```bash
/cc-cicd generate --template all --dry-run
# Preview all five templates
# Review before deploying

/cc-cicd generate --template all
# Deploy all templates to .github/workflows/
```

### I use GitLab CI
```bash
/cc-cicd generate --platform gitlab-ci --template pr-review
# Deploys: .gitlab-ci.yml (adds claude_review stage)
# Uses Docker for Claude Code CLI
```

---

## Next Steps

1. Choose your platform: `--platform github-actions` (default), `gitlab-ci`, or `azure-pipelines`
2. Pick a template: `pr-review`, `test-gen`, `security-scan`, `docs-update`, or `all`
3. Generate and review: Add `--dry-run` to preview before deploying
4. Set API key: Store `ANTHROPIC_API_KEY` in your platform's secrets
5. Deploy: Remove `--dry-run` to write workflow files
6. Verify: Trigger a PR or commit to test the workflow
7. Monitor: Check API usage and adjust model/max-turns as needed

For detailed patterns and examples, see the `/cicd-integration` skill.
