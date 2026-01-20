/**
 * ============================================================================
 * JIRA ORCHESTRATOR - DATABASE CLIENT
 * ============================================================================
 * Neon PostgreSQL connection with Prisma ORM
 *
 * Features:
 * - Connection pooling via Neon serverless driver
 * - Type-safe queries with Prisma
 * - Automatic connection management
 * - Real-time subscriptions support
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import { PrismaClient } from './generated/prisma';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Enable WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// ============================================================================
// SINGLETON PATTERN FOR PRISMA CLIENT
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with Neon serverless adapter
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Create Neon connection pool
  const pool = new Pool({ connectionString });

  // Create Prisma adapter for Neon
  const adapter = new PrismaNeon(pool);

  // Create Prisma client with adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
}

/**
 * Get or create Prisma client instance
 * Uses singleton pattern to prevent multiple connections in development
 */
export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connect to database
 */
export async function connect(): Promise<void> {
  await prisma.$connect();
  console.log('[Database] Connected to Neon PostgreSQL');
}

/**
 * Disconnect from database
 */
export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
  console.log('[Database] Disconnected from Neon PostgreSQL');
}

/**
 * Health check - verify database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('[Database] Health check failed:', error);
    return false;
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  Orchestration,
  Event,
  Checkpoint,
  AgentExecution,
  AgentMetric,
  OrchestrationMetric,
  SlaDefinition,
  SlaViolation,
  Notification,
  Approval,
  Team,
  TeamCapacity,
  Pattern,
  TaskOutcome,
} from './generated/prisma';

export {
  Phase,
  Status,
  AgentStatus,
  Channel,
  NotificationStatus,
  ApprovalStatus,
  SlaViolationSeverity,
} from './generated/prisma';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create or get orchestration for an issue
 */
export async function getOrCreateOrchestration(
  issueKey: string,
  projectKey: string,
  createdBy?: string
) {
  // Check for existing active orchestration
  const existing = await prisma.orchestration.findFirst({
    where: {
      issueKey,
      status: 'ACTIVE',
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  if (existing) {
    return existing;
  }

  // Create new orchestration
  return prisma.orchestration.create({
    data: {
      issueKey,
      projectKey,
      createdBy,
      currentPhase: 'EXPLORE',
      status: 'ACTIVE',
    },
  });
}

/**
 * Record an event in the event store
 */
export async function recordEvent(
  orchestrationId: string,
  eventType: string,
  payload: Record<string, unknown>,
  options?: {
    agentName?: string;
    actorId?: string;
    actorEmail?: string;
    phase?: 'EXPLORE' | 'PLAN' | 'CODE' | 'TEST' | 'FIX' | 'DOCUMENT';
    correlationId?: string;
  }
) {
  return prisma.event.create({
    data: {
      orchestrationId,
      eventType,
      payload,
      agentName: options?.agentName,
      actorId: options?.actorId,
      actorEmail: options?.actorEmail,
      phase: options?.phase,
      correlationId: options?.correlationId,
    },
  });
}

/**
 * Update orchestration phase
 */
export async function updatePhase(
  orchestrationId: string,
  phase: 'EXPLORE' | 'PLAN' | 'CODE' | 'TEST' | 'FIX' | 'DOCUMENT'
) {
  return prisma.orchestration.update({
    where: { id: orchestrationId },
    data: { currentPhase: phase },
  });
}

/**
 * Complete an orchestration
 */
export async function completeOrchestration(
  orchestrationId: string,
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'COMPLETED'
) {
  const orchestration = await prisma.orchestration.findUnique({
    where: { id: orchestrationId },
  });

  if (!orchestration) {
    throw new Error(`Orchestration ${orchestrationId} not found`);
  }

  const durationMs = Date.now() - orchestration.startedAt.getTime();

  return prisma.orchestration.update({
    where: { id: orchestrationId },
    data: {
      status,
      completedAt: new Date(),
      durationMs,
    },
  });
}

/**
 * Get orchestration with all related data
 */
export async function getOrchestrationWithRelations(orchestrationId: string) {
  return prisma.orchestration.findUnique({
    where: { id: orchestrationId },
    include: {
      events: {
        orderBy: { timestamp: 'desc' },
        take: 100,
      },
      checkpoints: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      agents: {
        orderBy: { startedAt: 'desc' },
      },
      metrics: {
        orderBy: { timestamp: 'desc' },
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      approvals: {
        orderBy: { requestedAt: 'desc' },
      },
    },
  });
}

/**
 * Record agent execution start
 */
export async function startAgentExecution(
  orchestrationId: string,
  agentName: string,
  model?: string,
  input?: Record<string, unknown>
) {
  return prisma.agentExecution.create({
    data: {
      orchestrationId,
      agentName,
      model,
      input,
      status: 'RUNNING',
    },
  });
}

/**
 * Complete agent execution
 */
export async function completeAgentExecution(
  executionId: string,
  result: Record<string, unknown>,
  tokensUsed?: number
) {
  const execution = await prisma.agentExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw new Error(`Agent execution ${executionId} not found`);
  }

  const durationMs = Date.now() - execution.startedAt.getTime();

  return prisma.agentExecution.update({
    where: { id: executionId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      durationMs,
      result,
      tokensUsed,
    },
  });
}

/**
 * Fail agent execution
 */
export async function failAgentExecution(
  executionId: string,
  errorType: string,
  errorMessage: string
) {
  const execution = await prisma.agentExecution.findUnique({
    where: { id: executionId },
  });

  if (!execution) {
    throw new Error(`Agent execution ${executionId} not found`);
  }

  const durationMs = Date.now() - execution.startedAt.getTime();

  return prisma.agentExecution.update({
    where: { id: executionId },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      durationMs,
      errorType,
      errorMessage,
    },
  });
}

/**
 * Update agent metrics aggregate
 */
export async function updateAgentMetrics(
  agentName: string,
  execution: {
    success: boolean;
    durationMs: number;
    tokensUsed?: number;
    model?: string;
    errorType?: string;
  }
) {
  const existing = await prisma.agentMetric.findUnique({
    where: { agentName },
  });

  if (!existing) {
    // Create new metrics record
    return prisma.agentMetric.create({
      data: {
        agentName,
        executionCount: 1,
        successCount: execution.success ? 1 : 0,
        failureCount: execution.success ? 0 : 1,
        avgDurationMs: execution.durationMs,
        totalTokensUsed: BigInt(execution.tokensUsed ?? 0),
        modelDistribution: execution.model ? { [execution.model]: 1 } : {},
        errorTypes: execution.errorType ? { [execution.errorType]: 1 } : {},
        lastExecutedAt: new Date(),
      },
    });
  }

  // Update existing metrics
  const newCount = existing.executionCount + 1;
  const newSuccessCount = existing.successCount + (execution.success ? 1 : 0);
  const newFailureCount = existing.failureCount + (execution.success ? 0 : 1);

  // Calculate new average duration
  const newAvgDuration = existing.avgDurationMs
    ? ((existing.avgDurationMs * existing.executionCount) + execution.durationMs) / newCount
    : execution.durationMs;

  // Update model distribution
  const modelDist = (existing.modelDistribution as Record<string, number>) || {};
  if (execution.model) {
    modelDist[execution.model] = (modelDist[execution.model] || 0) + 1;
  }

  // Update error types
  const errorTypes = (existing.errorTypes as Record<string, number>) || {};
  if (execution.errorType) {
    errorTypes[execution.errorType] = (errorTypes[execution.errorType] || 0) + 1;
  }

  return prisma.agentMetric.update({
    where: { agentName },
    data: {
      executionCount: newCount,
      successCount: newSuccessCount,
      failureCount: newFailureCount,
      avgDurationMs: newAvgDuration,
      totalTokensUsed: existing.totalTokensUsed + BigInt(execution.tokensUsed ?? 0),
      modelDistribution: modelDist,
      errorTypes,
      lastExecutedAt: new Date(),
    },
  });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default prisma;
