---
description: Design rate limit detection, throttling, and backoff strategy specifications to prevent API lockouts in insurance and financial services system integrations.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Rate Limiter

Produce a complete rate limit handling design for an API integration. This covers detection, pre-emptive throttling, backoff strategy, request queuing, and multi-tenant isolation. The output is the technical specification a developer implements in the integration HTTP client layer.

## Rate Limit Detection

### HTTP 429 Response Handling

When the API returns HTTP 429 (Too Many Requests):

```typescript
interface RateLimitResponse {
  status: 429;
  headers: {
    'Retry-After'?: string;          // Seconds to wait (preferred) or HTTP-date
    'X-RateLimit-Limit'?: string;    // Total limit per window
    'X-RateLimit-Remaining'?: string; // Remaining requests in current window
    'X-RateLimit-Reset'?: string;    // Unix timestamp when limit resets
    'X-RateLimit-RetryAfter'?: string; // Some APIs use this variant
  };
}

function extractRetryAfter(response: Response): number {
  const retryAfter = response.headers.get('Retry-After');
  
  if (!retryAfter) {
    // No header — use conservative default: 60 seconds
    return 60;
  }
  
  // Check if it's a number (seconds) or an HTTP-date
  const asNumber = parseInt(retryAfter, 10);
  if (!isNaN(asNumber)) {
    return Math.max(asNumber, 1); // At least 1 second
  }
  
  // It's an HTTP-date: parse and calculate seconds until that time
  const resetDate = new Date(retryAfter);
  const secondsUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
  return Math.max(secondsUntilReset, 1);
}
```

### Rate Limit Header Tracking

Parse rate limit headers on every response (not just 429), to detect when limits are approaching:

```typescript
interface RateLimitState {
  limit: number;      // Total requests allowed per window
  remaining: number;  // Requests remaining in current window
  resetAt: number;    // Unix timestamp when window resets
}

function parseRateLimitHeaders(response: Response): RateLimitState | null {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (!limit || !remaining || !reset) return null;
  
  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetAt: parseInt(reset, 10) // Unix timestamp
  };
}
```

**Known rate limit configurations by API type** (document the specific vendor's limits):

| API | Limit | Window | Key | Notes |
|-----|-------|--------|-----|-------|
| [Vendor AMS] | 100 req | 1 minute | Per API key | Sandbox: 10 req/min |
| [Carrier API] | 1000 req | 1 hour | Per account | Shared across all users |
| [Custom API] | 50 req | 1 minute | Per endpoint | Different limits per endpoint |

## Pre-Emptive Throttling

Do not wait for a 429 to start throttling. Slow down before hitting the limit.

**Throttle activation thresholds**:

| Remaining % | Action |
|------------|--------|
| > 30% | Full speed — no throttling |
| 20-30% | Reduce rate by 25% |
| 10-20% | Reduce rate by 50% |
| < 10% | Reduce rate by 75%, log warning |
| 0% (exhausted) | Pause all requests until reset window; log alert |

**Implementation**:

```typescript
class PreEmptiveThrottler {
  private rateLimitState: RateLimitState | null = null;
  
  updateState(state: RateLimitState): void {
    this.rateLimitState = state;
  }
  
  async waitIfNeeded(): Promise<void> {
    if (!this.rateLimitState) return; // No state yet — proceed
    
    const remainingPct = this.rateLimitState.remaining / this.rateLimitState.limit;
    
    if (remainingPct <= 0) {
      // Exhausted — wait until reset
      const msUntilReset = (this.rateLimitState.resetAt * 1000) - Date.now();
      const waitMs = Math.max(msUntilReset + 500, 1000); // Add 500ms buffer after reset
      logger.warn('Rate limit exhausted, pausing', { waitMs, resetAt: new Date(this.rateLimitState.resetAt * 1000) });
      await sleep(waitMs);
    } else if (remainingPct < 0.10) {
      await sleep(750); // 750ms between requests
    } else if (remainingPct < 0.20) {
      await sleep(500); // 500ms between requests
    } else if (remainingPct < 0.30) {
      await sleep(250); // 250ms between requests
    }
    // > 30%: no delay
  }
}
```

## Backoff Strategy

Applied after a 429 response is received (reactive, not pre-emptive):

**Primary strategy**: Use `Retry-After` header value. This is always more accurate than any calculated backoff.

**Fallback strategy** (when no `Retry-After` header):

```
Exponential backoff with full jitter:

attempt_1: wait = random(5, 10) seconds
attempt_2: wait = random(10, 20) seconds
attempt_3: wait = random(20, 40) seconds
attempt_4: wait = random(40, 80) seconds  [capped at max]
attempt_5: wait = random(80, 120) seconds [max — if still failing, dead-letter]

After attempt 5 with 429: Do not continue. Rate limiting this severe indicates
a systemic misconfiguration. Dead-letter the request and alert operations.
```

**Do not retry immediately**: Some integrations retry on 429 with no delay. This makes the rate limit problem worse (the retry itself counts against the limit) and can cause the API to block the client entirely.

## Request Queuing

Control the outbound request rate using a token bucket algorithm:

```typescript
class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;
  
  constructor(requestsPerMinute: number) {
    this.maxTokens = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.refillRatePerMs = requestsPerMinute / 60000; // tokens per millisecond
  }
  
  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefill;
    const newTokens = elapsedMs * this.refillRatePerMs;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
  
  async acquire(tokensNeeded: number = 1): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= tokensNeeded) {
        this.tokens -= tokensNeeded;
        return;
      }
      // Not enough tokens — wait for refill
      const msToWait = (tokensNeeded - this.tokens) / this.refillRatePerMs;
      await sleep(Math.ceil(msToWait) + 10); // 10ms buffer
    }
  }
}

// Usage — configure at 80% of API limit (safety buffer):
// API limit: 100 req/min → configure limiter at 80 req/min
const limiter = new TokenBucketRateLimiter(80);

async function makeApiRequest(endpoint: string, options: RequestOptions) {
  await limiter.acquire();         // Wait for token
  await throttler.waitIfNeeded();  // Pre-emptive throttle
  
  const response = await httpClient.request(endpoint, options);
  
  const rateLimitState = parseRateLimitHeaders(response);
  if (rateLimitState) throttler.updateState(rateLimitState);
  
  return response;
}
```

## Priority Queue

For integrations with multiple request types, use a priority queue to ensure time-sensitive requests are not delayed by bulk batch operations:

| Priority | Request Type | Examples |
|----------|-------------|----------|
| High | Real-time triggered | Webhook response, user-initiated lookup, payment processing |
| Normal | Scheduled sync | Hourly policy sync, daily client update |
| Low | Bulk batch | Historical data load, nightly full reconciliation |

**Implementation**: Use two or three separate token buckets. Allocate tokens preferentially:
- High priority: 60% of token budget
- Normal: 30%
- Low: 10%

When the token bucket is nearly empty, drain the low-priority queue before pausing normal-priority requests.

## Per-Client Rate Limit Isolation

For multi-tenant integrations where each client has their own API credentials:

**Problem**: If one client's API key hits the rate limit, it should not affect other clients.

**Solution**: Maintain separate token bucket instances, one per API key:

```typescript
class MultiTenantRateLimiter {
  private limiters: Map<string, TokenBucketRateLimiter> = new Map();
  
  getLimiter(clientId: string, requestsPerMinute: number): TokenBucketRateLimiter {
    if (!this.limiters.has(clientId)) {
      this.limiters.set(clientId, new TokenBucketRateLimiter(requestsPerMinute));
    }
    return this.limiters.get(clientId)!;
  }
  
  // Cleanup stale limiters (clients no longer active)
  cleanup(activeClientIds: Set<string>): void {
    for (const [clientId] of this.limiters) {
      if (!activeClientIds.has(clientId)) {
        this.limiters.delete(clientId);
      }
    }
  }
}

// Usage:
const limiter = multiTenantLimiter.getLimiter(clientId, clientConfig.requestsPerMinute);
await limiter.acquire();
```

**Rate limit configuration per client**: Store each client's API key rate limit in their configuration record (database or Azure App Configuration). Use the vendor-documented limit × 80% as the configured limit.

## Metrics and Observability

Log rate limit events for monitoring and capacity planning:

| Event | Log Level | Fields |
|-------|-----------|--------|
| Pre-emptive throttle triggered | Info | remaining_pct, delay_ms, client_id |
| 429 received | Warning | endpoint, retry_after_s, attempt, client_id |
| Rate limit exhausted, waiting for reset | Warning | reset_at, wait_ms, client_id |
| Rate limit recovered (after wait) | Info | client_id |
| Backoff exceeded, dead-lettering | Error | endpoint, attempts, client_id |

**Dashboard metric**: Track the rate limit headroom percentage over time. If the rolling average drops below 20%, the integration needs either a higher API tier or optimized batching.

## Output Format

Deliver as:

1. Rate limit detection specification (header parsing, 429 handling)
2. Known rate limits table (vendor, limit, window, key type)
3. Pre-emptive throttling thresholds table
4. Backoff strategy (Retry-After-first, then exponential fallback — with parameters)
5. Token bucket implementation (pseudocode with configuration parameters)
6. Priority queue design (if applicable — describe tiers and allocation)
7. Multi-tenant isolation design (if applicable)
8. Metrics and logging specification
9. Vendor-specific notes (quirks in the target API's rate limit implementation that the developer must know)
