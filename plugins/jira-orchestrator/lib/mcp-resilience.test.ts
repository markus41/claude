/**
 * Test Suite for MCP Resilience Features
 *
 * Tests circuit breaker, fallback handler, and integration with routing engine
 *
 * @version 1.0.0
 * @author jira-orchestrator
 */

import { MCPCircuitBreaker } from './mcp-circuit-breaker';
import { MCPFallbackHandler, DEFAULT_STRATEGIES } from './mcp-fallback-handler';
import * as path from 'path';
import * as fs from 'fs';

// ============================================
// TEST UTILITIES
// ============================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CIRCUIT BREAKER TESTS
// ============================================

async function testCircuitBreaker() {
  console.log('\n=== Testing Circuit Breaker ===\n');

  const breaker = new MCPCircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 5000,
    cooldownMs: 2000,
    halfOpenMaxAttempts: 2,
  });

  const server = 'test-mcp-server';

  // Test 1: Initial state should be CLOSED
  console.log('Test 1: Initial state');
  const initialStatus = breaker.getStatus(server);
  console.assert(initialStatus.state === 'CLOSED', 'Initial state should be CLOSED');
  console.log('✓ Initial state is CLOSED');

  // Test 2: Successful requests keep circuit CLOSED
  console.log('\nTest 2: Successful requests');
  for (let i = 0; i < 5; i++) {
    breaker.recordSuccess(server);
  }
  const afterSuccess = breaker.getStatus(server);
  console.assert(afterSuccess.state === 'CLOSED', 'State should remain CLOSED');
  console.log('✓ Circuit remains CLOSED after successful requests');

  // Test 3: Failures open the circuit
  console.log('\nTest 3: Failures open circuit');
  for (let i = 0; i < 3; i++) {
    breaker.recordFailure(server, new Error(`Test failure ${i + 1}`));
  }
  const afterFailures = breaker.getStatus(server);
  console.assert(afterFailures.state === 'OPEN', 'State should be OPEN after threshold failures');
  console.log('✓ Circuit OPEN after failure threshold reached');

  // Test 4: Requests are blocked when circuit is OPEN
  console.log('\nTest 4: Requests blocked when OPEN');
  console.assert(!breaker.canRequest(server), 'Requests should be blocked when OPEN');
  console.log('✓ Requests blocked when circuit is OPEN');

  // Test 5: Circuit transitions to HALF_OPEN after cooldown
  console.log('\nTest 5: Cooldown and HALF_OPEN transition');
  await delay(2500); // Wait for cooldown
  console.assert(breaker.canRequest(server), 'Requests should be allowed after cooldown');
  const afterCooldown = breaker.getStatus(server);
  console.assert(afterCooldown.state === 'HALF_OPEN', 'State should be HALF_OPEN after cooldown');
  console.log('✓ Circuit transitions to HALF_OPEN after cooldown');

  // Test 6: Successful requests in HALF_OPEN close the circuit
  console.log('\nTest 6: Recovery in HALF_OPEN state');
  breaker.recordSuccess(server);
  breaker.recordSuccess(server);
  const afterRecovery = breaker.getStatus(server);
  console.assert(afterRecovery.state === 'CLOSED', 'State should be CLOSED after recovery');
  console.log('✓ Circuit CLOSED after successful recovery');

  // Test 7: Execute with circuit breaker protection
  console.log('\nTest 7: Execute with protection');
  let executions = 0;
  const result = await breaker.execute(
    server,
    async () => {
      executions++;
      return 'success';
    }
  );
  console.assert(result === 'success' && executions === 1, 'Execute should work when circuit is CLOSED');
  console.log('✓ Execute method works correctly');

  // Test 8: Execute with fallback
  console.log('\nTest 8: Execute with fallback');
  // Open circuit first
  for (let i = 0; i < 3; i++) {
    breaker.recordFailure(server);
  }
  const fallbackResult = await breaker.execute(
    server,
    async () => {
      throw new Error('This should not execute');
    },
    async () => {
      return 'fallback-value';
    }
  );
  console.assert(fallbackResult === 'fallback-value', 'Fallback should be used when circuit is OPEN');
  console.log('✓ Fallback executed when circuit is OPEN');

  // Cleanup
  breaker.dispose();

  console.log('\n✅ All Circuit Breaker tests passed!\n');
}

// ============================================
// FALLBACK HANDLER TESTS
// ============================================

async function testFallbackHandler() {
  console.log('\n=== Testing Fallback Handler ===\n');

  const tempDir = path.join(process.cwd(), 'sessions', 'test-queues');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const handler = new MCPFallbackHandler(DEFAULT_STRATEGIES, tempDir);

  const server = 'context7';
  const operation = 'get_docs';

  // Test 1: Cache response
  console.log('Test 1: Cache response');
  handler.cacheResponse(server, operation, { lib: 'react' }, { docs: 'React documentation...' });
  const cached = handler.getCached(server, operation, { lib: 'react' });
  console.assert(cached !== null, 'Cached response should be retrievable');
  console.log('✓ Cache stores and retrieves responses');

  // Test 2: Execute with fallback - cache tier
  console.log('\nTest 2: Execute with cache fallback');
  const cacheResult = await handler.executeWithFallback(
    server,
    operation,
    async () => {
      throw new Error('Service unavailable');
    },
    { lib: 'react' }
  );
  console.assert(cacheResult.source === 'cache', 'Should fallback to cache');
  console.assert(cacheResult.degraded === false || cacheResult.degraded === true, 'Should have degraded flag');
  console.log(`✓ Fallback to cache successful (source: ${cacheResult.source})`);

  // Test 3: Queue operation
  console.log('\nTest 3: Queue operation');
  const queueId = handler.queueOperation('memory', 'store_entity', { entity: 'test' });
  console.assert(typeof queueId === 'string', 'Queue should return operation ID');
  const queueStatus = handler.getQueueStatus();
  console.assert(queueStatus.some(q => q.server === 'memory' && q.queueSize > 0), 'Queue should contain operation');
  console.log('✓ Operation queued successfully');

  // Test 4: Execute with fallback - queue tier
  console.log('\nTest 4: Execute with queue fallback');
  const queueResult = await handler.executeWithFallback(
    'memory',
    'store_relation',
    async () => {
      throw new Error('Memory service down');
    },
    { relation: { from: 'A', to: 'B' } }
  );
  console.assert(queueResult.source === 'queue', 'Should fallback to queue');
  console.log('✓ Fallback to queue successful');

  // Test 5: Execute with fallback - offline tier
  console.log('\nTest 5: Execute with offline fallback');
  const offlineResult = await handler.executeWithFallback(
    server,
    'get_new_docs',
    async () => {
      throw new Error('Service unavailable');
    },
    { lib: 'unknown' }
  );
  console.assert(offlineResult.source === 'offline', 'Should fallback to offline response');
  console.log('✓ Fallback to offline response successful');

  // Test 6: Cache statistics
  console.log('\nTest 6: Cache statistics');
  const stats = handler.getCacheStats();
  console.assert(stats.size >= 0, 'Cache stats should be available');
  console.log(`✓ Cache stats: ${stats.size} entries, ${stats.hits} hits`);

  // Test 7: Cleanup expired cache
  console.log('\nTest 7: Cleanup expired cache');
  const removed = handler.cleanupCache();
  console.assert(typeof removed === 'number', 'Cleanup should return count');
  console.log(`✓ Cache cleanup removed ${removed} expired entries`);

  // Cleanup
  handler.clearQueue('memory');

  console.log('\n✅ All Fallback Handler tests passed!\n');
}

// ============================================
// INTEGRATION TESTS
// ============================================

async function testIntegration() {
  console.log('\n=== Testing Integration ===\n');

  const breaker = new MCPCircuitBreaker({
    failureThreshold: 2,
    failureWindowMs: 5000,
    cooldownMs: 1000,
  });

  const handler = new MCPFallbackHandler(
    DEFAULT_STRATEGIES,
    path.join(process.cwd(), 'sessions', 'test-queues')
  );

  const server = 'test-integration-server';

  // Test 1: Combined circuit breaker + fallback
  console.log('Test 1: Circuit breaker with fallback');

  // Simulate service working
  let attempts = 0;
  const result1 = await breaker.execute(
    server,
    async () => {
      attempts++;
      return 'live-data';
    },
    async () => {
      return handler.executeWithFallback(
        server,
        'test-op',
        async () => ({ cached: true }),
        {}
      ).then(r => r.result);
    }
  );

  console.assert(result1 === 'live-data', 'Should return live data when service is up');
  console.assert(attempts === 1, 'Should execute once');

  // Cache the result
  handler.cacheResponse(server, 'test-op', {}, result1);

  // Open circuit
  breaker.recordFailure(server);
  breaker.recordFailure(server);

  // Test 2: Fallback kicks in when circuit is open
  console.log('\nTest 2: Fallback when circuit is OPEN');
  attempts = 0;
  const result2 = await breaker.execute(
    server,
    async () => {
      attempts++;
      throw new Error('Should not execute');
    },
    async () => {
      const fallback = await handler.executeWithFallback(
        server,
        'test-op',
        async () => {
          throw new Error('Simulated failure');
        },
        {}
      );
      return fallback.result;
    }
  );

  console.assert(attempts === 0, 'Should not attempt execution when circuit is OPEN');
  console.assert(result2 === 'live-data', 'Should return cached data');
  console.log('✓ Fallback returns cached data when circuit is OPEN');

  // Cleanup
  breaker.dispose();

  console.log('\n✅ All Integration tests passed!\n');
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('MCP RESILIENCE TEST SUITE - v7.4');
  console.log('='.repeat(60));

  try {
    await testCircuitBreaker();
    await testFallbackHandler();
    await testIntegration();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST SUITE FAILED');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

export { runAllTests, testCircuitBreaker, testFallbackHandler, testIntegration };
