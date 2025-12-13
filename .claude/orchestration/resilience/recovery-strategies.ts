/**
 * Recovery Strategies Implementation
 * Retry, fallback, restore, and escalation strategies for self-healing
 */

import type {
  RecoveryStrategy,
  RetryStrategy,
  FallbackStrategy,
  RestoreStrategy,
  EscalationStrategy,
  RecoveryAttempt,
  RecoveryResult,
  BackoffStrategy,
  FallbackProvider,
  AsyncFunction,
} from './types.js';

/**
 * Calculate backoff delay
 */
function calculateBackoff(
  attemptNumber: number,
  strategy: BackoffStrategy,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitterFactor: number = 0
): number {
  let delay: number;

  switch (strategy) {
    case 'constant':
      delay = initialDelay;
      break;

    case 'linear':
      delay = initialDelay * attemptNumber;
      break;

    case 'exponential':
      delay = initialDelay * Math.pow(multiplier, attemptNumber - 1);
      break;

    case 'jittered':
      delay = initialDelay * Math.pow(multiplier, attemptNumber - 1);
      const jitter = delay * jitterFactor * Math.random();
      delay = delay + jitter;
      break;

    default:
      delay = initialDelay;
  }

  return Math.min(delay, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: Error, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    return true; // Retry all errors by default
  }

  return retryableErrors.some((pattern) => {
    return (
      error.name === pattern ||
      error.message.includes(pattern) ||
      error.constructor.name === pattern
    );
  });
}

/**
 * Retry Strategy Implementation
 */
export class RetryRecovery {
  private strategy: RetryStrategy;

  constructor(strategy: RetryStrategy) {
    this.strategy = {
      jitterFactor: 0.1,
      respectCircuitBreaker: true,
      ...strategy,
    };
  }

  /**
   * Execute with retry logic
   */
  async execute<T>(fn: AsyncFunction<T>): Promise<RecoveryResult<T>> {
    const attempts: RecoveryAttempt[] = [];
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.strategy.maxAttempts; attempt++) {
      const attemptId = `${this.strategy.name}-${Date.now()}-${attempt}`;
      const attemptStart = Date.now();

      try {
        const result = await this.executeWithTimeout(fn);

        attempts.push({
          id: attemptId,
          strategyName: this.strategy.name,
          attemptNumber: attempt,
          startedAt: new Date(attemptStart),
          completedAt: new Date(),
          success: true,
          durationMs: Date.now() - attemptStart,
        });

        return {
          success: true,
          result,
          strategy: this.strategy.name,
          attempts,
          totalDurationMs: Date.now() - startTime,
          finalState: 'recovered',
        };
      } catch (error) {
        const attemptError = error as Error;

        // Calculate next attempt time
        let nextAttemptAt: Date | undefined;
        if (attempt < this.strategy.maxAttempts) {
          const delay = calculateBackoff(
            attempt,
            this.strategy.backoffStrategy,
            this.strategy.initialDelay,
            this.strategy.maxDelay,
            this.strategy.backoffMultiplier,
            this.strategy.jitterFactor
          );
          nextAttemptAt = new Date(Date.now() + delay);
        }

        attempts.push({
          id: attemptId,
          strategyName: this.strategy.name,
          attemptNumber: attempt,
          startedAt: new Date(attemptStart),
          completedAt: new Date(),
          success: false,
          error: attemptError.message,
          durationMs: Date.now() - attemptStart,
          nextAttemptAt,
        });

        // Check if error is retryable
        if (!isRetryableError(attemptError, this.strategy.retryableErrors)) {
          return {
            success: false,
            error: attemptError,
            strategy: this.strategy.name,
            attempts,
            totalDurationMs: Date.now() - startTime,
            finalState: 'failed',
          };
        }

        // Wait before next attempt
        if (attempt < this.strategy.maxAttempts && nextAttemptAt) {
          const delay = nextAttemptAt.getTime() - Date.now();
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All attempts exhausted
    const lastAttempt = attempts[attempts.length - 1];
    return {
      success: false,
      error: new Error(lastAttempt.error || 'All retry attempts exhausted'),
      strategy: this.strategy.name,
      attempts,
      totalDurationMs: Date.now() - startTime,
      finalState: this.strategy.onExhausted === 'escalate' ? 'escalated' : 'failed',
    };
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(fn: AsyncFunction<T>): Promise<T> {
    if (!this.strategy.timeout) {
      return await fn();
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Retry attempt timeout')),
        this.strategy.timeout
      )
    );

    return await Promise.race([fn(), timeoutPromise]);
  }

  getStrategy(): RetryStrategy {
    return { ...this.strategy };
  }
}

/**
 * Fallback Strategy Implementation
 */
export class FallbackRecovery {
  private strategy: FallbackStrategy;

  constructor(strategy: FallbackStrategy) {
    this.strategy = strategy;
  }

  /**
   * Execute with fallback chain
   */
  async execute<T>(primaryFn: AsyncFunction<T>): Promise<RecoveryResult<T>> {
    const attempts: RecoveryAttempt[] = [];
    const startTime = Date.now();

    // Try primary function first
    const primaryAttempt = await this.tryFunction(
      'primary',
      primaryFn,
      attempts
    );

    if (primaryAttempt.success && primaryAttempt.result !== undefined) {
      return {
        success: true,
        result: primaryAttempt.result as T,
        strategy: this.strategy.name,
        attempts,
        totalDurationMs: Date.now() - startTime,
        finalState: 'recovered',
      };
    }

    // Try fallback providers
    const sortedProviders = [...this.strategy.fallbackChain].sort(
      (a, b) => a.priority - b.priority
    );

    for (const provider of sortedProviders) {
      // Check if provider can handle the error
      if (
        primaryAttempt.error &&
        provider.canHandle &&
        !provider.canHandle(primaryAttempt.error)
      ) {
        continue;
      }

      const fallbackAttempt = await this.tryFunction(
        provider.name,
        provider.execute,
        attempts,
        provider.timeout
      );

      if (fallbackAttempt.success && fallbackAttempt.result !== undefined) {
        return {
          success: true,
          result: fallbackAttempt.result as T,
          strategy: this.strategy.name,
          attempts,
          totalDurationMs: Date.now() - startTime,
          finalState: 'recovered',
        };
      }

      // Stop cascade if configured
      if (!this.strategy.cascadeOnFailure) {
        break;
      }
    }

    // All fallbacks failed
    return {
      success: false,
      error: primaryAttempt.error || new Error('All fallbacks exhausted'),
      strategy: this.strategy.name,
      attempts,
      totalDurationMs: Date.now() - startTime,
      finalState: this.strategy.onExhausted === 'escalate' ? 'escalated' : 'failed',
    };
  }

  /**
   * Try a function with error handling
   */
  private async tryFunction(
    name: string,
    fn: AsyncFunction<unknown>,
    attempts: RecoveryAttempt[],
    timeout?: number
  ): Promise<{ success: boolean; result?: unknown; error?: Error }> {
    const attemptId = `${this.strategy.name}-${name}-${Date.now()}`;
    const startTime = Date.now();

    try {
      let result: unknown;

      if (timeout) {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${name} timeout`)), timeout)
        );
        result = await Promise.race([fn(), timeoutPromise]);
      } else {
        result = await fn();
      }

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: attempts.length + 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
        metadata: { provider: name },
      });

      return { success: true, result };
    } catch (error) {
      const attemptError = error as Error;

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: attempts.length + 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: false,
        error: attemptError.message,
        durationMs: Date.now() - startTime,
        metadata: { provider: name },
      });

      return { success: false, error: attemptError };
    }
  }

  getStrategy(): FallbackStrategy {
    return { ...this.strategy };
  }
}

/**
 * Restore Strategy Implementation
 */
export class RestoreRecovery {
  private strategy: RestoreStrategy;

  constructor(strategy: RestoreStrategy) {
    this.strategy = strategy;
  }

  /**
   * Execute restore from checkpoint
   */
  async execute<T>(
    restoreFn: (checkpointId?: string, restorePoint?: Date) => Promise<T>,
    validateFn?: (restored: T) => Promise<boolean>
  ): Promise<RecoveryResult<T>> {
    const attempts: RecoveryAttempt[] = [];
    const startTime = Date.now();
    const attemptId = `${this.strategy.name}-${Date.now()}`;

    try {
      const restored = await restoreFn(
        this.strategy.checkpointId,
        this.strategy.restorePoint
      );

      // Validate if required
      if (this.strategy.validateAfterRestore && validateFn) {
        const isValid = await validateFn(restored);
        if (!isValid) {
          throw new Error('Restored state validation failed');
        }
      }

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          checkpointId: this.strategy.checkpointId,
          restorePoint: this.strategy.restorePoint,
        },
      });

      return {
        success: true,
        result: restored,
        strategy: this.strategy.name,
        attempts,
        totalDurationMs: Date.now() - startTime,
        finalState: 'recovered',
      };
    } catch (error) {
      const attemptError = error as Error;

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: false,
        error: attemptError.message,
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        error: attemptError,
        strategy: this.strategy.name,
        attempts,
        totalDurationMs: Date.now() - startTime,
        finalState: this.strategy.onExhausted === 'escalate' ? 'escalated' : 'failed',
      };
    }
  }

  getStrategy(): RestoreStrategy {
    return { ...this.strategy };
  }
}

/**
 * Escalation Strategy Implementation
 */
export class EscalationRecovery {
  private strategy: EscalationStrategy;
  private escalationHandlers = new Map<
    string,
    (message: string, context: unknown) => Promise<void>
  >();

  constructor(strategy: EscalationStrategy) {
    this.strategy = strategy;
  }

  /**
   * Execute escalation
   */
  async execute(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<RecoveryResult<void>> {
    const attempts: RecoveryAttempt[] = [];
    const startTime = Date.now();
    const attemptId = `${this.strategy.name}-${Date.now()}`;

    try {
      // Notify all channels
      await this.notifyChannels(error, context);

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: true,
        durationMs: Date.now() - startTime,
        metadata: {
          level: this.strategy.escalationLevel,
          channels: this.strategy.notificationChannels,
        },
      });

      return {
        success: true,
        strategy: this.strategy.name,
        attempts,
        totalDurationMs: Date.now() - startTime,
        finalState: this.strategy.requiresManualIntervention
          ? 'escalated'
          : 'recovered',
      };
    } catch (escalationError) {
      const attemptError = escalationError as Error;

      attempts.push({
        id: attemptId,
        strategyName: this.strategy.name,
        attemptNumber: 1,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        success: false,
        error: attemptError.message,
        durationMs: Date.now() - startTime,
      });

      return {
        success: false,
        error: attemptError,
        strategy: this.strategy.name,
        attempts,
        totalDurationMs: Date.now() - startTime,
        finalState: 'failed',
      };
    }
  }

  /**
   * Notify all configured channels
   */
  private async notifyChannels(
    error: Error,
    context?: Record<string, unknown>
  ): Promise<void> {
    const message = this.formatEscalationMessage(error, context);

    const notifications = this.strategy.notificationChannels.map(
      async (channel) => {
        const handler = this.escalationHandlers.get(channel);
        if (handler) {
          await handler(message, { error, context, level: this.strategy.escalationLevel });
        } else {
          console.error(`No handler registered for channel: ${channel}`);
          console.error(message);
        }
      }
    );

    await Promise.all(notifications);
  }

  /**
   * Format escalation message
   */
  private formatEscalationMessage(
    error: Error,
    context?: Record<string, unknown>
  ): string {
    const parts = [
      `[${this.strategy.escalationLevel.toUpperCase()}] Escalation: ${error.message}`,
      `Strategy: ${this.strategy.name}`,
      `Timestamp: ${new Date().toISOString()}`,
    ];

    if (context) {
      parts.push(`Context: ${JSON.stringify(context, null, 2)}`);
    }

    if (this.strategy.requiresManualIntervention) {
      parts.push('⚠️ REQUIRES MANUAL INTERVENTION');
    }

    return parts.join('\n');
  }

  /**
   * Register notification handler
   */
  registerHandler(
    channel: string,
    handler: (message: string, context: unknown) => Promise<void>
  ): void {
    this.escalationHandlers.set(channel, handler);
  }

  /**
   * Unregister notification handler
   */
  unregisterHandler(channel: string): void {
    this.escalationHandlers.delete(channel);
  }

  getStrategy(): EscalationStrategy {
    return { ...this.strategy };
  }
}

/**
 * Recovery Strategy Factory
 */
export class RecoveryStrategyFactory {
  /**
   * Create retry strategy
   */
  static createRetry(config: Partial<RetryStrategy>): RetryRecovery {
    const defaults: RetryStrategy = {
      name: config.name || 'retry',
      type: 'retry',
      maxAttempts: 3,
      backoffStrategy: 'exponential',
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000,
      jitterFactor: 0.1,
      respectCircuitBreaker: true,
    };

    return new RetryRecovery({ ...defaults, ...config } as RetryStrategy);
  }

  /**
   * Create fallback strategy
   */
  static createFallback(config: Partial<FallbackStrategy>): FallbackRecovery {
    const defaults: FallbackStrategy = {
      name: config.name || 'fallback',
      type: 'fallback',
      fallbackChain: [],
      cascadeOnFailure: true,
      maxAttempts: 1,
      backoffStrategy: 'constant',
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
    };

    return new FallbackRecovery({ ...defaults, ...config } as FallbackStrategy);
  }

  /**
   * Create restore strategy
   */
  static createRestore(config: Partial<RestoreStrategy>): RestoreRecovery {
    const defaults: RestoreStrategy = {
      name: config.name || 'restore',
      type: 'restore',
      validateAfterRestore: true,
      maxAttempts: 1,
      backoffStrategy: 'constant',
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
    };

    return new RestoreRecovery({ ...defaults, ...config } as RestoreStrategy);
  }

  /**
   * Create escalation strategy
   */
  static createEscalation(
    config: Partial<EscalationStrategy>
  ): EscalationRecovery {
    const defaults: EscalationStrategy = {
      name: config.name || 'escalation',
      type: 'escalate',
      escalationLevel: 'warning',
      notificationChannels: ['console'],
      requiresManualIntervention: false,
      maxAttempts: 1,
      backoffStrategy: 'constant',
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
    };

    return new EscalationRecovery({
      ...defaults,
      ...config,
    } as EscalationStrategy);
  }
}
