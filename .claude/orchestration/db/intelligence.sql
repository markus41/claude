-- Adaptive Intelligence Engine Database Schema
-- Supports ML-based routing, pattern recognition, and continuous learning
-- Designed to drive data-driven decision-making across the orchestration system

-- ============================================================================
-- ML Models Table
-- Stores trained model parameters and metadata for routing decisions
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_models (
    id TEXT PRIMARY KEY,
    model_type TEXT NOT NULL CHECK (model_type IN (
        'multi_armed_bandit',
        'duration_predictor',
        'cost_predictor',
        'success_predictor',
        'quality_predictor'
    )),
    model_name TEXT NOT NULL,

    -- Model parameters (JSON-encoded)
    parameters TEXT NOT NULL, -- JSON: weights, hyperparameters, etc.

    -- Performance metrics
    accuracy REAL,
    precision_score REAL,
    recall_score REAL,
    f1_score REAL,
    mean_absolute_error REAL,
    mean_squared_error REAL,

    -- Training metadata
    training_samples INTEGER NOT NULL DEFAULT 0,
    last_training_at TIMESTAMP,
    training_duration_ms INTEGER,

    -- Version control
    version INTEGER NOT NULL DEFAULT 1,
    parent_model_id TEXT REFERENCES ml_models(id),

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'testing', 'archived')),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_version ON ml_models(model_type, version DESC);

-- ============================================================================
-- Feature Vectors Table
-- Stores extracted features from tasks for ML processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_vectors (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    routing_id TEXT REFERENCES routing_decisions(id),

    -- Text features
    text_length INTEGER NOT NULL,
    text_complexity REAL NOT NULL, -- Flesch-Kincaid grade level
    keyword_count INTEGER NOT NULL,
    keywords TEXT, -- JSON array of extracted keywords
    sentiment_score REAL, -- -1.0 (negative) to 1.0 (positive)

    -- Historical features
    similar_task_success_rate REAL,
    similar_task_avg_duration REAL,
    similar_task_avg_tokens REAL,
    similar_task_avg_cost REAL,
    previous_attempts INTEGER DEFAULT 0,

    -- Context features
    current_agent_load REAL, -- 0.0 to 1.0
    time_of_day INTEGER, -- 0-23
    day_of_week INTEGER, -- 0-6 (Sunday = 0)
    recent_error_rate REAL, -- Last 10 tasks
    context_utilization REAL, -- 0.0 to 1.0
    queue_depth INTEGER,

    -- Task characteristics
    requires_extended_thinking BOOLEAN,
    requires_vision BOOLEAN,
    requires_tools BOOLEAN,
    estimated_complexity REAL, -- 0.0 to 1.0

    -- Feature vector (normalized)
    vector TEXT NOT NULL, -- JSON array of normalized feature values
    vector_version INTEGER NOT NULL DEFAULT 1,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_features_task ON feature_vectors(task_id);
CREATE INDEX IF NOT EXISTS idx_features_routing ON feature_vectors(routing_id);
CREATE INDEX IF NOT EXISTS idx_features_created ON feature_vectors(created_at);

-- ============================================================================
-- Detected Patterns Table
-- Tracks identified patterns in task execution (success, failure, performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS detected_patterns (
    id TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'success',
        'failure',
        'performance',
        'behavioral',
        'cost',
        'latency'
    )),
    pattern_name TEXT NOT NULL,

    -- Pattern signature
    signature TEXT NOT NULL, -- JSON: defining characteristics
    signature_hash TEXT NOT NULL,

    -- Pattern statistics
    frequency INTEGER NOT NULL DEFAULT 1,
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    statistical_significance REAL, -- p-value

    -- Pattern details
    task_types TEXT, -- JSON array of associated task types
    models TEXT, -- JSON array of associated models
    conditions TEXT, -- JSON: conditions under which pattern occurs

    -- Impact metrics
    avg_quality_impact REAL,
    avg_cost_impact REAL,
    avg_latency_impact REAL,
    success_rate_impact REAL,

    -- Recommendations
    recommendations TEXT, -- JSON array of suggested actions
    severity TEXT CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),

    -- Pattern lifecycle
    first_detected_at TIMESTAMP NOT NULL,
    last_detected_at TIMESTAMP NOT NULL,
    detection_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring', 'archived')),

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patterns_type ON detected_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_signature ON detected_patterns(signature_hash);
CREATE INDEX IF NOT EXISTS idx_patterns_status ON detected_patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_severity ON detected_patterns(severity);

-- ============================================================================
-- Anomalies Table
-- Records detected anomalies in system behavior for monitoring and alerting
-- ============================================================================

CREATE TABLE IF NOT EXISTS anomalies (
    id TEXT PRIMARY KEY,
    anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
        'performance',
        'error_rate',
        'resource',
        'behavioral',
        'cost',
        'quality'
    )),

    -- Anomaly details
    metric_name TEXT NOT NULL,
    expected_value REAL NOT NULL,
    actual_value REAL NOT NULL,
    deviation REAL NOT NULL, -- Standard deviations from mean

    -- Severity classification
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Context
    task_id TEXT,
    routing_id TEXT REFERENCES routing_decisions(id),
    model TEXT,
    task_type TEXT,

    -- Detection method
    detection_method TEXT NOT NULL, -- 'z_score', 'iqr', 'moving_average', 'seasonal'
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

    -- Additional metrics
    baseline_mean REAL,
    baseline_std REAL,
    window_size INTEGER, -- For moving average

    -- Resolution
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,

    -- Metadata
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_resolved ON anomalies(resolved);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected ON anomalies(detected_at);
CREATE INDEX IF NOT EXISTS idx_anomalies_model ON anomalies(model);

-- ============================================================================
-- Learning Events Table
-- Tracks online learning events and model updates for continuous improvement
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'model_update',
        'parameter_adjustment',
        'reward_signal',
        'exploration',
        'exploitation',
        'bandit_update'
    )),

    -- Model reference
    model_id TEXT NOT NULL REFERENCES ml_models(id),
    model_type TEXT NOT NULL,

    -- Learning details
    outcome_id TEXT REFERENCES routing_outcomes(id),
    reward_value REAL,
    loss_value REAL,

    -- Parameter changes
    parameters_before TEXT, -- JSON
    parameters_after TEXT, -- JSON
    learning_rate REAL,

    -- Performance impact
    accuracy_before REAL,
    accuracy_after REAL,
    performance_delta REAL,

    -- Context
    task_id TEXT,
    task_type TEXT,
    model_used TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_learning_model ON learning_events(model_id);
CREATE INDEX IF NOT EXISTS idx_learning_type ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_learning_created ON learning_events(created_at);

-- ============================================================================
-- Predictions Table
-- Stores model predictions for validation and performance tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'duration',
        'cost',
        'success_probability',
        'quality_score',
        'token_usage',
        'routing_decision'
    )),

    -- Model reference
    model_id TEXT NOT NULL REFERENCES ml_models(id),
    model_version INTEGER NOT NULL,

    -- Prediction details
    task_id TEXT NOT NULL,
    routing_id TEXT REFERENCES routing_decisions(id),
    feature_vector_id TEXT REFERENCES feature_vectors(id),

    -- Predicted values
    predicted_value REAL NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    prediction_interval_lower REAL,
    prediction_interval_upper REAL,

    -- Actual values (filled in after execution)
    actual_value REAL,
    prediction_error REAL,
    absolute_error REAL,
    squared_error REAL,

    -- Additional predictions
    predicted_model TEXT,
    actual_model TEXT,

    -- Metadata
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_predictions_task ON predictions(task_id);
CREATE INDEX IF NOT EXISTS idx_predictions_routing ON predictions(routing_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

-- ============================================================================
-- Bandit Arms Table
-- Tracks multi-armed bandit arm statistics for model selection
-- ============================================================================

CREATE TABLE IF NOT EXISTS bandit_arms (
    id TEXT PRIMARY KEY,
    arm_name TEXT NOT NULL, -- Model name (opus, sonnet, haiku, etc.)
    context_signature TEXT NOT NULL, -- JSON hash of context features

    -- UCB1 statistics
    total_pulls INTEGER NOT NULL DEFAULT 0,
    total_reward REAL NOT NULL DEFAULT 0,
    avg_reward REAL NOT NULL DEFAULT 0,

    -- Thompson Sampling (Beta distribution parameters)
    alpha REAL NOT NULL DEFAULT 1, -- Success count + 1
    beta REAL NOT NULL DEFAULT 1,  -- Failure count + 1

    -- Epsilon-Greedy
    exploration_count INTEGER NOT NULL DEFAULT 0,
    exploitation_count INTEGER NOT NULL DEFAULT 0,

    -- Performance tracking
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    success_rate REAL GENERATED ALWAYS AS (
        CASE WHEN total_pulls > 0
        THEN CAST(success_count AS REAL) / total_pulls
        ELSE 0 END
    ) STORED,

    -- Quality metrics
    avg_quality REAL,
    avg_cost REAL,
    avg_latency REAL,

    -- Metadata
    last_pulled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bandit_arms_unique
    ON bandit_arms(arm_name, context_signature);
CREATE INDEX IF NOT EXISTS idx_bandit_arms_name ON bandit_arms(arm_name);
CREATE INDEX IF NOT EXISTS idx_bandit_arms_context ON bandit_arms(context_signature);

-- ============================================================================
-- Model Comparison Table
-- A/B testing results and model comparison metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_comparisons (
    id TEXT PRIMARY KEY,
    experiment_name TEXT NOT NULL,

    -- Models being compared
    model_a TEXT NOT NULL,
    model_b TEXT NOT NULL,

    -- Task criteria
    task_type TEXT,
    complexity TEXT,

    -- Results
    model_a_requests INTEGER NOT NULL DEFAULT 0,
    model_b_requests INTEGER NOT NULL DEFAULT 0,

    model_a_success_rate REAL,
    model_b_success_rate REAL,

    model_a_avg_quality REAL,
    model_b_avg_quality REAL,

    model_a_avg_cost REAL,
    model_b_avg_cost REAL,

    model_a_avg_latency REAL,
    model_b_avg_latency REAL,

    -- Statistical significance
    p_value REAL,
    statistically_significant BOOLEAN,
    confidence_level REAL DEFAULT 0.95,

    -- Winner determination
    winner TEXT,
    winning_metric TEXT,

    -- Experiment lifecycle
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparisons_experiment ON model_comparisons(experiment_name);
CREATE INDEX IF NOT EXISTS idx_comparisons_status ON model_comparisons(status);
CREATE INDEX IF NOT EXISTS idx_comparisons_models ON model_comparisons(model_a, model_b);

-- ============================================================================
-- Views for Analytics and Reporting
-- ============================================================================

-- Model performance comparison view
CREATE VIEW IF NOT EXISTS v_model_intelligence_summary AS
SELECT
    ba.arm_name as model,
    ba.total_pulls as requests,
    ROUND(ba.success_rate * 100, 2) as success_rate_pct,
    ROUND(ba.avg_reward, 4) as avg_reward,
    ROUND(ba.avg_quality, 2) as avg_quality,
    ROUND(ba.avg_cost, 6) as avg_cost,
    ba.avg_latency,
    ba.exploration_count,
    ba.exploitation_count,
    ba.last_pulled_at
FROM bandit_arms ba
ORDER BY ba.total_pulls DESC;

-- Active patterns summary
CREATE VIEW IF NOT EXISTS v_active_patterns AS
SELECT
    pattern_type,
    pattern_name,
    confidence,
    frequency,
    severity,
    detection_count,
    first_detected_at,
    last_detected_at
FROM detected_patterns
WHERE status = 'active'
ORDER BY severity DESC, confidence DESC, frequency DESC;

-- Recent anomalies view
CREATE VIEW IF NOT EXISTS v_recent_anomalies AS
SELECT
    anomaly_type,
    metric_name,
    severity,
    expected_value,
    actual_value,
    deviation,
    model,
    task_type,
    resolved,
    detected_at
FROM anomalies
WHERE detected_at > datetime('now', '-7 days')
ORDER BY detected_at DESC, severity DESC;

-- Prediction accuracy view
CREATE VIEW IF NOT EXISTS v_prediction_accuracy AS
SELECT
    p.prediction_type,
    m.model_name,
    COUNT(*) as total_predictions,
    AVG(ABS(p.prediction_error)) as mean_absolute_error,
    AVG(p.squared_error) as mean_squared_error,
    AVG(p.confidence) as avg_confidence,
    SUM(CASE WHEN p.actual_value BETWEEN p.prediction_interval_lower AND p.prediction_interval_upper THEN 1 ELSE 0 END) as within_interval_count,
    ROUND(CAST(SUM(CASE WHEN p.actual_value BETWEEN p.prediction_interval_lower AND p.prediction_interval_upper THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 2) as interval_accuracy_pct
FROM predictions p
JOIN ml_models m ON p.model_id = m.id
WHERE p.actual_value IS NOT NULL
GROUP BY p.prediction_type, m.model_name
ORDER BY prediction_type, mean_absolute_error ASC;

-- Learning effectiveness view
CREATE VIEW IF NOT EXISTS v_learning_effectiveness AS
SELECT
    m.model_type,
    m.model_name,
    COUNT(le.id) as learning_events,
    AVG(le.performance_delta) as avg_performance_improvement,
    SUM(CASE WHEN le.performance_delta > 0 THEN 1 ELSE 0 END) as positive_updates,
    MAX(m.accuracy) as current_accuracy,
    m.training_samples,
    m.last_training_at
FROM ml_models m
LEFT JOIN learning_events le ON m.id = le.model_id
WHERE m.status = 'active'
GROUP BY m.id, m.model_type, m.model_name
ORDER BY m.model_type, current_accuracy DESC;

-- ============================================================================
-- Triggers for Automatic Updates
-- ============================================================================

-- Update bandit arm on routing outcome
CREATE TRIGGER IF NOT EXISTS trg_update_bandit_on_outcome
AFTER INSERT ON routing_outcomes
BEGIN
    INSERT INTO bandit_arms (
        id,
        arm_name,
        context_signature,
        total_pulls,
        total_reward,
        avg_reward,
        success_count,
        failure_count,
        alpha,
        beta,
        avg_quality,
        avg_cost,
        avg_latency,
        last_pulled_at,
        updated_at
    )
    SELECT
        NEW.id || '-bandit',
        rd.model_selected,
        'default', -- Will be updated with actual context signature
        1,
        CASE WHEN NEW.success THEN NEW.quality_score / 100.0 ELSE 0 END,
        CASE WHEN NEW.success THEN NEW.quality_score / 100.0 ELSE 0 END,
        CASE WHEN NEW.success THEN 1 ELSE 0 END,
        CASE WHEN NEW.success THEN 0 ELSE 1 END,
        CASE WHEN NEW.success THEN 2 ELSE 1 END,
        CASE WHEN NEW.success THEN 1 ELSE 2 END,
        NEW.quality_score,
        NEW.actual_cost,
        NEW.actual_latency,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM routing_decisions rd
    WHERE rd.id = NEW.routing_id
    ON CONFLICT(arm_name, context_signature) DO UPDATE SET
        total_pulls = total_pulls + 1,
        total_reward = total_reward + (CASE WHEN NEW.success THEN NEW.quality_score / 100.0 ELSE 0 END),
        avg_reward = (total_reward + (CASE WHEN NEW.success THEN NEW.quality_score / 100.0 ELSE 0 END)) / (total_pulls + 1),
        success_count = success_count + (CASE WHEN NEW.success THEN 1 ELSE 0 END),
        failure_count = failure_count + (CASE WHEN NEW.success THEN 0 ELSE 1 END),
        alpha = alpha + (CASE WHEN NEW.success THEN 1 ELSE 0 END),
        beta = beta + (CASE WHEN NEW.success THEN 0 ELSE 1 END),
        avg_quality = (COALESCE(avg_quality, 0) * total_pulls + NEW.quality_score) / (total_pulls + 1),
        avg_cost = (COALESCE(avg_cost, 0) * total_pulls + NEW.actual_cost) / (total_pulls + 1),
        avg_latency = (COALESCE(avg_latency, 0) * total_pulls + NEW.actual_latency) / (total_pulls + 1),
        last_pulled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
END;

-- Update prediction with actual value
CREATE TRIGGER IF NOT EXISTS trg_update_prediction_on_outcome
AFTER INSERT ON routing_outcomes
BEGIN
    UPDATE predictions
    SET
        actual_value = CASE
            WHEN prediction_type = 'duration' THEN NEW.actual_latency
            WHEN prediction_type = 'cost' THEN NEW.actual_cost
            WHEN prediction_type = 'quality_score' THEN NEW.quality_score
            WHEN prediction_type = 'success_probability' THEN CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END
            ELSE NULL
        END,
        prediction_error = CASE
            WHEN prediction_type = 'duration' THEN (predicted_value - NEW.actual_latency)
            WHEN prediction_type = 'cost' THEN (predicted_value - NEW.actual_cost)
            WHEN prediction_type = 'quality_score' THEN (predicted_value - NEW.quality_score)
            WHEN prediction_type = 'success_probability' THEN (predicted_value - CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END)
            ELSE NULL
        END,
        absolute_error = ABS(CASE
            WHEN prediction_type = 'duration' THEN (predicted_value - NEW.actual_latency)
            WHEN prediction_type = 'cost' THEN (predicted_value - NEW.actual_cost)
            WHEN prediction_type = 'quality_score' THEN (predicted_value - NEW.quality_score)
            WHEN prediction_type = 'success_probability' THEN (predicted_value - CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END)
            ELSE NULL
        END),
        squared_error = CASE
            WHEN prediction_type = 'duration' THEN (predicted_value - NEW.actual_latency) * (predicted_value - NEW.actual_latency)
            WHEN prediction_type = 'cost' THEN (predicted_value - NEW.actual_cost) * (predicted_value - NEW.actual_cost)
            WHEN prediction_type = 'quality_score' THEN (predicted_value - NEW.quality_score) * (predicted_value - NEW.quality_score)
            WHEN prediction_type = 'success_probability' THEN (predicted_value - CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END) * (predicted_value - CASE WHEN NEW.success THEN 1.0 ELSE 0.0 END)
            ELSE NULL
        END,
        actual_at = CURRENT_TIMESTAMP
    WHERE routing_id = NEW.routing_id;
END;

-- ============================================================================
-- Initial Data and Configuration
-- ============================================================================

-- Initialize default multi-armed bandit model
INSERT OR IGNORE INTO ml_models (
    id,
    model_type,
    model_name,
    parameters,
    status,
    notes
) VALUES (
    'default-bandit-ucb1',
    'multi_armed_bandit',
    'UCB1 Model Router',
    '{"algorithm": "ucb1", "exploration_constant": 1.414, "initial_pulls": 10}',
    'active',
    'Default multi-armed bandit for intelligent model routing using Upper Confidence Bound algorithm'
);

-- Initialize default duration predictor
INSERT OR IGNORE INTO ml_models (
    id,
    model_type,
    model_name,
    parameters,
    status,
    notes
) VALUES (
    'default-duration-predictor',
    'duration_predictor',
    'Linear Duration Predictor',
    '{"method": "linear_regression", "features": ["text_length", "complexity", "similar_task_avg_duration"]}',
    'active',
    'Predicts task execution duration based on historical patterns'
);

-- Initialize default cost predictor
INSERT OR IGNORE INTO ml_models (
    id,
    model_type,
    model_name,
    parameters,
    status,
    notes
) VALUES (
    'default-cost-predictor',
    'cost_predictor',
    'Token-Based Cost Predictor',
    '{"method": "token_estimation", "features": ["text_length", "estimated_output_length"]}',
    'active',
    'Predicts task cost based on token usage estimation'
);
