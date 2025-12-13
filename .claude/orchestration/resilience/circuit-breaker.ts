/**
 * Circuit Breaker Implementation
 * Three-state pattern (closed, open, half-open) for fault tolerance
 */

import type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitBreakerMetrics,
  StateTransition,
  CircuitState,
  CircuitBreakerError,
  ResilienceEvent,
  AsyncFunction,
} from './types.js';

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private stateHistory: StateTransition[] = [];
  private responseTimesMs: number[] = [];
  private maxHistorySize = 100;
  private eventHandlers: Array<(event: ResilienceEvent) => void> = [];

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      resetTimeoutOnSuccess: true,
      allowedExceptions: [],
      ...config,
    };

    this.state = {
      name: config.name,
      state: 'closed',
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      lastStateChange: new Date(),
      halfOpenAttempts: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalRequests: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: AsyncFunction<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('half-open', 'Timeout expired, testing recovery');
      } else {
        throw new CircuitBreakerError(this.config.name, 'open');
      }
    }

    // Limit half-open requests
    if (this.state.state === 'half-open') {
      if (this.state.halfOpenAttempts >= this.config.halfOpenRequests) {
        throw new CircuitBreakerError(this.config.name, 'half-open');
      }
      this.state.halfOpenAttempts++;
    }

    this.state.totalRequests++;
    const startTime = Date.now();

    try {
      const result = await fn();
      const responseTime = Date.now() - startTime;
      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.onFailure(error as Error, responseTime);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(responseTimeMs: number): void {
    this.recordResponseTime(responseTimeMs);

    this.state.successes++;
    this.state.totalSuccesses++;
    this.state.consecutiveSuccesses++;
    this.state.consecutiveFailures = 0;
    this.state.lastSuccessTime = new Date();

    // Reset timeout if configured
    if (this.config.resetTimeoutOnSuccess && this.state.nextAttemptTime) {
      this.state.nextAttemptTime = undefined;
    }

    // Transition based on current state
    switch (this.state.state) {
      case 'half-open':
        if (this.state.consecutiveSuccesses >= this.config.successThreshold) {
          this.transitionTo('closed', 'Success threshold met in half-open state');
        }
        break;

      case 'open':
        // Shouldn't happen, but handle gracefully
        this.transitionTo('half-open', 'Unexpected success in open state');
        break;

      case 'closed':
        // Reset failure count if we've had enough consecutive successes
        if (this.state.consecutiveSuccesses >= this.config.successThreshold) {
          this.state.failures = 0;
        }
        break;
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: Error, responseTimeMs: number): void {
    this.recordResponseTime(responseTimeMs);

    // Check if this is an allowed exception
    if (this.isAllowedException(error)) {
      return;
    }

    this.state.failures++;
    this.state.totalFailures++;
    this.state.consecutiveFailures++;
    this.state.consecutiveSuccesses = 0;
    this.state.lastFailureTime = new Date();

    // Transition based on current state
    switch (this.state.state) {
      case 'closed':
        if (this.state.consecutiveFailures >= this.config.failureThreshold) {
          this.transitionTo('open', 'Failure threshold exceeded');
        }
        break;

      case 'half-open':
        // Any failure in half-open state reopens the circuit
        this.transitionTo('open', 'Failed during half-open state');
        break;

      case 'open':
        // Already open, extend the timeout
        this.state.nextAttemptTime = new Date(Date.now() + this.config.timeout);
        break;
    }
  }

  /**
   * Check if error is in allowed exceptions list
   */
  private isAllowedException(error: Error): boolean {
    if (!this.config.allowedExceptions || this.config.allowedExceptions.length === 0) {
      return false;
    }

    return this.config.allowedExceptions.some((allowedType) => {
      return error.name === allowedType || error.constructor.name === allowedType;
    });
  }

  /**
   * Determine if circuit should attempt reset to half-open
   */
  private shouldAttemptReset(): boolean {
    if (!this.state.nextAttemptTime) {
      return false;
    }

    return new Date() >= this.state.nextAttemptTime;
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState, reason: string): void {
    const oldState = this.state.state;

    if (oldState === newState) {
      return;
    }

    const transition: StateTransition = {
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason,
      metrics: {
        failures: this.state.failures,
        successes: this.state.successes,
      },
    };

    this.stateHistory.push(transition);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }

    this.state.state = newState;
    this.state.lastStateChange = new Date();

    // Reset state-specific counters
    switch (newState) {
      case 'open':
        this.state.nextAttemptTime = new Date(Date.now() + this.config.timeout);
        this.state.halfOpenAttempts = 0;
        break;

      case 'half-open':
        this.state.halfOpenAttempts = 0;
        this.state.consecutiveSuccesses = 0;
        break;

      case 'closed':
        this.state.failures = 0;
        this.state.successes = 0;
        this.state.consecutiveFailures = 0;
        this.state.consecutiveSuccesses = 0;
        this.state.halfOpenAttempts = 0;
        this.state.nextAttemptTime = undefined;
        break;
    }

    // Emit state transition event
    this.emitEvent({
      type: this.getEventType(newState),
      timestamp: new Date(),
      component: this.config.name,
      data: transition,
    });
  }

  /**
   * Get event type for state
   */
  private getEventType(state: CircuitState): 'circuit-opened' | 'circuit-closed' | 'circuit-half-open' {
    switch (state) {
      case 'open':
        return 'circuit-opened';
      case 'closed':
        return 'circuit-closed';
      case 'half-open':
        return 'circuit-half-open';
    }
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(timeMs: number): void {
    this.responseTimesMs.push(timeMs);
    if (this.responseTimesMs.length > this.maxHistorySize) {
      this.responseTimesMs.shift();
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const windowRequests = this.state.failures + this.state.successes;
    const successRate = windowRequests > 0 ? this.state.successes / windowRequests : 1;
    const failureRate = windowRequests > 0 ? this.state.failures / windowRequests : 0;

    const avgResponseTime =
      this.responseTimesMs.length > 0
        ? this.responseTimesMs.reduce((a, b) => a + b, 0) / this.responseTimesMs.length
        : 0;

    return {
      name: this.config.name,
      state: this.state.state,
      successRate,
      failureRate,
      totalRequests: this.state.totalRequests,
      requestsInWindow: windowRequests,
      avgResponseTime,
      lastFailure: this.state.lastFailureTime
        ? {
            time: this.state.lastFailureTime,
            error: 'Circuit breaker failure',
          }
        : undefined,
      stateHistory: [...this.stateHistory],
    };
  }

  /**
   * Get state history
   */
  getStateHistory(): StateTransition[] {
    return [...this.stateHistory];
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.transitionTo('closed', 'Manual reset');
  }

  /**
   * Force open the circuit (for testing/manual intervention)
   */
  forceOpen(): void {
    this.transitionTo('open', 'Manual force open');
  }

  /**
   * Subscribe to circuit breaker events
   */
  onEvent(handler: (event: ResilienceEvent) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all handlers
   */
  private emitEvent(event: ResilienceEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in circuit breaker event handler:', error);
      }
    });
  }

  /**
   * Check if circuit is allowing requests
   */
  isAvailable(): boolean {
    if (this.state.state === 'closed') {
      return true;
    }

    if (this.state.state === 'half-open') {
      return this.state.halfOpenAttempts < this.config.halfOpenRequests;
    }

    if (this.state.state === 'open') {
      return this.shouldAttemptReset();
    }

    return false;
  }

  /**
   * Get configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (resets state)
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
    this.reset();
  }

  /**
   * Calculate health score (0-100)
   */
  getHealthScore(): number {
    if (this.state.totalRequests === 0) {
      return 100;
    }

    const successRate = this.state.totalSuccesses / this.state.totalRequests;

    // Penalize based on state
    let stateMultiplier = 1;
    switch (this.state.state) {
      case 'open':
        stateMultiplier = 0.25;
        break;
      case 'half-open':
        stateMultiplier = 0.5;
        break;
      case 'closed':
        stateMultiplier = 1;
        break;
    }

    return Math.round(successRate * stateMultiplier * 100);
  }

  /**
   * Serialize state for persistence
   */
  toJSON(): {
    state: CircuitBreakerState;
    config: CircuitBreakerConfig;
    stateHistory: StateTransition[];
  } {
    return {
      state: this.state,
      config: this.config,
      stateHistory: this.stateHistory,
    };
  }

  /**
   * Restore from persisted state
   */
  static fromJSON(data: {
    state: CircuitBreakerState;
    config: CircuitBreakerConfig;
    stateHistory: StateTransition[];
  }): CircuitBreaker {
    const breaker = new CircuitBreaker(data.config);
    breaker.state = data.state;
    breaker.stateHistory = data.stateHistory;
    return breaker;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers and provides centralized access
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: Partial<CircuitBreakerConfig> = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitorWindow: 60000,
    halfOpenRequests: 3,
  };

  /**
   * Create or get a circuit breaker
   */
  getOrCreate(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      return this.breakers.get(name)!;
    }

    const fullConfig: CircuitBreakerConfig = {
      name,
      ...this.defaultConfig,
      ...config,
    } as CircuitBreakerConfig;

    const breaker = new CircuitBreaker(fullConfig);
    this.breakers.set(name, breaker);
    return breaker;
  }

  /**
   * Get existing circuit breaker
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Remove circuit breaker
   */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.breakers.values()).map((breaker) =>
      breaker.getMetrics()
    );
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * Get overall health score
   */
  getOverallHealth(): number {
    if (this.breakers.size === 0) {
      return 100;
    }

    const scores = Array.from(this.breakers.values()).map((breaker) =>
      breaker.getHealthScore()
    );

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  /**
   * Get count by state
   */
  getStateCount(): Record<CircuitState, number> {
    const counts: Record<CircuitState, number> = {
      closed: 0,
      open: 0,
      'half-open': 0,
    };

    this.breakers.forEach((breaker) => {
      const state = breaker.getState().state;
      counts[state]++;
    });

    return counts;
  }

  /**
   * Clear all circuit breakers
   */
  clear(): void {
    this.breakers.clear();
  }

  /**
   * Set default configuration
   */
  setDefaultConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}
