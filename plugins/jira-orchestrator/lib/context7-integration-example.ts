/**
 * Context7 Integration Example
 *
 * Demonstrates how to integrate Context7Client and RequestDeduplicator
 * into the jira-orchestrator agent system.
 *
 * This file is for reference only and shows the recommended usage patterns.
 *
 * @module context7-integration-example
 * @version 1.0.0
 */

import { Context7Client, Context7QueryResult } from './context7-client';
import { RequestDeduplicator } from './request-deduplicator';
import * as path from 'path';

/**
 * Example 1: Basic Context7 client usage
 */
async function basicUsageExample() {
  console.log('\n=== Example 1: Basic Usage ===\n');

  // Initialize deduplicator (shared across all clients)
  const deduplicator = new RequestDeduplicator({
    defaultWindowMs: 5000,
    maxWaiters: 100,
  });

  // Initialize Context7 client
  const context7 = new Context7Client({
    cachePath: './sessions/cache/context7.db',
    cacheTtlLibraryMs: 3600000, // 1 hour
    cacheTtlDocsMs: 1800000, // 30 minutes
    maxRetries: 3,
    timeoutMs: 30000,
    deduplicator,
    // MCP caller would be injected here in production
    mcpCaller: async (method, params) => {
      // Mock implementation for example
      console.log(`📞 MCP Call: ${method}`, params);
      if (method === 'resolve-library-id') {
        return { libraryId: '/vercel/next.js' };
      }
      return { content: [{ text: 'Mock documentation content' }] };
    },
  });

  try {
    // Step 1: Resolve library ID
    console.log('🔍 Resolving library ID for Next.js...');
    const libraryIdResult = await context7.resolveLibraryId('next.js', 'How to use Next.js App Router?');
    console.log('✅ Library ID:', libraryIdResult.libraryId);
    console.log('   Cached:', libraryIdResult.cached);
    console.log('   Query time:', libraryIdResult.queryTimeMs, 'ms');

    // Step 2: Query documentation
    console.log('\n📖 Querying Next.js documentation...');
    const docsResult = await context7.queryDocs(
      libraryIdResult.libraryId!,
      'How to create dynamic routes with App Router?'
    );
    console.log('✅ Docs retrieved:', docsResult.docs?.substring(0, 100), '...');
    console.log('   Cached:', docsResult.cached);
    console.log('   Query time:', docsResult.queryTimeMs, 'ms');

    // Step 3: Query again (should be cached)
    console.log('\n📖 Querying same documentation (should be cached)...');
    const cachedDocsResult = await context7.queryDocs(
      libraryIdResult.libraryId!,
      'How to create dynamic routes with App Router?'
    );
    console.log('✅ Docs retrieved from cache');
    console.log('   Cached:', cachedDocsResult.cached);
    console.log('   Query time:', cachedDocsResult.queryTimeMs, 'ms');
    console.log('   Cache age:', cachedDocsResult.cacheAgeMs, 'ms');

    // Step 4: Check metrics
    console.log('\n📊 Performance Metrics:');
    const metrics = context7.getMetrics();
    console.log('   Total queries:', metrics.totalQueries);
    console.log('   Cache hits:', metrics.cacheHits);
    console.log('   Cache misses:', metrics.cacheMisses);
    console.log('   Cache hit rate:', (metrics.cacheHitRate * 100).toFixed(1), '%');
    console.log('   Avg query time:', metrics.avgQueryTime.toFixed(2), 'ms');
    console.log('   Avg cache query time:', metrics.avgCacheQueryTime.toFixed(2), 'ms');
    console.log('   Avg MCP query time:', metrics.avgMcpQueryTime.toFixed(2), 'ms');

    if (metrics.deduplication) {
      console.log('\n📊 Deduplication Metrics:');
      console.log('   Deduplicated:', metrics.deduplication.deduplicated);
      console.log('   Time saved:', metrics.deduplication.savedMs, 'ms');
    }

    // Cleanup
    context7.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 2: Concurrent requests with deduplication
 */
async function deduplicationExample() {
  console.log('\n=== Example 2: Concurrent Request Deduplication ===\n');

  const deduplicator = new RequestDeduplicator({
    defaultWindowMs: 5000,
  });

  const context7 = new Context7Client({
    cachePath: './sessions/cache/context7-test.db',
    deduplicator,
    mcpCaller: async (method, params) => {
      // Simulate slow API call
      console.log(`📞 MCP Call: ${method}`, params);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (method === 'resolve-library-id') {
        return { libraryId: '/mongodb/docs' };
      }
      return { content: [{ text: 'MongoDB documentation' }] };
    },
  });

  try {
    console.log('🚀 Launching 5 concurrent identical requests...');
    const startTime = Date.now();

    // Launch 5 identical requests concurrently
    const promises = Array(5)
      .fill(null)
      .map((_, i) => {
        console.log(`   Request ${i + 1} launched`);
        return context7.resolveLibraryId('mongodb', 'How to use MongoDB?');
      });

    // Wait for all to complete
    const results = await Promise.all(promises);

    const totalTime = Date.now() - startTime;

    console.log(`\n✅ All requests completed in ${totalTime}ms`);
    console.log(`   Without deduplication: ~${2000 * 5}ms (5 x 2s)`);
    console.log(`   With deduplication: ${totalTime}ms`);
    console.log(`   Time saved: ~${2000 * 5 - totalTime}ms (${(((2000 * 5 - totalTime) / (2000 * 5)) * 100).toFixed(1)}% faster)`);

    console.log('\n📊 Results:');
    results.forEach((result, i) => {
      console.log(`   Request ${i + 1}:`, {
        libraryId: result.libraryId,
        cached: result.cached,
        queryTime: result.queryTimeMs,
      });
    });

    console.log('\n📊 Deduplication Metrics:');
    const dedupMetrics = deduplicator.getMetrics();
    console.log('   Total requests:', dedupMetrics.totalRequests);
    console.log('   Deduplicated:', dedupMetrics.deduplicated);
    console.log('   Deduplication rate:', (dedupMetrics.deduplicationRate * 100).toFixed(1), '%');
    console.log('   Time saved:', dedupMetrics.savedMs, 'ms');

    // Cleanup
    context7.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 3: Integration with agent system
 */
interface AgentContext {
  taskId: string;
  agentId: string;
  sessionId: string;
}

class Context7AgentIntegration {
  private context7: Context7Client;
  private deduplicator: RequestDeduplicator;

  constructor(mcpCaller: (method: string, params: Record<string, any>) => Promise<any>) {
    // Shared deduplicator for all agents
    this.deduplicator = new RequestDeduplicator({
      defaultWindowMs: 5000,
      maxWaiters: 100,
    });

    // Context7 client with persistent cache
    this.context7 = new Context7Client({
      cachePath: './sessions/cache/context7.db',
      cacheTtlLibraryMs: 3600000,
      cacheTtlDocsMs: 1800000,
      maxRetries: 3,
      timeoutMs: 30000,
      deduplicator: this.deduplicator,
      mcpCaller,
    });
  }

  /**
   * Query library documentation for agent task
   */
  async queryLibraryForTask(
    context: AgentContext,
    libraryName: string,
    query: string
  ): Promise<string> {
    console.log(`🤖 Agent ${context.agentId} querying ${libraryName} for task ${context.taskId}`);

    try {
      // Step 1: Resolve library ID (cached if recently queried)
      const libraryIdResult = await this.context7.resolveLibraryId(libraryName, query);

      if (!libraryIdResult.libraryId) {
        throw new Error(`Failed to resolve library: ${libraryName}`);
      }

      console.log(`   ✅ Resolved to: ${libraryIdResult.libraryId} (cached: ${libraryIdResult.cached})`);

      // Step 2: Query documentation (cached if same query recently made)
      const docsResult = await this.context7.queryDocs(libraryIdResult.libraryId, query);

      console.log(`   ✅ Retrieved docs (${docsResult.docs?.length} chars, cached: ${docsResult.cached})`);

      return docsResult.docs || '';
    } catch (error) {
      console.error(`   ❌ Error querying ${libraryName}:`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    return {
      context7: this.context7.getMetrics(),
      deduplication: this.deduplicator.getMetrics(),
      cache: this.context7.getCacheStats(),
    };
  }

  /**
   * Cleanup resources
   */
  close() {
    this.context7.close();
  }
}

/**
 * Example 4: Multi-agent concurrent queries
 */
async function multiAgentExample() {
  console.log('\n=== Example 3: Multi-Agent Concurrent Queries ===\n');

  const integration = new Context7AgentIntegration(async (method, params) => {
    // Mock MCP caller
    console.log(`📞 MCP: ${method}`, params);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

    if (method === 'resolve-library-id') {
      return { libraryId: `/${params.libraryName}/docs` };
    }
    return { content: [{ text: `Documentation for ${params.libraryId}: ${params.query}` }] };
  });

  try {
    const contexts: AgentContext[] = [
      { taskId: 'TASK-001', agentId: 'agent-1', sessionId: 'session-123' },
      { taskId: 'TASK-002', agentId: 'agent-2', sessionId: 'session-123' },
      { taskId: 'TASK-003', agentId: 'agent-3', sessionId: 'session-123' },
    ];

    console.log('🚀 Launching 3 agents querying different libraries...\n');

    const startTime = Date.now();

    // Launch concurrent queries from different agents
    const results = await Promise.all([
      integration.queryLibraryForTask(contexts[0], 'next.js', 'How to use Server Components?'),
      integration.queryLibraryForTask(contexts[1], 'react', 'How to use hooks?'),
      integration.queryLibraryForTask(contexts[2], 'next.js', 'How to use Server Components?'), // Duplicate query - will be deduplicated
    ]);

    const totalTime = Date.now() - startTime;

    console.log(`\n✅ All agents completed in ${totalTime}ms\n`);

    console.log('📊 Performance Metrics:');
    const metrics = integration.getPerformanceMetrics();

    console.log('\n   Context7:');
    console.log('     Total queries:', metrics.context7.totalQueries);
    console.log('     Cache hits:', metrics.context7.cacheHits);
    console.log('     Cache hit rate:', (metrics.context7.cacheHitRate * 100).toFixed(1), '%');
    console.log('     Avg query time:', metrics.context7.avgQueryTime.toFixed(2), 'ms');

    console.log('\n   Deduplication:');
    console.log('     Total requests:', metrics.deduplication.totalRequests);
    console.log('     Deduplicated:', metrics.deduplication.deduplicated);
    console.log('     Time saved:', metrics.deduplication.savedMs, 'ms');

    console.log('\n   Cache:');
    console.log('     Total entries:', metrics.cache.totalEntries);
    console.log('     Hit rate:', (metrics.cache.hitRate * 100).toFixed(1), '%');

    integration.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Context7 Client & Request Deduplicator Integration Examples ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    await basicUsageExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await deduplicationExample();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await multiAgentExample();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Export for use in other modules
export { Context7AgentIntegration, runExamples };

// Run examples if executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
