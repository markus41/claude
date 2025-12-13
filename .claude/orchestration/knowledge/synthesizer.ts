/**
 * Knowledge Synthesizer - Extract Knowledge from Memories
 *
 * Combines episodic memories, procedural knowledge, and facts to synthesize
 * new knowledge nodes, edges, patterns, and inferences.
 *
 * Features:
 * - Entity extraction from episodes
 * - Relation extraction
 * - Pattern detection (sequences, cycles, clusters)
 * - Knowledge generalization
 * - Quality scoring
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type {
  SynthesisJob,
  Pattern,
  KnowledgeNode,
  KnowledgeEdge,
  Inference,
  InferenceType,
} from './types.js';
import { KnowledgeGraph } from './knowledge-graph.js';

export interface SynthesizerOptions {
  graph: KnowledgeGraph;
  agentId: string;
}

export class KnowledgeSynthesizer {
  private graph: KnowledgeGraph;
  private db: Database.Database;
  private agentId: string;

  constructor(options: SynthesizerOptions) {
    this.graph = options.graph;
    this.agentId = options.agentId;
    this.db = (this.graph as any).db;
  }

  // ============================================
  // SYNTHESIS JOBS
  // ============================================

  async synthesize(job: Omit<SynthesisJob, 'id' | 'status' | 'createdAt' | 'outputNodes' | 'outputEdges' | 'errors'>): Promise<SynthesisJob> {
    const jobId = randomUUID();
    const createdAt = Date.now();

    // Create job record
    this.db
      .prepare(
        `INSERT INTO synthesis_jobs (id, source_type, source_ids, strategy, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', ?)`
      )
      .run(jobId, job.sourceType, JSON.stringify(job.sourceIds), job.strategy, createdAt);

    // Update to running
    this.db
      .prepare('UPDATE synthesis_jobs SET status = ?, started_at = ? WHERE id = ?')
      .run('running', Date.now(), jobId);

    const outputNodes: string[] = [];
    const outputEdges: string[] = [];
    const errors: string[] = [];

    try {
      switch (job.strategy) {
        case 'extract_entities':
          await this.extractEntities(job.sourceIds, outputNodes, outputEdges);
          break;

        case 'extract_relations':
          await this.extractRelations(job.sourceIds, outputEdges);
          break;

        case 'find_patterns':
          await this.findPatterns(job.sourceIds);
          break;

        case 'generalize':
          await this.generalizeKnowledge(job.sourceIds, outputNodes, outputEdges);
          break;
      }

      // Calculate quality score
      const quality = this.calculateQualityScore(outputNodes, outputEdges);

      // Update job as completed
      this.db
        .prepare(
          `UPDATE synthesis_jobs
           SET status = ?, completed_at = ?, output_nodes = ?, output_edges = ?, quality = ?
           WHERE id = ?`
        )
        .run(
          'completed',
          Date.now(),
          JSON.stringify(outputNodes),
          JSON.stringify(outputEdges),
          quality,
          jobId
        );

      return this.getJob(jobId)!;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      this.db
        .prepare('UPDATE synthesis_jobs SET status = ?, errors = ?, completed_at = ? WHERE id = ?')
        .run('failed', JSON.stringify(errors), Date.now(), jobId);

      throw error;
    }
  }

  // ============================================
  // ENTITY EXTRACTION
  // ============================================

  private async extractEntities(sourceIds: string[], outputNodes: string[], outputEdges: string[]): Promise<void> {
    // Extract entities from episodes
    for (const episodeId of sourceIds) {
      const episode = this.db
        .prepare('SELECT * FROM episodes WHERE id = ?')
        .get(episodeId) as any;

      if (!episode) continue;

      // Simple entity extraction: look for capitalized words, file paths, etc.
      const text = `${episode.task_description} ${episode.context} ${episode.notes || ''}`;
      const entities = this.extractEntitiesFromText(text);

      for (const entity of entities) {
        const node = this.graph.createNode({
          type: 'entity',
          label: entity.name,
          properties: {
            category: entity.category,
            extractedFrom: episodeId,
          },
          source: {
            agentId: this.agentId,
            episodeId,
            timestamp: new Date(),
          },
          confidence: 0.7,
          namespace: undefined,
        });

        outputNodes.push(node.id);
      }
    }
  }

  private extractEntitiesFromText(text: string): Array<{ name: string; category: string }> {
    const entities: Array<{ name: string; category: string }> = [];

    // Extract file paths
    const filePathRegex = /[A-Za-z]:[\\\/][^\s]+/g;
    const filePaths = text.match(filePathRegex) || [];
    for (const path of filePaths) {
      entities.push({ name: path, category: 'file_path' });
    }

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    for (const url of urls) {
      entities.push({ name: url, category: 'url' });
    }

    // Extract capitalized words (potential proper nouns)
    const capitalizedRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const capitalized = text.match(capitalizedRegex) || [];
    for (const word of capitalized) {
      if (word.length > 3 && !['The', 'This', 'That', 'There'].includes(word)) {
        entities.push({ name: word, category: 'entity' });
      }
    }

    return entities;
  }

  // ============================================
  // RELATION EXTRACTION
  // ============================================

  private async extractRelations(sourceIds: string[], outputEdges: string[]): Promise<void> {
    // Extract relations from procedure steps
    for (const procedureId of sourceIds) {
      const procedure = this.db
        .prepare('SELECT * FROM procedures WHERE id = ?')
        .get(procedureId) as any;

      if (!procedure) continue;

      const steps = this.db
        .prepare('SELECT * FROM procedure_steps WHERE procedure_id = ? ORDER BY step_order')
        .all(procedureId) as any[];

      // Create sequential relations between steps
      for (let i = 0; i < steps.length - 1; i++) {
        const currentAction = this.findOrCreateActionNode(steps[i].action_type);
        const nextAction = this.findOrCreateActionNode(steps[i + 1].action_type);

        const edge = this.graph.createEdge({
          sourceId: currentAction.id,
          targetId: nextAction.id,
          relation: 'precedes',
          weight: 0.8,
          properties: {
            procedureId,
            stepOrder: i,
          },
          bidirectional: false,
          source: {
            agentId: this.agentId,
            timestamp: new Date(),
          },
          confidence: 0.75,
        });

        outputEdges.push(edge.id);
      }
    }
  }

  private findOrCreateActionNode(actionType: string): KnowledgeNode {
    // Try to find existing action node
    const existing = this.db
      .prepare('SELECT * FROM knowledge_nodes WHERE type = ? AND label = ? AND is_deleted = 0 LIMIT 1')
      .get('action', actionType) as any;

    if (existing) {
      return (this.graph as any).rowToNode(existing);
    }

    // Create new action node
    return this.graph.createNode({
      type: 'action',
      label: actionType,
      properties: {},
      source: {
        agentId: this.agentId,
        timestamp: new Date(),
      },
      confidence: 0.9,
      namespace: undefined,
    });
  }

  // ============================================
  // PATTERN DETECTION
  // ============================================

  private async findPatterns(sourceIds: string[]): Promise<void> {
    // Find sequential patterns
    const sequences = this.findSequencePatterns();

    for (const sequence of sequences) {
      this.db
        .prepare(
          `INSERT INTO patterns (id, type, name, description, node_ids, edge_ids, frequency, confidence)
           VALUES (?, 'sequence', ?, ?, ?, ?, ?, ?)`
        )
        .run(
          randomUUID(),
          sequence.name,
          sequence.description || '',
          JSON.stringify(sequence.nodes),
          JSON.stringify(sequence.edges),
          sequence.frequency,
          sequence.confidence
        );
    }

    // Find cycles
    const cycles = this.findCyclePatterns();

    for (const cycle of cycles) {
      this.db
        .prepare(
          `INSERT INTO patterns (id, type, name, description, node_ids, edge_ids, frequency, confidence)
           VALUES (?, 'cycle', ?, ?, ?, ?, ?, ?)`
        )
        .run(
          randomUUID(),
          cycle.name,
          cycle.description || '',
          JSON.stringify(cycle.nodes),
          JSON.stringify(cycle.edges),
          cycle.frequency,
          cycle.confidence
        );
    }
  }

  private findSequencePatterns(): Array<{ name: string; description?: string; nodes: string[]; edges: string[]; frequency: number; confidence: number }> {
    // Find common action sequences (3+ actions)
    const sequences: any[] = [];

    const actions = this.db
      .prepare('SELECT id FROM knowledge_nodes WHERE type = ? AND is_deleted = 0')
      .all('action') as any[];

    for (const action of actions) {
      const outgoing = this.graph.getOutgoingEdges(action.id);
      if (outgoing.length >= 2) {
        sequences.push({
          name: `Sequence starting from ${this.graph.getNode(action.id)?.label}`,
          nodes: [action.id, ...outgoing.map(e => e.targetId)],
          edges: outgoing.map(e => e.id),
          frequency: 1,
          confidence: 0.6,
        });
      }
    }

    return sequences;
  }

  private findCyclePatterns(): Array<{ name: string; description?: string; nodes: string[]; edges: string[]; frequency: number; confidence: number }> {
    // Simplified cycle detection
    const cycles: any[] = [];

    const nodes = this.db
      .prepare('SELECT id FROM knowledge_nodes WHERE is_deleted = 0 LIMIT 1000')
      .all() as any[];

    for (const node of nodes) {
      const paths = this.graph.findAllPaths({
        startNodeId: node.id,
        endNodeId: node.id,
        maxHops: 5,
      });

      if (paths.length > 0) {
        const path = paths[0];
        cycles.push({
          name: `Cycle involving ${path.nodes.length} nodes`,
          nodes: path.nodes.map(n => n.id),
          edges: path.edges.map(e => e.id),
          frequency: paths.length,
          confidence: path.confidence,
        });
      }
    }

    return cycles;
  }

  // ============================================
  // KNOWLEDGE GENERALIZATION
  // ============================================

  private async generalizeKnowledge(sourceIds: string[], outputNodes: string[], outputEdges: string[]): Promise<void> {
    // Generalize from specific facts to concepts
    for (const factId of sourceIds) {
      const fact = this.db
        .prepare('SELECT * FROM facts WHERE id = ?')
        .get(factId) as any;

      if (!fact) continue;

      // Create concept nodes for subjects and objects if they don't exist
      const subjectNode = this.findOrCreateConceptNode(fact.subject);
      const objectNode = this.findOrCreateConceptNode(fact.object);

      outputNodes.push(subjectNode.id, objectNode.id);

      // Create relationship edge
      const edge = this.graph.createEdge({
        sourceId: subjectNode.id,
        targetId: objectNode.id,
        relation: fact.predicate,
        weight: fact.confidence,
        properties: {
          derivedFrom: factId,
        },
        bidirectional: false,
        source: {
          agentId: this.agentId,
          timestamp: new Date(),
        },
        confidence: fact.confidence,
      });

      outputEdges.push(edge.id);
    }
  }

  private findOrCreateConceptNode(label: string): KnowledgeNode {
    const existing = this.db
      .prepare('SELECT * FROM knowledge_nodes WHERE type = ? AND label = ? AND is_deleted = 0 LIMIT 1')
      .get('concept', label) as any;

    if (existing) {
      return (this.graph as any).rowToNode(existing);
    }

    return this.graph.createNode({
      type: 'concept',
      label,
      properties: {},
      source: {
        agentId: this.agentId,
        timestamp: new Date(),
      },
      confidence: 0.8,
      namespace: undefined,
    });
  }

  // ============================================
  // INFERENCE GENERATION
  // ============================================

  generateInferences(maxInferences: number = 100): Inference[] {
    const inferences: Inference[] = [];

    // Simple deduction: if A -> B and B -> C, then infer A -> C
    const nodes = this.db
      .prepare('SELECT id FROM knowledge_nodes WHERE is_deleted = 0 LIMIT 1000')
      .all() as any[];

    for (const node of nodes) {
      if (inferences.length >= maxInferences) break;

      const outgoing = this.graph.getOutgoingEdges(node.id);

      for (const edge1 of outgoing) {
        const intermediate = this.graph.getNode(edge1.targetId);
        if (!intermediate) continue;

        const secondHop = this.graph.getOutgoingEdges(intermediate.id);

        for (const edge2 of secondHop) {
          if (edge1.relation === edge2.relation) {
            // Infer transitive relationship
            const conclusion = this.graph.createEdge({
              sourceId: node.id,
              targetId: edge2.targetId,
              relation: edge1.relation,
              weight: edge1.weight * edge2.weight,
              properties: {
                inferred: true,
              },
              bidirectional: false,
              source: {
                agentId: this.agentId,
                timestamp: new Date(),
              },
              confidence: edge1.confidence * edge2.confidence,
            });

            const inference: Inference = {
              id: randomUUID(),
              type: 'deduction',
              premise: [this.graph.getNode(node.id)!, intermediate, this.graph.getNode(edge2.targetId)!],
              premiseEdges: [edge1, edge2],
              conclusion,
              confidence: edge1.confidence * edge2.confidence,
              reasoning: [
                `${edge1.sourceId} ${edge1.relation} ${edge1.targetId}`,
                `${edge2.sourceId} ${edge2.relation} ${edge2.targetId}`,
                `Therefore: ${node.id} ${edge1.relation} ${edge2.targetId}`,
              ],
              timestamp: new Date(),
              verified: false,
            };

            inferences.push(inference);

            // Store in database
            this.db
              .prepare(
                `INSERT INTO knowledge_inferences (id, type, premise_nodes, premise_edges, conclusion_type, conclusion_id, confidence, reasoning, verified)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
              )
              .run(
                inference.id,
                inference.type,
                JSON.stringify(inference.premise.map(n => n.id)),
                JSON.stringify(inference.premiseEdges?.map(e => e.id) || []),
                'edge',
                conclusion.id,
                inference.confidence,
                JSON.stringify(inference.reasoning),
                0
              );
          }
        }
      }
    }

    return inferences;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private calculateQualityScore(nodeIds: string[], edgeIds: string[]): number {
    if (nodeIds.length === 0 && edgeIds.length === 0) return 0;

    const nodes = nodeIds.map(id => this.graph.getNode(id)).filter(Boolean) as KnowledgeNode[];
    const edges = edgeIds.map(id => this.graph.getEdge(id)).filter(Boolean) as KnowledgeEdge[];

    const avgNodeConfidence = nodes.reduce((sum, n) => sum + n.confidence, 0) / (nodes.length || 1);
    const avgEdgeConfidence = edges.reduce((sum, e) => sum + e.confidence, 0) / (edges.length || 1);

    return (avgNodeConfidence + avgEdgeConfidence) / 2;
  }

  getJob(jobId: string): SynthesisJob | null {
    const row = this.db
      .prepare('SELECT * FROM synthesis_jobs WHERE id = ?')
      .get(jobId) as any;

    if (!row) return null;

    return {
      id: row.id,
      sourceType: row.source_type,
      sourceIds: JSON.parse(row.source_ids),
      strategy: row.strategy,
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      outputNodes: row.output_nodes ? JSON.parse(row.output_nodes) : [],
      outputEdges: row.output_edges ? JSON.parse(row.output_edges) : [],
      quality: row.quality,
      errors: row.errors ? JSON.parse(row.errors) : [],
    };
  }

  listJobs(filters?: { status?: string; limit?: number }): SynthesisJob[] {
    let query = 'SELECT * FROM synthesis_jobs WHERE 1=1';
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = this.db.prepare(query).all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      sourceType: row.source_type,
      sourceIds: JSON.parse(row.source_ids),
      strategy: row.strategy,
      status: row.status,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      outputNodes: row.output_nodes ? JSON.parse(row.output_nodes) : [],
      outputEdges: row.output_edges ? JSON.parse(row.output_edges) : [],
      quality: row.quality,
      errors: row.errors ? JSON.parse(row.errors) : [],
    }));
  }
}
