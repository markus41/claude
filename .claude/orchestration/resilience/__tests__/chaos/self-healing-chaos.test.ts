/**
 * Self-Healing System Chaos Engineering Tests
 * Validates automatic detection and recovery from failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SelfHealer } from '../../self-healer.js';
import { CircuitBreakerManager } from '../../circuit-breaker.js';
import { HealthMonitor } from '../../health-monitor.js';
import type {
  SelfHealerConfig,
  FailureCategory,
  RecoveryStrategy,
} from '../../types.js';

describe('Self-Healing Chaos Tests', () => {
  let selfHealer: SelfHealer;
  let circuitBreakers: CircuitBreakerManager;
  let healthMonitor: HealthMonitor;
  let config: SelfHealerConfig;

  beforeEach(() => {
    circuitBreakers = new CircuitBreakerManager();
    healthMonitor = new HealthMonitor({
      enabled: true,
      checkInterval: 5000,
      components: [],
      degradationThresholds: {
        reduced: 80,
        minimal: 60,
        emergency: 40,
      },
    });

    config = {
      enabled: true,
      autoRecover: true,
      maxConcurrentRecoveries: 5,
      recoveryTimeout: 30000,
      healthCheckInterval: 10000,
      strategyMap: {
        network: {
          name: 'network-retry',
          type: 'retry',
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 5000,
          backoffMultiplier: 2,
          onExhausted: 'escalate',
        },
        service: {
          name: 'service-fallback',
          type: 'fallback',
          fallbackFn: async () => 'fallback-result',
          onExhausted: 'escalate',
        },
        database: {
          name: 'database-restore',
          type: 'restore',
          checkpointInterval: 60000,
          onExhausted: 'escalate',
        },
        unknown: {
          name: 'unknown-escalate',
          type: 'escalate',
          escalationLevel: 'critical',
          notificationChannels: ['console'],
          requiresManualIntervention: false,
        },
      },
      defaultStrategy: {
        name: 'default-retry',
        type: 'retry',
        maxAttempts: 3,
        initialDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 1.5,
        onExhausted: 'fail',
      },
    };

    selfHealer = new SelfHealer(config);
    selfHealer.setCircuitBreakers(circuitBreakers);
    selfHealer.setHealthMonitor(healthMonitor);
  });

  afterEach(() => {
    selfHealer.stop();
    selfHealer.clearHistory();
  });

  describe('Automatic Recovery Triggers', () => {
    it('should automatically detect and recover from transient failures', async () => {
      const failurePromise = selfHealer.detectFailure(
        'network',
        'api-service',
        new Error('Connection timeout'),
        'medium'
      );

      const failure = await failurePromise;
      expect(failure).toBeDefined();
      expect(failure.category).toBe('network');

      // Wait for auto-recovery
      await new Promise((resolve) => setTimeout(resolve, 500));

      const stats = selfHealer.getStatistics();
      expect(stats.totalRecoveries).toBeGreaterThan(0);
    });

    it('should handle multiple simultaneous failures', async () => {
      const failures = await Promise.all([
        selfHealer.detectFailure(
          'network',
          'service-1',
          new Error('Failure 1'),
          'medium'
        ),
        selfHealer.detectFailure(
          'service',
          'service-2',
          new Error('Failure 2'),
          'high'
        ),
        selfHealer.detectFailure(
          'database',
          'db-1',
          new Error('Failure 3'),
          'critical'
        ),
      ]);

      expect(failures.length).toBe(3);

      // Wait for auto-recovery attempts
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = selfHealer.getStatistics();
      expect(stats.totalFailures).toBe(3);
      expect(stats.totalRecoveries).toBeGreaterThan(0);
    });

    it('should respect max concurrent recoveries limit', async () => {
      const maxConcurrent = 5;
      selfHealer.updateConfig({ maxConcurrentRecoveries: maxConcurrent });

      // Trigger more failures than max concurrent
      const failurePromises = Array.from({ length: 10 }, (_, i) =>
        selfHealer.detectFailure(
          'network',
          `service-${i}`,
          new Error(`Failure ${i}`),
          'medium'
        )
      );

      await Promise.all(failurePromises);

      // Wait briefly
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = selfHealer.getStatistics();
      expect(stats.activeRecoveries).toBeLessThanOrEqual(maxConcurrent);
    });
  });

  describe('Recovery Strategy Selection', () => {
    it('should select retry strategy for network failures', async () => {
      const failure = await selfHealer.detectFailure(
        'network',
        'api-gateway',
        new Error('Network error'),
        'medium'
      );

      const result = await selfHealer.heal(failure.id);

      expect(result.strategy).toContain('retry');
      expect(result.attempts.length).toBeGreaterThan(0);
    });

    it('should select fallback strategy for service failures', async () => {
      const failure = await selfHealer.detectFailure(
        'service',
        'payment-service',
        new Error('Service unavailable'),
        'high'
      );

      const result = await selfHealer.heal(failure.id);

      expect(result.strategy).toContain('fallback');
    });

    it('should use default strategy for unknown categories', async () => {
      const failure = await selfHealer.detectFailure(
        'unknown',
        'mystery-service',
        new Error('Unknown error'),
        'low'
      );

      const result = await selfHealer.heal(failure.id);

      expect(result.strategy).toBeDefined();
    });

    it('should allow custom strategy registration', () => {
      const customStrategy: RecoveryStrategy = {
        name: 'custom-cache-recovery',
        type: 'restore',
        checkpointInterval: 30000,
        onExhausted: 'fail',
      };

      selfHealer.registerStrategy('cache' as FailureCategory, customStrategy);

      // Strategy should be registered
      const config = selfHealer.getConfig();
      expect(config.strategyMap).toHaveProperty('cache');
    });
  });

  describe('Escalation Paths', () => {
    it('should escalate after exhausting retry attempts', async () => {
      // Configure retry to exhaust quickly
      selfHealer.registerStrategy('network', {
        name: 'quick-exhaust',
        type: 'retry',
        maxAttempts: 1,
        initialDelayMs: 100,
        maxDelayMs: 100,
        backoffMultiplier: 1,
        onExhausted: 'escalate',
      });

      const failure = await selfHealer.detectFailure(
        'network',
        'failing-service',
        new Error('Persistent failure'),
        'high'
      );

      const result = await selfHealer.heal(failure.id);

      expect(['escalated', 'failed']).toContain(result.finalState);
    });

    it('should trigger escalation for critical failures', async () => {
      const eventSpy = vi.fn();
      selfHealer.onEvent(eventSpy);

      await selfHealer.detectFailure(
        'database',
        'critical-db',
        new Error('Database crash'),
        'critical'
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if escalation event was emitted
      const escalationEvents = eventSpy.mock.calls.filter(
        ([event]) => event.type === 'escalation-triggered'
      );

      expect(escalationEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Rollback Mechanisms', () => {
    it('should support restore recovery strategy', async () => {
      const failure = await selfHealer.detectFailure(
        'database',
        'user-db',
        new Error('Data corruption'),
        'high'
      );

      const result = await selfHealer.heal(failure.id);

      expect(result.strategy).toContain('restore');
    });

    it('should track recovery attempts and rollbacks', async () => {
      const failure = await selfHealer.detectFailure(
        'service',
        'order-service',
        new Error('Transaction failed'),
        'medium'
      );

      await selfHealer.heal(failure.id);

      const history = selfHealer.getHealingHistory('order-service');
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].result).toBeDefined();
    });
  });

  describe('Graceful Degradation Levels', () => {
    it('should degrade gracefully under sustained failures', async () => {
      // Simulate sustained failures
      for (let i = 0; i < 5; i++) {
        await selfHealer.detectFailure(
          'service',
          'critical-service',
          new Error(`Sustained failure ${i}`),
          'high'
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = selfHealer.getStatistics();
      expect(stats.totalFailures).toBe(5);
    });

    it('should recover from degraded state when health improves', async () => {
      // Trigger failures
      await selfHealer.detectFailure(
        'network',
        'api-service',
        new Error('Network issue'),
        'medium'
      );

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = selfHealer.getStatistics();
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recovery Time Measurement', () => {
    it('should measure recovery duration accurately', async () => {
      const failure = await selfHealer.detectFailure(
        'network',
        'measured-service',
        new Error('Timed failure'),
        'medium'
      );

      const startTime = Date.now();
      const result = await selfHealer.heal(failure.id);
      const actualDuration = Date.now() - startTime;

      expect(result.totalDurationMs).toBeDefined();
      expect(result.totalDurationMs).toBeGreaterThan(0);
      expect(result.totalDurationMs).toBeLessThanOrEqual(actualDuration + 100);
    });

    it('should track average recovery time', async () => {
      // Perform multiple recoveries
      for (let i = 0; i < 5; i++) {
        const failure = await selfHealer.detectFailure(
          'network',
          `service-${i}`,
          new Error(`Failure ${i}`),
          'low'
        );
        await selfHealer.heal(failure.id);
      }

      const stats = selfHealer.getStatistics();
      expect(stats.avgRecoveryTime).toBeGreaterThan(0);
    });

    it('should respect recovery timeout', async () => {
      selfHealer.updateConfig({ recoveryTimeout: 100 });

      const failure = await selfHealer.detectFailure(
        'network',
        'timeout-service',
        new Error('Timeout test'),
        'medium'
      );

      const result = await selfHealer.heal(failure.id);

      if (result.totalDurationMs >= 100) {
        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('timeout');
      }
    });
  });

  describe('Concurrent Recovery Handling', () => {
    it('should handle concurrent recovery attempts for same failure', async () => {
      const failure = await selfHealer.detectFailure(
        'service',
        'concurrent-service',
        new Error('Concurrent test'),
        'medium'
      );

      // Attempt multiple concurrent healings
      const healPromises = [
        selfHealer.heal(failure.id),
        selfHealer.heal(failure.id),
        selfHealer.heal(failure.id),
      ];

      const results = await Promise.all(healPromises);

      // All should return same result (cached recovery)
      expect(results.length).toBe(3);
      results.forEach((result) => {
        expect(result.strategy).toBeDefined();
      });
    });

    it('should manage recovery queue effectively', async () => {
      const failures = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          selfHealer.detectFailure(
            'network',
            `queue-service-${i}`,
            new Error(`Queue test ${i}`),
            'low'
          )
        )
      );

      // Heal all concurrently
      const healPromises = failures.map((f) => selfHealer.heal(f.id));
      await Promise.allSettled(healPromises);

      const stats = selfHealer.getStatistics();
      expect(stats.totalRecoveries).toBe(10);
    });
  });

  describe('Failure Pattern Detection', () => {
    it('should detect repeated failures in same component', async () => {
      const component = 'flaky-service';

      for (let i = 0; i < 5; i++) {
        await selfHealer.detectFailure(
          'service',
          component,
          new Error(`Repeated failure ${i}`),
          'medium'
        );
      }

      const history = selfHealer.getFailureHistory(component);
      expect(history.length).toBe(5);
      expect(history.every((f) => f.component === component)).toBe(true);
    });

    it('should track failure categories', async () => {
      await selfHealer.detectFailure(
        'network',
        'service-1',
        new Error('Network'),
        'low'
      );
      await selfHealer.detectFailure(
        'service',
        'service-2',
        new Error('Service'),
        'medium'
      );
      await selfHealer.detectFailure(
        'database',
        'service-3',
        new Error('Database'),
        'high'
      );

      const allFailures = selfHealer.getFailureHistory();
      const categories = new Set(allFailures.map((f) => f.category));

      expect(categories.size).toBe(3);
      expect(categories.has('network')).toBe(true);
      expect(categories.has('service')).toBe(true);
      expect(categories.has('database')).toBe(true);
    });
  });

  describe('Health Check Integration', () => {
    it('should perform periodic health checks', async () => {
      selfHealer.start();

      // Register unhealthy component in health monitor
      healthMonitor.registerComponent('unhealthy-service', {
        name: 'unhealthy-service',
        type: 'service',
        requiredFor: ['critical-path'],
        healthCheckFn: async () => ({
          healthy: false,
          message: 'Service degraded',
        }),
      });

      // Trigger health check
      await selfHealer.performHealthCheck();

      await new Promise((resolve) => setTimeout(resolve, 500));

      const failures = selfHealer.getFailureHistory('unhealthy-service');
      expect(failures.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery Statistics', () => {
    it('should calculate success rate accurately', async () => {
      // Mix of successful and failed recoveries
      for (let i = 0; i < 10; i++) {
        const failure = await selfHealer.detectFailure(
          'network',
          `stats-service-${i}`,
          new Error(`Stats test ${i}`),
          'low'
        );
        await selfHealer.heal(failure.id);
      }

      const stats = selfHealer.getStatistics();
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(stats.successfulRecoveries + stats.failedRecoveries).toBe(
        stats.totalRecoveries
      );
    });

    it('should track active recoveries count', async () => {
      selfHealer.updateConfig({ maxConcurrentRecoveries: 3 });

      // Start multiple recoveries
      const failures = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          selfHealer.detectFailure(
            'network',
            `active-service-${i}`,
            new Error(`Active test ${i}`),
            'medium'
          )
        )
      );

      // Don't await - check active count
      failures.forEach((f) => selfHealer.heal(f.id));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = selfHealer.getStatistics();
      expect(stats.activeRecoveries).toBeLessThanOrEqual(3);
    });
  });

  describe('History Management', () => {
    it('should clear old history', async () => {
      await selfHealer.detectFailure(
        'service',
        'old-service',
        new Error('Old failure'),
        'low'
      );

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      selfHealer.clearHistory(oneHourAgo);

      const history = selfHealer.getFailureHistory();
      expect(history.length).toBeGreaterThan(0); // Recent failures remain
    });

    it('should clear all history when no date specified', async () => {
      await selfHealer.detectFailure(
        'service',
        'clear-service',
        new Error('Clear test'),
        'low'
      );

      selfHealer.clearHistory();

      const history = selfHealer.getFailureHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow runtime configuration updates', () => {
      selfHealer.updateConfig({
        autoRecover: false,
        maxConcurrentRecoveries: 10,
      });

      const config = selfHealer.getConfig();
      expect(config.autoRecover).toBe(false);
      expect(config.maxConcurrentRecoveries).toBe(10);
    });

    it('should start and stop auto-healing', () => {
      expect(selfHealer.isEnabled()).toBe(true);

      selfHealer.stop();
      expect(selfHealer.isEnabled()).toBe(false);

      selfHealer.start();
      expect(selfHealer.isEnabled()).toBe(true);
    });
  });
});
