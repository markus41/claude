/**
 * Continuous Learner
 *
 * Online learning from routing outcomes to continuously improve model selection.
 * Establishes adaptive intelligence that improves system performance over time.
 */

import type { LearningEvent, LearningEventType } from './types';
import type { OutcomeRecord } from '../routing/types';
import Database from 'better-sqlite3';

export interface ContinuousLearnerConfig {
  db: Database.Database;
  learningRate?: number;
  updateFrequency?: number; // Update after N tasks
  minSamplesForUpdate?: number;
}

export class ContinuousLearner {
  private db: Database.Database;
  private config: Required<ContinuousLearnerConfig>;
  private tasksSinceUpdate = 0;

  constructor(config: ContinuousLearnerConfig) {
    this.db = config.db;
    this.config = {
      learningRate: config.learningRate ?? 0.1,
      updateFrequency: config.updateFrequency ?? 10,
      minSamplesForUpdate: config.minSamplesForUpdate ?? 20,
      db: config.db
    };
  }

  /**
   * Learn from routing outcome
   */
  async learnFromOutcome(outcome: OutcomeRecord | any): Promise<void> {
    // Calculate reward signal
    const reward = this.calculateReward(outcome);

    // Record learning event
    await this.recordLearningEvent({
      id: this.generateEventId(),
      type: 'reward_signal',
      modelId: 'default-bandit-ucb1',
      modelType: 'multi_armed_bandit',
      outcomeId: outcome.id || outcome.taskId,
      rewardValue: reward,
      timestamp: new Date()
    });

    this.tasksSinceUpdate++;

    // Periodic model update
    if (this.tasksSinceUpdate >= this.config.updateFrequency) {
      await this.updateModels();
      this.tasksSinceUpdate = 0;
    }
  }

  /**
   * Calculate reward signal from outcome
   */
  private calculateReward(outcome: OutcomeRecord | any): number {
    let reward = 0;

    // Success component (0-0.5)
    reward += outcome.success ? 0.5 : 0;

    // Quality component (0-0.25)
    const quality = outcome.quality ?? outcome.quality_score;
    if (quality) {
      reward += (quality / 100) * 0.25;
    }

    // Cost efficiency component (0-0.15)
    const cost = outcome.actualCost ?? outcome.actual_cost;
    const costEfficiency = Math.max(0, 1 - cost / 0.1);
    reward += costEfficiency * 0.15;

    // Latency component (0-0.1)
    const latency = outcome.actualLatency ?? outcome.actual_latency;
    const latencyEfficiency = Math.max(0, 1 - latency / 30000);
    reward += latencyEfficiency * 0.1;

    return Math.min(1, Math.max(0, reward));
  }

  /**
   * Update ML models based on accumulated outcomes
   */
  private async updateModels(): Promise<void> {
    // Get recent outcomes
    const outcomes = this.db.prepare(`
      SELECT * FROM routing_outcomes
      WHERE created_at > datetime('now', '-24 hours')
      ORDER BY created_at DESC
      LIMIT 100
    `).all() as OutcomeRecord[];

    if (outcomes.length < this.config.minSamplesForUpdate) {
      return;
    }

    // Update multi-armed bandit parameters
    await this.updateBanditParameters(outcomes);

    // Update prediction models
    await this.updatePredictionModels(outcomes);

    // Record update event
    await this.recordLearningEvent({
      id: this.generateEventId(),
      type: 'model_update',
      modelId: 'default-bandit-ucb1',
      modelType: 'multi_armed_bandit',
      timestamp: new Date(),
      notes: `Updated with ${outcomes.length} samples`
    });
  }

  /**
   * Update bandit arm parameters
   */
  private async updateBanditParameters(outcomes: OutcomeRecord[]): Promise<void> {
    // Bandit arms are automatically updated by database triggers
    // This method could implement additional parameter adjustments

    const update = this.db.prepare(`
      UPDATE ml_models
      SET
        training_samples = training_samples + ?,
        last_training_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 'default-bandit-ucb1'
    `);

    update.run(outcomes.length);
  }

  /**
   * Update prediction model parameters
   */
  private async updatePredictionModels(outcomes: OutcomeRecord[]): Promise<void> {
    // Calculate average prediction errors
    const predictions = this.db.prepare(`
      SELECT
        prediction_type,
        AVG(ABS(prediction_error)) as mae,
        AVG(squared_error) as mse
      FROM predictions
      WHERE actual_value IS NOT NULL
        AND predicted_at > datetime('now', '-24 hours')
      GROUP BY prediction_type
    `).all() as any[];

    for (const pred of predictions) {
      const modelId = `default-${pred.prediction_type}-predictor`;

      const update = this.db.prepare(`
        UPDATE ml_models
        SET
          mean_absolute_error = ?,
          mean_squared_error = ?,
          training_samples = training_samples + ?,
          last_training_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      update.run(pred.mae, pred.mse, outcomes.length, modelId);
    }
  }

  /**
   * Record learning event
   */
  private async recordLearningEvent(event: LearningEvent): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO learning_events (
        id, event_type, model_id, model_type, outcome_id,
        reward_value, loss_value, notes
      ) VALUES (
        @id, @event_type, @model_id, @model_type, @outcome_id,
        @reward_value, @loss_value, @notes
      )
    `);

    insert.run({
      id: event.id,
      event_type: event.type,
      model_id: event.modelId,
      model_type: event.modelType,
      outcome_id: event.outcomeId || null,
      reward_value: event.rewardValue || null,
      loss_value: event.lossValue || null,
      notes: event.notes || null
    });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<{
    totalEvents: number;
    modelUpdates: number;
    avgReward: number;
    recentPerformance: number;
  }> {
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_events,
        SUM(CASE WHEN event_type = 'model_update' THEN 1 ELSE 0 END) as model_updates,
        AVG(reward_value) as avg_reward
      FROM learning_events
      WHERE created_at > datetime('now', '-7 days')
    `).get() as any;

    // Calculate recent performance improvement
    const performance = this.db.prepare(`
      SELECT AVG(performance_delta) as avg_delta
      FROM learning_events
      WHERE performance_delta IS NOT NULL
        AND created_at > datetime('now', '-7 days')
    `).get() as any;

    return {
      totalEvents: stats.total_events || 0,
      modelUpdates: stats.model_updates || 0,
      avgReward: stats.avg_reward || 0,
      recentPerformance: performance?.avg_delta || 0
    };
  }
}
