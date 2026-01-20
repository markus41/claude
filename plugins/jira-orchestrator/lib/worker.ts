/**
 * ============================================================================
 * JIRA ORCHESTRATOR - TEMPORAL WORKER
 * ============================================================================
 * Entry point for starting the Temporal worker process.
 * The worker executes workflows and activities.
 *
 * Usage:
 *   npm run temporal:worker
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import 'dotenv/config';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { getConfig, isEnabled } from './temporal';

async function main() {
  // Check if Temporal is enabled
  if (!isEnabled()) {
    console.log('[Worker] Temporal is disabled. Set FEATURE_TEMPORAL_ENABLED=true to enable.');
    process.exit(0);
  }

  const config = getConfig();

  console.log('='.repeat(60));
  console.log('JIRA ORCHESTRATOR - TEMPORAL WORKER');
  console.log('='.repeat(60));
  console.log(`Namespace: ${config.namespace}`);
  console.log(`Task Queue: ${config.taskQueue}`);
  console.log(`Address: ${config.address}`);
  console.log('='.repeat(60));

  // Create native connection for worker
  const connection = await NativeConnection.connect({
    address: config.address,
    apiKey: config.apiKey,
    tls: true, // Required for Temporal Cloud
  });

  console.log('[Worker] Connected to Temporal Cloud');

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: config.namespace,
    taskQueue: config.taskQueue,
    workflowsPath: require.resolve('./workflows/jira-orchestration'),
    activities,
  });

  console.log('[Worker] Worker created, starting...');

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n[Worker] Shutting down...');
    worker.shutdown();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Run the worker
  try {
    await worker.run();
    console.log('[Worker] Worker stopped');
  } catch (error) {
    console.error('[Worker] Worker error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});
