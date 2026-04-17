/**
 * TokenBucket - Rate limiter that enforces a maximum requests-per-second.
 * Uses a leaky bucket algorithm with async waiting.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(rps: number) {
    if (rps <= 0) {
      throw new Error('rps must be > 0');
    }
    this.maxTokens = rps;
    this.tokens = rps;
    this.refillRate = rps / 1000;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  async consume(tokensToConsume = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokensToConsume) {
      this.tokens -= tokensToConsume;
      return;
    }

    const deficit = tokensToConsume - this.tokens;
    const waitMs = Math.ceil(deficit / this.refillRate);
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs));

    this.refill();
    this.tokens -= tokensToConsume;
  }

  get currentTokens(): number {
    this.refill();
    return this.tokens;
  }
}
