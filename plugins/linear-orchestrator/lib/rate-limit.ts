/**
 * Token-bucket rate limiter for paced bulk operations.
 *
 * Designed to stay under both Linear's request rate AND its complexity budget.
 */

export interface TokenBucketOptions {
  /** Bucket capacity. */
  capacity: number;
  /** Tokens per second refill rate. */
  refillRate: number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(private opts: TokenBucketOptions) {
    this.tokens = opts.capacity;
    this.lastRefill = Date.now();
  }

  async take(n = 1): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= n) {
        this.tokens -= n;
        return;
      }
      const need = n - this.tokens;
      const waitMs = (need / this.opts.refillRate) * 1000;
      await sleep(Math.max(waitMs, 50));
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.opts.capacity, this.tokens + elapsed * this.opts.refillRate);
    this.lastRefill = now;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
