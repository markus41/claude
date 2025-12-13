/**
 * Metrics Aggregator
 *
 * Establishes efficient metric aggregation with rolling windows and materialized views
 * to streamline analytics queries and improve dashboard performance across the
 * Claude orchestration platform.
 */

import Database from 'better-sqlite3';
import { AggregationWindow, MetricsAggregatorConfig, AggregationType } from './types.js';

interface MetricBuffer {
  metricName: string;
  values: number[];
  timestamps: Date[];
  labels: Record<string, string>;
}

export class MetricsAggregator {
  private db: Database.Database;
  private config: MetricsAggregatorConfig;
  private buffer: Map<string, MetricBuffer>;
  private aggregationTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(dbPath: string, config?: Partial<MetricsAggregatorConfig>) {
    this.db = new Database(dbPath);
    this.config = {
      windows: config?.windows || [
        { interval: '1m', retention: '24h' },
        { interval: '5m', retention: '7d' },
        { interval: '1h', retention: '30d' },
        { interval: '1d', retention: '1y' },
      ],
      batchSize: config?.batchSize || 1000,
      flushInterval: config?.flushInterval || 60,
      enableCache: config?.enableCache ?? true,
      cacheTTL: config?.cacheTTL || 300,
    };
    this.buffer = new Map();
  }

  /**
   * Start continuous aggregation
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleAggregation();
  }

  /**
   * Stop continuous aggregation
   */
  stop(): void {
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    this.isRunning = false;
    this.flush();  // Flush any remaining buffered data
  }

  /**
   * Schedule next aggregation run
   */
  private scheduleAggregation(): void {
    if (!this.isRunning) {
      return;
    }

    this.aggregationTimer = setTimeout(() => {
      this.runAggregation().catch(err => {
        console.error('Aggregation error:', err);
      }).finally(() => {
        this.scheduleAggregation();
      });
    }, this.config.flushInterval * 1000);
  }

  /**
   * Run aggregation for all configured windows
   */
  private async runAggregation(): Promise<void> {
    for (const window of this.config.windows) {
      await this.aggregateWindow(window);
    }
    this.cleanupOldAggregates();
  }

  /**
   * Aggregate metrics for a specific time window
   */
  private async aggregateWindow(window: AggregationWindow): Promise<void> {
    const intervalMs = this.parseInterval(window.interval);
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / intervalMs) * intervalMs);
    const windowEnd = new Date(windowStart.getTime() + intervalMs);

    // Get distinct metrics
    const metrics = this.getDistinctMetrics(windowStart, windowEnd);

    for (const metricName of metrics) {
      await this.aggregateMetric(metricName, window.interval, windowStart, windowEnd);
    }
  }

  /**
   * Aggregate a single metric for a time window
   */
  private async aggregateMetric(
    metricName: string,
    interval: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<void> {
    // Check if already aggregated
    const existing = this.db.prepare(`
      SELECT id FROM telemetry_aggregates
      WHERE metric_name = ?
        AND interval = ?
        AND timestamp = ?
    `).get(metricName, interval, windowStart.toISOString());

    if (existing) {
      return;  // Already aggregated
    }

    // Calculate aggregations
    const stats = this.calculateAggregations(metricName, windowStart, windowEnd);

    if (stats.count === 0) {
      return;  // No data to aggregate
    }

    // Insert aggregated data
    this.db.prepare(`
      INSERT INTO telemetry_aggregates (
        metric_name, timestamp, interval, labels,
        count, sum, min, max, avg, p50, p90, p95, p99
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      metricName,
      windowStart.toISOString(),
      interval,
      JSON.stringify({}),
      stats.count,
      stats.sum,
      stats.min,
      stats.max,
      stats.avg,
      stats.p50,
      stats.p90,
      stats.p95,
      stats.p99
    );
  }

  /**
   * Calculate all aggregations for a metric in a time window
   */
  private calculateAggregations(
    metricName: string,
    windowStart: Date,
    windowEnd: Date
  ): {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } {
    const sql = `
      SELECT
        COUNT(*) as count,
        SUM(metric_value) as sum,
        MIN(metric_value) as min,
        MAX(metric_value) as max,
        AVG(metric_value) as avg
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp >= ?
        AND timestamp < ?
    `;

    const row = this.db.prepare(sql).get(
      metricName,
      windowStart.toISOString(),
      windowEnd.toISOString()
    ) as any;

    if (!row || row.count === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    // Calculate percentiles
    const percentiles = this.calculatePercentiles(metricName, windowStart, windowEnd);

    return {
      count: row.count,
      sum: row.sum || 0,
      min: row.min || 0,
      max: row.max || 0,
      avg: row.avg || 0,
      ...percentiles,
    };
  }

  /**
   * Calculate percentiles for a metric in a time window
   */
  private calculatePercentiles(
    metricName: string,
    windowStart: Date,
    windowEnd: Date
  ): {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  } {
    const sql = `
      SELECT metric_value
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp >= ?
        AND timestamp < ?
      ORDER BY metric_value ASC
    `;

    const rows = this.db.prepare(sql).all(
      metricName,
      windowStart.toISOString(),
      windowEnd.toISOString()
    ) as any[];

    if (rows.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const values = rows.map(r => r.metric_value);
    return {
      p50: this.percentile(values, 0.5),
      p90: this.percentile(values, 0.9),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    };
  }

  /**
   * Calculate percentile from sorted values
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  /**
   * Get distinct metric names in a time window
   */
  private getDistinctMetrics(windowStart: Date, windowEnd: Date): string[] {
    const sql = `
      SELECT DISTINCT metric_name
      FROM telemetry_metrics
      WHERE timestamp >= ?
        AND timestamp < ?
    `;

    const rows = this.db.prepare(sql).all(
      windowStart.toISOString(),
      windowEnd.toISOString()
    ) as any[];

    return rows.map(r => r.metric_name);
  }

  /**
   * Clean up old aggregates based on retention policy
   */
  private cleanupOldAggregates(): void {
    for (const window of this.config.windows) {
      const retentionMs = this.parseInterval(window.retention);
      const cutoffDate = new Date(Date.now() - retentionMs);

      const result = this.db.prepare(`
        DELETE FROM telemetry_aggregates
        WHERE interval = ?
          AND timestamp < ?
      `).run(window.interval, cutoffDate.toISOString());

      if (result.changes > 0) {
        console.log(`Cleaned up ${result.changes} old aggregates for interval ${window.interval}`);
      }
    }
  }

  /**
   * Parse interval string to milliseconds
   */
  private parseInterval(interval: string): number {
    const match = /^(\d+)([smhdy])$/.exec(interval);
    if (!match) {
      throw new Error(`Invalid interval format: ${interval}`);
    }

    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      case 'y':
        return amount * 365 * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid interval unit: ${unit}`);
    }
  }

  /**
   * Flush buffered metrics to database
   */
  flush(): void {
    // This would be used if we implement buffering
    // For now, metrics are written directly to telemetry_metrics
  }

  /**
   * Get aggregation statistics
   */
  getStatistics(): {
    totalAggregates: number;
    aggregatesByInterval: Record<string, number>;
    oldestAggregate: Date | null;
    newestAggregate: Date | null;
  } {
    const totalRow = this.db.prepare('SELECT COUNT(*) as total FROM telemetry_aggregates').get() as any;

    const byIntervalRows = this.db.prepare(`
      SELECT interval, COUNT(*) as count
      FROM telemetry_aggregates
      GROUP BY interval
    `).all() as any[];

    const aggregatesByInterval: Record<string, number> = {};
    byIntervalRows.forEach(row => {
      aggregatesByInterval[row.interval] = row.count;
    });

    const dateRow = this.db.prepare(`
      SELECT
        MIN(timestamp) as oldest,
        MAX(timestamp) as newest
      FROM telemetry_aggregates
    `).get() as any;

    return {
      totalAggregates: totalRow.total || 0,
      aggregatesByInterval,
      oldestAggregate: dateRow?.oldest ? new Date(dateRow.oldest) : null,
      newestAggregate: dateRow?.newest ? new Date(dateRow.newest) : null,
    };
  }

  /**
   * Query aggregated data for faster analytics
   */
  queryAggregates(
    metricName: string,
    interval: string,
    startTime: Date,
    endTime: Date
  ): Array<{
    timestamp: Date;
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  }> {
    const sql = `
      SELECT *
      FROM telemetry_aggregates
      WHERE metric_name = ?
        AND interval = ?
        AND timestamp >= ?
        AND timestamp <= ?
      ORDER BY timestamp ASC
    `;

    const rows = this.db.prepare(sql).all(
      metricName,
      interval,
      startTime.toISOString(),
      endTime.toISOString()
    ) as any[];

    return rows.map(row => ({
      timestamp: new Date(row.timestamp),
      count: row.count,
      sum: row.sum,
      min: row.min,
      max: row.max,
      avg: row.avg,
      p50: row.p50,
      p90: row.p90,
      p95: row.p95,
      p99: row.p99,
    }));
  }

  /**
   * Materialize a view for common query patterns
   */
  materializeView(viewName: string, sql: string): void {
    // Drop existing view if it exists
    this.db.prepare(`DROP VIEW IF EXISTS ${viewName}`).run();

    // Create new view
    this.db.prepare(`CREATE VIEW ${viewName} AS ${sql}`).run();
  }

  /**
   * Get recommended interval based on time range
   */
  getRecommendedInterval(startTime: Date, endTime: Date): string {
    const rangeMs = endTime.getTime() - startTime.getTime();
    const rangeHours = rangeMs / (1000 * 60 * 60);

    if (rangeHours <= 6) {
      return '1m';
    } else if (rangeHours <= 48) {
      return '5m';
    } else if (rangeHours <= 168) {  // 7 days
      return '1h';
    } else {
      return '1d';
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.stop();
    this.db.close();
  }
}
