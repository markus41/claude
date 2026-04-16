import { describe, it, expect } from 'vitest';
import { TokenBucket } from '../../src/core/token-bucket.js';

describe('TokenBucket', () => {
  it('should allow immediate consumption when tokens available', async () => {
    const bucket = new TokenBucket(10);
    const start = Date.now();
    await bucket.consume(1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('should delay when tokens exhausted', async () => {
    const bucket = new TokenBucket(2); // 2 tokens per second
    // Consume all tokens
    await bucket.consume(2);
    // Next consume should wait ~500ms for 1 token
    const start = Date.now();
    await bucket.consume(1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(200);
  });

  it('should report current tokens', () => {
    const bucket = new TokenBucket(5);
    expect(bucket.currentTokens).toBeGreaterThan(0);
    expect(bucket.currentTokens).toBeLessThanOrEqual(5);
  });

  it('should throw if rps <= 0', () => {
    expect(() => new TokenBucket(0)).toThrow();
    expect(() => new TokenBucket(-1)).toThrow();
  });

  it('should refill tokens over time', async () => {
    const bucket = new TokenBucket(10);
    await bucket.consume(10);
    // Wait for refill
    await new Promise((r) => setTimeout(r, 200));
    const tokens = bucket.currentTokens;
    expect(tokens).toBeGreaterThan(0);
  });
});
