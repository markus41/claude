/**
 * Analytics Engine
 *
 * Establishes scalable real-time metric aggregation and time-series analysis
 * to drive data-driven insights and improve operational visibility across
 * the Claude orchestration platform.
 */

import Database from 'better-sqlite3';
import {
  AnalyticsQuery,
  QueryResult,
  AggregatedDataPoint,
  DataPoint,
  AggregationType,
  TimeGranularity,
  Statistics,
  QueryFilter,
  QueryOperator,
} from './types.js';

export class AnalyticsEngine {
  private db: Database.Database;
  private cacheEnabled: boolean;
  private cacheTTL: number;  // seconds

  constructor(dbPath: string, cacheEnabled = true, cacheTTL = 300) {
    this.db = new Database(dbPath);
    this.cacheEnabled = cacheEnabled;
    this.cacheTTL = cacheTTL;
  }

  /**
   * Execute analytics query with automatic caching and optimization
   */
  async executeQuery(query: AnalyticsQuery): Promise<QueryResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(query);

    // Check cache first
    if (this.cacheEnabled) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return {
          query,
          data: cached.dataPoints,
          executionTimeMs: Date.now() - startTime,
          rowCount: cached.rowCount,
          cached: true,
          generatedAt: new Date(cached.createdAt),
        };
      }
    }

    // Parse time range
    const { startTime: queryStart, endTime: queryEnd } = this.parseTimeRange(query.timeRange);

    // Build SQL query
    const sql = this.buildSQLQuery(query, queryStart, queryEnd);

    // Execute query
    const rows = this.db.prepare(sql).all() as unknown[];
    const dataPoints = this.formatResults(rows, query);

    // Cache results
    if (this.cacheEnabled && dataPoints.length > 0) {
      this.cacheResults(cacheKey, query, dataPoints, queryStart, queryEnd);
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      query,
      data: dataPoints,
      executionTimeMs,
      rowCount: dataPoints.length,
      cached: false,
      generatedAt: new Date(),
    };
  }

  /**
   * Build optimized SQL query from analytics query definition
   */
  private buildSQLQuery(query: AnalyticsQuery, startTime: Date, endTime: Date): string {
    const { metrics, dimensions, filters, granularity, aggregations, orderBy, limit } = query;

    // Build SELECT clause
    const selectClauses: string[] = [];

    // Time bucket for granularity
    const timeBucket = this.getTimeBucketSQL(granularity);
    selectClauses.push(`${timeBucket} as time_bucket`);

    // Dimensions
    if (dimensions && dimensions.length > 0) {
      dimensions.forEach(dim => {
        selectClauses.push(`json_extract(labels, '$.${dim}') as ${this.sanitizeIdentifier(dim)}`);
      });
    }

    // Aggregations for each metric
    const aggTypes = aggregations || ['avg'];
    metrics.forEach(metric => {
      aggTypes.forEach(agg => {
        const aggSQL = this.getAggregationSQL(agg, 'metric_value');
        selectClauses.push(`${aggSQL} as ${metric}_${agg}`);
      });
    });

    // Build WHERE clause
    const whereClauses: string[] = [];
    whereClauses.push(`timestamp >= '${startTime.toISOString()}'`);
    whereClauses.push(`timestamp <= '${endTime.toISOString()}'`);
    whereClauses.push(`metric_name IN (${metrics.map(m => `'${m}'`).join(', ')})`);

    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        whereClauses.push(this.buildFilterSQL(filter));
      });
    }

    // Build GROUP BY clause
    const groupByClauses: string[] = ['time_bucket'];
    if (dimensions && dimensions.length > 0) {
      dimensions.forEach(dim => {
        groupByClauses.push(this.sanitizeIdentifier(dim));
      });
    }

    // Build ORDER BY clause
    let orderBySQL = 'time_bucket ASC';
    if (orderBy && orderBy.length > 0) {
      orderBySQL = orderBy.map(o => `${this.sanitizeIdentifier(o.field)} ${o.direction.toUpperCase()}`).join(', ');
    }

    // Build final query
    let sql = `
      SELECT ${selectClauses.join(', ')}
      FROM telemetry_metrics
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY ${groupByClauses.join(', ')}
      ORDER BY ${orderBySQL}
    `;

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return sql;
  }

  /**
   * Get SQL for time bucketing based on granularity
   */
  private getTimeBucketSQL(granularity: TimeGranularity): string {
    switch (granularity) {
      case 'minute':
        return "strftime('%Y-%m-%d %H:%M:00', timestamp)";
      case 'hour':
        return "strftime('%Y-%m-%d %H:00:00', timestamp)";
      case 'day':
        return "strftime('%Y-%m-%d 00:00:00', timestamp)";
      case 'week':
        return "strftime('%Y-%W', timestamp)";
      case 'month':
        return "strftime('%Y-%m-01 00:00:00', timestamp)";
      default:
        return "strftime('%Y-%m-%d %H:%M:00', timestamp)";
    }
  }

  /**
   * Get SQL aggregation function
   */
  private getAggregationSQL(agg: AggregationType, column: string): string {
    switch (agg) {
      case 'sum':
        return `SUM(${column})`;
      case 'avg':
        return `AVG(${column})`;
      case 'count':
        return `COUNT(${column})`;
      case 'min':
        return `MIN(${column})`;
      case 'max':
        return `MAX(${column})`;
      case 'p50':
        return `percentile_cont(0.5) WITHIN GROUP (ORDER BY ${column})`;
      case 'p90':
        return `percentile_cont(0.9) WITHIN GROUP (ORDER BY ${column})`;
      case 'p95':
        return `percentile_cont(0.95) WITHIN GROUP (ORDER BY ${column})`;
      case 'p99':
        return `percentile_cont(0.99) WITHIN GROUP (ORDER BY ${column})`;
      case 'stddev':
        return `(
          SQRT(
            AVG(${column} * ${column}) - (AVG(${column}) * AVG(${column}))
          )
        )`;
      default:
        return `AVG(${column})`;
    }
  }

  /**
   * Build SQL filter clause
   */
  private buildFilterSQL(filter: QueryFilter): string {
    const { field, operator, value, caseSensitive = true } = filter;
    const fieldSQL = field.startsWith('label.')
      ? `json_extract(labels, '$.${field.substring(6)}')`
      : this.sanitizeIdentifier(field);

    const valueSQL = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;

    switch (operator) {
      case 'eq':
        return caseSensitive ? `${fieldSQL} = ${valueSQL}` : `LOWER(${fieldSQL}) = LOWER(${valueSQL})`;
      case 'neq':
        return caseSensitive ? `${fieldSQL} != ${valueSQL}` : `LOWER(${fieldSQL}) != LOWER(${valueSQL})`;
      case 'gt':
        return `${fieldSQL} > ${valueSQL}`;
      case 'gte':
        return `${fieldSQL} >= ${valueSQL}`;
      case 'lt':
        return `${fieldSQL} < ${valueSQL}`;
      case 'lte':
        return `${fieldSQL} <= ${valueSQL}`;
      case 'in':
        if (Array.isArray(value)) {
          const inValues = value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ');
          return `${fieldSQL} IN (${inValues})`;
        }
        return '1=1';
      case 'nin':
        if (Array.isArray(value)) {
          const ninValues = value.map(v => typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v).join(', ');
          return `${fieldSQL} NOT IN (${ninValues})`;
        }
        return '1=1';
      case 'contains':
        return caseSensitive
          ? `${fieldSQL} LIKE '%${String(value).replace(/'/g, "''")}%'`
          : `LOWER(${fieldSQL}) LIKE LOWER('%${String(value).replace(/'/g, "''")}%')`;
      case 'regex':
        return `${fieldSQL} REGEXP '${String(value).replace(/'/g, "''")}'`;
      default:
        return '1=1';
    }
  }

  /**
   * Format query results into data points
   */
  private formatResults(rows: unknown[], query: AnalyticsQuery): AggregatedDataPoint[] {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    return rows.map((row: any) => {
      const dataPoint: AggregatedDataPoint = {
        timestamp: new Date(row.time_bucket),
        value: 0,
        labels: {},
      };

      // Extract dimension labels
      if (query.dimensions) {
        query.dimensions.forEach(dim => {
          if (row[this.sanitizeIdentifier(dim)] !== undefined) {
            dataPoint.labels![dim] = row[this.sanitizeIdentifier(dim)];
          }
        });
      }

      // Extract aggregated values
      const aggTypes = query.aggregations || ['avg'];
      query.metrics.forEach(metric => {
        aggTypes.forEach(agg => {
          const key = `${metric}_${agg}`;
          if (row[key] !== undefined) {
            if (agg === 'avg') {
              dataPoint.value = row[key];  // Primary value
            }
            (dataPoint as any)[agg] = row[key];
          }
        });
      });

      return dataPoint;
    });
  }

  /**
   * Calculate comprehensive statistics for a metric
   */
  calculateStatistics(metricName: string, startTime: Date, endTime: Date): Statistics {
    const sql = `
      SELECT
        COUNT(*) as count,
        SUM(metric_value) as sum,
        MIN(metric_value) as min,
        MAX(metric_value) as max,
        AVG(metric_value) as avg,
        (
          SQRT(
            AVG(metric_value * metric_value) - (AVG(metric_value) * AVG(metric_value))
          )
        ) as stddev
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp >= ?
        AND timestamp <= ?
    `;

    const row = this.db.prepare(sql).get(metricName, startTime.toISOString(), endTime.toISOString()) as any;

    if (!row || row.count === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        avg: 0,
        stddev: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
      };
    }

    // Calculate percentiles
    const percentiles = this.calculatePercentiles(metricName, startTime, endTime);

    return {
      count: row.count,
      sum: row.sum || 0,
      min: row.min || 0,
      max: row.max || 0,
      avg: row.avg || 0,
      stddev: row.stddev || 0,
      ...percentiles,
    };
  }

  /**
   * Calculate percentiles for a metric
   */
  private calculatePercentiles(metricName: string, startTime: Date, endTime: Date): {
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
        AND timestamp <= ?
      ORDER BY metric_value ASC
    `;

    const rows = this.db.prepare(sql).all(metricName, startTime.toISOString(), endTime.toISOString()) as any[];

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
   * Parse time range into absolute start/end dates
   */
  private parseTimeRange(timeRange: any): { startTime: Date; endTime: Date } {
    if (timeRange.type === 'absolute') {
      return {
        startTime: new Date(timeRange.start),
        endTime: new Date(timeRange.end),
      };
    }

    // Parse relative time range (e.g., '1h', '24h', '7d', '30d')
    const now = new Date();
    const match = /^(\d+)([smhd])$/.exec(timeRange.value);

    if (!match) {
      // Default to 1 hour
      return {
        startTime: new Date(now.getTime() - 3600000),
        endTime: now,
      };
    }

    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);

    let ms = 0;
    switch (unit) {
      case 's':
        ms = amount * 1000;
        break;
      case 'm':
        ms = amount * 60 * 1000;
        break;
      case 'h':
        ms = amount * 60 * 60 * 1000;
        break;
      case 'd':
        ms = amount * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      startTime: new Date(now.getTime() - ms),
      endTime: now,
    };
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: AnalyticsQuery): string {
    const keyObj = {
      metrics: query.metrics.sort(),
      dimensions: query.dimensions?.sort() || [],
      filters: query.filters || [],
      timeRange: query.timeRange,
      granularity: query.granularity,
      aggregations: query.aggregations?.sort() || ['avg'],
    };
    return Buffer.from(JSON.stringify(keyObj)).toString('base64');
  }

  /**
   * Get cached query result
   */
  private getCachedResult(cacheKey: string): any | null {
    const sql = `
      SELECT *
      FROM metrics_cache
      WHERE cache_key = ?
        AND expires_at > datetime('now')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const row = this.db.prepare(sql).get(cacheKey) as any;

    if (!row) {
      return null;
    }

    // Update hit count and last accessed
    this.db.prepare('UPDATE metrics_cache SET hit_count = hit_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?').run(row.id);

    return {
      dataPoints: JSON.parse(row.data_points),
      rowCount: row.row_count,
      createdAt: row.created_at,
    };
  }

  /**
   * Cache query results
   */
  private cacheResults(
    cacheKey: string,
    query: AnalyticsQuery,
    dataPoints: AggregatedDataPoint[],
    startTime: Date,
    endTime: Date
  ): void {
    const expiresAt = new Date(Date.now() + this.cacheTTL * 1000);

    const sql = `
      INSERT OR REPLACE INTO metrics_cache (
        cache_key, metric_name, start_time, end_time, granularity, labels,
        aggregation_type, data_points, row_count, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    this.db.prepare(sql).run(
      cacheKey,
      query.metrics.join(','),
      startTime.toISOString(),
      endTime.toISOString(),
      query.granularity,
      JSON.stringify({}),
      (query.aggregations || ['avg']).join(','),
      JSON.stringify(dataPoints),
      dataPoints.length,
      expiresAt.toISOString()
    );
  }

  /**
   * Sanitize SQL identifier
   */
  private sanitizeIdentifier(identifier: string): string {
    return identifier.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const result = this.db.prepare("DELETE FROM metrics_cache WHERE expires_at < datetime('now')").run();
    return result.changes;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
    totalHits: number;
    avgHitsPerEntry: number;
  } {
    const sql = `
      SELECT
        COUNT(*) as total_entries,
        SUM(CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END) as active_entries,
        SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired_entries,
        SUM(hit_count) as total_hits,
        AVG(hit_count) as avg_hits_per_entry
      FROM metrics_cache
    `;

    const row = this.db.prepare(sql).get() as any;
    return {
      totalEntries: row.total_entries || 0,
      activeEntries: row.active_entries || 0,
      expiredEntries: row.expired_entries || 0,
      totalHits: row.total_hits || 0,
      avgHitsPerEntry: row.avg_hits_per_entry || 0,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}
