# Webhook Handler Archetype

Create webhook receivers and processors with signature verification, event routing, and reliability patterns.

## Overview

This archetype generates a complete webhook handling system including:
- Signature verification for multiple providers
- Event routing and dispatch
- Retry and dead-letter queues
- Idempotency handling
- Event storage and logging

## When to Use

- Receiving webhooks from GitHub, Stripe, Harness, etc.
- Processing event notifications from external services
- Building event-driven integrations
- Creating callback handlers

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `pluginName` | string | Yes | Handler plugin name |
| `serviceName` | string | Yes | Source service name |
| `description` | string | Yes | Handler description |
| `signatureType` | choice | Yes | Verification method |
| `events` | multi | Yes | Event types to handle |
| `features` | multi | Yes | Reliability features |
| `storage` | choice | Yes | Event storage type |

## Example Usage

```bash
# Interactive mode
/archetype create webhook-handler

# Non-interactive
/archetype create webhook-handler \
  --variable pluginName=github-webhook \
  --variable serviceName=GitHub \
  --variable description="Handles GitHub repository and PR events" \
  --variable signatureType=hmac-sha256 \
  --variable events=create,update,status-change \
  --variable features=retry-queue,idempotency,logging \
  --variable storage=file \
  --non-interactive
```

## Generated Structure

```
{pluginName}/
├── .claude-plugin/
│   └── plugin.json
├── src/
│   ├── handler.ts           # Main webhook handler
│   ├── verifier.ts          # Signature verification
│   ├── router.ts            # Event routing
│   ├── retry.ts             # Retry queue logic
│   └── storage.ts           # Event storage
├── events/
│   ├── create.ts            # Create event handlers
│   ├── update.ts            # Update event handlers
│   └── status-change.ts     # Status change handlers
├── config/
│   └── default.json
└── README.md
```

## Signature Verification

| Method | Provider Examples |
|--------|-------------------|
| `hmac-sha256` | GitHub, Stripe, Slack |
| `hmac-sha1` | Legacy systems |
| `rsa-sha256` | Google, enterprise |
| `jwt` | Auth0, custom |
| `api-key` | Simple verification |
| `none` | Internal/trusted |

## Event Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `create` | New resource created | PR opened, issue created |
| `update` | Resource modified | PR updated, comment edited |
| `delete` | Resource removed | Branch deleted |
| `status-change` | State transition | PR merged, build completed |
| `notification` | Informational | Mention, review requested |
| `sync` | Synchronization | Repository sync |
| `error` | Error notification | Build failed, deploy error |

## Reliability Features

| Feature | Description |
|---------|-------------|
| `retry-queue` | Automatic retry with backoff |
| `dead-letter` | Store failed events for review |
| `idempotency` | Prevent duplicate processing |
| `rate-limiting` | Protect against floods |
| `batching` | Batch similar events |
| `logging` | Comprehensive audit logs |
| `metrics` | Processing metrics |

## Best Practices

1. **Always verify signatures**: Never trust unverified webhooks
2. **Respond quickly**: Return 200 immediately, process async
3. **Handle duplicates**: Implement idempotency
4. **Log everything**: Maintain audit trail
5. **Retry carefully**: Use exponential backoff
