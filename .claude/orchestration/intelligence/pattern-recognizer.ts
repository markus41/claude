/**
 * Pattern Recognizer
 *
 * Detects success, failure, and performance patterns in task execution.
 * Establishes scalable pattern detection to improve routing decisions and system reliability.
 */

import type {
  Pattern,
  PatternType,
  PatternSeverity,
  PatternRecord
} from './types';
import type { ModelName, TaskType } from '../routing/types';
import Database from 'better-sqlite3';
import * as crypto from 'crypto';

export interface PatternRecognizerConfig {
  db: Database.Database;
  minFrequency?: number;
  minConfidence?: number;
  windowSize?: number;
}

export class PatternRecognizer {
  private db: Database.Database;
  private config: Required<PatternRecognizerConfig>;

  constructor(config: PatternRecognizerConfig) {
    this.db = config.db;
    this.config = {
      minFrequency: config.minFrequency ?? 3,
      minConfidence: config.minConfidence ?? 0.7,
      windowSize: config.windowSize ?? 100,
      db: config.db
    };
  }

  /**
   * Analyze recent outcomes for patterns
   */
  async analyzePatterns(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    patterns.push(...await this.detectFailurePatterns());
    patterns.push(...await this.detectSuccessPatterns());
    patterns.push(...await this.detectPerformancePatterns());
    patterns.push(...await this.detectCostPatterns());

    return patterns;
  }

  /**
   * Detect failure patterns
   */
  private async detectFailurePatterns(): Promise<Pattern[]> {
    const query = `
      SELECT
        rd.task_type,
        rd.model_selected as model,
        rd.complexity,
        COUNT(*) as total,
        SUM(CASE WHEN ro.success = 0 THEN 1 ELSE 0 END) as failures,
        AVG(ro.quality_score) as avg_quality
      FROM routing_decisions rd
      JOIN routing_outcomes ro ON rd.id = ro.routing_id
      WHERE rd.created_at > datetime('now', '-7 days')
      GROUP BY rd.task_type, rd.model_selected, rd.complexity
      HAVING failures >= ? AND (CAST(failures AS REAL) / total) > 0.3
    `;

    const results = this.db.prepare(query).all(this.config.minFrequency) as any[];
    const patterns: Pattern[] = [];

    for (const result of results) {
      const failureRate = result.failures / result.total;

      const signature = {
        taskType: result.task_type,
        model: result.model,
        complexity: result.complexity,
        failureRate
      };

      const pattern: Pattern = {
        id: this.generatePatternId(),
        type: 'failure',
        name: `High failure rate for ${result.task_type} on ${result.model}`,
        signature: JSON.stringify(signature),
        signatureHash: this.hashSignature(signature),
        frequency: result.failures,
        confidence: Math.min(0.9, failureRate),
        statisticalSignificance: this.calculateSignificance(result.failures, result.total),
        taskTypes: [result.task_type],
        models: [result.model],
        conditions: signature,
        impact: {
          qualityDelta: result.avg_quality - 70,
          costDelta: 0,
          latencyDelta: 0,
          successRateDelta: -failureRate
        },
        recommendations: [
          `Consider using alternative model for ${result.task_type} tasks`,
          `Review failure patterns for ${result.model}`,
          `Implement fallback chain for this combination`
        ],
        severity: this.calculateSeverity(failureRate),
        firstDetected: new Date(),
        lastDetected: new Date(),
        detectionCount: 1,
        status: 'active'
      };

      patterns.push(pattern);
      await this.storePattern(pattern);
    }

    return patterns;
  }

  /**
   * Detect success patterns
   */
  private async detectSuccessPatterns(): Promise<Pattern[]> {
    const query = `
      SELECT
        rd.task_type,
        rd.model_selected as model,
        rd.complexity,
        COUNT(*) as total,
        SUM(CASE WHEN ro.success = 1 THEN 1 ELSE 0 END) as successes,
        AVG(ro.quality_score) as avg_quality,
        AVG(ro.actual_latency) as avg_latency,
        AVG(ro.actual_cost) as avg_cost
      FROM routing_decisions rd
      JOIN routing_outcomes ro ON rd.id = ro.routing_id
      WHERE rd.created_at > datetime('now', '-7 days')
      GROUP BY rd.task_type, rd.model_selected, rd.complexity
      HAVING successes >= ? AND (CAST(successes AS REAL) / total) > 0.9
    `;

    const results = this.db.prepare(query).all(this.config.minFrequency) as any[];
    const patterns: Pattern[] = [];

    for (const result of results) {
      const successRate = result.successes / result.total;

      const signature = {
        taskType: result.task_type,
        model: result.model,
        complexity: result.complexity,
        successRate
      };

      const pattern: Pattern = {
        id: this.generatePatternId(),
        type: 'success',
        name: `High success rate for ${result.task_type} on ${result.model}`,
        signature: JSON.stringify(signature),
        signatureHash: this.hashSignature(signature),
        frequency: result.successes,
        confidence: Math.min(0.95, successRate),
        statisticalSignificance: this.calculateSignificance(result.successes, result.total),
        taskTypes: [result.task_type],
        models: [result.model],
        conditions: signature,
        impact: {
          qualityDelta: result.avg_quality - 85,
          costDelta: result.avg_cost - 0.05,
          latencyDelta: result.avg_latency - 5000,
          successRateDelta: successRate - 0.9
        },
        recommendations: [
          `Prioritize ${result.model} for ${result.task_type} tasks`,
          `Use this combination as baseline for similar tasks`
        ],
        severity: 'info',
        firstDetected: new Date(),
        lastDetected: new Date(),
        detectionCount: 1,
        status: 'active'
      };

      patterns.push(pattern);
      await this.storePattern(pattern);
    }

    return patterns;
  }

  /**
   * Detect performance patterns
   */
  private async detectPerformancePatterns(): Promise<Pattern[]> {
    const query = `
      SELECT
        rd.model_selected as model,
        rd.task_type,
        AVG(ro.actual_latency) as avg_latency,
        STDEV(ro.actual_latency) as std_latency,
        COUNT(*) as total
      FROM routing_decisions rd
      JOIN routing_outcomes ro ON rd.id = ro.routing_id
      WHERE rd.created_at > datetime('now', '-7 days')
        AND ro.success = 1
      GROUP BY rd.model_selected, rd.task_type
      HAVING total >= ?
    `;

    const results = this.db.prepare(query).all(this.config.minFrequency) as any[];
    const patterns: Pattern[] = [];

    for (const result of results) {
      // Detect slow performance (latency > 10s)
      if (result.avg_latency > 10000) {
        const signature = {
          model: result.model,
          taskType: result.task_type,
          avgLatency: result.avg_latency
        };

        const pattern: Pattern = {
          id: this.generatePatternId(),
          type: 'performance',
          name: `Slow performance for ${result.task_type} on ${result.model}`,
          signature: JSON.stringify(signature),
          signatureHash: this.hashSignature(signature),
          frequency: result.total,
          confidence: 0.8,
          taskTypes: [result.task_type],
          models: [result.model],
          conditions: signature,
          impact: {
            qualityDelta: 0,
            costDelta: 0,
            latencyDelta: result.avg_latency - 5000,
            successRateDelta: 0
          },
          recommendations: [
            `Consider faster model for ${result.task_type}`,
            `Optimize task processing for ${result.model}`
          ],
          severity: result.avg_latency > 30000 ? 'high' : 'medium',
          firstDetected: new Date(),
          lastDetected: new Date(),
          detectionCount: 1,
          status: 'active'
        };

        patterns.push(pattern);
        await this.storePattern(pattern);
      }
    }

    return patterns;
  }

  /**
   * Detect cost patterns
   */
  private async detectCostPatterns(): Promise<Pattern[]> {
    const query = `
      SELECT
        rd.model_selected as model,
        rd.task_type,
        AVG(ro.actual_cost) as avg_cost,
        COUNT(*) as total,
        SUM(ro.actual_cost) as total_cost
      FROM routing_decisions rd
      JOIN routing_outcomes ro ON rd.id = ro.routing_id
      WHERE rd.created_at > datetime('now', '-7 days')
      GROUP BY rd.model_selected, rd.task_type
      HAVING total >= ? AND avg_cost > 0.1
    `;

    const results = this.db.prepare(query).all(this.config.minFrequency) as any[];
    const patterns: Pattern[] = [];

    for (const result of results) {
      const signature = {
        model: result.model,
        taskType: result.task_type,
        avgCost: result.avg_cost
      };

      const pattern: Pattern = {
        id: this.generatePatternId(),
        type: 'cost',
        name: `High cost for ${result.task_type} on ${result.model}`,
        signature: JSON.stringify(signature),
        signatureHash: this.hashSignature(signature),
        frequency: result.total,
        confidence: 0.85,
        taskTypes: [result.task_type],
        models: [result.model],
        conditions: signature,
        impact: {
          qualityDelta: 0,
          costDelta: result.avg_cost - 0.05,
          latencyDelta: 0,
          successRateDelta: 0
        },
        recommendations: [
          `Consider cost-effective alternative for ${result.task_type}`,
          `Review token usage patterns`
        ],
        severity: result.avg_cost > 0.5 ? 'high' : 'medium',
        firstDetected: new Date(),
        lastDetected: new Date(),
        detectionCount: 1,
        status: 'active'
      };

      patterns.push(pattern);
      await this.storePattern(pattern);
    }

    return patterns;
  }

  /**
   * Calculate statistical significance (chi-square test approximation)
   */
  private calculateSignificance(observed: number, total: number): number {
    const expected = total * 0.5;
    const chiSquare = Math.pow(observed - expected, 2) / expected;
    return 1 - Math.exp(-chiSquare / 2);
  }

  /**
   * Calculate severity based on failure rate
   */
  private calculateSeverity(failureRate: number): PatternSeverity {
    if (failureRate > 0.7) return 'critical';
    if (failureRate > 0.5) return 'high';
    if (failureRate > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Generate unique pattern ID
   */
  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Hash pattern signature
   */
  private hashSignature(signature: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(signature))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Store pattern in database
   */
  private async storePattern(pattern: Pattern): Promise<void> {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO detected_patterns (
        id, pattern_type, pattern_name, signature, signature_hash,
        frequency, confidence, statistical_significance,
        task_types, models, conditions,
        avg_quality_impact, avg_cost_impact, avg_latency_impact, success_rate_impact,
        recommendations, severity,
        first_detected_at, last_detected_at, detection_count, status
      ) VALUES (
        @id, @pattern_type, @pattern_name, @signature, @signature_hash,
        @frequency, @confidence, @statistical_significance,
        @task_types, @models, @conditions,
        @avg_quality_impact, @avg_cost_impact, @avg_latency_impact, @success_rate_impact,
        @recommendations, @severity,
        @first_detected_at, @last_detected_at, @detection_count, @status
      )
    `);

    insert.run({
      id: pattern.id,
      pattern_type: pattern.type,
      pattern_name: pattern.name,
      signature: pattern.signature,
      signature_hash: pattern.signatureHash,
      frequency: pattern.frequency,
      confidence: pattern.confidence,
      statistical_significance: pattern.statisticalSignificance || null,
      task_types: JSON.stringify(pattern.taskTypes),
      models: JSON.stringify(pattern.models),
      conditions: JSON.stringify(pattern.conditions),
      avg_quality_impact: pattern.impact.qualityDelta,
      avg_cost_impact: pattern.impact.costDelta,
      avg_latency_impact: pattern.impact.latencyDelta,
      success_rate_impact: pattern.impact.successRateDelta,
      recommendations: JSON.stringify(pattern.recommendations),
      severity: pattern.severity,
      first_detected_at: pattern.firstDetected.toISOString(),
      last_detected_at: pattern.lastDetected.toISOString(),
      detection_count: pattern.detectionCount,
      status: pattern.status
    });
  }

  /**
   * Get active patterns
   */
  async getActivePatterns(): Promise<Pattern[]> {
    const records = this.db.prepare(`
      SELECT * FROM detected_patterns
      WHERE status = 'active'
      ORDER BY severity DESC, confidence DESC
    `).all() as PatternRecord[];

    return records.map(r => this.recordToPattern(r));
  }

  /**
   * Convert database record to Pattern
   */
  private recordToPattern(record: PatternRecord): Pattern {
    return {
      id: record.id,
      type: record.pattern_type,
      name: record.pattern_name,
      signature: record.signature,
      signatureHash: record.signature_hash,
      frequency: record.frequency,
      confidence: record.confidence,
      statisticalSignificance: record.statistical_significance || undefined,
      taskTypes: JSON.parse(record.task_types),
      models: JSON.parse(record.models),
      conditions: JSON.parse(record.conditions),
      impact: {
        qualityDelta: record.avg_quality_impact || 0,
        costDelta: record.avg_cost_impact || 0,
        latencyDelta: record.avg_latency_impact || 0,
        successRateDelta: record.success_rate_impact || 0
      },
      recommendations: JSON.parse(record.recommendations),
      severity: record.severity,
      firstDetected: new Date(record.first_detected_at),
      lastDetected: new Date(record.last_detected_at),
      detectionCount: record.detection_count,
      status: record.status as any
    };
  }
}
