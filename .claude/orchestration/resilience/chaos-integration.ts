/**
 * Chaos Engineering Integration
 * Controlled fault injection for resilience testing
 */

import type {
  ChaosExperiment,
  FaultType,
  FaultConfig,
  ExperimentResults,
  ChaosConfig,
  ResilienceEvent,
  AsyncFunction,
} from './types.js';
import { CircuitBreakerManager } from './circuit-breaker.js';
import { GracefulDegradation } from './degradation.js';
import { SelfHealer } from './self-healer.js';

export class ChaosEngineering {
  private config: ChaosConfig;
  private experiments = new Map<string, ChaosExperiment>();
  private activeInjections = new Map<string, FaultInjector>();
  private circuitBreakers?: CircuitBreakerManager;
  private degradation?: GracefulDegradation;
  private selfHealer?: SelfHealer;
  private eventHandlers: Array<(event: ResilienceEvent) => void> = [];

  constructor(config: ChaosConfig) {
    this.config = {
      safeMode: true,
      allowedFaults: ['latency', 'error', 'service-unavailable'],
      maxConcurrentExperiments: 3,
      defaultDuration: 60000, // 1 minute
      requireApproval: true,
      ...config,
    };
  }

  /**
   * Set resilience components for observation
   */
  setComponents(
    circuitBreakers: CircuitBreakerManager,
    degradation: GracefulDegradation,
    selfHealer: SelfHealer
  ): void {
    this.circuitBreakers = circuitBreakers;
    this.degradation = degradation;
    this.selfHealer = selfHealer;
  }

  /**
   * Create and run a chaos experiment
   */
  async runExperiment(
    name: string,
    faultType: FaultType,
    target: string,
    config: Partial<FaultConfig>,
    duration?: number
  ): Promise<ChaosExperiment> {
    // Validate experiment
    this.validateExperiment(faultType);

    // Check concurrent limit
    const activeCount = Array.from(this.experiments.values()).filter(
      (e) => e.status === 'running'
    ).length;

    if (activeCount >= this.config.maxConcurrentExperiments) {
      throw new Error('Maximum concurrent experiments reached');
    }

    // Create experiment
    const experimentId = `chaos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const experiment: ChaosExperiment = {
      id: experimentId,
      name,
      description: `Chaos experiment: ${faultType} on ${target}`,
      faultType,
      target,
      config: this.buildFaultConfig(faultType, config),
      duration: duration || this.config.defaultDuration,
      status: 'pending',
    };

    this.experiments.set(experimentId, experiment);

    // Emit start event
    this.emitEvent({
      type: 'chaos-experiment-started',
      timestamp: new Date(),
      component: target,
      data: experiment,
    });

    // Run experiment
    await this.executeExperiment(experiment);

    return experiment;
  }

  /**
   * Execute a chaos experiment
   */
  private async executeExperiment(experiment: ChaosExperiment): Promise<void> {
    experiment.status = 'running';
    experiment.startedAt = new Date();

    // Create fault injector
    const injector = new FaultInjector(
      experiment.faultType,
      experiment.config,
      experiment.target
    );

    this.activeInjections.set(experiment.id, injector);

    // Capture baseline metrics
    const baselineMetrics = this.captureMetrics();

    try {
      // Inject fault and observe
      injector.start();

      // Run for specified duration
      await new Promise((resolve) => setTimeout(resolve, experiment.duration));

      // Stop fault injection
      injector.stop();

      // Capture results
      const finalMetrics = this.captureMetrics();
      experiment.results = this.analyzeResults(
        experiment,
        baselineMetrics,
        finalMetrics
      );

      experiment.status = 'completed';
    } catch (error) {
      experiment.status = 'failed';
      console.error('Chaos experiment failed:', error);
    } finally {
      experiment.stoppedAt = new Date();
      this.activeInjections.delete(experiment.id);

      // Emit completion event
      this.emitEvent({
        type: 'chaos-experiment-completed',
        timestamp: new Date(),
        component: experiment.target,
        data: experiment,
      });
    }
  }

  /**
   * Build complete fault configuration
   */
  private buildFaultConfig(
    faultType: FaultType,
    config: Partial<FaultConfig>
  ): FaultConfig {
    const defaults: Record<FaultType, FaultConfig> = {
      latency: {
        probability: 0.5,
        impact: 0.5,
        latencyMs: 1000,
      },
      error: {
        probability: 0.3,
        impact: 0.7,
        errorType: 'ServiceUnavailable',
        errorMessage: 'Chaos-injected error',
      },
      'resource-exhaustion': {
        probability: 0.2,
        impact: 0.8,
        resourceType: 'memory',
        resourceLimit: 80,
      },
      'network-partition': {
        probability: 0.1,
        impact: 1.0,
      },
      'service-unavailable': {
        probability: 0.5,
        impact: 0.9,
      },
      'data-corruption': {
        probability: 0.1,
        impact: 1.0,
      },
    };

    return { ...defaults[faultType], ...config };
  }

  /**
   * Validate experiment against safety rules
   */
  private validateExperiment(faultType: FaultType): void {
    if (!this.config.enabled) {
      throw new Error('Chaos engineering is disabled');
    }

    if (this.config.safeMode) {
      const destructiveFaults: FaultType[] = [
        'data-corruption',
        'resource-exhaustion',
      ];

      if (destructiveFaults.includes(faultType)) {
        throw new Error(
          `Fault type ${faultType} is not allowed in safe mode`
        );
      }
    }

    if (!this.config.allowedFaults.includes(faultType)) {
      throw new Error(`Fault type ${faultType} is not in allowed list`);
    }
  }

  /**
   * Capture current system metrics
   */
  private captureMetrics(): SystemMetrics {
    const circuitBreakerMetrics = this.circuitBreakers?.getAllMetrics() || [];
    const degradationState = this.degradation?.getCurrentState();
    const healingStats = this.selfHealer?.getStatistics();

    return {
      timestamp: new Date(),
      circuitBreakers: {
        total: circuitBreakerMetrics.length,
        open: circuitBreakerMetrics.filter((m) => m.state === 'open').length,
        halfOpen: circuitBreakerMetrics.filter((m) => m.state === 'half-open')
          .length,
        avgSuccessRate:
          circuitBreakerMetrics.reduce((sum, m) => sum + m.successRate, 0) /
            circuitBreakerMetrics.length || 1,
      },
      degradation: {
        level: degradationState?.level || 'full',
        disabledFeatures: degradationState?.disabledFeatures.length || 0,
      },
      healing: {
        totalRecoveries: healingStats?.totalRecoveries || 0,
        successRate: healingStats?.successRate || 1,
        activeRecoveries: healingStats?.activeRecoveries || 0,
      },
    };
  }

  /**
   * Analyze experiment results
   */
  private analyzeResults(
    experiment: ChaosExperiment,
    baseline: SystemMetrics,
    final: SystemMetrics
  ): ExperimentResults {
    const totalRequests = 100; // Simulated
    const faultInjections = Math.floor(
      totalRequests * (experiment.config.probability || 0.5)
    );

    // Calculate recovery metrics
    const recoveryAttempts = final.healing.totalRecoveries - baseline.healing.totalRecoveries;
    const successfulRecoveries = Math.floor(
      recoveryAttempts * final.healing.successRate
    );

    // Calculate circuit breaker behavior
    const circuitBreakerTrips =
      final.circuitBreakers.open - baseline.circuitBreakers.open;

    // Check if degradation was activated
    const degradationActivated =
      final.degradation.level !== 'full' &&
      final.degradation.level !== baseline.degradation.level;

    // Generate observations
    const observations: string[] = [];

    if (circuitBreakerTrips > 0) {
      observations.push(
        `${circuitBreakerTrips} circuit breaker(s) opened during experiment`
      );
    }

    if (degradationActivated) {
      observations.push(
        `System degraded to ${final.degradation.level} level`
      );
    }

    if (successfulRecoveries > 0) {
      observations.push(
        `${successfulRecoveries} successful recoveries out of ${recoveryAttempts} attempts`
      );
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      experiment,
      circuitBreakerTrips,
      degradationActivated,
      successfulRecoveries,
      recoveryAttempts
    );

    return {
      totalRequests,
      faultInjections,
      successfulRecoveries,
      failedRecoveries: recoveryAttempts - successfulRecoveries,
      avgRecoveryTime: 2500, // Simulated
      maxRecoveryTime: 5000, // Simulated
      systemBehavior: {
        circuitBreakerTrips,
        degradationActivated,
        escalationsTriggered: 0, // Would track from self-healer
      },
      observations,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    experiment: ChaosExperiment,
    circuitBreakerTrips: number,
    degradationActivated: boolean,
    successfulRecoveries: number,
    totalRecoveries: number
  ): string[] {
    const recommendations: string[] = [];

    // Recovery success rate
    const recoveryRate = totalRecoveries > 0 ? successfulRecoveries / totalRecoveries : 1;
    if (recoveryRate < 0.8) {
      recommendations.push(
        'Consider improving recovery strategies - success rate below 80%'
      );
    }

    // Circuit breaker sensitivity
    if (circuitBreakerTrips > 5) {
      recommendations.push(
        'Circuit breakers may be too sensitive - consider adjusting thresholds'
      );
    } else if (circuitBreakerTrips === 0 && experiment.faultType === 'error') {
      recommendations.push(
        'Circuit breakers did not trip - may need lower failure thresholds'
      );
    }

    // Degradation responsiveness
    if (!degradationActivated && experiment.config.impact! > 0.7) {
      recommendations.push(
        'High-impact faults did not trigger degradation - review degradation rules'
      );
    }

    return recommendations;
  }

  /**
   * Cancel a running experiment
   */
  cancelExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (experiment.status !== 'running') {
      throw new Error(`Experiment is not running: ${experimentId}`);
    }

    const injector = this.activeInjections.get(experimentId);
    if (injector) {
      injector.stop();
      this.activeInjections.delete(experimentId);
    }

    experiment.status = 'cancelled';
    experiment.stoppedAt = new Date();
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): ChaosExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values()).filter(
      (e) => e.status === 'running'
    );
  }

  /**
   * Subscribe to events
   */
  onEvent(handler: (event: ResilienceEvent) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index > -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit event
   */
  private emitEvent(event: ResilienceEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in chaos engineering event handler:', error);
      }
    });
  }

  /**
   * Get configuration
   */
  getConfig(): ChaosConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChaosConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Fault Injector
 * Injects specific types of faults for testing
 */
class FaultInjector {
  private active = false;
  private readonly faultType: FaultType;
  private readonly config: FaultConfig;
  private readonly target: string;

  constructor(faultType: FaultType, config: FaultConfig, target: string) {
    this.faultType = faultType;
    this.config = config;
    this.target = target;
  }

  /**
   * Start injecting faults
   */
  start(): void {
    this.active = true;
  }

  /**
   * Stop injecting faults
   */
  stop(): void {
    this.active = false;
  }

  /**
   * Check if fault should be injected
   */
  shouldInject(): boolean {
    if (!this.active) {
      return false;
    }

    return Math.random() < (this.config.probability || 0.5);
  }

  /**
   * Inject fault into a function
   */
  async inject<T>(fn: AsyncFunction<T>): Promise<T> {
    if (!this.shouldInject()) {
      return await fn();
    }

    switch (this.faultType) {
      case 'latency':
        return await this.injectLatency(fn);

      case 'error':
        return await this.injectError(fn);

      case 'service-unavailable':
        throw new Error('Service unavailable (chaos-injected)');

      default:
        return await fn();
    }
  }

  /**
   * Inject latency
   */
  private async injectLatency<T>(fn: AsyncFunction<T>): Promise<T> {
    const delay = this.config.latencyMs || 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return await fn();
  }

  /**
   * Inject error
   */
  private async injectError<T>(fn: AsyncFunction<T>): Promise<T> {
    const shouldFail = Math.random() < (this.config.impact || 0.7);

    if (shouldFail) {
      const errorMessage = this.config.errorMessage || 'Chaos-injected error';
      throw new Error(errorMessage);
    }

    return await fn();
  }

  /**
   * Check if active
   */
  isActive(): boolean {
    return this.active;
  }
}

/**
 * System metrics interface
 */
interface SystemMetrics {
  timestamp: Date;
  circuitBreakers: {
    total: number;
    open: number;
    halfOpen: number;
    avgSuccessRate: number;
  };
  degradation: {
    level: string;
    disabledFeatures: number;
  };
  healing: {
    totalRecoveries: number;
    successRate: number;
    activeRecoveries: number;
  };
}

/**
 * Predefined chaos experiments
 */
export const ChaosExperiments = {
  /**
   * Latency spike experiment
   */
  latencySpike: (target: string, latencyMs: number = 2000, duration: number = 60000) => ({
    name: 'Latency Spike',
    faultType: 'latency' as FaultType,
    target,
    config: {
      probability: 0.7,
      impact: 0.6,
      latencyMs,
    },
    duration,
  }),

  /**
   * Service outage experiment
   */
  serviceOutage: (target: string, duration: number = 30000) => ({
    name: 'Service Outage',
    faultType: 'service-unavailable' as FaultType,
    target,
    config: {
      probability: 1.0,
      impact: 1.0,
    },
    duration,
  }),

  /**
   * Intermittent errors experiment
   */
  intermittentErrors: (target: string, errorRate: number = 0.3, duration: number = 60000) => ({
    name: 'Intermittent Errors',
    faultType: 'error' as FaultType,
    target,
    config: {
      probability: errorRate,
      impact: 0.8,
      errorType: 'InternalServerError',
      errorMessage: 'Random error (chaos test)',
    },
    duration,
  }),
};
