/**
 * Conversation Management System
 * Handles session state, turn tracking, and slot filling
 */

import type {
  ConversationState,
  ConversationTurn,
  ConversationContext,
  ConversationSessionRecord,
  ConversationTurnRecord,
  Intent,
  Entity,
  Slot,
  SlotFillingState,
  GeneratedAction,
} from './types.js';
import Database from 'better-sqlite3';

export class ConversationManager {
  private db: Database.Database;
  private activeSessions: Map<string, ConversationState> = new Map();

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Create a new conversation session
   */
  createSession(userId?: string): ConversationState {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const session: ConversationState = {
      sessionId,
      userId,
      entities: [],
      slots: {},
      history: [],
      context: {
        recentEntities: [],
        preferences: {},
        metadata: {},
      },
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };

    // Save to database
    this.db
      .prepare(
        `INSERT INTO conversation_sessions (id, user_id, status, context_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        sessionId,
        userId || null,
        'active',
        JSON.stringify(session.context),
        now.toISOString(),
        now.toISOString()
      );

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConversationState | null {
    // Check active sessions first
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId)!;
    }

    // Load from database
    const record = this.db
      .prepare(`SELECT * FROM conversation_sessions WHERE id = ?`)
      .get(sessionId) as ConversationSessionRecord | undefined;

    if (!record) return null;

    // Load turns
    const turns = this.loadTurns(sessionId);

    const session: ConversationState = {
      sessionId: record.id,
      userId: record.user_id,
      entities: turns.flatMap((t) => t.entities),
      slots: {},
      history: turns,
      context: JSON.parse(record.context_json),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      status: record.status as any,
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Add turn to conversation
   */
  addTurn(
    sessionId: string,
    userInput: string,
    intent: Intent,
    entities: Entity[],
    systemResponse: string,
    actions?: GeneratedAction[]
  ): ConversationTurn {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const turnId = `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const turn: ConversationTurn = {
      id: turnId,
      userInput,
      intent,
      entities,
      systemResponse,
      actions,
      timestamp: now,
    };

    // Add to session history
    session.history.push(turn);
    session.entities.push(...entities);
    session.updatedAt = now;

    // Save turn to database
    this.db
      .prepare(
        `INSERT INTO conversation_turns (
          id, session_id, user_input, intent_name, intent_confidence,
          entities_json, system_response, actions_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        turnId,
        sessionId,
        userInput,
        intent.name,
        intent.confidence,
        JSON.stringify(entities),
        systemResponse,
        actions ? JSON.stringify(actions) : null,
        now.toISOString()
      );

    // Update session
    this.updateSession(session);

    return turn;
  }

  /**
   * Update session in database
   */
  private updateSession(session: ConversationState): void {
    this.db
      .prepare(
        `UPDATE conversation_sessions
         SET status = ?, context_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        session.status,
        JSON.stringify(session.context),
        session.updatedAt.toISOString(),
        session.sessionId
      );

    this.activeSessions.set(session.sessionId, session);
  }

  /**
   * Update session context
   */
  updateContext(sessionId: string, context: Partial<ConversationContext>): void {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.context = {
      ...session.context,
      ...context,
    };
    session.updatedAt = new Date();

    this.updateSession(session);
  }

  /**
   * End conversation session
   */
  endSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.updatedAt = new Date();

    this.updateSession(session);
    this.activeSessions.delete(sessionId);
  }

  /**
   * Abandon session (due to timeout or error)
   */
  abandonSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.status = 'abandoned';
    session.updatedAt = new Date();

    this.updateSession(session);
    this.activeSessions.delete(sessionId);
  }

  /**
   * Load turns for a session
   */
  private loadTurns(sessionId: string): ConversationTurn[] {
    const records = this.db
      .prepare(
        `SELECT * FROM conversation_turns
         WHERE session_id = ?
         ORDER BY created_at ASC`
      )
      .all(sessionId) as ConversationTurnRecord[];

    return records.map((record) => ({
      id: record.id,
      userInput: record.user_input,
      intent: {
        name: record.intent_name,
        confidence: record.intent_confidence,
        category: 'command' as any,
        keywords: [],
      },
      entities: JSON.parse(record.entities_json),
      systemResponse: record.system_response,
      actions: record.actions_json ? JSON.parse(record.actions_json) : undefined,
      timestamp: new Date(record.created_at),
      duration: record.duration_ms,
    }));
  }

  /**
   * Get recent sessions
   */
  getRecentSessions(limit: number = 10): ConversationState[] {
    const records = this.db
      .prepare(
        `SELECT * FROM conversation_sessions
         ORDER BY updated_at DESC
         LIMIT ?`
      )
      .all(limit) as ConversationSessionRecord[];

    return records.map((record) => ({
      sessionId: record.id,
      userId: record.user_id,
      entities: [],
      slots: {},
      history: [],
      context: JSON.parse(record.context_json),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      status: record.status as any,
    }));
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): ConversationState[] {
    const records = this.db
      .prepare(
        `SELECT * FROM conversation_sessions
         WHERE status = 'active'
         ORDER BY updated_at DESC`
      )
      .all() as ConversationSessionRecord[];

    return records.map((record) => ({
      sessionId: record.id,
      userId: record.user_id,
      entities: [],
      slots: {},
      history: [],
      context: JSON.parse(record.context_json),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      status: 'active',
    }));
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions(maxAge: number = 86400000): number {
    const cutoff = new Date(Date.now() - maxAge);

    const result = this.db
      .prepare(
        `DELETE FROM conversation_sessions
         WHERE status != 'active' AND updated_at < ?`
      )
      .run(cutoff.toISOString());

    return result.changes;
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    avgTurnsPerSession: number;
  } {
    const stats = this.db
      .prepare(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'abandoned' THEN 1 ELSE 0 END) as abandoned
         FROM conversation_sessions`
      )
      .get() as any;

    const avgTurns = this.db
      .prepare(
        `SELECT AVG(turn_count) as avg_turns
         FROM (
           SELECT session_id, COUNT(*) as turn_count
           FROM conversation_turns
           GROUP BY session_id
         )`
      )
      .get() as any;

    return {
      totalSessions: stats.total,
      activeSessions: stats.active,
      completedSessions: stats.completed,
      abandonedSessions: stats.abandoned,
      avgTurnsPerSession: avgTurns.avg_turns || 0,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Slot Filling Manager
 * Handles multi-turn dialogs for collecting required information
 */
export class SlotFillingManager {
  /**
   * Initialize slot filling state
   */
  initializeSlots(workflow: string, slots: Slot[]): SlotFillingState {
    return {
      workflow,
      slots,
      attempts: 0,
      complete: slots.filter((s) => s.required).every((s) => s.filled),
    };
  }

  /**
   * Fill slot with value
   */
  fillSlot(state: SlotFillingState, slotName: string, value: any): SlotFillingState {
    const slot = state.slots.find((s) => s.name === slotName);
    if (!slot) {
      return state;
    }

    // Validate value
    if (slot.validation) {
      if (slot.validation.pattern && !slot.validation.pattern.test(value)) {
        return state; // Validation failed
      }
      if (slot.validation.allowedValues && !slot.validation.allowedValues.includes(value)) {
        return state; // Value not allowed
      }
    }

    // Update slot
    slot.value = value;
    slot.filled = true;

    // Find next unfilled required slot
    const nextSlot = state.slots.find((s) => s.required && !s.filled);

    return {
      ...state,
      slots: state.slots,
      currentSlot: nextSlot?.name,
      complete: state.slots.filter((s) => s.required).every((s) => s.filled),
      nextPrompt: nextSlot?.prompt,
      attempts: 0,
    };
  }

  /**
   * Get next prompt for user
   */
  getNextPrompt(state: SlotFillingState): string | null {
    if (state.complete) {
      return null;
    }

    const nextSlot = state.slots.find((s) => s.required && !s.filled);
    return nextSlot?.prompt || null;
  }

  /**
   * Increment attempts for current slot
   */
  incrementAttempts(state: SlotFillingState): SlotFillingState {
    return {
      ...state,
      attempts: state.attempts + 1,
    };
  }

  /**
   * Get filled values
   */
  getFilledValues(state: SlotFillingState): Record<string, any> {
    const values: Record<string, any> = {};
    for (const slot of state.slots.filter((s) => s.filled)) {
      values[slot.name] = slot.value;
    }
    return values;
  }
}
