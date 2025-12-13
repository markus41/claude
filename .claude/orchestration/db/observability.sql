-- ============================================
-- OBSERVABILITY DATABASE SCHEMA
-- Advanced analytics, alerting, and dashboard infrastructure
-- Extends telemetry.sql with analytics and monitoring capabilities
-- ============================================

-- ============================================
-- ANALYTICS_QUERIES TABLE
-- Store reusable analytics query definitions
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_queries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    metrics TEXT NOT NULL,  -- JSON array of metric names
    dimensions TEXT,  -- JSON array of dimension fields
    filters TEXT,  -- JSON array of query filters
    time_range_type TEXT DEFAULT 'relative',  -- relative, absolute
    time_range_value TEXT,  -- e.g., '1h', '24h', or JSON {start, end}
    granularity TEXT DEFAULT 'minute',  -- minute, hour, day, week, month
    aggregations TEXT,  -- JSON array of aggregation types (sum, avg, count, min, max, p50, p90, p95, p99)
    order_by TEXT,  -- JSON array of order specifications
    limit_rows INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    tags TEXT  -- JSON array of tags for organization
);

CREATE INDEX IF NOT EXISTS idx_analytics_queries_name ON analytics_queries(name);
CREATE INDEX IF NOT EXISTS idx_analytics_queries_created ON analytics_queries(created_at DESC);

-- ============================================
-- ALERTS TABLE
-- Alert rule definitions and configuration
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'warning',  -- info, warning, error, critical
    metric_name TEXT NOT NULL,
    operator TEXT NOT NULL,  -- gt, lt, gte, lte, eq, neq
    threshold REAL NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,  -- seconds the condition must be true
    evaluation_interval INTEGER NOT NULL DEFAULT 30,  -- seconds between evaluations
    labels TEXT,  -- JSON key-value pairs for filtering metrics
    channels TEXT NOT NULL,  -- JSON array of notification channels (log, webhook, slack, email)
    status TEXT DEFAULT 'active',  -- active, silenced, resolved
    silence_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    enabled BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_metric ON alerts(metric_name);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled);

-- ============================================
-- ALERT_HISTORY TABLE
-- Historical record of alert activations and resolutions
-- ============================================
CREATE TABLE IF NOT EXISTS alert_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT NOT NULL,
    alert_name TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,  -- triggered, resolved, silenced
    triggered_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    trigger_value REAL,
    threshold REAL NOT NULL,
    message TEXT,
    labels TEXT,  -- JSON snapshot of metric labels
    notification_sent BOOLEAN DEFAULT 0,
    notification_channels TEXT,  -- JSON array of channels notified
    notification_error TEXT,
    metadata TEXT,  -- JSON additional context
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history(status);
CREATE INDEX IF NOT EXISTS idx_alert_history_severity ON alert_history(severity);

-- ============================================
-- DASHBOARDS TABLE
-- Dashboard definitions and layouts
-- ============================================
CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    tags TEXT,  -- JSON array of tags
    panels TEXT NOT NULL,  -- JSON array of dashboard panels
    refresh_interval INTEGER DEFAULT 30,  -- seconds
    time_range_type TEXT DEFAULT 'relative',  -- relative, absolute
    time_range_value TEXT DEFAULT '1h',
    layout TEXT,  -- JSON grid layout configuration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    is_default BOOLEAN DEFAULT 0,
    is_public BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dashboards_name ON dashboards(name);
CREATE INDEX IF NOT EXISTS idx_dashboards_default ON dashboards(is_default);
CREATE INDEX IF NOT EXISTS idx_dashboards_created ON dashboards(created_at DESC);

-- ============================================
-- DASHBOARD_PANELS TABLE
-- Individual panel definitions for dashboards
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_panels (
    id TEXT PRIMARY KEY,
    dashboard_id TEXT NOT NULL,
    title TEXT NOT NULL,
    panel_type TEXT NOT NULL,  -- timeseries, gauge, table, stat, heatmap, pie, bar
    query TEXT NOT NULL,  -- JSON analytics query
    visualization_config TEXT,  -- JSON visualization settings
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 12,
    height INTEGER DEFAULT 8,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_panels_dashboard ON dashboard_panels(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_panels_order ON dashboard_panels(dashboard_id, sort_order);

-- ============================================
-- BI_EXPORTS TABLE
-- Business intelligence export jobs and history
-- ============================================
CREATE TABLE IF NOT EXISTS bi_exports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    export_type TEXT NOT NULL,  -- scheduled, manual
    format TEXT NOT NULL,  -- csv, json, parquet, excel
    query_id TEXT,  -- Reference to analytics_queries
    query_definition TEXT,  -- JSON query if not using query_id
    schedule_cron TEXT,  -- Cron expression for scheduled exports
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    destination_type TEXT NOT NULL,  -- file, s3, gcs, http
    destination_config TEXT NOT NULL,  -- JSON destination configuration
    status TEXT DEFAULT 'active',  -- active, paused, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY (query_id) REFERENCES analytics_queries(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bi_exports_status ON bi_exports(status);
CREATE INDEX IF NOT EXISTS idx_bi_exports_next_run ON bi_exports(next_run_at);
CREATE INDEX IF NOT EXISTS idx_bi_exports_type ON bi_exports(export_type);

-- ============================================
-- BI_EXPORT_HISTORY TABLE
-- Track individual export job executions
-- ============================================
CREATE TABLE IF NOT EXISTS bi_export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_id TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status TEXT NOT NULL,  -- running, success, failed
    rows_exported INTEGER DEFAULT 0,
    file_path TEXT,
    file_size_bytes INTEGER,
    error_message TEXT,
    execution_time_ms INTEGER,
    metadata TEXT,  -- JSON additional context
    FOREIGN KEY (export_id) REFERENCES bi_exports(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bi_export_history_export ON bi_export_history(export_id);
CREATE INDEX IF NOT EXISTS idx_bi_export_history_started ON bi_export_history(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bi_export_history_status ON bi_export_history(status);

-- ============================================
-- METRICS_CACHE TABLE
-- Pre-aggregated metric cache for performance
-- ============================================
CREATE TABLE IF NOT EXISTS metrics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,  -- Hash of query parameters
    metric_name TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    granularity TEXT NOT NULL,
    labels TEXT,  -- JSON labels used in query
    aggregation_type TEXT NOT NULL,  -- sum, avg, count, min, max, p50, p90, p95, p99
    data_points TEXT NOT NULL,  -- JSON array of {timestamp, value} pairs
    row_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_cache_key ON metrics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_metric ON metrics_cache(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires ON metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_accessed ON metrics_cache(last_accessed DESC);

-- ============================================
-- ANOMALY_DETECTIONS TABLE
-- Detected anomalies in metrics
-- ============================================
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_name TEXT NOT NULL,
    detection_method TEXT NOT NULL,  -- statistical, threshold, ml
    anomaly_type TEXT NOT NULL,  -- spike, drop, outlier, trend_change
    severity TEXT DEFAULT 'medium',  -- low, medium, high, critical
    observed_value REAL NOT NULL,
    expected_value REAL,
    deviation_score REAL,  -- Standard deviations from expected
    confidence REAL,  -- 0.0 to 1.0
    baseline_window TEXT,  -- Time window used for baseline
    labels TEXT,  -- JSON metric labels
    context TEXT,  -- JSON additional context
    acknowledged BOOLEAN DEFAULT 0,
    acknowledged_at TIMESTAMP,
    acknowledged_by TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detections_metric ON anomaly_detections(metric_name);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_detected ON anomaly_detections(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON anomaly_detections(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_ack ON anomaly_detections(acknowledged);

-- ============================================
-- PREDICTIONS TABLE
-- Forecasted metric values
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_name TEXT NOT NULL,
    prediction_method TEXT NOT NULL,  -- linear_regression, moving_average, exponential_smoothing
    forecast_horizon TEXT NOT NULL,  -- Time ahead: 1h, 24h, 7d, 30d
    historical_window TEXT NOT NULL,  -- Time window used for training
    predictions TEXT NOT NULL,  -- JSON array of {timestamp, value, confidence_lower, confidence_upper}
    model_accuracy REAL,  -- R-squared or similar metric
    labels TEXT,  -- JSON metric labels
    metadata TEXT,  -- JSON model parameters
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_metric ON predictions(metric_name);
CREATE INDEX IF NOT EXISTS idx_predictions_generated ON predictions(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON predictions(expires_at);

-- ============================================
-- VIEWS FOR OBSERVABILITY QUERIES
-- ============================================

-- Active alerts summary
CREATE VIEW IF NOT EXISTS v_active_alerts AS
SELECT
    a.id,
    a.name,
    a.severity,
    a.metric_name,
    a.threshold,
    a.status,
    ah.triggered_at,
    ah.trigger_value,
    julianday('now') - julianday(ah.triggered_at) as days_active
FROM alerts a
LEFT JOIN (
    SELECT alert_id, MAX(triggered_at) as triggered_at, trigger_value
    FROM alert_history
    WHERE status = 'triggered'
    GROUP BY alert_id
) ah ON a.id = ah.alert_id
WHERE a.enabled = 1 AND a.status IN ('active', 'triggered')
ORDER BY a.severity DESC, ah.triggered_at ASC;

-- Recent anomalies
CREATE VIEW IF NOT EXISTS v_recent_anomalies AS
SELECT
    metric_name,
    detection_method,
    anomaly_type,
    severity,
    observed_value,
    expected_value,
    deviation_score,
    confidence,
    detected_at,
    acknowledged
FROM anomaly_detections
WHERE detected_at > datetime('now', '-24 hours')
ORDER BY detected_at DESC, severity DESC;

-- Dashboard summary
CREATE VIEW IF NOT EXISTS v_dashboard_summary AS
SELECT
    d.id,
    d.name,
    d.description,
    COUNT(dp.id) as panel_count,
    d.refresh_interval,
    d.is_default,
    d.created_at,
    d.updated_at
FROM dashboards d
LEFT JOIN dashboard_panels dp ON d.id = dp.dashboard_id
GROUP BY d.id
ORDER BY d.is_default DESC, d.updated_at DESC;

-- Export performance summary
CREATE VIEW IF NOT EXISTS v_export_performance AS
SELECT
    be.id,
    be.name,
    be.format,
    COUNT(beh.id) as total_runs,
    SUM(CASE WHEN beh.status = 'success' THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN beh.status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
    AVG(beh.execution_time_ms) as avg_execution_ms,
    AVG(beh.rows_exported) as avg_rows,
    MAX(beh.started_at) as last_run_at
FROM bi_exports be
LEFT JOIN bi_export_history beh ON be.id = beh.export_id
GROUP BY be.id;

-- Metric availability (for SLA tracking)
CREATE VIEW IF NOT EXISTS v_metric_availability AS
SELECT
    metric_name,
    COUNT(*) as data_points,
    MIN(timestamp) as first_seen,
    MAX(timestamp) as last_seen,
    (julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24 * 60 as span_minutes,
    COUNT(*) * 1.0 / ((julianday(MAX(timestamp)) - julianday(MIN(timestamp))) * 24 * 60) as points_per_minute
FROM telemetry_metrics
WHERE timestamp > datetime('now', '-24 hours')
GROUP BY metric_name
ORDER BY data_points DESC;

-- Cache effectiveness
CREATE VIEW IF NOT EXISTS v_cache_effectiveness AS
SELECT
    metric_name,
    COUNT(*) as cache_entries,
    SUM(hit_count) as total_hits,
    AVG(hit_count) as avg_hits_per_entry,
    SUM(row_count) as total_cached_rows,
    SUM(CASE WHEN expires_at > datetime('now') THEN 1 ELSE 0 END) as active_entries,
    SUM(CASE WHEN expires_at <= datetime('now') THEN 1 ELSE 0 END) as expired_entries
FROM metrics_cache
GROUP BY metric_name
ORDER BY total_hits DESC;

-- Alert statistics by severity
CREATE VIEW IF NOT EXISTS v_alert_statistics AS
SELECT
    severity,
    COUNT(DISTINCT alert_id) as unique_alerts,
    COUNT(*) as total_triggers,
    AVG(CASE WHEN resolved_at IS NOT NULL
        THEN (julianday(resolved_at) - julianday(triggered_at)) * 24 * 60
        ELSE NULL END) as avg_resolution_minutes,
    SUM(CASE WHEN status = 'triggered' THEN 1 ELSE 0 END) as currently_triggered,
    SUM(CASE WHEN notification_sent = 1 THEN 1 ELSE 0 END) as notifications_sent
FROM alert_history
WHERE triggered_at > datetime('now', '-7 days')
GROUP BY severity
ORDER BY
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'error' THEN 2
        WHEN 'warning' THEN 3
        WHEN 'info' THEN 4
    END;

-- ============================================
-- CLEANUP QUERIES (Run as scheduled jobs)
-- ============================================

-- Clean expired cache entries
-- DELETE FROM metrics_cache WHERE expires_at < datetime('now');

-- Clean old anomaly detections (keep 90 days)
-- DELETE FROM anomaly_detections WHERE detected_at < datetime('now', '-90 days');

-- Clean old predictions (keep 30 days)
-- DELETE FROM predictions WHERE expires_at < datetime('now', '-30 days');

-- Clean old BI export history (keep 180 days)
-- DELETE FROM bi_export_history WHERE started_at < datetime('now', '-180 days');

-- Vacuum database after cleanup
-- VACUUM;
