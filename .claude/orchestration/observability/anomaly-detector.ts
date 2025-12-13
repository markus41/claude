/**
 * Anomaly Detector
 *
 * Establishes intelligent anomaly detection using statistical methods to identify
 * unusual patterns and improve proactive incident prevention across the platform.
 */

import Database from 'better-sqlite3';
import { AnomalyDetection, AnomalyDetectorConfig, DetectionMethod, AnomalyType, AnomalySeverity } from './types.js';

export class AnomalyDetector {
  private db: Database.Database;
  private config: AnomalyDetectorConfig;
  private detectionTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(dbPath: string, config?: Partial<AnomalyDetectorConfig>) {
    this.db = new Database(dbPath);
    this.config = {
      method: config?.method || 'statistical',
      sensitivity: config?.sensitivity || 0.7,
      baselineWindow: config?.baselineWindow || '7d',
      minDataPoints: config?.minDataPoints || 30,
      stddevThreshold: config?.stddevThreshold || 3,
    };
  }

  start(checkIntervalSeconds = 60): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleDetection(checkIntervalSeconds);
  }

  stop(): void {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
    this.isRunning = false;
  }

  private scheduleDetection(intervalSeconds: number): void {
    if (!this.isRunning) return;

    this.detectionTimer = setTimeout(() => {
      this.runDetection().catch(err => console.error('Anomaly detection error:', err))
        .finally(() => this.scheduleDetection(intervalSeconds));
    }, intervalSeconds * 1000);
  }

  private async runDetection(): Promise<void> {
    const metrics = this.getMonitoredMetrics();

    for (const metric of metrics) {
      try {
        await this.detectMetricAnomalies(metric);
      } catch (error) {
        console.error(`Error detecting anomalies for ${metric}:`, error);
      }
    }
  }

  private async detectMetricAnomalies(metricName: string): Promise<void> {
    const baseline = this.calculateBaseline(metricName);
    if (!baseline || baseline.dataPoints < this.config.minDataPoints) {
      return;
    }

    const recentValue = this.getRecentValue(metricName);
    if (recentValue === null) return;

    const deviation = Math.abs(recentValue - baseline.mean) / baseline.stddev;

    if (deviation >= this.config.stddevThreshold!) {
      const anomaly = this.createAnomaly(metricName, recentValue, baseline, deviation);
      this.recordAnomaly(anomaly);
    }
  }

  private calculateBaseline(metricName: string): {
    mean: number;
    stddev: number;
    min: number;
    max: number;
    dataPoints: number;
  } | null {
    const windowMs = this.parseTimeWindow(this.config.baselineWindow);
    const startTime = new Date(Date.now() - windowMs);

    const sql = `
      SELECT
        COUNT(*) as data_points,
        AVG(metric_value) as mean,
        MIN(metric_value) as min,
        MAX(metric_value) as max,
        (
          SQRT(
            AVG(metric_value * metric_value) - (AVG(metric_value) * AVG(metric_value))
          )
        ) as stddev
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp >= ?
    `;

    const row = this.db.prepare(sql).get(metricName, startTime.toISOString()) as any;

    if (!row || row.data_points === 0) {
      return null;
    }

    return {
      mean: row.mean || 0,
      stddev: row.stddev || 0,
      min: row.min || 0,
      max: row.max || 0,
      dataPoints: row.data_points,
    };
  }

  private getRecentValue(metricName: string): number | null {
    const sql = `
      SELECT AVG(metric_value) as value
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp > datetime('now', '-5 minutes')
    `;

    const row = this.db.prepare(sql).get(metricName) as any;
    return row?.value || null;
  }

  private createAnomaly(
    metricName: string,
    observedValue: number,
    baseline: any,
    deviationScore: number
  ): Partial<AnomalyDetection> {
    const anomalyType: AnomalyType = observedValue > baseline.mean ? 'spike' : 'drop';
    const severity = this.calculateSeverity(deviationScore);

    return {
      metricName,
      detectionMethod: this.config.method,
      anomalyType,
      severity,
      observedValue,
      expectedValue: baseline.mean,
      deviationScore,
      confidence: Math.min(deviationScore / 10, 1.0),
      baselineWindow: this.config.baselineWindow,
      detectedAt: new Date(),
      acknowledged: false,
    };
  }

  private calculateSeverity(deviationScore: number): AnomalySeverity {
    if (deviationScore >= 5) return 'critical';
    if (deviationScore >= 4) return 'high';
    if (deviationScore >= 3) return 'medium';
    return 'low';
  }

  private recordAnomaly(anomaly: Partial<AnomalyDetection>): void {
    this.db.prepare(`
      INSERT INTO anomaly_detections (
        detected_at, metric_name, detection_method, anomaly_type, severity,
        observed_value, expected_value, deviation_score, confidence,
        baseline_window, labels, context, acknowledged
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      anomaly.detectedAt!.toISOString(),
      anomaly.metricName,
      anomaly.detectionMethod,
      anomaly.anomalyType,
      anomaly.severity,
      anomaly.observedValue,
      anomaly.expectedValue,
      anomaly.deviationScore,
      anomaly.confidence,
      anomaly.baselineWindow,
      anomaly.labels ? JSON.stringify(anomaly.labels) : null,
      anomaly.context ? JSON.stringify(anomaly.context) : null,
      anomaly.acknowledged ? 1 : 0
    );

    console.log(`Anomaly detected: ${anomaly.metricName} - ${anomaly.anomalyType} (${anomaly.severity})`);
  }

  private getMonitoredMetrics(): string[] {
    const rows = this.db.prepare(`
      SELECT DISTINCT metric_name
      FROM telemetry_metrics
      WHERE timestamp > datetime('now', '-1 hour')
    `).all() as any[];

    return rows.map(r => r.metric_name);
  }

  private parseTimeWindow(window: string): number {
    const match = /^(\d+)([smhd])$/.exec(window);
    if (!match) throw new Error(`Invalid time window: ${window}`);

    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    switch (unit) {
      case 's': return amount * 1000;
      case 'm': return amount * 60 * 1000;
      case 'h': return amount * 60 * 60 * 1000;
      case 'd': return amount * 24 * 60 * 60 * 1000;
      default: throw new Error(`Invalid unit: ${unit}`);
    }
  }

  close(): void {
    this.stop();
    this.db.close();
  }
}
