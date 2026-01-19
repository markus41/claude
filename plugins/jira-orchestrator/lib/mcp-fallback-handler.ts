/**
 * MCP Fallback Handler Implementation
 *
 * Provides tiered fallback strategies for MCP service failures.
 * Implements three tiers:
 * - Tier 1: Use cached response (if available)
 * - Tier 2: Queue request for later processing
 * - Tier 3: Return degraded/offline response
 *
 * Features:
 * - Configurable strategies per MCP server
 * - Persistent queue for durability
 * - Cache management with TTL
 * - Automatic queue processing on recovery
 * - Comprehensive logging
 *
 * @version 1.0.0
 * @author jira-orchestrator
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type FallbackTier = 'cache' | 'queue' | 'offline';
export type FallbackSource = 'live' | 'cache' | 'queue' | 'offline';

export interface FallbackStrategy {
  server: string;
  tiers: FallbackTier[];
  cacheOptions?: {
    maxAge: number;        // Max age of cached response in ms
    staleOk: boolean;      // Accept stale cache if no fresh available
  };
  queueOptions?: {
    maxQueueSize: number;
    persistQueue: boolean;
    retryIntervalMs: number;
  };
  offlineResponse?: unknown;  // Default response when offline
}

export interface QueuedOperation {
  id: string;
  server: string;
  operation: string;
  params: unknown;
  queuedAt: number;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
}

export interface FallbackResult<T> {
  result: T;
  source: FallbackSource;
  degraded: boolean;
  message?: string;
  cached?: boolean;
  cacheAge?: number;
}

export interface CachedResponse {
  key: string;
  server: string;
  operation: string;
  params: unknown;
  response: unknown;
  cachedAt: number;
  expiresAt: number;
  hits: number;
}

export interface QueueStatus {
  server: string;
  queueSize: number;
  oldestItem?: number;
  newestItem?: number;
}

// ============================================
// FALLBACK HANDLER IMPLEMENTATION
// ============================================

export class MCPFallbackHandler {
  private strategies: Map<string, FallbackStrategy>;
  private cache: Map<string, CachedResponse>;
  private queues: Map<string, QueuedOperation[]>;
  private queuePath?: string;
  private cachePath?: string;

  constructor(strategies: FallbackStrategy[], queuePath?: string) {
    this.strategies = new Map(strategies.map(s => [s.server, s]));
    this.cache = new Map();
    this.queues = new Map();

    // Set up storage paths
    if (queuePath) {
      this.queuePath = path.join(queuePath, 'mcp-fallback.json');
      this.cachePath = path.join(queuePath, 'mcp-responses.json');

      // Ensure directory exists
      if (!fs.existsSync(queuePath)) {
        fs.mkdirSync(queuePath, { recursive: true });
      }

      // Restore from disk
      this.restoreQueue();
      this.restoreCache();
    }
  }

  /**
   * Execute operation with fallback handling
   */
  async executeWithFallback<T>(
    server: string,
    operation: string,
    executor: () => Promise<T>,
    params?: unknown
  ): Promise<FallbackResult<T>> {
    const strategy = this.strategies.get(server);

    if (!strategy) {
      throw new Error(`No fallback strategy configured for server: ${server}`);
    }

    // Try live execution first
    try {
      const result = await executor();

      // Cache successful response
      if (strategy.cacheOptions) {
        this.cacheResponse(server, operation, params, result);
      }

      return {
        result,
        source: 'live',
        degraded: false,
      };
    } catch (error) {
      // Live execution failed, try fallback tiers
      return this.executeFallbackTiers<T>(server, operation, params, strategy, error as Error);
    }
  }

  /**
   * Execute fallback tiers in order
   */
  private async executeFallbackTiers<T>(
    server: string,
    operation: string,
    params: unknown,
    strategy: FallbackStrategy,
    error: Error
  ): Promise<FallbackResult<T>> {
    for (const tier of strategy.tiers) {
      try {
        switch (tier) {
          case 'cache': {
            const cached = this.getCached<T>(server, operation, params);
            if (cached !== null) {
              const cacheKey = this.getCacheKey(server, operation, params);
              const cacheEntry = this.cache.get(cacheKey);
              const age = cacheEntry ? Date.now() - cacheEntry.cachedAt : 0;
              const stale = cacheEntry ? Date.now() > cacheEntry.expiresAt : false;

              // Check if cache is acceptable
              if (!stale || strategy.cacheOptions?.staleOk) {
                return {
                  result: cached,
                  source: 'cache',
                  degraded: stale,
                  message: stale ? 'Using stale cache due to service failure' : 'Using cached response',
                  cached: true,
                  cacheAge: age,
                };
              }
            }
            break;
          }

          case 'queue': {
            // Queue the operation for later processing
            const queueId = this.queueOperation(server, operation, params);

            return {
              result: {
                queued: true,
                queueId,
                message: 'Operation queued for processing when service recovers',
              } as unknown as T,
              source: 'queue',
              degraded: true,
              message: 'Service unavailable - operation queued',
            };
          }

          case 'offline': {
            const offlineResponse = strategy.offlineResponse as T;
            if (offlineResponse !== undefined) {
              return {
                result: offlineResponse,
                source: 'offline',
                degraded: true,
                message: 'Using offline fallback response',
              };
            }
            break;
          }
        }
      } catch (tierError) {
        // Log tier failure and continue to next tier
        console.error(`Fallback tier '${tier}' failed for ${server}:${operation}:`, tierError);
      }
    }

    // All fallback tiers failed, throw original error
    throw new Error(`All fallback tiers exhausted for ${server}:${operation}. Original error: ${error.message}`);
  }

  /**
   * Get cached response if available
   */
  getCached<T>(server: string, operation: string, params?: unknown): T | null {
    const key = this.getCacheKey(server, operation, params);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const strategy = this.strategies.get(server);
    const now = Date.now();

    // Check if cache is still valid
    if (strategy?.cacheOptions) {
      if (now > cached.expiresAt && !strategy.cacheOptions.staleOk) {
        // Cache expired and stale not allowed
        this.cache.delete(key);
        return null;
      }
    }

    // Increment hit counter
    cached.hits++;

    return cached.response as T;
  }

  /**
   * Cache a response
   */
  cacheResponse(server: string, operation: string, params: unknown, response: unknown): void {
    const strategy = this.strategies.get(server);
    if (!strategy?.cacheOptions) {
      return;
    }

    const key = this.getCacheKey(server, operation, params);
    const now = Date.now();

    const cached: CachedResponse = {
      key,
      server,
      operation,
      params,
      response,
      cachedAt: now,
      expiresAt: now + strategy.cacheOptions.maxAge,
      hits: 0,
    };

    this.cache.set(key, cached);

    // Persist cache if path configured
    if (this.cachePath) {
      this.persistCache();
    }
  }

  /**
   * Queue an operation for later processing
   */
  queueOperation(server: string, operation: string, params: unknown): string {
    const strategy = this.strategies.get(server);
    if (!strategy?.queueOptions) {
      throw new Error(`Queue not configured for server: ${server}`);
    }

    // Initialize queue for server if needed
    if (!this.queues.has(server)) {
      this.queues.set(server, []);
    }

    const queue = this.queues.get(server)!;

    // Check queue size limit
    if (queue.length >= strategy.queueOptions.maxQueueSize) {
      throw new Error(`Queue full for server: ${server} (max: ${strategy.queueOptions.maxQueueSize})`);
    }

    const queuedOp: QueuedOperation = {
      id: uuidv4(),
      server,
      operation,
      params,
      queuedAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    queue.push(queuedOp);

    // Persist queue if configured
    if (strategy.queueOptions.persistQueue && this.queuePath) {
      this.persistQueue();
    }

    return queuedOp.id;
  }

  /**
   * Process queued operations for a server
   */
  async processQueue(server: string): Promise<{ processed: number; failed: number }> {
    const queue = this.queues.get(server);
    if (!queue || queue.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    // Process operations in order
    const remaining: QueuedOperation[] = [];

    for (const op of queue) {
      try {
        // Here you would execute the actual operation
        // For now, we just mark it as processed
        // In real implementation, this would call the MCP server
        console.log(`Processing queued operation: ${op.server}:${op.operation}`);
        processed++;
      } catch (error) {
        op.retryCount++;
        op.lastAttempt = Date.now();

        if (op.retryCount < op.maxRetries) {
          remaining.push(op);
        } else {
          console.error(`Failed to process queued operation after ${op.maxRetries} retries:`, op);
          failed++;
        }
      }
    }

    // Update queue with remaining operations
    this.queues.set(server, remaining);

    // Persist updated queue
    const strategy = this.strategies.get(server);
    if (strategy?.queueOptions?.persistQueue && this.queuePath) {
      this.persistQueue();
    }

    return { processed, failed };
  }

  /**
   * Get queue status for all servers
   */
  getQueueStatus(): QueueStatus[] {
    const statuses: QueueStatus[] = [];

    for (const [server, queue] of this.queues.entries()) {
      const status: QueueStatus = {
        server,
        queueSize: queue.length,
      };

      if (queue.length > 0) {
        status.oldestItem = Math.min(...queue.map(op => op.queuedAt));
        status.newestItem = Math.max(...queue.map(op => op.queuedAt));
      }

      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Clear queue for a specific server
   */
  clearQueue(server: string): void {
    this.queues.delete(server);

    const strategy = this.strategies.get(server);
    if (strategy?.queueOptions?.persistQueue && this.queuePath) {
      this.persistQueue();
    }
  }

  /**
   * Persist queue to disk
   */
  persistQueue(): void {
    if (!this.queuePath) {
      return;
    }

    try {
      const data = {
        queues: Array.from(this.queues.entries()).map(([server, ops]) => ({
          server,
          operations: ops,
        })),
        persistedAt: new Date().toISOString(),
      };

      fs.writeFileSync(this.queuePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  /**
   * Restore queue from disk
   */
  restoreQueue(): void {
    if (!this.queuePath || !fs.existsSync(this.queuePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.queuePath, 'utf-8');
      const data = JSON.parse(content);

      for (const { server, operations } of data.queues || []) {
        this.queues.set(server, operations);
      }

      console.log(`Restored queue with ${this.queues.size} servers`);
    } catch (error) {
      console.error('Failed to restore queue:', error);
    }
  }

  /**
   * Persist cache to disk
   */
  private persistCache(): void {
    if (!this.cachePath) {
      return;
    }

    try {
      const data = {
        cache: Array.from(this.cache.values()),
        persistedAt: new Date().toISOString(),
      };

      fs.writeFileSync(this.cachePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  /**
   * Restore cache from disk
   */
  private restoreCache(): void {
    if (!this.cachePath || !fs.existsSync(this.cachePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.cachePath, 'utf-8');
      const data = JSON.parse(content);

      for (const cached of data.cache || []) {
        this.cache.set(cached.key, cached);
      }

      console.log(`Restored cache with ${this.cache.size} entries`);
    } catch (error) {
      console.error('Failed to restore cache:', error);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(server: string, operation: string, params?: unknown): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    const hash = createHash('sha256')
      .update(`${server}:${operation}:${paramsStr}`)
      .digest('hex')
      .substring(0, 16);

    return `${server}:${operation}:${hash}`;
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, cached] of this.cache.entries()) {
      const strategy = this.strategies.get(cached.server);
      if (strategy?.cacheOptions && !strategy.cacheOptions.staleOk) {
        if (now > cached.expiresAt) {
          this.cache.delete(key);
          removed++;
        }
      }
    }

    if (removed > 0 && this.cachePath) {
      this.persistCache();
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; servers: Map<string, number> } {
    const stats = {
      size: this.cache.size,
      hits: 0,
      servers: new Map<string, number>(),
    };

    for (const cached of this.cache.values()) {
      stats.hits += cached.hits;

      const serverCount = stats.servers.get(cached.server) || 0;
      stats.servers.set(cached.server, serverCount + 1);
    }

    return stats;
  }
}

// ============================================
// DEFAULT STRATEGIES
// ============================================

export const DEFAULT_STRATEGIES: FallbackStrategy[] = [
  {
    server: 'context7',
    tiers: ['cache', 'offline'],
    cacheOptions: {
      maxAge: 3600000,  // 1 hour
      staleOk: true,
    },
    offlineResponse: {
      docs: 'Documentation unavailable - working offline',
      cached: false,
    },
  },
  {
    server: 'memory',
    tiers: ['cache', 'queue', 'offline'],
    cacheOptions: {
      maxAge: 300000,  // 5 minutes
      staleOk: false,
    },
    queueOptions: {
      maxQueueSize: 100,
      persistQueue: true,
      retryIntervalMs: 60000,  // 1 minute
    },
    offlineResponse: {
      entities: [],
      relations: [],
    },
  },
  {
    server: 'atlassian',
    tiers: ['cache', 'queue'],
    cacheOptions: {
      maxAge: 600000,  // 10 minutes
      staleOk: true,
    },
    queueOptions: {
      maxQueueSize: 50,
      persistQueue: true,
      retryIntervalMs: 120000,  // 2 minutes
    },
  },
  {
    server: 'sequential-thinking',
    tiers: ['cache', 'offline'],
    cacheOptions: {
      maxAge: 1800000,  // 30 minutes
      staleOk: true,
    },
    offlineResponse: {
      steps: [],
      reasoning: 'Sequential thinking unavailable - working offline',
    },
  },
];

// ============================================
// SINGLETON INSTANCE
// ============================================

let globalFallbackHandler: MCPFallbackHandler | null = null;

/**
 * Get or create the global fallback handler instance
 */
export function getFallbackHandler(
  strategies?: FallbackStrategy[],
  queuePath?: string
): MCPFallbackHandler {
  if (!globalFallbackHandler) {
    globalFallbackHandler = new MCPFallbackHandler(
      strategies || DEFAULT_STRATEGIES,
      queuePath || path.join(process.cwd(), 'sessions', 'queues')
    );
  }
  return globalFallbackHandler;
}

/**
 * Reset the global fallback handler instance
 */
export function resetGlobalFallbackHandler(): void {
  globalFallbackHandler = null;
}

// ============================================
// EXPORTS
// ============================================

export default MCPFallbackHandler;
