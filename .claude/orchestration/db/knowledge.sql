-- Knowledge Federation Network - Database Schema
-- SQLite with FTS5 and graph-optimized queries
-- Version: 1.0.0
--
-- This schema supports:
-- - Distributed knowledge graph with nodes and edges
-- - Cross-agent federation and synchronization
-- - Semantic querying and inference
-- - Conflict detection and resolution
-- - Efficient graph traversal for 100K+ nodes

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- Optimize for graph queries
PRAGMA cache_size = -64000; -- 64MB cache
PRAGMA temp_store = MEMORY;

-- =============================================================================
-- KNOWLEDGE NODES TABLE
-- Base entities, concepts, actions, and relations in the knowledge graph
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('entity', 'concept', 'action', 'relation')),
  label TEXT NOT NULL,
  properties TEXT NOT NULL, -- JSON
  embeddings BLOB, -- Serialized float32 array (384 dimensions)

  -- Source tracking
  source_agent_id TEXT NOT NULL,
  source_episode_id TEXT, -- Optional link to episodic memory
  source_timestamp INTEGER NOT NULL, -- Unix timestamp in milliseconds

  -- Quality and versioning
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  version INTEGER NOT NULL DEFAULT 1,

  -- Multi-tenancy
  namespace TEXT DEFAULT 'default',

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,

  -- Soft delete
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1))
);

-- Indexes for nodes
CREATE INDEX IF NOT EXISTS idx_nodes_type ON knowledge_nodes(type) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_label ON knowledge_nodes(label) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_source_agent ON knowledge_nodes(source_agent_id) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_source_episode ON knowledge_nodes(source_episode_id) WHERE source_episode_id IS NOT NULL AND is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_namespace ON knowledge_nodes(namespace) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_confidence ON knowledge_nodes(confidence DESC) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_nodes_created_at ON knowledge_nodes(created_at DESC) WHERE is_deleted = 0;

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_nodes_type_namespace ON knowledge_nodes(type, namespace, confidence DESC) WHERE is_deleted = 0;

-- =============================================================================
-- KNOWLEDGE EDGES TABLE
-- Relationships between nodes in the knowledge graph
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 1),
  properties TEXT, -- JSON
  bidirectional INTEGER NOT NULL DEFAULT 0 CHECK(bidirectional IN (0, 1)),

  -- Source tracking
  source_agent_id TEXT NOT NULL,
  source_episode_id TEXT,
  source_timestamp INTEGER NOT NULL,

  -- Quality and versioning
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,

  -- Soft delete
  is_deleted INTEGER NOT NULL DEFAULT 0 CHECK(is_deleted IN (0, 1)),

  -- Foreign keys
  FOREIGN KEY (source_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
);

-- Critical indexes for graph traversal
CREATE INDEX IF NOT EXISTS idx_edges_source ON knowledge_edges(source_id, relation) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_edges_target ON knowledge_edges(target_id, relation) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_edges_relation ON knowledge_edges(relation) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_edges_weight ON knowledge_edges(weight DESC) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_edges_source_agent ON knowledge_edges(source_agent_id) WHERE is_deleted = 0;

-- Composite index for bidirectional edge queries
CREATE INDEX IF NOT EXISTS idx_edges_bidirectional ON knowledge_edges(source_id, target_id, bidirectional) WHERE is_deleted = 0;

-- Index for path finding (source -> target lookups)
CREATE INDEX IF NOT EXISTS idx_edges_path ON knowledge_edges(source_id, target_id, weight DESC) WHERE is_deleted = 0;

-- =============================================================================
-- KNOWLEDGE INFERENCES TABLE
-- Derived knowledge from graph structure and patterns
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_inferences (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('deduction', 'induction', 'analogy')),

  -- Premise (nodes and edges used for inference)
  premise_nodes TEXT NOT NULL, -- JSON array of node IDs
  premise_edges TEXT, -- JSON array of edge IDs

  -- Conclusion (resulting node or edge ID)
  conclusion_type TEXT NOT NULL CHECK(conclusion_type IN ('node', 'edge')),
  conclusion_id TEXT NOT NULL,

  -- Inference quality
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL, -- JSON array of reasoning steps
  rule TEXT, -- Inference rule used

  -- Verification
  verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0, 1)),

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inferences_type ON knowledge_inferences(type);
CREATE INDEX IF NOT EXISTS idx_inferences_conclusion ON knowledge_inferences(conclusion_id, conclusion_type);
CREATE INDEX IF NOT EXISTS idx_inferences_confidence ON knowledge_inferences(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_inferences_verified ON knowledge_inferences(verified);

-- =============================================================================
-- FEDERATION STATE TABLE
-- Track synchronization state with peer agents
-- =============================================================================

CREATE TABLE IF NOT EXISTS federation_state (
  peer_id TEXT PRIMARY KEY,
  last_sync INTEGER NOT NULL,
  last_successful_sync INTEGER,
  vector_clock TEXT NOT NULL, -- JSON map of agent_id -> clock_value
  nodes_synced INTEGER DEFAULT 0,
  edges_synced INTEGER DEFAULT 0,
  errors TEXT, -- JSON array of error messages
  status TEXT NOT NULL CHECK(status IN ('idle', 'syncing', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_federation_status ON federation_state(status);
CREATE INDEX IF NOT EXISTS idx_federation_last_sync ON federation_state(last_sync DESC);

-- =============================================================================
-- KNOWLEDGE CONFLICTS TABLE
-- Detected conflicts requiring resolution
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_conflicts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('concurrent_update', 'semantic_conflict', 'constraint_violation')),

  -- Conflicting entities
  node_ids TEXT, -- JSON array of conflicting node IDs
  edge_ids TEXT, -- JSON array of conflicting edge IDs
  agents TEXT NOT NULL, -- JSON array of agent IDs involved

  -- Resolution
  status TEXT NOT NULL DEFAULT 'unresolved' CHECK(status IN ('unresolved', 'resolved', 'ignored')),
  resolution_strategy TEXT CHECK(resolution_strategy IN ('latest_write_wins', 'highest_confidence', 'merge', 'manual')),
  resolution_type TEXT CHECK(resolution_type IN ('node', 'edge')),
  resolution_id TEXT, -- ID of resolved node/edge

  -- Timestamps
  detected_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
  resolved_at INTEGER,

  -- Notes
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_conflicts_status ON knowledge_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_conflicts_type ON knowledge_conflicts(type);
CREATE INDEX IF NOT EXISTS idx_conflicts_detected_at ON knowledge_conflicts(detected_at DESC);

-- =============================================================================
-- REPLICATION LOG TABLE
-- Track knowledge replication operations
-- =============================================================================

CREATE TABLE IF NOT EXISTS replication_log (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('node', 'edge', 'inference')),
  entity_id TEXT NOT NULL,
  source_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  vector_clock TEXT NOT NULL, -- JSON map
  timestamp INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'replicated', 'failed', 'conflict')),
  retry_count INTEGER DEFAULT 0,
  error TEXT,

  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_replication_status ON replication_log(status);
CREATE INDEX IF NOT EXISTS idx_replication_entity ON replication_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_replication_agents ON replication_log(source_agent, target_agent);
CREATE INDEX IF NOT EXISTS idx_replication_timestamp ON replication_log(timestamp DESC);

-- =============================================================================
-- SYNTHESIS JOBS TABLE
-- Track knowledge extraction from memories
-- =============================================================================

CREATE TABLE IF NOT EXISTS synthesis_jobs (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL CHECK(source_type IN ('episodes', 'procedures', 'facts')),
  source_ids TEXT NOT NULL, -- JSON array
  strategy TEXT NOT NULL CHECK(strategy IN ('extract_entities', 'extract_relations', 'find_patterns', 'generalize')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'failed')),

  -- Output
  output_nodes TEXT, -- JSON array of created node IDs
  output_edges TEXT, -- JSON array of created edge IDs
  quality REAL CHECK(quality >= 0 AND quality <= 1),

  -- Errors
  errors TEXT, -- JSON array of error messages

  -- Timestamps
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
  started_at INTEGER,
  completed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_synthesis_status ON synthesis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_synthesis_source_type ON synthesis_jobs(source_type);
CREATE INDEX IF NOT EXISTS idx_synthesis_created_at ON synthesis_jobs(created_at DESC);

-- =============================================================================
-- PATTERNS TABLE
-- Detected patterns in the knowledge graph
-- =============================================================================

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('sequence', 'cycle', 'cluster', 'hierarchy')),
  name TEXT NOT NULL,
  description TEXT,

  -- Pattern structure
  node_ids TEXT NOT NULL, -- JSON array
  edge_ids TEXT NOT NULL, -- JSON array

  -- Pattern metadata
  frequency INTEGER DEFAULT 1,
  confidence REAL NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
  properties TEXT, -- JSON

  -- Timestamps
  detected_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(type);
CREATE INDEX IF NOT EXISTS idx_patterns_frequency ON patterns(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON patterns(confidence DESC);

-- =============================================================================
-- NODE INDEXES TABLE
-- Additional indexes for fast node lookup
-- =============================================================================

CREATE TABLE IF NOT EXISTS node_indexes (
  node_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT NOT NULL,
  index_type TEXT NOT NULL CHECK(index_type IN ('label', 'property', 'embedding')),
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,

  PRIMARY KEY (node_id, field_name, field_value),
  FOREIGN KEY (node_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_node_indexes_field ON node_indexes(field_name, field_value);
CREATE INDEX IF NOT EXISTS idx_node_indexes_type ON node_indexes(index_type);

-- =============================================================================
-- NAMESPACES TABLE
-- Multi-tenant namespace configuration
-- =============================================================================

CREATE TABLE IF NOT EXISTS namespaces (
  name TEXT PRIMARY KEY,
  description TEXT,
  owners TEXT NOT NULL, -- JSON array of owner agent IDs
  read_only_agents TEXT, -- JSON array of read-only agent IDs
  created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK(is_archived IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_namespaces_archived ON namespaces(is_archived);

-- =============================================================================
-- FULL-TEXT SEARCH (FTS5)
-- Virtual tables for semantic text search
-- =============================================================================

-- Nodes FTS
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_nodes_fts USING fts5(
  id UNINDEXED,
  label,
  properties,
  content=knowledge_nodes,
  content_rowid=rowid,
  tokenize='porter unicode61'
);

-- Triggers to keep FTS index in sync with nodes
CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON knowledge_nodes BEGIN
  INSERT INTO knowledge_nodes_fts(rowid, id, label, properties)
  VALUES (new.rowid, new.id, new.label, new.properties);
END;

CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON knowledge_nodes BEGIN
  DELETE FROM knowledge_nodes_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON knowledge_nodes BEGIN
  DELETE FROM knowledge_nodes_fts WHERE rowid = old.rowid;
  INSERT INTO knowledge_nodes_fts(rowid, id, label, properties)
  VALUES (new.rowid, new.id, new.label, new.properties);
END;

-- Edges FTS
CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_edges_fts USING fts5(
  id UNINDEXED,
  relation,
  properties,
  content=knowledge_edges,
  content_rowid=rowid,
  tokenize='porter unicode61'
);

-- Triggers for edges FTS
CREATE TRIGGER IF NOT EXISTS edges_ai AFTER INSERT ON knowledge_edges BEGIN
  INSERT INTO knowledge_edges_fts(rowid, id, relation, properties)
  VALUES (new.rowid, new.id, new.relation, COALESCE(new.properties, '{}'));
END;

CREATE TRIGGER IF NOT EXISTS edges_ad AFTER DELETE ON knowledge_edges BEGIN
  DELETE FROM knowledge_edges_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS edges_au AFTER UPDATE ON knowledge_edges BEGIN
  DELETE FROM knowledge_edges_fts WHERE rowid = old.rowid;
  INSERT INTO knowledge_edges_fts(rowid, id, relation, properties)
  VALUES (new.rowid, new.id, new.relation, COALESCE(new.properties, '{}'));
END;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- Automatically update updated_at timestamp
-- =============================================================================

CREATE TRIGGER IF NOT EXISTS nodes_update_timestamp AFTER UPDATE ON knowledge_nodes
FOR EACH ROW
BEGIN
  UPDATE knowledge_nodes SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS edges_update_timestamp AFTER UPDATE ON knowledge_edges
FOR EACH ROW
BEGIN
  UPDATE knowledge_edges SET updated_at = strftime('%s', 'now') * 1000 WHERE id = NEW.id;
END;

-- =============================================================================
-- VIEWS
-- Convenient views for common graph queries
-- =============================================================================

-- Active nodes view (non-deleted)
CREATE VIEW IF NOT EXISTS v_active_nodes AS
SELECT
  id,
  type,
  label,
  properties,
  source_agent_id,
  source_episode_id,
  confidence,
  version,
  namespace,
  created_at,
  updated_at
FROM knowledge_nodes
WHERE is_deleted = 0;

-- Active edges view (non-deleted, between active nodes)
CREATE VIEW IF NOT EXISTS v_active_edges AS
SELECT
  e.id,
  e.source_id,
  e.target_id,
  e.relation,
  e.weight,
  e.properties,
  e.bidirectional,
  e.source_agent_id,
  e.confidence,
  e.version,
  e.created_at,
  e.updated_at
FROM knowledge_edges e
WHERE e.is_deleted = 0
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE id = e.source_id AND is_deleted = 0)
  AND EXISTS (SELECT 1 FROM knowledge_nodes WHERE id = e.target_id AND is_deleted = 0);

-- Node degree view (in/out degree for each node)
CREATE VIEW IF NOT EXISTS v_node_degrees AS
SELECT
  n.id AS node_id,
  n.label,
  COALESCE(out.out_degree, 0) AS out_degree,
  COALESCE(in.in_degree, 0) AS in_degree,
  COALESCE(out.out_degree, 0) + COALESCE(in.in_degree, 0) AS total_degree
FROM knowledge_nodes n
LEFT JOIN (
  SELECT source_id, COUNT(*) AS out_degree
  FROM knowledge_edges
  WHERE is_deleted = 0
  GROUP BY source_id
) out ON n.id = out.source_id
LEFT JOIN (
  SELECT target_id, COUNT(*) AS in_degree
  FROM knowledge_edges
  WHERE is_deleted = 0
  GROUP BY target_id
) in ON n.id = in.target_id
WHERE n.is_deleted = 0;

-- Graph statistics view
CREATE VIEW IF NOT EXISTS v_graph_stats AS
SELECT
  (SELECT COUNT(*) FROM knowledge_nodes WHERE is_deleted = 0) AS node_count,
  (SELECT COUNT(*) FROM knowledge_edges WHERE is_deleted = 0) AS edge_count,
  (SELECT COUNT(*) FROM knowledge_inferences) AS inference_count,
  (SELECT AVG(confidence) FROM knowledge_nodes WHERE is_deleted = 0) AS avg_node_confidence,
  (SELECT AVG(confidence) FROM knowledge_edges WHERE is_deleted = 0) AS avg_edge_confidence,
  (SELECT COUNT(DISTINCT source_agent_id) FROM knowledge_nodes WHERE is_deleted = 0) AS contributing_agents,
  (SELECT COUNT(DISTINCT namespace) FROM knowledge_nodes WHERE is_deleted = 0) AS namespace_count;

-- Conflict summary view
CREATE VIEW IF NOT EXISTS v_conflict_summary AS
SELECT
  type,
  status,
  COUNT(*) AS conflict_count,
  AVG(CASE WHEN resolved_at IS NOT NULL THEN resolved_at - detected_at ELSE NULL END) AS avg_resolution_time_ms
FROM knowledge_conflicts
GROUP BY type, status;

-- Federation sync status view
CREATE VIEW IF NOT EXISTS v_federation_status AS
SELECT
  peer_id,
  status,
  nodes_synced,
  edges_synced,
  last_sync,
  last_successful_sync,
  (strftime('%s', 'now') * 1000 - last_sync) AS ms_since_last_sync
FROM federation_state
ORDER BY last_sync DESC;

-- Replication lag view
CREATE VIEW IF NOT EXISTS v_replication_lag AS
SELECT
  target_agent,
  status,
  COUNT(*) AS operation_count,
  AVG(strftime('%s', 'now') * 1000 - timestamp) AS avg_lag_ms,
  MAX(strftime('%s', 'now') * 1000 - timestamp) AS max_lag_ms
FROM replication_log
WHERE status IN ('pending', 'failed')
GROUP BY target_agent, status;

-- =============================================================================
-- MATERIALIZED GRAPH METRICS
-- Pre-computed metrics for performance
-- =============================================================================

CREATE TABLE IF NOT EXISTS graph_metrics_cache (
  metric_name TEXT PRIMARY KEY,
  metric_value REAL NOT NULL,
  computed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);

-- =============================================================================
-- METADATA TABLE
-- System metadata and configuration
-- =============================================================================

CREATE TABLE IF NOT EXISTS knowledge_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);

-- Initialize metadata
INSERT OR IGNORE INTO knowledge_metadata (key, value) VALUES
  ('schema_version', '1.0.0'),
  ('created_at', strftime('%s', 'now') * 1000),
  ('default_namespace', 'default'),
  ('max_graph_size', '1000000'),
  ('embedding_dimensions', '384');

-- =============================================================================
-- HELPER QUERIES (Documented for application use)
-- =============================================================================

-- Example: Find all neighbors of a node (1-hop)
-- SELECT DISTINCT t.*
-- FROM knowledge_nodes t
-- JOIN knowledge_edges e ON (e.target_id = t.id OR (e.bidirectional = 1 AND e.source_id = t.id))
-- WHERE e.source_id = ? AND e.is_deleted = 0 AND t.is_deleted = 0;

-- Example: Find shortest path between two nodes (requires application-level BFS/Dijkstra)
-- Use v_active_edges view and implement path-finding in TypeScript

-- Example: Find strongly connected components (requires application-level Tarjan's algorithm)
-- Use v_active_edges view and implement SCC detection in TypeScript

-- Example: Full-text search nodes
-- SELECT n.* FROM knowledge_nodes n
-- WHERE n.id IN (SELECT id FROM knowledge_nodes_fts WHERE knowledge_nodes_fts MATCH ?)
--   AND n.is_deleted = 0;

-- Example: Get node with all outgoing edges
-- SELECT n.*, json_group_array(
--   json_object('edge_id', e.id, 'target_id', e.target_id, 'relation', e.relation, 'weight', e.weight)
-- ) AS outgoing_edges
-- FROM knowledge_nodes n
-- LEFT JOIN knowledge_edges e ON n.id = e.source_id AND e.is_deleted = 0
-- WHERE n.id = ? AND n.is_deleted = 0
-- GROUP BY n.id;
