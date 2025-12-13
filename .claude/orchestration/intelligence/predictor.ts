/**
 * Predictor
 *
 * Predicts task duration, cost, success probability, and quality scores.
 * Establishes proactive estimation to improve routing decisions and resource planning.
 */

import type { Prediction, PredictionType, TaskFeatures } from './types';
import type { TaskDescriptor } from '../routing/types';
import Database from 'better-sqlite3';

export interface PredictorConfig {
  db: Database.Database;
  confidenceThreshold?: number;
  predictionIntervalLevel?: number;
}

export class Predictor {
  private db: Database.Database;
  private config: Required<PredictorConfig>;

  constructor(config: PredictorConfig) {
    this.db = config.db;
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.7,
      predictionIntervalLevel: config.predictionIntervalLevel ?? 0.95,
      db: config.db
    };
  }

  /**
   * Predict task duration
   */
  async predictDuration(
    taskId: string,
    task: TaskDescriptor,
    features: TaskFeatures,
    routingId?: string
  ): Promise<Prediction> {
    // Linear regression based on historical features
    const historicalAvg = features.historicalFeatures.avgDuration;
    const complexityFactor = features.textFeatures.complexity / 10;
    const lengthFactor = features.textFeatures.length / 10000;

    // Simple weighted model
    const predictedValue = historicalAvg * (1 + complexityFactor * 0.2 + lengthFactor * 0.1);

    // Confidence based on sample size
    const confidence = Math.min(
      0.95,
      0.5 + (features.historicalFeatures.sampleSize / 100) * 0.45
    );

    // Prediction interval (±20%)
    const margin = predictedValue * 0.2;

    const prediction: Prediction = {
      id: this.generatePredictionId(),
      type: 'duration',
      modelId: 'default-duration-predictor',
      modelVersion: 1,
      taskId,
      routingId,
      featureVectorId: `feat-${taskId}`,
      predictedValue,
      confidence,
      predictionInterval: {
        lower: predictedValue - margin,
        upper: predictedValue + margin,
        level: this.config.predictionIntervalLevel
      },
      predictedAt: new Date()
    };

    await this.storePrediction(prediction);
    return prediction;
  }

  /**
   * Predict task cost
   */
  async predictCost(
    taskId: string,
    task: TaskDescriptor,
    features: TaskFeatures,
    routingId?: string
  ): Promise<Prediction> {
    // Token-based cost estimation
    const estimatedInputTokens = features.textFeatures.length / 4; // ~4 chars per token
    const estimatedOutputTokens = estimatedInputTokens * 0.5; // Assume 50% output

    // Average cost per token (rough estimate)
    const costPerInputToken = 0.000003; // $3 per 1M tokens
    const costPerOutputToken = 0.000015; // $15 per 1M tokens

    const predictedValue =
      estimatedInputTokens * costPerInputToken +
      estimatedOutputTokens * costPerOutputToken;

    const confidence = 0.75; // Moderate confidence in token estimation

    const margin = predictedValue * 0.3;

    const prediction: Prediction = {
      id: this.generatePredictionId(),
      type: 'cost',
      modelId: 'default-cost-predictor',
      modelVersion: 1,
      taskId,
      routingId,
      featureVectorId: `feat-${taskId}`,
      predictedValue,
      confidence,
      predictionInterval: {
        lower: Math.max(0, predictedValue - margin),
        upper: predictedValue + margin,
        level: this.config.predictionIntervalLevel
      },
      predictedAt: new Date()
    };

    await this.storePrediction(prediction);
    return prediction;
  }

  /**
   * Predict success probability
   */
  async predictSuccess(
    taskId: string,
    task: TaskDescriptor,
    features: TaskFeatures,
    routingId?: string
  ): Promise<Prediction> {
    // Based on historical success rate
    const baseSuccessRate = features.historicalFeatures.similarTaskSuccessRate;

    // Adjust for context
    const errorRateAdjustment = 1 - features.contextFeatures.recentErrorRate;
    const attemptsPenalty = Math.max(0, 1 - features.historicalFeatures.previousAttempts * 0.1);

    const predictedValue = Math.min(
      1.0,
      baseSuccessRate * errorRateAdjustment * attemptsPenalty
    );

    const confidence = Math.min(
      0.9,
      0.6 + (features.historicalFeatures.sampleSize / 100) * 0.3
    );

    const margin = 0.1;

    const prediction: Prediction = {
      id: this.generatePredictionId(),
      type: 'success_probability',
      modelId: 'default-success-predictor',
      modelVersion: 1,
      taskId,
      routingId,
      featureVectorId: `feat-${taskId}`,
      predictedValue,
      confidence,
      predictionInterval: {
        lower: Math.max(0, predictedValue - margin),
        upper: Math.min(1, predictedValue + margin),
        level: this.config.predictionIntervalLevel
      },
      predictedAt: new Date()
    };

    await this.storePrediction(prediction);
    return prediction;
  }

  /**
   * Predict quality score
   */
  async predictQuality(
    taskId: string,
    task: TaskDescriptor,
    features: TaskFeatures,
    routingId?: string
  ): Promise<Prediction> {
    // Base quality from historical patterns
    const baseQuality = 80; // Default expected quality

    // Adjust for success rate
    const successAdjustment = features.historicalFeatures.similarTaskSuccessRate * 10;

    // Complexity penalty (more complex = potentially lower quality)
    const complexityPenalty = features.textFeatures.complexity * 0.5;

    const predictedValue = Math.max(
      0,
      Math.min(100, baseQuality + successAdjustment - complexityPenalty)
    );

    const confidence = 0.7;

    const margin = 10;

    const prediction: Prediction = {
      id: this.generatePredictionId(),
      type: 'quality_score',
      modelId: 'default-quality-predictor',
      modelVersion: 1,
      taskId,
      routingId,
      featureVectorId: `feat-${taskId}`,
      predictedValue,
      confidence,
      predictionInterval: {
        lower: Math.max(0, predictedValue - margin),
        upper: Math.min(100, predictedValue + margin),
        level: this.config.predictionIntervalLevel
      },
      predictedAt: new Date()
    };

    await this.storePrediction(prediction);
    return prediction;
  }

  /**
   * Generate all predictions for a task
   */
  async predictAll(
    taskId: string,
    task: TaskDescriptor,
    features: TaskFeatures,
    routingId?: string
  ): Promise<{
    duration: Prediction;
    cost: Prediction;
    success: Prediction;
    quality: Prediction;
  }> {
    const [duration, cost, success, quality] = await Promise.all([
      this.predictDuration(taskId, task, features, routingId),
      this.predictCost(taskId, task, features, routingId),
      this.predictSuccess(taskId, task, features, routingId),
      this.predictQuality(taskId, task, features, routingId)
    ]);

    return { duration, cost, success, quality };
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(prediction: Prediction): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO predictions (
        id, prediction_type, model_id, model_version,
        task_id, routing_id, feature_vector_id,
        predicted_value, confidence,
        prediction_interval_lower, prediction_interval_upper
      ) VALUES (
        @id, @prediction_type, @model_id, @model_version,
        @task_id, @routing_id, @feature_vector_id,
        @predicted_value, @confidence,
        @prediction_interval_lower, @prediction_interval_upper
      )
    `);

    insert.run({
      id: prediction.id,
      prediction_type: prediction.type,
      model_id: prediction.modelId,
      model_version: prediction.modelVersion,
      task_id: prediction.taskId,
      routing_id: prediction.routingId || null,
      feature_vector_id: prediction.featureVectorId || null,
      predicted_value: prediction.predictedValue,
      confidence: prediction.confidence,
      prediction_interval_lower: prediction.predictionInterval?.lower || null,
      prediction_interval_upper: prediction.predictionInterval?.upper || null
    });
  }

  /**
   * Get prediction accuracy metrics
   */
  async getPredictionAccuracy(type?: PredictionType): Promise<{
    totalPredictions: number;
    mae: number;
    mse: number;
    accuracy: number;
  }> {
    const query = type
      ? `SELECT * FROM v_prediction_accuracy WHERE prediction_type = ?`
      : `SELECT * FROM v_prediction_accuracy`;

    const results = type
      ? this.db.prepare(query).all(type)
      : this.db.prepare(query).all();

    if (!Array.isArray(results) || results.length === 0) {
      return {
        totalPredictions: 0,
        mae: 0,
        mse: 0,
        accuracy: 0
      };
    }

    const summary = results[0] as any;

    return {
      totalPredictions: summary.total_predictions || 0,
      mae: summary.mean_absolute_error || 0,
      mse: summary.mean_squared_error || 0,
      accuracy: summary.interval_accuracy_pct || 0
    };
  }

  /**
   * Generate unique prediction ID
   */
  private generatePredictionId(): string {
    return `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
