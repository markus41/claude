/**
 * Natural Language Processing Orchestration System
 * Main entry point for converting natural language to workflows
 */

import type {
  NLPConfig,
  NLPAnalysisResult,
  NLPResponse,
  NLPStats,
  ConversationState,
  Intent,
} from './types.js';
import { IntentRecognizer, DEFAULT_PATTERNS } from './intent-recognizer.js';
import { EntityExtractor, DEFAULT_ENTITY_DEFINITIONS } from './entity-extractor.js';
import { WorkflowGenerator, DEFAULT_WORKFLOW_MAPPINGS } from './workflow-generator.js';
import { ContextResolver } from './context-resolver.js';
import { ConversationManager, SlotFillingManager } from './conversation.js';
import { ResponseGenerator, ConversationalResponses } from './response-generator.js';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export class NaturalLanguageOrchestrator {
  private config: NLPConfig;
  private db: Database.Database;
  private intentRecognizer: IntentRecognizer;
  private entityExtractor: EntityExtractor;
  private workflowGenerator: WorkflowGenerator;
  private contextResolver: ContextResolver;
  private conversationManager: ConversationManager;
  private responseGenerator: ResponseGenerator;
  private slotFillingManager: SlotFillingManager;

  constructor(config: Partial<NLPConfig> = {}) {
    this.config = {
      dbPath: config.dbPath || ':memory:',
      thresholds: {
        intent: 60,
        entity: 50,
        workflow: 65,
        ...config.thresholds,
      },
      multiIntent: {
        enabled: false,
        maxIntents: 3,
        ...config.multiIntent,
      },
      contextWindow: {
        turns: 10,
        entities: 20,
        ...config.contextWindow,
      },
      slotFilling: {
        maxAttempts: 3,
        timeout: 300000,
        ...config.slotFilling,
      },
      response: {
        verbose: false,
        includeConfidence: false,
        includeSuggestions: true,
        ...config.response,
      },
    };

    // Initialize database
    this.db = new Database(this.config.dbPath);
    this.initializeDatabase();

    // Initialize components
    this.intentRecognizer = new IntentRecognizer(this.config.dbPath);
    this.entityExtractor = new EntityExtractor(this.config.dbPath);
    this.workflowGenerator = new WorkflowGenerator(this.config.dbPath);
    this.contextResolver = new ContextResolver(this.entityExtractor);
    this.conversationManager = new ConversationManager(this.config.dbPath);
    this.responseGenerator = new ResponseGenerator();
    this.slotFillingManager = new SlotFillingManager();

    // Seed default data if database is new
    this.seedDefaultData();
  }

  /**
   * Process natural language input
   */
  async process(input: string, sessionId?: string): Promise<NLPAnalysisResult> {
    const startTime = Date.now();

    // Get or create session
    const session = sessionId
      ? this.conversationManager.getSession(sessionId) || this.conversationManager.createSession()
      : this.conversationManager.createSession();

    try {
      // Step 1: Resolve references using context
      const contextResolution = this.contextResolver.resolveReferences(
        input,
        session.context,
        session.history.slice(-this.config.contextWindow.turns)
      );

      // Step 2: Recognize intent
      const maxIntents = this.config.multiIntent.enabled ? this.config.multiIntent.maxIntents : 1;
      const intents = this.intentRecognizer.recognizeIntent(contextResolution.resolvedText, maxIntents);

      if (intents.length === 0) {
        throw new Error('Could not recognize intent');
      }

      // Filter intents by confidence threshold
      const validIntents = intents.filter((i) => i.confidence >= this.config.thresholds.intent);
      if (validIntents.length === 0) {
        throw new Error('Intent confidence too low');
      }

      const primaryIntent = validIntents[0];

      // Step 3: Extract entities
      const entities = [...contextResolution.entities];

      // Filter entities by confidence threshold
      const validEntities = entities.filter((e) => e.confidence >= this.config.thresholds.entity);

      // Step 4: Generate workflow
      const workflow = this.workflowGenerator.generateWorkflow(
        primaryIntent,
        validEntities,
        session.context
      );

      if (!workflow) {
        throw new Error('Could not generate workflow for intent');
      }

      // Filter workflow by confidence threshold
      if (workflow.confidence < this.config.thresholds.workflow) {
        throw new Error('Workflow confidence too low');
      }

      // Step 5: Generate response
      let response: NLPResponse;

      if (!workflow.ready) {
        // Need clarification
        response = this.responseGenerator.generateClarification(
          primaryIntent,
          workflow.missingParameters,
          this.generateSuggestions(primaryIntent)
        );
      } else {
        // Generate actions
        const actions = this.workflowGenerator.generateActions(workflow);

        // Check if confirmation required
        const mapping = this.workflowGenerator.getMappings().get(primaryIntent.name);
        if (mapping?.confirmationRequired) {
          response = this.responseGenerator.generateConfirmation(workflow, actions);
        } else {
          // Execute immediately (in real system)
          response = {
            text: ConversationalResponses.acknowledge(primaryIntent),
            type: 'confirmation',
            workflow,
            actions,
          };
        }
      }

      // Step 6: Update context
      const updatedContext = this.contextResolver.updateContext(
        session.context,
        validEntities,
        this.config.contextWindow.entities
      );

      this.conversationManager.updateContext(session.sessionId, updatedContext);

      // Step 7: Add turn to conversation
      this.conversationManager.addTurn(
        session.sessionId,
        input,
        primaryIntent,
        validEntities,
        response.text,
        response.actions
      );

      // Update session state
      const updatedSession = this.conversationManager.getSession(session.sessionId)!;

      const processingTime = Date.now() - startTime;

      return {
        input,
        intents: validIntents,
        entities: validEntities,
        contextResolution,
        workflow,
        response,
        processingTime,
        sessionState: updatedSession,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Generate error response
      const response = this.responseGenerator.generateError(
        errorMessage,
        this.generateSuggestions()
      );

      // Add error turn
      this.conversationManager.addTurn(
        session.sessionId,
        input,
        { name: 'error', confidence: 0, category: 'conversation', keywords: [] },
        [],
        response.text
      );

      const processingTime = Date.now() - startTime;
      const updatedSession = this.conversationManager.getSession(session.sessionId)!;

      return {
        input,
        intents: [],
        entities: [],
        response,
        processingTime,
        sessionState: updatedSession,
      };
    }
  }

  /**
   * Create a new conversation session
   */
  createSession(userId?: string): string {
    const session = this.conversationManager.createSession(userId);
    return session.sessionId;
  }

  /**
   * Get conversation session
   */
  getSession(sessionId: string): ConversationState | null {
    return this.conversationManager.getSession(sessionId);
  }

  /**
   * End conversation session
   */
  endSession(sessionId: string): void {
    this.conversationManager.endSession(sessionId);
  }

  /**
   * Get system statistics
   */
  getStats(): NLPStats {
    const convStats = this.conversationManager.getStats();

    // Get intent stats
    const intentStats = this.db
      .prepare(
        `SELECT
          intent_name,
          total_recognitions,
          avg_confidence,
          successful_executions,
          failed_executions
        FROM intent_stats
        ORDER BY total_recognitions DESC`
      )
      .all() as any[];

    const intentDistribution: Record<string, number> = {};
    let totalIntentConfidence = 0;
    let intentCount = 0;

    for (const stat of intentStats) {
      intentDistribution[stat.intent_name] = stat.total_recognitions;
      totalIntentConfidence += stat.avg_confidence || 0;
      intentCount++;
    }

    // Get entity stats
    const entityStats = this.db
      .prepare(
        `SELECT avg_confidence
        FROM entity_stats
        WHERE total_extractions > 0`
      )
      .all() as any[];

    const avgEntityConfidence =
      entityStats.length > 0
        ? entityStats.reduce((sum, s) => sum + (s.avg_confidence || 0), 0) / entityStats.length
        : 0;

    // Get workflow stats
    const workflowStats = this.db
      .prepare(
        `SELECT avg_confidence, successful_generations, clarifications_needed
        FROM workflow_stats`
      )
      .all() as any[];

    const avgWorkflowConfidence =
      workflowStats.length > 0
        ? workflowStats.reduce((sum, s) => sum + (s.avg_confidence || 0), 0) / workflowStats.length
        : 0;

    const totalWorkflowGenerations = workflowStats.reduce(
      (sum, s) => sum + s.successful_generations + s.clarifications_needed,
      0
    );
    const successfulWorkflows = workflowStats.reduce((sum, s) => sum + s.successful_generations, 0);

    // Get performance stats
    const perfStats = this.db
      .prepare(
        `SELECT AVG(duration_ms) as avg_time
        FROM conversation_turns
        WHERE duration_ms IS NOT NULL`
      )
      .get() as any;

    return {
      totalSessions: convStats.totalSessions,
      activeSessions: convStats.activeSessions,
      totalTurns: convStats.totalTurns,
      intentDistribution,
      avgConfidence: {
        intent: intentCount > 0 ? totalIntentConfidence / intentCount : 0,
        entity: avgEntityConfidence,
        workflow: avgWorkflowConfidence,
      },
      successRates: {
        intentRecognition: intentCount > 0 ? 0.95 : 0, // Simplified
        entityExtraction: 0.9, // Simplified
        workflowGeneration:
          totalWorkflowGenerations > 0 ? successfulWorkflows / totalWorkflowGenerations : 0,
      },
      commonFailures: [],
      performance: {
        avgProcessingTime: perfStats?.avg_time || 0,
        p95ProcessingTime: 0, // Would need percentile calculation
        p99ProcessingTime: 0,
      },
    };
  }

  /**
   * Generate suggestions based on intent
   */
  private generateSuggestions(intent?: Intent): string[] {
    const generalSuggestions = [
      'Try "deploy to production"',
      'Try "run tests"',
      'Try "check status"',
      'Try "build the project"',
    ];

    if (!intent) return generalSuggestions;

    // Intent-specific suggestions
    const suggestions: Record<string, string[]> = {
      deploy_application: [
        'Specify environment (e.g., "deploy to staging")',
        'Include service name (e.g., "deploy api-service")',
      ],
      run_tests: ['Specify test type (e.g., "run unit tests")', 'Specify test suite'],
      check_status: ['Specify service or environment'],
    };

    return suggestions[intent.name] || generalSuggestions;
  }

  /**
   * Initialize database schema
   */
  private initializeDatabase(): void {
    const schemaPath = path.join(__dirname, '../db/nlp.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schema);
    } else {
      throw new Error(`NLP schema file not found: ${schemaPath}`);
    }
  }

  /**
   * Seed default data
   */
  private seedDefaultData(): void {
    // Check if data already exists
    const patternCount = this.db.prepare(`SELECT COUNT(*) as count FROM intent_patterns`).get() as any;

    if (patternCount.count === 0) {
      // Seed default patterns
      for (const pattern of DEFAULT_PATTERNS) {
        this.intentRecognizer.addPattern(pattern);
      }

      // Seed default entity definitions
      for (const definition of DEFAULT_ENTITY_DEFINITIONS) {
        this.entityExtractor.addDefinition(definition);
      }

      // Seed default workflow mappings
      for (const mapping of DEFAULT_WORKFLOW_MAPPINGS) {
        this.workflowGenerator.addMapping(mapping);
      }
    }
  }

  /**
   * Close all connections
   */
  close(): void {
    this.intentRecognizer.close();
    this.entityExtractor.close();
    this.workflowGenerator.close();
    this.conversationManager.close();
    this.db.close();
  }
}

// Export all types and components
export * from './types.js';
export { IntentRecognizer, DEFAULT_PATTERNS } from './intent-recognizer.js';
export { EntityExtractor, DEFAULT_ENTITY_DEFINITIONS } from './entity-extractor.js';
export { WorkflowGenerator, DEFAULT_WORKFLOW_MAPPINGS } from './workflow-generator.js';
export { ContextResolver } from './context-resolver.js';
export { ConversationManager, SlotFillingManager } from './conversation.js';
export { ResponseGenerator, ConversationalResponses } from './response-generator.js';

// Default export
export default NaturalLanguageOrchestrator;
