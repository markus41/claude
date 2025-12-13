/**
 * Knowledge Federation Network - Type Definitions
 *
 * Defines data structures for cross-agent knowledge sharing through a
 * distributed knowledge graph with semantic querying, inference, and replication.
 *
 * Architecture:
 * - Knowledge Graph: Nodes (entities/concepts) + Edges (relationships)
 * - Federation: Cross-agent knowledge synchronization
 * - Synthesis: Episodic memories → Facts + Inferences
 * - Query Engine: Semantic search with path finding
 * - Replication: Multi-agent consistency with conflict resolution
 */

// ============================================
// KNOWLEDGE NODE TYPES
// ============================================

export type NodeType = 'entity' | 'concept' | 'action' | 'relation';

/**
 * KnowledgeNode: Base unit of knowledge in the graph
 *
 * Represents entities, concepts, actions, or relations that can be
 * connected through edges to form a knowledge graph.
 */
export interface KnowledgeNode {
  /** Unique node identifier (UUID) */
  id: string;

  /** Type of node */
  type: NodeType;

  /** Human-readable label */
  label: string;

  /** Node properties/attributes */
  properties: Record<string, any>;

  /** Embedding vector for semantic similarity (384-dim) */
  embeddings?: number[];

  /** Source information */
  source: {
    /** Agent that created this node */
    agentId: string;
    /** Optional episode ID this was extracted from */
    episodeId?: string;
    /** When this node was created */
    timestamp: Date;
  };

  /** Confidence score (0-1) in this knowledge */
  confidence: number;

  /** Version number for optimistic locking */
  version: number;

  /** Namespace for multi-tenant isolation */
  namespace?: string;

  /** When node was created */
  createdAt: Date;

  /** When node was last updated */
  updatedAt: Date;

  /** Soft delete flag */
  isDeleted: boolean;
}

// ============================================
// KNOWLEDGE EDGE TYPES
// ============================================

/**
 * KnowledgeEdge: Relationship between two nodes
 *
 * Represents directed or bidirectional relationships in the knowledge graph.
 */
export interface KnowledgeEdge {
  /** Unique edge identifier (UUID) */
  id: string;

  /** Source node ID */
  sourceId: string;

  /** Target node ID */
  targetId: string;

  /** Type of relationship (e.g., 'requires', 'causes', 'is_a', 'part_of') */
  relation: string;

  /** Edge weight (strength of relationship, 0-1) */
  weight: number;

  /** Additional edge properties */
  properties?: Record<string, any>;

  /** Whether edge is bidirectional */
  bidirectional: boolean;

  /** Source information */
  source: {
    agentId: string;
    episodeId?: string;
    timestamp: Date;
  };

  /** Confidence in this relationship */
  confidence: number;

  /** Version number for optimistic locking */
  version: number;

  /** When edge was created */
  createdAt: Date;

  /** When edge was last updated */
  updatedAt: Date;

  /** Soft delete flag */
  isDeleted: boolean;
}

// ============================================
// SEMANTIC QUERY TYPES
// ============================================

export type QueryType = 'search' | 'question' | 'inference' | 'path';

/**
 * SemanticQuery: Query interface for knowledge graph
 *
 * Supports semantic search, question answering, inference, and path finding.
 */
export interface SemanticQuery {
  /** Query text */
  text: string;

  /** Type of query */
  type: QueryType;

  /** Filter criteria */
  filters?: {
    /** Filter by node types */
    nodeTypes?: NodeType[];
    /** Filter by relation types */
    relations?: string[];
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Filter by source agents */
    sources?: string[];
    /** Filter by namespace */
    namespace?: string;
    /** Date range filter */
    dateRange?: {
      start: Date;
      end: Date;
    };
  };

  /** Query options */
  options?: {
    /** Maximum number of results */
    limit?: number;
    /** Include inferred knowledge */
    includeInferred?: boolean;
    /** Maximum hops for path queries */
    maxHops?: number;
    /** Include embedding vectors */
    includeEmbeddings?: boolean;
    /** Minimum similarity score (0-1) */
    minSimilarity?: number;
  };
}

/**
 * QueryResult: Result from semantic query
 */
export interface QueryResult {
  /** Matching nodes */
  nodes: KnowledgeNode[];

  /** Matching edges */
  edges: KnowledgeEdge[];

  /** Relevance scores for each node */
  scores: Map<string, number>;

  /** Query metadata */
  metadata: {
    /** Total results before pagination */
    totalCount: number;
    /** Query execution time in ms */
    executionTimeMs: number;
    /** Whether results were truncated */
    truncated: boolean;
    /** Inferred nodes (if requested) */
    inferredNodes?: KnowledgeNode[];
  };
}

/**
 * PathQuery: Find paths between nodes
 */
export interface PathQuery {
  /** Start node ID */
  startNodeId: string;

  /** End node ID */
  endNodeId: string;

  /** Maximum path length */
  maxHops: number;

  /** Allowed relation types (empty = all) */
  allowedRelations?: string[];

  /** Whether to respect edge direction */
  directed?: boolean;
}

/**
 * Path: A path through the knowledge graph
 */
export interface Path {
  /** Nodes in path order */
  nodes: KnowledgeNode[];

  /** Edges in path order */
  edges: KnowledgeEdge[];

  /** Total path length */
  length: number;

  /** Path confidence (product of edge weights) */
  confidence: number;
}

// ============================================
// INFERENCE TYPES
// ============================================

export type InferenceType = 'deduction' | 'induction' | 'analogy';

/**
 * Inference: Derived knowledge from graph structure
 *
 * Represents knowledge that can be inferred from existing nodes and edges.
 */
export interface Inference {
  /** Unique inference identifier */
  id: string;

  /** Type of inference */
  type: InferenceType;

  /** Premise nodes used for inference */
  premise: KnowledgeNode[];

  /** Premise edges used for inference */
  premiseEdges?: KnowledgeEdge[];

  /** Conclusion node or edge */
  conclusion: KnowledgeNode | KnowledgeEdge;

  /** Confidence in inference (0-1) */
  confidence: number;

  /** Step-by-step reasoning */
  reasoning: string[];

  /** Inference rule used */
  rule?: string;

  /** When inference was made */
  timestamp: Date;

  /** Whether inference has been verified */
  verified: boolean;
}

// ============================================
// FEDERATION TYPES
// ============================================

export type SyncMode = 'sync' | 'async' | 'event-driven';
export type ConsistencyLevel = 'strong' | 'eventual' | 'causal';

/**
 * FederationConfig: Configuration for knowledge federation
 */
export interface FederationConfig {
  /** Agent ID for this federation member */
  agentId: string;

  /** List of peer agents to federate with */
  peers: string[];

  /** Synchronization mode */
  syncMode: SyncMode;

  /** Desired consistency level */
  consistencyLevel: ConsistencyLevel;

  /** Sync interval for periodic sync (ms) */
  syncIntervalMs?: number;

  /** Whether to auto-accept peer knowledge */
  autoAccept: boolean;

  /** Minimum confidence threshold for accepting knowledge */
  minConfidenceThreshold: number;

  /** Namespace for federation */
  namespace?: string;
}

/**
 * SyncState: Track synchronization state with peers
 */
export interface SyncState {
  /** Peer agent ID */
  peerId: string;

  /** Last sync timestamp */
  lastSync: Date;

  /** Last successful sync */
  lastSuccessfulSync?: Date;

  /** Vector clock for causal consistency */
  vectorClock: Map<string, number>;

  /** Number of nodes synced */
  nodesSynced: number;

  /** Number of edges synced */
  edgesSynced: number;

  /** Sync errors */
  errors: string[];

  /** Sync status */
  status: 'idle' | 'syncing' | 'error';
}

/**
 * KnowledgePacket: Bundle of knowledge for federation
 */
export interface KnowledgePacket {
  /** Source agent ID */
  sourceAgentId: string;

  /** Target agent ID (or 'broadcast') */
  targetAgentId: string;

  /** Nodes to sync */
  nodes: KnowledgeNode[];

  /** Edges to sync */
  edges: KnowledgeEdge[];

  /** Inferences to sync */
  inferences?: Inference[];

  /** Vector clock */
  vectorClock: Map<string, number>;

  /** Packet timestamp */
  timestamp: Date;

  /** Packet sequence number */
  sequenceNumber: number;

  /** Whether this requires acknowledgment */
  requiresAck: boolean;
}

// ============================================
// CONFLICT RESOLUTION TYPES
// ============================================

export type ConflictType = 'concurrent_update' | 'semantic_conflict' | 'constraint_violation';
export type ResolutionStrategy = 'latest_write_wins' | 'highest_confidence' | 'merge' | 'manual';

/**
 * Conflict: Detected conflict in knowledge
 */
export interface Conflict {
  /** Unique conflict identifier */
  id: string;

  /** Type of conflict */
  type: ConflictType;

  /** Conflicting nodes */
  nodes: KnowledgeNode[];

  /** Conflicting edges */
  edges?: KnowledgeEdge[];

  /** Agents involved in conflict */
  agents: string[];

  /** Detected timestamp */
  detectedAt: Date;

  /** Resolution status */
  status: 'unresolved' | 'resolved' | 'ignored';

  /** Resolution strategy used */
  resolutionStrategy?: ResolutionStrategy;

  /** Resolved node/edge (if resolved) */
  resolution?: KnowledgeNode | KnowledgeEdge;

  /** Resolution timestamp */
  resolvedAt?: Date;

  /** Resolution notes */
  notes?: string;
}

// ============================================
// SYNTHESIS TYPES
// ============================================

/**
 * SynthesisJob: Extract knowledge from memories
 */
export interface SynthesisJob {
  /** Job identifier */
  id: string;

  /** Source type */
  sourceType: 'episodes' | 'procedures' | 'facts';

  /** Source IDs to synthesize from */
  sourceIds: string[];

  /** Synthesis strategy */
  strategy: 'extract_entities' | 'extract_relations' | 'find_patterns' | 'generalize';

  /** Status */
  status: 'pending' | 'running' | 'completed' | 'failed';

  /** Created timestamp */
  createdAt: Date;

  /** Started timestamp */
  startedAt?: Date;

  /** Completed timestamp */
  completedAt?: Date;

  /** Output nodes created */
  outputNodes: string[];

  /** Output edges created */
  outputEdges: string[];

  /** Quality score of synthesis (0-1) */
  quality?: number;

  /** Errors encountered */
  errors: string[];
}

/**
 * Pattern: Detected pattern in knowledge
 */
export interface Pattern {
  /** Pattern identifier */
  id: string;

  /** Pattern type */
  type: 'sequence' | 'cycle' | 'cluster' | 'hierarchy';

  /** Pattern name/description */
  name: string;

  /** Nodes participating in pattern */
  nodes: string[];

  /** Edges participating in pattern */
  edges: string[];

  /** Pattern frequency (how often it occurs) */
  frequency: number;

  /** Pattern confidence (0-1) */
  confidence: number;

  /** When pattern was detected */
  detectedAt: Date;

  /** Pattern properties */
  properties: Record<string, any>;
}

// ============================================
// REPLICATION TYPES
// ============================================

/**
 * ReplicationLog: Track replicated operations
 */
export interface ReplicationLog {
  /** Log entry ID */
  id: string;

  /** Operation type */
  operation: 'create' | 'update' | 'delete';

  /** Entity type */
  entityType: 'node' | 'edge' | 'inference';

  /** Entity ID */
  entityId: string;

  /** Source agent */
  sourceAgent: string;

  /** Target agent */
  targetAgent: string;

  /** Vector clock at operation time */
  vectorClock: Map<string, number>;

  /** Operation timestamp */
  timestamp: Date;

  /** Operation status */
  status: 'pending' | 'replicated' | 'failed' | 'conflict';

  /** Retry count */
  retryCount: number;

  /** Error message (if failed) */
  error?: string;
}

/**
 * VectorClock: Track causal dependencies
 */
export interface VectorClock {
  /** Agent ID → logical clock value */
  clocks: Map<string, number>;

  /** Last updated timestamp */
  lastUpdated: Date;
}

// ============================================
// KNOWLEDGE GRAPH STATISTICS
// ============================================

/**
 * GraphStats: Knowledge graph statistics
 */
export interface GraphStats {
  /** Total nodes */
  nodeCount: number;

  /** Nodes by type */
  nodesByType: Record<NodeType, number>;

  /** Total edges */
  edgeCount: number;

  /** Edges by relation */
  edgesByRelation: Record<string, number>;

  /** Total inferences */
  inferenceCount: number;

  /** Average node degree */
  avgDegree: number;

  /** Graph density (0-1) */
  density: number;

  /** Number of connected components */
  connectedComponents: number;

  /** Average confidence */
  avgConfidence: number;

  /** Agents contributing to graph */
  contributingAgents: string[];

  /** Database size in bytes */
  databaseSize: number;

  /** Last updated */
  lastUpdated: Date;
}

// ============================================
// INDEX TYPES
// ============================================

/**
 * NodeIndex: Index entry for fast node lookup
 */
export interface NodeIndex {
  /** Node ID */
  nodeId: string;

  /** Indexed field name */
  fieldName: string;

  /** Indexed field value */
  fieldValue: string;

  /** Index type */
  indexType: 'label' | 'property' | 'embedding';

  /** Created timestamp */
  createdAt: Date;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Subgraph: A subset of the knowledge graph
 */
export interface Subgraph {
  /** Subgraph nodes */
  nodes: KnowledgeNode[];

  /** Subgraph edges */
  edges: KnowledgeEdge[];

  /** Subgraph metadata */
  metadata: {
    /** Number of nodes */
    nodeCount: number;
    /** Number of edges */
    edgeCount: number;
    /** Extraction timestamp */
    extractedAt: Date;
    /** Extraction query/criteria */
    criteria?: string;
  };
}

/**
 * NodeDegree: Node connectivity information
 */
export interface NodeDegree {
  /** Node ID */
  nodeId: string;

  /** In-degree (incoming edges) */
  inDegree: number;

  /** Out-degree (outgoing edges) */
  outDegree: number;

  /** Total degree */
  totalDegree: number;
}

/**
 * Namespace configuration
 */
export interface NamespaceConfig {
  /** Namespace name */
  name: string;

  /** Description */
  description?: string;

  /** Owner agent IDs */
  owners: string[];

  /** Read-only agents */
  readOnlyAgents?: string[];

  /** Created timestamp */
  createdAt: Date;

  /** Whether namespace is archived */
  isArchived: boolean;
}

// ============================================
// ERROR TYPES
// ============================================

export class KnowledgeGraphError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'KnowledgeGraphError';
  }
}

export class NodeNotFoundError extends KnowledgeGraphError {
  constructor(nodeId: string) {
    super(`Node not found: ${nodeId}`, 'NODE_NOT_FOUND', { nodeId });
    this.name = 'NodeNotFoundError';
  }
}

export class EdgeNotFoundError extends KnowledgeGraphError {
  constructor(edgeId: string) {
    super(`Edge not found: ${edgeId}`, 'EDGE_NOT_FOUND', { edgeId });
    this.name = 'EdgeNotFoundError';
  }
}

export class ConflictError extends KnowledgeGraphError {
  constructor(conflictId: string, message: string) {
    super(message, 'CONFLICT_ERROR', { conflictId });
    this.name = 'ConflictError';
  }
}

export class SyncError extends KnowledgeGraphError {
  constructor(peerId: string, message: string) {
    super(message, 'SYNC_ERROR', { peerId });
    this.name = 'SyncError';
  }
}

export class OptimisticLockError extends KnowledgeGraphError {
  constructor(entityId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Optimistic lock failure for ${entityId}`,
      'OPTIMISTIC_LOCK_ERROR',
      { entityId, expectedVersion, actualVersion }
    );
    this.name = 'OptimisticLockError';
  }
}
