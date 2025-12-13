/**
 * Observability Suite Integration Tests
 *
 * Verifies core functionality of analytics, alerting, anomaly detection,
 * and dashboard components to ensure reliable monitoring infrastructure.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createObservabilitySuite, ObservabilitySuite } from './index.js';
import Database from 'better-sqlite3';
import { promises as fs } from 'fs';

describe('Observability Suite', () => {
  let suite: ObservabilitySuite;
  let db: Database.Database;
  const testDbPath = './test-observability.db';

  beforeAll(async () => {
    // Create test database
    db = new Database(testDbPath);

    // Load schemas
    const telemetrySchema = await fs.readFile('../db/telemetry.sql', 'utf-8');
    const observabilitySchema = await fs.readFile('../db/observability.sql', 'utf-8');

    db.exec(telemetrySchema);
    db.exec(observabilitySchema);

    // Insert test data
    insertTestMetrics(db);

    // Create suite
    suite = createObservabilitySuite({
      database: { path: testDbPath },
      analytics: { enableCache: true },
      anomalyDetection: { enabled: false }, // Disable for deterministic tests
    });
  });

  afterAll(async () => {
    await suite.close();
    db.close();
    await fs.unlink(testDbPath);
  });

  describe('Analytics Engine', () => {
    it('should execute basic query', async () => {
      const result = await suite.analytics.executeQuery({
        metrics: ['cpu_usage_percent'],
        timeRange: { type: 'relative', value: '1h' },
        granularity: 'minute',
        aggregations: ['avg'],
      });

      expect(result).toBeDefined();
      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it('should cache query results', async () => {
      const query = {
        metrics: ['memory_usage_percent'],
        timeRange: { type: 'relative', value: '1h' } as const,
        granularity: 'minute' as const,
        aggregations: ['avg' as const],
      };

      // First execution (cache miss)
      const result1 = await suite.analytics.executeQuery(query);
      expect(result1.cached).toBe(false);

      // Second execution (cache hit)
      const result2 = await suite.analytics.executeQuery(query);
      expect(result2.cached).toBe(true);
    });

    it('should calculate statistics', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const stats = suite.analytics.calculateStatistics('cpu_usage_percent', oneHourAgo, now);

      expect(stats).toBeDefined();
      expect(stats.count).toBeGreaterThan(0);
      expect(stats.avg).toBeGreaterThanOrEqual(0);
      expect(stats.p50).toBeGreaterThanOrEqual(0);
      expect(stats.p95).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Alert Manager', () => {
    it('should create alert', () => {
      const alert = suite.alerts.createAlert({
        name: 'Test Alert',
        severity: 'warning',
        condition: {
          metric: 'cpu_usage_percent',
          operator: 'gt',
          threshold: 80,
          duration: 60,
          evaluationInterval: 30,
        },
        channels: [
          { type: 'log', config: { level: 'warn' } },
        ],
        status: 'active',
        enabled: true,
      });

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.name).toBe('Test Alert');
    });

    it('should silence alert', () => {
      const alert = suite.alerts.createAlert({
        name: 'Silenceable Alert',
        severity: 'info',
        condition: {
          metric: 'test_metric',
          operator: 'gt',
          threshold: 100,
          duration: 60,
          evaluationInterval: 30,
        },
        channels: [],
        status: 'active',
        enabled: true,
      });

      suite.alerts.silenceAlert(alert.id, 3600); // Silence for 1 hour

      // Verify silence in database
      const row = db.prepare('SELECT silence_until FROM alerts WHERE id = ?').get(alert.id) as any;
      expect(row.silence_until).toBeDefined();
    });
  });

  describe('Metrics Aggregator', () => {
    it('should get aggregation statistics', () => {
      const stats = suite.aggregator.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalAggregates).toBeGreaterThanOrEqual(0);
      expect(stats.aggregatesByInterval).toBeDefined();
    });

    it('should recommend interval', () => {
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 3600000);
      const twoDaysAgo = new Date(now.getTime() - 48 * 3600000);

      expect(suite.aggregator.getRecommendedInterval(sixHoursAgo, now)).toBe('1m');
      expect(suite.aggregator.getRecommendedInterval(twoDaysAgo, now)).toBe('5m');
    });
  });

  describe('Dashboard Builder', () => {
    it('should create dashboard', () => {
      const dashboard = suite.dashboards.createDashboard({
        name: 'Test Dashboard',
        description: 'Test dashboard for integration tests',
        refreshInterval: 30,
        timeRange: { type: 'relative', value: '1h' },
        panels: [
          {
            title: 'CPU Usage',
            type: 'timeseries',
            query: {
              metrics: ['cpu_usage_percent'],
              timeRange: { type: 'relative', value: '1h' },
              granularity: 'minute',
            },
            visualization: {
              unit: 'percent',
            },
            position: { x: 0, y: 0, w: 12, h: 8 },
          },
        ],
        isDefault: false,
        isPublic: true,
      });

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.panels.length).toBe(1);
    });

    it('should list dashboards', () => {
      const dashboards = suite.dashboards.listDashboards();

      expect(dashboards).toBeDefined();
      expect(Array.isArray(dashboards)).toBe(true);
    });

    it('should export to Grafana', async () => {
      const dashboard = suite.dashboards.createDashboard({
        name: 'Grafana Export Test',
        refreshInterval: 60,
        timeRange: { type: 'relative', value: '24h' },
        panels: [],
        isDefault: false,
        isPublic: false,
      });

      const grafanaDashboard = await suite.dashboards.exportToGrafana(dashboard.id);

      expect(grafanaDashboard).toBeDefined();
      expect(grafanaDashboard.dashboard).toBeDefined();
      expect(grafanaDashboard.dashboard.title).toBe('Grafana Export Test');
    });
  });

  describe('BI Connector', () => {
    it('should create export job', () => {
      const exportJob = suite.exports.createExport({
        name: 'Test Export',
        exportType: 'manual',
        format: 'csv',
        queryDefinition: {
          metrics: ['cpu_usage_percent'],
          timeRange: { type: 'relative', value: '1h' },
          granularity: 'minute',
        },
        destination: {
          type: 'file',
          config: { path: '/tmp' },
        },
        status: 'active',
      });

      expect(exportJob).toBeDefined();
      expect(exportJob.id).toBeDefined();
      expect(exportJob.name).toBe('Test Export');
    });
  });

  describe('Predictor', () => {
    it('should generate prediction', async () => {
      const prediction = await suite.predictions.predict('cpu_usage_percent');

      expect(prediction).toBeDefined();
      expect(prediction.predictions).toBeDefined();
      expect(prediction.predictions.length).toBeGreaterThan(0);
      expect(prediction.modelAccuracy).toBeGreaterThanOrEqual(0);
      expect(prediction.modelAccuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const health = await suite.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.healthy).toBe(true);
      expect(health.components).toBeDefined();
      expect(health.components.analytics.healthy).toBe(true);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});

/**
 * Insert test metrics for integration tests
 */
function insertTestMetrics(db: Database.Database): void {
  const now = Date.now();
  const metrics = [
    'cpu_usage_percent',
    'memory_usage_percent',
    'request_total',
    'error_total',
  ];

  // Insert 100 data points for the last hour
  const stmt = db.prepare(`
    INSERT INTO telemetry_metrics (timestamp, metric_name, metric_type, metric_value, labels)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now - (100 - i) * 60000); // Every minute for 100 minutes

    for (const metric of metrics) {
      const value = Math.random() * 100;
      stmt.run(
        timestamp.toISOString(),
        metric,
        'gauge',
        value,
        JSON.stringify({ environment: 'test' })
      );
    }
  }
}
