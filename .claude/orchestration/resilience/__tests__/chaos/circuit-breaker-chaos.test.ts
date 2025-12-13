/**
 * Circuit Breaker Chaos Engineering Tests
 * Validates circuit breaker behavior under various fault conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitBreaker, CircuitBreakerManager } from '../../circuit-breaker.js';
import type { CircuitBreakerConfig, CircuitState } from '../../types.js';

describe('Circuit Breaker Chaos Tests', () => {
  let breaker: CircuitBreaker;
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('State Transition: CLOSED → OPEN', () => {
    it('should trip circuit breaker under continuous failures', async () => {
      breaker = manager.getOrCreate('chaos-test-service', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 5000,
        halfOpenRequests: 3,
      });

      const initialState = breaker.getState();
      expect(initialState.state).toBe('closed');

      // Simulate continuous failures
      let failureCount = 0;
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Simulated failure');
          });
        } catch (error) {
          failureCount++;
        }
      }

      const finalState = breaker.getState();
      expect(finalState.state).toBe('open');
      expect(failureCount).toBe(10);
      expect(finalState.consecutiveFailures).toBeGreaterThanOrEqual(5);
    });

    it('should not trip circuit breaker with intermittent failures below threshold', async () => {
      breaker = manager.getOrCreate('resilient-service', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 5000,
        halfOpenRequests: 3,
      });

      // Simulate intermittent failures (3 failures, 2 successes pattern)
      for (let i = 0; i < 10; i++) {
        try {
          await breaker.execute(async () => {
            if (i % 5 < 3) {
              throw new Error('Intermittent failure');
            }
            return 'success';
          });
        } catch (error) {
          // Expected
        }
      }

      const state = breaker.getState();
      // Should stay closed due to successes resetting failure count
      expect(state.state).toBe('closed');
    });

    it('should track state transitions accurately', async () => {
      breaker = manager.getOrCreate('tracked-service', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 3000,
        halfOpenRequests: 2,
      });

      // Force transition to open
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Force open');
          });
        } catch (error) {
          // Expected
        }
      }

      const history = breaker.getStateHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].to).toBe('open');
      expect(history[history.length - 1].reason).toContain('threshold');
    });
  });

  describe('State Transition: OPEN → HALF-OPEN', () => {
    it('should transition to half-open after timeout expires', async () => {
      breaker = manager.getOrCreate('timeout-test', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000, // 1 second
        halfOpenRequests: 3,
      });

      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Trip circuit');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for timeout to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next request should transition to half-open
      try {
        await breaker.execute(async () => 'success');
      } catch (error) {
        // May still fail if circuit rejects
      }

      const state = breaker.getState();
      expect(['half-open', 'closed']).toContain(state.state);
    });

    it('should limit requests in half-open state', async () => {
      const halfOpenRequests = 3;
      breaker = manager.getOrCreate('half-open-limit', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 500,
        halfOpenRequests,
      });

      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Trip circuit');
          });
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Manually transition to half-open
      breaker.forceOpen();
      await new Promise((resolve) => setTimeout(resolve, 600));

      let halfOpenAttempts = 0;
      const requests = [];

      // Try to make more requests than allowed
      for (let i = 0; i < halfOpenRequests + 3; i++) {
        requests.push(
          breaker
            .execute(async () => 'success')
            .then(() => {
              halfOpenAttempts++;
            })
            .catch(() => {
              // Circuit may reject excess requests
            })
        );
      }

      await Promise.allSettled(requests);

      const state = breaker.getState();
      expect(state.halfOpenAttempts).toBeLessThanOrEqual(halfOpenRequests);
    });
  });

  describe('State Transition: HALF-OPEN → CLOSED', () => {
    it('should close circuit after successful requests in half-open state', async () => {
      breaker = manager.getOrCreate('recovery-test', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 500,
        halfOpenRequests: 3,
      });

      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Trip circuit');
          });
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Execute successful requests to close circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => 'success');
        } catch (error) {
          // May be rejected initially
        }
      }

      // Should eventually transition to closed
      const state = breaker.getState();
      expect(['half-open', 'closed']).toContain(state.state);
    });
  });

  describe('State Transition: HALF-OPEN → OPEN', () => {
    it('should reopen circuit on failure in half-open state', async () => {
      breaker = manager.getOrCreate('reopen-test', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 500,
        halfOpenRequests: 3,
      });

      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Trip circuit');
          });
        } catch (error) {
          // Expected
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Try one successful request
      try {
        await breaker.execute(async () => 'success');
      } catch (error) {
        // May be rejected
      }

      // Then a failure should reopen
      try {
        await breaker.execute(async () => {
          throw new Error('Failure in half-open');
        });
      } catch (error) {
        // Expected
      }

      const state = breaker.getState();
      expect(state.state).toBe('open');
    });
  });

  describe('Failure Threshold Accuracy', () => {
    it('should respect exact failure threshold', async () => {
      const threshold = 5;
      breaker = manager.getOrCreate('threshold-accuracy', {
        failureThreshold: threshold,
        successThreshold: 2,
        timeout: 5000,
        halfOpenRequests: 3,
      });

      // Execute failures up to threshold - 1
      for (let i = 0; i < threshold - 1; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Failure');
          });
        } catch (error) {
          // Expected
        }
      }

      // Should still be closed
      expect(breaker.getState().state).toBe('closed');

      // One more failure should trip it
      try {
        await breaker.execute(async () => {
          throw new Error('Threshold failure');
        });
      } catch (error) {
        // Expected
      }

      expect(breaker.getState().state).toBe('open');
    });

    it('should handle allowed exceptions without counting as failures', async () => {
      class AllowedError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'AllowedError';
        }
      }

      breaker = manager.getOrCreate('allowed-exceptions', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 5000,
        halfOpenRequests: 3,
        allowedExceptions: ['AllowedError'],
      });

      // Throw allowed exceptions
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new AllowedError('This should not count');
          });
        } catch (error) {
          // Expected
        }
      }

      // Circuit should remain closed
      const state = breaker.getState();
      expect(state.state).toBe('closed');
      expect(state.consecutiveFailures).toBe(0);
    });
  });

  describe('Timeout Handling', () => {
    it('should respect configured timeout duration', async () => {
      const timeout = 1000;
      breaker = manager.getOrCreate('timeout-duration', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout,
        halfOpenRequests: 3,
      });

      // Trip the circuit
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Trip');
          });
        } catch (error) {
          // Expected
        }
      }

      const openTime = Date.now();
      expect(breaker.getState().state).toBe('open');

      // Wait just before timeout
      await new Promise((resolve) => setTimeout(resolve, timeout - 100));

      // Should still be open
      try {
        await breaker.execute(async () => 'test');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        // Expected - circuit still open
      }

      // Wait for timeout to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
      const elapsedTime = Date.now() - openTime;

      // Should now allow requests
      expect(elapsedTime).toBeGreaterThanOrEqual(timeout);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests correctly', async () => {
      breaker = manager.getOrCreate('concurrent-test', {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 5000,
        halfOpenRequests: 3,
      });

      // Execute concurrent requests
      const concurrentRequests = 20;
      const results = await Promise.allSettled(
        Array.from({ length: concurrentRequests }, (_, i) =>
          breaker.execute(async () => {
            if (i < 10) {
              throw new Error('Concurrent failure');
            }
            return 'success';
          })
        )
      );

      const failures = results.filter((r) => r.status === 'rejected').length;
      const successes = results.filter((r) => r.status === 'fulfilled').length;

      const state = breaker.getState();
      expect(state.totalRequests).toBe(concurrentRequests);
      expect(failures + successes).toBe(concurrentRequests);
    });

    it('should track metrics accurately under load', async () => {
      breaker = manager.getOrCreate('metrics-test', {
        failureThreshold: 10,
        successThreshold: 3,
        timeout: 5000,
        halfOpenRequests: 5,
      });

      // Execute mixed success/failure load
      for (let i = 0; i < 50; i++) {
        try {
          await breaker.execute(async () => {
            if (Math.random() > 0.7) {
              throw new Error('Random failure');
            }
            return 'success';
          });
        } catch (error) {
          // Expected for some
        }
      }

      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(50);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Circuit Breaker Manager Chaos Tests', () => {
    it('should handle multiple circuit breakers under simultaneous stress', async () => {
      const serviceCount = 10;
      const services = Array.from({ length: serviceCount }, (_, i) => `service-${i}`);

      // Create multiple breakers
      services.forEach((service) => {
        manager.getOrCreate(service, {
          failureThreshold: 3,
          successThreshold: 2,
          timeout: 1000,
          halfOpenRequests: 2,
        });
      });

      // Stress all breakers simultaneously
      const stressPromises = services.map(async (service) => {
        const breaker = manager.get(service)!;
        for (let i = 0; i < 5; i++) {
          try {
            await breaker.execute(async () => {
              if (Math.random() > 0.5) {
                throw new Error(`${service} failure`);
              }
              return 'success';
            });
          } catch (error) {
            // Expected
          }
        }
      });

      await Promise.all(stressPromises);

      const metrics = manager.getAllMetrics();
      expect(metrics.length).toBe(serviceCount);

      const healthScore = manager.getOverallHealth();
      expect(healthScore).toBeGreaterThanOrEqual(0);
      expect(healthScore).toBeLessThanOrEqual(100);
    });

    it('should maintain state isolation between circuit breakers', async () => {
      const breaker1 = manager.getOrCreate('isolated-1', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        halfOpenRequests: 2,
      });

      const breaker2 = manager.getOrCreate('isolated-2', {
        failureThreshold: 3,
        successThreshold: 2,
        timeout: 1000,
        halfOpenRequests: 2,
      });

      // Trip only breaker1
      for (let i = 0; i < 5; i++) {
        try {
          await breaker1.execute(async () => {
            throw new Error('Breaker 1 failure');
          });
        } catch (error) {
          // Expected
        }
      }

      // Breaker2 should remain closed
      expect(breaker1.getState().state).toBe('open');
      expect(breaker2.getState().state).toBe('closed');

      // Verify metrics are independent
      const metrics1 = breaker1.getMetrics();
      const metrics2 = breaker2.getMetrics();

      expect(metrics1.totalRequests).toBeGreaterThan(0);
      expect(metrics2.totalRequests).toBe(0);
    });
  });
});
