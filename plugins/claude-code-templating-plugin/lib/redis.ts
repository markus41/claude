/**
 * ============================================================================
 * CLAUDE CODE TEMPLATING PLUGIN - REDIS CACHE
 * ============================================================================
 * Redis caching utilities for template registry and generation operations.
 * Uses Upstash Redis (shared with jira-orchestrator) for sub-millisecond
 * template resolution and improved data visibility.
 *
 * @version 2.0.0
 * @author Brookside BI
 * ============================================================================
 */

import 'dotenv/config';
import { Redis } from '@upstash/redis';
import type { Template } from './database.js';

// ============================================================================
// REDIS CLIENT SINGLETON
// ============================================================================

let redis: Redis | null = null;

/**
 * Get the shared Redis client instance
 */
export function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Check if cache feature is enabled
 */
export function isCacheEnabled(): boolean {
  return process.env.FEATURE_TEMPLATE_CACHE_ENABLED !== 'false' &&
         !!process.env.UPSTASH_REDIS_REST_URL &&
         !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

// ============================================================================
// CACHE KEY GENERATORS
// ============================================================================

const CACHE_PREFIX = 'template-registry';

/**
 * Generate cache key for a template
 */
export function templateKey(name: string, version?: string): string {
  return version
    ? `${CACHE_PREFIX}:template:${name}:${version}`
    : `${CACHE_PREFIX}:template:${name}:latest`;
}

/**
 * Generate cache key for template list
 */
export function templateListKey(options?: {
  format?: string;
  category?: string;
  tags?: string[];
}): string {
  const parts = [`${CACHE_PREFIX}:list`];
  if (options?.format) parts.push(`format:${options.format}`);
  if (options?.category) parts.push(`category:${options.category}`);
  if (options?.tags?.length) parts.push(`tags:${options.tags.sort().join(',')}`);
  return parts.join(':');
}

/**
 * Generate cache key for search results
 */
export function searchKey(query: string, options?: { format?: string; category?: string }): string {
  const parts = [`${CACHE_PREFIX}:search:${query.toLowerCase()}`];
  if (options?.format) parts.push(`format:${options.format}`);
  if (options?.category) parts.push(`category:${options.category}`);
  return parts.join(':');
}

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

// Default TTL values in seconds
const TTL = {
  TEMPLATE: 3600,        // 1 hour
  TEMPLATE_LIST: 300,    // 5 minutes
  SEARCH_RESULTS: 600,   // 10 minutes
  STATS: 1800,           // 30 minutes
};

/**
 * Get a cached template
 */
export async function getCachedTemplate(
  name: string,
  version?: string
): Promise<Template | null> {
  if (!isCacheEnabled()) return null;

  try {
    const r = getRedis();
    const key = templateKey(name, version);
    const cached = await r.get<Template>(key);
    return cached;
  } catch (error) {
    console.warn('[TemplateCache] Failed to get cached template:', error);
    return null;
  }
}

/**
 * Cache a template
 */
export async function cacheTemplate(
  template: Template,
  isLatest: boolean = false
): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();
    const key = templateKey(template.name, template.version);

    // Set with TTL
    await r.setex(key, TTL.TEMPLATE, template);

    // Also cache as latest version if specified
    if (isLatest) {
      const latestKey = templateKey(template.name);
      await r.setex(latestKey, TTL.TEMPLATE, template);
    }
  } catch (error) {
    console.warn('[TemplateCache] Failed to cache template:', error);
  }
}

/**
 * Get cached template list
 */
export async function getCachedTemplateList(options?: {
  format?: string;
  category?: string;
  tags?: string[];
}): Promise<Template[] | null> {
  if (!isCacheEnabled()) return null;

  try {
    const r = getRedis();
    const key = templateListKey(options);
    const cached = await r.get<Template[]>(key);
    return cached;
  } catch (error) {
    console.warn('[TemplateCache] Failed to get cached list:', error);
    return null;
  }
}

/**
 * Cache a template list
 */
export async function cacheTemplateList(
  templates: Template[],
  options?: {
    format?: string;
    category?: string;
    tags?: string[];
  }
): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();
    const key = templateListKey(options);
    await r.setex(key, TTL.TEMPLATE_LIST, templates);
  } catch (error) {
    console.warn('[TemplateCache] Failed to cache list:', error);
  }
}

/**
 * Get cached search results
 */
export async function getCachedSearch(
  query: string,
  options?: { format?: string; category?: string }
): Promise<Template[] | null> {
  if (!isCacheEnabled()) return null;

  try {
    const r = getRedis();
    const key = searchKey(query, options);
    const cached = await r.get<Template[]>(key);
    return cached;
  } catch (error) {
    console.warn('[TemplateCache] Failed to get cached search:', error);
    return null;
  }
}

/**
 * Cache search results
 */
export async function cacheSearchResults(
  query: string,
  results: Template[],
  options?: { format?: string; category?: string }
): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();
    const key = searchKey(query, options);
    await r.setex(key, TTL.SEARCH_RESULTS, results);
  } catch (error) {
    console.warn('[TemplateCache] Failed to cache search results:', error);
  }
}

/**
 * Invalidate template cache
 */
export async function invalidateTemplate(name: string, version?: string): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();

    // Delete specific version
    if (version) {
      await r.del(templateKey(name, version));
    }

    // Always delete latest cache
    await r.del(templateKey(name));

    // Invalidate all list caches (they may contain this template)
    const pattern = `${CACHE_PREFIX}:list:*`;
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch (error) {
    console.warn('[TemplateCache] Failed to invalidate cache:', error);
  }
}

/**
 * Clear all template caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();

    // Find all template registry keys
    const pattern = `${CACHE_PREFIX}:*`;
    const keys = await r.keys(pattern);

    if (keys.length > 0) {
      await r.del(...keys);
      console.log(`[TemplateCache] Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.warn('[TemplateCache] Failed to clear caches:', error);
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check template generation rate limit
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!isCacheEnabled()) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }

  try {
    const r = getRedis();
    const key = `${CACHE_PREFIX}:ratelimit:${identifier}`;

    // Get current count
    const current = await r.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await r.expire(key, windowSeconds);
    }

    // Get TTL for reset time
    const ttl = await r.ttl(key);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt,
    };
  } catch (error) {
    console.warn('[TemplateCache] Rate limit check failed:', error);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

// ============================================================================
// STATISTICS CACHING
// ============================================================================

interface TemplateStats {
  totalTemplates: number;
  totalGenerations: number;
  topTemplates: Array<{ name: string; downloads: number }>;
  formatDistribution: Record<string, number>;
  updatedAt: string;
}

/**
 * Get cached statistics
 */
export async function getCachedStats(): Promise<TemplateStats | null> {
  if (!isCacheEnabled()) return null;

  try {
    const r = getRedis();
    const key = `${CACHE_PREFIX}:stats`;
    const cached = await r.get<TemplateStats>(key);
    return cached;
  } catch (error) {
    console.warn('[TemplateCache] Failed to get cached stats:', error);
    return null;
  }
}

/**
 * Cache statistics
 */
export async function cacheStats(stats: TemplateStats): Promise<void> {
  if (!isCacheEnabled()) return;

  try {
    const r = getRedis();
    const key = `${CACHE_PREFIX}:stats`;
    await r.setex(key, TTL.STATS, stats);
  } catch (error) {
    console.warn('[TemplateCache] Failed to cache stats:', error);
  }
}
