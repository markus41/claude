/**
 * AsyncSemaphore - Queue-based concurrency limiter.
 * Ensures at most `maxConcurrency` async operations run simultaneously.
 */
export class AsyncSemaphore {
  private readonly waiters: Array<() => void> = [];
  private currentCount: number;

  constructor(private readonly maxConcurrency: number) {
    if (maxConcurrency < 1) {
      throw new Error('maxConcurrency must be >= 1');
    }
    this.currentCount = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.currentCount > 0) {
      this.currentCount--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    const next = this.waiters.shift();
    if (next) {
      next();
    } else {
      this.currentCount++;
    }
  }

  get available(): number {
    return this.currentCount;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
