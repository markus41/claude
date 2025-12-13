/**
 * Adaptive Intelligence Engine
 *
 * ML-based routing, pattern recognition, and continuous learning system.
 * Establishes data-driven decision-making to optimize model selection and improve
 * system performance over time.
 *
 * @module intelligence
 */

export * from './types';
export { FeatureExtractor, type FeatureExtractorConfig } from './feature-extractor';
export { PatternRecognizer, type PatternRecognizerConfig } from './pattern-recognizer';
export { AnomalyDetector, type AnomalyDetectorConfig } from './anomaly-detector';
export { MLRouter, type MLRouterConfig } from './ml-router';
export { ContinuousLearner, type ContinuousLearnerConfig } from './continuous-learner';
export { Predictor, type PredictorConfig } from './predictor';

import type { IntelligenceConfig, IntelligenceStats } from './types';
import type { TaskDescriptor, ModelProfile } from '../routing/types';
import { FeatureExtractor } from './feature-extractor';
import { PatternRecognizer } from './pattern-recognizer';
import { AnomalyDetector } from './anomaly-detector';
import { MLRouter } from './ml-router';
import { ContinuousLearner } from './continuous-learner';
import { Predictor } from './predictor';
import Database from 'better-sqlite3';

/**
 * Unified Intelligence Engine
 *
 * Integrates all intelligence components for seamless ML-based routing.
 */
export class IntelligenceEngine {
  private featureExtractor: FeatureExtractor;
  private patternRecognizer: PatternRecognizer;
  private anomalyDetector: AnomalyDetector;
  private mlRouter: MLRouter;
  private continuousLearner: ContinuousLearner;
  private predictor: Predictor;
  private config: IntelligenceConfig;

  constructor(
    db: Database.Database,
    availableModels: ModelProfile[],
    config?: Partial<IntelligenceConfig>
  ) {
    this.config = {
      enableIntelligentRouting: config?.enableIntelligentRouting ?? true,
      enablePatternRecognition: config?.enablePatternRecognition ?? true,
      enableAnomalyDetection: config?.enableAnomalyDetection ?? true,
      enableContinuousLearning: config?.enableContinuousLearning ?? true,
      bandit: config?.bandit ?? {
        algorithm: 'ucb1',
        explorationConstant: Math.sqrt(2),
        initialPulls: 5
      },
      patternRecognition: config?.patternRecognition ?? {
        minFrequency: 3,
        minConfidence: 0.7,
        windowSize: 100
      },
      anomalyDetection: config?.anomalyDetection ?? {
        sensitivity: 3,
        methods: ['z_score', 'iqr'],
        windowSize: 50
      },
      learning: config?.learning ?? {
        learningRate: 0.1,
        updateFrequency: 10,
        minSamplesForUpdate: 20
      },
      prediction: config?.prediction ?? {
        confidenceThreshold: 0.7,
        predictionIntervalLevel: 0.95
      }
    };

    // Initialize components
    this.featureExtractor = new FeatureExtractor({ db });
    this.patternRecognizer = new PatternRecognizer({
      db,
      ...this.config.patternRecognition
    });
    this.anomalyDetector = new AnomalyDetector({
      db,
      ...this.config.anomalyDetection
    });
    this.mlRouter = new MLRouter({
      db,
      availableModels,
      algorithm: this.config.bandit.algorithm,
      explorationConstant: this.config.bandit.explorationConstant,
      epsilon: this.config.bandit.epsilon,
      initialPulls: this.config.bandit.initialPulls
    });
    this.continuousLearner = new ContinuousLearner({
      db,
      ...this.config.learning
    });
    this.predictor = new Predictor({
      db,
      ...this.config.prediction
    });
  }

  /**
   * Get intelligent routing recommendation for a task
   */
  async getRoutingRecommendation(taskId: string, task: TaskDescriptor) {
    // Extract features
    const features = await this.featureExtractor.extractFeatures(taskId, task);

    // Get ML-based routing prediction
    const routing = await this.mlRouter.selectModel(task, features);

    // Get additional predictions
    const predictions = await this.predictor.predictAll(taskId, task, features);

    return {
      routing,
      predictions,
      features
    };
  }

  /**
   * Run periodic analysis (patterns, anomalies)
   */
  async runPeriodicAnalysis() {
    const results = {
      patterns: [] as any[],
      anomalies: [] as any[]
    };

    if (this.config.enablePatternRecognition) {
      results.patterns = await this.patternRecognizer.analyzePatterns();
    }

    if (this.config.enableAnomalyDetection) {
      results.anomalies = await this.anomalyDetector.detectAnomalies();
    }

    return results;
  }

  /**
   * Learn from routing outcome
   */
  async learnFromOutcome(outcome: any) {
    if (this.config.enableContinuousLearning) {
      await this.continuousLearner.learnFromOutcome(outcome);
    }
  }

  /**
   * Get intelligence statistics
   */
  async getStats(): Promise<IntelligenceStats> {
    const learningStats = await this.continuousLearner.getLearningStats();
    const predictionAccuracy = await this.predictor.getPredictionAccuracy();
    const activePatterns = await this.patternRecognizer.getActivePatterns();
    const unresolvedAnomalies = await this.anomalyDetector.getUnresolvedAnomalies();

    return {
      routing: {
        totalDecisions: 0, // Would query from database
        explorationRate: 0.1,
        exploitationRate: 0.9,
        avgConfidence: 0.85
      },
      patterns: {
        totalDetected: activePatterns.length,
        activePatterns: activePatterns.length,
        byType: this.groupByType(activePatterns, 'type'),
        bySeverity: this.groupByType(activePatterns, 'severity')
      },
      anomalies: {
        totalDetected: unresolvedAnomalies.length,
        unresolvedCount: unresolvedAnomalies.length,
        byType: this.groupByType(unresolvedAnomalies, 'type'),
        bySeverity: this.groupByType(unresolvedAnomalies, 'severity')
      },
      learning: {
        totalEvents: learningStats.totalEvents,
        modelUpdates: learningStats.modelUpdates,
        avgPerformanceImprovement: learningStats.recentPerformance
      },
      predictions: {
        totalPredictions: predictionAccuracy.totalPredictions,
        avgAccuracy: predictionAccuracy.accuracy,
        avgConfidence: 0.8,
        byType: {
          duration: { count: 0, mae: predictionAccuracy.mae, accuracy: predictionAccuracy.accuracy },
          cost: { count: 0, mae: 0, accuracy: 0 },
          success_probability: { count: 0, mae: 0, accuracy: 0 },
          quality_score: { count: 0, mae: 0, accuracy: 0 },
          token_usage: { count: 0, mae: 0, accuracy: 0 },
          routing_decision: { count: 0, mae: 0, accuracy: 0 }
        }
      }
    };
  }

  /**
   * Helper to group items by property
   */
  private groupByType(items: any[], property: string): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const item of items) {
      const key = item[property];
      grouped[key] = (grouped[key] || 0) + 1;
    }

    return grouped;
  }
}
