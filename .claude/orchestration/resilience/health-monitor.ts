/**
 * Health Monitoring System
 * Continuous component monitoring with trend detection and proactive healing
 */

import type {
  HealthCheck,
  HealthStatus,
  ComponentHealth,
  SystemHealth,
  HealthCondition,
  HealthThreshold,
  ComponentMetrics,
  HealthMonitorConfig,
  DegradationLevel,
  ResilienceEvent,
} from './types.js';

export class HealthMonitor {
  private config: HealthMonitorConfig;
  private componentHealth = new Map<string, ComponentHealth>();
  private checkHistory = new Map<string, HealthCheck[]>();
  private maxHistorySize = 1000;
  private monitorIntervals = new Map<string, NodeJS.Timeout>();
  private eventHandlers: Array<(event: ResilienceEvent) => void> = [];

  constructor(config: HealthMonitorConfig) {
    this.config = {
      retentionDays: 7,
      alertOnDegradation: true,
      ...config,
    };
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (!this.config.enabled) {
      return;
    }

    this.config.components.forEach((component) => {
      this.startComponentMonitoring(component);
    });
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.monitorIntervals.forEach((interval) => clearInterval(interval));
    this.monitorIntervals.clear();
  }

  /**
   * Start monitoring a specific component
   */
  private startComponentMonitoring(component: string): void {
    if (this.monitorIntervals.has(component)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.performHealthCheck(component);
    }, this.config.checkInterval);

    this.monitorIntervals.set(component, interval);
  }

  /**
   * Perform health check for a component
   */
  async performHealthCheck(
    component: string,
    customCheck?: () => Promise<HealthCheck>
  ): Promise<HealthCheck> {
    const startTime = Date.now();
    let check: HealthCheck;

    try {
      if (customCheck) {
        check = await customCheck();
      } else {
        // Default health check - just connectivity/availability
        check = {
          name: `${component}-default`,
          component,
          status: 'healthy',
          lastChecked: new Date(),
          responseTime: Date.now() - startTime,
        };
      }
    } catch (error) {
      check = {
        name: `${component}-default`,
        component,
        status: 'unhealthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // Record check
    this.recordHealthCheck(check);

    // Update component health
    this.updateComponentHealth(component);

    // Check for degradation
    this.checkDegradation(component);

    return check;
  }

  /**
   * Record a health check result
   */
  private recordHealthCheck(check: HealthCheck): void {
    if (!this.checkHistory.has(check.component)) {
      this.checkHistory.set(check.component, []);
    }

    const history = this.checkHistory.get(check.component)!;
    history.push(check);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Update component health summary
   */
  private updateComponentHealth(component: string): void {
    const history = this.checkHistory.get(component) || [];
    const recentChecks = this.getRecentChecks(component, 3600000); // Last hour

    if (recentChecks.length === 0) {
      return;
    }

    const healthyChecks = recentChecks.filter((c) => c.status === 'healthy').length;
    const availability = (healthyChecks / recentChecks.length) * 100;

    const currentStatus = this.determineComponentStatus(recentChecks);

    const lastIncident = recentChecks.find(
      (c) => c.status === 'unhealthy' || c.status === 'degraded'
    )?.lastChecked;

    const incidentCount24h = this.getRecentChecks(component, 86400000).filter(
      (c) => c.status === 'unhealthy' || c.status === 'degraded'
    ).length;

    const existing = this.componentHealth.get(component);
    const uptimeSeconds = existing?.uptime || 0;

    const componentHealth: ComponentHealth = {
      component,
      status: currentStatus,
      checks: recentChecks.slice(-10), // Last 10 checks
      uptime: uptimeSeconds + this.config.checkInterval / 1000,
      lastIncident,
      incidentCount: incidentCount24h,
      availability,
      metrics: this.calculateMetrics(recentChecks),
    };

    const previousStatus = existing?.status;
    this.componentHealth.set(component, componentHealth);

    // Emit status change event
    if (previousStatus && previousStatus !== currentStatus) {
      this.emitEvent({
        type: currentStatus === 'healthy' ? 'health-recovered' : 'health-degraded',
        timestamp: new Date(),
        component,
        data: {
          from: previousStatus,
          to: currentStatus,
          availability,
        },
      });
    }
  }

  /**
   * Determine component status from recent checks
   */
  private determineComponentStatus(checks: HealthCheck[]): HealthStatus {
    if (checks.length === 0) {
      return 'unknown';
    }

    const recentFive = checks.slice(-5);
    const unhealthyCount = recentFive.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = recentFive.filter((c) => c.status === 'degraded').length;

    // If majority unhealthy, mark as unhealthy
    if (unhealthyCount >= 3) {
      return 'unhealthy';
    }

    // If any degraded or some unhealthy, mark as degraded
    if (degradedCount > 0 || unhealthyCount > 0) {
      return 'degraded';
    }

    // All recent checks healthy
    const latestCheck = checks[checks.length - 1];
    return latestCheck.status;
  }

  /**
   * Calculate component metrics
   */
  private calculateMetrics(checks: HealthCheck[]): ComponentMetrics {
    const requestCount = checks.length;
    const errorCount = checks.filter(
      (c) => c.status === 'unhealthy' || c.status === 'degraded'
    ).length;

    const responseTimes = checks.map((c) => c.responseTime).sort((a, b) => a - b);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    const p95ResponseTime = responseTimes[p95Index] || 0;
    const p99ResponseTime = responseTimes[p99Index] || 0;

    const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
    const throughput = requestCount / (this.config.checkInterval / 1000);

    return {
      requestCount,
      errorCount,
      errorRate,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      throughput,
    };
  }

  /**
   * Get recent checks for a component
   */
  private getRecentChecks(component: string, windowMs: number): HealthCheck[] {
    const history = this.checkHistory.get(component) || [];
    const cutoff = new Date(Date.now() - windowMs);

    return history.filter((check) => check.lastChecked >= cutoff);
  }

  /**
   * Check if component meets degradation condition
   */
  private checkDegradation(component: string): void {
    if (!this.config.alertOnDegradation) {
      return;
    }

    const componentHealth = this.componentHealth.get(component);
    if (!componentHealth) {
      return;
    }

    const thresholds = this.config.thresholds[component];
    if (!thresholds) {
      return;
    }

    // Check availability threshold
    if (
      componentHealth.availability < thresholds.critical &&
      componentHealth.status !== 'unhealthy'
    ) {
      // Trigger critical alert
      this.emitEvent({
        type: 'health-degraded',
        timestamp: new Date(),
        component,
        data: {
          severity: 'critical',
          availability: componentHealth.availability,
          threshold: thresholds.critical,
        },
      });
    }
  }

  /**
   * Get component health
   */
  getComponentHealth(component: string): ComponentHealth | undefined {
    return this.componentHealth.get(component);
  }

  /**
   * Get system health
   */
  getSystemHealth(): SystemHealth {
    const components = new Map(this.componentHealth);
    const componentStatuses = Array.from(components.values());

    const unhealthyCount = componentStatuses.filter(
      (c) => c.status === 'unhealthy'
    ).length;
    const degradedCount = componentStatuses.filter(
      (c) => c.status === 'degraded'
    ).length;

    // Determine overall status
    let overall: HealthStatus;
    let degradationLevel: DegradationLevel;

    if (unhealthyCount > componentStatuses.length / 2) {
      overall = 'unhealthy';
      degradationLevel = 'emergency';
    } else if (unhealthyCount > 0 || degradedCount > componentStatuses.length / 2) {
      overall = 'degraded';
      degradationLevel = degradedCount > unhealthyCount ? 'reduced' : 'minimal';
    } else if (degradedCount > 0) {
      overall = 'degraded';
      degradationLevel = 'reduced';
    } else {
      overall = 'healthy';
      degradationLevel = 'full';
    }

    // Calculate health score
    const availabilities = componentStatuses.map((c) => c.availability);
    const avgAvailability =
      availabilities.length > 0
        ? availabilities.reduce((a, b) => a + b, 0) / availabilities.length
        : 100;

    const score = Math.round(avgAvailability);

    const activeIncidents = componentStatuses.filter(
      (c) => c.status === 'unhealthy' || c.status === 'degraded'
    ).length;

    return {
      overall,
      components,
      degradationLevel,
      activeIncidents,
      timestamp: new Date(),
      score,
    };
  }

  /**
   * Evaluate health condition
   */
  evaluateCondition(condition: HealthCondition): boolean {
    const systemHealth = this.getSystemHealth();

    // Extract metric value based on condition
    let actualValue: number;

    switch (condition.metric) {
      case 'health_score':
        actualValue = systemHealth.score;
        break;
      case 'active_incidents':
        actualValue = systemHealth.activeIncidents;
        break;
      default:
        // Try to get component-specific metric
        const [component, metric] = condition.metric.split('.');
        const componentHealth = this.componentHealth.get(component);
        if (!componentHealth?.metrics) {
          return false;
        }
        actualValue = (componentHealth.metrics as any)[metric] || 0;
    }

    // Compare with threshold
    switch (condition.operator) {
      case '>':
        return actualValue > condition.value;
      case '<':
        return actualValue < condition.value;
      case '>=':
        return actualValue >= condition.value;
      case '<=':
        return actualValue <= condition.value;
      case '==':
        return actualValue === condition.value;
      case '!=':
        return actualValue !== condition.value;
      default:
        return false;
    }
  }

  /**
   * Register custom health check
   */
  registerCheck(
    component: string,
    checkFn: () => Promise<HealthCheck>
  ): void {
    // Start monitoring if not already
    if (!this.monitorIntervals.has(component)) {
      this.config.components.push(component);
      const interval = setInterval(async () => {
        await this.performHealthCheck(component, checkFn);
      }, this.config.checkInterval);

      this.monitorIntervals.set(component, interval);
    }
  }

  /**
   * Unregister component monitoring
   */
  unregisterCheck(component: string): void {
    const interval = this.monitorIntervals.get(component);
    if (interval) {
      clearInterval(interval);
      this.monitorIntervals.delete(component);
    }

    this.componentHealth.delete(component);
    this.checkHistory.delete(component);
  }

  /**
   * Subscribe to health events
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
   * Emit event to all handlers
   */
  private emitEvent(event: ResilienceEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in health monitor event handler:', error);
      }
    });
  }

  /**
   * Get health check history
   */
  getHistory(component: string, limit?: number): HealthCheck[] {
    const history = this.checkHistory.get(component) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  /**
   * Clear history for a component
   */
  clearHistory(component: string): void {
    this.checkHistory.delete(component);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.checkHistory.clear();
  }

  /**
   * Get trending health score
   */
  getTrend(component: string, windowMs: number = 3600000): 'improving' | 'stable' | 'declining' {
    const checks = this.getRecentChecks(component, windowMs);
    if (checks.length < 10) {
      return 'stable';
    }

    const midpoint = Math.floor(checks.length / 2);
    const firstHalf = checks.slice(0, midpoint);
    const secondHalf = checks.slice(midpoint);

    const firstAvailability =
      firstHalf.filter((c) => c.status === 'healthy').length / firstHalf.length;
    const secondAvailability =
      secondHalf.filter((c) => c.status === 'healthy').length / secondHalf.length;

    const difference = secondAvailability - firstAvailability;

    if (difference > 0.1) {
      return 'improving';
    } else if (difference < -0.1) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  /**
   * Get configuration
   */
  getConfig(): HealthMonitorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HealthMonitorConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring with new config
    this.stop();
    if (this.config.enabled) {
      this.start();
    }
  }
}

/**
 * Predefined health checks
 */
export const HealthChecks = {
  /**
   * Simple ping check
   */
  ping: async (component: string): Promise<HealthCheck> => {
    const startTime = Date.now();
    return {
      name: `${component}-ping`,
      component,
      status: 'healthy',
      lastChecked: new Date(),
      responseTime: Date.now() - startTime,
    };
  },

  /**
   * Memory usage check
   */
  memory: async (component: string, thresholdMB: number = 1000): Promise<HealthCheck> => {
    const startTime = Date.now();
    const memoryUsage = process.memoryUsage();
    const usedMB = memoryUsage.heapUsed / 1024 / 1024;

    return {
      name: `${component}-memory`,
      component,
      status: usedMB > thresholdMB ? 'degraded' : 'healthy',
      lastChecked: new Date(),
      responseTime: Date.now() - startTime,
      details: {
        usedMB: Math.round(usedMB),
        thresholdMB,
        totalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
  },

  /**
   * Custom check with timeout
   */
  withTimeout: async (
    component: string,
    checkFn: () => Promise<boolean>,
    timeoutMs: number = 5000
  ): Promise<HealthCheck> => {
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), timeoutMs)
      );

      const result = await Promise.race([checkFn(), timeoutPromise]);

      return {
        name: `${component}-custom`,
        component,
        status: result ? 'healthy' : 'unhealthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name: `${component}-custom`,
        component,
        status: 'unhealthy',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
