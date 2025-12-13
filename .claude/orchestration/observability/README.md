# Advanced Observability Suite

Comprehensive analytics, alerting, and dashboard infrastructure for the Claude orchestration platform.

## Overview

The Observability Suite establishes scalable real-time monitoring and analytics to drive data-driven decision-making and improve operational visibility across all Claude orchestration workflows.

## Features

### Analytics Engine
- **Real-time metric aggregation** with sub-second query performance
- **Time-series analysis** with multiple granularities (minute, hour, day, week, month)
- **Statistical calculations** including percentiles (P50, P90, P95, P99) and standard deviation
- **Intelligent caching** with automatic TTL and hit tracking
- **Query optimization** for datasets up to 10,000+ points

### Alert Manager
- **Multi-channel notifications** (log, webhook, Slack, email, PagerDuty)
- **Intelligent alert evaluation** with duration thresholds
- **Alert lifecycle management** (triggered, resolved, silenced)
- **Alert grouping and suppression** to reduce noise
- **Configurable severity levels** (info, warning, error, critical)

### Anomaly Detector
- **Statistical anomaly detection** using standard deviation analysis
- **Automatic baseline calculation** with configurable windows
- **Multiple anomaly types** (spike, drop, outlier, trend_change)
- **Confidence scoring** from 0.0 to 1.0
- **Acknowledgment tracking** for detected anomalies

### Predictor
- **Time-series forecasting** with multiple methods:
  - Linear regression
  - Moving average
  - Exponential smoothing
- **Confidence intervals** with configurable levels
- **Model accuracy tracking** using R-squared metrics
- **Automatic refresh** with configurable update intervals

### Dashboard Builder
- **Dynamic dashboard creation** with drag-and-drop layouts
- **Multiple panel types** (timeseries, gauge, table, stat, heatmap, pie, bar)
- **Grafana-compatible export** for external visualization
- **Pre-built dashboards** for system, agent, and cost monitoring
- **Responsive grid layouts** supporting 24-column system

### BI Connector
- **Multi-format export** (CSV, JSON, Parquet, Excel)
- **Scheduled exports** with cron expressions
- **Multiple destinations** (file, S3, GCS, HTTP, SFTP)
- **Execution tracking** with history and error logging
- **Batch processing** for large datasets

### Metrics Aggregator
- **Rolling window aggregation** (1m, 5m, 1h, 1d)
- **Materialized views** for performance optimization
- **Automatic cleanup** based on retention policies
- **Multi-dimensional aggregation** with label support
- **Cache management** for frequently accessed data

## Installation

```bash
# Install dependencies
npm install better-sqlite3

# Initialize database schema
sqlite3 ./orchestration.db < .claude/orchestration/db/observability.sql
```

## Quick Start

```typescript
import { createObservabilitySuite } from './observability/index.js';

// Create observability suite
const observability = createObservabilitySuite({
  database: { path: './orchestration.db' },
  analytics: { enableCache: true, cacheTTL: 300 },
  anomalyDetection: { enabled: true, checkInterval: 60 },
});

// Start all components
await observability.start();

// Query metrics
const result = await observability.analytics.executeQuery({
  metrics: ['cpu_usage_percent'],
  timeRange: { type: 'relative', value: '1h' },
  granularity: 'minute',
  aggregations: ['avg', 'p95'],
});

// Create alert
observability.alerts.createAlert({
  name: 'High CPU Usage',
  severity: 'warning',
  condition: {
    metric: 'cpu_usage_percent',
    operator: 'gt',
    threshold: 80,
    duration: 300,
    evaluationInterval: 30,
  },
  channels: [
    { type: 'log', config: { level: 'warn' } },
    { type: 'slack', config: { webhookUrl: 'https://...' } },
  ],
  status: 'active',
  enabled: true,
});

// Create dashboard
const dashboard = observability.dashboards.createDashboard({
  name: 'My Dashboard',
  refreshInterval: 30,
  timeRange: { type: 'relative', value: '24h' },
  panels: [...],
  isDefault: false,
  isPublic: true,
});

// Export to Grafana
await observability.dashboards.exportToGrafana(dashboard.id, './grafana-dashboard.json');
```

## Pre-Built Dashboards

### System Overview
- System health status
- Request rate and error rate
- Response time (P95)
- CPU and memory usage

### Agent Performance
- Agent success rate
- Execution count by agent type
- Execution duration (P90)
- Token usage by agent
- Error rate heatmap

### Cost Tracking
- Daily and monthly cost totals
- Cost trend analysis
- Cost by model (pie chart)
- Token usage by model
- Top 10 agents by cost

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Observability Suite Manager                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Analytics   │  │    Alert     │  │   Anomaly    │ │
│  │   Engine     │  │   Manager    │  │   Detector   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Metrics    │  │  Predictor   │  │  Dashboard   │ │
│  │  Aggregator  │  │              │  │   Builder    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐                                      │
│  │      BI      │                                      │
│  │  Connector   │                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────────┐
              │   SQLite Database    │
              │  (observability.sql) │
              └──────────────────────┘
```

## Database Schema

The suite uses the following tables:
- `analytics_queries` - Saved query definitions
- `alerts` - Alert rule definitions
- `alert_history` - Alert trigger history
- `dashboards` - Dashboard configurations
- `dashboard_panels` - Individual panel definitions
- `bi_exports` - Export job configurations
- `bi_export_history` - Export execution history
- `metrics_cache` - Query result cache
- `anomaly_detections` - Detected anomalies
- `predictions` - Forecasted values

## Configuration

```typescript
interface ObservabilityConfig {
  analytics: {
    maxQueryDuration: number;        // Max query time in seconds
    defaultTimeRange: string;         // Default time range (e.g., '1h')
    defaultGranularity: TimeGranularity;
    enableCache: boolean;
    cacheTTL: number;                 // Cache TTL in seconds
  };
  alerts: {
    evaluationInterval: number;       // Alert check interval
    maxConcurrentAlerts: number;
    retryAttempts: number;
    retryDelay: number;
  };
  anomalyDetection: {
    enabled: boolean;
    checkInterval: number;
    defaultConfig: AnomalyDetectorConfig;
  };
  predictions: {
    enabled: boolean;
    updateInterval: number;
    defaultConfig: PredictorConfig;
  };
  exports: {
    maxConcurrentExports: number;
    defaultFormat: ExportFormat;
    tempDirectory: string;
  };
  database: {
    path: string;
    maxConnections: number;
  };
}
```

## Performance Targets

- **Query Performance**: < 2 seconds for datasets up to 10,000 points
- **Alert Evaluation**: < 1 second per alert
- **Cache Hit Rate**: > 70% for repeated queries
- **Dashboard Load**: < 2 seconds initial load
- **Export Performance**: > 1,000 rows/second
- **Anomaly Detection**: < 5 seconds per metric
- **Prediction Generation**: < 10 seconds per forecast

## Quality Standards

✅ All charts include proper axis labels and legends
✅ Color palettes meet WCAG AA contrast ratios (4.5:1)
✅ Interactive elements are keyboard accessible
✅ TypeScript strict mode with comprehensive types
✅ Error boundaries with graceful degradation
✅ Responsive layouts (320px - 2560px viewports)
✅ Real-time updates throttled appropriately

## Integration Examples

### With Telemetry System
```typescript
import { telemetryCollector } from '../telemetry/index.js';
import { observability } from './index.js';

// Metrics are automatically available for analytics
const cpuMetrics = await observability.analytics.executeQuery({
  metrics: ['cpu_usage_percent'],
  timeRange: { type: 'relative', value: '1h' },
  granularity: 'minute',
});
```

### With Alert Channels
```typescript
// Slack notification
observability.alerts.createAlert({
  name: 'Database Connection Pool Exhausted',
  severity: 'critical',
  condition: {
    metric: 'db_pool_available',
    operator: 'lt',
    threshold: 5,
    duration: 60,
  },
  channels: [{
    type: 'slack',
    config: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL!,
      channel: '#ops-alerts',
      username: 'Observability Bot',
    },
  }],
  status: 'active',
  enabled: true,
});
```

### With Scheduled Exports
```typescript
// Daily cost report to S3
observability.exports.createExport({
  name: 'Daily Cost Report',
  exportType: 'scheduled',
  format: 'csv',
  queryDefinition: {
    metrics: ['llm_cost_usd'],
    dimensions: ['model', 'agent_type'],
    timeRange: { type: 'relative', value: '1d' },
    granularity: 'day',
    aggregations: ['sum'],
  },
  scheduleCron: '0 0 * * *',  // Daily at midnight
  destination: {
    type: 's3',
    config: {
      bucket: 'observability-exports',
      prefix: 'cost-reports/',
      region: 'us-east-1',
    },
  },
  status: 'active',
});
```

## Troubleshooting

### High Memory Usage
- Reduce cache TTL
- Decrease aggregation window count
- Increase cleanup frequency

### Slow Queries
- Use pre-aggregated data for long time ranges
- Add indexes to frequently queried dimensions
- Enable query result caching

### Alert Storm
- Increase alert duration thresholds
- Implement alert grouping
- Use silence periods during maintenance

## Contributing

This observability suite follows Brookside BI brand standards:
- Business value emphasized in comments
- Scalable architecture for multi-team environments
- Sustainable practices that grow with organization
- Clear documentation of measurable outcomes

## License

Internal use only - Claude Orchestration Platform

## Version

1.0.0 - Initial release
