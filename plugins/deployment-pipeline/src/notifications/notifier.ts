/**
 * Notification System
 *
 * Multi-channel notification support for deployment pipeline events
 * with support for Slack, Teams, and Email.
 */

import { DeploymentContext, DeploymentState, DeploymentEvent } from '../workflow/state-machine';

export type NotificationChannel = 'slack' | 'teams' | 'email';

export type NotificationEvent =
  | 'pipeline.started'
  | 'pipeline.stage.completed'
  | 'pipeline.approval.required'
  | 'pipeline.completed'
  | 'pipeline.failed'
  | 'pipeline.rollback';

export interface NotificationConfig {
  channels: NotificationChannel[];
  slack?: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
  };
  teams?: {
    webhookUrl: string;
  };
  email?: {
    smtpHost: string;
    smtpPort: number;
    from: string;
    to: string[];
  };
  eventFilters?: NotificationEvent[];
}

export interface NotificationPayload {
  event: NotificationEvent;
  deployment: DeploymentContext;
  title: string;
  message: string;
  color: 'good' | 'warning' | 'danger' | 'info';
  fields?: { name: string; value: string }[];
  actions?: { name: string; url: string }[];
}

/**
 * Map deployment events to notification events
 */
export function mapToNotificationEvent(
  state: DeploymentState,
  event?: DeploymentEvent
): NotificationEvent | null {
  if (event === 'START') return 'pipeline.started';
  if (state === 'awaiting-approval') return 'pipeline.approval.required';
  if (state === 'completed') return 'pipeline.completed';
  if (state === 'failed') return 'pipeline.failed';
  if (state === 'rolled-back') return 'pipeline.rollback';

  // Stage completion events
  if (['building', 'testing', 'deploying-dev', 'deploying-staging', 'deploying-prod'].includes(state)) {
    return 'pipeline.stage.completed';
  }

  return null;
}

/**
 * Create notification payload from deployment context
 */
export function createPayload(
  notificationEvent: NotificationEvent,
  context: DeploymentContext
): NotificationPayload {
  const baseFields = [
    { name: 'Repository', value: context.repository },
    { name: 'Branch', value: context.branch },
    { name: 'Commit', value: context.commitSha.substring(0, 8) },
    { name: 'State', value: context.currentState },
  ];

  switch (notificationEvent) {
    case 'pipeline.started':
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Deployment Pipeline Started',
        message: `Deployment ${context.id} has been initiated for ${context.repository}`,
        color: 'info',
        fields: baseFields,
      };

    case 'pipeline.approval.required':
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Approval Required',
        message: `Deployment ${context.id} is awaiting approval for production deployment`,
        color: 'warning',
        fields: baseFields,
        actions: [
          { name: 'Approve', url: `claude://deploy/approve/${context.id}` },
          { name: 'Reject', url: `claude://deploy/reject/${context.id}` },
        ],
      };

    case 'pipeline.completed':
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Deployment Completed',
        message: `Deployment ${context.id} completed successfully`,
        color: 'good',
        fields: [
          ...baseFields,
          { name: 'Duration', value: calculateDuration(context.startedAt, context.updatedAt) },
        ],
      };

    case 'pipeline.failed':
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Deployment Failed',
        message: `Deployment ${context.id} has failed: ${context.error || 'Unknown error'}`,
        color: 'danger',
        fields: [
          ...baseFields,
          { name: 'Error', value: context.error || 'Unknown' },
        ],
        actions: [
          { name: 'View Logs', url: `claude://deploy/logs/${context.id}` },
          { name: 'Rollback', url: `claude://deploy/rollback/${context.id}` },
        ],
      };

    case 'pipeline.rollback':
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Deployment Rolled Back',
        message: `Deployment ${context.id} has been rolled back`,
        color: 'warning',
        fields: baseFields,
      };

    case 'pipeline.stage.completed':
      return {
        event: notificationEvent,
        deployment: context,
        title: `Stage Completed: ${formatState(context.currentState)}`,
        message: `Deployment ${context.id} progressed to ${context.currentState}`,
        color: 'info',
        fields: baseFields,
      };

    default:
      return {
        event: notificationEvent,
        deployment: context,
        title: 'Pipeline Update',
        message: `Deployment ${context.id} updated`,
        color: 'info',
        fields: baseFields,
      };
  }
}

/**
 * DeploymentNotifier
 * Sends notifications across configured channels
 */
export class DeploymentNotifier {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  /**
   * Send notification for deployment event
   */
  async notify(
    state: DeploymentState,
    context: DeploymentContext,
    event?: DeploymentEvent
  ): Promise<void> {
    const notificationEvent = mapToNotificationEvent(state, event);

    if (!notificationEvent) {
      return; // No notification for this state
    }

    // Check event filter
    if (this.config.eventFilters && !this.config.eventFilters.includes(notificationEvent)) {
      return;
    }

    const payload = createPayload(notificationEvent, context);

    // Send to all configured channels
    const promises = this.config.channels.map(channel => {
      switch (channel) {
        case 'slack':
          return this.sendSlack(payload);
        case 'teams':
          return this.sendTeams(payload);
        case 'email':
          return this.sendEmail(payload);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(payload: NotificationPayload): Promise<void> {
    if (!this.config.slack?.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return;
    }

    const slackPayload = {
      channel: this.config.slack.channel,
      username: this.config.slack.username || 'Deployment Bot',
      icon_emoji: this.config.slack.iconEmoji || ':rocket:',
      attachments: [
        {
          color: this.getSlackColor(payload.color),
          title: payload.title,
          text: payload.message,
          fields: payload.fields?.map(f => ({
            title: f.name,
            value: f.value,
            short: true,
          })),
          actions: payload.actions?.map(a => ({
            type: 'button',
            text: a.name,
            url: a.url,
          })),
          footer: `Deployment ID: ${payload.deployment.id}`,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    // In production, this would make an HTTP request
    console.log('[Slack Notification]', JSON.stringify(slackPayload, null, 2));
  }

  /**
   * Send Teams notification
   */
  private async sendTeams(payload: NotificationPayload): Promise<void> {
    if (!this.config.teams?.webhookUrl) {
      console.warn('Teams webhook URL not configured');
      return;
    }

    const teamsPayload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: this.getTeamsColor(payload.color),
      summary: payload.title,
      sections: [
        {
          activityTitle: payload.title,
          activitySubtitle: payload.message,
          facts: payload.fields?.map(f => ({
            name: f.name,
            value: f.value,
          })),
        },
      ],
      potentialAction: payload.actions?.map(a => ({
        '@type': 'OpenUri',
        name: a.name,
        targets: [{ os: 'default', uri: a.url }],
      })),
    };

    // In production, this would make an HTTP request
    console.log('[Teams Notification]', JSON.stringify(teamsPayload, null, 2));
  }

  /**
   * Send Email notification
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    if (!this.config.email) {
      console.warn('Email configuration not provided');
      return;
    }

    const emailPayload = {
      from: this.config.email.from,
      to: this.config.email.to.join(', '),
      subject: `[Deployment] ${payload.title}`,
      html: this.generateEmailHtml(payload),
    };

    // In production, this would send via SMTP
    console.log('[Email Notification]', JSON.stringify(emailPayload, null, 2));
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(payload: NotificationPayload): string {
    const fieldsHtml = payload.fields
      ?.map(f => `<tr><td><strong>${f.name}:</strong></td><td>${f.value}</td></tr>`)
      .join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: ${this.getHexColor(payload.color)};">${payload.title}</h2>
          <p>${payload.message}</p>
          <table style="border-collapse: collapse; margin-top: 15px;">
            ${fieldsHtml}
          </table>
          <p style="color: #888; margin-top: 20px; font-size: 12px;">
            Deployment ID: ${payload.deployment.id}
          </p>
        </body>
      </html>
    `;
  }

  private getSlackColor(color: string): string {
    const colors: Record<string, string> = {
      good: 'good',
      warning: 'warning',
      danger: 'danger',
      info: '#3498db',
    };
    return colors[color] || '#888888';
  }

  private getTeamsColor(color: string): string {
    const colors: Record<string, string> = {
      good: '2ecc71',
      warning: 'f39c12',
      danger: 'e74c3c',
      info: '3498db',
    };
    return colors[color] || '888888';
  }

  private getHexColor(color: string): string {
    const colors: Record<string, string> = {
      good: '#2ecc71',
      warning: '#f39c12',
      danger: '#e74c3c',
      info: '#3498db',
    };
    return colors[color] || '#888888';
  }
}

// Helper functions
function calculateDuration(start: Date, end: Date): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatState(state: string): string {
  return state
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
