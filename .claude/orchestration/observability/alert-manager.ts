/**
 * Alert Manager
 *
 * Establishes intelligent alerting system with multi-channel notifications
 * to streamline incident response and improve operational awareness across
 * the Claude orchestration platform.
 */

import Database from 'better-sqlite3';
import {
  Alert,
  AlertTrigger,
  AlertEvaluation,
  AlertChannel,
  WebhookChannelConfig,
  SlackChannelConfig,
  EmailChannelConfig,
  LogChannelConfig,
  PagerDutyChannelConfig,
  AlertSeverity,
} from './types.js';

export class AlertManager {
  private db: Database.Database;
  private evaluationTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private activeEvaluations: Map<string, AlertEvaluation> = new Map();
  private defaultEvaluationInterval = 30;  // seconds

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Start alert evaluation loop
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleEvaluation();
  }

  /**
   * Stop alert evaluation loop
   */
  stop(): void {
    if (this.evaluationTimer) {
      clearTimeout(this.evaluationTimer);
      this.evaluationTimer = null;
    }
    this.isRunning = false;
  }

  /**
   * Schedule next evaluation run
   */
  private scheduleEvaluation(): void {
    if (!this.isRunning) {
      return;
    }

    this.evaluationTimer = setTimeout(() => {
      this.runEvaluations().catch(err => {
        console.error('Alert evaluation error:', err);
      }).finally(() => {
        this.scheduleEvaluation();
      });
    }, this.defaultEvaluationInterval * 1000);
  }

  /**
   * Run evaluations for all active alerts
   */
  private async runEvaluations(): Promise<void> {
    const alerts = this.getActiveAlerts();

    for (const alert of alerts) {
      try {
        await this.evaluateAlert(alert);
      } catch (error) {
        console.error(`Error evaluating alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert
   */
  private async evaluateAlert(alert: Alert): Promise<void> {
    const evaluation = this.performEvaluation(alert);

    if (evaluation.shouldTrigger) {
      await this.triggerAlert(alert, evaluation);
    } else {
      await this.checkResolution(alert);
    }
  }

  /**
   * Perform alert condition evaluation
   */
  private performEvaluation(alert: Alert): AlertEvaluation {
    const { metric, operator, threshold, duration, labels } = alert.condition;

    // Get current metric value
    const currentValue = this.getCurrentMetricValue(metric, labels);

    // Check if condition is met
    const conditionMet = this.evaluateCondition(currentValue, operator, threshold);

    // Check if duration threshold is met
    const durationMet = this.checkDurationThreshold(alert, conditionMet);

    return {
      alert,
      currentValue,
      threshold,
      conditionMet,
      durationMet,
      shouldTrigger: conditionMet && durationMet,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Get current value for a metric
   */
  private getCurrentMetricValue(metricName: string, labels?: Record<string, string>): number {
    let sql = `
      SELECT AVG(metric_value) as current_value
      FROM telemetry_metrics
      WHERE metric_name = ?
        AND timestamp > datetime('now', '-5 minutes')
    `;

    const params: any[] = [metricName];

    if (labels && Object.keys(labels).length > 0) {
      for (const [key, value] of Object.entries(labels)) {
        sql += ` AND json_extract(labels, '$.${key}') = ?`;
        params.push(value);
      }
    }

    const row = this.db.prepare(sql).get(...params) as any;
    return row?.current_value || 0;
  }

  /**
   * Evaluate condition against threshold
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      case 'neq':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Check if condition has been met for required duration
   */
  private checkDurationThreshold(alert: Alert, conditionMet: boolean): boolean {
    if (!conditionMet) {
      this.activeEvaluations.delete(alert.id);
      return false;
    }

    const previous = this.activeEvaluations.get(alert.id);

    if (!previous) {
      // First time condition is met
      this.activeEvaluations.set(alert.id, {
        alert,
        currentValue: 0,
        threshold: alert.condition.threshold,
        conditionMet: true,
        durationMet: false,
        shouldTrigger: false,
        evaluatedAt: new Date(),
      });
      return false;
    }

    // Check if duration threshold is met
    const elapsedSeconds = (Date.now() - previous.evaluatedAt.getTime()) / 1000;
    return elapsedSeconds >= alert.condition.duration;
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: Alert, evaluation: AlertEvaluation): Promise<void> {
    // Check if alert is already triggered
    const existing = this.db.prepare(`
      SELECT id
      FROM alert_history
      WHERE alert_id = ?
        AND status = 'triggered'
      ORDER BY triggered_at DESC
      LIMIT 1
    `).get(alert.id);

    if (existing) {
      return;  // Alert already triggered
    }

    // Create alert history record
    const trigger: Partial<AlertTrigger> = {
      alertId: alert.id,
      alertName: alert.name,
      severity: alert.severity,
      status: 'triggered',
      triggeredAt: new Date(),
      triggerValue: evaluation.currentValue,
      threshold: evaluation.threshold,
      message: this.buildAlertMessage(alert, evaluation),
      labels: alert.condition.labels ? JSON.stringify(alert.condition.labels) : undefined,
      notificationSent: false,
    };

    const result = this.db.prepare(`
      INSERT INTO alert_history (
        alert_id, alert_name, severity, status, triggered_at,
        trigger_value, threshold, message, labels, notification_sent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trigger.alertId,
      trigger.alertName,
      trigger.severity,
      trigger.status,
      trigger.triggeredAt!.toISOString(),
      trigger.triggerValue,
      trigger.threshold,
      trigger.message,
      trigger.labels,
      trigger.notificationSent ? 1 : 0
    );

    const triggerId = result.lastInsertRowid as number;

    // Send notifications
    await this.sendNotifications(alert, trigger as AlertTrigger, triggerId);

    // Update alert status
    this.db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run('triggered', alert.id);

    console.log(`Alert triggered: ${alert.name} (${alert.severity})`);
  }

  /**
   * Check if an alert should be resolved
   */
  private async checkResolution(alert: Alert): Promise<void> {
    const triggered = this.db.prepare(`
      SELECT id, triggered_at
      FROM alert_history
      WHERE alert_id = ?
        AND status = 'triggered'
      ORDER BY triggered_at DESC
      LIMIT 1
    `).get(alert.id) as any;

    if (!triggered) {
      return;  // Alert not currently triggered
    }

    // Resolve the alert
    this.db.prepare(`
      UPDATE alert_history
      SET status = 'resolved',
          resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(triggered.id);

    this.db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run('active', alert.id);

    console.log(`Alert resolved: ${alert.name}`);
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(alert: Alert, trigger: AlertTrigger, triggerId: number): Promise<void> {
    const sentChannels: string[] = [];
    let error: string | undefined;

    for (const channel of alert.channels) {
      if (channel.enabled === false) {
        continue;
      }

      try {
        await this.sendChannelNotification(channel, alert, trigger);
        sentChannels.push(channel.type);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        console.error(`Failed to send ${channel.type} notification:`, err);
      }
    }

    // Update notification status
    this.db.prepare(`
      UPDATE alert_history
      SET notification_sent = ?,
          notification_channels = ?,
          notification_error = ?
      WHERE id = ?
    `).run(
      sentChannels.length > 0 ? 1 : 0,
      JSON.stringify(sentChannels),
      error,
      triggerId
    );
  }

  /**
   * Send notification through a specific channel
   */
  private async sendChannelNotification(
    channel: AlertChannel,
    alert: Alert,
    trigger: AlertTrigger
  ): Promise<void> {
    switch (channel.type) {
      case 'log':
        this.sendLogNotification(channel.config as LogChannelConfig, alert, trigger);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config as WebhookChannelConfig, alert, trigger);
        break;
      case 'slack':
        await this.sendSlackNotification(channel.config as SlackChannelConfig, alert, trigger);
        break;
      case 'email':
        await this.sendEmailNotification(channel.config as EmailChannelConfig, alert, trigger);
        break;
      case 'pagerduty':
        await this.sendPagerDutyNotification(channel.config as PagerDutyChannelConfig, alert, trigger);
        break;
      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }

  /**
   * Send log notification
   */
  private sendLogNotification(config: LogChannelConfig, alert: Alert, trigger: AlertTrigger): void {
    const message = `[${alert.severity.toUpperCase()}] ${trigger.message}`;

    switch (config.level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.info(message);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    config: WebhookChannelConfig,
    alert: Alert,
    trigger: AlertTrigger
  ): Promise<void> {
    const payload = {
      alert: {
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
      },
      trigger: {
        value: trigger.triggerValue,
        threshold: trigger.threshold,
        message: trigger.message,
        triggeredAt: trigger.triggeredAt,
      },
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.timeout || 10000),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    config: SlackChannelConfig,
    alert: Alert,
    trigger: AlertTrigger
  ): Promise<void> {
    const color = this.getSeverityColor(alert.severity);

    const payload = {
      channel: config.channel,
      username: config.username || 'Alert Manager',
      icon_emoji: config.iconEmoji || ':warning:',
      attachments: [
        {
          color,
          title: `Alert: ${alert.name}`,
          text: trigger.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Current Value',
              value: trigger.triggerValue.toString(),
              short: true,
            },
            {
              title: 'Threshold',
              value: `${alert.condition.operator} ${trigger.threshold}`,
              short: true,
            },
            {
              title: 'Triggered At',
              value: trigger.triggeredAt.toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.status}`);
    }
  }

  /**
   * Send email notification (placeholder - requires SMTP implementation)
   */
  private async sendEmailNotification(
    config: EmailChannelConfig,
    alert: Alert,
    trigger: AlertTrigger
  ): Promise<void> {
    console.warn('Email notifications not yet implemented');
    // TODO: Implement SMTP email sending
  }

  /**
   * Send PagerDuty notification (placeholder)
   */
  private async sendPagerDutyNotification(
    config: PagerDutyChannelConfig,
    alert: Alert,
    trigger: AlertTrigger
  ): Promise<void> {
    console.warn('PagerDuty notifications not yet implemented');
    // TODO: Implement PagerDuty Events API v2
  }

  /**
   * Get color for alert severity
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical':
        return '#FF0000';
      case 'error':
        return '#FF6600';
      case 'warning':
        return '#FFCC00';
      case 'info':
        return '#0099FF';
      default:
        return '#999999';
    }
  }

  /**
   * Build alert message
   */
  private buildAlertMessage(alert: Alert, evaluation: AlertEvaluation): string {
    return `Alert '${alert.name}' triggered: ${alert.condition.metric} = ${evaluation.currentValue} (threshold: ${alert.condition.operator} ${evaluation.threshold})`;
  }

  /**
   * Get all active alerts
   */
  private getActiveAlerts(): Alert[] {
    const rows = this.db.prepare(`
      SELECT *
      FROM alerts
      WHERE enabled = 1
        AND (silence_until IS NULL OR silence_until < datetime('now'))
    `).all() as any[];

    return rows.map(row => this.rowToAlert(row));
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Alert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    this.db.prepare(`
      INSERT INTO alerts (
        id, name, description, severity, metric_name, operator, threshold,
        duration, evaluation_interval, labels, channels, status, enabled,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      alert.name,
      alert.description,
      alert.severity,
      alert.condition.metric,
      alert.condition.operator,
      alert.condition.threshold,
      alert.condition.duration,
      alert.condition.evaluationInterval,
      JSON.stringify(alert.condition.labels || {}),
      JSON.stringify(alert.channels),
      alert.status,
      alert.enabled ? 1 : 0,
      now.toISOString(),
      now.toISOString(),
      alert.createdBy
    );

    return {
      ...alert,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Silence an alert for a period
   */
  silenceAlert(alertId: string, durationSeconds: number): void {
    const silenceUntil = new Date(Date.now() + durationSeconds * 1000);

    this.db.prepare(`
      UPDATE alerts
      SET status = 'silenced',
          silence_until = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(silenceUntil.toISOString(), alertId);
  }

  /**
   * Convert database row to Alert object
   */
  private rowToAlert(row: any): Alert {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      severity: row.severity as AlertSeverity,
      condition: {
        metric: row.metric_name,
        operator: row.operator,
        threshold: row.threshold,
        duration: row.duration,
        evaluationInterval: row.evaluation_interval,
        labels: row.labels ? JSON.parse(row.labels) : undefined,
      },
      channels: row.channels ? JSON.parse(row.channels) : [],
      status: row.status,
      silenceUntil: row.silence_until ? new Date(row.silence_until) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      enabled: row.enabled === 1,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    this.stop();
    this.db.close();
  }
}
