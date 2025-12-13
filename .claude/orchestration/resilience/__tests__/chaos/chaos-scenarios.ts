/**
 * Chaos Engineering Test Scenarios
 * Defines comprehensive chaos experiments for resilience validation
 */

import type { FaultType, FaultConfig } from '../../types.js';

export interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  faultType: FaultType;
  target: string;
  config: FaultConfig;
  duration: number;
  expectedBehavior: {
    circuitBreakerTrips: boolean;
    degradationActivated: boolean;
    selfHealingTriggered: boolean;
    expectedRecoveryTime?: number; // milliseconds
    maxAllowedFailures?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Network Chaos Scenarios
 */
export const NetworkScenarios: ChaosScenario[] = [
  {
    id: 'network-latency-100ms',
    name: 'Minor Network Latency',
    description: 'Inject 100ms latency to test system tolerance',
    faultType: 'latency',
    target: 'agent-collaboration',
    config: {
      probability: 0.5,
      impact: 0.3,
      latencyMs: 100,
    },
    duration: 30000, // 30 seconds
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: false,
      selfHealingTriggered: false,
    },
    severity: 'low',
  },
  {
    id: 'network-latency-500ms',
    name: 'Moderate Network Latency',
    description: 'Inject 500ms latency to test degradation activation',
    faultType: 'latency',
    target: 'knowledge-federation',
    config: {
      probability: 0.7,
      impact: 0.5,
      latencyMs: 500,
    },
    duration: 60000, // 1 minute
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: true,
      selfHealingTriggered: false,
      expectedRecoveryTime: 5000,
    },
    severity: 'medium',
  },
  {
    id: 'network-latency-2000ms',
    name: 'Severe Network Latency',
    description: 'Inject 2000ms latency to test circuit breaker activation',
    faultType: 'latency',
    target: 'adaptive-intelligence',
    config: {
      probability: 0.8,
      impact: 0.8,
      latencyMs: 2000,
    },
    duration: 45000, // 45 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 10000,
      maxAllowedFailures: 5,
    },
    severity: 'high',
  },
  {
    id: 'network-partition',
    name: 'Network Partition Simulation',
    description: 'Simulate complete network partition between components',
    faultType: 'network-partition',
    target: 'distributed-system',
    config: {
      probability: 1.0,
      impact: 1.0,
    },
    duration: 20000, // 20 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 15000,
      maxAllowedFailures: 0,
    },
    severity: 'critical',
  },
];

/**
 * Service Failure Scenarios
 */
export const ServiceFailureScenarios: ChaosScenario[] = [
  {
    id: 'intermittent-errors-30',
    name: 'Intermittent Service Errors (30%)',
    description: 'Inject random errors with 30% probability',
    faultType: 'error',
    target: 'nlp-orchestration',
    config: {
      probability: 0.3,
      impact: 0.6,
      errorType: 'InternalServerError',
      errorMessage: 'Simulated service error',
    },
    duration: 60000, // 1 minute
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: false,
      selfHealingTriggered: true,
      expectedRecoveryTime: 3000,
    },
    severity: 'medium',
  },
  {
    id: 'intermittent-errors-70',
    name: 'High Error Rate (70%)',
    description: 'Inject random errors with 70% probability',
    faultType: 'error',
    target: 'observability',
    config: {
      probability: 0.7,
      impact: 0.8,
      errorType: 'ServiceUnavailable',
      errorMessage: 'High error rate simulation',
    },
    duration: 45000, // 45 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 8000,
      maxAllowedFailures: 5,
    },
    severity: 'high',
  },
  {
    id: 'complete-service-outage',
    name: 'Complete Service Outage',
    description: 'Simulate complete service unavailability',
    faultType: 'service-unavailable',
    target: 'agent-collaboration',
    config: {
      probability: 1.0,
      impact: 1.0,
    },
    duration: 30000, // 30 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 12000,
      maxAllowedFailures: 0,
    },
    severity: 'critical',
  },
];

/**
 * Resource Exhaustion Scenarios
 */
export const ResourceExhaustionScenarios: ChaosScenario[] = [
  {
    id: 'memory-pressure-60',
    name: 'Moderate Memory Pressure',
    description: 'Simulate 60% memory utilization',
    faultType: 'resource-exhaustion',
    target: 'adaptive-intelligence',
    config: {
      probability: 0.5,
      impact: 0.5,
      resourceType: 'memory',
      resourceLimit: 60,
    },
    duration: 45000, // 45 seconds
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: false,
      selfHealingTriggered: false,
    },
    severity: 'low',
  },
  {
    id: 'memory-pressure-80',
    name: 'High Memory Pressure',
    description: 'Simulate 80% memory utilization',
    faultType: 'resource-exhaustion',
    target: 'knowledge-federation',
    config: {
      probability: 0.7,
      impact: 0.7,
      resourceType: 'memory',
      resourceLimit: 80,
    },
    duration: 60000, // 1 minute
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 10000,
    },
    severity: 'high',
  },
  {
    id: 'cpu-stress-90',
    name: 'Severe CPU Stress',
    description: 'Simulate 90% CPU utilization',
    faultType: 'resource-exhaustion',
    target: 'observability',
    config: {
      probability: 0.8,
      impact: 0.9,
      resourceType: 'cpu',
      resourceLimit: 90,
    },
    duration: 30000, // 30 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 15000,
      maxAllowedFailures: 3,
    },
    severity: 'critical',
  },
  {
    id: 'disk-io-failure',
    name: 'Disk I/O Failure Simulation',
    description: 'Simulate disk I/O errors',
    faultType: 'resource-exhaustion',
    target: 'knowledge-federation',
    config: {
      probability: 0.5,
      impact: 0.8,
      resourceType: 'disk',
      resourceLimit: 95,
    },
    duration: 40000, // 40 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 12000,
      maxAllowedFailures: 5,
    },
    severity: 'high',
  },
];

/**
 * Combined Chaos Scenarios (Multiple Faults)
 */
export const CombinedScenarios: ChaosScenario[] = [
  {
    id: 'latency-plus-errors',
    name: 'Latency with Intermittent Errors',
    description: 'Combine network latency with service errors',
    faultType: 'error', // Primary fault
    target: 'distributed-system',
    config: {
      probability: 0.5,
      impact: 0.7,
      latencyMs: 800, // Also inject latency
      errorType: 'Timeout',
      errorMessage: 'Combined latency and error',
    },
    duration: 60000, // 1 minute
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 12000,
      maxAllowedFailures: 5,
    },
    severity: 'high',
  },
  {
    id: 'cascading-failures',
    name: 'Cascading Service Failures',
    description: 'Simulate cascading failures across multiple services',
    faultType: 'service-unavailable',
    target: 'multi-component',
    config: {
      probability: 0.8,
      impact: 0.9,
    },
    duration: 45000, // 45 seconds
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 20000,
      maxAllowedFailures: 3,
    },
    severity: 'critical',
  },
];

/**
 * Recovery Test Scenarios
 */
export const RecoveryScenarios: ChaosScenario[] = [
  {
    id: 'rapid-recovery-test',
    name: 'Rapid Recovery Validation',
    description: 'Short burst of errors to test quick recovery',
    faultType: 'error',
    target: 'agent-collaboration',
    config: {
      probability: 0.6,
      impact: 0.5,
      errorType: 'TemporaryFailure',
      errorMessage: 'Temporary failure for recovery test',
    },
    duration: 10000, // 10 seconds (short)
    expectedBehavior: {
      circuitBreakerTrips: false,
      degradationActivated: false,
      selfHealingTriggered: true,
      expectedRecoveryTime: 2000,
    },
    severity: 'low',
  },
  {
    id: 'extended-degradation-recovery',
    name: 'Extended Degradation Recovery',
    description: 'Long degradation period to test recovery mechanisms',
    faultType: 'latency',
    target: 'adaptive-intelligence',
    config: {
      probability: 0.7,
      impact: 0.6,
      latencyMs: 1500,
    },
    duration: 120000, // 2 minutes
    expectedBehavior: {
      circuitBreakerTrips: true,
      degradationActivated: true,
      selfHealingTriggered: true,
      expectedRecoveryTime: 30000,
      maxAllowedFailures: 10,
    },
    severity: 'medium',
  },
];

/**
 * All Scenarios Combined
 */
export const AllScenarios: ChaosScenario[] = [
  ...NetworkScenarios,
  ...ServiceFailureScenarios,
  ...ResourceExhaustionScenarios,
  ...CombinedScenarios,
  ...RecoveryScenarios,
];

/**
 * Get scenarios by severity
 */
export function getScenariosBySeverity(
  severity: 'low' | 'medium' | 'high' | 'critical'
): ChaosScenario[] {
  return AllScenarios.filter((s) => s.severity === severity);
}

/**
 * Get scenarios by fault type
 */
export function getScenariosByFaultType(faultType: FaultType): ChaosScenario[] {
  return AllScenarios.filter((s) => s.faultType === faultType);
}

/**
 * Get scenarios by target
 */
export function getScenariosByTarget(target: string): ChaosScenario[] {
  return AllScenarios.filter((s) => s.target === target);
}

/**
 * Scenario statistics
 */
export function getScenarioStatistics() {
  return {
    total: AllScenarios.length,
    byFaultType: {
      latency: getScenariosByFaultType('latency').length,
      error: getScenariosByFaultType('error').length,
      'service-unavailable': getScenariosByFaultType('service-unavailable').length,
      'resource-exhaustion': getScenariosByFaultType('resource-exhaustion').length,
      'network-partition': getScenariosByFaultType('network-partition').length,
    },
    bySeverity: {
      low: getScenariosBySeverity('low').length,
      medium: getScenariosBySeverity('medium').length,
      high: getScenariosBySeverity('high').length,
      critical: getScenariosBySeverity('critical').length,
    },
  };
}
