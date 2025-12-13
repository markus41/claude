-- Natural Language Processing Database Schema
-- Stores conversation sessions, intents, entities, and workflow mappings

-- ============================================================================
-- Conversation Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'waiting', 'completed', 'abandoned')),

    -- Context data (JSON)
    context_json TEXT NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_updated ON conversation_sessions(updated_at);

-- ============================================================================
-- Conversation Turns Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_turns (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,

    -- User input
    user_input TEXT NOT NULL,

    -- Intent detection
    intent_name TEXT NOT NULL,
    intent_confidence REAL NOT NULL CHECK (intent_confidence >= 0 AND intent_confidence <= 100),

    -- Entities (JSON array)
    entities_json TEXT NOT NULL DEFAULT '[]',

    -- System response
    system_response TEXT NOT NULL,

    -- Actions executed (JSON array)
    actions_json TEXT,

    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_turns_session ON conversation_turns(session_id);
CREATE INDEX IF NOT EXISTS idx_turns_intent ON conversation_turns(intent_name);
CREATE INDEX IF NOT EXISTS idx_turns_created ON conversation_turns(created_at);

-- ============================================================================
-- Intent Patterns Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS intent_patterns (
    id TEXT PRIMARY KEY,
    intent_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('command', 'query', 'configuration', 'status', 'conversation')),

    -- Pattern definition
    pattern TEXT NOT NULL,

    -- Keywords (JSON arrays)
    required_keywords TEXT NOT NULL DEFAULT '[]',
    optional_keywords TEXT NOT NULL DEFAULT '[]',
    negative_keywords TEXT NOT NULL DEFAULT '[]',

    -- Scoring
    base_confidence REAL NOT NULL CHECK (base_confidence >= 0 AND base_confidence <= 100),
    priority INTEGER NOT NULL DEFAULT 5,

    -- Examples (JSON array)
    examples TEXT NOT NULL DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_patterns_intent ON intent_patterns(intent_name);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON intent_patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_enabled ON intent_patterns(enabled);
CREATE INDEX IF NOT EXISTS idx_patterns_priority ON intent_patterns(priority DESC);

-- ============================================================================
-- Workflow Mappings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_mappings (
    id TEXT PRIMARY KEY,
    intent_name TEXT NOT NULL UNIQUE,
    workflow_name TEXT NOT NULL,

    -- Entity requirements (JSON arrays)
    required_entities TEXT NOT NULL DEFAULT '[]',
    optional_entities TEXT NOT NULL DEFAULT '[]',

    -- Parameter mapping (JSON object)
    parameter_mapping TEXT NOT NULL DEFAULT '{}',

    -- Configuration
    confirmation_required BOOLEAN NOT NULL DEFAULT TRUE,
    defaults_json TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_mappings_intent ON workflow_mappings(intent_name);
CREATE INDEX IF NOT EXISTS idx_mappings_workflow ON workflow_mappings(workflow_name);
CREATE INDEX IF NOT EXISTS idx_mappings_enabled ON workflow_mappings(enabled);

-- ============================================================================
-- Entity Definitions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_definitions (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL UNIQUE,

    -- Patterns (JSON array of regex patterns)
    patterns TEXT NOT NULL DEFAULT '[]',

    -- Known values (JSON array, optional)
    known_values TEXT,

    -- Normalization and validation
    normalizer TEXT,
    validator TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entity_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_enabled ON entity_definitions(enabled);

-- ============================================================================
-- Intent Recognition Statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS intent_stats (
    id TEXT PRIMARY KEY,
    intent_name TEXT NOT NULL,

    -- Usage counts
    total_recognitions INTEGER NOT NULL DEFAULT 0,
    successful_executions INTEGER NOT NULL DEFAULT 0,
    failed_executions INTEGER NOT NULL DEFAULT 0,

    -- Confidence metrics
    avg_confidence REAL,
    min_confidence REAL,
    max_confidence REAL,

    -- Timing
    avg_processing_time_ms INTEGER,

    -- Metadata
    last_used TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intent_stats_name ON intent_stats(intent_name);

-- ============================================================================
-- Entity Extraction Statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS entity_stats (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,

    -- Usage counts
    total_extractions INTEGER NOT NULL DEFAULT 0,
    successful_extractions INTEGER NOT NULL DEFAULT 0,

    -- Confidence metrics
    avg_confidence REAL,

    -- Metadata
    last_used TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_stats_type ON entity_stats(entity_type);

-- ============================================================================
-- Workflow Generation Statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_stats (
    id TEXT PRIMARY KEY,
    workflow_name TEXT NOT NULL,
    intent_name TEXT NOT NULL,

    -- Usage counts
    total_generations INTEGER NOT NULL DEFAULT 0,
    successful_generations INTEGER NOT NULL DEFAULT 0,
    clarifications_needed INTEGER NOT NULL DEFAULT 0,

    -- Confidence metrics
    avg_confidence REAL,

    -- Missing parameters tracking
    common_missing_params TEXT, -- JSON array

    -- Metadata
    last_used TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_stats_name ON workflow_stats(workflow_name, intent_name);
CREATE INDEX IF NOT EXISTS idx_workflow_stats_workflow ON workflow_stats(workflow_name);

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Session summary view
CREATE VIEW IF NOT EXISTS v_session_summary AS
SELECT
    status,
    COUNT(*) as count,
    AVG(CAST((JulianDay(updated_at) - JulianDay(created_at)) * 24 * 60 AS REAL)) as avg_duration_minutes
FROM conversation_sessions
GROUP BY status;

-- Intent usage view
CREATE VIEW IF NOT EXISTS v_intent_usage AS
SELECT
    intent_name,
    COUNT(*) as usage_count,
    AVG(intent_confidence) as avg_confidence,
    MAX(created_at) as last_used
FROM conversation_turns
GROUP BY intent_name
ORDER BY usage_count DESC;

-- Most common entities view
CREATE VIEW IF NOT EXISTS v_entity_usage AS
SELECT
    json_extract(value, '$.type') as entity_type,
    COUNT(*) as usage_count,
    AVG(CAST(json_extract(value, '$.confidence') AS REAL)) as avg_confidence
FROM conversation_turns, json_each(entities_json)
GROUP BY entity_type
ORDER BY usage_count DESC;

-- Session activity by hour
CREATE VIEW IF NOT EXISTS v_session_activity AS
SELECT
    CAST(strftime('%H', created_at) AS INTEGER) as hour,
    COUNT(*) as session_count
FROM conversation_sessions
GROUP BY hour
ORDER BY hour;

-- ============================================================================
-- Triggers for Automatic Statistics Updates
-- ============================================================================

-- Update intent stats on turn insert
CREATE TRIGGER IF NOT EXISTS trg_update_intent_stats
AFTER INSERT ON conversation_turns
BEGIN
    INSERT INTO intent_stats (id, intent_name, total_recognitions, avg_confidence, last_used)
    VALUES (
        NEW.intent_name || '-stats',
        NEW.intent_name,
        1,
        NEW.intent_confidence,
        NEW.created_at
    )
    ON CONFLICT(intent_name) DO UPDATE SET
        total_recognitions = total_recognitions + 1,
        avg_confidence = (avg_confidence * total_recognitions + NEW.intent_confidence) / (total_recognitions + 1),
        min_confidence = MIN(min_confidence, NEW.intent_confidence),
        max_confidence = MAX(max_confidence, NEW.intent_confidence),
        last_used = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP;
END;

-- Update entity stats on turn insert
CREATE TRIGGER IF NOT EXISTS trg_update_entity_stats
AFTER INSERT ON conversation_turns
BEGIN
    -- This would need to be implemented in application code
    -- as SQLite doesn't have good JSON array iteration in triggers
    SELECT 'entity_stats_updated';
END;

-- Update session timestamp on turn insert
CREATE TRIGGER IF NOT EXISTS trg_update_session_timestamp
AFTER INSERT ON conversation_turns
BEGIN
    UPDATE conversation_sessions
    SET updated_at = NEW.created_at
    WHERE id = NEW.session_id;
END;

-- ============================================================================
-- Full-Text Search for Conversation History
-- ============================================================================

CREATE VIRTUAL TABLE IF NOT EXISTS conversation_fts USING fts5(
    session_id,
    user_input,
    system_response,
    content=conversation_turns,
    content_rowid=rowid
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS trg_fts_insert
AFTER INSERT ON conversation_turns
BEGIN
    INSERT INTO conversation_fts(rowid, session_id, user_input, system_response)
    VALUES (NEW.rowid, NEW.session_id, NEW.user_input, NEW.system_response);
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_delete
AFTER DELETE ON conversation_turns
BEGIN
    DELETE FROM conversation_fts WHERE rowid = OLD.rowid;
END;

CREATE TRIGGER IF NOT EXISTS trg_fts_update
AFTER UPDATE ON conversation_turns
BEGIN
    DELETE FROM conversation_fts WHERE rowid = OLD.rowid;
    INSERT INTO conversation_fts(rowid, session_id, user_input, system_response)
    VALUES (NEW.rowid, NEW.session_id, NEW.user_input, NEW.system_response);
END;

-- ============================================================================
-- Cleanup Functions (for maintenance)
-- ============================================================================

-- Delete old completed sessions (older than 90 days)
-- DELETE FROM conversation_sessions
-- WHERE status IN ('completed', 'abandoned')
--   AND updated_at < DATE('now', '-90 days');

-- Delete old stats (older than 180 days)
-- DELETE FROM intent_stats WHERE updated_at < DATE('now', '-180 days');
-- DELETE FROM entity_stats WHERE updated_at < DATE('now', '-180 days');
-- DELETE FROM workflow_stats WHERE updated_at < DATE('now', '-180 days');

-- Vacuum database to reclaim space
-- VACUUM;

-- Optimize FTS index
-- INSERT INTO conversation_fts(conversation_fts) VALUES('optimize');

-- ============================================================================
-- Initial Data Seeding
-- ============================================================================

-- Note: Default patterns, mappings, and entity definitions should be
-- inserted via the application code using the DEFAULT_* exports from
-- their respective TypeScript modules.
