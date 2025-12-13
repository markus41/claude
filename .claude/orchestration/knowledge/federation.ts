/**
 * Knowledge Federation - Cross-Agent Knowledge Sharing
 *
 * Manages synchronization of knowledge across multiple agent instances with
 * conflict detection, resolution, and consistency guarantees.
 *
 * Features:
 * - Sync modes: sync, async, event-driven
 * - Consistency levels: strong, eventual, causal
 * - Vector clocks for causal ordering
 * - Conflict detection and resolution
 * - Peer management and discovery
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type {
  FederationConfig,
  SyncState,
  KnowledgePacket,
  Conflict,
  ConflictType,
  ResolutionStrategy,
  KnowledgeNode,
  KnowledgeEdge,
  Inference,
  SyncMode,
  ConsistencyLevel,
} from './types.js';
import { KnowledgeGraph } from './knowledge-graph.js';

export interface FederationOptions {
  graph: KnowledgeGraph;
  config: FederationConfig;
}

export class KnowledgeFederation {
  private graph: KnowledgeGraph;
  private config: FederationConfig;
  private db: Database.Database;
  private vectorClock: Map<string, number>;
  private syncStates: Map<string, SyncState>;
  private sequenceNumber: number;

  constructor(options: FederationOptions) {
    this.graph = options.graph;
    this.config = options.config;
    this.db = (this.graph as any).db; // Access underlying database
    this.vectorClock = new Map([[this.config.agentId, 0]]);
    this.syncStates = new Map();
    this.sequenceNumber = 0;

    this.initializePeers();

    if (this.config.syncMode === 'sync' && this.config.syncIntervalMs) {
      this.startPeriodicSync();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializePeers(): void {
    for (const peerId of this.config.peers) {
      const existing = this.db
        .prepare('SELECT * FROM federation_state WHERE peer_id = ?')
        .get(peerId) as any;

      if (!existing) {
        this.db
          .prepare(
            `INSERT INTO federation_state (peer_id, last_sync, vector_clock, status)
             VALUES (?, ?, ?, ?)`
          )
          .run(peerId, Date.now(), JSON.stringify({}), 'idle');
      }

      const state: SyncState = {
        peerId,
        lastSync: new Date(existing?.last_sync || Date.now()),
        lastSuccessfulSync: existing?.last_successful_sync ? new Date(existing.last_successful_sync) : undefined,
        vectorClock: new Map(Object.entries(JSON.parse(existing?.vector_clock || '{}'))),
        nodesSynced: existing?.nodes_synced || 0,
        edgesSynced: existing?.edges_synced || 0,
        errors: existing?.errors ? JSON.parse(existing.errors) : [],
        status: existing?.status || 'idle',
      };

      this.syncStates.set(peerId, state);
    }
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      this.syncWithAllPeers().catch(err => {
        console.error('Periodic sync failed:', err);
      });
    }, this.config.syncIntervalMs!);
  }

  // ============================================
  // SYNCHRONIZATION
  // ============================================

  async syncWithPeer(peerId: string): Promise<void> {
    const state = this.syncStates.get(peerId);
    if (!state) {
      throw new Error(`Unknown peer: ${peerId}`);
    }

    if (state.status === 'syncing') {
      console.warn(`Already syncing with ${peerId}`);
      return;
    }

    this.updateSyncState(peerId, { status: 'syncing' });

    try {
      // 1. Prepare knowledge packet
      const packet = this.prepareKnowledgePacket(peerId);

      // 2. Send to peer (placeholder - implement actual network call)
      await this.sendPacketToPeer(peerId, packet);

      // 3. Receive knowledge from peer
      // In real implementation, this would be a callback or event handler
      // const receivedPacket = await this.receivePacketFromPeer(peerId);
      // this.processReceivedPacket(receivedPacket);

      // 4. Update sync state
      this.updateSyncState(peerId, {
        status: 'idle',
        lastSuccessfulSync: new Date(),
        nodesSynced: state.nodesSynced + packet.nodes.length,
        edgesSynced: state.edgesSynced + packet.edges.length,
      });

      // Update database
      this.db
        .prepare(
          `UPDATE federation_state
           SET last_sync = ?, last_successful_sync = ?, nodes_synced = ?, edges_synced = ?, status = ?, vector_clock = ?
           WHERE peer_id = ?`
        )
        .run(
          Date.now(),
          Date.now(),
          state.nodesSynced,
          state.edgesSynced,
          'idle',
          JSON.stringify(Object.fromEntries(state.vectorClock)),
          peerId
        );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      state.errors.push(errorMessage);

      this.updateSyncState(peerId, { status: 'error' });

      this.db
        .prepare(
          `UPDATE federation_state
           SET status = ?, errors = ?
           WHERE peer_id = ?`
        )
        .run('error', JSON.stringify(state.errors), peerId);

      throw error;
    }
  }

  async syncWithAllPeers(): Promise<void> {
    const syncPromises = this.config.peers.map(peerId => this.syncWithPeer(peerId));

    if (this.config.syncMode === 'sync') {
      await Promise.all(syncPromises);
    } else {
      // Fire and forget for async mode
      Promise.all(syncPromises).catch(err => {
        console.error('Background sync failed:', err);
      });
    }
  }

  // ============================================
  // PACKET MANAGEMENT
  // ============================================

  private prepareKnowledgePacket(targetPeerId: string): KnowledgePacket {
    const state = this.syncStates.get(targetPeerId)!;
    const lastSyncTime = state.lastSuccessfulSync?.getTime() || 0;

    // Get nodes updated since last sync
    const nodes = this.db
      .prepare(
        `SELECT * FROM knowledge_nodes
         WHERE updated_at > ? AND is_deleted = 0 AND source_agent_id = ?
         ORDER BY updated_at ASC
         LIMIT 1000`
      )
      .all(lastSyncTime, this.config.agentId) as any[];

    // Get edges updated since last sync
    const edges = this.db
      .prepare(
        `SELECT * FROM knowledge_edges
         WHERE updated_at > ? AND is_deleted = 0 AND source_agent_id = ?
         ORDER BY updated_at ASC
         LIMIT 1000`
      )
      .all(lastSyncTime, this.config.agentId) as any[];

    // Increment vector clock
    this.incrementVectorClock();

    const packet: KnowledgePacket = {
      sourceAgentId: this.config.agentId,
      targetAgentId: targetPeerId,
      nodes: nodes.map(row => (this.graph as any).rowToNode(row)),
      edges: edges.map(row => (this.graph as any).rowToEdge(row)),
      vectorClock: new Map(this.vectorClock),
      timestamp: new Date(),
      sequenceNumber: ++this.sequenceNumber,
      requiresAck: this.config.consistencyLevel === 'strong',
    };

    return packet;
  }

  processReceivedPacket(packet: KnowledgePacket): void {
    // Check if packet is from the future (causal consistency)
    if (!this.canApplyPacket(packet)) {
      console.warn(`Packet from ${packet.sourceAgentId} is from the future, queueing...`);
      // In real implementation, queue and retry later
      return;
    }

    const conflicts: Conflict[] = [];

    // Process nodes
    for (const node of packet.nodes) {
      const existing = this.graph.getNode(node.id);

      if (existing && !this.shouldAccept(node, existing)) {
        // Conflict detected
        const conflict = this.createConflict('concurrent_update', [node, existing], []);
        conflicts.push(conflict);
        continue;
      }

      if (existing) {
        // Update existing
        try {
          this.graph.updateNode(node.id, node, existing.version);
        } catch (error) {
          // Version conflict - record it
          const conflict = this.createConflict('concurrent_update', [node, existing], []);
          conflicts.push(conflict);
        }
      } else {
        // Create new
        this.graph.createNode(node);
      }
    }

    // Process edges
    for (const edge of packet.edges) {
      const existing = this.graph.getEdge(edge.id);

      if (existing && !this.shouldAccept(edge, existing)) {
        const conflict = this.createConflict('concurrent_update', [], [edge, existing]);
        conflicts.push(conflict);
        continue;
      }

      if (existing) {
        try {
          this.graph.updateEdge(edge.id, edge, existing.version);
        } catch (error) {
          const conflict = this.createConflict('concurrent_update', [], [edge, existing]);
          conflicts.push(conflict);
        }
      } else {
        this.graph.createEdge(edge);
      }
    }

    // Update vector clock
    this.mergeVectorClock(packet.vectorClock);

    // Log conflicts
    for (const conflict of conflicts) {
      this.recordConflict(conflict);
    }
  }

  // ============================================
  // CONFLICT MANAGEMENT
  // ============================================

  private shouldAccept(
    incoming: KnowledgeNode | KnowledgeEdge,
    existing: KnowledgeNode | KnowledgeEdge
  ): boolean {
    if (!this.config.autoAccept) {
      return false;
    }

    if (incoming.confidence < this.config.minConfidenceThreshold) {
      return false;
    }

    // Strategy: highest confidence wins
    if (incoming.confidence > existing.confidence) {
      return true;
    }

    // If equal confidence, latest write wins
    if (incoming.confidence === existing.confidence) {
      return incoming.updatedAt > existing.updatedAt;
    }

    return false;
  }

  private createConflict(
    type: ConflictType,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Conflict {
    return {
      id: randomUUID(),
      type,
      nodes,
      edges,
      agents: [...new Set([...nodes.map(n => n.source.agentId), ...edges.map(e => e.source.agentId)])],
      detectedAt: new Date(),
      status: 'unresolved',
    };
  }

  private recordConflict(conflict: Conflict): void {
    this.db
      .prepare(
        `INSERT INTO knowledge_conflicts (id, type, node_ids, edge_ids, agents, status, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        conflict.id,
        conflict.type,
        JSON.stringify(conflict.nodes.map(n => n.id)),
        JSON.stringify(conflict.edges?.map(e => e.id) || []),
        JSON.stringify(conflict.agents),
        conflict.status,
        conflict.detectedAt.getTime()
      );
  }

  resolveConflict(conflictId: string, strategy: ResolutionStrategy): void {
    const conflict = this.getConflict(conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    let resolution: KnowledgeNode | KnowledgeEdge | undefined;

    switch (strategy) {
      case 'highest_confidence':
        if (conflict.nodes.length > 0) {
          resolution = conflict.nodes.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          );
        } else if (conflict.edges && conflict.edges.length > 0) {
          resolution = conflict.edges.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          );
        }
        break;

      case 'latest_write_wins':
        if (conflict.nodes.length > 0) {
          resolution = conflict.nodes.reduce((best, current) =>
            current.updatedAt > best.updatedAt ? current : best
          );
        } else if (conflict.edges && conflict.edges.length > 0) {
          resolution = conflict.edges.reduce((best, current) =>
            current.updatedAt > best.updatedAt ? current : best
          );
        }
        break;

      case 'merge':
        // Implement merge logic (average confidence, combine properties, etc.)
        // This is simplified - real merge would be more sophisticated
        if (conflict.nodes.length > 0) {
          const merged = conflict.nodes[0];
          merged.confidence = conflict.nodes.reduce((sum, n) => sum + n.confidence, 0) / conflict.nodes.length;
          resolution = merged;
        }
        break;

      case 'manual':
        // Manual resolution - requires external input
        console.log('Manual resolution required for conflict:', conflictId);
        return;
    }

    if (resolution) {
      this.db
        .prepare(
          `UPDATE knowledge_conflicts
           SET status = ?, resolution_strategy = ?, resolution_type = ?, resolution_id = ?, resolved_at = ?
           WHERE id = ?`
        )
        .run(
          'resolved',
          strategy,
          'label' in resolution ? 'node' : 'edge',
          resolution.id,
          Date.now(),
          conflictId
        );
    }
  }

  getConflict(conflictId: string): Conflict | null {
    const row = this.db
      .prepare('SELECT * FROM knowledge_conflicts WHERE id = ?')
      .get(conflictId) as any;

    if (!row) return null;

    const nodeIds = JSON.parse(row.node_ids || '[]');
    const edgeIds = JSON.parse(row.edge_ids || '[]');

    return {
      id: row.id,
      type: row.type,
      nodes: nodeIds.map((id: string) => this.graph.getNode(id)).filter(Boolean),
      edges: edgeIds.map((id: string) => this.graph.getEdge(id)).filter(Boolean),
      agents: JSON.parse(row.agents),
      detectedAt: new Date(row.detected_at),
      status: row.status,
      resolutionStrategy: row.resolution_strategy,
      resolution: row.resolution_id
        ? row.resolution_type === 'node'
          ? this.graph.getNode(row.resolution_id) || undefined
          : this.graph.getEdge(row.resolution_id) || undefined
        : undefined,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      notes: row.notes,
    };
  }

  // ============================================
  // VECTOR CLOCK OPERATIONS
  // ============================================

  private incrementVectorClock(): void {
    const current = this.vectorClock.get(this.config.agentId) || 0;
    this.vectorClock.set(this.config.agentId, current + 1);
  }

  private mergeVectorClock(otherClock: Map<string, number>): void {
    for (const [agentId, timestamp] of otherClock) {
      const current = this.vectorClock.get(agentId) || 0;
      this.vectorClock.set(agentId, Math.max(current, timestamp));
    }
  }

  private canApplyPacket(packet: KnowledgePacket): boolean {
    // Check if we have seen all events that happened before this packet
    for (const [agentId, timestamp] of packet.vectorClock) {
      if (agentId === packet.sourceAgentId) continue;

      const ourTimestamp = this.vectorClock.get(agentId) || 0;
      if (timestamp > ourTimestamp) {
        return false; // Missing events from this agent
      }
    }

    return true;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private updateSyncState(peerId: string, updates: Partial<SyncState>): void {
    const state = this.syncStates.get(peerId)!;
    Object.assign(state, updates);
    this.syncStates.set(peerId, state);
  }

  private async sendPacketToPeer(peerId: string, packet: KnowledgePacket): Promise<void> {
    // Placeholder for actual network implementation
    // This would use HTTP, WebSocket, gRPC, etc.
    console.log(`Sending packet to ${peerId}:`, {
      nodes: packet.nodes.length,
      edges: packet.edges.length,
      sequence: packet.sequenceNumber,
    });

    // Log replication
    this.db
      .prepare(
        `INSERT INTO replication_log (id, operation, entity_type, entity_id, source_agent, target_agent, vector_clock, timestamp, status)
         VALUES (?, 'create', 'node', '', ?, ?, ?, ?, 'pending')`
      )
      .run(
        randomUUID(),
        this.config.agentId,
        peerId,
        JSON.stringify(Object.fromEntries(packet.vectorClock)),
        packet.timestamp.getTime()
      );
  }

  getSyncState(peerId: string): SyncState | undefined {
    return this.syncStates.get(peerId);
  }

  getAllSyncStates(): Map<string, SyncState> {
    return new Map(this.syncStates);
  }

  getVectorClock(): Map<string, number> {
    return new Map(this.vectorClock);
  }
}
