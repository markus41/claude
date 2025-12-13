/**
 * Anomaly Detector
 *
 * Statistical anomaly detection for performance, error rates, and resource usage.
 * Establishes proactive monitoring to improve system reliability and performance.
 */

import type {
  Anomaly,
  AnomalyType,
  AnomalySeverity,
  AnomalyDetectionMethod,
  AnomalyRecord
} from './types';
import Database from 'better-sqlite3';

export interface AnomalyDetectorConfig {
  db: Database.Database;
  sensitivity?: number; // 1-5, higher = more sensitive
  windowSize?: number;
  methods?: AnomalyDetectionMethod[];
}

export class AnomalyDetector {
  private db: Database.Database;
  private config: Required<AnomalyDetectorConfig>;

  constructor(config: AnomalyDetectorConfig) {
    this.db = config.db;
    this.config = {
      sensitivity: config.sensitivity ?? 3,
      windowSize: config.windowSize ?? 50,
      methods: config.methods ?? ['z_score', 'iqr'],
      db: config.db
    };
  }

  /**
   * Detect anomalies in recent system behavior
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    anomalies.push(...await this.detectPerformanceAnomalies());
    anomalies.push(...await this.detectErrorRateAnomalies());
    anomalies.push(...await this.detectCostAnomalies());
    anomalies.push(...await this.detectQualityAnomalies());

    return anomalies;
  }

  /**
   * Detect performance anomalies (latency spikes)
   */
  private async detectPerformanceAnomalies(): Promise<Anomaly[]> {
    const query = `
      SELECT
        ro.actual_latency,
        rd.model_selected as model,
        rd.task_type,
        rd.id as routing_id,
        rd.task_hash as task_id
      FROM routing_outcomes ro
      JOIN routing_decisions rd ON ro.routing_id = rd.id
      WHERE rd.created_at > datetime('now', '-24 hours')
      ORDER BY rd.created_at DESC
      LIMIT ?
    `;

    const data = this.db.prepare(query).all(this.config.windowSize) as any[];

    if (data.length < 10) return [];

    const latencies = data.map(d => d.actual_latency);
    const { mean, std } = this.calculateStats(latencies);

    const anomalies: Anomaly[] = [];

    for (const row of data) {
      const zScore = Math.abs((row.actual_latency - mean) / std);
      const threshold = this.getSensitivityThreshold();

      if (zScore > threshold) {
        const deviation = zScore;
        const severity = this.calculateAnomalySeverity(deviation);

        const anomaly: Anomaly = {
          id: this.generateAnomalyId(),
          timestamp: new Date(),
          type: 'performance',
          severity,
          metric: 'latency',
          expectedValue: mean,
          actualValue: row.actual_latency,
          deviation,
          detectionMethod: 'z_score',
          confidence: Math.min(0.95, deviation / 10),
          baseline: { mean, std },
          context: {
            routingId: row.routing_id,
            taskId: row.task_id,
            model: row.model,
            taskType: row.task_type
          },
          resolved: false
        };

        anomalies.push(anomaly);
        await this.storeAnomaly(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect error rate anomalies
   */
  private async detectErrorRateAnomalies(): Promise<Anomaly[]> {
    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
        CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as error_rate
      FROM routing_outcomes
      WHERE created_at > datetime('now', '-1 hour')
    `;

    const result = this.db.prepare(query).get() as any;

    if (!result || result.total < 10) return [];

    // Historical baseline
    const baselineQuery = `
      SELECT
        AVG(error_rate) as mean_error_rate,
        STDEV(error_rate) as std_error_rate
      FROM (
        SELECT
          DATE(created_at) as date,
          CAST(SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) as error_rate
        FROM routing_outcomes
        WHERE created_at > datetime('now', '-7 days')
          AND created_at < datetime('now', '-1 hour')
        GROUP BY DATE(created_at)
      )
    `;

    const baseline = this.db.prepare(baselineQuery).get() as any;

    if (!baseline || !baseline.mean_error_rate) return [];

    const zScore = Math.abs(
      (result.error_rate - baseline.mean_error_rate) / (baseline.std_error_rate || 0.1)
    );

    const threshold = this.getSensitivityThreshold();

    if (zScore > threshold) {
      const anomaly: Anomaly = {
        id: this.generateAnomalyId(),
        timestamp: new Date(),
        type: 'error_rate',
        severity: this.calculateAnomalySeverity(zScore),
        metric: 'error_rate',
        expectedValue: baseline.mean_error_rate,
        actualValue: result.error_rate,
        deviation: zScore,
        detectionMethod: 'z_score',
        confidence: Math.min(0.95, zScore / 5),
        baseline: {
          mean: baseline.mean_error_rate,
          std: baseline.std_error_rate
        },
        resolved: false
      };

      await this.storeAnomaly(anomaly);
      return [anomaly];
    }

    return [];
  }

  /**
   * Detect cost anomalies
   */
  private async detectCostAnomalies(): Promise<Anomaly[]> {
    const query = `
      SELECT
        ro.actual_cost,
        rd.model_selected as model,
        rd.task_type,
        rd.id as routing_id
      FROM routing_outcomes ro
      JOIN routing_decisions rd ON ro.routing_id = rd.id
      WHERE rd.created_at > datetime('now', '-24 hours')
      ORDER BY rd.created_at DESC
      LIMIT ?
    `;

    const data = this.db.prepare(query).all(this.config.windowSize) as any[];

    if (data.length < 10) return [];

    const costs = data.map(d => d.actual_cost);
    const { q1, q3, iqr } = this.calculateIQR(costs);

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies: Anomaly[] = [];

    for (const row of data) {
      if (row.actual_cost > upperBound) {
        const deviation = (row.actual_cost - q3) / iqr;
        const severity = this.calculateAnomalySeverity(deviation);

        const anomaly: Anomaly = {
          id: this.generateAnomalyId(),
          timestamp: new Date(),
          type: 'cost',
          severity,
          metric: 'cost',
          expectedValue: q3,
          actualValue: row.actual_cost,
          deviation,
          detectionMethod: 'iqr',
          confidence: Math.min(0.9, deviation / 3),
          baseline: {
            mean: (q1 + q3) / 2,
            std: iqr / 1.35,
            median: (q1 + q3) / 2,
            q1,
            q3
          },
          context: {
            routingId: row.routing_id,
            model: row.model,
            taskType: row.task_type
          },
          resolved: false
        };

        anomalies.push(anomaly);
        await this.storeAnomaly(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect quality anomalies
   */
  private async detectQualityAnomalies(): Promise<Anomaly[]> {
    const query = `
      SELECT
        ro.quality_score,
        rd.model_selected as model,
        rd.task_type,
        rd.id as routing_id
      FROM routing_outcomes ro
      JOIN routing_decisions rd ON ro.routing_id = rd.id
      WHERE rd.created_at > datetime('now', '-24 hours')
        AND ro.quality_score IS NOT NULL
      ORDER BY rd.created_at DESC
      LIMIT ?
    `;

    const data = this.db.prepare(query).all(this.config.windowSize) as any[];

    if (data.length < 10) return [];

    const scores = data.map(d => d.quality_score);
    const { mean, std } = this.calculateStats(scores);

    const anomalies: Anomaly[] = [];

    for (const row of data) {
      const zScore = Math.abs((row.quality_score - mean) / std);
      const threshold = this.getSensitivityThreshold();

      // Detect unusually low quality
      if (row.quality_score < mean - (threshold * std)) {
        const deviation = zScore;
        const severity = this.calculateAnomalySeverity(deviation);

        const anomaly: Anomaly = {
          id: this.generateAnomalyId(),
          timestamp: new Date(),
          type: 'quality',
          severity,
          metric: 'quality_score',
          expectedValue: mean,
          actualValue: row.quality_score,
          deviation,
          detectionMethod: 'z_score',
          confidence: Math.min(0.9, deviation / 5),
          baseline: { mean, std },
          context: {
            routingId: row.routing_id,
            model: row.model,
            taskType: row.task_type
          },
          resolved: false
        };

        anomalies.push(anomaly);
        await this.storeAnomaly(anomaly);
      }
    }

    return anomalies;
  }

  /**
   * Calculate statistical measures (mean, std)
   */
  private calculateStats(data: number[]): { mean: number; std: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);

    return { mean, std };
  }

  /**
   * Calculate interquartile range
   */
  private calculateIQR(data: number[]): { q1: number; q3: number; iqr: number } {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return { q1, q3, iqr };
  }

  /**
   * Get sensitivity threshold based on configuration
   */
  private getSensitivityThreshold(): number {
    // Map sensitivity (1-5) to z-score threshold
    const thresholds = [4.0, 3.5, 3.0, 2.5, 2.0];
    return thresholds[this.config.sensitivity - 1] || 3.0;
  }

  /**
   * Calculate anomaly severity based on deviation
   */
  private calculateAnomalySeverity(deviation: number): AnomalySeverity {
    if (deviation > 5) return 'critical';
    if (deviation > 4) return 'high';
    if (deviation > 3) return 'medium';
    return 'low';
  }

  /**
   * Generate unique anomaly ID
   */
  private generateAnomalyId(): string {
    return `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Store anomaly in database
   */
  private async storeAnomaly(anomaly: Anomaly): Promise<void> {
    const insert = this.db.prepare(`
      INSERT INTO anomalies (
        id, anomaly_type, metric_name, expected_value, actual_value, deviation,
        severity, task_id, routing_id, model, task_type,
        detection_method, confidence, baseline_mean, baseline_std, resolved
      ) VALUES (
        @id, @anomaly_type, @metric_name, @expected_value, @actual_value, @deviation,
        @severity, @task_id, @routing_id, @model, @task_type,
        @detection_method, @confidence, @baseline_mean, @baseline_std, @resolved
      )
    `);

    insert.run({
      id: anomaly.id,
      anomaly_type: anomaly.type,
      metric_name: anomaly.metric,
      expected_value: anomaly.expectedValue,
      actual_value: anomaly.actualValue,
      deviation: anomaly.deviation,
      severity: anomaly.severity,
      task_id: anomaly.context?.taskId || null,
      routing_id: anomaly.context?.routingId || null,
      model: anomaly.context?.model || null,
      task_type: anomaly.context?.taskType || null,
      detection_method: anomaly.detectionMethod,
      confidence: anomaly.confidence,
      baseline_mean: anomaly.baseline?.mean || null,
      baseline_std: anomaly.baseline?.std || null,
      resolved: anomaly.resolved ? 1 : 0
    });
  }

  /**
   * Get unresolved anomalies
   */
  async getUnresolvedAnomalies(): Promise<Anomaly[]> {
    const records = this.db.prepare(`
      SELECT * FROM anomalies
      WHERE resolved = 0
      ORDER BY severity DESC, detected_at DESC
    `).all() as AnomalyRecord[];

    return records.map(r => this.recordToAnomaly(r));
  }

  /**
   * Convert database record to Anomaly
   */
  private recordToAnomaly(record: AnomalyRecord): Anomaly {
    return {
      id: record.id,
      timestamp: new Date(record.detected_at),
      type: record.anomaly_type,
      severity: record.severity,
      metric: record.metric_name,
      expectedValue: record.expected_value,
      actualValue: record.actual_value,
      deviation: record.deviation,
      detectionMethod: record.detection_method,
      confidence: record.confidence,
      baseline: record.baseline_mean
        ? {
            mean: record.baseline_mean,
            std: record.baseline_std || 0
          }
        : undefined,
      context: record.routing_id
        ? {
            taskId: record.task_id || undefined,
            routingId: record.routing_id || undefined,
            model: record.model as any,
            taskType: record.task_type as any
          }
        : undefined,
      resolved: Boolean(record.resolved),
      resolvedAt: record.resolved_at ? new Date(record.resolved_at) : undefined,
      resolutionNotes: record.resolution_notes || undefined
    };
  }

  /**
   * Resolve anomaly
   */
  async resolveAnomaly(anomalyId: string, notes?: string): Promise<void> {
    this.db.prepare(`
      UPDATE anomalies
      SET resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?
      WHERE id = ?
    `).run(notes || null, anomalyId);
  }
}
