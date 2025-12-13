/**
 * Graceful Degradation System
 * Feature flag-based degradation with automatic level adjustment
 */

import type {
  DegradationState,
  DegradationLevel,
  FeatureFlag,
  DegradationRule,
  DegradationConfig,
  CapabilityReduction,
  ResilienceEvent,
  HealthCondition,
} from './types.js';
import { HealthMonitor } from './health-monitor.js';

export class GracefulDegradation {
  private config: DegradationConfig;
  private currentState: DegradationState | null = null;
  private features = new Map<string, FeatureFlag>();
  private healthMonitor?: HealthMonitor;
  private monitorInterval?: NodeJS.Timeout;
  private eventHandlers: Array<(event: ResilienceEvent) => void> = [];

  constructor(config: DegradationConfig) {
    this.config = config;
    this.initializeFeatures();
  }

  /**
   * Initialize feature flags
   */
  private initializeFeatures(): void {
    this.config.features.forEach((feature) => {
      this.features.set(feature.name, feature);
    });
  }

  /**
   * Set health monitor
   */
  setHealthMonitor(monitor: HealthMonitor): void {
    this.healthMonitor = monitor;
  }

  /**
   * Start automatic degradation monitoring
   */
  start(): void {
    if (!this.config.enabled || !this.config.autoDegrade) {
      return;
    }

    if (this.monitorInterval) {
      return; // Already running
    }

    this.monitorInterval = setInterval(() => {
      this.checkAndAdjustDegradation();
    }, this.config.recoveryCheckInterval);
  }

  /**
   * Stop automatic degradation monitoring
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = undefined;
    }
  }

  /**
   * Check health and adjust degradation level
   */
  private checkAndAdjustDegradation(): void {
    if (!this.healthMonitor) {
      return;
    }

    // Evaluate all rules
    for (const rule of this.config.rules) {
      const conditionMet = this.healthMonitor.evaluateCondition(rule.condition);

      if (conditionMet) {
        // Apply degradation if not already at this level
        if (
          !this.currentState ||
          this.currentState.level !== rule.targetLevel
        ) {
          // Check grace period
          if (rule.gracePeriodMs) {
            setTimeout(() => {
              const stillMet = this.healthMonitor!.evaluateCondition(
                rule.condition
              );
              if (stillMet) {
                this.degrade(
                  rule.targetLevel,
                  `Rule triggered: ${this.formatCondition(rule.condition)}`,
                  'automatic',
                  rule.affectedFeatures
                );
              }
            }, rule.gracePeriodMs);
          } else {
            this.degrade(
              rule.targetLevel,
              `Rule triggered: ${this.formatCondition(rule.condition)}`,
              'automatic',
              rule.affectedFeatures
            );
          }
        }
        return; // Only apply first matching rule
      }
    }

    // Check for recovery
    if (this.currentState && this.canRecover()) {
      this.recover();
    }
  }

  /**
   * Format condition for display
   */
  private formatCondition(condition: HealthCondition): string {
    return `${condition.metric} ${condition.operator} ${condition.value}`;
  }

  /**
   * Degrade to a specific level
   */
  degrade(
    level: DegradationLevel,
    reason: string,
    triggeredBy: 'manual' | 'automatic' | 'health-check' = 'manual',
    affectedFeatures?: string[]
  ): void {
    // Determine which features to disable
    const disabledFeatures = affectedFeatures || this.getFeaturesForLevel(level);

    // Determine capability reductions
    const reducedCapabilities = this.getCapabilityReductions(level);

    // Create new degradation state
    const newState: DegradationState = {
      level,
      disabledFeatures,
      reducedCapabilities,
      reason,
      since: new Date(),
      triggeredBy,
    };

    // Apply feature changes
    this.applyFeatureChanges(disabledFeatures, false);

    const previousLevel = this.currentState?.level;
    this.currentState = newState;

    // Emit event
    this.emitEvent({
      type: 'degradation-activated',
      timestamp: new Date(),
      component: 'system',
      data: {
        from: previousLevel || 'full',
        to: level,
        reason,
        disabledFeatures,
      },
    });
  }

  /**
   * Recover from degradation
   */
  recover(): void {
    if (!this.currentState) {
      return;
    }

    const previousState = this.currentState;

    // Re-enable features
    this.applyFeatureChanges(this.currentState.disabledFeatures, true);

    // Clear reduced capabilities
    this.currentState.reducedCapabilities.clear();

    // Update state
    this.currentState = null;

    // Emit event
    this.emitEvent({
      type: 'degradation-recovered',
      timestamp: new Date(),
      component: 'system',
      data: {
        from: previousState.level,
        to: 'full',
        duration: Date.now() - previousState.since.getTime(),
      },
    });
  }

  /**
   * Check if system can recover
   */
  private canRecover(): boolean {
    if (!this.healthMonitor || !this.currentState) {
      return false;
    }

    const systemHealth = this.healthMonitor.getSystemHealth();

    // Check if health score is good enough
    if (systemHealth.score < 80) {
      return false;
    }

    // Check if all components are healthy
    const unhealthyCount = Array.from(systemHealth.components.values()).filter(
      (c) => c.status === 'unhealthy'
    ).length;

    return unhealthyCount === 0;
  }

  /**
   * Get features to disable for degradation level
   */
  private getFeaturesForLevel(level: DegradationLevel): string[] {
    const features: string[] = [];

    for (const [name, feature] of this.features) {
      if (feature.degradationLevels.includes(level)) {
        features.push(name);
      }
    }

    // Sort by priority (lower priority features disabled first)
    return features.sort((a, b) => {
      const priorityA = this.features.get(a)?.priority || 50;
      const priorityB = this.features.get(b)?.priority || 50;
      return priorityA - priorityB;
    });
  }

  /**
   * Get capability reductions for level
   */
  private getCapabilityReductions(
    level: DegradationLevel
  ): Map<string, CapabilityReduction> {
    const reductions = new Map<string, CapabilityReduction>();

    // Define capability reductions by level
    const reductionMap: Record<
      DegradationLevel,
      Array<CapabilityReduction>
    > = {
      full: [],
      reduced: [
        {
          capability: 'parallel-processing',
          originalLevel: 100,
          reducedLevel: 50,
          impact: 'Reduced parallel task execution by 50%',
        },
        {
          capability: 'cache-size',
          originalLevel: 100,
          reducedLevel: 75,
          impact: 'Reduced cache size to 75%',
        },
      ],
      minimal: [
        {
          capability: 'parallel-processing',
          originalLevel: 100,
          reducedLevel: 25,
          impact: 'Reduced parallel task execution by 75%',
        },
        {
          capability: 'cache-size',
          originalLevel: 100,
          reducedLevel: 50,
          impact: 'Reduced cache size to 50%',
        },
        {
          capability: 'request-timeout',
          originalLevel: 30000,
          reducedLevel: 10000,
          impact: 'Reduced request timeout to 10s',
        },
      ],
      emergency: [
        {
          capability: 'parallel-processing',
          originalLevel: 100,
          reducedLevel: 0,
          impact: 'Disabled parallel processing',
        },
        {
          capability: 'cache-size',
          originalLevel: 100,
          reducedLevel: 25,
          impact: 'Reduced cache size to 25%',
        },
        {
          capability: 'request-timeout',
          originalLevel: 30000,
          reducedLevel: 5000,
          impact: 'Reduced request timeout to 5s',
        },
        {
          capability: 'batch-size',
          originalLevel: 100,
          reducedLevel: 10,
          impact: 'Reduced batch processing to 10 items',
        },
      ],
    };

    const levelReductions = reductionMap[level] || [];
    levelReductions.forEach((reduction) => {
      reductions.set(reduction.capability, reduction);
    });

    return reductions;
  }

  /**
   * Apply feature flag changes
   */
  private applyFeatureChanges(featureNames: string[], enable: boolean): void {
    featureNames.forEach((name) => {
      const feature = this.features.get(name);
      if (feature) {
        feature.enabled = enable;

        // Handle dependencies
        if (enable && feature.dependencies) {
          // Re-enable dependencies
          feature.dependencies.forEach((depName) => {
            const dep = this.features.get(depName);
            if (dep) {
              dep.enabled = true;
            }
          });
        } else if (!enable && feature.dependencies) {
          // Disable dependents
          this.features.forEach((f) => {
            if (f.dependencies?.includes(name)) {
              f.enabled = false;
            }
          });
        }
      }
    });
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) {
      return true; // Unknown features are enabled by default
    }

    return feature.enabled;
  }

  /**
   * Get current degradation state
   */
  getCurrentState(): DegradationState | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Get current degradation level
   */
  getCurrentLevel(): DegradationLevel {
    return this.currentState?.level || 'full';
  }

  /**
   * Get all feature flags
   */
  getFeatures(): Map<string, FeatureFlag> {
    return new Map(this.features);
  }

  /**
   * Get specific feature flag
   */
  getFeature(name: string): FeatureFlag | undefined {
    return this.features.get(name);
  }

  /**
   * Add or update feature flag
   */
  setFeature(feature: FeatureFlag): void {
    this.features.set(feature.name, feature);
  }

  /**
   * Remove feature flag
   */
  removeFeature(name: string): void {
    this.features.delete(name);
  }

  /**
   * Manually enable/disable feature
   */
  toggleFeature(name: string, enabled: boolean): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.enabled = enabled;
      this.applyFeatureChanges([name], enabled);
    }
  }

  /**
   * Get capability reduction value
   */
  getCapabilityLevel(capability: string): number {
    if (!this.currentState) {
      return 100; // Full capacity
    }

    const reduction = this.currentState.reducedCapabilities.get(capability);
    return reduction?.reducedLevel || 100;
  }

  /**
   * Check if degraded
   */
  isDegraded(): boolean {
    return this.currentState !== null;
  }

  /**
   * Force recovery (manual override)
   */
  forceRecover(): void {
    this.recover();
  }

  /**
   * Force degradation (manual override)
   */
  forceDegradeToLevel(level: DegradationLevel, reason: string): void {
    this.degrade(level, reason, 'manual');
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
        console.error('Error in degradation event handler:', error);
      }
    });
  }

  /**
   * Get degradation history
   */
  getHistory(): DegradationState[] {
    // In production, this would retrieve from persistence layer
    return this.currentState ? [this.currentState] : [];
  }

  /**
   * Get configuration
   */
  getConfig(): DegradationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DegradationConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if needed
    this.stop();
    if (this.config.enabled && this.config.autoDegrade) {
      this.start();
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalFeatures: number;
    enabledFeatures: number;
    disabledFeatures: number;
    currentLevel: DegradationLevel;
    degradedSince?: Date;
    reducedCapabilities: number;
  } {
    const enabledFeatures = Array.from(this.features.values()).filter(
      (f) => f.enabled
    ).length;

    return {
      totalFeatures: this.features.size,
      enabledFeatures,
      disabledFeatures: this.features.size - enabledFeatures,
      currentLevel: this.getCurrentLevel(),
      degradedSince: this.currentState?.since,
      reducedCapabilities: this.currentState?.reducedCapabilities.size || 0,
    };
  }
}
