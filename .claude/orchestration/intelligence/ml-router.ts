/**
 * ML Router
 *
 * Multi-armed bandit algorithm for intelligent model selection.
 * Establishes data-driven routing to optimize quality, cost, and performance trade-offs.
 */

import type {
  BanditArm,
  BanditSelection,
  BanditAlgorithm,
  RoutingPrediction,
  TaskFeatures
} from './types';
import type { ModelName, TaskDescriptor, ModelProfile } from '../routing/types';
import Database from 'better-sqlite3';

export interface MLRouterConfig {
  db: Database.Database;
  algorithm?: BanditAlgorithm;
  explorationConstant?: number; // UCB1
  epsilon?: number; // Epsilon-Greedy
  initialPulls?: number;
  availableModels: ModelProfile[];
}

export class MLRouter {
  private db: Database.Database;
  private config: Required<Omit<MLRouterConfig, 'availableModels'>> & { availableModels: ModelProfile[] };

  constructor(config: MLRouterConfig) {
    this.db = config.db;
    this.config = {
      algorithm: config.algorithm ?? 'ucb1',
      explorationConstant: config.explorationConstant ?? Math.sqrt(2),
      epsilon: config.epsilon ?? 0.1,
      initialPulls: config.initialPulls ?? 5,
      db: config.db,
      availableModels: config.availableModels
    };
  }

  /**
   * Select best model using multi-armed bandit
   */
  async selectModel(
    task: TaskDescriptor,
    features: TaskFeatures,
    contextSignature: string = 'default'
  ): Promise<RoutingPrediction> {
    // Get all bandit arms for this context
    const arms = await this.getBanditArms(contextSignature);

    // Select arm based on algorithm
    const selection = this.config.algorithm === 'ucb1'
      ? this.selectUCB1(arms)
      : this.config.algorithm === 'thompson_sampling'
      ? this.selectThompsonSampling(arms)
      : this.selectEpsilonGreedy(arms);

    // Build prediction
    const prediction: RoutingPrediction = {
      recommendedModel: selection.arm.name,
      confidence: this.calculateConfidence(selection.arm),
      predictedDuration: selection.arm.avgLatency || 5000,
      predictedCost: selection.arm.avgCost || 0.01,
      predictedSuccess: selection.arm.successRate || 0.8,
      predictedQuality: selection.arm.avgQuality || 80,
      alternatives: this.getAlternatives(arms, selection.arm.name),
      reasoning: this.buildReasoning(selection),
      timestamp: new Date()
    };

    return prediction;
  }

  /**
   * UCB1 (Upper Confidence Bound) selection
   */
  private selectUCB1(arms: BanditArm[]): BanditSelection {
    const totalPulls = arms.reduce((sum, arm) => sum + arm.totalPulls, 0);

    let bestArm: BanditArm | null = null;
    let bestScore = -Infinity;

    for (const arm of arms) {
      // Ensure minimum pulls
      if (arm.totalPulls < this.config.initialPulls) {
        return {
          arm,
          reason: 'exploration',
          score: Infinity,
          allArms: arms,
          timestamp: new Date()
        };
      }

      // UCB1 formula: avg_reward + c * sqrt(ln(total_pulls) / arm_pulls)
      const exploitation = arm.avgReward;
      const exploration = this.config.explorationConstant *
        Math.sqrt(Math.log(totalPulls) / arm.totalPulls);
      const ucbScore = exploitation + exploration;

      if (ucbScore > bestScore) {
        bestScore = ucbScore;
        bestArm = arm;
      }
    }

    return {
      arm: bestArm || arms[0],
      reason: 'exploitation',
      score: bestScore,
      allArms: arms,
      timestamp: new Date()
    };
  }

  /**
   * Thompson Sampling (Beta distribution)
   */
  private selectThompsonSampling(arms: BanditArm[]): BanditSelection {
    let bestArm: BanditArm | null = null;
    let bestSample = -Infinity;

    for (const arm of arms) {
      // Sample from Beta(alpha, beta) distribution
      const sample = this.sampleBeta(arm.alpha || 1, arm.beta || 1);

      if (sample > bestSample) {
        bestSample = sample;
        bestArm = arm;
      }
    }

    return {
      arm: bestArm || arms[0],
      reason: 'exploitation',
      score: bestSample,
      allArms: arms,
      timestamp: new Date()
    };
  }

  /**
   * Epsilon-Greedy selection
   */
  private selectEpsilonGreedy(arms: BanditArm[]): BanditSelection {
    // Exploration with probability epsilon
    if (Math.random() < this.config.epsilon) {
      const randomArm = arms[Math.floor(Math.random() * arms.length)];
      return {
        arm: randomArm,
        reason: 'exploration',
        score: randomArm.avgReward,
        allArms: arms,
        timestamp: new Date()
      };
    }

    // Exploitation: select best arm
    const bestArm = arms.reduce((best, arm) =>
      arm.avgReward > best.avgReward ? arm : best
    );

    return {
      arm: bestArm,
      reason: 'exploitation',
      score: bestArm.avgReward,
      allArms: arms,
      timestamp: new Date()
    };
  }

  /**
   * Sample from Beta distribution (approximation)
   */
  private sampleBeta(alpha: number, beta: number): number {
    // Simple approximation using normal distribution
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const std = Math.sqrt(variance);

    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return Math.max(0, Math.min(1, mean + z * std));
  }

  /**
   * Get bandit arms for context
   */
  private async getBanditArms(contextSignature: string): Promise<BanditArm[]> {
    const query = `
      SELECT * FROM bandit_arms
      WHERE context_signature = ?
    `;

    let records = this.db.prepare(query).all(contextSignature) as any[];

    // Initialize arms if none exist
    if (records.length === 0) {
      await this.initializeArms(contextSignature);
      records = this.db.prepare(query).all(contextSignature) as any[];
    }

    return records.map(r => ({
      name: r.arm_name as ModelName,
      contextSignature: r.context_signature,
      totalPulls: r.total_pulls,
      totalReward: r.total_reward,
      avgReward: r.avg_reward,
      alpha: r.alpha,
      beta: r.beta,
      explorationCount: r.exploration_count,
      exploitationCount: r.exploitation_count,
      successCount: r.success_count,
      failureCount: r.failure_count,
      successRate: r.success_rate,
      avgQuality: r.avg_quality,
      avgCost: r.avg_cost,
      avgLatency: r.avg_latency,
      lastPulled: r.last_pulled_at ? new Date(r.last_pulled_at) : undefined
    }));
  }

  /**
   * Initialize bandit arms for available models
   */
  private async initializeArms(contextSignature: string): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO bandit_arms (
        id, arm_name, context_signature
      ) VALUES (@id, @arm_name, @context_signature)
    `);

    for (const model of this.config.availableModels) {
      insert.run({
        id: `arm-${model.name}-${contextSignature}`,
        arm_name: model.name,
        context_signature: contextSignature
      });
    }
  }

  /**
   * Calculate confidence in selection
   */
  private calculateConfidence(arm: BanditArm): number {
    if (arm.totalPulls < this.config.initialPulls) return 0.5;
    return Math.min(0.95, 0.5 + (arm.totalPulls / 100) * 0.45);
  }

  /**
   * Get alternative model recommendations
   */
  private getAlternatives(arms: BanditArm[], selectedModel: ModelName): any[] {
    return arms
      .filter(arm => arm.name !== selectedModel)
      .map(arm => ({
        model: arm.name,
        confidence: this.calculateConfidence(arm),
        tradeoffs: this.calculateTradeoffs(arm, arms.find(a => a.name === selectedModel)!),
        costDelta: 0,
        latencyDelta: 0,
        qualityDelta: 0
      }))
      .slice(0, 3);
  }

  /**
   * Calculate trade-offs between models
   */
  private calculateTradeoffs(alternative: BanditArm, selected: BanditArm): string[] {
    const tradeoffs: string[] = [];

    if (alternative.avgCost < selected.avgCost) {
      tradeoffs.push('Lower cost');
    } else if (alternative.avgCost > selected.avgCost) {
      tradeoffs.push('Higher cost');
    }

    if (alternative.avgLatency < selected.avgLatency) {
      tradeoffs.push('Faster');
    } else if (alternative.avgLatency > selected.avgLatency) {
      tradeoffs.push('Slower');
    }

    if (alternative.avgQuality > selected.avgQuality) {
      tradeoffs.push('Higher quality');
    } else if (alternative.avgQuality < selected.avgQuality) {
      tradeoffs.push('Lower quality');
    }

    return tradeoffs;
  }

  /**
   * Build reasoning for selection
   */
  private buildReasoning(selection: BanditSelection): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Selected ${selection.arm.name} using ${this.config.algorithm}`);
    reasoning.push(`Reason: ${selection.reason}`);
    reasoning.push(`Success rate: ${(selection.arm.successRate * 100).toFixed(1)}%`);
    reasoning.push(`Total pulls: ${selection.arm.totalPulls}`);

    if (selection.arm.totalPulls < this.config.initialPulls) {
      reasoning.push('Exploring to gather more data');
    }

    return reasoning;
  }
}
