# Event Processor Archetype

Create event-driven processing systems with pub/sub patterns, event sourcing, and CQRS support.

## Overview

This archetype generates comprehensive event processing infrastructure including:
- Event bus with pub/sub capabilities
- Event store with persistence
- Projections and read models
- Saga/choreography orchestration
- Replay and snapshot support

## When to Use

- Building event-driven microservices
- Implementing event sourcing patterns
- Creating audit trails with event replay
- Orchestrating distributed workflows
- Building real-time data pipelines

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `pluginName` | string | Yes | Plugin name |
| `description` | string | Yes | Plugin description |
| `pattern` | choice | Yes | Event processing pattern |
| `transport` | choice | Yes | Event transport mechanism |
| `features` | multi | Yes | Advanced features |
| `persistence` | choice | Yes | Event store persistence |

## Example Usage

```bash
# Interactive mode
/archetype create event-processor

# Non-interactive
/archetype create event-processor \
  --variable pluginName=order-events \
  --variable description="Processes order lifecycle events with CQRS" \
  --variable pattern=cqrs \
  --variable transport=redis \
  --variable features=replay,snapshots,projections \
  --variable persistence=postgres \
  --non-interactive
```

## Generated Structure

```
{pluginName}/
├── .claude-plugin/
│   └── plugin.json
├── src/
│   ├── bus/
│   │   ├── event-bus.ts      # Pub/sub event bus
│   │   └── handlers.ts       # Event handlers
│   ├── store/
│   │   ├── event-store.ts    # Event persistence
│   │   └── snapshots.ts      # Snapshot management
│   ├── projections/
│   │   └── projector.ts      # Read model projections
│   ├── sagas/
│   │   └── orchestrator.ts   # Saga orchestration
│   └── index.ts
├── events/
│   └── definitions.ts        # Event type definitions
├── config/
│   └── default.json
└── README.md
```

## Event Patterns

| Pattern | Description | Best For |
|---------|-------------|----------|
| `pub-sub` | Publish/subscribe messaging | Decoupled services |
| `event-sourcing` | Store state as events | Audit trails, replay |
| `cqrs` | Command/Query separation | Complex domains |
| `saga` | Long-running transactions | Distributed workflows |
| `choreography` | Event-based orchestration | Microservices |

## Transport Options

| Transport | Characteristics |
|-----------|-----------------|
| `in-memory` | Fast, single-process only |
| `redis` | Low latency, good for small-medium scale |
| `kafka` | High throughput, durable, partitioned |
| `rabbitmq` | Reliable, flexible routing |
| `sqs` | AWS managed, scalable |
| `file` | Simple, local development |

## Features

| Feature | Description |
|---------|-------------|
| `replay` | Replay events from store |
| `snapshots` | Periodic state snapshots |
| `projections` | Build read models from events |
| `dead-letter` | Handle failed events |
| `ordering` | Guarantee event order |
| `deduplication` | Prevent duplicate processing |
| `partitioning` | Parallel processing by key |

## Best Practices

1. **Immutable events**: Events should never change
2. **Rich event data**: Include all context needed
3. **Idempotent handlers**: Handle duplicates gracefully
4. **Version events**: Plan for schema evolution
5. **Monitor lag**: Track processing delays
