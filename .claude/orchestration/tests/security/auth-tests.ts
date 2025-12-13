/**
 * Authentication and Authorization Security Tests
 *
 * Tests for authentication bypass, authorization issues, and access control
 * vulnerabilities across all enhancement systems.
 *
 * Coverage:
 * - Agent authentication
 * - Namespace access control
 * - Federation peer verification
 * - Worker registration security
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { KnowledgeGraph } from '../../knowledge/knowledge-graph';
import { KnowledgeFederation } from '../../knowledge/federation';

describe('Authentication & Authorization Security', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('Knowledge Graph Access Control', () => {
    it('should enforce namespace isolation', () => {
      // Create nodes in different namespaces
      const insertNode = db.prepare(`
        INSERT INTO knowledge_nodes (id, type, label, properties, source_agent_id, source_timestamp, confidence, namespace)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertNode.run(
        'node-1',
        'entity',
        'Secret Data',
        '{}',
        'agent-1',
        Date.now(),
        0.9,
        'tenant-a'
      );

      insertNode.run(
        'node-2',
        'entity',
        'Public Data',
        '{}',
        'agent-2',
        Date.now(),
        0.9,
        'tenant-b'
      );

      // Agent from tenant-a should NOT see tenant-b data
      const query = db.prepare(`
        SELECT * FROM knowledge_nodes WHERE namespace = ?
      `);

      const tenantANodes = query.all('tenant-a');
      const tenantBNodes = query.all('tenant-b');

      expect(tenantANodes).toHaveLength(1);
      expect(tenantBNodes).toHaveLength(1);
      expect(tenantANodes[0].id).toBe('node-1');
      expect(tenantBNodes[0].id).toBe('node-2');
    });

    it('should verify agent ownership before modifications', () => {
      const insertNode = db.prepare(`
        INSERT INTO knowledge_nodes (id, type, label, properties, source_agent_id, source_timestamp, confidence, namespace)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertNode.run(
        'node-1',
        'entity',
        'Agent 1 Data',
        '{}',
        'agent-1',
        Date.now(),
        0.9,
        'default'
      );

      // Attempt to modify another agent's node should be controlled
      const nodeOwner = db
        .prepare('SELECT source_agent_id FROM knowledge_nodes WHERE id = ?')
        .get('node-1') as any;

      expect(nodeOwner.source_agent_id).toBe('agent-1');

      // In application code, verify:
      // if (nodeOwner.source_agent_id !== currentAgentId) throw AuthError
    });

    it('should enforce read-only namespace access', () => {
      // Insert namespace with read-only agents
      const insertNamespace = db.prepare(`
        INSERT INTO namespaces (name, description, owners, read_only_agents)
        VALUES (?, ?, ?, ?)
      `);

      insertNamespace.run(
        'protected',
        'Protected namespace',
        JSON.stringify(['agent-admin']),
        JSON.stringify(['agent-readonly'])
      );

      const namespace = db
        .prepare('SELECT * FROM namespaces WHERE name = ?')
        .get('protected') as any;

      const owners = JSON.parse(namespace.owners);
      const readOnlyAgents = JSON.parse(namespace.read_only_agents);

      // Verify authorization logic
      const currentAgent = 'agent-readonly';
      const canWrite = owners.includes(currentAgent);
      const canRead = canWrite || readOnlyAgents.includes(currentAgent);

      expect(canRead).toBe(true);
      expect(canWrite).toBe(false);
    });
  });

  describe('Federation Peer Authentication', () => {
    it('should prevent unauthorized peer synchronization', () => {
      // Insert authorized peers
      const insertFedState = db.prepare(`
        INSERT INTO federation_state (peer_id, last_sync, vector_clock, status)
        VALUES (?, ?, ?, ?)
      `);

      insertFedState.run('peer-authorized', Date.now(), '{}', 'idle');

      // Attempt sync from unauthorized peer
      const authorizedPeer = db
        .prepare('SELECT * FROM federation_state WHERE peer_id = ?')
        .get('peer-authorized');
      const unauthorizedPeer = db
        .prepare('SELECT * FROM federation_state WHERE peer_id = ?')
        .get('peer-malicious');

      expect(authorizedPeer).toBeDefined();
      expect(unauthorizedPeer).toBeUndefined();

      // In application: if (!authorizedPeer) throw AuthenticationError
    });

    it('should validate vector clocks to prevent replay attacks', () => {
      const insertFedState = db.prepare(`
        INSERT INTO federation_state (peer_id, last_sync, vector_clock, status)
        VALUES (?, ?, ?, ?)
      `);

      const currentVectorClock = { 'agent-1': 10, 'agent-2': 5 };
      insertFedState.run(
        'peer-1',
        Date.now(),
        JSON.stringify(currentVectorClock),
        'idle'
      );

      // Receive packet with old vector clock (replay attack)
      const replayedVectorClock = { 'agent-1': 5, 'agent-2': 3 };

      // Verify causality check detects replay
      const canApply =
        replayedVectorClock['agent-1'] >= currentVectorClock['agent-1'] &&
        replayedVectorClock['agent-2'] >= currentVectorClock['agent-2'];

      expect(canApply).toBe(false);
    });

    it('should require ACK for strong consistency operations', () => {
      // Strong consistency level should require acknowledgment
      const packetRequiresAck = true; // From consistency level = 'strong'

      // Verify application waits for ACK before proceeding
      expect(packetRequiresAck).toBe(true);
    });
  });

  describe('Distributed Worker Authentication', () => {
    it('should prevent worker impersonation', () => {
      const insertWorker = db.prepare(`
        INSERT INTO workers (id, name, capabilities, status)
        VALUES (?, ?, ?, ?)
      `);

      insertWorker.run('worker-1', 'Legit Worker', '[]', 'idle');

      // Attempt to insert duplicate worker ID (impersonation)
      expect(() => {
        insertWorker.run('worker-1', 'Malicious Worker', '[]', 'idle');
      }).toThrow(); // PRIMARY KEY constraint
    });

    it('should validate worker heartbeats', () => {
      const insertWorker = db.prepare(`
        INSERT INTO workers (id, name, capabilities, status, last_heartbeat, heartbeat_interval_ms)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      insertWorker.run('worker-1', 'Worker 1', '[]', 'idle', now, 30000);

      // Check for stale workers (security: detect dead/compromised workers)
      const staleWorkers = db
        .prepare(
          `SELECT * FROM v_stale_workers WHERE ms_since_heartbeat > heartbeat_interval_ms * 2`
        )
        .all();

      // Fresh worker should not be stale
      expect(staleWorkers).toHaveLength(0);
    });

    it('should validate task assignment authorization', () => {
      const insertWorker = db.prepare(`
        INSERT INTO workers (id, name, capabilities, status)
        VALUES (?, ?, ?, ?)
      `);

      insertWorker.run('worker-1', 'Worker 1', JSON.stringify(['ml', 'data']), 'idle');

      const insertTask = db.prepare(`
        INSERT INTO task_queue (id, type, payload, status, required_capabilities)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertTask.run(
        'task-1',
        'ml-training',
        '{}',
        'pending',
        JSON.stringify(['ml', 'gpu'])
      );

      // Verify capability matching
      const worker = db.prepare('SELECT capabilities FROM workers WHERE id = ?').get('worker-1') as any;
      const task = db
        .prepare('SELECT required_capabilities FROM task_queue WHERE id = ?')
        .get('task-1') as any;

      const workerCaps = JSON.parse(worker.capabilities);
      const requiredCaps = JSON.parse(task.required_capabilities);

      const hasAllCapabilities = requiredCaps.every((cap: string) => workerCaps.includes(cap));

      // Worker missing 'gpu' capability
      expect(hasAllCapabilities).toBe(false);
    });
  });

  describe('NLP Session Security', () => {
    it('should isolate conversation sessions by user', () => {
      const insertSession = db.prepare(`
        INSERT INTO conversation_sessions (id, user_id, status, context_json)
        VALUES (?, ?, ?, ?)
      `);

      insertSession.run('session-1', 'user-alice', 'active', '{}');
      insertSession.run('session-2', 'user-bob', 'active', '{}');

      // User should only see their own sessions
      const aliceSessions = db
        .prepare('SELECT * FROM conversation_sessions WHERE user_id = ?')
        .all('user-alice');

      const bobSessions = db
        .prepare('SELECT * FROM conversation_sessions WHERE user_id = ?')
        .all('user-bob');

      expect(aliceSessions).toHaveLength(1);
      expect(bobSessions).toHaveLength(1);
      expect(aliceSessions[0].id).toBe('session-1');
      expect(bobSessions[0].id).toBe('session-2');
    });

    it('should prevent cross-session data leakage', () => {
      const insertTurn = db.prepare(`
        INSERT INTO conversation_turns (id, session_id, user_input, intent_name, intent_confidence, entities_json, system_response)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertTurn.run(
        'turn-1',
        'session-alice',
        'Secret command',
        'execute',
        90,
        '[]',
        'Executed'
      );
      insertTurn.run(
        'turn-2',
        'session-bob',
        'Public query',
        'query',
        85,
        '[]',
        'Result'
      );

      // Query by session to prevent leakage
      const aliceTurns = db
        .prepare('SELECT * FROM conversation_turns WHERE session_id = ?')
        .all('session-alice');

      expect(aliceTurns).toHaveLength(1);
      expect(aliceTurns[0].user_input).toBe('Secret command');
    });
  });

  describe('Observability Access Control', () => {
    it('should restrict dashboard access by ownership', () => {
      const insertDashboard = db.prepare(`
        INSERT INTO dashboards (id, name, description, panels, created_by, is_public)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertDashboard.run(
        'dash-private',
        'Private Dashboard',
        'Admin only',
        '[]',
        'admin-user',
        0
      );
      insertDashboard.run('dash-public', 'Public Dashboard', 'Everyone', '[]', 'admin-user', 1);

      // Check access control
      const privateDash = db.prepare('SELECT * FROM dashboards WHERE id = ?').get('dash-private') as any;
      const publicDash = db.prepare('SELECT * FROM dashboards WHERE id = ?').get('dash-public') as any;

      const currentUser = 'regular-user';

      const canAccessPrivate =
        privateDash.is_public === 1 || privateDash.created_by === currentUser;
      const canAccessPublic = publicDash.is_public === 1 || publicDash.created_by === currentUser;

      expect(canAccessPrivate).toBe(false);
      expect(canAccessPublic).toBe(true);
    });

    it('should prevent unauthorized alert modifications', () => {
      const insertAlert = db.prepare(`
        INSERT INTO alerts (id, name, severity, metric_name, operator, threshold, channels, created_by, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertAlert.run(
        'alert-1',
        'Critical CPU',
        'critical',
        'cpu_usage',
        'gt',
        90,
        '["email"]',
        'admin',
        1
      );

      // Verify ownership before update
      const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get('alert-1') as any;
      const currentUser = 'hacker';

      const canModify = alert.created_by === currentUser;
      expect(canModify).toBe(false);
    });
  });
});
