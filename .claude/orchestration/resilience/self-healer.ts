/**
 * Self-Healing System
 * Automatic detection and recovery from failures
 */

import type {
  FailureDetection,
  FailureCategory,
  HealingAction,
  RecoveryStrategy,
  SelfHealerConfig,
  RecoveryResult,
  ResilienceEvent,
  AsyncFunction,
} from './types.js';
import {
  RetryRecovery,
  FallbackRecovery,
  RestoreRecovery,
  EscalationRecovery,
  RecoveryStrategyFactory,
} from './recovery-strategies.js';
import { CircuitBreakerManager } from './circuit-breaker.js';
import { HealthMonitor } from './health-monitor.js';

export class SelfHealer {
  private config: SelfHealerConfig;
  private failures = new Map<string, FailureDetection>();
  private healingActions = new Map<string, HealingAction>();
  private strategies = new Map<string, RecoveryStrategy>();
  private activeRecoveries = new Map<string, Promise<RecoveryResult>>();
  private circuitBreakers?: CircuitBreakerManager;
  private healthMonitor?: HealthMonitor;
  private eventHandlers: Array<(event: ResilienceEvent) => void> = [];

  constructor(config: SelfHealerConfig) {
    this.config = config;
    this.initializeStrategies();
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeStrategies(): void {
    // Set up strategies from config
    Object.entries(this.config.strategyMap).forEach(([category, strategy]) => {
      this.strategies.set(category, strategy);
    });

    // Add default strategy if not present
    if (!this.strategies.has('default')) {
      this.strategies.set('default', this.config.defaultStrategy);
    }
  }

  /**
   * Set circuit breaker manager
   */
  setCircuitBreakers(manager: CircuitBreakerManager): void {
    this.circuitBreakers = manager;
  }

  /**
   * Set health monitor
   */
  setHealthMonitor(monitor: HealthMonitor): void {
    this.healthMonitor = monitor;
  }

  /**
   * Detect and record a failure
   */
  async detectFailure(
    category: FailureCategory,
    component: string,
    error: Error,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Record<string, unknown>
  ): Promise<FailureDetection> {
    const failureId = `failure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const detection: FailureDetection = {
      id: failureId,
      category,
      severity,
      component,
      error,
      detectedAt: new Date(),
      context,
    };

    this.failures.set(failureId, detection);

    // Emit detection event
    this.emitEvent({
      type: 'recovery-started',
      timestamp: new Date(),
      component,
      data: detection,
    });

    // Trigger auto-recovery if enabled
    if (this.config.autoRecover) {
      await this.heal(failureId);
    }

    return detection;
  }

  /**
   * Attempt to heal a detected failure
   */
  async heal(failureId: string): Promise<RecoveryResult> {
    const failure = this.failures.get(failureId);
    if (!failure) {
      throw new Error(`Failure not found: ${failureId}`);
    }

    // Check if already healing
    const activeRecovery = this.activeRecoveries.get(failureId);
    if (activeRecovery) {
      return await activeRecovery;
    }

    // Check concurrent recovery limit
    if (this.activeRecoveries.size >= this.config.maxConcurrentRecoveries) {
      return {
        success: false,
        error: new Error('Max concurrent recoveries reached'),
        strategy: 'none',
        attempts: [],
        totalDurationMs: 0,
        finalState: 'failed',
      };
    }

    // Create healing action
    const healingAction: HealingAction = {
      id: `healing-${Date.now()}`,
      failureId,
      action: this.getRecoveryType(failure.category),
      status: 'pending',
    };

    this.healingActions.set(healingAction.id, healingAction);

    // Execute recovery with timeout
    const recoveryPromise = this.executeRecovery(failure, healingAction);
    this.activeRecoveries.set(failureId, recoveryPromise);

    try {
      const result = await Promise.race([
        recoveryPromise,
        this.createRecoveryTimeout(),
      ]);

      // Update healing action
      healingAction.status = result.success ? 'completed' : 'failed';
      healingAction.completedAt = new Date();
      healingAction.result = result;

      // Emit result event
      this.emitEvent({
        type: result.success ? 'recovery-succeeded' : 'recovery-failed',
        timestamp: new Date(),
        component: failure.component,
        data: { failure, result },
      });

      return result;
    } finally {
      this.activeRecoveries.delete(failureId);
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(
    failure: FailureDetection,
    action: HealingAction
  ): Promise<RecoveryResult> {
    action.status = 'executing';
    action.startedAt = new Date();

    // Get strategy for this failure category
    const strategy =
      this.strategies.get(failure.category) ||
      this.strategies.get('default') ||
      this.config.defaultStrategy;

    try {
      let result: RecoveryResult;

      switch (strategy.type) {
        case 'retry':
          result = await this.executeRetry(failure, strategy);
          break;

        case 'fallback':
          result = await this.executeFallback(failure, strategy);
          break;

        case 'restore':
          result = await this.executeRestore(failure, strategy);
          break;

        case 'escalate':
          result = await this.executeEscalation(failure, strategy);
          break;

        default:
          throw new Error(`Unknown recovery type: ${strategy.type}`);
      }

      // Check if we should escalate after failure
      if (
        !result.success &&
        result.finalState === 'failed' &&
        strategy.onExhausted === 'escalate'
      ) {
        const escalationResult = await this.escalate(failure);
        result.finalState = escalationResult.success ? 'escalated' : 'failed';
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        strategy: strategy.name,
        attempts: [],
        totalDurationMs: 0,
        finalState: 'failed',
      };
    }
  }

  /**
   * Execute retry recovery
   */
  private async executeRetry(
    failure: FailureDetection,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const retry = RecoveryStrategyFactory.createRetry(strategy);

    // Create recovery function
    const recoveryFn: AsyncFunction<void> = async () => {
      // In real implementation, this would re-execute the failed operation
      // For now, we simulate recovery
      if (Math.random() > 0.3) {
        return; // Success
      }
      throw failure.error;
    };

    return await retry.execute(recoveryFn);
  }

  /**
   * Execute fallback recovery
   */
  private async executeFallback(
    failure: FailureDetection,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const fallback = RecoveryStrategyFactory.createFallback(strategy);

    // Primary function (the one that failed)
    const primaryFn: AsyncFunction<void> = async () => {
      throw failure.error;
    };

    return await fallback.execute(primaryFn);
  }

  /**
   * Execute restore recovery
   */
  private async executeRestore(
    failure: FailureDetection,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const restore = RecoveryStrategyFactory.createRestore(strategy);

    // Restore function
    const restoreFn = async (checkpointId?: string, restorePoint?: Date) => {
      // In real implementation, this would restore from checkpoint
      console.log(`Restoring from checkpoint: ${checkpointId || restorePoint}`);
      return { restored: true };
    };

    return await restore.execute(restoreFn);
  }

  /**
   * Execute escalation recovery
   */
  private async executeEscalation(
    failure: FailureDetection,
    strategy: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const escalation = RecoveryStrategyFactory.createEscalation(strategy);

    return await escalation.execute(failure.error, {
      ...failure.context,
      component: failure.component,
      category: failure.category,
      severity: failure.severity,
    });
  }

  /**
   * Escalate a failure
   */
  private async escalate(failure: FailureDetection): Promise<RecoveryResult> {
    const escalationStrategy = RecoveryStrategyFactory.createEscalation({
      name: 'auto-escalation',
      escalationLevel: failure.severity === 'critical' ? 'emergency' : 'critical',
      notificationChannels: ['console', 'logging'],
      requiresManualIntervention: failure.severity === 'critical',
    });

    this.emitEvent({
      type: 'escalation-triggered',
      timestamp: new Date(),
      component: failure.component,
      data: failure,
    });

    return await escalationStrategy.execute(failure.error, {
      ...failure.context,
      component: failure.component,
      category: failure.category,
      severity: failure.severity,
    });
  }

  /**
   * Create recovery timeout promise
   */
  private createRecoveryTimeout(): Promise<RecoveryResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: new Error('Recovery timeout'),
          strategy: 'timeout',
          attempts: [],
          totalDurationMs: this.config.recoveryTimeout,
          finalState: 'failed',
        });
      }, this.config.recoveryTimeout);
    });
  }

  /**
   * Get recovery type for failure category
   */
  private getRecoveryType(category: FailureCategory): 'retry' | 'fallback' | 'restore' | 'escalate' {
    const strategy = this.strategies.get(category) || this.config.defaultStrategy;
    return strategy.type;
  }

  /**
   * Execute function with self-healing
   */
  async executeWithHealing<T>(
    component: string,
    fn: AsyncFunction<T>,
    category: FailureCategory = 'unknown',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const failure = await this.detectFailure(
        category,
        component,
        error as Error,
        severity
      );

      if (this.config.autoRecover) {
        const result = await this.heal(failure.id);

        if (result.success && result.result !== undefined) {
          return result.result as T;
        }
      }

      throw error;
    }
  }

  /**
   * Perform periodic health checks
   */
  async performHealthCheck(): Promise<void> {
    if (!this.healthMonitor) {
      return;
    }

    const systemHealth = this.healthMonitor.getSystemHealth();

    // Check each component
    for (const [component, health] of systemHealth.components) {
      if (health.status === 'unhealthy' || health.status === 'degraded') {
        await this.detectFailure(
          'service',
          component,
          new Error(`Component ${component} is ${health.status}`),
          health.status === 'unhealthy' ? 'high' : 'medium',
          {
            availability: health.availability,
            incidentCount: health.incidentCount,
          }
        );
      }
    }
  }

  /**
   * Get failure history
   */
  getFailureHistory(component?: string): FailureDetection[] {
    const failures = Array.from(this.failures.values());

    if (component) {
      return failures.filter((f) => f.component === component);
    }

    return failures;
  }

  /**
   * Get healing history
   */
  getHealingHistory(component?: string): HealingAction[] {
    const actions = Array.from(this.healingActions.values());

    if (component) {
      return actions.filter((a) => {
        const failure = this.failures.get(a.failureId);
        return failure?.component === component;
      });
    }

    return actions;
  }

  /**
   * Get recovery statistics
   */
  getStatistics(): {
    totalFailures: number;
    totalRecoveries: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    successRate: number;
    avgRecoveryTime: number;
    activeRecoveries: number;
  } {
    const actions = Array.from(this.healingActions.values());
    const completed = actions.filter((a) => a.status === 'completed');
    const successful = completed.filter((a) => a.result?.success);

    const recoveryTimes = completed
      .filter((a) => a.result?.totalDurationMs)
      .map((a) => a.result!.totalDurationMs);

    const avgRecoveryTime =
      recoveryTimes.length > 0
        ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
        : 0;

    return {
      totalFailures: this.failures.size,
      totalRecoveries: actions.length,
      successfulRecoveries: successful.length,
      failedRecoveries: completed.length - successful.length,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      avgRecoveryTime,
      activeRecoveries: this.activeRecoveries.size,
    };
  }

  /**
   * Clear history
   */
  clearHistory(olderThan?: Date): void {
    if (olderThan) {
      for (const [id, failure] of this.failures) {
        if (failure.detectedAt < olderThan) {
          this.failures.delete(id);
        }
      }

      for (const [id, action] of this.healingActions) {
        if (action.startedAt && action.startedAt < olderThan) {
          this.healingActions.delete(id);
        }
      }
    } else {
      this.failures.clear();
      this.healingActions.clear();
    }
  }

  /**
   * Register custom recovery strategy
   */
  registerStrategy(category: FailureCategory, strategy: RecoveryStrategy): void {
    this.strategies.set(category, strategy);
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
        console.error('Error in self-healer event handler:', error);
      }
    });
  }

  /**
   * Get configuration
   */
  getConfig(): SelfHealerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SelfHealerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Start auto-healing
   */
  start(): void {
    this.config.enabled = true;
    this.config.autoRecover = true;

    // Start periodic health checks if monitor is available
    if (this.healthMonitor && this.config.healthCheckInterval > 0) {
      setInterval(() => {
        this.performHealthCheck();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Stop auto-healing
   */
  stop(): void {
    this.config.enabled = false;
    this.config.autoRecover = false;
  }

  /**
   * Check if healer is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
