/**
 * Circuit Breaker Tests
 * Comprehensive test suite for circuit breaker functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerManager } from '../circuit-breaker.js';
import type { CircuitBreakerConfig } from '../types.js';

describe('CircuitBreaker', () => {
  let config: CircuitBreakerConfig;
  let breaker: CircuitBreaker;

  beforeEach(() => {
    config = {
      name: 'test-breaker',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitorWindow: 60000,
      halfOpenRequests: 2,
    };
    breaker = new CircuitBreaker(config);
  });

  describe('State Transitions', () => {
    it('should start in closed state', () => {
      const state = breaker.getState();
      expect(state.state).toBe('closed');
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
    });

    it('should transition to open after failure threshold', async () => {
      const failingFn = async () => {
        throw new Error('Test failure');
      };

      // Execute until circuit opens
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      const state = breaker.getState();
      expect(state.state).toBe('open');
      expect(state.consecutiveFailures).toBe(3);
    });

    it('should reject requests when open', async () => {
      const failingFn = async () => {
        throw new Error('Test failure');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      // Try to execute when open
      await expect(async () => {
        await breaker.execute(async () => 'success');
      }).rejects.toThrow("Circuit breaker 'test-breaker' is open");
    });

    it('should transition to half-open after timeout', async () => {
      const failingFn = async () => {
        throw new Error('Test failure');
      };

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next execution should transition to half-open
      try {
        await breaker.execute(async () => 'success');
      } catch (error) {
        // May fail, but should transition
      }

      const state = breaker.getState();
      expect(state.state).toBe('half-open');
    });

    it('should close from half-open after success threshold', async () => {
      // Open the circuit
      const failingFn = async () => {
        throw new Error('Test failure');
      };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(failingFn);
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Execute successful requests in half-open state
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => 'success');
      }

      const state = breaker.getState();
      expect(state.state).toBe('closed');
    });
  });

  describe('Success Tracking', () => {
    it('should track successful executions', async () => {
      await breaker.execute(async () => 'result');

      const state = breaker.getState();
      expect(state.totalSuccesses).toBe(1);
      expect(state.consecutiveSuccesses).toBe(1);
    });

    it('should reset consecutive failures on success', async () => {
      // Fail once
      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch (error) {
        // Expected
      }

      // Succeed
      await breaker.execute(async () => 'success');

      const state = breaker.getState();
      expect(state.consecutiveFailures).toBe(0);
      expect(state.consecutiveSuccesses).toBe(1);
    });
  });

  describe('Metrics', () => {
    it('should calculate success rate correctly', async () => {
      // 2 successes, 1 failure
      await breaker.execute(async () => 'success');
      await breaker.execute(async () => 'success');

      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch (error) {
        // Expected
      }

      const metrics = breaker.getMetrics();
      expect(metrics.successRate).toBeCloseTo(2 / 3);
      expect(metrics.failureRate).toBeCloseTo(1 / 3);
      expect(metrics.totalRequests).toBe(3);
    });

    it('should track response times', async () => {
      await breaker.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'result';
      });

      const metrics = breaker.getMetrics();
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Health Score', () => {
    it('should return 100 for healthy closed circuit', () => {
      expect(breaker.getHealthScore()).toBe(100);
    });

    it('should return lower score for open circuit', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch (error) {
          // Expected
        }
      }

      const score = breaker.getHealthScore();
      expect(score).toBeLessThan(50);
    });
  });

  describe('Manual Control', () => {
    it('should allow manual reset', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      breaker.reset();

      expect(breaker.getState().state).toBe('closed');
      expect(breaker.getState().failures).toBe(0);
    });

    it('should allow manual force open', () => {
      breaker.forceOpen();

      expect(breaker.getState().state).toBe('open');
    });
  });

  describe('Event Handling', () => {
    it('should emit events on state transitions', async () => {
      const events: any[] = [];
      breaker.onEvent((event) => events.push(event));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch (error) {
          // Expected
        }
      }

      const openEvent = events.find((e) => e.type === 'circuit-opened');
      expect(openEvent).toBeDefined();
      expect(openEvent.component).toBe('test-breaker');
    });
  });

  describe('Configuration Updates', () => {
    it('should allow config updates', () => {
      breaker.updateConfig({ failureThreshold: 5 });

      const updatedConfig = breaker.getConfig();
      expect(updatedConfig.failureThreshold).toBe(5);
    });

    it('should reset state when config updated', async () => {
      // Add some failures
      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch (error) {
        // Expected
      }

      breaker.updateConfig({ failureThreshold: 5 });

      const state = breaker.getState();
      expect(state.failures).toBe(0);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  it('should create circuit breakers on demand', () => {
    const breaker = manager.getOrCreate('test');

    expect(breaker).toBeDefined();
    expect(breaker.getConfig().name).toBe('test');
  });

  it('should return existing breaker', () => {
    const breaker1 = manager.getOrCreate('test');
    const breaker2 = manager.getOrCreate('test');

    expect(breaker1).toBe(breaker2);
  });

  it('should get all breakers', () => {
    manager.getOrCreate('test1');
    manager.getOrCreate('test2');

    const all = manager.getAll();
    expect(all.size).toBe(2);
  });

  it('should get all metrics', async () => {
    const breaker = manager.getOrCreate('test');
    await breaker.execute(async () => 'success');

    const metrics = manager.getAllMetrics();
    expect(metrics.length).toBe(1);
    expect(metrics[0].name).toBe('test');
  });

  it('should calculate overall health', async () => {
    const breaker1 = manager.getOrCreate('test1');
    const breaker2 = manager.getOrCreate('test2');

    // breaker1 succeeds
    await breaker1.execute(async () => 'success');

    // breaker2 fails and opens
    for (let i = 0; i < 3; i++) {
      try {
        await breaker2.execute(async () => {
          throw new Error('Fail');
        });
      } catch (error) {
        // Expected
      }
    }

    const health = manager.getOverallHealth();
    expect(health).toBeLessThan(100);
    expect(health).toBeGreaterThan(0);
  });

  it('should get state counts', async () => {
    const breaker1 = manager.getOrCreate('test1');
    const breaker2 = manager.getOrCreate('test2');

    // Open breaker2
    for (let i = 0; i < 3; i++) {
      try {
        await breaker2.execute(async () => {
          throw new Error('Fail');
        });
      } catch (error) {
        // Expected
      }
    }

    const counts = manager.getStateCount();
    expect(counts.closed).toBe(1);
    expect(counts.open).toBe(1);
    expect(counts['half-open']).toBe(0);
  });

  it('should reset all breakers', async () => {
    const breaker1 = manager.getOrCreate('test1');
    const breaker2 = manager.getOrCreate('test2');

    // Add some failures
    try {
      await breaker1.execute(async () => {
        throw new Error('Fail');
      });
    } catch (error) {
      // Expected
    }

    manager.resetAll();

    expect(breaker1.getState().failures).toBe(0);
    expect(breaker2.getState().failures).toBe(0);
  });

  it('should remove breakers', () => {
    manager.getOrCreate('test');
    const removed = manager.remove('test');

    expect(removed).toBe(true);
    expect(manager.get('test')).toBeUndefined();
  });

  it('should set default config', () => {
    manager.setDefaultConfig({ failureThreshold: 10 });

    const breaker = manager.getOrCreate('test');
    expect(breaker.getConfig().failureThreshold).toBe(10);
  });
});
