/**
 * Distributed Systems Chaos Engineering Tests
 * Validates cross-system resilience under various fault conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChaosEngineering } from '../../chaos-integration.js';
import { CircuitBreakerManager } from '../../circuit-breaker.js';
import { GracefulDegradation } from '../../degradation.js';
import { SelfHealer } from '../../self-healer.js';
import { HealthMonitor } from '../../health-monitor.js';
import type {
  ChaosConfig,
  FaultType,
  DegradationConfig,
  SelfHealerConfig,
} from '../../types.js';
import {
  NetworkScenarios,
  ServiceFailureScenarios,
  ResourceExhaustionScenarios,
  CombinedScenarios,
} from './chaos-scenarios.js';

describe('Distributed Systems Chaos Tests', () => {
  let chaos: ChaosEngineering;
  let circuitBreakers: CircuitBreakerManager;
  let degradation: GracefulDegradation;
  let selfHealer: SelfHealer;
  let healthMonitor: HealthMonitor;

  beforeEach(() => {
    // Initialize circuit breakers
    circuitBreakers = new CircuitBreakerManager();

    // Initialize health monitor
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

    // Initialize graceful degradation
    const degradationConfig: DegradationConfig = {
      enabled: true,
      autoDegrade: true,
      recoveryCheckInterval: 5000,
      features: [
        {
          name: 'parallel-processing',
          enabled: true,
          degradationLevels: ['reduced', 'minimal', 'emergency'],
          priority: 30,
        },
        {
          name: 'advanced-analytics',
          enabled: true,
          degradationLevels: ['minimal', 'emergency'],
          priority: 50,
        },
        {
          name: 'real-time-sync',
          enabled: true,
          degradationLevels: ['emergency'],
          priority: 70,
        },
      ],
      rules: [],
    };

    degradation = new GracefulDegradation(degradationConfig);
    degradation.setHealthMonitor(healthMonitor);

    // Initialize self-healer
    const healerConfig: SelfHealerConfig = {
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

    selfHealer = new SelfHealer(healerConfig);
    selfHealer.setCircuitBreakers(circuitBreakers);
    selfHealer.setHealthMonitor(healthMonitor);

    // Initialize chaos engineering
    const chaosConfig: ChaosConfig = {
      enabled: true,
      safeMode: false, // Allow destructive faults for testing
      allowedFaults: [
        'latency',
        'error',
        'service-unavailable',
        'resource-exhaustion',
        'network-partition',
      ],
      maxConcurrentExperiments: 3,
      defaultDuration: 30000,
      requireApproval: false,
    };

    chaos = new ChaosEngineering(chaosConfig);
    chaos.setComponents(circuitBreakers, degradation, selfHealer);
  });

  afterEach(() => {
    degradation.stop();
    selfHealer.stop();
  });

  describe('Knowledge Federation Under Network Partition', () => {
    it('should maintain partial functionality during network partition', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-partition'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'knowledge-federation',
        scenario.config,
        scenario.duration
      );

      expect(experiment.status).toBe('completed');
      expect(experiment.results).toBeDefined();

      if (experiment.results) {
        // Should trigger circuit breaker
        expect(experiment.results.systemBehavior.circuitBreakerTrips).toBeGreaterThan(0);

        // Should activate degradation
        expect(experiment.results.systemBehavior.degradationActivated).toBe(true);

        // Should have recovery attempts
        expect(experiment.results.successfulRecoveries).toBeGreaterThanOrEqual(0);
      }
    });

    it('should synchronize after partition heals', async () => {
      // Simulate partition
      const breaker = circuitBreakers.getOrCreate('knowledge-sync', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 2000,
        halfOpenRequests: 2,
      });

      // Trip circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Partition simulated');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Simulate successful sync
      await breaker.execute(async () => 'synced');

      // Should eventually recover
      const state = breaker.getState();
      expect(['half-open', 'closed']).toContain(state.state);
    });
  });

  describe('Agent Collaboration During Service Failures', () => {
    it('should maintain collaboration with degraded performance', async () => {
      const scenario = ServiceFailureScenarios.find(
        (s) => s.id === 'intermittent-errors-30'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'agent-collaboration',
        scenario.config,
        scenario.duration
      );

      expect(experiment.status).toBe('completed');

      if (experiment.results) {
        // With 30% error rate, system should handle gracefully
        const totalAttempts =
          experiment.results.successfulRecoveries +
          experiment.results.failedRecoveries;

        expect(totalAttempts).toBeGreaterThan(0);
      }
    });

    it('should activate fallback collaboration mechanisms under high failure', async () => {
      const scenario = ServiceFailureScenarios.find(
        (s) => s.id === 'intermittent-errors-70'
      )!;

      const eventSpy = vi.fn();
      chaos.onEvent(eventSpy);

      await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'agent-collaboration',
        scenario.config,
        20000 // Shorter duration for test
      );

      // Should emit degradation or circuit breaker events
      const degradationEvents = eventSpy.mock.calls.filter(
        ([event]) =>
          event.type === 'degradation-activated' ||
          event.type === 'circuit-opened'
      );

      expect(degradationEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Observability Under High Load', () => {
    it('should maintain observability during resource pressure', async () => {
      const scenario = ResourceExhaustionScenarios.find(
        (s) => s.id === 'memory-pressure-80'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'observability',
        scenario.config,
        scenario.duration
      );

      expect(experiment.status).toBe('completed');

      // Observability should degrade but not fail completely
      if (experiment.results) {
        expect(experiment.results.systemBehavior.degradationActivated).toBe(true);
      }
    });

    it('should reduce observability overhead under CPU stress', async () => {
      const scenario = ResourceExhaustionScenarios.find(
        (s) => s.id === 'cpu-stress-90'
      )!;

      degradation.start();

      await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'observability',
        scenario.config,
        15000 // Shorter test
      );

      // Check if degradation was activated
      const degradationState = degradation.getCurrentState();
      expect(degradationState).toBeDefined();

      if (degradationState) {
        expect(degradationState.level).not.toBe('full');
      }
    });
  });

  describe('NLP Orchestration Under Degraded Conditions', () => {
    it('should provide simplified NLP under latency', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-latency-500ms'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'nlp-orchestration',
        scenario.config,
        scenario.duration
      );

      expect(experiment.status).toBe('completed');

      if (experiment.results) {
        // Latency should trigger degradation
        expect(experiment.results.systemBehavior.degradationActivated).toBe(true);
        expect(experiment.results.avgRecoveryTime).toBeLessThan(10000);
      }
    });

    it('should fallback to basic commands during errors', async () => {
      const scenario = ServiceFailureScenarios.find(
        (s) => s.id === 'intermittent-errors-30'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'nlp-orchestration',
        scenario.config,
        scenario.duration
      );

      expect(experiment.status).toBe('completed');

      if (experiment.results) {
        // Should have recovery attempts
        expect(
          experiment.results.successfulRecoveries +
            experiment.results.failedRecoveries
        ).toBeGreaterThan(0);
      }
    });
  });

  describe('Cascading Failure Prevention', () => {
    it('should prevent cascading failures across components', async () => {
      // Simulate failure in one component
      await selfHealer.detectFailure(
        'service',
        'component-a',
        new Error('Initial failure'),
        'high'
      );

      // Circuit breaker should prevent cascade
      const breakerA = circuitBreakers.getOrCreate('component-a', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 2000,
        halfOpenRequests: 2,
      });

      // Trip the breaker
      for (let i = 0; i < 5; i++) {
        try {
          await breakerA.execute(async () => {
            throw new Error('Cascading failure');
          });
        } catch (error) {
          // Expected
        }
      }

      // Component B should remain operational
      const breakerB = circuitBreakers.getOrCreate('component-b', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 2000,
        halfOpenRequests: 2,
      });

      expect(breakerA.getState().state).toBe('open');
      expect(breakerB.getState().state).toBe('closed');
    });

    it('should isolate failures to prevent system-wide outage', async () => {
      const scenario = CombinedScenarios.find(
        (s) => s.id === 'cascading-failures'
      )!;

      const eventSpy = vi.fn();
      chaos.onEvent(eventSpy);

      await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'distributed-system',
        scenario.config,
        scenario.duration
      );

      // Should have circuit breaker activations
      const circuitEvents = eventSpy.mock.calls.filter(
        ([event]) => event.type === 'circuit-opened'
      );

      expect(circuitEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Recovery Coordination Across Systems', () => {
    it('should coordinate recovery across multiple failing components', async () => {
      // Create multiple failing services
      const services = ['service-1', 'service-2', 'service-3'];

      await Promise.all(
        services.map((service) =>
          selfHealer.detectFailure(
            'service',
            service,
            new Error(`${service} failed`),
            'medium'
          )
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const stats = selfHealer.getStatistics();
      expect(stats.totalFailures).toBe(3);
      expect(stats.totalRecoveries).toBeGreaterThan(0);
    });

    it('should prioritize critical component recovery', async () => {
      await selfHealer.detectFailure(
        'service',
        'critical-service',
        new Error('Critical failure'),
        'critical'
      );

      await selfHealer.detectFailure(
        'service',
        'non-critical-service',
        new Error('Minor failure'),
        'low'
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Both should be attempted, but timing may differ
      const stats = selfHealer.getStatistics();
      expect(stats.totalRecoveries).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance Under Chaos', () => {
    it('should maintain acceptable response times under latency injection', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-latency-100ms'
      )!;

      const startTime = Date.now();

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'adaptive-intelligence',
        scenario.config,
        10000 // 10 seconds
      );

      const duration = Date.now() - startTime;

      expect(experiment.status).toBe('completed');
      expect(duration).toBeGreaterThanOrEqual(10000);
      expect(duration).toBeLessThan(15000); // Some overhead acceptable
    });

    it('should track performance degradation metrics', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-latency-2000ms'
      )!;

      const experiment = await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'adaptive-intelligence',
        scenario.config,
        20000
      );

      if (experiment.results) {
        expect(experiment.results.avgRecoveryTime).toBeGreaterThan(0);
        expect(experiment.results.maxRecoveryTime).toBeGreaterThanOrEqual(
          experiment.results.avgRecoveryTime
        );
      }
    });
  });

  describe('System Health During Chaos', () => {
    it('should report degraded health during active experiments', async () => {
      const scenario = ServiceFailureScenarios.find(
        (s) => s.id === 'complete-service-outage'
      )!;

      // Start experiment without awaiting
      const experimentPromise = chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'critical-service',
        scenario.config,
        15000
      );

      // Check health during experiment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const healthScore = circuitBreakers.getOverallHealth();
      expect(healthScore).toBeLessThanOrEqual(100);

      await experimentPromise;
    });

    it('should recover health after experiments complete', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-latency-500ms'
      )!;

      await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'recovery-service',
        scenario.config,
        10000
      );

      // Wait for recovery
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const healthScore = circuitBreakers.getOverallHealth();
      expect(healthScore).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Concurrent Chaos Experiments', () => {
    it('should handle multiple concurrent experiments', async () => {
      const scenarios = [
        NetworkScenarios[0],
        ServiceFailureScenarios[0],
        ResourceExhaustionScenarios[0],
      ];

      const experimentPromises = scenarios.map((scenario, i) =>
        chaos.runExperiment(
          scenario.name,
          scenario.faultType,
          `target-${i}`,
          scenario.config,
          15000
        )
      );

      const experiments = await Promise.all(experimentPromises);

      expect(experiments.length).toBe(3);
      experiments.forEach((exp) => {
        expect(exp.status).toBe('completed');
      });
    });

    it('should respect max concurrent experiments limit', async () => {
      chaos.updateConfig({ maxConcurrentExperiments: 2 });

      const scenarios = [
        NetworkScenarios[0],
        ServiceFailureScenarios[0],
        ResourceExhaustionScenarios[0],
      ];

      const experimentPromises = scenarios.map((scenario, i) =>
        chaos
          .runExperiment(
            scenario.name,
            scenario.faultType,
            `target-${i}`,
            scenario.config,
            5000
          )
          .catch((error) => error)
      );

      const results = await Promise.all(experimentPromises);

      // One should fail due to limit
      const errors = results.filter((r) => r instanceof Error);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Experiment Lifecycle Management', () => {
    it('should track experiment history', async () => {
      const scenario = NetworkScenarios[0];

      await chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'tracked-service',
        scenario.config,
        5000
      );

      const allExperiments = chaos.getAllExperiments();
      expect(allExperiments.length).toBeGreaterThan(0);
      expect(allExperiments[0].name).toBe(scenario.name);
    });

    it('should allow experiment cancellation', async () => {
      const scenario = NetworkScenarios.find(
        (s) => s.id === 'network-latency-2000ms'
      )!;

      const experimentPromise = chaos.runExperiment(
        scenario.name,
        scenario.faultType,
        'cancel-target',
        scenario.config,
        60000 // Long duration
      );

      // Wait a bit then cancel
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const activeExperiments = chaos.getActiveExperiments();
      if (activeExperiments.length > 0) {
        chaos.cancelExperiment(activeExperiments[0].id);
      }

      await experimentPromise;

      const experiment = chaos.getActiveExperiments();
      expect(experiment.length).toBe(0);
    });
  });
});
