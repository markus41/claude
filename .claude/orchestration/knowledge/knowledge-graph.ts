/**
 * Knowledge Graph - Core Graph Operations
 *
 * Provides CRUD operations for knowledge nodes and edges with efficient
 * graph traversal, path finding, and subgraph extraction.
 *
 * Key Features:
 * - Node and edge management (create, read, update, delete)
 * - Graph traversal (BFS, DFS, neighbors)
 * - Path finding (shortest path, all paths)
 * - Subgraph extraction
 * - Efficient indexing and caching
 * - Optimistic locking for concurrent updates
 *
 * Performance:
 * - Optimized for 100K+ nodes
 * - Indexed queries for O(log n) lookups
 * - In-memory caching for hot paths
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type {
  KnowledgeNode,
  KnowledgeEdge,
  NodeType,
  Path,
  PathQuery,
  Subgraph,
  NodeDegree,
  GraphStats,
  NodeNotFoundError,
  EdgeNotFoundError,
  OptimisticLockError,
} from './types.js';

export interface KnowledgeGraphConfig {
  dbPath: string;
  namespace?: string;
  enableCache?: boolean;
  cacheSize?: number;
}

export class KnowledgeGraph {
  private db: Database.Database;
  private namespace: string;
  private cache: Map<string, KnowledgeNode | KnowledgeEdge>;
  private enableCache: boolean;

  // Prepared statements for performance
  private stmts: {
    getNode?: Database.Statement;
    createNode?: Database.Statement;
    updateNode?: Database.Statement;
    deleteNode?: Database.Statement;
    getEdge?: Database.Statement;
    createEdge?: Database.Statement;
    updateEdge?: Database.Statement;
    deleteEdge?: Database.Statement;
    getOutgoingEdges?: Database.Statement;
    getIncomingEdges?: Database.Statement;
    getAllNeighbors?: Database.Statement;
  } = {};

  constructor(config: KnowledgeGraphConfig) {
    this.db = new Database(config.dbPath);
    this.namespace = config.namespace || 'default';
    this.enableCache = config.enableCache ?? true;
    this.cache = new Map();

    // Initialize database
    this.initDatabase();
    this.prepareStatements();
  }

  private initDatabase(): void {
    // Read and execute schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../db/knowledge.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
    }
  }

  private prepareStatements(): void {
    this.stmts.getNode = this.db.prepare(`
      SELECT * FROM knowledge_nodes
      WHERE id = ? AND is_deleted = 0
    `);

    this.stmts.createNode = this.db.prepare(`
      INSERT INTO knowledge_nodes (
        id, type, label, properties, embeddings,
        source_agent_id, source_episode_id, source_timestamp,
        confidence, version, namespace
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.stmts.updateNode = this.db.prepare(`
      UPDATE knowledge_nodes
      SET label = ?, properties = ?, embeddings = ?,
          confidence = ?, version = version + 1,
          updated_at = strftime('%s', 'now') * 1000
      WHERE id = ? AND version = ? AND is_deleted = 0
    `);

    this.stmts.deleteNode = this.db.prepare(`
      UPDATE knowledge_nodes
      SET is_deleted = 1, updated_at = strftime('%s', 'now') * 1000
      WHERE id = ? AND is_deleted = 0
    `);

    this.stmts.getEdge = this.db.prepare(`
      SELECT * FROM knowledge_edges
      WHERE id = ? AND is_deleted = 0
    `);

    this.stmts.createEdge = this.db.prepare(`
      INSERT INTO knowledge_edges (
        id, source_id, target_id, relation, weight, properties, bidirectional,
        source_agent_id, source_episode_id, source_timestamp,
        confidence, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.stmts.updateEdge = this.db.prepare(`
      UPDATE knowledge_edges
      SET relation = ?, weight = ?, properties = ?,
          confidence = ?, version = version + 1,
          updated_at = strftime('%s', 'now') * 1000
      WHERE id = ? AND version = ? AND is_deleted = 0
    `);

    this.stmts.deleteEdge = this.db.prepare(`
      UPDATE knowledge_edges
      SET is_deleted = 1, updated_at = strftime('%s', 'now') * 1000
      WHERE id = ? AND is_deleted = 0
    `);

    this.stmts.getOutgoingEdges = this.db.prepare(`
      SELECT * FROM knowledge_edges
      WHERE source_id = ? AND is_deleted = 0
      ORDER BY weight DESC
    `);

    this.stmts.getIncomingEdges = this.db.prepare(`
      SELECT * FROM knowledge_edges
      WHERE target_id = ? AND is_deleted = 0
      ORDER BY weight DESC
    `);

    this.stmts.getAllNeighbors = this.db.prepare(`
      SELECT DISTINCT n.*
      FROM knowledge_nodes n
      JOIN knowledge_edges e ON (
        (e.target_id = n.id AND e.source_id = ?)
        OR (e.bidirectional = 1 AND e.source_id = n.id AND e.target_id = ?)
      )
      WHERE e.is_deleted = 0 AND n.is_deleted = 0
    `);
  }

  // ============================================
  // NODE OPERATIONS
  // ============================================

  createNode(node: Omit<KnowledgeNode, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'>): KnowledgeNode {
    const id = randomUUID();
    const version = 1;
    const now = Date.now();

    const embeddings = node.embeddings
      ? Buffer.from(new Float32Array(node.embeddings).buffer)
      : null;

    this.stmts.createNode!.run(
      id,
      node.type,
      node.label,
      JSON.stringify(node.properties),
      embeddings,
      node.source.agentId,
      node.source.episodeId || null,
      node.source.timestamp.getTime(),
      node.confidence,
      version,
      node.namespace || this.namespace
    );

    const created: KnowledgeNode = {
      ...node,
      id,
      version,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      isDeleted: false,
      namespace: node.namespace || this.namespace,
    };

    if (this.enableCache) {
      this.cache.set(id, created);
    }

    return created;
  }

  getNode(id: string): KnowledgeNode | null {
    // Check cache first
    if (this.enableCache && this.cache.has(id)) {
      const cached = this.cache.get(id);
      if (cached && 'label' in cached) {
        return cached as KnowledgeNode;
      }
    }

    const row = this.stmts.getNode!.get(id) as any;
    if (!row) return null;

    const node = this.rowToNode(row);

    if (this.enableCache) {
      this.cache.set(id, node);
    }

    return node;
  }

  updateNode(
    id: string,
    updates: Partial<Pick<KnowledgeNode, 'label' | 'properties' | 'embeddings' | 'confidence'>>,
    expectedVersion: number
  ): KnowledgeNode {
    const existing = this.getNode(id);
    if (!existing) {
      throw new Error(`Node not found: ${id}`);
    }

    if (existing.version !== expectedVersion) {
      throw new Error(
        `Optimistic lock failure: expected version ${expectedVersion}, got ${existing.version}`
      );
    }

    const embeddings = updates.embeddings
      ? Buffer.from(new Float32Array(updates.embeddings).buffer)
      : existing.embeddings
      ? Buffer.from(new Float32Array(existing.embeddings).buffer)
      : null;

    const result = this.stmts.updateNode!.run(
      updates.label ?? existing.label,
      JSON.stringify(updates.properties ?? existing.properties),
      embeddings,
      updates.confidence ?? existing.confidence,
      id,
      expectedVersion
    );

    if (result.changes === 0) {
      throw new Error(`Update failed for node ${id}`);
    }

    // Invalidate cache
    this.cache.delete(id);

    return this.getNode(id)!;
  }

  deleteNode(id: string): void {
    this.stmts.deleteNode!.run(id);
    this.cache.delete(id);
  }

  listNodes(filters?: {
    type?: NodeType;
    namespace?: string;
    minConfidence?: number;
    limit?: number;
  }): KnowledgeNode[] {
    let query = 'SELECT * FROM knowledge_nodes WHERE is_deleted = 0';
    const params: any[] = [];

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.namespace) {
      query += ' AND namespace = ?';
      params.push(filters.namespace);
    } else {
      query += ' AND namespace = ?';
      params.push(this.namespace);
    }

    if (filters?.minConfidence !== undefined) {
      query += ' AND confidence >= ?';
      params.push(filters.minConfidence);
    }

    query += ' ORDER BY confidence DESC, created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => this.rowToNode(row));
  }

  // ============================================
  // EDGE OPERATIONS
  // ============================================

  createEdge(edge: Omit<KnowledgeEdge, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'>): KnowledgeEdge {
    // Verify nodes exist
    if (!this.getNode(edge.sourceId)) {
      throw new Error(`Source node not found: ${edge.sourceId}`);
    }
    if (!this.getNode(edge.targetId)) {
      throw new Error(`Target node not found: ${edge.targetId}`);
    }

    const id = randomUUID();
    const version = 1;
    const now = Date.now();

    this.stmts.createEdge!.run(
      id,
      edge.sourceId,
      edge.targetId,
      edge.relation,
      edge.weight,
      edge.properties ? JSON.stringify(edge.properties) : null,
      edge.bidirectional ? 1 : 0,
      edge.source.agentId,
      edge.source.episodeId || null,
      edge.source.timestamp.getTime(),
      edge.confidence,
      version
    );

    const created: KnowledgeEdge = {
      ...edge,
      id,
      version,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      isDeleted: false,
    };

    if (this.enableCache) {
      this.cache.set(id, created);
    }

    return created;
  }

  getEdge(id: string): KnowledgeEdge | null {
    if (this.enableCache && this.cache.has(id)) {
      const cached = this.cache.get(id);
      if (cached && 'sourceId' in cached) {
        return cached as KnowledgeEdge;
      }
    }

    const row = this.stmts.getEdge!.get(id) as any;
    if (!row) return null;

    const edge = this.rowToEdge(row);

    if (this.enableCache) {
      this.cache.set(id, edge);
    }

    return edge;
  }

  updateEdge(
    id: string,
    updates: Partial<Pick<KnowledgeEdge, 'relation' | 'weight' | 'properties' | 'confidence'>>,
    expectedVersion: number
  ): KnowledgeEdge {
    const existing = this.getEdge(id);
    if (!existing) {
      throw new Error(`Edge not found: ${id}`);
    }

    if (existing.version !== expectedVersion) {
      throw new Error(
        `Optimistic lock failure: expected version ${expectedVersion}, got ${existing.version}`
      );
    }

    const result = this.stmts.updateEdge!.run(
      updates.relation ?? existing.relation,
      updates.weight ?? existing.weight,
      updates.properties ? JSON.stringify(updates.properties) : JSON.stringify(existing.properties || {}),
      updates.confidence ?? existing.confidence,
      id,
      expectedVersion
    );

    if (result.changes === 0) {
      throw new Error(`Update failed for edge ${id}`);
    }

    this.cache.delete(id);
    return this.getEdge(id)!;
  }

  deleteEdge(id: string): void {
    this.stmts.deleteEdge!.run(id);
    this.cache.delete(id);
  }

  // ============================================
  // GRAPH TRAVERSAL
  // ============================================

  getNeighbors(nodeId: string, options?: {
    direction?: 'outgoing' | 'incoming' | 'both';
    relation?: string;
    limit?: number;
  }): KnowledgeNode[] {
    const direction = options?.direction || 'both';

    if (direction === 'both') {
      const rows = this.stmts.getAllNeighbors!.all(nodeId, nodeId) as any[];
      let nodes = rows.map(row => this.rowToNode(row));

      if (options?.relation) {
        // Filter by relation - need to join with edges
        nodes = nodes.filter(n => {
          const edges = this.getOutgoingEdges(nodeId);
          const incoming = this.getIncomingEdges(nodeId);
          return [...edges, ...incoming].some(e =>
            e.relation === options.relation &&
            (e.sourceId === n.id || e.targetId === n.id)
          );
        });
      }

      if (options?.limit) {
        nodes = nodes.slice(0, options.limit);
      }

      return nodes;
    } else if (direction === 'outgoing') {
      const edges = this.getOutgoingEdges(nodeId);
      let targetIds = edges
        .filter(e => !options?.relation || e.relation === options.relation)
        .map(e => e.targetId);

      if (options?.limit) {
        targetIds = targetIds.slice(0, options.limit);
      }

      return targetIds.map(id => this.getNode(id)!).filter(Boolean);
    } else {
      const edges = this.getIncomingEdges(nodeId);
      let sourceIds = edges
        .filter(e => !options?.relation || e.relation === options.relation)
        .map(e => e.sourceId);

      if (options?.limit) {
        sourceIds = sourceIds.slice(0, options.limit);
      }

      return sourceIds.map(id => this.getNode(id)!).filter(Boolean);
    }
  }

  getOutgoingEdges(nodeId: string): KnowledgeEdge[] {
    const rows = this.stmts.getOutgoingEdges!.all(nodeId) as any[];
    return rows.map(row => this.rowToEdge(row));
  }

  getIncomingEdges(nodeId: string): KnowledgeEdge[] {
    const rows = this.stmts.getIncomingEdges!.all(nodeId) as any[];
    return rows.map(row => this.rowToEdge(row));
  }

  // ============================================
  // PATH FINDING
  // ============================================

  findShortestPath(query: PathQuery): Path | null {
    const paths = this.findAllPaths({
      ...query,
      maxHops: query.maxHops || 10,
    });

    if (paths.length === 0) return null;

    // Return path with highest confidence
    return paths.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  findAllPaths(query: PathQuery): Path[] {
    const { startNodeId, endNodeId, maxHops, allowedRelations, directed = true } = query;

    const paths: Path[] = [];
    const visited = new Set<string>();

    const dfs = (currentId: string, path: KnowledgeNode[], edges: KnowledgeEdge[], depth: number) => {
      if (depth > maxHops) return;
      if (visited.has(currentId) && currentId !== startNodeId) return;

      visited.add(currentId);

      if (currentId === endNodeId && path.length > 1) {
        const confidence = edges.reduce((acc, e) => acc * e.weight, 1);
        paths.push({
          nodes: [...path],
          edges: [...edges],
          length: edges.length,
          confidence,
        });
        visited.delete(currentId);
        return;
      }

      const outgoing = this.getOutgoingEdges(currentId);
      const candidates = directed ? outgoing : [...outgoing, ...this.getIncomingEdges(currentId)];

      for (const edge of candidates) {
        if (allowedRelations && !allowedRelations.includes(edge.relation)) continue;

        const nextId = edge.targetId === currentId ? edge.sourceId : edge.targetId;
        const nextNode = this.getNode(nextId);

        if (nextNode && !nextNode.isDeleted) {
          dfs(nextId, [...path, nextNode], [...edges, edge], depth + 1);
        }
      }

      visited.delete(currentId);
    };

    const startNode = this.getNode(startNodeId);
    if (startNode) {
      dfs(startNodeId, [startNode], [], 0);
    }

    return paths.sort((a, b) => b.confidence - a.confidence);
  }

  // ============================================
  // SUBGRAPH EXTRACTION
  // ============================================

  extractSubgraph(nodeIds: string[], includeConnections: boolean = true): Subgraph {
    const nodes = nodeIds.map(id => this.getNode(id)).filter(Boolean) as KnowledgeNode[];
    const nodeIdSet = new Set(nodeIds);
    const edges: KnowledgeEdge[] = [];

    if (includeConnections) {
      for (const nodeId of nodeIds) {
        const outgoing = this.getOutgoingEdges(nodeId);
        for (const edge of outgoing) {
          if (nodeIdSet.has(edge.targetId)) {
            edges.push(edge);
          }
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        extractedAt: new Date(),
      },
    };
  }

  // ============================================
  // STATISTICS
  // ============================================

  getNodeDegree(nodeId: string): NodeDegree {
    const stmt = this.db.prepare(`
      SELECT * FROM v_node_degrees WHERE node_id = ?
    `);

    const row = stmt.get(nodeId) as any;

    if (!row) {
      return {
        nodeId,
        inDegree: 0,
        outDegree: 0,
        totalDegree: 0,
      };
    }

    return {
      nodeId: row.node_id,
      inDegree: row.in_degree || 0,
      outDegree: row.out_degree || 0,
      totalDegree: row.total_degree || 0,
    };
  }

  getGraphStats(): GraphStats {
    const stmt = this.db.prepare('SELECT * FROM v_graph_stats');
    const row = stmt.get() as any;

    const nodesByType = this.db
      .prepare('SELECT type, COUNT(*) as count FROM knowledge_nodes WHERE is_deleted = 0 GROUP BY type')
      .all() as any[];

    const edgesByRelation = this.db
      .prepare('SELECT relation, COUNT(*) as count FROM knowledge_edges WHERE is_deleted = 0 GROUP BY relation')
      .all() as any[];

    return {
      nodeCount: row.node_count || 0,
      nodesByType: Object.fromEntries(nodesByType.map(r => [r.type, r.count])) as any,
      edgeCount: row.edge_count || 0,
      edgesByRelation: Object.fromEntries(edgesByRelation.map(r => [r.relation, r.count])),
      inferenceCount: row.inference_count || 0,
      avgDegree: row.node_count > 0 ? (row.edge_count * 2) / row.node_count : 0,
      density: row.node_count > 1
        ? row.edge_count / (row.node_count * (row.node_count - 1))
        : 0,
      connectedComponents: this.countConnectedComponents(),
      avgConfidence: row.avg_node_confidence || 0,
      contributingAgents: this.db
        .prepare('SELECT DISTINCT source_agent_id FROM knowledge_nodes WHERE is_deleted = 0')
        .all()
        .map((r: any) => r.source_agent_id),
      databaseSize: this.db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as any,
      lastUpdated: new Date(),
    };
  }

  private countConnectedComponents(): number {
    // Simplified: count nodes with no edges as individual components
    // Plus one component for the main graph if any edges exist
    const nodesWithoutEdges = this.db
      .prepare(`
        SELECT COUNT(*) as count FROM knowledge_nodes n
        WHERE n.is_deleted = 0
          AND NOT EXISTS (SELECT 1 FROM knowledge_edges e WHERE (e.source_id = n.id OR e.target_id = n.id) AND e.is_deleted = 0)
      `)
      .get() as any;

    const hasConnectedNodes = this.db
      .prepare('SELECT COUNT(*) as count FROM knowledge_edges WHERE is_deleted = 0')
      .get() as any;

    return (nodesWithoutEdges.count || 0) + (hasConnectedNodes.count > 0 ? 1 : 0);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private rowToNode(row: any): KnowledgeNode {
    return {
      id: row.id,
      type: row.type as NodeType,
      label: row.label,
      properties: JSON.parse(row.properties),
      embeddings: row.embeddings ? Array.from(new Float32Array(row.embeddings.buffer)) : undefined,
      source: {
        agentId: row.source_agent_id,
        episodeId: row.source_episode_id,
        timestamp: new Date(row.source_timestamp),
      },
      confidence: row.confidence,
      version: row.version,
      namespace: row.namespace,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isDeleted: row.is_deleted === 1,
    };
  }

  private rowToEdge(row: any): KnowledgeEdge {
    return {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      relation: row.relation,
      weight: row.weight,
      properties: row.properties ? JSON.parse(row.properties) : undefined,
      bidirectional: row.bidirectional === 1,
      source: {
        agentId: row.source_agent_id,
        episodeId: row.source_episode_id,
        timestamp: new Date(row.source_timestamp),
      },
      confidence: row.confidence,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      isDeleted: row.is_deleted === 1,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  close(): void {
    this.db.close();
  }
}
