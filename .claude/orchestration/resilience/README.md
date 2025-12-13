# Self-Healing and Resilience System

Production-ready self-healing and resilience framework for the Claude orchestration platform.

## Overview

This system provides comprehensive fault tolerance, automatic recovery, and graceful degradation capabilities:

- **Circuit Breakers**: Three-state pattern (closed, open, half-open) for fault isolation
- **Health Monitoring**: Continuous component monitoring with trend detection
- **Self-Healing**: Automatic failure detection and recovery orchestration
- **Recovery Strategies**: Retry, fallback, restore, and escalation patterns
- **Graceful Degradation**: Feature flag-based degradation with automatic level adjustment
- **Chaos Engineering**: Controlled fault injection for resilience testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Resilience System                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Circuit    │───▶│    Health    │───▶│    Self      │ │
│  │   Breakers   │    │   Monitor    │    │   Healer     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Degradation │    │   Recovery   │    │    Chaos     │ │
│  │   Manager    │    │  Strategies  │    │ Engineering  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Basic Usage

```typescript
import {
  CircuitBreakerManager,
  HealthMonitor,
  SelfHealer,
  GracefulDegradation,
  type ResilienceConfig,
} from './resilience/index.js';

// Initialize components
const circuitBreakers = new CircuitBreakerManager();
const healthMonitor = new HealthMonitor(healthConfig);
const selfHealer = new SelfHealer(healerConfig);
const degradation = new GracefulDegradation(degradationConfig);

// Wire up dependencies
selfHealer.setCircuitBreakers(circuitBreakers);
selfHealer.setHealthMonitor(healthMonitor);
degradation.setHealthMonitor(healthMonitor);

// Start monitoring
healthMonitor.start();
degradation.start();
selfHealer.start();
```

### Circuit Breaker

```typescript
// Create circuit breaker
const breaker = circuitBreakers.getOrCreate('api-service', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000,
  monitorWindow: 60000,
  halfOpenRequests: 3,
});

// Execute with protection
try {
  const result = await breaker.execute(async () => {
    return await apiCall();
  });
} catch (error) {
  if (error.name === 'CircuitBreakerError') {
    console.log('Circuit is open, using fallback');
  }
}

// Monitor state
breaker.onEvent((event) => {
  console.log(`Circuit ${event.component}: ${event.type}`);
});
```

### Health Monitoring

```typescript
// Register custom health check
healthMonitor.registerCheck('database', async () => {
  try {
    await db.ping();
    return {
      name: 'db-ping',
      component: 'database',
      status: 'healthy',
      lastChecked: new Date(),
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'db-ping',
      component: 'database',
      status: 'unhealthy',
      lastChecked: new Date(),
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
});

// Get system health
const health = healthMonitor.getSystemHealth();
console.log(`System health: ${health.overall} (score: ${health.score})`);
```

### Self-Healing

```typescript
// Execute with automatic recovery
const result = await selfHealer.executeWithHealing(
  'payment-service',
  async () => {
    return await processPayment(order);
  },
  'network',
  'high'
);

// Manual failure detection
await selfHealer.detectFailure(
  'database',
  'postgres',
  new Error('Connection timeout'),
  'critical'
);

// Get statistics
const stats = selfHealer.getStatistics();
console.log(`Success rate: ${(stats.successRate * 100).toFixed(2)}%`);
```

### Graceful Degradation

```typescript
// Check feature availability
if (degradation.isFeatureEnabled('advanced-analytics')) {
  await runAdvancedAnalytics();
} else {
  await runBasicAnalytics();
}

// Manual degradation
degradation.degrade('minimal', 'High load detected', 'automatic');

// Get capability level
const parallelismLevel = degradation.getCapabilityLevel('parallel-processing');
const maxParallel = Math.floor(100 * (parallelismLevel / 100));
```

### Chaos Engineering

```typescript
import { ChaosEngineering, ChaosExperiments } from './resilience/index.js';

const chaos = new ChaosEngineering(chaosConfig);
chaos.setComponents(circuitBreakers, degradation, selfHealer);

// Run predefined experiment
const latencyExperiment = ChaosExperiments.latencySpike('api-service', 2000, 60000);
const experiment = await chaos.runExperiment(
  latencyExperiment.name,
  latencyExperiment.faultType,
  latencyExperiment.target,
  latencyExperiment.config,
  latencyExperiment.duration
);

// Analyze results
console.log(`Experiment completed: ${experiment.status}`);
console.log(`Observations:`, experiment.results?.observations);
console.log(`Recommendations:`, experiment.results?.recommendations);
```

## Recovery Strategies

### Retry Strategy

```typescript
import { RecoveryStrategyFactory } from './resilience/index.js';

const retry = RecoveryStrategyFactory.createRetry({
  name: 'exponential-retry',
  maxAttempts: 5,
  backoffStrategy: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
});

const result = await retry.execute(async () => {
  return await unreliableOperation();
});
```

### Fallback Strategy

```typescript
const fallback = RecoveryStrategyFactory.createFallback({
  name: 'cache-fallback',
  fallbackChain: [
    {
      name: 'primary-cache',
      priority: 1,
      execute: async () => await redis.get(key),
    },
    {
      name: 'secondary-cache',
      priority: 2,
      execute: async () => await memcached.get(key),
    },
    {
      name: 'database',
      priority: 3,
      execute: async () => await db.query(sql),
    },
  ],
  cascadeOnFailure: true,
});

const result = await fallback.execute(async () => {
  return await primaryDataSource.fetch();
});
```

### Escalation Strategy

```typescript
const escalation = RecoveryStrategyFactory.createEscalation({
  name: 'critical-alert',
  escalationLevel: 'critical',
  notificationChannels: ['pagerduty', 'slack', 'email'],
  requiresManualIntervention: true,
});

// Register notification handlers
escalation.registerHandler('slack', async (message, context) => {
  await slack.sendMessage('#alerts', message);
});

await escalation.execute(criticalError, { component: 'payment-processor' });
```

## Configuration

### Complete Configuration Example

```typescript
import type { ResilienceConfig } from './resilience/index.js';

const config: ResilienceConfig = {
  circuitBreakers: {
    'api-service': {
      name: 'api-service',
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
      monitorWindow: 60000,
      halfOpenRequests: 3,
    },
  },
  selfHealer: {
    enabled: true,
    autoRecover: true,
    maxConcurrentRecoveries: 10,
    recoveryTimeout: 30000,
    defaultStrategy: retryStrategy,
    strategyMap: {
      network: retryStrategy,
      database: fallbackStrategy,
      service: escalationStrategy,
    },
    escalationThreshold: 3,
    healthCheckInterval: 5000,
  },
  healthMonitor: {
    enabled: true,
    checkInterval: 5000,
    components: ['api', 'database', 'cache', 'queue'],
    thresholds: {
      api: { metric: 'availability', warning: 95, critical: 80, fatal: 50 },
      database: { metric: 'availability', warning: 95, critical: 80, fatal: 50 },
    },
    alertOnDegradation: true,
    retentionDays: 7,
  },
  degradation: {
    enabled: true,
    autoDegrade: true,
    rules: [
      {
        condition: { type: 'threshold', metric: 'health_score', operator: '<', value: 50 },
        targetLevel: 'emergency',
        affectedFeatures: ['parallel-processing', 'analytics'],
      },
    ],
    features: [
      {
        name: 'parallel-processing',
        enabled: true,
        degradationLevels: ['emergency', 'minimal'],
        priority: 80,
      },
    ],
    recoveryCheckInterval: 5000,
  },
  chaos: {
    enabled: false, // Disable in production
    safeMode: true,
    allowedFaults: ['latency', 'error'],
    maxConcurrentExperiments: 1,
    defaultDuration: 60000,
    requireApproval: true,
  },
  persistence: {
    databasePath: './resilience.db',
    retentionDays: 30,
    batchSize: 100,
    flushInterval: 5000,
  },
};
```

## Database Schema

The system uses SQLite for persistence. Initialize with:

```sql
-- Run the schema migration
sqlite3 resilience.db < db/resilience.sql
```

Tables created:
- `circuit_breakers` - Circuit breaker state
- `circuit_breaker_state_history` - State transitions
- `health_checks` - Health check results
- `component_health_summary` - Aggregated health metrics
- `recovery_events` - Failure and recovery tracking
- `degradation_state` - System degradation history
- `feature_flags` - Feature management
- `chaos_experiments` - Chaos experiment tracking
- `system_health_snapshots` - Point-in-time system health

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test circuit-breaker.test.ts

# Run integration tests
npm test integration.test.ts
```

## Monitoring and Observability

### Event Subscription

```typescript
// Subscribe to all resilience events
const unsubscribe = selfHealer.onEvent((event) => {
  switch (event.type) {
    case 'recovery-started':
      metrics.increment('recovery.started');
      break;
    case 'recovery-succeeded':
      metrics.increment('recovery.succeeded');
      break;
    case 'circuit-opened':
      alerts.send('Circuit opened', event.component);
      break;
  }
});
```

### Metrics Collection

```typescript
// Collect system-wide metrics
const metrics = {
  circuitBreakers: circuitBreakers.getAllMetrics(),
  systemHealth: healthMonitor.getSystemHealth(),
  healingStats: selfHealer.getStatistics(),
  degradationState: degradation.getCurrentState(),
};

// Export for monitoring
await prometheus.export(metrics);
```

## Best Practices

1. **Circuit Breaker Thresholds**: Tune based on SLA requirements
2. **Health Check Intervals**: Balance between responsiveness and overhead
3. **Recovery Timeouts**: Set based on P99 latency + margin
4. **Degradation Priorities**: Critical features should have highest priority
5. **Chaos Testing**: Only run in non-production or with safeguards
6. **Event Handling**: Log all events for post-incident analysis

## Production Deployment

```typescript
// Production configuration
const production = {
  selfHealer: {
    enabled: true,
    autoRecover: true,
    maxConcurrentRecoveries: 50,
  },
  chaos: {
    enabled: false, // Disable in production
  },
  persistence: {
    databasePath: '/var/lib/resilience/resilience.db',
    retentionDays: 90,
  },
};
```

## Troubleshooting

### Circuit Breaker Stuck Open

```typescript
// Check state
const state = breaker.getState();
console.log(`State: ${state.state}, Failures: ${state.failures}`);

// Manual reset if needed
breaker.reset();
```

### High Memory Usage

```typescript
// Clear old history
selfHealer.clearHistory(new Date(Date.now() - 86400000)); // 24h ago
healthMonitor.clearHistory('component-name');
```

### Degradation Not Recovering

```typescript
// Check health scores
const health = healthMonitor.getSystemHealth();
console.log(`Health score: ${health.score}`);

// Force recovery if needed
degradation.forceRecover();
```

## License

MIT

## Contributing

See CONTRIBUTING.md for guidelines.
