/**
 * Deployment Pipeline Plugin
 *
 * Main entry point for the deployment pipeline plugin.
 * Exports all core functionality for workflow orchestration.
 */

// Workflow
export {
  DeploymentStateMachine,
  DeploymentState,
  DeploymentEvent,
  DeploymentContext,
  StateHistoryEntry,
  StateTransition,
  createDeploymentContext,
  transitions,
} from './workflow/state-machine';

export {
  RetryHandler,
  RetryConfig,
  RetryResult,
  withRetry,
  retryHandler,
} from './workflow/retry-handler';

// Persistence
export {
  WorkflowStore,
  WorkflowStoreConfig,
  workflowStore,
} from './persistence/workflow-store';

// Notifications
export {
  DeploymentNotifier,
  NotificationChannel,
  NotificationConfig,
  NotificationEvent,
  NotificationPayload,
  createPayload,
  mapToNotificationEvent,
} from './notifications/notifier';

// Plugin metadata
export const pluginInfo = {
  name: 'deployment-pipeline',
  version: '1.0.0',
  description: 'Harness CD integration pipeline with state-machine workflow orchestration',
  author: 'Markus Ahling',
  commands: 5,
  agents: 3,
  features: ['persistence', 'retry', 'notifications'],
};
