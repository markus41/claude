/**
 * Knowledge Federation Network - Comprehensive Test Suite
 *
 * Tests all components of the knowledge federation system including:
 * - Knowledge graph operations (nodes, edges, traversal)
 * - Federation and synchronization
 * - Knowledge synthesis
 * - Semantic querying
 * - Replication and conflict resolution
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import {
  KnowledgeGraph,
  KnowledgeFederation,
  KnowledgeSynthesizer,
  QueryEngine,
  KnowledgeReplication,
  createKnowledgeFederationSystem,
  type KnowledgeNode,
  type KnowledgeEdge,
} from '../index.js';

const TEST_DB_PATH = join(__dirname, 'test-knowledge.db');

describe('KnowledgeGraph', () => {
  let graph: KnowledgeGraph;

  beforeEach(() => {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    graph = new KnowledgeGraph({ dbPath: TEST_DB_PATH });
  });

  afterEach(() => {
    graph.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Node Operations', () => {
    it('should create a knowledge node', () => {
      const node = graph.createNode({
        type: 'entity',
        label: 'Test Entity',
        properties: { category: 'test' },
        source: {
          agentId: 'agent-1',
          timestamp: new Date(),
        },
        confidence: 0.9,
      });

      expect(node.id).toBeDefined();
      expect(node.label).toBe('Test Entity');
      expect(node.type).toBe('entity');
      expect(node.confidence).toBe(0.9);
      expect(node.version).toBe(1);
    });

    it('should retrieve a node by ID', () => {
      const created = graph.createNode({
        type: 'concept',
        label: 'Knowledge',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });

      const retrieved = graph.getNode(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.label).toBe('Knowledge');
    });

    it('should update a node with optimistic locking', () => {
      const node = graph.createNode({
        type: 'entity',
        label: 'Original',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.7,
      });

      const updated = graph.updateNode(node.id, {
        label: 'Updated',
        confidence: 0.9,
      }, node.version);

      expect(updated.label).toBe('Updated');
      expect(updated.confidence).toBe(0.9);
      expect(updated.version).toBe(2);
    });

    it('should fail update with incorrect version', () => {
      const node = graph.createNode({
        type: 'entity',
        label: 'Test',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });

      expect(() => {
        graph.updateNode(node.id, { label: 'Updated' }, 999);
      }).toThrow();
    });

    it('should soft delete a node', () => {
      const node = graph.createNode({
        type: 'entity',
        label: 'To Delete',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });

      graph.deleteNode(node.id);

      const retrieved = graph.getNode(node.id);
      expect(retrieved).toBeNull();
    });

    it('should list nodes with filters', () => {
      graph.createNode({
        type: 'entity',
        label: 'Entity 1',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createNode({
        type: 'concept',
        label: 'Concept 1',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.7,
      });

      const entities = graph.listNodes({ type: 'entity', minConfidence: 0.8 });

      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('entity');
      expect(entities[0].confidence).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Edge Operations', () => {
    let sourceNode: KnowledgeNode;
    let targetNode: KnowledgeNode;

    beforeEach(() => {
      sourceNode = graph.createNode({
        type: 'entity',
        label: 'Source',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      targetNode = graph.createNode({
        type: 'entity',
        label: 'Target',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });
    });

    it('should create an edge between nodes', () => {
      const edge = graph.createEdge({
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        relation: 'connects_to',
        weight: 0.8,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.85,
      });

      expect(edge.id).toBeDefined();
      expect(edge.sourceId).toBe(sourceNode.id);
      expect(edge.targetId).toBe(targetNode.id);
      expect(edge.relation).toBe('connects_to');
    });

    it('should retrieve outgoing edges', () => {
      graph.createEdge({
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        relation: 'links_to',
        weight: 0.9,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const outgoing = graph.getOutgoingEdges(sourceNode.id);

      expect(outgoing.length).toBe(1);
      expect(outgoing[0].sourceId).toBe(sourceNode.id);
      expect(outgoing[0].targetId).toBe(targetNode.id);
    });

    it('should retrieve incoming edges', () => {
      graph.createEdge({
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        relation: 'points_to',
        weight: 0.8,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });

      const incoming = graph.getIncomingEdges(targetNode.id);

      expect(incoming.length).toBe(1);
      expect(incoming[0].targetId).toBe(targetNode.id);
    });
  });

  describe('Graph Traversal', () => {
    it('should find neighbors of a node', () => {
      const node1 = graph.createNode({
        type: 'entity',
        label: 'Node 1',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const node2 = graph.createNode({
        type: 'entity',
        label: 'Node 2',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createEdge({
        sourceId: node1.id,
        targetId: node2.id,
        relation: 'connects',
        weight: 0.9,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const neighbors = graph.getNeighbors(node1.id, { direction: 'outgoing' });

      expect(neighbors.length).toBe(1);
      expect(neighbors[0].id).toBe(node2.id);
    });

    it('should find paths between nodes', () => {
      const n1 = graph.createNode({
        type: 'entity',
        label: 'A',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const n2 = graph.createNode({
        type: 'entity',
        label: 'B',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const n3 = graph.createNode({
        type: 'entity',
        label: 'C',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createEdge({
        sourceId: n1.id,
        targetId: n2.id,
        relation: 'to',
        weight: 0.9,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createEdge({
        sourceId: n2.id,
        targetId: n3.id,
        relation: 'to',
        weight: 0.9,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const path = graph.findShortestPath({
        startNodeId: n1.id,
        endNodeId: n3.id,
        maxHops: 5,
      });

      expect(path).not.toBeNull();
      expect(path?.nodes.length).toBe(3);
      expect(path?.edges.length).toBe(2);
    });
  });

  describe('Graph Statistics', () => {
    it('should calculate node degree', () => {
      const node = graph.createNode({
        type: 'entity',
        label: 'Hub',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const neighbor = graph.createNode({
        type: 'entity',
        label: 'Neighbor',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createEdge({
        sourceId: node.id,
        targetId: neighbor.id,
        relation: 'links',
        weight: 0.9,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      const degree = graph.getNodeDegree(node.id);

      expect(degree.outDegree).toBe(1);
      expect(degree.totalDegree).toBe(1);
    });

    it('should get graph statistics', () => {
      graph.createNode({
        type: 'entity',
        label: 'E1',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.9,
      });

      graph.createNode({
        type: 'concept',
        label: 'C1',
        properties: {},
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });

      const stats = graph.getGraphStats();

      expect(stats.nodeCount).toBe(2);
      expect(stats.nodesByType['entity']).toBe(1);
      expect(stats.nodesByType['concept']).toBe(1);
    });
  });
});

describe('QueryEngine', () => {
  let graph: KnowledgeGraph;
  let queryEngine: QueryEngine;

  beforeEach(() => {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    graph = new KnowledgeGraph({ dbPath: TEST_DB_PATH });
    queryEngine = new QueryEngine({ graph });

    // Populate test data
    graph.createNode({
      type: 'entity',
      label: 'Artificial Intelligence',
      properties: { category: 'technology' },
      source: { agentId: 'agent-1', timestamp: new Date() },
      confidence: 0.95,
    });

    graph.createNode({
      type: 'concept',
      label: 'Machine Learning',
      properties: { category: 'technology' },
      source: { agentId: 'agent-1', timestamp: new Date() },
      confidence: 0.9,
    });
  });

  afterEach(() => {
    graph.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  it('should perform semantic search', async () => {
    const result = await queryEngine.query({
      text: 'intelligence',
      type: 'search',
      options: { limit: 10 },
    });

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.metadata.executionTimeMs).toBeGreaterThan(0);
  });

  it('should find nodes by property', () => {
    const results = queryEngine.findByProperty('category', 'technology');

    expect(results.length).toBe(2);
    expect(results.every(n => n.properties.category === 'technology')).toBe(true);
  });
});

describe('KnowledgeSynthesizer', () => {
  let graph: KnowledgeGraph;
  let synthesizer: KnowledgeSynthesizer;

  beforeEach(() => {
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    graph = new KnowledgeGraph({ dbPath: TEST_DB_PATH });
    synthesizer = new KnowledgeSynthesizer({ graph, agentId: 'agent-1' });
  });

  afterEach(() => {
    graph.close();
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  it('should create synthesis job', async () => {
    const job = await synthesizer.synthesize({
      sourceType: 'episodes',
      sourceIds: [],
      strategy: 'extract_entities',
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('completed');
  });
});

describe('Integration: Full System', () => {
  it('should create a complete knowledge federation system', () => {
    const system = createKnowledgeFederationSystem({
      dbPath: TEST_DB_PATH,
      agentId: 'agent-1',
      peers: ['agent-2'],
      namespace: 'test',
      syncMode: 'async',
      enableCache: true,
    });

    expect(system.graph).toBeDefined();
    expect(system.federation).toBeDefined();
    expect(system.synthesizer).toBeDefined();
    expect(system.queryEngine).toBeDefined();
    expect(system.replication).toBeDefined();

    // Test basic operations
    const node = system.graph.createNode({
      type: 'entity',
      label: 'Integration Test',
      properties: {},
      source: { agentId: 'agent-1', timestamp: new Date() },
      confidence: 0.9,
    });

    expect(node.id).toBeDefined();

    system.close();

    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });

  it('should handle 1000+ nodes efficiently', () => {
    const graph = new KnowledgeGraph({ dbPath: TEST_DB_PATH });

    const startTime = Date.now();

    // Create 1000 nodes
    const nodeIds: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const node = graph.createNode({
        type: 'entity',
        label: `Node ${i}`,
        properties: { index: i },
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8 + (i % 20) / 100,
      });
      nodeIds.push(node.id);
    }

    // Create 500 edges
    for (let i = 0; i < 500; i++) {
      const sourceIdx = Math.floor(Math.random() * nodeIds.length);
      let targetIdx = Math.floor(Math.random() * nodeIds.length);
      while (targetIdx === sourceIdx) {
        targetIdx = Math.floor(Math.random() * nodeIds.length);
      }

      graph.createEdge({
        sourceId: nodeIds[sourceIdx],
        targetId: nodeIds[targetIdx],
        relation: 'connects',
        weight: 0.8,
        bidirectional: false,
        source: { agentId: 'agent-1', timestamp: new Date() },
        confidence: 0.8,
      });
    }

    const creationTime = Date.now() - startTime;

    // Query performance
    const queryStart = Date.now();
    const stats = graph.getGraphStats();
    const queryTime = Date.now() - queryStart;

    expect(stats.nodeCount).toBe(1000);
    expect(stats.edgeCount).toBe(500);
    expect(creationTime).toBeLessThan(5000); // Should complete in 5 seconds
    expect(queryTime).toBeLessThan(1000); // Stats should be fast

    graph.close();

    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
  });
});
