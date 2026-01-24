/**
 * WebSocket Event Definitions
 *
 * Type-safe event definitions with Zod validation for real-time workflow execution monitoring.
 * Aligned with backend swarm_websocket.py event structure.
 *
 * Best for: Type-safe WebSocket message handling with runtime validation and comprehensive
 * event coverage for workflow execution, node state updates, and system events.
 */

import { z } from 'zod';

/**
 * WebSocket connection states
 */
export enum ConnectionStatus {
  /** Not connected */
  DISCONNECTED = 'disconnected',
  /** Attempting to connect */
  CONNECTING = 'connecting',
  /** Successfully connected */
  CONNECTED = 'connected',
  /** Attempting to reconnect after disconnect */
  RECONNECTING = 'reconnecting',
  /** Connection failed permanently */
  FAILED = 'failed',
}

/**
 * WebSocket message types (aligned with backend WSMessageType)
 */
export enum WSMessageType {
  // Connection lifecycle
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',

  // Session events
  SESSION_UPDATE = 'session_update',
  SESSION_STARTED = 'session_started',
  SESSION_COMPLETED = 'session_completed',
  SESSION_FAILED = 'session_failed',

  // Agent events
  AGENT_JOINED = 'agent_joined',
  AGENT_LEFT = 'agent_left',
  AGENT_STATUS = 'agent_status',

  // Algorithm/execution events
  ITERATION_START = 'iteration_start',
  ITERATION_COMPLETE = 'iteration_complete',
  CONVERGENCE_UPDATE = 'convergence_update',
  BEST_SOLUTION_UPDATE = 'best_solution_update',

  // Consensus events
  PROPOSAL_CREATED = 'proposal_created',
  VOTE_RECEIVED = 'vote_received',
  CONSENSUS_REACHED = 'consensus_reached',
  CONSENSUS_FAILED = 'consensus_failed',

  // Metrics
  METRICS_UPDATE = 'metrics_update',
  PHEROMONE_UPDATE = 'pheromone_update',

  // Workflow-specific events (extensions)
  NODE_STARTED = 'node_started',
  NODE_COMPLETED = 'node_completed',
  NODE_FAILED = 'node_failed',
  NODE_SKIPPED = 'node_skipped',
  WORKFLOW_STARTED = 'workflow_started',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_FAILED = 'workflow_failed',
}

/**
 * Node execution states
 */
export enum NodeExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
  WAITING = 'waiting',
}

/**
 * Base WebSocket message schema
 */
export const WSMessageSchema = z.object({
  type: z.string(),
  session_id: z.string().optional(),
  data: z.record(z.unknown()).default({}),
  timestamp: z.string(),
});

export type WSMessage = z.infer<typeof WSMessageSchema>;

/**
 * Connection event data
 */
export const ConnectDataSchema = z.object({
  agent_id: z.string(),
  connected: z.boolean(),
  total_connections: z.number(),
});

export type ConnectData = z.infer<typeof ConnectDataSchema>;

/**
 * Error event data
 */
export const ErrorDataSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type ErrorData = z.infer<typeof ErrorDataSchema>;

/**
 * Session update data
 */
export const SessionUpdateDataSchema = z.object({
  status: z.string(),
  metrics: z.record(z.unknown()),
});

export type SessionUpdateData = z.infer<typeof SessionUpdateDataSchema>;

/**
 * Agent event data
 */
export const AgentEventDataSchema = z.object({
  agent_id: z.string(),
  total_agents: z.number().optional(),
  status: z.string().optional(),
});

export type AgentEventData = z.infer<typeof AgentEventDataSchema>;

/**
 * Iteration start data
 */
export const IterationStartDataSchema = z.object({
  iteration: z.number(),
  agents_active: z.number(),
});

export type IterationStartData = z.infer<typeof IterationStartDataSchema>;

/**
 * Iteration complete data
 */
export const IterationCompleteDataSchema = z.object({
  iteration: z.number(),
  best_fitness: z.number().nullable(),
  avg_fitness: z.number().nullable(),
  improvement: z.number().nullable(),
  stagnation: z.number(),
  duration_ms: z.number(),
});

export type IterationCompleteData = z.infer<typeof IterationCompleteDataSchema>;

/**
 * Convergence update data
 */
export const ConvergenceUpdateDataSchema = z.object({
  converged: z.boolean(),
  final_fitness: z.number(),
  total_iterations: z.number(),
});

export type ConvergenceUpdateData = z.infer<typeof ConvergenceUpdateDataSchema>;

/**
 * Best solution update data
 */
export const BestSolutionUpdateDataSchema = z.object({
  fitness: z.number(),
  solution: z.unknown(),
  found_by: z.string(),
});

export type BestSolutionUpdateData = z.infer<typeof BestSolutionUpdateDataSchema>;

/**
 * Vote received data
 */
export const VoteReceivedDataSchema = z.object({
  proposal_id: z.string(),
  voter_id: z.string(),
  vote_type: z.string(),
  tally: z.record(z.number()),
});

export type VoteReceivedData = z.infer<typeof VoteReceivedDataSchema>;

/**
 * Consensus result data
 */
export const ConsensusResultDataSchema = z.object({
  proposal_id: z.string(),
  reached: z.boolean(),
  decision: z.string().nullable(),
  approval_rate: z.number(),
});

export type ConsensusResultData = z.infer<typeof ConsensusResultDataSchema>;

/**
 * Metrics update data
 */
export const MetricsUpdateDataSchema = z.record(z.unknown());

export type MetricsUpdateData = z.infer<typeof MetricsUpdateDataSchema>;

/**
 * Node execution event data
 */
export const NodeExecutionDataSchema = z.object({
  node_id: z.string(),
  status: z.nativeEnum(NodeExecutionStatus),
  progress: z.number().min(0).max(100).optional(),
  output: z.unknown().optional(),
  error: z.string().optional(),
  metrics: z.object({
    tokens_used: z.number().optional(),
    duration_ms: z.number().optional(),
  }).optional(),
});

export type NodeExecutionData = z.infer<typeof NodeExecutionDataSchema>;

/**
 * Workflow execution event data
 */
export const WorkflowExecutionDataSchema = z.object({
  workflow_id: z.string(),
  status: z.string(),
  progress: z.number().min(0).max(100).optional(),
  nodes_completed: z.number().optional(),
  nodes_total: z.number().optional(),
  metrics: z.object({
    total_tokens: z.number().optional(),
    duration_ms: z.number().optional(),
  }).optional(),
});

export type WorkflowExecutionData = z.infer<typeof WorkflowExecutionDataSchema>;

/**
 * Typed WebSocket message interfaces
 */
export interface ConnectMessage extends WSMessage {
  type: WSMessageType.CONNECT;
  data: ConnectData;
}

export interface ErrorMessage extends WSMessage {
  type: WSMessageType.ERROR;
  data: ErrorData;
}

export interface SessionUpdateMessage extends WSMessage {
  type: WSMessageType.SESSION_UPDATE;
  data: SessionUpdateData;
}

export interface AgentJoinedMessage extends WSMessage {
  type: WSMessageType.AGENT_JOINED;
  data: AgentEventData;
}

export interface AgentLeftMessage extends WSMessage {
  type: WSMessageType.AGENT_LEFT;
  data: AgentEventData;
}

export interface IterationStartMessage extends WSMessage {
  type: WSMessageType.ITERATION_START;
  data: IterationStartData;
}

export interface IterationCompleteMessage extends WSMessage {
  type: WSMessageType.ITERATION_COMPLETE;
  data: IterationCompleteData;
}

export interface ConvergenceUpdateMessage extends WSMessage {
  type: WSMessageType.CONVERGENCE_UPDATE;
  data: ConvergenceUpdateData;
}

export interface BestSolutionUpdateMessage extends WSMessage {
  type: WSMessageType.BEST_SOLUTION_UPDATE;
  data: BestSolutionUpdateData;
}

export interface VoteReceivedMessage extends WSMessage {
  type: WSMessageType.VOTE_RECEIVED;
  data: VoteReceivedData;
}

export interface ConsensusReachedMessage extends WSMessage {
  type: WSMessageType.CONSENSUS_REACHED;
  data: ConsensusResultData;
}

export interface MetricsUpdateMessage extends WSMessage {
  type: WSMessageType.METRICS_UPDATE;
  data: MetricsUpdateData;
}

export interface NodeStartedMessage extends WSMessage {
  type: WSMessageType.NODE_STARTED;
  data: NodeExecutionData;
}

export interface NodeCompletedMessage extends WSMessage {
  type: WSMessageType.NODE_COMPLETED;
  data: NodeExecutionData;
}

export interface NodeFailedMessage extends WSMessage {
  type: WSMessageType.NODE_FAILED;
  data: NodeExecutionData;
}

export interface WorkflowStartedMessage extends WSMessage {
  type: WSMessageType.WORKFLOW_STARTED;
  data: WorkflowExecutionData;
}

export interface WorkflowCompletedMessage extends WSMessage {
  type: WSMessageType.WORKFLOW_COMPLETED;
  data: WorkflowExecutionData;
}

/**
 * Union type of all typed messages
 */
export type TypedWSMessage =
  | ConnectMessage
  | ErrorMessage
  | SessionUpdateMessage
  | AgentJoinedMessage
  | AgentLeftMessage
  | IterationStartMessage
  | IterationCompleteMessage
  | ConvergenceUpdateMessage
  | BestSolutionUpdateMessage
  | VoteReceivedMessage
  | ConsensusReachedMessage
  | MetricsUpdateMessage
  | NodeStartedMessage
  | NodeCompletedMessage
  | NodeFailedMessage
  | WorkflowStartedMessage
  | WorkflowCompletedMessage;

/**
 * Event handler callback type
 */
export type EventHandler<T = unknown> = (data: T, message: WSMessage) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Validate and parse WebSocket message
 */
export function parseWSMessage(raw: unknown): WSMessage {
  return WSMessageSchema.parse(raw);
}

/**
 * Type guard for specific message types
 */
export function isMessageType<T extends WSMessageType>(
  message: WSMessage,
  type: T
): message is WSMessage & { type: T } {
  return message.type === type;
}

/**
 * Parse typed message data
 */
export function parseMessageData<T>(
  message: WSMessage,
  schema: z.ZodSchema<T>
): T {
  return schema.parse(message.data);
}
