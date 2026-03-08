# exec-automator

**Version:** 1.0.0 | **License:** Proprietary | **Callsign:** Genesis
**Author:** Brookside BI (dev@brooksidebi.com)

## Purpose

Genesis is an AI-powered Executive Director automation platform for trade associations
and nonprofits. It exists because executive directors at these organizations juggle an
enormous range of responsibilities -- membership management, event planning, compliance
reporting, sponsor relations -- often with minimal staff support.

This plugin follows a 6-phase automation pipeline: ANALYZE, MAP, SCORE, GENERATE,
SIMULATE, DEPLOY. It analyzes organizational responsibilities, scores each for
automation potential using a 6-factor algorithm, generates LangGraph workflows for the
highest-impact candidates, and deploys 11 specialized agents to handle ongoing operations.

## Directory Structure

```
exec-automator/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 11 agents
  commands/                      # 13 commands
  skills/                        # 8 skills (subdirectories)
  workflows/                     # Deployment-ready workflow templates
  mcp-server/                    # LangGraph/LangChain execution engine
  hooks/                         # Lifecycle automation hooks
  scripts/                       # Install, start, health-check scripts
  docs/                          # Deep-dive documentation
```

## Agents

| Agent | Description |
|-------|-------------|
| org-analyzer | Analyzes organizational structure and identifies automation candidates |
| workflow-designer | Generates LangGraph workflow definitions from process descriptions |
| admin-coordinator | Orchestrates administrative tasks across the organization |
| communications-director | Newsletters, announcements, member communications |
| compliance-monitor | Regulatory requirements and policy adherence tracking |
| event-orchestrator | Event planning from venue selection through post-event follow-up |
| finance-manager | Budgets, invoicing, expense tracking, financial reports |
| meeting-facilitator | Meeting scheduling, agendas, minutes distribution |
| membership-steward | Member onboarding, renewals, engagement tracking |
| social-media-manager | Content calendars and social media presence |
| sponsor-relations | Sponsor outreach, proposals, relationship management |

## Commands

| Command | Description |
|---------|-------------|
| `/analyze` | Analyze organization responsibilities and structure |
| `/score` | Score each responsibility for automation potential (6-factor) |
| `/map` | Map organizational processes to automation workflows |
| `/generate` | Generate LangGraph workflows from scored processes |
| `/simulate` | Simulate automation workflow before deployment |
| `/deploy` | Deploy automation agents for live operations |
| `/orchestrate` | Orchestrate multiple agents on a complex task |
| `/dashboard` | View real-time automation status and metrics |
| `/report` | Generate operational or financial reports |
| `/export` | Export data in various formats |
| `/integrate` | Connect with external platforms (CRM, email, etc.) |
| `/customize` | Customize automation for a specific organization |
| `/template` | Browse or create reusable automation templates |

## Skills

- **association-management** -- Association governance patterns
- **event-planning** -- Event coordination workflows
- **langchain-integrations** -- LangChain tool and chain patterns
- **langgraph-orchestration** -- LangGraph state machine design
- **meeting-facilitation** -- Meeting management best practices
- **membership-engagement** -- Member retention and engagement
- **nonprofit-finance** -- Nonprofit financial management
- **process-automation** -- General process automation patterns

## Prerequisites

```bash
./scripts/install.sh             # Install dependencies
export ANTHROPIC_API_KEY=...     # Required
./scripts/start-mcp.sh           # Start the MCP service
./scripts/health-check.sh        # Verify setup
```

## Quick Start

```
/analyze "National Widget Manufacturers Association"
/score                                   # Score all responsibilities
/generate --top 5                        # Generate workflows for top 5
/simulate membership-renewal             # Test before deploying
/deploy                                  # Go live
/dashboard                               # Monitor operations
```
