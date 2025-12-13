/**
 * Knowledge Query Engine - Semantic Search and Querying
 *
 * Provides advanced querying capabilities for the knowledge graph including
 * semantic search, full-text search, graph queries, and result ranking.
 *
 * Features:
 * - Semantic similarity search using embeddings
 * - Full-text search with FTS5
 * - Graph pattern matching
 * - Hybrid search (keyword + semantic)
 * - Result ranking and relevance scoring
 * - Query optimization
 */

import Database from 'better-sqlite3';
import type {
  SemanticQuery,
  QueryResult,
  KnowledgeNode,
  KnowledgeEdge,
  PathQuery,
  Path,
} from './types.js';
import { KnowledgeGraph } from './knowledge-graph.js';

export interface QueryEngineOptions {
  graph: KnowledgeGraph;
}

export class QueryEngine {
  private graph: KnowledgeGraph;
  private db: Database.Database;

  constructor(options: QueryEngineOptions) {
    this.graph = options.graph;
    this.db = (this.graph as any).db;
  }

  // ============================================
  // SEMANTIC QUERY
  // ============================================

  async query(query: SemanticQuery): Promise<QueryResult> {
    const startTime = Date.now();

    let nodes: KnowledgeNode[] = [];
    let edges: KnowledgeEdge[] = [];
    const scores = new Map<string, number>();

    switch (query.type) {
      case 'search':
        ({ nodes, edges, scores: scores } = await this.searchQuery(query));
        break;

      case 'question':
        ({ nodes, edges } = await this.questionQuery(query));
        break;

      case 'inference':
        ({ nodes, edges } = await this.inferenceQuery(query));
        break;

      case 'path':
        const paths = await this.pathQuery(query);
        nodes = paths.flatMap(p => p.nodes);
        edges = paths.flatMap(p => p.edges);
        break;
    }

    // Apply filters
    if (query.filters) {
      nodes = this.applyFilters(nodes, query.filters);
    }

    // Apply options
    if (query.options) {
      ({ nodes, edges } = this.applyOptions(nodes, edges, query.options, scores));
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      nodes,
      edges,
      scores,
      metadata: {
        totalCount: nodes.length,
        executionTimeMs,
        truncated: false,
      },
    };
  }

  // ============================================
  // SEARCH STRATEGIES
  // ============================================

  private async searchQuery(query: SemanticQuery): Promise<{
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    scores: Map<string, number>;
  }> {
    const scores = new Map<string, number>();

    // Use hybrid search: combine full-text and semantic similarity
    const textResults = this.fullTextSearch(query.text, query.options?.limit || 100);

    // Calculate semantic similarity if embeddings are available
    // For now, use full-text search results
    const nodes: KnowledgeNode[] = [];

    for (const node of textResults) {
      const score = this.calculateRelevanceScore(node, query.text);
      scores.set(node.id, score);
      nodes.push(node);
    }

    // Sort by score
    nodes.sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));

    // Get edges between matched nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges: KnowledgeEdge[] = [];

    for (const node of nodes.slice(0, 50)) {
      // Limit to prevent explosion
      const outgoing = this.graph.getOutgoingEdges(node.id);
      for (const edge of outgoing) {
        if (nodeIds.has(edge.targetId)) {
          edges.push(edge);
        }
      }
    }

    return { nodes, edges, scores };
  }

  private async questionQuery(query: SemanticQuery): Promise<{
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
  }> {
    // Question answering: find relevant facts and entities
    // Simplified implementation - extract keywords and search
    const keywords = this.extractKeywords(query.text);

    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    for (const keyword of keywords) {
      const results = this.fullTextSearch(keyword, 10);
      nodes.push(...results);
    }

    // Deduplicate
    const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());

    return { nodes: uniqueNodes, edges };
  }

  private async inferenceQuery(query: SemanticQuery): Promise<{
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
  }> {
    // Inference query: find inferred knowledge related to query
    const inferences = this.db
      .prepare(
        `SELECT * FROM knowledge_inferences
         WHERE reasoning LIKE ? OR rule LIKE ?
         ORDER BY confidence DESC
         LIMIT ?`
      )
      .all(`%${query.text}%`, `%${query.text}%`, query.options?.limit || 50) as any[];

    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    for (const inference of inferences) {
      const premiseNodes = JSON.parse(inference.premise_nodes) as string[];
      for (const nodeId of premiseNodes) {
        const node = this.graph.getNode(nodeId);
        if (node) nodes.push(node);
      }

      if (inference.conclusion_type === 'node') {
        const node = this.graph.getNode(inference.conclusion_id);
        if (node) nodes.push(node);
      } else {
        const edge = this.graph.getEdge(inference.conclusion_id);
        if (edge) edges.push(edge);
      }
    }

    return { nodes, edges };
  }

  private async pathQuery(query: SemanticQuery): Promise<Path[]> {
    // Extract start and end nodes from query text
    const keywords = this.extractKeywords(query.text);

    if (keywords.length < 2) {
      return [];
    }

    // Find nodes matching keywords
    const startNodes = this.fullTextSearch(keywords[0], 5);
    const endNodes = this.fullTextSearch(keywords[keywords.length - 1], 5);

    const paths: Path[] = [];

    for (const startNode of startNodes) {
      for (const endNode of endNodes) {
        if (startNode.id === endNode.id) continue;

        const nodePaths = this.graph.findAllPaths({
          startNodeId: startNode.id,
          endNodeId: endNode.id,
          maxHops: query.options?.maxHops || 5,
        });

        paths.push(...nodePaths);
      }
    }

    return paths.sort((a, b) => b.confidence - a.confidence);
  }

  // ============================================
  // FULL-TEXT SEARCH
  // ============================================

  private fullTextSearch(text: string, limit: number = 50): KnowledgeNode[] {
    // Escape FTS5 special characters
    const escaped = text.replace(/[":*]/g, ' ');

    const stmt = this.db.prepare(`
      SELECT n.* FROM knowledge_nodes n
      WHERE n.id IN (
        SELECT id FROM knowledge_nodes_fts WHERE knowledge_nodes_fts MATCH ?
      )
      AND n.is_deleted = 0
      ORDER BY n.confidence DESC
      LIMIT ?
    `);

    const rows = stmt.all(escaped, limit) as any[];

    return rows.map(row => (this.graph as any).rowToNode(row));
  }

  // ============================================
  // FILTERING AND RANKING
  // ============================================

  private applyFilters(nodes: KnowledgeNode[], filters: NonNullable<SemanticQuery['filters']>): KnowledgeNode[] {
    let filtered = nodes;

    if (filters.nodeTypes && filters.nodeTypes.length > 0) {
      filtered = filtered.filter(n => filters.nodeTypes!.includes(n.type));
    }

    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter(n => n.confidence >= filters.minConfidence!);
    }

    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(n => filters.sources!.includes(n.source.agentId));
    }

    if (filters.namespace) {
      filtered = filtered.filter(n => n.namespace === filters.namespace);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(n =>
        n.createdAt >= start && n.createdAt <= end
      );
    }

    return filtered;
  }

  private applyOptions(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options: NonNullable<SemanticQuery['options']>,
    scores: Map<string, number>
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    let resultNodes = nodes;
    let resultEdges = edges;

    // Apply limit
    if (options.limit && options.limit > 0) {
      resultNodes = nodes.slice(0, options.limit);

      // Filter edges to only include those between limited nodes
      const nodeIds = new Set(resultNodes.map(n => n.id));
      resultEdges = edges.filter(e =>
        nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)
      );
    }

    // Remove embeddings if not requested
    if (!options.includeEmbeddings) {
      resultNodes = resultNodes.map(n => ({ ...n, embeddings: undefined }));
    }

    // Filter by minimum similarity
    if (options.minSimilarity !== undefined) {
      resultNodes = resultNodes.filter(n => {
        const score = scores.get(n.id);
        return score !== undefined && score >= options.minSimilarity!;
      });
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  // ============================================
  // RELEVANCE SCORING
  // ============================================

  private calculateRelevanceScore(node: KnowledgeNode, queryText: string): number {
    let score = 0;

    const queryLower = queryText.toLowerCase();
    const labelLower = node.label.toLowerCase();

    // Exact match bonus
    if (labelLower === queryLower) {
      score += 1.0;
    } else if (labelLower.includes(queryLower)) {
      score += 0.7;
    } else if (queryLower.includes(labelLower)) {
      score += 0.5;
    }

    // Word overlap
    const queryWords = new Set(queryLower.split(/\s+/));
    const labelWords = new Set(labelLower.split(/\s+/));

    let overlap = 0;
    for (const word of queryWords) {
      if (labelWords.has(word)) {
        overlap++;
      }
    }

    score += (overlap / Math.max(queryWords.size, 1)) * 0.5;

    // Confidence bonus
    score += node.confidence * 0.3;

    // Recency bonus (newer nodes score higher)
    const ageMs = Date.now() - node.createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (ageDays / 365)); // Decay over a year
    score += recencyScore * 0.2;

    return Math.min(score, 1.0);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'what',
      'when', 'where', 'who', 'which', 'how', 'why',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Return unique words
    return Array.from(new Set(words));
  }

  // ============================================
  // ADVANCED QUERIES
  // ============================================

  /**
   * Find nodes by property value
   */
  findByProperty(propertyName: string, propertyValue: any, options?: { limit?: number }): KnowledgeNode[] {
    const stmt = this.db.prepare(`
      SELECT * FROM knowledge_nodes
      WHERE is_deleted = 0
        AND json_extract(properties, ?) = ?
      ORDER BY confidence DESC
      LIMIT ?
    `);

    const rows = stmt.all(`$.${propertyName}`, propertyValue, options?.limit || 100) as any[];

    return rows.map(row => (this.graph as any).rowToNode(row));
  }

  /**
   * Find nodes connected by specific relation
   */
  findConnectedByRelation(nodeId: string, relation: string, direction: 'outgoing' | 'incoming' | 'both' = 'both'): KnowledgeNode[] {
    return this.graph.getNeighbors(nodeId, { direction, relation });
  }

  /**
   * Get subgraph around a node (k-hop neighborhood)
   */
  getNeighborhood(nodeId: string, hops: number = 2): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const visited = new Set<string>();
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];

    const traverse = (currentId: string, depth: number) => {
      if (depth > hops || visited.has(currentId)) return;

      visited.add(currentId);

      const node = this.graph.getNode(currentId);
      if (node) {
        nodes.push(node);
      }

      const outgoing = this.graph.getOutgoingEdges(currentId);
      const incoming = this.graph.getIncomingEdges(currentId);

      for (const edge of [...outgoing, ...incoming]) {
        edges.push(edge);

        const nextId = edge.sourceId === currentId ? edge.targetId : edge.sourceId;
        traverse(nextId, depth + 1);
      }
    };

    traverse(nodeId, 0);

    return { nodes, edges };
  }

  /**
   * Aggregate statistics for query results
   */
  aggregateResults(nodes: KnowledgeNode[]): {
    totalNodes: number;
    avgConfidence: number;
    nodesByType: Record<string, number>;
    avgDegree: number;
  } {
    const nodesByType: Record<string, number> = {};

    for (const node of nodes) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    const avgConfidence = nodes.reduce((sum, n) => sum + n.confidence, 0) / (nodes.length || 1);

    // Calculate average degree
    let totalDegree = 0;
    for (const node of nodes) {
      const degree = this.graph.getNodeDegree(node.id);
      totalDegree += degree.totalDegree;
    }
    const avgDegree = totalDegree / (nodes.length || 1);

    return {
      totalNodes: nodes.length,
      avgConfidence,
      nodesByType,
      avgDegree,
    };
  }
}
