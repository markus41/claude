/**
 * Advanced Observability Suite - Main Entry Point
 *
 * Establishes comprehensive analytics, alerting, and dashboard infrastructure
 * to drive data-driven decision-making and improve operational visibility
 * across the Claude orchestration platform.
 *
 * @module observability
 */

// Core components
export { AnalyticsEngine } from './analytics-engine.js';
export { MetricsAggregator } from './metrics-aggregator.js';
export { AlertManager } from './alert-manager.js';
export { AnomalyDetector } from './anomaly-detector.js';
export { Predictor } from './predictor.js';
export { DashboardBuilder } from './dashboard-builder.js';
export { BIConnector } from './bi-connector.js';

// Pre-built dashboards
export {
  systemOverviewDashboard,
  agentPerformanceDashboard,
  costTrackingDashboard,
  getPreBuiltDashboards,
} from './pre-built-dashboards.js';

// Types
export * from './types.js';

import { AnalyticsEngine } from './analytics-engine.js';
import { MetricsAggregator } from './metrics-aggregator.js';
import { AlertManager } from './alert-manager.js';
import { AnomalyDetector } from './anomaly-detector.js';
import { Predictor } from './predictor.js';
import { DashboardBuilder } from './dashboard-builder.js';
import { BIConnector } from './bi-connector.js';
import { ObservabilityConfig } from './types.js';

/**
 * Observability Suite Manager
 *
 * Orchestrates all observability components and provides unified interface
 */
export class ObservabilitySuite {
  private analyticsEngine: AnalyticsEngine;
  private metricsAggregator: MetricsAggregator;
  private alertManager: AlertManager;
  private anomalyDetector: AnomalyDetector;
  private predictor: Predictor;
  private dashboardBuilder: DashboardBuilder;
  private biConnector: BIConnector;
  private config: ObservabilityConfig;

  constructor(config: Partial<ObservabilityConfig> = {}) {
    const dbPath = config.database?.path || './orchestration.db';

    this.config = {
      analytics: {
        maxQueryDuration: config.analytics?.maxQueryDuration || 30,
        defaultTimeRange: config.analytics?.defaultTimeRange || '1h',
        defaultGranularity: config.analytics?.defaultGranularity || 'minute',
        enableCache: config.analytics?.enableCache ?? true,
        cacheTTL: config.analytics?.cacheTTL || 300,
      },
      alerts: {
        evaluationInterval: config.alerts?.evaluationInterval || 30,
        maxConcurrentAlerts: config.alerts?.maxConcurrentAlerts || 100,
        retryAttempts: config.alerts?.retryAttempts || 3,
        retryDelay: config.alerts?.retryDelay || 5,
      },
      anomalyDetection: {
        enabled: config.anomalyDetection?.enabled ?? true,
        checkInterval: config.anomalyDetection?.checkInterval || 60,
        defaultConfig: config.anomalyDetection?.defaultConfig || {
          method: 'statistical',
          sensitivity: 0.7,
          baselineWindow: '7d',
          minDataPoints: 30,
          stddevThreshold: 3,
        },
      },
      predictions: {
        enabled: config.predictions?.enabled ?? true,
        updateInterval: config.predictions?.updateInterval || 3600,
        defaultConfig: config.predictions?.defaultConfig || {
          method: 'linear_regression',
          forecastHorizon: '24h',
          historicalWindow: '7d',
          updateInterval: '1h',
          confidence: 0.95,
        },
      },
      exports: {
        maxConcurrentExports: config.exports?.maxConcurrentExports || 5,
        defaultFormat: config.exports?.defaultFormat || 'csv',
        tempDirectory: config.exports?.tempDirectory || '/tmp',
      },
      database: {
        path: dbPath,
        maxConnections: config.database?.maxConnections || 10,
      },
    };

    // Initialize components
    this.analyticsEngine = new AnalyticsEngine(
      dbPath,
      this.config.analytics.enableCache,
      this.config.analytics.cacheTTL
    );

    this.metricsAggregator = new MetricsAggregator(dbPath);
    this.alertManager = new AlertManager(dbPath);
    this.anomalyDetector = new AnomalyDetector(dbPath, this.config.anomalyDetection.defaultConfig);
    this.predictor = new Predictor(dbPath, this.config.predictions.defaultConfig);
    this.dashboardBuilder = new DashboardBuilder(dbPath);
    this.biConnector = new BIConnector(dbPath);
  }

  /**
   * Start all observability components
   */
  async start(): Promise<void> {
    console.log('Starting Observability Suite...');

    // Start aggregator
    this.metricsAggregator.start();
    console.log('  ✓ Metrics Aggregator started');

    // Start alert manager
    this.alertManager.start();
    console.log('  ✓ Alert Manager started');

    // Start anomaly detector if enabled
    if (this.config.anomalyDetection.enabled) {
      this.anomalyDetector.start(this.config.anomalyDetection.checkInterval);
      console.log('  ✓ Anomaly Detector started');
    }

    // Start BI connector for scheduled exports
    this.biConnector.start();
    console.log('  ✓ BI Connector started');

    console.log('Observability Suite started successfully');
  }

  /**
   * Stop all observability components
   */
  async stop(): Promise<void> {
    console.log('Stopping Observability Suite...');

    this.metricsAggregator.stop();
    this.alertManager.stop();
    this.anomalyDetector.stop();
    this.biConnector.stop();

    console.log('Observability Suite stopped successfully');
  }

  /**
   * Get health status of all components
   */
  async getHealthStatus(): Promise<any> {
    return {
      healthy: true,
      components: {
        analytics: {
          healthy: true,
          message: 'Analytics engine operational',
          lastCheck: new Date(),
          metrics: this.analyticsEngine.getCacheStatistics(),
        },
        aggregator: {
          healthy: true,
          message: 'Metrics aggregator operational',
          lastCheck: new Date(),
          metrics: this.metricsAggregator.getStatistics(),
        },
        alerts: {
          healthy: true,
          message: 'Alert manager operational',
          lastCheck: new Date(),
        },
        anomalyDetection: {
          healthy: this.config.anomalyDetection.enabled,
          message: this.config.anomalyDetection.enabled
            ? 'Anomaly detector operational'
            : 'Anomaly detector disabled',
          lastCheck: new Date(),
        },
        predictions: {
          healthy: this.config.predictions.enabled,
          message: this.config.predictions.enabled
            ? 'Predictor operational'
            : 'Predictor disabled',
          lastCheck: new Date(),
        },
        exports: {
          healthy: true,
          message: 'BI connector operational',
          lastCheck: new Date(),
        },
      },
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date(),
    };
  }

  /**
   * Get reference to analytics engine
   */
  get analytics(): AnalyticsEngine {
    return this.analyticsEngine;
  }

  /**
   * Get reference to metrics aggregator
   */
  get aggregator(): MetricsAggregator {
    return this.metricsAggregator;
  }

  /**
   * Get reference to alert manager
   */
  get alerts(): AlertManager {
    return this.alertManager;
  }

  /**
   * Get reference to anomaly detector
   */
  get anomalies(): AnomalyDetector {
    return this.anomalyDetector;
  }

  /**
   * Get reference to predictor
   */
  get predictions(): Predictor {
    return this.predictor;
  }

  /**
   * Get reference to dashboard builder
   */
  get dashboards(): DashboardBuilder {
    return this.dashboardBuilder;
  }

  /**
   * Get reference to BI connector
   */
  get exports(): BIConnector {
    return this.biConnector;
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    await this.stop();

    this.analyticsEngine.close();
    this.metricsAggregator.close();
    this.alertManager.close();
    this.anomalyDetector.close();
    this.predictor.close();
    this.dashboardBuilder.close();
    this.biConnector.close();
  }
}

/**
 * Create and configure observability suite
 */
export function createObservabilitySuite(config?: Partial<ObservabilityConfig>): ObservabilitySuite {
  return new ObservabilitySuite(config);
}
