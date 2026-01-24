/**
 * Deployment Pipeline State Machine
 *
 * Implements a robust state machine for managing deployment workflows
 * with persistence, retry logic, and notification integration.
 */

export type DeploymentState =
  | 'pending'
  | 'validating'
  | 'building'
  | 'testing'
  | 'deploying-dev'
  | 'deploying-staging'
  | 'awaiting-approval'
  | 'deploying-prod'
  | 'completed'
  | 'failed'
  | 'rolled-back';

export type DeploymentEvent =
  | 'START'
  | 'VALIDATION_COMPLETE'
  | 'BUILD_COMPLETE'
  | 'TESTS_PASSED'
  | 'DEV_DEPLOYED'
  | 'STAGING_DEPLOYED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROD_DEPLOYED'
  | 'FAILURE'
  | 'ROLLBACK';

export interface StateTransition {
  from: DeploymentState;
  event: DeploymentEvent;
  to: DeploymentState;
  guard?: (context: DeploymentContext) => boolean;
  action?: (context: DeploymentContext) => Promise<void>;
}

export interface DeploymentContext {
  id: string;
  repository: string;
  branch: string;
  commitSha: string;
  environment: 'dev' | 'staging' | 'prod';
  startedAt: Date;
  updatedAt: Date;
  currentState: DeploymentState;
  stateHistory: StateHistoryEntry[];
  metadata: Record<string, unknown>;
  retryCount: number;
  approvedBy?: string;
  approvedAt?: Date;
  error?: string;
}

export interface StateHistoryEntry {
  state: DeploymentState;
  timestamp: Date;
  event?: DeploymentEvent;
  actor?: string;
  metadata?: Record<string, unknown>;
}

/**
 * State Machine Transitions
 * Defines all valid state transitions for the deployment pipeline
 */
export const transitions: StateTransition[] = [
  // Start pipeline
  { from: 'pending', event: 'START', to: 'validating' },

  // Validation phase
  { from: 'validating', event: 'VALIDATION_COMPLETE', to: 'building' },
  { from: 'validating', event: 'FAILURE', to: 'failed' },

  // Build phase
  { from: 'building', event: 'BUILD_COMPLETE', to: 'testing' },
  { from: 'building', event: 'FAILURE', to: 'failed' },

  // Testing phase
  { from: 'testing', event: 'TESTS_PASSED', to: 'deploying-dev' },
  { from: 'testing', event: 'FAILURE', to: 'failed' },

  // Dev deployment
  { from: 'deploying-dev', event: 'DEV_DEPLOYED', to: 'deploying-staging' },
  { from: 'deploying-dev', event: 'FAILURE', to: 'failed' },

  // Staging deployment
  { from: 'deploying-staging', event: 'STAGING_DEPLOYED', to: 'awaiting-approval' },
  { from: 'deploying-staging', event: 'FAILURE', to: 'failed' },

  // Approval gate
  { from: 'awaiting-approval', event: 'APPROVED', to: 'deploying-prod' },
  { from: 'awaiting-approval', event: 'REJECTED', to: 'failed' },

  // Production deployment
  { from: 'deploying-prod', event: 'PROD_DEPLOYED', to: 'completed' },
  { from: 'deploying-prod', event: 'FAILURE', to: 'failed' },

  // Rollback from any deploying state
  { from: 'deploying-dev', event: 'ROLLBACK', to: 'rolled-back' },
  { from: 'deploying-staging', event: 'ROLLBACK', to: 'rolled-back' },
  { from: 'deploying-prod', event: 'ROLLBACK', to: 'rolled-back' },
  { from: 'failed', event: 'ROLLBACK', to: 'rolled-back' },
];

/**
 * DeploymentStateMachine
 * Manages state transitions with validation, persistence, and notifications
 */
export class DeploymentStateMachine {
  private context: DeploymentContext;
  private onTransition?: (from: DeploymentState, to: DeploymentState, event: DeploymentEvent) => Promise<void>;

  constructor(context: DeploymentContext) {
    this.context = context;
  }

  /**
   * Get current state
   */
  get currentState(): DeploymentState {
    return this.context.currentState;
  }

  /**
   * Get full context
   */
  get deploymentContext(): DeploymentContext {
    return { ...this.context };
  }

  /**
   * Check if transition is valid
   */
  canTransition(event: DeploymentEvent): boolean {
    return transitions.some(
      t => t.from === this.context.currentState && t.event === event
    );
  }

  /**
   * Get available events for current state
   */
  getAvailableEvents(): DeploymentEvent[] {
    return transitions
      .filter(t => t.from === this.context.currentState)
      .map(t => t.event);
  }

  /**
   * Execute state transition
   */
  async transition(event: DeploymentEvent, actor?: string, metadata?: Record<string, unknown>): Promise<DeploymentState> {
    const validTransition = transitions.find(
      t => t.from === this.context.currentState && t.event === event
    );

    if (!validTransition) {
      throw new Error(
        `Invalid transition: Cannot process event '${event}' in state '${this.context.currentState}'`
      );
    }

    // Check guard condition if present
    if (validTransition.guard && !validTransition.guard(this.context)) {
      throw new Error(
        `Transition guard failed: Event '${event}' blocked by guard condition`
      );
    }

    const previousState = this.context.currentState;

    // Update context
    this.context.currentState = validTransition.to;
    this.context.updatedAt = new Date();
    this.context.stateHistory.push({
      state: validTransition.to,
      timestamp: new Date(),
      event,
      actor,
      metadata,
    });

    // Execute action if present
    if (validTransition.action) {
      await validTransition.action(this.context);
    }

    // Notify listeners
    if (this.onTransition) {
      await this.onTransition(previousState, validTransition.to, event);
    }

    return validTransition.to;
  }

  /**
   * Set transition callback
   */
  setOnTransition(callback: (from: DeploymentState, to: DeploymentState, event: DeploymentEvent) => Promise<void>) {
    this.onTransition = callback;
  }

  /**
   * Check if pipeline is in terminal state
   */
  isComplete(): boolean {
    return ['completed', 'failed', 'rolled-back'].includes(this.context.currentState);
  }

  /**
   * Get state history
   */
  getHistory(): StateHistoryEntry[] {
    return [...this.context.stateHistory];
  }

  /**
   * Serialize context for persistence
   */
  serialize(): string {
    return JSON.stringify(this.context, null, 2);
  }

  /**
   * Deserialize context from persistence
   */
  static deserialize(json: string): DeploymentStateMachine {
    const context = JSON.parse(json) as DeploymentContext;
    context.startedAt = new Date(context.startedAt);
    context.updatedAt = new Date(context.updatedAt);
    context.stateHistory = context.stateHistory.map(h => ({
      ...h,
      timestamp: new Date(h.timestamp),
    }));
    return new DeploymentStateMachine(context);
  }
}

/**
 * Create a new deployment context
 */
export function createDeploymentContext(
  repository: string,
  branch: string,
  commitSha: string
): DeploymentContext {
  return {
    id: `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    repository,
    branch,
    commitSha,
    environment: 'dev',
    startedAt: new Date(),
    updatedAt: new Date(),
    currentState: 'pending',
    stateHistory: [
      {
        state: 'pending',
        timestamp: new Date(),
      },
    ],
    metadata: {},
    retryCount: 0,
  };
}
