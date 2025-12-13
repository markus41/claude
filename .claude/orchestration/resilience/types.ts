/**
 * Self-Healing and Resilience System - Type Definitions
 * Production-ready types for circuit breakers, health monitoring, and recovery
 */

// ============================================
// CIRCUIT BREAKER TYPES
// ============================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;      // Failures before opening
  successThreshold: number;      // Successes before closing from half-open
  timeout: number;               // Open state timeout (ms)
  monitorWindow: number;         // Time window for tracking (ms)
  halfOpenRequests: number;      // Max requests in half-open state
  resetTimeoutOnSuccess?: boolean;
  allowedExceptions?: string[];  // Exception types that don't trigger circuit
}

export interface CircuitBreakerState {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  lastStateChange: Date;
  nextAttemptTime?: Date;
  halfOpenAttempts: number;
  totalFailures: number;
  totalSuccesses: number;
  totalRequests: number;
}

export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  successRate: number;
  failureRate: number;
  totalRequests: number;
  requestsInWindow: number;
  avgResponseTime: number;
  lastFailure?: {
    time: Date;
    error: string;
  };
  stateHistory: StateTransition[];
}

export interface StateTransition {
  from: CircuitState;
  to: CircuitState;
  timestamp: Date;
  reason: string;
  metrics?: {
    failures: number;
    successes: number;
  };
}

// ============================================
// RECOVERY STRATEGY TYPES
// ============================================

export type RecoveryType = 'retry' | 'fallback' | 'restore' | 'escalate';
export type BackoffStrategy = 'exponential' | 'linear' | 'constant' | 'jittered';

export interface RecoveryStrategy {
  name: string;
  type: RecoveryType;
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  timeout?: number;
  retryableErrors?: string[];
  onExhausted?: 'escalate' | 'fail' | 'fallback';
  metadata?: Record<string, unknown>;
}

export interface RetryStrategy extends RecoveryStrategy {
  type: 'retry';
  jitterFactor?: number;          // Random jitter (0-1)
  respectCircuitBreaker?: boolean;
}

export interface FallbackStrategy extends RecoveryStrategy {
  type: 'fallback';
  fallbackChain: FallbackProvider[];
  cascadeOnFailure: boolean;
}

export interface RestoreStrategy extends RecoveryStrategy {
  type: 'restore';
  checkpointId?: string;
  restorePoint?: Date;
  validateAfterRestore: boolean;
}

export interface EscalationStrategy extends RecoveryStrategy {
  type: 'escalate';
  escalationLevel: 'warning' | 'critical' | 'emergency';
  notificationChannels: string[];
  requiresManualIntervention: boolean;
}

export interface FallbackProvider {
  name: string;
  priority: number;
  execute: () => Promise<unknown>;
  canHandle?: (error: Error) => boolean;
  timeout?: number;
}

// ============================================
// RECOVERY EXECUTION TYPES
// ============================================

export interface RecoveryAttempt {
  id: string;
  strategyName: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  success: boolean;
  error?: string;
  durationMs?: number;
  nextAttemptAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface RecoveryResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: Error;
  strategy: string;
  attempts: RecoveryAttempt[];
  totalDurationMs: number;
  finalState: 'recovered' | 'failed' | 'escalated';
}

// ============================================
// SELF-HEALING TYPES
// ============================================

export type FailureCategory =
  | 'network'
  | 'database'
  | 'service'
  | 'resource'
  | 'dependency'
  | 'timeout'
  | 'unknown';

export interface FailureDetection {
  id: string;
  category: FailureCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  error: Error;
  detectedAt: Date;
  context?: Record<string, unknown>;
  affectedResources?: string[];
}

export interface HealingAction {
  id: string;
  failureId: string;
  action: RecoveryType;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: RecoveryResult;
}

export interface SelfHealerConfig {
  enabled: boolean;
  autoRecover: boolean;
  maxConcurrentRecoveries: number;
  recoveryTimeout: number;
  defaultStrategy: RecoveryStrategy;
  strategyMap: Record<FailureCategory, RecoveryStrategy>;
  escalationThreshold: number;
  healthCheckInterval: number;
}

// ============================================
// GRACEFUL DEGRADATION TYPES
// ============================================

export type DegradationLevel = 'full' | 'reduced' | 'minimal' | 'emergency';

export interface DegradationState {
  level: DegradationLevel;
  disabledFeatures: string[];
  reducedCapabilities: Map<string, CapabilityReduction>;
  reason: string;
  since: Date;
  triggeredBy?: 'manual' | 'automatic' | 'health-check';
  expectedDuration?: number;
  metadata?: Record<string, unknown>;
}

export interface CapabilityReduction {
  capability: string;
  originalLevel: number;
  reducedLevel: number;
  impact: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  degradationLevels: DegradationLevel[];
  priority: number;
  dependencies?: string[];
}

export interface DegradationRule {
  condition: HealthCondition;
  targetLevel: DegradationLevel;
  affectedFeatures: string[];
  gracePeriodMs?: number;
  autoRecover?: boolean;
}

// ============================================
// HEALTH MONITORING TYPES
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface HealthCheck {
  name: string;
  component: string;
  status: HealthStatus;
  lastChecked: Date;
  responseTime: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ComponentHealth {
  component: string;
  status: HealthStatus;
  checks: HealthCheck[];
  uptime: number;
  lastIncident?: Date;
  incidentCount: number;
  availability: number;        // Percentage
  metrics?: ComponentMetrics;
}

export interface ComponentMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
}

export interface SystemHealth {
  overall: HealthStatus;
  components: Map<string, ComponentHealth>;
  degradationLevel: DegradationLevel;
  activeIncidents: number;
  timestamp: Date;
  score: number;               // 0-100
}

export interface HealthCondition {
  type: 'threshold' | 'trend' | 'composite';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  duration?: number;           // Must be true for this duration (ms)
}

export interface HealthThreshold {
  metric: string;
  warning: number;
  critical: number;
  fatal: number;
}

// ============================================
// CHAOS ENGINEERING TYPES
// ============================================

export type FaultType =
  | 'latency'
  | 'error'
  | 'resource-exhaustion'
  | 'network-partition'
  | 'service-unavailable'
  | 'data-corruption';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  faultType: FaultType;
  target: string;
  config: FaultConfig;
  duration: number;
  startedAt?: Date;
  stoppedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  results?: ExperimentResults;
}

export interface FaultConfig {
  probability?: number;         // 0-1, chance of fault occurring
  impact?: number;              // 0-1, severity of fault
  latencyMs?: number;
  errorType?: string;
  errorMessage?: string;
  resourceType?: 'cpu' | 'memory' | 'disk' | 'network';
  resourceLimit?: number;
  affectedEndpoints?: string[];
  affectedMethods?: string[];
}

export interface ExperimentResults {
  totalRequests: number;
  faultInjections: number;
  successfulRecoveries: number;
  failedRecoveries: number;
  avgRecoveryTime: number;
  maxRecoveryTime: number;
  systemBehavior: {
    circuitBreakerTrips: number;
    degradationActivated: boolean;
    escalationsTriggered: number;
  };
  observations: string[];
  recommendations?: string[];
}

export interface ChaosConfig {
  enabled: boolean;
  safeMode: boolean;            // Prevents destructive experiments
  allowedFaults: FaultType[];
  maxConcurrentExperiments: number;
  defaultDuration: number;
  requireApproval: boolean;
  notificationChannels?: string[];
}

// ============================================
// PERSISTENCE TYPES
// ============================================

export interface CircuitBreakerRow {
  id: number;
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  consecutive_failures: number;
  consecutive_successes: number;
  last_failure_time: string | null;
  last_success_time: string | null;
  last_state_change: string;
  next_attempt_time: string | null;
  half_open_attempts: number;
  total_failures: number;
  total_successes: number;
  total_requests: number;
  config: string;              // JSON
  created_at: string;
  updated_at: string;
}

export interface HealthCheckRow {
  id: number;
  component: string;
  check_name: string;
  status: HealthStatus;
  response_time: number;
  error: string | null;
  details: string | null;      // JSON
  checked_at: string;
}

export interface RecoveryEventRow {
  id: number;
  event_type: 'detection' | 'recovery' | 'escalation';
  failure_category: FailureCategory;
  severity: string;
  component: string;
  strategy_name: string | null;
  attempt_number: number;
  success: number;             // SQLite boolean
  error: string | null;
  duration_ms: number | null;
  context: string | null;      // JSON
  occurred_at: string;
}

export interface DegradationStateRow {
  id: number;
  level: DegradationLevel;
  disabled_features: string;   // JSON array
  reduced_capabilities: string; // JSON
  reason: string;
  triggered_by: string;
  since: string;
  recovered_at: string | null;
  expected_duration: number | null;
  metadata: string | null;     // JSON
}

export interface ChaosExperimentRow {
  id: number;
  experiment_id: string;
  name: string;
  description: string;
  fault_type: FaultType;
  target: string;
  config: string;              // JSON
  duration: number;
  status: string;
  started_at: string | null;
  stopped_at: string | null;
  results: string | null;      // JSON
  created_at: string;
}

// ============================================
// EVENT TYPES
// ============================================

export interface ResilienceEvent {
  type: ResilienceEventType;
  timestamp: Date;
  component: string;
  data: unknown;
}

export type ResilienceEventType =
  | 'circuit-opened'
  | 'circuit-closed'
  | 'circuit-half-open'
  | 'recovery-started'
  | 'recovery-succeeded'
  | 'recovery-failed'
  | 'escalation-triggered'
  | 'degradation-activated'
  | 'degradation-recovered'
  | 'health-degraded'
  | 'health-recovered'
  | 'chaos-experiment-started'
  | 'chaos-experiment-completed';

export interface EventHandler {
  eventType: ResilienceEventType;
  handler: (event: ResilienceEvent) => void | Promise<void>;
  priority?: number;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface ResilienceConfig {
  circuitBreakers: Record<string, CircuitBreakerConfig>;
  selfHealer: SelfHealerConfig;
  healthMonitor: HealthMonitorConfig;
  degradation: DegradationConfig;
  chaos?: ChaosConfig;
  persistence: PersistenceConfig;
}

export interface HealthMonitorConfig {
  enabled: boolean;
  checkInterval: number;
  components: string[];
  thresholds: Record<string, HealthThreshold>;
  alertOnDegradation: boolean;
  retentionDays: number;
}

export interface DegradationConfig {
  enabled: boolean;
  autoDegrade: boolean;
  rules: DegradationRule[];
  features: FeatureFlag[];
  recoveryCheckInterval: number;
}

export interface PersistenceConfig {
  databasePath: string;
  retentionDays: number;
  batchSize: number;
  flushInterval: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export interface TimeWindow {
  start: Date;
  end: Date;
  durationMs: number;
}

export interface RateLimiter {
  maxRequests: number;
  windowMs: number;
  currentCount: number;
  windowStart: Date;
}

export type AsyncFunction<T = unknown> = () => Promise<T>;

export interface PromiseTimeout<T> {
  promise: Promise<T>;
  timeout: number;
  timeoutError?: Error;
}

// ============================================
// ERROR TYPES
// ============================================

export class ResilienceError extends Error {
  constructor(
    message: string,
    public code: string,
    public component?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ResilienceError';
  }
}

export class CircuitBreakerError extends ResilienceError {
  constructor(circuitName: string, state: CircuitState) {
    super(
      `Circuit breaker '${circuitName}' is ${state}`,
      'CIRCUIT_BREAKER_OPEN',
      circuitName,
      { state }
    );
    this.name = 'CircuitBreakerError';
  }
}

export class RecoveryFailedError extends ResilienceError {
  constructor(strategy: string, attempts: number, lastError?: string) {
    super(
      `Recovery failed after ${attempts} attempts using strategy '${strategy}'`,
      'RECOVERY_FAILED',
      strategy,
      { attempts, lastError }
    );
    this.name = 'RecoveryFailedError';
  }
}

export class HealthCheckFailedError extends ResilienceError {
  constructor(component: string, checkName: string, error: string) {
    super(
      `Health check '${checkName}' failed for component '${component}': ${error}`,
      'HEALTH_CHECK_FAILED',
      component,
      { checkName, error }
    );
    this.name = 'HealthCheckFailedError';
  }
}

export class DegradationError extends ResilienceError {
  constructor(level: DegradationLevel, reason: string) {
    super(
      `System degraded to level '${level}': ${reason}`,
      'SYSTEM_DEGRADED',
      'system',
      { level, reason }
    );
    this.name = 'DegradationError';
  }
}
