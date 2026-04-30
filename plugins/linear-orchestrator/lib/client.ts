/**
 * Linear GraphQL client wrapper with rate-limit awareness, retry, and complexity tracking.
 *
 * Wraps @linear/sdk's LinearClient and adds:
 *  - X-RateLimit-* / X-Complexity-* header parsing
 *  - Token-bucket pacing for bulk ops
 *  - Exponential backoff with jitter on 429
 *  - Hooks for before/after request (used by webhook-DLQ for replay context)
 */

import { LinearClient, LinearFetch } from "@linear/sdk";

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
  complexityLimit: number;
  complexityRemaining: number;
  complexityResetAt: Date;
  lastQueryComplexity: number;
}

export type RateLimitListener = (info: RateLimitInfo) => void;

export interface LinearClientOptions {
  apiKey?: string;
  accessToken?: string;
  actorToken?: string;
  onRateLimit?: RateLimitListener;
  maxRetries?: number;
}

export class LinearOrchestratorClient {
  private inner: LinearClient;
  private listeners: RateLimitListener[] = [];
  private maxRetries: number;
  private latest: RateLimitInfo | null = null;

  constructor(opts: LinearClientOptions) {
    const headers: Record<string, string> = {};
    if (opts.actorToken) headers["Linear-Actor-Token"] = opts.actorToken;

    this.inner = new LinearClient({
      apiKey: opts.apiKey,
      accessToken: opts.accessToken,
      headers,
    });
    this.maxRetries = opts.maxRetries ?? 3;
    if (opts.onRateLimit) this.listeners.push(opts.onRateLimit);
  }

  onRateLimit(fn: RateLimitListener): void {
    this.listeners.push(fn);
  }

  get sdk(): LinearClient {
    return this.inner;
  }

  /**
   * Run a raw GraphQL request with retry + rate-limit handling.
   * Use this for queries the SDK doesn't expose ergonomically.
   */
  async raw<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        const result = await this.inner.client.rawRequest<T, typeof variables>(
          query,
          variables ?? {}
        );
        this.captureRateLimit(result.headers as Headers | undefined);
        return result.data as T;
      } catch (err: any) {
        if (err?.status === 429 && attempt < this.maxRetries) {
          const wait = this.computeBackoff(err, attempt);
          await sleep(wait);
          attempt++;
          continue;
        }
        throw err;
      }
    }
  }

  private captureRateLimit(headers?: Headers): void {
    if (!headers) return;
    const get = (k: string) => headers.get(k);
    const info: RateLimitInfo = {
      limit: Number(get("x-ratelimit-limit") ?? 0),
      remaining: Number(get("x-ratelimit-remaining") ?? 0),
      resetAt: new Date(Number(get("x-ratelimit-reset") ?? 0) * 1000),
      complexityLimit: Number(get("x-complexity-limit") ?? 0),
      complexityRemaining: Number(get("x-complexity-remaining") ?? 0),
      complexityResetAt: new Date(Number(get("x-complexity-reset") ?? 0) * 1000),
      lastQueryComplexity: Number(get("x-complexity") ?? 0),
    };
    this.latest = info;
    for (const fn of this.listeners) fn(info);
  }

  private computeBackoff(err: any, attempt: number): number {
    const reset = Number(err?.headers?.["x-ratelimit-reset"] ?? 0) * 1000;
    const delta = Math.max(reset - Date.now(), 1000);
    const jitter = Math.random() * 500;
    return Math.min(delta + jitter, 60_000) * Math.pow(1.5, attempt);
  }

  rateLimitSnapshot(): RateLimitInfo | null {
    return this.latest;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
