# deployment-pipeline

**Version:** 1.0.0 | **License:** MIT
**Author:** Markus Ahling

## Purpose

This plugin implements a state-machine workflow for Harness CD deployment pipelines.
It exists because production deployments involve a series of stages -- validation,
build, test, staging, approval, production -- that must proceed in a strict order
with proper guard rails at each transition.

The state-machine approach gives each deployment a well-defined lifecycle with
persistence, retry logic (exponential backoff), and multi-channel notifications
(Slack, Teams, Email). You can start a deployment, check its status, approve
stage transitions, view deployment history, and trigger rollbacks.

## Directory Structure

```
deployment-pipeline/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 3 agents
  commands/                      # 5 commands
  src/                           # State machine, persistence, notifications
  config/                        # Default configuration
```

## Deployment States

```
pending -> validating -> building -> testing -> deploying-dev -> deploying-staging
    -> awaiting-approval -> deploying-prod -> completed
                                |
                                +-> rolling-back -> rolled-back
```

## Agents

| Agent | Description |
|-------|-------------|
| orchestrator | Manages deployment state transitions and stage coordination |
| validator | Validates deployment readiness (configs, health, dependencies) |
| rollback | Executes rollback operations with pre-checks and post-validation |

## Commands

| Command | Description |
|---------|-------------|
| `/deploy:start` | Start a new deployment (enters validation stage) |
| `/deploy:status` | Check the current state of an active deployment |
| `/deploy:approve` | Approve a pending stage transition |
| `/deploy:history` | View past deployment records and outcomes |
| `/deploy:rollback` | Trigger rollback to a previous known-good state |

## Configuration

Notification channels and retry behavior are configured in
`.claude/deployment-config.json`:

```json
{
  "notifications": {
    "channels": ["slack", "teams"],
    "slack": { "webhookUrl": "https://hooks.slack.com/services/xxx" }
  },
  "retry": {
    "maxAttempts": 3,
    "backoffMs": 1000,
    "backoffMultiplier": 2,
    "retryableStates": ["validating", "building", "testing"]
  }
}
```

## Prerequisites

- Harness CD account with deployment pipelines configured
- Service definitions and environment configurations in Harness
- jira-orchestrator plugin (optional, for Jira issue linking)

## Quick Start

```
/deploy:start my-service main            # Begin deployment
/deploy:status                           # Check progress
/deploy:approve <deployment-id>          # Approve stage gate
/deploy:history my-service               # View past deployments
/deploy:rollback <deployment-id>         # Rollback if needed
```
