/**
 * Bridge state — minimal SQLite schema for tracking sync status.
 *
 * NOT load-bearing — full reconcile must be able to rebuild from Linear + Harness/Planner alone.
 */

export interface BridgeState {
  /** Map: Linear issue ID → Harness PR coordinates. */
  harnessIssuePrs: Map<string, { repo: string; prNumber: number }>;
  /** Map: Linear issue ID → Planner task ID. */
  plannerIssueTasks: Map<string, string>;
  /** Per-plan delta token (Microsoft Graph). */
  plannerDeltaTokens: Map<string, string>;
  /** Idempotency: seen webhook delivery IDs (Linear + Harness + Graph). */
  seenDeliveries: Set<string>;
  /** Mappings configured by user (bucket → team/state, repo → team). */
  mappings: {
    plannerBucketToLinear: Map<string, { team: string; state: string }>;
    harnessRepoToLinearTeam: Map<string, string>;
  };
}

export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS harness_issue_prs (
  issue_id TEXT PRIMARY KEY,
  repo TEXT NOT NULL,
  pr_number INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS planner_issue_tasks (
  issue_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  etag TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS planner_delta_tokens (
  plan_id TEXT PRIMARY KEY,
  delta_link TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS seen_deliveries (
  delivery_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,        -- 'linear' | 'harness' | 'graph'
  received_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_seen_deliveries_received_at ON seen_deliveries(received_at);

CREATE TABLE IF NOT EXISTS mappings (
  scope TEXT NOT NULL,
  src TEXT NOT NULL,
  dst_json TEXT NOT NULL,
  PRIMARY KEY (scope, src)
);

CREATE TABLE IF NOT EXISTS dlq (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  delivery_id TEXT,
  payload TEXT NOT NULL,
  error TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  last_attempt_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON dlq(created_at);
`;
