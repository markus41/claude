/**
 * Feature Extractor
 *
 * Extracts meaningful features from tasks to drive intelligent routing decisions.
 * Establishes scalable feature engineering pipeline supporting ML-based model selection.
 */

import type { TaskDescriptor } from '../routing/types';
import type {
  TaskFeatures,
  TextFeatures,
  HistoricalFeatures,
  ContextFeatures,
  FeatureVectorRecord
} from './types';
import Database from 'better-sqlite3';

/**
 * Feature extraction configuration
 */
export interface FeatureExtractorConfig {
  /** Database connection */
  db: Database.Database;

  /** Historical window size (number of similar tasks to consider) */
  historicalWindowSize?: number;

  /** Context window size (number of recent tasks for error rate) */
  contextWindowSize?: number;

  /** Enable text sentiment analysis */
  enableSentiment?: boolean;

  /** Feature vector normalization */
  normalize?: boolean;
}

/**
 * Extracts features from tasks for ML-based routing decisions
 */
export class FeatureExtractor {
  private db: Database.Database;
  private config: Required<FeatureExtractorConfig>;

  // Common technical keywords for complexity scoring
  private readonly technicalKeywords = new Set([
    'algorithm', 'architecture', 'async', 'api', 'authentication',
    'cache', 'cluster', 'compile', 'concurrent', 'configuration',
    'database', 'deploy', 'distributed', 'docker', 'encryption',
    'framework', 'gradient', 'infrastructure', 'integration',
    'kubernetes', 'lambda', 'microservice', 'migration', 'neural',
    'optimize', 'parallel', 'performance', 'pipeline', 'protocol',
    'queue', 'refactor', 'regression', 'scalable', 'schema',
    'security', 'server', 'synchronous', 'terraform', 'thread',
    'transaction', 'vector', 'websocket', 'webhook'
  ]);

  // Code indicator patterns
  private readonly codeIndicators = [
    'function', 'class', 'const', 'let', 'var', 'import', 'export',
    'async', 'await', 'promise', 'return', 'if', 'else', 'for',
    'while', 'try', 'catch', 'throw', 'new', 'this', 'super'
  ];

  constructor(config: FeatureExtractorConfig) {
    this.db = config.db;
    this.config = {
      historicalWindowSize: config.historicalWindowSize ?? 100,
      contextWindowSize: config.contextWindowSize ?? 10,
      enableSentiment: config.enableSentiment ?? true,
      normalize: config.normalize ?? true,
      db: config.db
    };
  }

  /**
   * Extract features from a task descriptor
   */
  async extractFeatures(
    taskId: string,
    task: TaskDescriptor,
    routingId?: string
  ): Promise<TaskFeatures> {
    const textFeatures = this.extractTextFeatures(task.task);
    const historicalFeatures = await this.extractHistoricalFeatures(task);
    const contextFeatures = await this.extractContextFeatures();

    // Build normalized feature vector
    const vector = this.buildFeatureVector(
      textFeatures,
      historicalFeatures,
      contextFeatures
    );

    const features: TaskFeatures = {
      taskId,
      textFeatures,
      historicalFeatures,
      contextFeatures,
      vector,
      vectorVersion: 1,
      extractedAt: new Date()
    };

    // Store in database
    await this.storeFeatures(taskId, features, routingId);

    return features;
  }

  /**
   * Extract text-based features from task description
   */
  private extractTextFeatures(text: string): TextFeatures {
    const length = text.length;
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    const uniqueWordCount = uniqueWords.size;

    // Calculate average word length
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;

    // Calculate Flesch-Kincaid complexity
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = Math.max(sentences.length, 1);
    const syllableCount = this.estimateSyllables(words);

    const avgWordsPerSentence = wordCount / sentenceCount;
    const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;

    // Flesch-Kincaid Grade Level
    const complexity = Math.max(
      0,
      0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
    );

    // Extract keywords (technical terms and important words)
    const keywords = this.extractKeywords(text);

    // Sentiment analysis (simple rule-based)
    const sentimentScore = this.config.enableSentiment
      ? this.analyzeSentiment(text)
      : 0;

    // Check for code indicators
    const hasCodeIndicators = this.codeIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );

    return {
      length,
      complexity,
      keywords,
      sentimentScore,
      wordCount,
      uniqueWordCount,
      avgWordLength,
      hasCodeIndicators
    };
  }

  /**
   * Extract historical features from similar past tasks
   */
  private async extractHistoricalFeatures(
    task: TaskDescriptor
  ): Promise<HistoricalFeatures> {
    // Query similar tasks from routing_outcomes
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ro.success THEN 1 ELSE 0 END) as successes,
        AVG(ro.actual_latency) as avg_latency,
        AVG(ro.tokens_input + ro.tokens_output) as avg_tokens,
        AVG(ro.actual_cost) as avg_cost,
        rd.model_selected as preferred_model
      FROM routing_decisions rd
      JOIN routing_outcomes ro ON rd.id = ro.routing_id
      WHERE rd.task_type = ?
        AND rd.complexity = ?
      ORDER BY rd.created_at DESC
      LIMIT ?
    `;

    const result = this.db.prepare(query).get(
      task.type,
      task.complexity,
      this.config.historicalWindowSize
    ) as any;

    const total = result?.total || 0;
    const successRate = total > 0 ? (result.successes || 0) / total : 0;

    // Count previous attempts for this exact task (by hash)
    const taskHash = this.hashTask(task.task);
    const previousAttempts = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM routing_decisions
      WHERE task_hash = ?
    `).get(taskHash) as any;

    return {
      similarTaskSuccessRate: successRate,
      avgDuration: result?.avg_latency || 5000,
      avgTokens: result?.avg_tokens || 1000,
      avgCost: result?.avg_cost || 0.01,
      previousAttempts: previousAttempts?.count || 0,
      sampleSize: total,
      preferredModel: result?.preferred_model
    };
  }

  /**
   * Extract context features from current system state
   */
  private async extractContextFeatures(): Promise<ContextFeatures> {
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    // Calculate recent error rate
    const recentTasks = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures
      FROM routing_outcomes
      WHERE created_at > datetime('now', '-1 hour')
    `).get() as any;

    const recentErrorRate = recentTasks?.total > 0
      ? (recentTasks.failures || 0) / recentTasks.total
      : 0;

    // Estimate current agent load (based on recent activity)
    const recentActivity = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM routing_decisions
      WHERE created_at > datetime('now', '-5 minutes')
    `).get() as any;

    const currentAgentLoad = Math.min(1.0, (recentActivity?.count || 0) / 10);

    // Get budget remaining (from budget_tracking)
    const budget = this.db.prepare(`
      SELECT daily_limit - daily_spent as remaining
      FROM budget_tracking
      WHERE period_start <= DATE('now')
        AND period_end >= DATE('now')
      ORDER BY created_at DESC
      LIMIT 1
    `).get() as any;

    const budgetRemaining = budget?.remaining || 100;

    // Estimate context utilization (placeholder, would integrate with actual context tracking)
    const contextUtilization = 0.5;

    // Queue depth (placeholder, would integrate with task queue)
    const queueDepth = 0;

    return {
      currentAgentLoad,
      timeOfDay,
      dayOfWeek,
      recentErrorRate,
      contextUtilization,
      queueDepth,
      budgetRemaining
    };
  }

  /**
   * Build normalized feature vector for ML models
   */
  private buildFeatureVector(
    text: TextFeatures,
    historical: HistoricalFeatures,
    context: ContextFeatures
  ): number[] {
    const features = [
      // Text features (normalized)
      text.length / 10000,                    // 0: Normalize to 0-1 range
      text.complexity / 20,                   // 1: Grade level 0-20
      text.keywords.length / 50,              // 2: Number of keywords
      (text.sentimentScore + 1) / 2,          // 3: Sentiment -1 to 1 → 0 to 1
      text.wordCount / 1000,                  // 4: Word count
      text.uniqueWordCount / text.wordCount,  // 5: Lexical diversity
      text.avgWordLength / 10,                // 6: Avg word length
      text.hasCodeIndicators ? 1 : 0,         // 7: Code indicators

      // Historical features
      historical.similarTaskSuccessRate,      // 8: Success rate 0-1
      historical.avgDuration / 100000,        // 9: Duration in 100k ms
      historical.avgTokens / 10000,           // 10: Tokens
      historical.avgCost / 1.0,               // 11: Cost in dollars
      Math.min(historical.previousAttempts / 10, 1), // 12: Previous attempts

      // Context features
      context.currentAgentLoad,               // 13: Agent load 0-1
      context.timeOfDay / 24,                 // 14: Time of day 0-1
      context.dayOfWeek / 7,                  // 15: Day of week 0-1
      context.recentErrorRate,                // 16: Error rate 0-1
      context.contextUtilization,             // 17: Context utilization 0-1
      context.queueDepth / 100,               // 18: Queue depth
      Math.min(context.budgetRemaining / 100, 1) // 19: Budget remaining
    ];

    return this.config.normalize
      ? this.normalizeVector(features)
      : features;
  }

  /**
   * Normalize feature vector to 0-1 range
   */
  private normalizeVector(vector: number[]): number[] {
    return vector.map(v => Math.max(0, Math.min(1, v)));
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const keywords: string[] = [];

    // Extract technical keywords
    for (const word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (this.technicalKeywords.has(cleanWord)) {
        keywords.push(cleanWord);
      }
    }

    // Extract capitalized words (likely important)
    const capitalizedWords = text
      .split(/\s+/)
      .filter(word => /^[A-Z][a-z]+/.test(word))
      .map(word => word.toLowerCase());

    const combined = keywords.concat(capitalizedWords);
    const unique = Array.from(new Set(combined));
    return unique.slice(0, 20);
  }

  /**
   * Simple sentiment analysis (rule-based)
   */
  private analyzeSentiment(text: string): number {
    const positive = ['good', 'great', 'excellent', 'perfect', 'success', 'complete', 'working', 'fix', 'improve', 'optimize'];
    const negative = ['bad', 'error', 'fail', 'broken', 'issue', 'problem', 'bug', 'slow', 'critical', 'urgent'];

    const words = text.toLowerCase().split(/\s+/);

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positive.some(p => word.includes(p))) positiveCount++;
      if (negative.some(n => word.includes(n))) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;

    return (positiveCount - negativeCount) / total;
  }

  /**
   * Estimate syllable count for Flesch-Kincaid calculation
   */
  private estimateSyllables(words: string[]): number {
    let count = 0;

    for (const word of words) {
      // Simple syllable estimation based on vowel groups
      const vowelGroups = word.match(/[aeiouy]+/gi);
      count += vowelGroups ? vowelGroups.length : 1;
    }

    return count;
  }

  /**
   * Hash task text for deduplication
   */
  private hashTask(text: string): string {
    // Simple hash function (would use crypto in production)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Store features in database
   */
  private async storeFeatures(
    taskId: string,
    features: TaskFeatures,
    routingId?: string
  ): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO feature_vectors (
        id, task_id, routing_id,
        text_length, text_complexity, keyword_count, keywords, sentiment_score,
        similar_task_success_rate, similar_task_avg_duration,
        similar_task_avg_tokens, similar_task_avg_cost, previous_attempts,
        current_agent_load, time_of_day, day_of_week,
        recent_error_rate, context_utilization, queue_depth,
        requires_extended_thinking, requires_vision, requires_tools,
        estimated_complexity, vector, vector_version
      ) VALUES (
        @id, @task_id, @routing_id,
        @text_length, @text_complexity, @keyword_count, @keywords, @sentiment_score,
        @similar_task_success_rate, @similar_task_avg_duration,
        @similar_task_avg_tokens, @similar_task_avg_cost, @previous_attempts,
        @current_agent_load, @time_of_day, @day_of_week,
        @recent_error_rate, @context_utilization, @queue_depth,
        @requires_extended_thinking, @requires_vision, @requires_tools,
        @estimated_complexity, @vector, @vector_version
      )
    `);

    insert.run({
      id: `feat-${taskId}`,
      task_id: taskId,
      routing_id: routingId || null,
      text_length: features.textFeatures.length,
      text_complexity: features.textFeatures.complexity,
      keyword_count: features.textFeatures.keywords.length,
      keywords: JSON.stringify(features.textFeatures.keywords),
      sentiment_score: features.textFeatures.sentimentScore,
      similar_task_success_rate: features.historicalFeatures.similarTaskSuccessRate,
      similar_task_avg_duration: features.historicalFeatures.avgDuration,
      similar_task_avg_tokens: features.historicalFeatures.avgTokens,
      similar_task_avg_cost: features.historicalFeatures.avgCost,
      previous_attempts: features.historicalFeatures.previousAttempts,
      current_agent_load: features.contextFeatures.currentAgentLoad,
      time_of_day: features.contextFeatures.timeOfDay,
      day_of_week: features.contextFeatures.dayOfWeek,
      recent_error_rate: features.contextFeatures.recentErrorRate,
      context_utilization: features.contextFeatures.contextUtilization,
      queue_depth: features.contextFeatures.queueDepth,
      requires_extended_thinking: false,
      requires_vision: false,
      requires_tools: true,
      estimated_complexity: features.textFeatures.complexity / 20,
      vector: JSON.stringify(features.vector),
      vector_version: features.vectorVersion
    });
  }

  /**
   * Retrieve features for a task
   */
  async getFeatures(taskId: string): Promise<TaskFeatures | null> {
    const record = this.db.prepare(`
      SELECT * FROM feature_vectors WHERE task_id = ?
    `).get(taskId) as FeatureVectorRecord | undefined;

    if (!record) return null;

    return this.recordToFeatures(record);
  }

  /**
   * Convert database record to TaskFeatures
   */
  private recordToFeatures(record: FeatureVectorRecord): TaskFeatures {
    return {
      taskId: record.task_id,
      textFeatures: {
        length: record.text_length,
        complexity: record.text_complexity,
        keywords: JSON.parse(record.keywords),
        sentimentScore: record.sentiment_score || 0,
        wordCount: 0, // Not stored separately
        uniqueWordCount: 0,
        avgWordLength: 0,
        hasCodeIndicators: false
      },
      historicalFeatures: {
        similarTaskSuccessRate: record.similar_task_success_rate || 0,
        avgDuration: record.similar_task_avg_duration || 0,
        avgTokens: record.similar_task_avg_tokens || 0,
        avgCost: record.similar_task_avg_cost || 0,
        previousAttempts: record.previous_attempts,
        sampleSize: 0
      },
      contextFeatures: {
        currentAgentLoad: record.current_agent_load,
        timeOfDay: record.time_of_day,
        dayOfWeek: record.day_of_week,
        recentErrorRate: record.recent_error_rate,
        contextUtilization: record.context_utilization,
        queueDepth: record.queue_depth,
        budgetRemaining: 100
      },
      vector: JSON.parse(record.vector),
      vectorVersion: record.vector_version,
      extractedAt: new Date(record.created_at)
    };
  }
}
