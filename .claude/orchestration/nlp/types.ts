/**
 * Natural Language Processing Type Definitions
 * Comprehensive types for converting natural language to workflows
 */

// ============================================================================
// Intent Recognition Types
// ============================================================================

export type IntentCategory =
  | 'command'        // Action requests (deploy, build, test)
  | 'query'          // Information requests (what, how, when)
  | 'configuration'  // Settings changes
  | 'status'         // Status checks
  | 'conversation';  // General conversation

export interface Intent {
  /** Intent name (e.g., 'deploy_application', 'check_status') */
  name: string;

  /** Confidence score (0-100) */
  confidence: number;

  /** Intent category */
  category: IntentCategory;

  /** Sub-intent for hierarchical classification */
  subIntent?: string;

  /** Detected keywords that triggered this intent */
  keywords: string[];

  /** Raw pattern that matched */
  pattern?: string;
}

export interface IntentPattern {
  /** Unique pattern identifier */
  id: string;

  /** Intent name this pattern maps to */
  intent: string;

  /** Intent category */
  category: IntentCategory;

  /** Regular expression pattern */
  pattern: RegExp;

  /** Required keywords (all must be present) */
  requiredKeywords: string[];

  /** Optional keywords (boost confidence if present) */
  optionalKeywords: string[];

  /** Negative keywords (exclude if present) */
  negativeKeywords: string[];

  /** Base confidence score (0-100) */
  baseConfidence: number;

  /** Priority for disambiguation (higher = preferred) */
  priority: number;

  /** Example phrases that match this pattern */
  examples: string[];
}

// ============================================================================
// Entity Extraction Types
// ============================================================================

export type EntityType =
  | 'agent'          // Agent names
  | 'workflow'       // Workflow names
  | 'command'        // Command names
  | 'file'           // File paths
  | 'directory'      // Directory paths
  | 'environment'    // Environment names (dev, staging, prod)
  | 'service'        // Service names
  | 'resource'       // Resource types
  | 'date'           // Dates and times
  | 'number'         // Numbers
  | 'identifier'     // Generic identifiers
  | 'parameter'      // Parameter names/values
  | 'model'          // LLM model names
  | 'technology';    // Technology names

export interface Entity {
  /** Entity type */
  type: EntityType;

  /** Raw value extracted */
  value: string;

  /** Normalized/canonical value */
  normalized?: string;

  /** Confidence score (0-100) */
  confidence: number;

  /** Start position in text */
  start: number;

  /** End position in text */
  end: number;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface EntityDefinition {
  /** Entity type */
  type: EntityType;

  /** Extraction patterns (regex) */
  patterns: RegExp[];

  /** Known values (for enumerated types) */
  knownValues?: string[];

  /** Normalization function name */
  normalizer?: string;

  /** Validation function name */
  validator?: string;
}

// ============================================================================
// Conversation State Types
// ============================================================================

export interface ConversationContext {
  /** Current working directory */
  workingDirectory?: string;

  /** Active workflow/task */
  activeWorkflow?: string;

  /** Recently mentioned entities */
  recentEntities: Entity[];

  /** User preferences */
  preferences: Record<string, any>;

  /** Session metadata */
  metadata: Record<string, any>;
}

export interface ConversationTurn {
  /** Turn ID */
  id: string;

  /** User input */
  userInput: string;

  /** Detected intent */
  intent: Intent;

  /** Extracted entities */
  entities: Entity[];

  /** System response */
  systemResponse: string;

  /** Actions executed */
  actions?: GeneratedAction[];

  /** Timestamp */
  timestamp: Date;

  /** Turn duration (ms) */
  duration?: number;
}

export interface ConversationState {
  /** Session ID */
  sessionId: string;

  /** User ID (optional) */
  userId?: string;

  /** Current intent */
  currentIntent?: Intent;

  /** All entities in session */
  entities: Entity[];

  /** Slot-filling data */
  slots: Record<string, any>;

  /** Conversation history */
  history: ConversationTurn[];

  /** Context */
  context: ConversationContext;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;

  /** Session status */
  status: 'active' | 'waiting' | 'completed' | 'abandoned';
}

// ============================================================================
// Workflow Generation Types
// ============================================================================

export interface WorkflowMapping {
  /** Intent name */
  intent: string;

  /** Workflow identifier */
  workflow: string;

  /** Required entities for this workflow */
  requiredEntities: string[];

  /** Optional entities */
  optionalEntities: string[];

  /** Parameter mapping (entity type -> workflow param) */
  parameterMapping: Record<string, string>;

  /** Whether confirmation is required */
  confirmationRequired: boolean;

  /** Default parameter values */
  defaults?: Record<string, any>;

  /** Preconditions */
  preconditions?: string[];
}

export interface WorkflowParameter {
  /** Parameter name */
  name: string;

  /** Parameter value */
  value: any;

  /** Source entity */
  source?: Entity;

  /** Whether inferred from context */
  inferred: boolean;

  /** Confidence in this parameter (0-100) */
  confidence: number;
}

export interface GeneratedWorkflow {
  /** Workflow name */
  name: string;

  /** Workflow parameters */
  parameters: WorkflowParameter[];

  /** Confidence score (0-100) */
  confidence: number;

  /** Missing required parameters */
  missingParameters: string[];

  /** Whether workflow is ready to execute */
  ready: boolean;

  /** Source intent */
  sourceIntent: Intent;
}

export interface GeneratedAction {
  /** Action type */
  type: string;

  /** Action description */
  description: string;

  /** Action parameters */
  parameters: Record<string, any>;

  /** Execution order */
  order: number;

  /** Whether requires confirmation */
  requiresConfirmation: boolean;
}

// ============================================================================
// Context Resolution Types
// ============================================================================

export interface Reference {
  /** Reference text */
  text: string;

  /** Reference type */
  type: 'pronoun' | 'definite' | 'demonstrative' | 'possessive';

  /** Position in text */
  position: number;

  /** Resolved entity */
  resolvedEntity?: Entity;

  /** Confidence in resolution (0-100) */
  confidence: number;
}

export interface ContextResolutionResult {
  /** Original text */
  originalText: string;

  /** Text with references resolved */
  resolvedText: string;

  /** All references found */
  references: Reference[];

  /** Newly extracted entities */
  entities: Entity[];

  /** Context used for resolution */
  contextUsed: ConversationContext;
}

// ============================================================================
// Response Generation Types
// ============================================================================

export type ResponseType =
  | 'confirmation'   // Confirm action
  | 'clarification'  // Ask for clarification
  | 'error'          // Error message
  | 'success'        // Success message
  | 'information'    // Provide information
  | 'suggestion';    // Suggest alternatives

export interface NLPResponse {
  /** Response text */
  text: string;

  /** Response type */
  type: ResponseType;

  /** Generated actions (if command) */
  actions?: GeneratedAction[];

  /** Generated workflow (if command) */
  workflow?: GeneratedWorkflow;

  /** Clarification needed */
  clarificationNeeded?: {
    reason: string;
    missingSlots: string[];
    options?: string[];
    suggestedQuestions?: string[];
  };

  /** Suggestions */
  suggestions?: string[];

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ResponseTemplate {
  /** Template type */
  type: ResponseType;

  /** Intent this template is for */
  intent?: string;

  /** Template text with placeholders */
  template: string;

  /** Required context variables */
  requiredVariables: string[];

  /** Example responses */
  examples: string[];
}

// ============================================================================
// Slot Filling Types
// ============================================================================

export interface Slot {
  /** Slot name */
  name: string;

  /** Slot type */
  type: EntityType;

  /** Whether required */
  required: boolean;

  /** Current value */
  value?: any;

  /** Whether filled */
  filled: boolean;

  /** Prompt to ask user */
  prompt: string;

  /** Validation rules */
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    allowedValues?: string[];
  };
}

export interface SlotFillingState {
  /** Workflow being filled */
  workflow: string;

  /** All slots */
  slots: Slot[];

  /** Current slot being filled */
  currentSlot?: string;

  /** Number of attempts for current slot */
  attempts: number;

  /** Whether all required slots are filled */
  complete: boolean;

  /** Next prompt to user */
  nextPrompt?: string;
}

// ============================================================================
// Database Types
// ============================================================================

export interface ConversationSessionRecord {
  id: string;
  user_id?: string;
  status: string;
  context_json: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationTurnRecord {
  id: string;
  session_id: string;
  user_input: string;
  intent_name: string;
  intent_confidence: number;
  entities_json: string;
  system_response: string;
  actions_json?: string;
  created_at: Date;
  duration_ms?: number;
}

export interface IntentPatternRecord {
  id: string;
  intent_name: string;
  category: string;
  pattern: string;
  required_keywords: string;
  optional_keywords: string;
  negative_keywords: string;
  base_confidence: number;
  priority: number;
  examples: string;
  created_at: Date;
  enabled: boolean;
}

export interface WorkflowMappingRecord {
  id: string;
  intent_name: string;
  workflow_name: string;
  required_entities: string;
  optional_entities: string;
  parameter_mapping: string;
  confirmation_required: boolean;
  defaults_json?: string;
  created_at: Date;
  enabled: boolean;
}

export interface EntityDefinitionRecord {
  id: string;
  entity_type: string;
  patterns: string;
  known_values?: string;
  normalizer?: string;
  validator?: string;
  created_at: Date;
  enabled: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface NLPConfig {
  /** Database path */
  dbPath: string;

  /** Confidence thresholds */
  thresholds: {
    intent: number;      // Minimum intent confidence
    entity: number;      // Minimum entity confidence
    workflow: number;    // Minimum workflow confidence
  };

  /** Multi-intent handling */
  multiIntent: {
    enabled: boolean;
    maxIntents: number;
  };

  /** Context window for reference resolution */
  contextWindow: {
    turns: number;       // Number of previous turns to consider
    entities: number;    // Number of entities to keep in context
  };

  /** Slot filling configuration */
  slotFilling: {
    maxAttempts: number;
    timeout: number;     // Session timeout (ms)
  };

  /** Response generation */
  response: {
    verbose: boolean;
    includeConfidence: boolean;
    includeSuggestions: boolean;
  };
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface NLPAnalysisResult {
  /** Original input */
  input: string;

  /** Detected intents (ranked by confidence) */
  intents: Intent[];

  /** Extracted entities */
  entities: Entity[];

  /** Context resolution */
  contextResolution?: ContextResolutionResult;

  /** Generated workflow */
  workflow?: GeneratedWorkflow;

  /** Response */
  response: NLPResponse;

  /** Processing time (ms) */
  processingTime: number;

  /** Session state */
  sessionState: ConversationState;
}

export interface IntentConfusion {
  /** Input that caused confusion */
  input: string;

  /** Competing intents */
  intents: Intent[];

  /** Suggested disambiguation */
  suggestion: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface NLPStats {
  /** Total sessions */
  totalSessions: number;

  /** Active sessions */
  activeSessions: number;

  /** Total turns */
  totalTurns: number;

  /** Intent distribution */
  intentDistribution: Record<string, number>;

  /** Average confidence scores */
  avgConfidence: {
    intent: number;
    entity: number;
    workflow: number;
  };

  /** Success rates */
  successRates: {
    intentRecognition: number;
    entityExtraction: number;
    workflowGeneration: number;
  };

  /** Most common failures */
  commonFailures: Array<{
    type: 'intent' | 'entity' | 'workflow';
    reason: string;
    count: number;
  }>;

  /** Performance metrics */
  performance: {
    avgProcessingTime: number;
    p95ProcessingTime: number;
    p99ProcessingTime: number;
  };
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Intent types
  Intent,
  IntentPattern,

  // Entity types
  Entity,
  EntityDefinition,

  // Conversation types
  ConversationContext,
  ConversationTurn,
  ConversationState,

  // Workflow types
  WorkflowMapping,
  WorkflowParameter,
  GeneratedWorkflow,
  GeneratedAction,

  // Context resolution types
  Reference,
  ContextResolutionResult,

  // Response types
  NLPResponse,
  ResponseTemplate,

  // Slot filling types
  Slot,
  SlotFillingState,

  // Configuration types
  NLPConfig,

  // Analysis types
  NLPAnalysisResult,
  IntentConfusion,

  // Statistics types
  NLPStats,
};
