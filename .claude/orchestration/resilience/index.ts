/**
 * Self-Healing and Resilience System - Main Export
 * Production-ready resilience framework for Claude orchestration
 */

// Type exports
export type * from './types.js';

// Circuit Breaker exports
export { CircuitBreaker, CircuitBreakerManager } from './circuit-breaker.js';

// Health Monitor exports
export { HealthMonitor, HealthChecks } from './health-monitor.js';

// Recovery Strategy exports
export {
  RetryRecovery,
  FallbackRecovery,
  RestoreRecovery,
  EscalationRecovery,
  RecoveryStrategyFactory,
} from './recovery-strategies.js';

// Self Healer exports
export { SelfHealer } from './self-healer.js';

// Degradation exports
export { GracefulDegradation } from './degradation.js';

// Chaos Engineering exports
export { ChaosEngineering, ChaosExperiments } from './chaos-integration.js';

// Re-export specific types for convenience
export type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitState,
  RecoveryStrategy,
  HealthCheck,
  SystemHealth,
  DegradationLevel,
  DegradationState,
  ChaosExperiment,
  ResilienceConfig,
} from './types.js';
