/**
 * Knowledge Federation Network - Main Export
 *
 * Central export point for the Knowledge Federation Network system.
 * Provides cross-agent knowledge sharing through distributed knowledge graphs.
 *
 * Usage:
 * ```typescript
 * import {
 *   KnowledgeGraph,
 *   KnowledgeFederation,
 *   KnowledgeSynthesizer,
 *   QueryEngine,
 *   KnowledgeReplication
 * } from './knowledge';
 *
 * // Create knowledge graph
 * const graph = new KnowledgeGraph({ dbPath: './knowledge.db' });
 *
 * // Initialize federation
 * const federation = new KnowledgeFederation({
 *   graph,
 *   config: {
 *     agentId: 'agent-1',
 *     peers: ['agent-2', 'agent-3'],
 *     syncMode: 'async',
 *     consistencyLevel: 'eventual',
 *     autoAccept: true,
 *     minConfidenceThreshold: 0.7,
 *   },
 * });
 *
 * // Create synthesizer for knowledge extraction
 * const synthesizer = new KnowledgeSynthesizer({ graph, agentId: 'agent-1' });
 *
 * // Create query engine
 * const queryEngine = new QueryEngine({ graph });
 *
 * // Create replication manager
 * const replication = new KnowledgeReplication({
 *   graph,
 *   federation,
 *   agentId: 'agent-1',
 * });
 * ```
 */

// Core Components
export { KnowledgeGraph } from './knowledge-graph.js';
export type { KnowledgeGraphConfig } from './knowledge-graph.js';

export { KnowledgeFederation } from './federation.js';
export type { FederationOptions } from './federation.js';

export { KnowledgeSynthesizer } from './synthesizer.js';
export type { SynthesizerOptions } from './synthesizer.js';

export { QueryEngine } from './query-engine.js';
export type { QueryEngineOptions } from './query-engine.js';

export { KnowledgeReplication } from './replication.js';
export type { ReplicationOptions } from './replication.js';

// Type Exports
export type {
  // Node and Edge Types
  KnowledgeNode,
  KnowledgeEdge,
  NodeType,

  // Query Types
  SemanticQuery,
  QueryResult,
  QueryType,
  PathQuery,
  Path,

  // Inference Types
  Inference,
  InferenceType,

  // Federation Types
  FederationConfig,
  SyncState,
  KnowledgePacket,
  SyncMode,
  ConsistencyLevel,

  // Conflict Types
  Conflict,
  ConflictType,
  ResolutionStrategy,

  // Synthesis Types
  SynthesisJob,
  Pattern,

  // Replication Types
  ReplicationLog,
  VectorClock,

  // Graph Types
  Subgraph,
  NodeDegree,
  GraphStats,
  NodeIndex,
  NamespaceConfig,

  // Error Types
  KnowledgeGraphError,
  NodeNotFoundError,
  EdgeNotFoundError,
  ConflictError,
  SyncError,
  OptimisticLockError,
} from './types.js';

/**
 * Factory function to create a complete knowledge federation system
 */
export function createKnowledgeFederationSystem(config: {
  dbPath: string;
  agentId: string;
  peers?: string[];
  namespace?: string;
  syncMode?: 'sync' | 'async' | 'event-driven';
  consistencyLevel?: 'strong' | 'eventual' | 'causal';
  autoAccept?: boolean;
  minConfidenceThreshold?: number;
  enableCache?: boolean;
  startReplication?: boolean;
  replicationIntervalMs?: number;
}) {
  // Create knowledge graph
  const graph = new KnowledgeGraph({
    dbPath: config.dbPath,
    namespace: config.namespace,
    enableCache: config.enableCache ?? true,
  });

  // Create federation if peers are provided
  let federation: KnowledgeFederation | undefined;
  if (config.peers && config.peers.length > 0) {
    federation = new KnowledgeFederation({
      graph,
      config: {
        agentId: config.agentId,
        peers: config.peers,
        syncMode: config.syncMode || 'async',
        consistencyLevel: config.consistencyLevel || 'eventual',
        autoAccept: config.autoAccept ?? true,
        minConfidenceThreshold: config.minConfidenceThreshold || 0.7,
        namespace: config.namespace,
      },
    });
  }

  // Create synthesizer
  const synthesizer = new KnowledgeSynthesizer({
    graph,
    agentId: config.agentId,
  });

  // Create query engine
  const queryEngine = new QueryEngine({ graph });

  // Create replication manager if federation exists
  let replication: KnowledgeReplication | undefined;
  if (federation) {
    replication = new KnowledgeReplication({
      graph,
      federation,
      agentId: config.agentId,
    });

    if (config.startReplication) {
      replication.startReplication(config.replicationIntervalMs || 10000);
    }
  }

  return {
    graph,
    federation,
    synthesizer,
    queryEngine,
    replication,

    /**
     * Cleanup and close all resources
     */
    close() {
      if (replication) {
        replication.stopReplication();
      }
      graph.close();
    },
  };
}

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  syncMode: 'async' as const,
  consistencyLevel: 'eventual' as const,
  autoAccept: true,
  minConfidenceThreshold: 0.7,
  enableCache: true,
  replicationIntervalMs: 10000,
  maxRetries: 3,
  retryDelayMs: 1000,
  lagThresholdMs: 5000,
};
