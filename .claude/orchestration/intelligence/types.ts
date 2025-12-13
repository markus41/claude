/**
 * Adaptive Intelligence Engine Type Definitions
 *
 * Comprehensive types for ML-based routing, pattern recognition,
 * anomaly detection, and continuous learning to drive data-driven
 * decision-making across the orchestration system.
 */

import type { ModelName, TaskType, TaskComplexity, TaskDescriptor } from '../routing/types';

// ============================================================================
// Task Feature Extraction Types
// ============================================================================

/**
 * Text-based features extracted from task description
 */
export interface TextFeatures {
  /** Length of task description in characters */
  length: number;

  /** Flesch-Kincaid complexity score (0-20, higher = more complex) */
  complexity: number;

  /** Extracted keywords from task */
  keywords: string[];

  /** Sentiment score (-1.0 negative to 1.0 positive) */
  sentimentScore: number;

  /** Word count */
  wordCount: number;

  /** Unique word count */
  uniqueWordCount: number;

  /** Average word length */
  avgWordLength: number;

  /** Presence of code indicators */
  hasCodeIndicators: boolean;
}

/**
 * Historical features from similar past tasks
 */
export interface HistoricalFeatures {
  /** Success rate of similar tasks (0-1) */
  similarTaskSuccessRate: number;

  /** Average duration of similar tasks (ms) */
  avgDuration: number;

  /** Average tokens used in similar tasks */
  avgTokens: number;

  /** Average cost of similar tasks (USD) */
  avgCost: number;

  /** Number of previous attempts at this or similar task */
  previousAttempts: number;

  /** Sample size of similar tasks */
  sampleSize: number;

  /** Most successful model for similar tasks */
  preferredModel?: ModelName;
}

/**
 * Context-based features from current system state
 */
export interface ContextFeatures {
  /** Current agent load (0-1, 0 = idle, 1 = fully loaded) */
  currentAgentLoad: number;

  /** Hour of day (0-23) */
  timeOfDay: number;

  /** Day of week (0-6, 0 = Sunday) */
  dayOfWeek: number;

  /** Recent error rate in last N tasks (0-1) */
  recentErrorRate: number;

  /** Context window utilization (0-1) */
  contextUtilization: number;

  /** Current task queue depth */
  queueDepth: number;

  /** Available budget remaining (USD) */
  budgetRemaining: number;
}

/**
 * Complete feature vector for a task
 */
export interface TaskFeatures {
  /** Unique task identifier */
  taskId: string;

  /** Text-based features */
  textFeatures: TextFeatures;

  /** Historical features */
  historicalFeatures: HistoricalFeatures;

  /** Context features */
  contextFeatures: ContextFeatures;

  /** Normalized feature vector for ML models */
  vector: number[];

  /** Feature vector version for schema evolution */
  vectorVersion: number;

  /** Timestamp of feature extraction */
  extractedAt: Date;
}

// ============================================================================
// ML Routing Types
// ============================================================================

/**
 * Alternative model recommendation with trade-offs
 */
export interface AlternativeModel {
  /** Alternative model */
  model: ModelName;

  /** Confidence in this alternative (0-1) */
  confidence: number;

  /** Trade-offs compared to primary recommendation */
  tradeoffs: string[];

  /** Estimated cost difference */
  costDelta: number;

  /** Estimated latency difference (ms) */
  latencyDelta: number;

  /** Estimated quality difference (0-100) */
  qualityDelta: number;
}

/**
 * Routing prediction from ML model
 */
export interface RoutingPrediction {
  /** Recommended model */
  recommendedModel: ModelName;

  /** Confidence in recommendation (0-1) */
  confidence: number;

  /** Predicted duration (ms) */
  predictedDuration: number;

  /** Predicted cost (USD) */
  predictedCost: number;

  /** Predicted success probability (0-1) */
  predictedSuccess: number;

  /** Predicted quality score (0-100) */
  predictedQuality?: number;

  /** Alternative models considered */
  alternatives: AlternativeModel[];

  /** Reasoning for the decision */
  reasoning: string[];

  /** Feature importance weights */
  featureImportance?: Record<string, number>;

  /** Prediction timestamp */
  timestamp: Date;
}

// ============================================================================
// Pattern Recognition Types
// ============================================================================

/**
 * Types of patterns that can be detected
 */
export type PatternType =
  | 'success'      // Patterns leading to successful outcomes
  | 'failure'      // Patterns leading to failures
  | 'performance'  // Performance-related patterns
  | 'behavioral'   // Behavioral patterns in task execution
  | 'cost'         // Cost-related patterns
  | 'latency';     // Latency-related patterns

/**
 * Pattern severity levels
 */
export type PatternSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Detected pattern in task execution
 */
export interface Pattern {
  /** Unique pattern identifier */
  id: string;

  /** Type of pattern */
  type: PatternType;

  /** Human-readable pattern name */
  name: string;

  /** Pattern signature (defining characteristics) */
  signature: string;

  /** Hash of signature for quick matching */
  signatureHash: string;

  /** Frequency of pattern occurrence */
  frequency: number;

  /** Confidence in pattern (0-1) */
  confidence: number;

  /** Statistical significance (p-value) */
  statisticalSignificance?: number;

  /** Associated task types */
  taskTypes: TaskType[];

  /** Associated models */
  models: ModelName[];

  /** Conditions under which pattern occurs */
  conditions: Record<string, any>;

  /** Impact metrics */
  impact: {
    qualityDelta: number;
    costDelta: number;
    latencyDelta: number;
    successRateDelta: number;
  };

  /** Recommendations */
  recommendations: string[];

  /** Pattern severity */
  severity: PatternSeverity;

  /** Pattern lifecycle */
  firstDetected: Date;
  lastDetected: Date;
  detectionCount: number;
  status: 'active' | 'resolved' | 'monitoring' | 'archived';
}

// ============================================================================
// Anomaly Detection Types
// ============================================================================

/**
 * Types of anomalies that can be detected
 */
export type AnomalyType =
  | 'performance'  // Performance degradation
  | 'error_rate'   // Unusual error rates
  | 'resource'     // Resource usage anomalies
  | 'behavioral'   // Behavioral anomalies
  | 'cost'         // Cost anomalies
  | 'quality';     // Quality anomalies

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Anomaly detection methods
 */
export type AnomalyDetectionMethod =
  | 'z_score'         // Z-score (standard deviations)
  | 'iqr'             // Interquartile range
  | 'moving_average'  // Moving average deviation
  | 'seasonal'        // Seasonal decomposition
  | 'isolation_forest'; // Isolation forest algorithm

/**
 * Detected anomaly
 */
export interface Anomaly {
  /** Unique anomaly identifier */
  id: string;

  /** Timestamp of detection */
  timestamp: Date;

  /** Type of anomaly */
  type: AnomalyType;

  /** Severity level */
  severity: AnomalySeverity;

  /** Metric name that triggered anomaly */
  metric: string;

  /** Expected value based on baseline */
  expectedValue: number;

  /** Actual observed value */
  actualValue: number;

  /** Deviation from expected (in standard deviations or %) */
  deviation: number;

  /** Detection method used */
  detectionMethod: AnomalyDetectionMethod;

  /** Confidence in anomaly detection (0-1) */
  confidence: number;

  /** Baseline statistics */
  baseline?: {
    mean: number;
    std: number;
    median?: number;
    q1?: number;
    q3?: number;
  };

  /** Context */
  context?: {
    taskId?: string;
    routingId?: string;
    model?: ModelName;
    taskType?: TaskType;
  };

  /** Resolution status */
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;
}

// ============================================================================
// Multi-Armed Bandit Types
// ============================================================================

/**
 * Bandit algorithm types
 */
export type BanditAlgorithm =
  | 'ucb1'              // Upper Confidence Bound 1
  | 'thompson_sampling' // Thompson Sampling (Beta distribution)
  | 'epsilon_greedy';   // Epsilon-Greedy

/**
 * Bandit arm (represents a model choice)
 */
export interface BanditArm {
  /** Arm identifier (model name) */
  name: ModelName;

  /** Context signature for contextual bandits */
  contextSignature: string;

  /** Total number of pulls (selections) */
  totalPulls: number;

  /** Total reward accumulated */
  totalReward: number;

  /** Average reward */
  avgReward: number;

  /** UCB1 specific */
  ucbScore?: number;

  /** Thompson Sampling (Beta distribution) */
  alpha?: number; // Success count + 1
  beta?: number;  // Failure count + 1

  /** Epsilon-Greedy specific */
  explorationCount?: number;
  exploitationCount?: number;

  /** Performance metrics */
  successCount: number;
  failureCount: number;
  successRate: number;
  avgQuality: number;
  avgCost: number;
  avgLatency: number;

  /** Last pull timestamp */
  lastPulled?: Date;
}

/**
 * Bandit selection result
 */
export interface BanditSelection {
  /** Selected arm */
  arm: BanditArm;

  /** Selection reason */
  reason: 'exploration' | 'exploitation';

  /** Selection score */
  score: number;

  /** All arms considered */
  allArms: BanditArm[];

  /** Timestamp */
  timestamp: Date;
}

// ============================================================================
// Continuous Learning Types
// ============================================================================

/**
 * Learning event types
 */
export type LearningEventType =
  | 'model_update'          // Full model update
  | 'parameter_adjustment'  // Parameter fine-tuning
  | 'reward_signal'         // Reward feedback
  | 'exploration'           // Exploration event
  | 'exploitation'          // Exploitation event
  | 'bandit_update';        // Bandit arm update

/**
 * Learning event
 */
export interface LearningEvent {
  /** Unique event identifier */
  id: string;

  /** Event type */
  type: LearningEventType;

  /** Model identifier */
  modelId: string;

  /** Model type */
  modelType: string;

  /** Outcome that triggered learning */
  outcomeId?: string;

  /** Reward value */
  rewardValue?: number;

  /** Loss value */
  lossValue?: number;

  /** Parameter changes */
  parameterChanges?: {
    before: Record<string, any>;
    after: Record<string, any>;
    learningRate: number;
  };

  /** Performance impact */
  performanceImpact?: {
    accuracyBefore: number;
    accuracyAfter: number;
    delta: number;
  };

  /** Context */
  context?: {
    taskId?: string;
    taskType?: TaskType;
    modelUsed?: ModelName;
  };

  /** Timestamp */
  timestamp: Date;

  /** Notes */
  notes?: string;
}

// ============================================================================
// Prediction Types
// ============================================================================

/**
 * Prediction types
 */
export type PredictionType =
  | 'duration'            // Task duration prediction
  | 'cost'                // Cost prediction
  | 'success_probability' // Success probability
  | 'quality_score'       // Quality score prediction
  | 'token_usage'         // Token usage prediction
  | 'routing_decision';   // Routing decision prediction

/**
 * Prediction with confidence intervals
 */
export interface Prediction {
  /** Unique prediction identifier */
  id: string;

  /** Prediction type */
  type: PredictionType;

  /** Model that made the prediction */
  modelId: string;
  modelVersion: number;

  /** Task context */
  taskId: string;
  routingId?: string;
  featureVectorId?: string;

  /** Predicted value */
  predictedValue: number;

  /** Confidence in prediction (0-1) */
  confidence: number;

  /** Prediction interval */
  predictionInterval?: {
    lower: number;
    upper: number;
    level: number; // e.g., 0.95 for 95% CI
  };

  /** Actual value (filled after execution) */
  actualValue?: number;

  /** Prediction errors (calculated after execution) */
  errors?: {
    predictionError: number;  // predicted - actual
    absoluteError: number;    // |predicted - actual|
    squaredError: number;     // (predicted - actual)^2
    percentageError?: number; // error / actual * 100
  };

  /** Additional predictions */
  additionalPredictions?: Record<string, number>;

  /** Timestamps */
  predictedAt: Date;
  actualAt?: Date;
}

// ============================================================================
// ML Model Types
// ============================================================================

/**
 * ML model types supported by the system
 */
export type MLModelType =
  | 'multi_armed_bandit'
  | 'duration_predictor'
  | 'cost_predictor'
  | 'success_predictor'
  | 'quality_predictor';

/**
 * ML model status
 */
export type MLModelStatus = 'active' | 'deprecated' | 'testing' | 'archived';

/**
 * ML model definition
 */
export interface MLModel {
  /** Unique model identifier */
  id: string;

  /** Model type */
  type: MLModelType;

  /** Model name */
  name: string;

  /** Model parameters (algorithm-specific) */
  parameters: Record<string, any>;

  /** Performance metrics */
  performance?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mae?: number; // Mean Absolute Error
    mse?: number; // Mean Squared Error
    rmse?: number; // Root Mean Squared Error
  };

  /** Training metadata */
  training?: {
    samples: number;
    lastTrainedAt?: Date;
    duration?: number;
  };

  /** Version control */
  version: number;
  parentModelId?: string;

  /** Status */
  status: MLModelStatus;

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  notes?: string;
}

// ============================================================================
// A/B Testing Types
// ============================================================================

/**
 * A/B test experiment status
 */
export type ExperimentStatus = 'running' | 'completed' | 'cancelled';

/**
 * Model comparison experiment
 */
export interface ModelComparison {
  /** Unique experiment identifier */
  id: string;

  /** Experiment name */
  name: string;

  /** Models being compared */
  modelA: ModelName;
  modelB: ModelName;

  /** Task criteria */
  criteria?: {
    taskType?: TaskType;
    complexity?: TaskComplexity;
  };

  /** Results */
  results: {
    modelA: {
      requests: number;
      successRate: number;
      avgQuality: number;
      avgCost: number;
      avgLatency: number;
    };
    modelB: {
      requests: number;
      successRate: number;
      avgQuality: number;
      avgCost: number;
      avgLatency: number;
    };
  };

  /** Statistical analysis */
  statistics?: {
    pValue: number;
    statisticallySignificant: boolean;
    confidenceLevel: number;
  };

  /** Winner determination */
  winner?: {
    model: ModelName;
    metric: string;
    improvement: number;
  };

  /** Experiment lifecycle */
  status: ExperimentStatus;
  startDate: Date;
  endDate?: Date;

  /** Metadata */
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Database Record Types
// ============================================================================

/**
 * Feature vector database record
 */
export interface FeatureVectorRecord {
  id: string;
  task_id: string;
  routing_id?: string;
  text_length: number;
  text_complexity: number;
  keyword_count: number;
  keywords: string; // JSON
  sentiment_score?: number;
  similar_task_success_rate?: number;
  similar_task_avg_duration?: number;
  similar_task_avg_tokens?: number;
  similar_task_avg_cost?: number;
  previous_attempts: number;
  current_agent_load: number;
  time_of_day: number;
  day_of_week: number;
  recent_error_rate: number;
  context_utilization: number;
  queue_depth: number;
  requires_extended_thinking: boolean;
  requires_vision: boolean;
  requires_tools: boolean;
  estimated_complexity: number;
  vector: string; // JSON
  vector_version: number;
  created_at: Date;
}

/**
 * Pattern database record
 */
export interface PatternRecord {
  id: string;
  pattern_type: PatternType;
  pattern_name: string;
  signature: string; // JSON
  signature_hash: string;
  frequency: number;
  confidence: number;
  statistical_significance?: number;
  task_types: string; // JSON
  models: string; // JSON
  conditions: string; // JSON
  avg_quality_impact?: number;
  avg_cost_impact?: number;
  avg_latency_impact?: number;
  success_rate_impact?: number;
  recommendations: string; // JSON
  severity: PatternSeverity;
  first_detected_at: Date;
  last_detected_at: Date;
  detection_count: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Anomaly database record
 */
export interface AnomalyRecord {
  id: string;
  anomaly_type: AnomalyType;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation: number;
  severity: AnomalySeverity;
  task_id?: string;
  routing_id?: string;
  model?: string;
  task_type?: string;
  detection_method: AnomalyDetectionMethod;
  confidence: number;
  baseline_mean?: number;
  baseline_std?: number;
  window_size?: number;
  resolved: boolean;
  resolved_at?: Date;
  resolution_notes?: string;
  detected_at: Date;
  created_at: Date;
}

/**
 * Bandit arm database record
 */
export interface BanditArmRecord {
  id: string;
  arm_name: string;
  context_signature: string;
  total_pulls: number;
  total_reward: number;
  avg_reward: number;
  alpha: number;
  beta: number;
  exploration_count: number;
  exploitation_count: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_quality?: number;
  avg_cost?: number;
  avg_latency?: number;
  last_pulled_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Intelligence engine configuration
 */
export interface IntelligenceConfig {
  /** Enable intelligent routing */
  enableIntelligentRouting: boolean;

  /** Enable pattern recognition */
  enablePatternRecognition: boolean;

  /** Enable anomaly detection */
  enableAnomalyDetection: boolean;

  /** Enable continuous learning */
  enableContinuousLearning: boolean;

  /** Bandit algorithm configuration */
  bandit: {
    algorithm: BanditAlgorithm;
    explorationConstant?: number; // UCB1
    epsilon?: number; // Epsilon-Greedy
    initialPulls?: number; // Minimum pulls before exploitation
  };

  /** Pattern recognition configuration */
  patternRecognition: {
    minFrequency: number;
    minConfidence: number;
    windowSize: number; // Number of tasks to analyze
  };

  /** Anomaly detection configuration */
  anomalyDetection: {
    sensitivity: number; // 1-5, higher = more sensitive
    methods: AnomalyDetectionMethod[];
    windowSize: number; // Number of data points for baseline
  };

  /** Learning configuration */
  learning: {
    learningRate: number;
    updateFrequency: number; // How often to update models (in tasks)
    minSamplesForUpdate: number;
  };

  /** Prediction configuration */
  prediction: {
    confidenceThreshold: number;
    predictionIntervalLevel: number; // e.g., 0.95
  };
}

/**
 * Intelligence engine statistics
 */
export interface IntelligenceStats {
  /** Routing statistics */
  routing: {
    totalDecisions: number;
    explorationRate: number;
    exploitationRate: number;
    avgConfidence: number;
  };

  /** Pattern statistics */
  patterns: {
    totalDetected: number;
    activePatterns: number;
    byType: Record<PatternType, number>;
    bySeverity: Record<PatternSeverity, number>;
  };

  /** Anomaly statistics */
  anomalies: {
    totalDetected: number;
    unresolvedCount: number;
    byType: Record<AnomalyType, number>;
    bySeverity: Record<AnomalySeverity, number>;
  };

  /** Learning statistics */
  learning: {
    totalEvents: number;
    modelUpdates: number;
    avgPerformanceImprovement: number;
  };

  /** Prediction statistics */
  predictions: {
    totalPredictions: number;
    avgAccuracy: number;
    avgConfidence: number;
    byType: Record<PredictionType, {
      count: number;
      mae: number;
      accuracy: number;
    }>;
  };
}
