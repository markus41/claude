/**
 * Resilience System Integration Tests
 * End-to-end testing of all resilience components working together
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreakerManager } from '../circuit-breaker.js';
import { HealthMonitor } from '../health-monitor.js';
import { SelfHealer } from '../self-healer.js';
import { GracefulDegradation } from '../degradation.js';
import { ChaosEngineering } from '../chaos-integration.js';
import type {
  SelfHealerConfig,
  HealthMonitorConfig,
  DegradationConfig,
  ChaosConfig,
  RecoveryStrategy,
} from '../types.js';

describe('Resilience System Integration', () => {
  let circuitBreakers: CircuitBreakerManager;
  let healthMonitor: HealthMonitor;
  let selfHealer: SelfHealer;
  let degradation: GracefulDegradation;
  let chaosEngineering: ChaosEngineering;

  beforeEach(() => {
    // Initialize circuit breakers
    circuitBreakers = new CircuitBreakerManager();

    // Initialize health monitor
    const healthConfig: HealthMonitorConfig = {
      enabled: true,
      checkInterval: 1000,
      components: ['api', 'database', 'cache'],
      thresholds: {
        api: { metric: 'availability', warning: 95, critical: 80, fatal: 50 },
        database: { metric: 'availability', warning: 95, critical: 80, fatal: 50 },
        cache: { metric: 'availability', warning: 90, critical: 70, fatal: 40 },
      },
      alertOnDegradation: true,
      retentionDays: 7,
    };
    healthMonitor = new HealthMonitor(healthConfig);

    // Initialize self-healer
    const defaultStrategy: RecoveryStrategy = {
      name: 'default-retry',
      type: 'retry',
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
      initialDelay: 100,
      maxDelay: 5000,
    };

    const healerConfig: SelfHealerConfig = {
      enabled: true,
      autoRecover: true,
      maxConcurrentRecoveries: 5,
      recoveryTimeout: 30000,
      defaultStrategy,
      strategyMap: {
        network: defaultStrategy,
        database: defaultStrategy,
        service: defaultStrategy,
        resource: defaultStrategy,
        dependency: defaultStrategy,
        timeout: defaultStrategy,
        unknown: defaultStrategy,
      },
      escalationThreshold: 3,
      healthCheckInterval: 5000,
    };
    selfHealer = new SelfHealer(healerConfig);

    // Initialize degradation
    const degradationConfig: DegradationConfig = {
      enabled: true,
      autoDegrade: true,
      rules: [
        {
          condition: {
            type: 'threshold',
            metric: 'health_score',
            operator: '<',
            value: 50,
          },
          targetLevel: 'emergency',
          affectedFeatures: ['parallel-processing', 'advanced-routing'],
        },
        {
          condition: {
            type: 'threshold',
            metric: 'health_score',
            operator: '<',
            value: 70,
          },
          targetLevel: 'minimal',
          affectedFeatures: ['telemetry'],
        },
      ],
      features: [
        {
          name: 'parallel-processing',
          enabled: true,
          degradationLevels: ['emergency', 'minimal'],
          priority: 80,
        },
        {
          name: 'advanced-routing',
          enabled: true,
          degradationLevels: ['emergency'],
          priority: 60,
        },
        {
          name: 'telemetry',
          enabled: true,
          degradationLevels: ['emergency', 'minimal', 'reduced'],
          priority: 40,
        },
      ],
      recoveryCheckInterval: 5000,
    };
    degradation = new GracefulDegradation(degradationConfig);

    // Initialize chaos engineering
    const chaosConfig: ChaosConfig = {
      enabled: true,
      safeMode: true,
      allowedFaults: ['latency', 'error', 'service-unavailable'],
      maxConcurrentExperiments: 3,
      defaultDuration: 5000,
      requireApproval: false,
    };
    chaosEngineering = new ChaosEngineering(chaosConfig);

    // Wire up components
    selfHealer.setCircuitBreakers(circuitBreakers);
    selfHealer.setHealthMonitor(healthMonitor);
    degradation.setHealthMonitor(healthMonitor);
    chaosEngineering.setComponents(circuitBreakers, degradation, selfHealer);
  });

  it('should initialize all components', () => {
    expect(circuitBreakers).toBeDefined();
    expect(healthMonitor).toBeDefined();
    expect(selfHealer).toBeDefined();
    expect(degradation).toBeDefined();
    expect(chaosEngineering).toBeDefined();
  });

  it('should detect and recover from failures', async () => {
    const failure = await selfHealer.detectFailure(
      'network',
      'api-service',
      new Error('Connection timeout'),
      'medium'
    );

    expect(failure).toBeDefined();
    expect(failure.category).toBe('network');

    // Check that failure was recorded
    const history = selfHealer.getFailureHistory('api-service');
    expect(history.length).toBe(1);
  });

  it('should trigger circuit breaker on repeated failures', async () => {
    const breaker = circuitBreakers.getOrCreate('api-service');

    // Trigger failures
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Service unavailable');
        });
      } catch (error) {
        // Expected
      }
    }

    const state = breaker.getState();
    expect(state.state).toBe('open');
  });

  it('should perform health checks', async () => {
    const check = await healthMonitor.performHealthCheck('api', async () => ({
      name: 'api-health',
      component: 'api',
      status: 'healthy',
      lastChecked: new Date(),
      responseTime: 50,
    }));

    expect(check.status).toBe('healthy');
    expect(check.component).toBe('api');
  });

  it('should calculate system health', async () => {
    // Perform some health checks
    await healthMonitor.performHealthCheck('api', async () => ({
      name: 'api-health',
      component: 'api',
      status: 'healthy',
      lastChecked: new Date(),
      responseTime: 50,
    }));

    const systemHealth = healthMonitor.getSystemHealth();
    expect(systemHealth).toBeDefined();
    expect(systemHealth.overall).toBe('healthy');
    expect(systemHealth.score).toBeGreaterThan(0);
  });

  it('should degrade gracefully under stress', () => {
    degradation.degrade('minimal', 'Testing degradation', 'manual');

    expect(degradation.getCurrentLevel()).toBe('minimal');
    expect(degradation.isDegraded()).toBe(true);

    const features = degradation.getFeatures();
    const telemetry = features.get('telemetry');
    expect(telemetry?.enabled).toBe(false);
  });

  it('should recover from degradation', () => {
    degradation.degrade('minimal', 'Testing degradation', 'manual');
    expect(degradation.isDegraded()).toBe(true);

    degradation.recover();
    expect(degradation.isDegraded()).toBe(false);
    expect(degradation.getCurrentLevel()).toBe('full');
  });

  it('should execute function with self-healing', async () => {
    let attempts = 0;
    const result = await selfHealer.executeWithHealing(
      'test-service',
      async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Transient failure');
        }
        return 'success';
      },
      'service',
      'low'
    );

    // Should succeed after retry
    expect(result).toBe('success');
    expect(attempts).toBeGreaterThan(1);
  });

  it('should provide system-wide statistics', () => {
    const healingStats = selfHealer.getStatistics();
    expect(healingStats).toBeDefined();
    expect(healingStats.totalFailures).toBeGreaterThanOrEqual(0);

    const degradationStats = degradation.getStatistics();
    expect(degradationStats).toBeDefined();
    expect(degradationStats.totalFeatures).toBeGreaterThan(0);

    const healthScore = circuitBreakers.getOverallHealth();
    expect(healthScore).toBeGreaterThanOrEqual(0);
    expect(healthScore).toBeLessThanOrEqual(100);
  });

  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      healthMonitor.performHealthCheck(`service-${i}`, async () => ({
        name: `service-${i}-check`,
        component: `service-${i}`,
        status: Math.random() > 0.3 ? 'healthy' : 'degraded',
        lastChecked: new Date(),
        responseTime: Math.random() * 100,
      }))
    );

    const results = await Promise.all(operations);
    expect(results.length).toBe(10);
  });

  it('should integrate with chaos experiments', async () => {
    const experiment = await chaosEngineering.runExperiment(
      'Test Latency',
      'latency',
      'api-service',
      { probability: 0.5, latencyMs: 100 },
      1000
    );

    expect(experiment.status).toBe('completed');
    expect(experiment.results).toBeDefined();
  });

  it('should emit events across components', async () => {
    const events: any[] = [];

    circuitBreakers.getOrCreate('test').onEvent((e) => events.push({ type: 'circuit', ...e }));
    healthMonitor.onEvent((e) => events.push({ type: 'health', ...e }));
    selfHealer.onEvent((e) => events.push({ type: 'healing', ...e }));
    degradation.onEvent((e) => events.push({ type: 'degradation', ...e }));

    // Trigger various events
    await selfHealer.detectFailure('network', 'test', new Error('Test'), 'low');
    degradation.degrade('reduced', 'Test', 'manual');

    // Should have captured events
    expect(events.length).toBeGreaterThan(0);
  });
});

describe('Real-world Scenario Tests', () => {
  it('should handle cascading failures', async () => {
    const circuitBreakers = new CircuitBreakerManager();
    const dbBreaker = circuitBreakers.getOrCreate('database');
    const apiBreaker = circuitBreakers.getOrCreate('api');

    // Simulate database failure affecting API
    for (let i = 0; i < 5; i++) {
      try {
        await dbBreaker.execute(async () => {
          throw new Error('Database connection lost');
        });
      } catch (error) {
        // Expected
      }

      try {
        await apiBreaker.execute(async () => {
          throw new Error('API failed due to database');
        });
      } catch (error) {
        // Expected
      }
    }

    expect(dbBreaker.getState().state).toBe('open');
    expect(apiBreaker.getState().state).toBe('open');

    const overallHealth = circuitBreakers.getOverallHealth();
    expect(overallHealth).toBeLessThan(50);
  });

  it('should handle recovery after outage', async () => {
    const healthMonitor = new HealthMonitor({
      enabled: true,
      checkInterval: 100,
      components: ['service'],
      thresholds: {},
      alertOnDegradation: false,
      retentionDays: 1,
    });

    // Simulate outage
    await healthMonitor.performHealthCheck('service', async () => ({
      name: 'service-check',
      component: 'service',
      status: 'unhealthy',
      lastChecked: new Date(),
      responseTime: 5000,
      error: 'Service unavailable',
    }));

    let health = healthMonitor.getSystemHealth();
    expect(health.overall).toBe('unhealthy');

    // Simulate recovery
    await healthMonitor.performHealthCheck('service', async () => ({
      name: 'service-check',
      component: 'service',
      status: 'healthy',
      lastChecked: new Date(),
      responseTime: 50,
    }));

    health = healthMonitor.getSystemHealth();
    expect(health.overall).toBe('healthy');
  });

  it('should maintain availability during degradation', () => {
    const degradation = new GracefulDegradation({
      enabled: true,
      autoDegrade: false,
      rules: [],
      features: [
        { name: 'feature-a', enabled: true, degradationLevels: ['minimal', 'emergency'], priority: 100 },
        { name: 'feature-b', enabled: true, degradationLevels: ['emergency'], priority: 80 },
        { name: 'feature-c', enabled: true, degradationLevels: ['reduced', 'minimal', 'emergency'], priority: 50 },
      ],
      recoveryCheckInterval: 1000,
    });

    // Degrade to minimal
    degradation.degrade('minimal', 'Load shedding', 'automatic');

    // Core features should still be enabled
    expect(degradation.isFeatureEnabled('feature-b')).toBe(true);

    // Lower priority features should be disabled
    expect(degradation.isFeatureEnabled('feature-a')).toBe(false);
    expect(degradation.isFeatureEnabled('feature-c')).toBe(false);
  });
});
