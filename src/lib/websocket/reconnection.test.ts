/**
 * Reconnection Logic Tests
 *
 * Comprehensive test suite for exponential backoff and reconnection strategies.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateBackoffDelay,
  shouldReconnect,
  createReconnectionState,
  advanceReconnectionState,
  resetReconnectionState,
  ReconnectionManager,
  DEFAULT_RECONNECTION_CONFIG,
  type ReconnectionConfig,
} from './reconnection';

describe('Reconnection Logic', () => {
  describe('calculateBackoffDelay', () => {
    it('should return initial delay for first attempt', () => {
      const delay = calculateBackoffDelay(0, {
        ...DEFAULT_RECONNECTION_CONFIG,
        useJitter: false,
      });
      expect(delay).toBe(1000);
    });

    it('should double delay with exponential backoff', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        useJitter: false,
      };

      expect(calculateBackoffDelay(0, config)).toBe(1000); // 1s
      expect(calculateBackoffDelay(1, config)).toBe(2000); // 2s
      expect(calculateBackoffDelay(2, config)).toBe(4000); // 4s
      expect(calculateBackoffDelay(3, config)).toBe(8000); // 8s
    });

    it('should cap at max delay', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        useJitter: false,
        maxDelay: 10000,
      };

      expect(calculateBackoffDelay(10, config)).toBe(10000);
      expect(calculateBackoffDelay(100, config)).toBe(10000);
    });

    it('should add jitter when enabled', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        useJitter: true,
        jitterFactor: 0.3,
      };

      const delay = calculateBackoffDelay(1, config);
      const baseDelay = 2000;
      const maxJitter = baseDelay * 0.3;

      expect(delay).toBeGreaterThanOrEqual(baseDelay);
      expect(delay).toBeLessThanOrEqual(baseDelay + maxJitter);
    });

    it('should use custom backoff multiplier', () => {
      const config: ReconnectionConfig = {
        ...DEFAULT_RECONNECTION_CONFIG,
        useJitter: false,
        backoffMultiplier: 3,
      };

      expect(calculateBackoffDelay(0, config)).toBe(1000); // 1s
      expect(calculateBackoffDelay(1, config)).toBe(3000); // 3s
      expect(calculateBackoffDelay(2, config)).toBe(9000); // 9s
    });
  });

  describe('shouldReconnect', () => {
    it('should allow unlimited attempts when maxAttempts is 0', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        maxAttempts: 0,
      };

      expect(shouldReconnect(0, config)).toBe(true);
      expect(shouldReconnect(100, config)).toBe(true);
      expect(shouldReconnect(1000, config)).toBe(true);
    });

    it('should respect maxAttempts limit', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        maxAttempts: 5,
      };

      expect(shouldReconnect(0, config)).toBe(true);
      expect(shouldReconnect(4, config)).toBe(true);
      expect(shouldReconnect(5, config)).toBe(false);
      expect(shouldReconnect(6, config)).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should create initial state correctly', () => {
      const state = createReconnectionState();

      expect(state.attempt).toBe(0);
      expect(state.nextDelay).toBe(1000);
      expect(state.shouldStop).toBe(false);
      expect(state.lastError).toBeUndefined();
    });

    it('should advance state on failure', () => {
      const initialState = createReconnectionState();
      const error = new Error('Connection failed');

      const nextState = advanceReconnectionState(initialState, DEFAULT_RECONNECTION_CONFIG, error);

      expect(nextState.attempt).toBe(1);
      expect(nextState.lastError).toBe(error);
      expect(nextState.shouldStop).toBe(false);
    });

    it('should set shouldStop when max attempts reached', () => {
      const config = {
        ...DEFAULT_RECONNECTION_CONFIG,
        maxAttempts: 3,
      };

      let state = createReconnectionState(config);

      // Attempt 1
      state = advanceReconnectionState(state, config);
      expect(state.shouldStop).toBe(false);

      // Attempt 2
      state = advanceReconnectionState(state, config);
      expect(state.shouldStop).toBe(false);

      // Attempt 3 - should stop
      state = advanceReconnectionState(state, config);
      expect(state.shouldStop).toBe(true);
    });

    it('should reset state after successful connection', () => {
      const config = DEFAULT_RECONNECTION_CONFIG;
      let state = createReconnectionState(config);

      // Advance a few times
      state = advanceReconnectionState(state, config);
      state = advanceReconnectionState(state, config);
      expect(state.attempt).toBe(2);

      // Reset
      state = resetReconnectionState(config);
      expect(state.attempt).toBe(0);
      expect(state.shouldStop).toBe(false);
      expect(state.lastError).toBeUndefined();
    });
  });

  describe('ReconnectionManager', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should schedule reconnection with correct delay', () => {
      const manager = new ReconnectionManager({
        initialDelay: 1000,
        useJitter: false,
      });

      const onReconnect = vi.fn();
      manager.start(onReconnect);

      // Should not call immediately
      expect(onReconnect).not.toHaveBeenCalled();

      // Should call after initial delay
      vi.advanceTimersByTime(1000);
      expect(onReconnect).toHaveBeenCalledTimes(1);
    });

    it('should increase delay on subsequent failures', () => {
      const manager = new ReconnectionManager({
        initialDelay: 1000,
        backoffMultiplier: 2,
        useJitter: false,
      });

      const onReconnect = vi.fn();
      manager.start(onReconnect);

      // First attempt at 1s
      vi.advanceTimersByTime(1000);
      expect(onReconnect).toHaveBeenCalledTimes(1);

      // Record failure and schedule next
      manager.recordFailure();

      // Second attempt at 2s
      vi.advanceTimersByTime(2000);
      expect(onReconnect).toHaveBeenCalledTimes(2);

      // Record failure and schedule next
      manager.recordFailure();

      // Third attempt at 4s
      vi.advanceTimersByTime(4000);
      expect(onReconnect).toHaveBeenCalledTimes(3);
    });

    it('should stop reconnection when stopped', () => {
      const manager = new ReconnectionManager({
        initialDelay: 1000,
      });

      const onReconnect = vi.fn();
      manager.start(onReconnect);

      manager.stop();

      // Should not call after stopping
      vi.advanceTimersByTime(10000);
      expect(onReconnect).not.toHaveBeenCalled();
    });

    it('should call onFailure when max attempts reached', () => {
      const manager = new ReconnectionManager({
        initialDelay: 100,
        maxAttempts: 2,
        useJitter: false,
      });

      const onReconnect = vi.fn();
      const onFailure = vi.fn();

      manager.start(onReconnect, onFailure);

      // First attempt
      vi.advanceTimersByTime(100);
      manager.recordFailure(new Error('Attempt 1 failed'));

      // Second attempt
      vi.advanceTimersByTime(200);
      manager.recordFailure(new Error('Attempt 2 failed'));

      // Should call onFailure
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reset state on success', () => {
      const manager = new ReconnectionManager({
        initialDelay: 1000,
        useJitter: false,
      });

      const onReconnect = vi.fn();
      manager.start(onReconnect);

      // First attempt
      vi.advanceTimersByTime(1000);
      manager.recordFailure();

      // Record success
      manager.recordSuccess();

      const state = manager.getState();
      expect(state.attempt).toBe(0);
      expect(state.shouldStop).toBe(true); // Stopped after success
    });

    it('should provide current state', () => {
      const manager = new ReconnectionManager();

      const state = manager.getState();
      expect(state).toHaveProperty('attempt');
      expect(state).toHaveProperty('nextDelay');
      expect(state).toHaveProperty('shouldStop');
    });
  });
});
