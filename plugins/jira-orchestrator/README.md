# jira-orchestrator

**Version:** 7.5.0 | **License:** MIT | **Callsign:** Arbiter
**Author:** Markus Ahling (markus@lobbi.io)

## Purpose

Arbiter is an enterprise Jira orchestration platform with 82 agents organized into
16 teams, 46 commands, and 11+ skills. It exists because large-scale software delivery
across multiple Jira projects requires coordination that exceeds what manual workflows
can sustain -- sprint planning, code review, PR management, compliance reporting,
notifications, and documentation must all flow together.

The plugin uses official Atlassian MCP SSE with OAuth authentication, integrates with
Harness CI/CD pipelines, and supports Neon PostgreSQL, Redis caching, and Temporal
workflows. A mandatory 6-phase protocol (EXPLORE, PLAN, CODE, TEST, FIX, DOCUMENT)
governs all work, with dynamic agent routing based on Jira labels, file patterns, and
task complexity.

## Directory Structure

```
jira-orchestrator/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 82 agents
  commands/                      # 46 commands
  skills/                        # 11+ skills (subdirectories with SKILL.md)
  config/                        # File-agent mapping, MCP configs
  hooks/                         # 6 workflow hooks
  registry/                      # Agent, command, workflow indexes
  sessions/                      # Intelligence, patterns, velocity tracking
  docs/                          # Deep-dive documentation, Harness knowledge base
```

## 12 Primary Commands

| Command | Purpose |
|---------|---------|
| `/jira:work` | Start orchestrated work (auto: branch, triage, prepare) |
| `/jira:ship` | One-click shipping (work, PR, review, merge) |
| `/jira:status` | Progress dashboard with metrics |
| `/jira:pr` | Create/manage PRs (with review, council, harness flags) |
| `/jira:iterate` | Fix feedback, re-review, auto-update PR |
| `/jira:cancel` | Cancel with checkpoint (resume later) |
| `/jira:sprint` | Sprint operations (plan, metrics, quality, team) |
| `/jira:enterprise` | Enterprise features (notify, approve, sla, compliance) |
| `/jira:infra` | Infrastructure (create-repo, deploy, pipeline) |
| `/jira:setup` | Configuration (hooks, verify, reset) |
| `/jira:sync` | Manual sync (usually auto via hooks) |
| `/jira:help` | Documentation |

**Full command list (46):** See `commands/` directory.

## Agent Categories

| Category | Count | Key Agents |
|----------|-------|------------|
| Core | 6 | triage-agent, code-reviewer, pr-creator |
| Intelligence | 5 | intelligence-analyzer, agent-router |
| Enterprise | 8 | notification-router, sla-monitor, compliance-reporter |
| Portfolio | 4 | portfolio-manager, release-coordinator |
| Sprint | 5 | sprint-planner, team-capacity-planner |
| Git | 7 | commit-tracker, smart-commit-validator |
| Confluence | 3 | confluence-manager |
| Teams (AutoGen) | 16 | Orchestrated collaboration teams |
| Harness | 3 | harness-jira-sync, harness-api-expert |
| Quality | 1 | code-quality-enforcer |
| Workflows | 5 | completion-orchestrator, approval-orchestrator |
| Other | 19 | QA, batch, testing, documentation, management |

## Skills

- **jira-orchestration** -- Core Jira workflow patterns
- **clean-architecture** -- SOLID principles and clean code
- **code-review** -- Code review best practices
- **confluence** -- Confluence documentation integration
- **harness-ci** -- Harness CI build pipelines
- **harness-cd** -- Harness CD deployments
- **harness-mcp** -- Harness MCP integration
- **harness-platform** -- Harness delegates, RBAC, connectors
- **pr-workflow** -- Pull request lifecycle management
- **task-details** -- Task enrichment and detail tracking
- **triage** -- Issue triage and prioritization

## Workflow Selection

| Workflow | Trigger | Duration |
|----------|---------|----------|
| quick-fix | complexity <= 10 | 1-4h |
| standard-feature | complexity 11-40 | 4-16h |
| complex-feature | complexity > 40 | 1-3 days |
| epic-decomposition | type = Epic | 1-2 days |
| critical-bug | priority = Highest | 2-8h |

## MCP Integration

```bash
claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse
```

Tools: `mcp__atlassian__getJiraIssue`, `mcp__atlassian__createJiraIssue`,
`mcp__atlassian__getConfluencePage`, `mcp__atlassian__createConfluencePage`, etc.

## Prerequisites

```bash
cd plugins/jira-orchestrator
npm ci                                   # Install dependencies
bash scripts/install.sh                  # Install plugin wiring
npm run validate:integrations            # Verify contracts
```

**Environment variables:**
- `ATLASSIAN_CLOUD_ID` -- Your Atlassian Cloud ID
- `JIRA_DEFAULT_PROJECT` -- Default Jira project key
- `HARNESS_ACCOUNT_ID`, `HARNESS_API_KEY` (optional)
- `OBSIDIAN_VAULT_PATH` (optional, for documentation sync)

## Quick Start

```
/jira:setup                              # Configure and verify
/jira:work PROJ-123                      # Start working on an issue
/jira:ship                               # Ship it (PR, review, merge)
/jira:status                             # Check dashboard
/jira:sprint plan                        # Plan the next sprint
```
