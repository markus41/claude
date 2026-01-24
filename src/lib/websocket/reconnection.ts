/**
 * WebSocket Reconnection Strategy
 *
 * Implements exponential backoff with jitter for robust connection recovery.
 * Pure functions for easy testing and predictable behavior.
 *
 * Best for: Resilient WebSocket connections that gracefully handle network failures
 * with intelligent retry patterns and circuit breaker logic.
 */

/**
 * Reconnection configuration
 */
export interface ReconnectionConfig {
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (typically 2 for exponential) */
  backoffMultiplier: number;
  /** Maximum number of reconnection attempts (0 for unlimited) */
  maxAttempts: number;
  /** Whether to add random jitter to prevent thundering herd */
  useJitter: boolean;
  /** Jitter factor (0-1, recommended 0.3) */
  jitterFactor: number;
}

/**
 * Default reconnection configuration
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  maxAttempts: 0, // unlimited
  useJitter: true,
  jitterFactor: 0.3,
};

/**
 * Reconnection state
 */
export interface ReconnectionState {
  /** Current attempt number (0-based) */
  attempt: number;
  /** Next scheduled delay in milliseconds */
  nextDelay: number;
  /** Whether reconnection should stop */
  shouldStop: boolean;
  /** Last error encountered */
  lastError?: Error;
}

/**
 * Calculate next reconnection delay with exponential backoff
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Reconnection configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): number {
  // Base delay with exponential backoff
  const baseDelay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );

  // Add jitter to prevent thundering herd
  if (config.useJitter) {
    const jitter = baseDelay * config.jitterFactor * Math.random();
    return Math.floor(baseDelay + jitter);
  }

  return Math.floor(baseDelay);
}

/**
 * Determine if reconnection should continue
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Reconnection configuration
 * @returns True if should continue reconnecting
 */
export function shouldReconnect(
  attempt: number,
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): boolean {
  // Check max attempts (0 means unlimited)
  if (config.maxAttempts > 0 && attempt >= config.maxAttempts) {
    return false;
  }

  return true;
}

/**
 * Create initial reconnection state
 *
 * @param config - Reconnection configuration
 * @returns Initial state
 */
export function createReconnectionState(
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): ReconnectionState {
  return {
    attempt: 0,
    nextDelay: config.initialDelay,
    shouldStop: false,
  };
}

/**
 * Advance reconnection state to next attempt
 *
 * @param state - Current state
 * @param config - Reconnection configuration
 * @param error - Optional error from failed attempt
 * @returns Updated state
 */
export function advanceReconnectionState(
  state: ReconnectionState,
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG,
  error?: Error
): ReconnectionState {
  const nextAttempt = state.attempt + 1;
  const shouldContinue = shouldReconnect(nextAttempt, config);

  return {
    attempt: nextAttempt,
    nextDelay: calculateBackoffDelay(nextAttempt, config),
    shouldStop: !shouldContinue,
    lastError: error,
  };
}

/**
 * Reset reconnection state after successful connection
 *
 * @param config - Reconnection configuration
 * @returns Reset state
 */
export function resetReconnectionState(
  config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG
): ReconnectionState {
  return createReconnectionState(config);
}

/**
 * Reconnection manager with circuit breaker pattern
 */
export class ReconnectionManager {
  private state: ReconnectionState;
  private config: ReconnectionConfig;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private onReconnectCallback?: () => void | Promise<void>;
  private onFailureCallback?: (error: Error) => void;

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = { ...DEFAULT_RECONNECTION_CONFIG, ...config };
    this.state = createReconnectionState(this.config);
  }

  /**
   * Start reconnection process
   *
   * @param onReconnect - Callback to attempt reconnection
   * @param onFailure - Callback when max attempts reached
   */
  start(
    onReconnect: () => void | Promise<void>,
    onFailure?: (error: Error) => void
  ): void {
    this.onReconnectCallback = onReconnect;
    this.onFailureCallback = onFailure;
    this.scheduleReconnect();
  }

  /**
   * Stop reconnection process
   */
  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.state = { ...this.state, shouldStop: true };
  }

  /**
   * Record failed reconnection attempt
   *
   * @param error - Error from failed attempt
   */
  recordFailure(error?: Error): void {
    this.state = advanceReconnectionState(this.state, this.config, error);

    if (this.state.shouldStop) {
      const finalError = error || new Error('Max reconnection attempts reached');
      this.onFailureCallback?.(finalError);
    } else {
      this.scheduleReconnect();
    }
  }

  /**
   * Record successful reconnection
   */
  recordSuccess(): void {
    this.state = resetReconnectionState(this.config);
    this.stop();
  }

  /**
   * Get current state
   */
  getState(): Readonly<ReconnectionState> {
    return { ...this.state };
  }

  /**
   * Schedule next reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.state.shouldStop || !this.onReconnectCallback) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.onReconnectCallback?.();
    }, this.state.nextDelay);
  }
}

/**
 * Utility to create delay promise
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 *
 * @param operation - Async operation to retry
 * @param config - Reconnection configuration
 * @returns Promise that resolves with operation result
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<ReconnectionConfig> = {}
): Promise<T> {
  const fullConfig = { ...DEFAULT_RECONNECTION_CONFIG, ...config };
  let state = createReconnectionState(fullConfig);

  while (!state.shouldStop) {
    try {
      return await operation();
    } catch (error) {
      state = advanceReconnectionState(
        state,
        fullConfig,
        error instanceof Error ? error : new Error(String(error))
      );

      if (state.shouldStop) {
        throw state.lastError || error;
      }

      await delay(state.nextDelay);
    }
  }

  throw new Error('Retry failed: should not reach here');
}
