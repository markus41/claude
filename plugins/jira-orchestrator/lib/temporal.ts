/**
 * ============================================================================
 * JIRA ORCHESTRATOR - TEMPORAL CLIENT
 * ============================================================================
 * Temporal Cloud connection for durable workflow orchestration
 *
 * Features:
 * - Temporal Cloud integration with API key authentication
 * - Connection pooling and retry logic
 * - Workflow client for starting/querying workflows
 * - Worker setup for processing workflows
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import { Connection, Client, type ConnectionOptions } from '@temporalio/client';
import { NativeConnection, Worker, type WorkerOptions } from '@temporalio/worker';
import * as activities from './activities';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface TemporalConfig {
  address: string;
  namespace: string;
  apiKey: string;
  taskQueue: string;
}

/**
 * Get Temporal configuration from environment
 */
export function getConfig(): TemporalConfig {
  const address = process.env.TEMPORAL_ADDRESS;
  const namespace = process.env.TEMPORAL_NAMESPACE;
  const apiKey = process.env.TEMPORAL_API_KEY;
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || 'jira-orchestration';

  if (!address || !namespace || !apiKey) {
    throw new Error(
      'Missing Temporal configuration. Required: TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, TEMPORAL_API_KEY'
    );
  }

  return { address, namespace, apiKey, taskQueue };
}

/**
 * Check if Temporal is enabled
 */
export function isEnabled(): boolean {
  return process.env.FEATURE_TEMPORAL_ENABLED === 'true';
}

// ============================================================================
// CLIENT CONNECTION
// ============================================================================

let _connection: Connection | null = null;
let _client: Client | null = null;

/**
 * Create connection options for Temporal Cloud
 */
function getConnectionOptions(config: TemporalConfig): ConnectionOptions {
  return {
    address: config.address,
    apiKey: config.apiKey,
    tls: true, // Required for Temporal Cloud
  };
}

/**
 * Get or create Temporal connection
 */
export async function getConnection(): Promise<Connection> {
  if (_connection) {
    return _connection;
  }

  const config = getConfig();
  console.log(`[Temporal] Connecting to ${config.address}...`);

  _connection = await Connection.connect(getConnectionOptions(config));
  console.log(`[Temporal] Connected to namespace: ${config.namespace}`);

  return _connection;
}

/**
 * Get or create Temporal client
 */
export async function getClient(): Promise<Client> {
  if (_client) {
    return _client;
  }

  const config = getConfig();
  const connection = await getConnection();

  _client = new Client({
    connection,
    namespace: config.namespace,
  });

  return _client;
}

/**
 * Close Temporal connection
 */
export async function closeConnection(): Promise<void> {
  if (_connection) {
    await _connection.close();
    _connection = null;
    _client = null;
    console.log('[Temporal] Connection closed');
  }
}

// ============================================================================
// WORKFLOW CLIENT OPERATIONS
// ============================================================================

export interface StartWorkflowOptions {
  issueKey: string;
  projectKey?: string;
  createdBy?: string;
  autoProceed?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Start a new Jira orchestration workflow
 */
export async function startOrchestration(
  options: StartWorkflowOptions
): Promise<{
  workflowId: string;
  runId: string;
}> {
  const client = await getClient();
  const config = getConfig();

  // Import workflow type dynamically to avoid circular deps
  const { jiraOrchestrationWorkflow } = await import('./workflows/jira-orchestration');

  const workflowId = `jira-${options.issueKey}-${Date.now()}`;

  const handle = await client.workflow.start(jiraOrchestrationWorkflow, {
    taskQueue: config.taskQueue,
    workflowId,
    args: [{
      issueKey: options.issueKey,
      projectKey: options.projectKey,
      createdBy: options.createdBy,
      autoProceed: options.autoProceed ?? false,
      metadata: options.metadata,
    }],
  });

  console.log(`[Temporal] Started workflow ${workflowId} for ${options.issueKey}`);

  return {
    workflowId: handle.workflowId,
    runId: handle.firstExecutionRunId,
  };
}

/**
 * Get workflow handle by ID
 */
export async function getWorkflowHandle(workflowId: string) {
  const client = await getClient();
  return client.workflow.getHandle(workflowId);
}

/**
 * Query workflow state
 */
export async function queryWorkflowState(workflowId: string): Promise<{
  currentPhase: string;
  status: string;
  progress: Record<string, unknown>;
} | null> {
  try {
    const handle = await getWorkflowHandle(workflowId);
    return await handle.query('getState');
  } catch (error) {
    console.error(`[Temporal] Failed to query workflow ${workflowId}:`, error);
    return null;
  }
}

/**
 * Signal workflow to proceed to next phase
 */
export async function signalProceed(workflowId: string): Promise<void> {
  const handle = await getWorkflowHandle(workflowId);
  await handle.signal('proceed');
  console.log(`[Temporal] Signaled workflow ${workflowId} to proceed`);
}

/**
 * Signal workflow to pause
 */
export async function signalPause(workflowId: string): Promise<void> {
  const handle = await getWorkflowHandle(workflowId);
  await handle.signal('pause');
  console.log(`[Temporal] Signaled workflow ${workflowId} to pause`);
}

/**
 * Signal workflow to cancel
 */
export async function cancelWorkflow(workflowId: string): Promise<void> {
  const handle = await getWorkflowHandle(workflowId);
  await handle.cancel();
  console.log(`[Temporal] Cancelled workflow ${workflowId}`);
}

/**
 * Get workflow result (waits for completion)
 */
export async function getWorkflowResult<T>(workflowId: string): Promise<T> {
  const handle = await getWorkflowHandle(workflowId);
  return handle.result();
}

/**
 * List running workflows for an issue
 */
export async function listWorkflowsForIssue(issueKey: string): Promise<Array<{
  workflowId: string;
  runId: string;
  status: string;
  startTime: Date;
}>> {
  const client = await getClient();

  const workflows: Array<{
    workflowId: string;
    runId: string;
    status: string;
    startTime: Date;
  }> = [];

  for await (const workflow of client.workflow.list({
    query: `WorkflowId STARTS_WITH "jira-${issueKey}"`,
  })) {
    workflows.push({
      workflowId: workflow.workflowId,
      runId: workflow.runId,
      status: workflow.status.name,
      startTime: workflow.startTime,
    });
  }

  return workflows;
}

// ============================================================================
// WORKER
// ============================================================================

let _worker: Worker | null = null;

/**
 * Create and start a Temporal worker
 */
export async function startWorker(): Promise<Worker> {
  if (_worker) {
    return _worker;
  }

  const config = getConfig();

  // Create native connection for worker
  const connection = await NativeConnection.connect({
    address: config.address,
    apiKey: config.apiKey,
    tls: true,
  });

  const workerOptions: WorkerOptions = {
    connection,
    namespace: config.namespace,
    taskQueue: config.taskQueue,
    workflowsPath: require.resolve('./workflows/jira-orchestration'),
    activities,
  };

  _worker = await Worker.create(workerOptions);
  console.log(`[Temporal] Worker started on task queue: ${config.taskQueue}`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('[Temporal] Shutting down worker...');
    await stopWorker();
    process.exit(0);
  });

  // Start the worker (non-blocking)
  _worker.run().catch((err) => {
    console.error('[Temporal] Worker error:', err);
  });

  return _worker;
}

/**
 * Stop the Temporal worker
 */
export async function stopWorker(): Promise<void> {
  if (_worker) {
    _worker.shutdown();
    _worker = null;
    console.log('[Temporal] Worker stopped');
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check - verify Temporal connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!isEnabled()) {
      return true; // Skip if disabled
    }

    const client = await getClient();
    const config = getConfig();

    // Try to list workflows (validates connection)
    const workflows = client.workflow.list({
      query: 'WorkflowType = "jiraOrchestrationWorkflow"',
    });

    // Just check if we can iterate (validates auth)
    for await (const _ of workflows) {
      break; // Only need to check first one
    }

    console.log(`[Temporal] Health check passed for namespace: ${config.namespace}`);
    return true;
  } catch (error) {
    console.error('[Temporal] Health check failed:', error);
    return false;
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  getConfig,
  isEnabled,
  getConnection,
  getClient,
  closeConnection,
  startOrchestration,
  getWorkflowHandle,
  queryWorkflowState,
  signalProceed,
  signalPause,
  cancelWorkflow,
  getWorkflowResult,
  listWorkflowsForIssue,
  startWorker,
  stopWorker,
  healthCheck,
};
