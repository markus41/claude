# Deployment Pipeline Plugin

**Version:** 1.0.0 | **Commands:** 5 | **Agents:** 3 | **Workflow:** State Machine

Harness CD integration pipeline with state-machine workflow orchestration, persistence, retry logic, and multi-channel notifications.

## Quick Start

```bash
# Start a deployment
/deploy:start my-service main

# Check status
/deploy:status

# Approve for production
/deploy:approve <deployment-id>

# Rollback if needed
/deploy:rollback <deployment-id>
```

## Features

### State Machine Workflow

A robust state machine manages deployment progression:

```
pending → validating → building → testing → deploying-dev → deploying-staging → awaiting-approval → deploying-prod → completed
```

### Persistence
- File-based state storage with backup
- Crash recovery support
- Complete audit trail

### Retry Logic
- Automatic retry for transient failures
- Exponential backoff (1s, 2s, 4s)
- Configurable retry states

### Notifications
- **Slack** - Rich message formatting with actions
- **Teams** - Adaptive cards with buttons
- **Email** - HTML formatted notifications

## Commands

| Command | Description |
|---------|-------------|
| `/deploy:start` | Start a new deployment pipeline |
| `/deploy:status` | Check deployment status |
| `/deploy:approve` | Approve production deployment |
| `/deploy:rollback` | Rollback a deployment |
| `/deploy:history` | View deployment history |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `deployment-orchestrator` | sonnet | Orchestrates state transitions |
| `deployment-validator` | haiku | Validates prerequisites |
| `rollback-specialist` | sonnet | Handles rollback procedures |

## Configuration

### Notification Setup

Create `.claude/deployment-config.json`:

```json
{
  "notifications": {
    "channels": ["slack", "teams"],
    "slack": {
      "webhookUrl": "https://hooks.slack.com/services/xxx",
      "channel": "#deployments"
    },
    "teams": {
      "webhookUrl": "https://outlook.office.com/webhook/xxx"
    }
  }
}
```

### Retry Configuration

```json
{
  "retry": {
    "maxAttempts": 3,
    "backoffMs": 1000,
    "backoffMultiplier": 2,
    "retryableStates": ["validating", "building", "testing"]
  }
}
```

## State Machine

### States

| State | Description |
|-------|-------------|
| `pending` | Initial state, awaiting start |
| `validating` | Checking configurations |
| `building` | Building artifacts |
| `testing` | Running automated tests |
| `deploying-dev` | Deploying to dev environment |
| `deploying-staging` | Deploying to staging |
| `awaiting-approval` | Waiting for prod approval |
| `deploying-prod` | Deploying to production |
| `completed` | Successfully deployed |
| `failed` | Deployment failed |
| `rolled-back` | Deployment rolled back |

### Events

| Event | Description |
|-------|-------------|
| `START` | Initiate pipeline |
| `VALIDATION_COMPLETE` | Validation passed |
| `BUILD_COMPLETE` | Build succeeded |
| `TESTS_PASSED` | Tests passed |
| `DEV_DEPLOYED` | Dev deployment complete |
| `STAGING_DEPLOYED` | Staging deployment complete |
| `APPROVED` | Production approved |
| `REJECTED` | Production rejected |
| `PROD_DEPLOYED` | Production deployment complete |
| `FAILURE` | Stage failed |
| `ROLLBACK` | Rollback initiated |

## Harness Integration

This plugin integrates with Harness CD for deployment execution:

- Triggers Harness pipelines for each stage
- Monitors execution status
- Handles pipeline callbacks
- Supports rollback workflows

### Required Harness Pipelines

- `build-and-push` - Build and push Docker images
- `run-tests` - Execute test suites
- `deploy-dev` - Deploy to dev environment
- `deploy-staging` - Deploy to staging
- `deploy-prod` - Deploy to production
- `rollback-*` - Environment-specific rollback

## Jira Integration

Works with `jira-orchestrator` plugin:

- Links deployments to Jira issues
- Updates issue status on completion
- Adds deployment comments

## Directory Structure

```
deployment-pipeline/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── orchestrator.md
│   ├── validator.md
│   └── rollback.md
├── commands/
│   ├── start.md
│   ├── status.md
│   ├── approve.md
│   ├── rollback.md
│   └── history.md
├── config/
│   └── default.json
├── src/
│   ├── workflow/
│   │   ├── state-machine.ts
│   │   └── retry-handler.ts
│   ├── persistence/
│   │   └── workflow-store.ts
│   └── notifications/
│       └── notifier.ts
└── README.md
```

## Installation

```bash
/plugin-install deployment-pipeline
```

Or add to your `.claude/settings.local.json`:

```json
{
  "plugins": {
    "deployment-pipeline": {
      "enabled": true
    }
  }
}
```

## Requirements

- Claude Code >= 1.0.0
- jira-orchestrator >= 7.0.0 (optional, for Jira integration)
- Harness account with configured pipelines

## License

MIT

## Author

Markus Ahling
