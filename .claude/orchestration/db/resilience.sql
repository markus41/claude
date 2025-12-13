-- ============================================================================
-- Self-Healing and Resilience System - Database Schema
-- Production-ready schema for circuit breakers, health monitoring, and recovery
-- ============================================================================

-- Version: 1.0.0
-- Created: 2025-12-12
-- Purpose: Track resilience metrics, failures, and recovery for Claude orchestration
-- Database: SQLite 3

-- ============================================================================
-- Circuit Breaker State Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS circuit_breakers (
  -- Primary key
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Circuit identification
  name TEXT NOT NULL UNIQUE,

  -- Current state
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half-open')),

  -- Failure/success counters
  failures INTEGER NOT NULL DEFAULT 0,
  successes INTEGER NOT NULL DEFAULT 0,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  consecutive_successes INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  last_failure_time TEXT,
  last_success_time TEXT,
  last_state_change TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  next_attempt_time TEXT,

  -- Half-open state tracking
  half_open_attempts INTEGER NOT NULL DEFAULT 0,

  -- Lifetime counters
  total_failures INTEGER NOT NULL DEFAULT 0,
  total_successes INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,

  -- Configuration (JSON)
  config TEXT NOT NULL,

  -- Audit fields
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_circuit_breakers_name ON circuit_breakers(name);
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_state ON circuit_breakers(state);
CREATE INDEX IF NOT EXISTS idx_circuit_breakers_updated_at ON circuit_breakers(updated_at DESC);

-- ============================================================================
-- Circuit Breaker State History
-- ============================================================================

CREATE TABLE IF NOT EXISTS circuit_breaker_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Circuit identification
  circuit_breaker_id INTEGER NOT NULL,
  circuit_name TEXT NOT NULL,

  -- State transition
  from_state TEXT NOT NULL CHECK (from_state IN ('closed', 'open', 'half-open')),
  to_state TEXT NOT NULL CHECK (to_state IN ('closed', 'open', 'half-open')),

  -- Transition details
  reason TEXT NOT NULL,
  failures_at_transition INTEGER,
  successes_at_transition INTEGER,

  -- Timestamp
  transitioned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (circuit_breaker_id) REFERENCES circuit_breakers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cb_history_circuit ON circuit_breaker_state_history(circuit_breaker_id);
CREATE INDEX IF NOT EXISTS idx_cb_history_time ON circuit_breaker_state_history(transitioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_cb_history_state ON circuit_breaker_state_history(to_state);

-- ============================================================================
-- Health Check Results
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Component identification
  component TEXT NOT NULL,
  check_name TEXT NOT NULL,

  -- Health status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),

  -- Performance metrics
  response_time INTEGER NOT NULL,  -- milliseconds

  -- Error details
  error TEXT,
  details TEXT,  -- JSON

  -- Timestamp
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_checks_component ON health_checks(component);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_composite ON health_checks(component, check_name, checked_at DESC);

-- ============================================================================
-- Component Health Summary (Aggregated View)
-- ============================================================================

CREATE TABLE IF NOT EXISTS component_health_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Component identification
  component TEXT NOT NULL UNIQUE,

  -- Current status
  current_status TEXT NOT NULL CHECK (current_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),

  -- Metrics (last hour)
  total_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  availability_percent REAL NOT NULL DEFAULT 100.0,

  -- Incident tracking
  last_incident_at TEXT,
  incident_count_24h INTEGER NOT NULL DEFAULT 0,

  -- Uptime
  uptime_seconds INTEGER NOT NULL DEFAULT 0,
  last_healthy_at TEXT,

  -- Timestamps
  last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_component_health_component ON component_health_summary(component);
CREATE INDEX IF NOT EXISTS idx_component_health_status ON component_health_summary(current_status);

-- ============================================================================
-- Recovery Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN ('detection', 'recovery', 'escalation')),

  -- Failure details
  failure_category TEXT NOT NULL CHECK (failure_category IN (
    'network', 'database', 'service', 'resource', 'dependency', 'timeout', 'unknown'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  component TEXT NOT NULL,

  -- Recovery details
  strategy_name TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),  -- Boolean

  -- Error information
  error TEXT,

  -- Performance
  duration_ms INTEGER,

  -- Context (JSON)
  context TEXT,

  -- Timestamp
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_events_type ON recovery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_recovery_events_category ON recovery_events(failure_category);
CREATE INDEX IF NOT EXISTS idx_recovery_events_component ON recovery_events(component);
CREATE INDEX IF NOT EXISTS idx_recovery_events_time ON recovery_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_events_success ON recovery_events(success);

-- ============================================================================
-- Degradation State
-- ============================================================================

CREATE TABLE IF NOT EXISTS degradation_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Degradation level
  level TEXT NOT NULL CHECK (level IN ('full', 'reduced', 'minimal', 'emergency')),

  -- Feature management
  disabled_features TEXT NOT NULL,      -- JSON array
  reduced_capabilities TEXT NOT NULL,   -- JSON object

  -- Reason and trigger
  reason TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'automatic', 'health-check')),

  -- Timing
  since TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  recovered_at TEXT,
  expected_duration INTEGER,  -- milliseconds

  -- Metadata (JSON)
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_degradation_level ON degradation_state(level);
CREATE INDEX IF NOT EXISTS idx_degradation_active ON degradation_state(since) WHERE recovered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_degradation_time ON degradation_state(since DESC);

-- ============================================================================
-- Feature Flags
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Feature identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Status
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),  -- Boolean

  -- Degradation config
  degradation_levels TEXT NOT NULL,  -- JSON array of levels where this is disabled
  priority INTEGER NOT NULL DEFAULT 50,
  dependencies TEXT,                 -- JSON array of feature names

  -- Audit
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_priority ON feature_flags(priority DESC);

-- ============================================================================
-- Chaos Experiments
-- ============================================================================

CREATE TABLE IF NOT EXISTS chaos_experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Experiment identification
  experiment_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,

  -- Fault configuration
  fault_type TEXT NOT NULL CHECK (fault_type IN (
    'latency', 'error', 'resource-exhaustion', 'network-partition', 'service-unavailable', 'data-corruption'
  )),
  target TEXT NOT NULL,
  config TEXT NOT NULL,  -- JSON

  -- Execution
  duration INTEGER NOT NULL,  -- milliseconds
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Timestamps
  started_at TEXT,
  stopped_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Results (JSON)
  results TEXT
);

CREATE INDEX IF NOT EXISTS idx_chaos_experiments_id ON chaos_experiments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_chaos_experiments_status ON chaos_experiments(status);
CREATE INDEX IF NOT EXISTS idx_chaos_experiments_type ON chaos_experiments(fault_type);
CREATE INDEX IF NOT EXISTS idx_chaos_experiments_created ON chaos_experiments(created_at DESC);

-- ============================================================================
-- Chaos Experiment Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS chaos_experiment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Experiment reference
  experiment_id TEXT NOT NULL,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'started', 'fault-injected', 'recovered', 'completed', 'failed', 'cancelled'
  )),

  -- Event data
  message TEXT,
  data TEXT,  -- JSON

  -- Timestamp
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (experiment_id) REFERENCES chaos_experiments(experiment_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chaos_events_experiment ON chaos_experiment_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_chaos_events_type ON chaos_experiment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_chaos_events_time ON chaos_experiment_events(occurred_at DESC);

-- ============================================================================
-- System Health Snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Overall status
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  degradation_level TEXT NOT NULL CHECK (degradation_level IN ('full', 'reduced', 'minimal', 'emergency')),

  -- Metrics
  health_score INTEGER NOT NULL,  -- 0-100
  active_incidents INTEGER NOT NULL DEFAULT 0,
  open_circuit_breakers INTEGER NOT NULL DEFAULT 0,

  -- Component summary (JSON)
  component_statuses TEXT NOT NULL,

  -- Timestamp
  snapshot_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_time ON system_health_snapshots(snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_status ON system_health_snapshots(overall_status);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_score ON system_health_snapshots(health_score);

-- ============================================================================
-- Useful Views
-- ============================================================================

-- View: Active Circuit Breakers (open or half-open)
CREATE VIEW IF NOT EXISTS active_circuit_breakers AS
SELECT
  name,
  state,
  failures,
  consecutive_failures,
  last_failure_time,
  last_state_change,
  next_attempt_time
FROM circuit_breakers
WHERE state IN ('open', 'half-open')
ORDER BY last_state_change DESC;

-- View: Recent Health Check Failures
CREATE VIEW IF NOT EXISTS recent_health_failures AS
SELECT
  component,
  check_name,
  status,
  error,
  response_time,
  checked_at
FROM health_checks
WHERE status IN ('degraded', 'unhealthy')
  AND checked_at > datetime('now', '-1 hour')
ORDER BY checked_at DESC;

-- View: Recovery Success Rate (last 24 hours)
CREATE VIEW IF NOT EXISTS recovery_success_rate AS
SELECT
  failure_category,
  strategy_name,
  COUNT(*) as total_attempts,
  SUM(success) as successful_recoveries,
  ROUND(100.0 * SUM(success) / COUNT(*), 2) as success_rate_percent,
  AVG(duration_ms) as avg_duration_ms
FROM recovery_events
WHERE event_type = 'recovery'
  AND occurred_at > datetime('now', '-24 hours')
GROUP BY failure_category, strategy_name
ORDER BY success_rate_percent DESC;

-- View: Current System Status
CREATE VIEW IF NOT EXISTS current_system_status AS
SELECT
  (SELECT COUNT(*) FROM circuit_breakers WHERE state = 'open') as open_circuits,
  (SELECT COUNT(*) FROM circuit_breakers WHERE state = 'half-open') as half_open_circuits,
  (SELECT COUNT(*) FROM component_health_summary WHERE current_status = 'unhealthy') as unhealthy_components,
  (SELECT COUNT(*) FROM component_health_summary WHERE current_status = 'degraded') as degraded_components,
  (SELECT level FROM degradation_state WHERE recovered_at IS NULL ORDER BY since DESC LIMIT 1) as current_degradation,
  (SELECT COUNT(*) FROM chaos_experiments WHERE status = 'running') as running_experiments;

-- View: Component Availability (last 24 hours)
CREATE VIEW IF NOT EXISTS component_availability_24h AS
SELECT
  component,
  COUNT(*) as total_checks,
  SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) as healthy_checks,
  ROUND(100.0 * SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) / COUNT(*), 2) as availability_percent,
  AVG(response_time) as avg_response_time,
  MAX(response_time) as max_response_time
FROM health_checks
WHERE checked_at > datetime('now', '-24 hours')
GROUP BY component
ORDER BY availability_percent ASC;

-- View: Active Degradation
CREATE VIEW IF NOT EXISTS active_degradation AS
SELECT
  level,
  disabled_features,
  reduced_capabilities,
  reason,
  triggered_by,
  since,
  CAST((julianday('now') - julianday(since)) * 24 * 60 * 60 * 1000 AS INTEGER) as duration_ms
FROM degradation_state
WHERE recovered_at IS NULL
ORDER BY since DESC
LIMIT 1;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger: Update circuit breaker updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_circuit_breaker_timestamp
AFTER UPDATE ON circuit_breakers
BEGIN
  UPDATE circuit_breakers
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Trigger: Log circuit breaker state transitions
CREATE TRIGGER IF NOT EXISTS log_circuit_state_transition
AFTER UPDATE OF state ON circuit_breakers
WHEN OLD.state != NEW.state
BEGIN
  INSERT INTO circuit_breaker_state_history (
    circuit_breaker_id,
    circuit_name,
    from_state,
    to_state,
    reason,
    failures_at_transition,
    successes_at_transition
  ) VALUES (
    NEW.id,
    NEW.name,
    OLD.state,
    NEW.state,
    CASE
      WHEN NEW.state = 'open' THEN 'Failure threshold exceeded'
      WHEN NEW.state = 'half-open' THEN 'Timeout expired, testing recovery'
      WHEN NEW.state = 'closed' THEN 'Success threshold met'
      ELSE 'Manual override'
    END,
    NEW.failures,
    NEW.successes
  );
END;

-- Trigger: Update feature flag timestamp
CREATE TRIGGER IF NOT EXISTS update_feature_flag_timestamp
AFTER UPDATE ON feature_flags
BEGIN
  UPDATE feature_flags
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Trigger: Cleanup old health checks (keep last 7 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_health_checks
AFTER INSERT ON health_checks
BEGIN
  DELETE FROM health_checks
  WHERE checked_at < datetime('now', '-7 days');
END;

-- Trigger: Cleanup old recovery events (keep last 30 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_recovery_events
AFTER INSERT ON recovery_events
BEGIN
  DELETE FROM recovery_events
  WHERE occurred_at < datetime('now', '-30 days');
END;

-- ============================================================================
-- Initialization
-- ============================================================================

-- Insert default feature flags
INSERT OR IGNORE INTO feature_flags (name, description, degradation_levels, priority) VALUES
  ('agent-execution', 'Core agent execution capability', '[]', 100),
  ('parallel-processing', 'Parallel task execution', '["emergency"]', 80),
  ('advanced-routing', 'Advanced model routing', '["minimal", "emergency"]', 60),
  ('telemetry', 'Telemetry and metrics collection', '["reduced", "minimal", "emergency"]', 40),
  ('chaos-engineering', 'Chaos engineering experiments', '["reduced", "minimal", "emergency"]', 20);

-- ============================================================================
-- Maintenance Queries (commented, use as needed)
-- ============================================================================

-- Clean up completed degradation states older than 30 days
-- DELETE FROM degradation_state
-- WHERE recovered_at IS NOT NULL
--   AND recovered_at < datetime('now', '-30 days');

-- Archive completed chaos experiments
-- DELETE FROM chaos_experiments
-- WHERE status IN ('completed', 'failed', 'cancelled')
--   AND stopped_at < datetime('now', '-90 days');

-- Reset circuit breaker (use with caution)
-- UPDATE circuit_breakers
-- SET state = 'closed',
--     failures = 0,
--     successes = 0,
--     consecutive_failures = 0,
--     consecutive_successes = 0,
--     half_open_attempts = 0,
--     last_state_change = CURRENT_TIMESTAMP
-- WHERE name = 'circuit-name';

-- Vacuum and analyze
-- VACUUM;
-- ANALYZE;

-- ============================================================================
-- Schema Information
-- ============================================================================

-- Tables: 11
--   - circuit_breakers (state tracking)
--   - circuit_breaker_state_history (transitions)
--   - health_checks (check results)
--   - component_health_summary (aggregated health)
--   - recovery_events (failure and recovery tracking)
--   - degradation_state (system degradation)
--   - feature_flags (feature management)
--   - chaos_experiments (experiments)
--   - chaos_experiment_events (experiment timeline)
--   - system_health_snapshots (point-in-time status)
--
-- Views: 6
--   - active_circuit_breakers
--   - recent_health_failures
--   - recovery_success_rate
--   - current_system_status
--   - component_availability_24h
--   - active_degradation
--
-- Triggers: 5
--   - Circuit breaker timestamp updates
--   - State transition logging
--   - Feature flag timestamps
--   - Automatic cleanup (health checks, recovery events)
