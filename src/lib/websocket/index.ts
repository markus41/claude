/**
 * WebSocket Library
 *
 * Production-ready WebSocket infrastructure for real-time workflow execution monitoring.
 * Provides type-safe event handling, automatic reconnection, and robust error recovery.
 *
 * @example
 * ```typescript
 * import { WebSocketClient, WSMessageType, ConnectionStatus } from '@/lib/websocket';
 *
 * const client = new WebSocketClient({
 *   url: 'ws://localhost:8000/ws/swarm',
 *   sessionId: 'workflow-123',
 *   agentId: 'monitor-1',
 * });
 *
 * client.on(WSMessageType.NODE_STARTED, (data) => {
 *   console.log('Node started:', data);
 * });
 *
 * client.onClientEvent('statusChange', (status) => {
 *   console.log('Connection status:', status);
 * });
 *
 * await client.connect();
 * ```
 */

// Client
export { WebSocketClient } from './client';
export type { WebSocketClientConfig, WebSocketClientEvents } from './client';

// Events
export {
  ConnectionStatus,
  WSMessageType,
  NodeExecutionStatus,
  parseWSMessage,
  isMessageType,
  parseMessageData,
} from './events';

export type {
  WSMessage,
  TypedWSMessage,
  EventHandler,
  EventSubscription,
  // Connection events
  ConnectData,
  ConnectMessage,
  ErrorData,
  ErrorMessage,
  // Session events
  SessionUpdateData,
  SessionUpdateMessage,
  // Agent events
  AgentEventData,
  AgentJoinedMessage,
  AgentLeftMessage,
  // Iteration events
  IterationStartData,
  IterationStartMessage,
  IterationCompleteData,
  IterationCompleteMessage,
  // Convergence events
  ConvergenceUpdateData,
  ConvergenceUpdateMessage,
  BestSolutionUpdateData,
  BestSolutionUpdateMessage,
  // Consensus events
  VoteReceivedData,
  VoteReceivedMessage,
  ConsensusResultData,
  ConsensusReachedMessage,
  // Metrics events
  MetricsUpdateData,
  MetricsUpdateMessage,
  // Node execution events
  NodeExecutionData,
  NodeStartedMessage,
  NodeCompletedMessage,
  NodeFailedMessage,
  // Workflow execution events
  WorkflowExecutionData,
  WorkflowStartedMessage,
  WorkflowCompletedMessage,
} from './events';

// Reconnection
export {
  ReconnectionManager,
  calculateBackoffDelay,
  shouldReconnect,
  createReconnectionState,
  advanceReconnectionState,
  resetReconnectionState,
  delay,
  retryWithBackoff,
  DEFAULT_RECONNECTION_CONFIG,
} from './reconnection';

export type {
  ReconnectionConfig,
  ReconnectionState,
} from './reconnection';
