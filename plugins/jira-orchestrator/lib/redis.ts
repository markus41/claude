/**
 * ============================================================================
 * JIRA ORCHESTRATOR - REDIS CLIENT
 * ============================================================================
 * Upstash Redis connection for caching, rate limiting, and real-time features
 *
 * Features:
 * - Serverless Redis (Upstash)
 * - REST API for edge/serverless environments
 * - TCP connection for Node.js environments
 * - Automatic key prefixing
 * - Rate limiting utilities
 * - Session management
 * - Real-time pub/sub
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ============================================================================
// REDIS CLIENT INITIALIZATION
// ============================================================================

/**
 * Upstash Redis client (REST API - works everywhere)
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Key prefix for all jira-orchestrator keys
 */
const KEY_PREFIX = 'jira-orchestrator:';

// ============================================================================
// KEY HELPERS
// ============================================================================

/**
 * Create a prefixed key
 */
function key(...parts: string[]): string {
  return KEY_PREFIX + parts.join(':');
}

/**
 * Key patterns for different data types
 */
export const keys = {
  // Session keys
  session: (sessionId: string) => key('session', sessionId),

  // Orchestration keys
  orchestration: (issueKey: string) => key('orchestration', issueKey),
  orchestrationLock: (issueKey: string) => key('lock', 'orchestration', issueKey),

  // Agent keys
  agentCache: (agentName: string, hash: string) => key('agent', 'cache', agentName, hash),
  agentRateLimit: (agentName: string) => key('agent', 'ratelimit', agentName),

  // Phase keys
  phaseState: (issueKey: string, phase: string) => key('phase', issueKey, phase),

  // Queue keys
  queue: (queueName: string) => key('queue', queueName),

  // Metrics keys
  metricsRealtime: (metric: string) => key('metrics', 'realtime', metric),

  // Rate limiting
  rateLimit: (identifier: string) => key('ratelimit', identifier),

  // Pub/Sub channels
  channel: {
    orchestration: (issueKey: string) => key('channel', 'orchestration', issueKey),
    events: key('channel', 'events'),
    notifications: key('channel', 'notifications'),
  },
};

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limiter for API calls
 * Uses sliding window algorithm
 */
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
  prefix: KEY_PREFIX + 'ratelimit:api',
});

/**
 * Rate limiter for agent executions
 * Prevents runaway agent spawning
 */
export const agentRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 agents per minute
  analytics: true,
  prefix: KEY_PREFIX + 'ratelimit:agent',
});

/**
 * Rate limiter for notifications
 * Prevents notification spam
 */
export const notificationRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 notifications per minute
  analytics: true,
  prefix: KEY_PREFIX + 'ratelimit:notification',
});

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// ============================================================================
// CACHING
// ============================================================================

/**
 * Get cached value
 */
export async function getCache<T>(cacheKey: string): Promise<T | null> {
  return redis.get<T>(cacheKey);
}

/**
 * Set cached value with TTL
 */
export async function setCache<T>(
  cacheKey: string,
  value: T,
  ttlSeconds: number = 300 // 5 minutes default
): Promise<void> {
  await redis.set(cacheKey, value, { ex: ttlSeconds });
}

/**
 * Delete cached value
 */
export async function deleteCache(cacheKey: string): Promise<void> {
  await redis.del(cacheKey);
}

/**
 * Get or set cache (cache-aside pattern)
 */
export async function getOrSetCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await getCache<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetchFn();
  await setCache(cacheKey, fresh, ttlSeconds);
  return fresh;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export interface Session {
  sessionId: string;
  issueKey?: string;
  orchestrationId?: string;
  currentPhase?: string;
  startedAt: string;
  lastActivityAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  return redis.get<Session>(keys.session(sessionId));
}

/**
 * Set session data
 */
export async function setSession(
  sessionId: string,
  data: Partial<Session>,
  ttlSeconds: number = 86400 // 24 hours
): Promise<void> {
  const existing = await getSession(sessionId);
  const session: Session = {
    sessionId,
    startedAt: existing?.startedAt || new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    ...existing,
    ...data,
  };
  await redis.set(keys.session(sessionId), session, { ex: ttlSeconds });
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(keys.session(sessionId));
}

/**
 * Update session activity timestamp
 */
export async function touchSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (session) {
    session.lastActivityAt = new Date().toISOString();
    await redis.set(keys.session(sessionId), session, { ex: 86400 });
  }
}

// ============================================================================
// DISTRIBUTED LOCKING
// ============================================================================

/**
 * Acquire a distributed lock
 */
export async function acquireLock(
  lockKey: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  const result = await redis.set(lockKey, Date.now().toString(), {
    nx: true, // Only set if not exists
    ex: ttlSeconds,
  });
  return result === 'OK';
}

/**
 * Release a distributed lock
 */
export async function releaseLock(lockKey: string): Promise<void> {
  await redis.del(lockKey);
}

/**
 * Execute with lock (mutex pattern)
 */
export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  options: {
    ttlSeconds?: number;
    retries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<T> {
  const {
    ttlSeconds = 30,
    retries = 3,
    retryDelayMs = 100,
  } = options;

  for (let i = 0; i < retries; i++) {
    const acquired = await acquireLock(lockKey, ttlSeconds);
    if (acquired) {
      try {
        return await fn();
      } finally {
        await releaseLock(lockKey);
      }
    }

    // Wait before retry
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * (i + 1)));
    }
  }

  throw new Error(`Failed to acquire lock: ${lockKey}`);
}

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * Push item to queue (left push)
 */
export async function queuePush<T>(queueName: string, item: T): Promise<void> {
  await redis.lpush(keys.queue(queueName), JSON.stringify(item));
}

/**
 * Pop item from queue (right pop - FIFO)
 */
export async function queuePop<T>(queueName: string): Promise<T | null> {
  const item = await redis.rpop<string>(keys.queue(queueName));
  return item ? JSON.parse(item) : null;
}

/**
 * Get queue length
 */
export async function queueLength(queueName: string): Promise<number> {
  return redis.llen(keys.queue(queueName));
}

/**
 * Peek at queue items without removing
 */
export async function queuePeek<T>(
  queueName: string,
  count: number = 10
): Promise<T[]> {
  const items = await redis.lrange<string>(keys.queue(queueName), 0, count - 1);
  return items.map(item => JSON.parse(item));
}

// ============================================================================
// REAL-TIME METRICS
// ============================================================================

/**
 * Increment a real-time counter
 */
export async function incrMetric(
  metricName: string,
  increment: number = 1
): Promise<number> {
  return redis.incrby(keys.metricsRealtime(metricName), increment);
}

/**
 * Get a real-time counter value
 */
export async function getMetric(metricName: string): Promise<number> {
  const value = await redis.get<number>(keys.metricsRealtime(metricName));
  return value ?? 0;
}

/**
 * Set a real-time gauge value
 */
export async function setMetricGauge(
  metricName: string,
  value: number
): Promise<void> {
  await redis.set(keys.metricsRealtime(metricName), value);
}

/**
 * Record a timing metric (for averages)
 */
export async function recordTiming(
  metricName: string,
  durationMs: number
): Promise<void> {
  const timingKey = keys.metricsRealtime(`${metricName}:timings`);

  // Use sorted set for timing percentiles
  await redis.zadd(timingKey, {
    score: Date.now(),
    member: `${Date.now()}:${durationMs}`,
  });

  // Trim to last 1000 entries
  await redis.zremrangebyrank(timingKey, 0, -1001);
}

// ============================================================================
// PUB/SUB (Limited in serverless, but useful for notifications)
// ============================================================================

/**
 * Publish event to channel
 * Note: Upstash Redis supports pub/sub but receivers need active connections
 */
export async function publishEvent<T>(
  channel: string,
  event: T
): Promise<number> {
  return redis.publish(channel, JSON.stringify(event));
}

/**
 * Store event for polling (alternative to true pub/sub)
 */
export async function storeEvent<T>(
  channel: string,
  event: T,
  ttlSeconds: number = 300
): Promise<void> {
  const eventWithTimestamp = {
    ...event,
    _timestamp: Date.now(),
  };

  // Store in sorted set by timestamp
  await redis.zadd(channel, {
    score: Date.now(),
    member: JSON.stringify(eventWithTimestamp),
  });

  // Set expiry on the key
  await redis.expire(channel, ttlSeconds);

  // Trim old events
  const cutoff = Date.now() - (ttlSeconds * 1000);
  await redis.zremrangebyscore(channel, 0, cutoff);
}

/**
 * Get recent events from channel (polling)
 */
export async function getRecentEvents<T>(
  channel: string,
  sinceTimestamp: number = 0
): Promise<T[]> {
  const events = await redis.zrangebyscore<string>(
    channel,
    sinceTimestamp,
    Date.now()
  );
  return events.map(e => JSON.parse(e));
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check - verify Redis connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', error);
    return false;
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default redis;
