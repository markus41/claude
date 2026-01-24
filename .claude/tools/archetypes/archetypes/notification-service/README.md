# Notification Service Archetype

Create multi-channel notification services with templating, scheduling, and delivery tracking.

## Overview

This archetype generates a complete notification infrastructure including:
- Multi-channel delivery (Slack, Teams, Email, SMS, etc.)
- Template engine for dynamic content
- Scheduling and batching
- Delivery tracking and analytics
- User preference management

## When to Use

- Sending alerts across multiple channels
- Building notification centers
- Implementing user communication systems
- Creating alert management systems
- Building event notification pipelines

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `pluginName` | string | Yes | Plugin name |
| `description` | string | Yes | Plugin description |
| `channels` | multi | Yes | Delivery channels |
| `features` | multi | Yes | Service features |
| `templateEngine` | choice | Yes | Template engine |
| `storage` | choice | Yes | History storage |

## Example Usage

```bash
# Interactive mode
/archetype create notification-service

# Non-interactive
/archetype create notification-service \
  --variable pluginName=alert-system \
  --variable description="Multi-channel alert system for deployments and incidents" \
  --variable channels=slack,teams,email,pagerduty \
  --variable features=templates,scheduling,tracking,fallback \
  --variable templateEngine=handlebars \
  --variable storage=database \
  --non-interactive
```

## Generated Structure

```
{pluginName}/
├── .claude-plugin/
│   └── plugin.json
├── src/
│   ├── channels/
│   │   ├── slack.ts
│   │   ├── teams.ts
│   │   ├── email.ts
│   │   └── index.ts
│   ├── templates/
│   │   ├── engine.ts
│   │   └── defaults/
│   ├── scheduler/
│   │   └── scheduler.ts
│   ├── tracking/
│   │   └── tracker.ts
│   └── index.ts
├── templates/
│   ├── alert.hbs
│   ├── digest.hbs
│   └── welcome.hbs
├── config/
│   └── default.json
└── README.md
```

## Notification Channels

| Channel | Best For |
|---------|----------|
| `slack` | Team alerts, quick updates |
| `teams` | Enterprise communication |
| `email` | Formal notifications, reports |
| `sms` | Urgent alerts, 2FA |
| `push` | Mobile notifications |
| `webhook` | Custom integrations |
| `discord` | Community alerts |
| `pagerduty` | On-call escalation |

## Features

| Feature | Description |
|---------|-------------|
| `templates` | Dynamic content rendering |
| `scheduling` | Send at specific times |
| `batching` | Group similar notifications |
| `tracking` | Delivery and read receipts |
| `preferences` | User channel preferences |
| `i18n` | Multi-language support |
| `fallback` | Try alternate channels |

## Best Practices

1. **Rate limiting**: Respect channel rate limits
2. **Batching**: Group similar notifications
3. **Fallback**: Configure backup channels
4. **Templates**: Use templates for consistency
5. **Tracking**: Monitor delivery success
