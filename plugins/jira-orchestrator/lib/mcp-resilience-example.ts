/**
 * MCP Resilience Usage Examples
 *
 * Demonstrates how to use circuit breaker, fallback handler,
 * and integrated routing engine with MCP resilience features.
 *
 * @version 1.0.0
 * @author jira-orchestrator
 */

import { MCPCircuitBreaker, getCircuitBreaker } from './mcp-circuit-breaker';
import { MCPFallbackHandler, getFallbackHandler, DEFAULT_STRATEGIES } from './mcp-fallback-handler';
import { RoutingEngine } from './routing-engine';
import { MessageBus, getMessageBus } from './messagebus';

// ============================================
// EXAMPLE 1: Basic Circuit Breaker Usage
// ============================================

async function example1_basicCircuitBreaker() {
  console.log('\n=== Example 1: Basic Circuit Breaker ===\n');

  const breaker = getCircuitBreaker();

  // Simulate calling an MCP service
  const mcpCall = async (success: boolean) => {
    if (!success) {
      throw new Error('MCP service unavailable');
    }
    return { data: 'Success!' };
  };

  // Execute with circuit breaker protection
  try {
    const result = await breaker.execute(
      'context7',
      async () => mcpCall(true),
      async () => ({ data: 'Cached documentation', cached: true })
    );

    console.log('Result:', result);
  } catch (error) {
    console.error('Failed:', error);
  }

  // Check circuit status
  const status = breaker.getStatus('context7');
  console.log('Circuit Status:', {
    state: status.state,
    failures: status.failureCount,
    successes: status.consecutiveSuccesses,
  });
}

// ============================================
// EXAMPLE 2: Fallback Handler with Tiers
// ============================================

async function example2_fallbackHandler() {
  console.log('\n=== Example 2: Fallback Handler ===\n');

  const handler = getFallbackHandler();

  // Simulate MCP call that fails
  const result = await handler.executeWithFallback(
    'context7',
    'get_documentation',
    async () => {
      throw new Error('Service down');
    },
    { library: 'react' }
  );

  console.log('Fallback Result:', {
    source: result.source,      // 'cache' | 'queue' | 'offline'
    degraded: result.degraded,  // true if using fallback
    message: result.message,
    data: result.result,
  });

  // Cache a successful response for future use
  handler.cacheResponse(
    'context7',
    'get_documentation',
    { library: 'react' },
    { docs: 'React documentation content...' }
  );

  // Get cache statistics
  const stats = handler.getCacheStats();
  console.log('Cache Stats:', {
    entries: stats.size,
    totalHits: stats.hits,
    servers: Array.from(stats.servers.keys()),
  });
}

// ============================================
// EXAMPLE 3: Queue Management
// ============================================

async function example3_queueManagement() {
  console.log('\n=== Example 3: Queue Management ===\n');

  const handler = getFallbackHandler();

  // Queue an operation when service is down
  const queueId = handler.queueOperation(
    'memory',
    'store_entity',
    {
      entity: {
        id: 'user-123',
        type: 'user',
        properties: { name: 'John Doe', email: 'john@example.com' },
      },
    }
  );

  console.log('Operation queued:', queueId);

  // Check queue status
  const queueStatus = handler.getQueueStatus();
  for (const status of queueStatus) {
    console.log(`${status.server}: ${status.queueSize} operations queued`);
  }

  // Process queue when service recovers
  const result = await handler.processQueue('memory');
  console.log('Queue processed:', {
    processed: result.processed,
    failed: result.failed,
  });
}

// ============================================
// EXAMPLE 4: Integrated Routing Engine
// ============================================

async function example4_integratedRouting() {
  console.log('\n=== Example 4: Integrated Routing Engine ===\n');

  // Initialize message bus
  const messageBus = getMessageBus('jira-orchestrator');

  // Create routing engine (includes circuit breaker and fallback handler)
  const router = new RoutingEngine(messageBus);

  // Get circuit status for all MCP servers
  const circuits = router.getCircuitStatus();
  console.log('Circuit Status:');
  for (const circuit of circuits) {
    console.log(`  ${circuit.server}: ${circuit.state} (${circuit.failureCount} failures)`);
  }

  // Get queue status
  const queues = router.getQueueStatus();
  console.log('\nQueue Status:');
  for (const queue of queues) {
    console.log(`  ${queue.server}: ${queue.queueSize} operations`);
  }

  // Get cache statistics
  const cacheStats = router.getCacheStats();
  console.log('\nCache Statistics:', {
    entries: cacheStats.size,
    hits: cacheStats.hits,
    servers: cacheStats.servers.size,
  });
}

// ============================================
// EXAMPLE 5: Message Bus with Deduplication
// ============================================

async function example5_deduplication() {
  console.log('\n=== Example 5: Message Bus Deduplication ===\n');

  const messageBus = getMessageBus('jira-orchestrator');

  // Publish identical messages - only one will be processed
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      messageBus.publish({
        topic: 'routing/decision',
        messageType: 'event' as any,
        payload: { decision: 'route-to-plugin-a' },
      })
    );
  }

  await Promise.all(promises);

  // Get deduplication metrics
  const dedupMetrics = messageBus.getDeduplicationMetrics();
  console.log('Deduplication Metrics:', {
    totalRequests: dedupMetrics.totalRequests,
    deduplicated: dedupMetrics.deduplicated,
    deduplicationRate: `${(dedupMetrics.deduplicationRate * 100).toFixed(1)}%`,
    timeSaved: `${dedupMetrics.savedMs}ms`,
  });

  // Get comprehensive message bus stats
  const stats = messageBus.getStats();
  console.log('\nMessage Bus Stats:', {
    subscriptions: stats.subscriptions,
    pendingRequests: stats.pendingRequests,
    topics: stats.topics.length,
    deduplication: stats.deduplication,
  });
}

// ============================================
// EXAMPLE 6: Custom Configuration
// ============================================

async function example6_customConfiguration() {
  console.log('\n=== Example 6: Custom Configuration ===\n');

  // Custom circuit breaker
  const customBreaker = new MCPCircuitBreaker({
    failureThreshold: 10,       // More tolerant
    failureWindowMs: 120000,    // 2 minutes
    cooldownMs: 60000,          // 1 minute cooldown
    halfOpenMaxAttempts: 5,     // More attempts to verify recovery
    onStateChange: (server, oldState, newState) => {
      console.log(`🔄 ${server}: ${oldState} → ${newState}`);
    },
  });

  // Custom fallback strategy
  const customStrategy = [
    {
      server: 'my-custom-mcp',
      tiers: ['cache', 'queue', 'offline'] as const,
      cacheOptions: {
        maxAge: 600000,   // 10 minutes
        staleOk: false,   // Only fresh cache
      },
      queueOptions: {
        maxQueueSize: 200,
        persistQueue: true,
        retryIntervalMs: 30000,
      },
      offlineResponse: {
        status: 'offline',
        message: 'Custom MCP service is currently unavailable',
      },
    },
  ];

  const customHandler = new MCPFallbackHandler(customStrategy, './custom-queues');

  console.log('Custom configuration created');
}

// ============================================
// EXAMPLE 7: Event Listeners
// ============================================

async function example7_eventListeners() {
  console.log('\n=== Example 7: Event Listeners ===\n');

  const breaker = getCircuitBreaker();

  // Listen to circuit breaker events
  breaker.on('circuit-opened', (event: any) => {
    console.log(`⚠️  Circuit OPENED: ${event.server}`);
    console.log(`   Reason: ${event.reason}`);
    console.log(`   Failures: ${event.failureCount}`);
  });

  breaker.on('circuit-closed', (event: any) => {
    console.log(`✅ Circuit CLOSED: ${event.server}`);
    console.log(`   Recovery time: ${event.recoveryTime}ms`);
  });

  breaker.on('circuit-half-open', (event: any) => {
    console.log(`🔄 Circuit HALF-OPEN: ${event.server}`);
    console.log(`   Testing recovery...`);
  });

  // Simulate failures to trigger events
  for (let i = 0; i < 5; i++) {
    breaker.recordFailure('test-server', new Error('Test failure'));
  }

  // Wait a bit to see events
  await new Promise(resolve => setTimeout(resolve, 100));
}

// ============================================
// EXAMPLE 8: Production Usage Pattern
// ============================================

async function example8_productionPattern() {
  console.log('\n=== Example 8: Production Usage Pattern ===\n');

  const breaker = getCircuitBreaker();
  const handler = getFallbackHandler();

  // Production-ready MCP call wrapper
  async function callMCP<T>(
    server: string,
    operation: string,
    params: any
  ): Promise<T> {
    return breaker.execute(
      server,
      async () => {
        // Actual MCP call here
        console.log(`Calling ${server}:${operation}`);
        // return await mcpClient.call(operation, params);

        // Simulated response
        return { success: true, data: 'MCP response' } as T;
      },
      async () => {
        // Fallback with handler
        const fallback = await handler.executeWithFallback(
          server,
          operation,
          async () => {
            throw new Error('Circuit is open');
          },
          params
        );

        if (fallback.source !== 'live') {
          console.log(`⚠️  Using fallback (${fallback.source}) for ${server}:${operation}`);
        }

        return fallback.result as T;
      }
    );
  }

  // Use the wrapper
  try {
    const result = await callMCP('context7', 'get_docs', { lib: 'react' });
    console.log('Result:', result);
  } catch (error) {
    console.error('Failed even with fallback:', error);
  }
}

// ============================================
// RUN ALL EXAMPLES
// ============================================

async function runAllExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('MCP RESILIENCE USAGE EXAMPLES');
  console.log('='.repeat(60));

  try {
    await example1_basicCircuitBreaker();
    await example2_fallbackHandler();
    await example3_queueManagement();
    await example4_integratedRouting();
    await example5_deduplication();
    await example6_customConfiguration();
    await example7_eventListeners();
    await example8_productionPattern();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL EXAMPLES COMPLETED');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1_basicCircuitBreaker,
  example2_fallbackHandler,
  example3_queueManagement,
  example4_integratedRouting,
  example5_deduplication,
  example6_customConfiguration,
  example7_eventListeners,
  example8_productionPattern,
  runAllExamples,
};
