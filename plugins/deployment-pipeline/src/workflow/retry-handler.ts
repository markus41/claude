/**
 * Retry Handler
 *
 * Provides automatic retry functionality with exponential backoff
 * for recoverable failures in the deployment pipeline.
 */

import { DeploymentContext, DeploymentState } from './state-machine';

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  retryableStates: DeploymentState[];
  retryableErrors: string[];
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  attempts: number;
  lastError?: Error;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 30000,
  retryableStates: ['validating', 'building', 'testing'],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'NetworkError',
    'TimeoutError',
    'ServiceUnavailable',
  ],
};

/**
 * RetryHandler
 * Manages retry logic for deployment operations
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if state is retryable
   */
  isRetryableState(state: DeploymentState): boolean {
    return this.config.retryableStates.includes(state);
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: Error): boolean {
    const errorString = error.message || error.toString();
    return this.config.retryableErrors.some(
      retryable => errorString.includes(retryable)
    );
  }

  /**
   * Calculate backoff delay for attempt
   */
  calculateBackoff(attempt: number): number {
    const delay = this.config.backoffMs * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxBackoffMs);
  }

  /**
   * Check if retry is possible
   */
  canRetry(context: DeploymentContext, error: Error): boolean {
    // Check attempt count
    if (context.retryCount >= this.config.maxAttempts) {
      return false;
    }

    // Check if state is retryable
    if (!this.isRetryableState(context.currentState)) {
      return false;
    }

    // Check if error is retryable
    if (!this.isRetryableError(error)) {
      return false;
    }

    return true;
  }

  /**
   * Execute with retry
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: DeploymentContext,
    onRetry?: (attempt: number, error: Error, delay: number) => void
  ): Promise<RetryResult<T>> {
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < this.config.maxAttempts) {
      attempts++;

      try {
        const result = await operation();
        return {
          success: true,
          result,
          attempts,
        };
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempts >= this.config.maxAttempts) {
          break;
        }

        if (!this.isRetryableError(lastError)) {
          break;
        }

        // Calculate backoff
        const delay = this.calculateBackoff(attempts);

        // Notify retry callback
        if (onRetry) {
          onRetry(attempts, lastError, delay);
        }

        // Wait before retry
        await this.sleep(delay);

        // Increment context retry count
        context.retryCount++;
      }
    }

    return {
      success: false,
      attempts,
      lastError,
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry decorator for async functions
 */
export function withRetry<T>(
  config: Partial<RetryConfig> = {}
): (
  target: unknown,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
) => TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>> {
  const handler = new RetryHandler(config);

  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: unknown[]): Promise<T> {
      const context = args.find(
        arg => arg && typeof arg === 'object' && 'retryCount' in arg
      ) as DeploymentContext | undefined;

      if (!context) {
        return originalMethod.apply(this, args);
      }

      const result = await handler.execute(
        () => originalMethod.apply(this, args),
        context,
        (attempt, error, delay) => {
          console.log(
            `[Retry] Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
          );
        }
      );

      if (result.success) {
        return result.result!;
      }

      throw result.lastError;
    };

    return descriptor;
  };
}

// Export singleton instance with default config
export const retryHandler = new RetryHandler();
