/**
 * Advanced Observability Suite - Type Definitions
 *
 * Establishes scalable type system for real-time analytics, intelligent alerting,
 * and dashboard infrastructure to drive data-driven decision-making across the
 * Claude orchestration platform.
 */

// ============================================
// ANALYTICS TYPES
// ============================================

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'p50' | 'p90' | 'p95' | 'p99' | 'stddev';
export type TimeGranularity = 'minute' | 'hour' | 'day' | 'week' | 'month';
export type TimeRangeType = 'relative' | 'absolute';
export type QueryOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';

export interface QueryFilter {
  field: string;
  operator: QueryOperator;
  value: string | number | boolean | (string | number)[];
  caseSensitive?: boolean;
}

export interface OrderSpec {
  field: string;
  direction: 'asc' | 'desc';
}

export interface RelativeTimeRange {
  type: 'relative';
  value: string;  // e.g., '1h', '24h', '7d', '30d'
}

export interface AbsoluteTimeRange {
  type: 'absolute';
  start: Date;
  end: Date;
}

export type TimeRange = RelativeTimeRange | AbsoluteTimeRange;

export interface AnalyticsQuery {
  id?: string;
  name?: string;
  description?: string;
  metrics: string[];
  dimensions?: string[];
  filters?: QueryFilter[];
  timeRange: TimeRange;
  granularity: TimeGranularity;
  aggregations?: AggregationType[];
  orderBy?: OrderSpec[];
  limit?: number;
  tags?: string[];
}

export interface DataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

export interface AggregatedDataPoint extends DataPoint {
  count?: number;
  sum?: number;
  min?: number;
  max?: number;
  avg?: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  stddev?: number;
}

export interface QueryResult {
  query: AnalyticsQuery;
  data: AggregatedDataPoint[];
  executionTimeMs: number;
  rowCount: number;
  cached: boolean;
  generatedAt: Date;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'silenced' | 'resolved';
export type AlertOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq';
export type AlertChannelType = 'log' | 'webhook' | 'slack' | 'email' | 'pagerduty';

export interface AlertCondition {
  metric: string;
  operator: AlertOperator;
  threshold: number;
  duration: number;  // seconds the condition must be true
  evaluationInterval: number;  // seconds between evaluations
  labels?: Record<string, string>;  // Filter metrics by labels
}

export interface AlertChannel {
  type: AlertChannelType;
  config: WebhookChannelConfig | SlackChannelConfig | EmailChannelConfig | LogChannelConfig | PagerDutyChannelConfig;
  enabled?: boolean;
}

export interface LogChannelConfig {
  level: 'info' | 'warn' | 'error';
}

export interface WebhookChannelConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface SlackChannelConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface EmailChannelConfig {
  to: string[];
  cc?: string[];
  from: string;
  subject?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface PagerDutyChannelConfig {
  integrationKey: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface Alert {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  condition: AlertCondition;
  channels: AlertChannel[];
  status: AlertStatus;
  silenceUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  enabled: boolean;
}

export interface AlertTrigger {
  id: number;
  alertId: string;
  alertName: string;
  severity: AlertSeverity;
  status: 'triggered' | 'resolved' | 'silenced';
  triggeredAt: Date;
  resolvedAt?: Date;
  triggerValue: number;
  threshold: number;
  message?: string;
  labels?: Record<string, string>;
  notificationSent: boolean;
  notificationChannels?: string[];
  notificationError?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertEvaluation {
  alert: Alert;
  currentValue: number;
  threshold: number;
  conditionMet: boolean;
  durationMet: boolean;
  shouldTrigger: boolean;
  evaluatedAt: Date;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export type PanelType = 'timeseries' | 'gauge' | 'table' | 'stat' | 'heatmap' | 'pie' | 'bar';

export interface VisualizationConfig {
  colors?: string[];
  unit?: string;
  decimals?: number;
  thresholds?: ThresholdConfig[];
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  axes?: AxesConfig;
  [key: string]: unknown;  // Panel-specific config
}

export interface ThresholdConfig {
  value: number;
  color: string;
  label?: string;
}

export interface LegendConfig {
  show: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  alignAs?: 'table' | 'list';
}

export interface TooltipConfig {
  mode?: 'single' | 'multi';
  sort?: 'none' | 'asc' | 'desc';
}

export interface AxesConfig {
  x?: AxisConfig;
  y?: AxisConfig;
}

export interface AxisConfig {
  label?: string;
  scale?: 'linear' | 'log';
  min?: number;
  max?: number;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  query: AnalyticsQuery;
  visualization: VisualizationConfig;
  position: {
    x: number;
    y: number;
    w: number;  // width in grid units (out of 24)
    h: number;  // height in grid units
  };
  sortOrder?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  panels: DashboardPanel[];
  refreshInterval: number;  // seconds
  timeRange: TimeRange;
  layout?: GridLayoutConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  isDefault: boolean;
  isPublic: boolean;
}

export interface GridLayoutConfig {
  columns: number;
  rowHeight: number;
  compactType?: 'vertical' | 'horizontal' | null;
  preventCollision?: boolean;
}

// Grafana-compatible export format
export interface GrafanaDashboard {
  dashboard: {
    id?: number;
    uid: string;
    title: string;
    tags: string[];
    timezone: string;
    panels: GrafanaPanel[];
    schemaVersion: number;
    version: number;
    refresh: string;
    time: {
      from: string;
      to: string;
    };
  };
  overwrite?: boolean;
}

export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  targets: GrafanaTarget[];
  gridPos: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  options?: Record<string, unknown>;
  fieldConfig?: Record<string, unknown>;
}

export interface GrafanaTarget {
  expr: string;
  refId: string;
  legendFormat?: string;
}

// ============================================
// BI EXPORT TYPES
// ============================================

export type ExportFormat = 'csv' | 'json' | 'parquet' | 'excel';
export type ExportType = 'scheduled' | 'manual';
export type ExportDestinationType = 'file' | 's3' | 'gcs' | 'http' | 'sftp';
export type ExportStatus = 'active' | 'paused' | 'failed';

export interface ExportDestination {
  type: ExportDestinationType;
  config: FileDestinationConfig | S3DestinationConfig | GCSDestinationConfig | HttpDestinationConfig | SFTPDestinationConfig;
}

export interface FileDestinationConfig {
  path: string;
  filename?: string;  // Supports templates: {date}, {time}, {name}
}

export interface S3DestinationConfig {
  bucket: string;
  prefix?: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface GCSDestinationConfig {
  bucket: string;
  prefix?: string;
  projectId: string;
  credentials?: string;  // JSON service account key
}

export interface HttpDestinationConfig {
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
}

export interface SFTPDestinationConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  remotePath: string;
}

export interface BIExport {
  id: string;
  name: string;
  description?: string;
  exportType: ExportType;
  format: ExportFormat;
  queryId?: string;
  queryDefinition?: AnalyticsQuery;
  scheduleCron?: string;  // Cron expression
  lastRunAt?: Date;
  nextRunAt?: Date;
  destination: ExportDestination;
  status: ExportStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ExportExecution {
  id: number;
  exportId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'success' | 'failed';
  rowsExported: number;
  filePath?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  executionTimeMs?: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// ANOMALY DETECTION TYPES
// ============================================

export type DetectionMethod = 'statistical' | 'threshold' | 'ml' | 'seasonal';
export type AnomalyType = 'spike' | 'drop' | 'outlier' | 'trend_change' | 'missing_data';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AnomalyDetection {
  id: number;
  detectedAt: Date;
  metricName: string;
  detectionMethod: DetectionMethod;
  anomalyType: AnomalyType;
  severity: AnomalySeverity;
  observedValue: number;
  expectedValue?: number;
  deviationScore?: number;  // Standard deviations from expected
  confidence: number;  // 0.0 to 1.0
  baselineWindow?: string;
  labels?: Record<string, string>;
  context?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  notes?: string;
}

export interface AnomalyDetectorConfig {
  method: DetectionMethod;
  sensitivity: number;  // 0.0 to 1.0, higher = more sensitive
  baselineWindow: string;  // e.g., '7d', '30d'
  minDataPoints: number;
  stddevThreshold?: number;  // For statistical method
  seasonalPeriod?: string;  // For seasonal method
}

// ============================================
// PREDICTION TYPES
// ============================================

export type PredictionMethod = 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'arima' | 'prophet';

export interface PredictionPoint {
  timestamp: Date;
  value: number;
  confidenceLower?: number;
  confidenceUpper?: number;
}

export interface Prediction {
  id: number;
  generatedAt: Date;
  metricName: string;
  predictionMethod: PredictionMethod;
  forecastHorizon: string;  // e.g., '1h', '24h', '7d', '30d'
  historicalWindow: string;  // e.g., '7d', '30d', '90d'
  predictions: PredictionPoint[];
  modelAccuracy?: number;  // R-squared or similar
  labels?: Record<string, string>;
  metadata?: Record<string, unknown>;
  expiresAt: Date;
}

export interface PredictorConfig {
  method: PredictionMethod;
  forecastHorizon: string;
  historicalWindow: string;
  updateInterval: string;  // How often to regenerate predictions
  confidence: number;  // Confidence interval (e.g., 0.95 for 95%)
}

// ============================================
// METRICS AGGREGATOR TYPES
// ============================================

export interface AggregationWindow {
  interval: string;  // e.g., '1m', '5m', '1h', '1d'
  retention: string;  // How long to keep aggregated data
}

export interface MetricsAggregatorConfig {
  windows: AggregationWindow[];
  batchSize: number;
  flushInterval: number;  // seconds
  enableCache: boolean;
  cacheTTL: number;  // seconds
}

export interface CacheEntry {
  id: number;
  cacheKey: string;
  metricName: string;
  startTime: Date;
  endTime: Date;
  granularity: TimeGranularity;
  labels?: Record<string, string>;
  aggregationType: AggregationType;
  dataPoints: AggregatedDataPoint[];
  rowCount: number;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastAccessed: Date;
}

// ============================================
// ENGINE CONFIGURATION TYPES
// ============================================

export interface ObservabilityConfig {
  analytics: {
    maxQueryDuration: number;  // seconds
    defaultTimeRange: string;
    defaultGranularity: TimeGranularity;
    enableCache: boolean;
    cacheTTL: number;  // seconds
  };
  alerts: {
    evaluationInterval: number;  // seconds
    maxConcurrentAlerts: number;
    retryAttempts: number;
    retryDelay: number;  // seconds
  };
  anomalyDetection: {
    enabled: boolean;
    checkInterval: number;  // seconds
    defaultConfig: AnomalyDetectorConfig;
  };
  predictions: {
    enabled: boolean;
    updateInterval: number;  // seconds
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

// ============================================
// UTILITY TYPES
// ============================================

export interface Statistics {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  stddev: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface HealthStatus {
  healthy: boolean;
  components: {
    database: ComponentStatus;
    analytics: ComponentStatus;
    alerts: ComponentStatus;
    exports: ComponentStatus;
  };
  uptime: number;  // seconds
  version: string;
  timestamp: Date;
}

export interface ComponentStatus {
  healthy: boolean;
  message?: string;
  lastCheck: Date;
  metrics?: Record<string, number>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
