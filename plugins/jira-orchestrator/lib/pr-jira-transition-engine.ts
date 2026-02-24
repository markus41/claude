import { createHash } from 'node:crypto';

export type PullRequestEventType = 'opened' | 'ready-for-review' | 'approved' | 'merged' | 'closed';

export interface PullRequestEvent {
  issueKey: string;
  pullRequestId: string;
  pullRequestNumber: number;
  action: PullRequestEventType;
  occurredAt: string;
  eventId?: string;
  merged?: boolean;
  isDraft?: boolean;
  repository?: string;
  actor?: string;
}

export interface JiraPrTransitionAction {
  transition: string;
  comment: string;
  properties: Record<string, string>;
}

interface IssueEventState {
  lastOccurredAtMs: number;
  seenEventIds: Set<string>;
}

export interface JiraTransitionContext {
  jiraCurrentState?: string;
  jiraIssueProperties?: Record<string, string>;
}

export interface JiraTransitionDecision {
  skipped: boolean;
  reason?:
    | 'duplicate_event_id'
    | 'duplicate_event_hash'
    | 'out_of_order_event'
    | 'no_transition_required'
    | 'already_in_state';
  action?: JiraPrTransitionAction;
  propertyUpdates: Record<string, string>;
}

const PROP_LAST_EVENT_HASH = 'jiraOrchestrator.pr.lastAppliedEventHash';
const PROP_LAST_EVENT_AT = 'jiraOrchestrator.pr.lastAppliedOccurredAt';
const PROP_LAST_EVENT_ACTION = 'jiraOrchestrator.pr.lastAppliedAction';

export class PrJiraTransitionEngine {
  private readonly issueStates = new Map<string, IssueEventState>();

  decide(event: PullRequestEvent, context: JiraTransitionContext = {}): JiraTransitionDecision {
    const issueState = this.getIssueState(event.issueKey);
    const occurredAtMs = Date.parse(event.occurredAt);

    if (event.eventId && issueState.seenEventIds.has(event.eventId)) {
      return { skipped: true, reason: 'duplicate_event_id', propertyUpdates: {} };
    }

    const lastAppliedMs = this.getLastAppliedMs(context.jiraIssueProperties);
    const lastSeenMs = Math.max(issueState.lastOccurredAtMs, lastAppliedMs);
    if (Number.isFinite(occurredAtMs) && occurredAtMs < lastSeenMs) {
      this.markProcessed(issueState, event, occurredAtMs);
      return { skipped: true, reason: 'out_of_order_event', propertyUpdates: {} };
    }

    const eventHash = this.buildEventHash(event);
    if (context.jiraIssueProperties?.[PROP_LAST_EVENT_HASH] === eventHash) {
      this.markProcessed(issueState, event, occurredAtMs);
      return { skipped: true, reason: 'duplicate_event_hash', propertyUpdates: {} };
    }

    const previousAction = context.jiraIssueProperties?.[PROP_LAST_EVENT_ACTION];
    const mapped = this.mapEventToTransition(event, previousAction);
    if (!mapped) {
      this.markProcessed(issueState, event, occurredAtMs);
      return { skipped: true, reason: 'no_transition_required', propertyUpdates: this.buildPropertyUpdates(eventHash, event) };
    }

    if (context.jiraCurrentState && context.jiraCurrentState === mapped.transition) {
      this.markProcessed(issueState, event, occurredAtMs);
      return { skipped: true, reason: 'already_in_state', propertyUpdates: this.buildPropertyUpdates(eventHash, event) };
    }

    const action: JiraPrTransitionAction = {
      transition: mapped.transition,
      comment: mapped.comment,
      properties: {
        jiraIssueKey: event.issueKey,
        pullRequestId: event.pullRequestId,
        pullRequestNumber: String(event.pullRequestNumber),
        pullRequestAction: event.action,
        pullRequestMerged: String(Boolean(event.merged)),
      },
    };

    const propertyUpdates = this.buildPropertyUpdates(eventHash, event);
    this.markProcessed(issueState, event, occurredAtMs);

    return { skipped: false, action, propertyUpdates };
  }

  private mapEventToTransition(event: PullRequestEvent, previousAction?: string): { transition: string; comment: string } | undefined {
    const ref = event.repository ? `${event.repository}#${event.pullRequestNumber}` : `#${event.pullRequestNumber}`;

    switch (event.action) {
      case 'opened': {
        if (previousAction === 'closed' && !event.isDraft) {
          return {
            transition: 'In Review',
            comment: `PR ${ref} was reopened after being closed without merge; moving issue back to In Review.`,
          };
        }

        return {
          transition: event.isDraft ? 'In Progress' : 'In Review',
          comment: event.isDraft
            ? `Draft PR ${ref} opened; tracking implementation progress in Jira.`
            : `PR ${ref} opened and ready for review; moving Jira issue to In Review.`,
        };
      }
      case 'ready-for-review':
        return {
          transition: 'In Review',
          comment: `PR ${ref} marked ready for review; Jira issue advanced to In Review.`,
        };
      case 'approved':
        return {
          transition: 'Approved',
          comment: `PR ${ref} approved by reviewers; Jira issue marked as Approved.`,
        };
      case 'merged':
        return {
          transition: 'Done',
          comment: `PR ${ref} merged; Jira issue transitioned to Done.`,
        };
      case 'closed':
        if (event.merged) {
          return {
            transition: 'Done',
            comment: `PR ${ref} closed after merge; Jira issue remains Done.`,
          };
        }

        return {
          transition: 'In Progress',
          comment: `PR ${ref} closed without merge; compensating Jira state back to In Progress.`,
        };
      default:
        return undefined;
    }
  }

  private buildEventHash(event: PullRequestEvent): string {
    const payload = {
      issueKey: event.issueKey,
      pullRequestId: event.pullRequestId,
      pullRequestNumber: event.pullRequestNumber,
      action: event.action,
      occurredAt: event.occurredAt,
      merged: Boolean(event.merged),
      isDraft: Boolean(event.isDraft),
      repository: event.repository ?? '',
      actor: event.actor ?? '',
    };

    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private buildPropertyUpdates(eventHash: string, event: PullRequestEvent): Record<string, string> {
    return {
      [PROP_LAST_EVENT_HASH]: eventHash,
      [PROP_LAST_EVENT_AT]: event.occurredAt,
      [PROP_LAST_EVENT_ACTION]: event.action,
    };
  }

  private getIssueState(issueKey: string): IssueEventState {
    const existing = this.issueStates.get(issueKey);
    if (existing) {
      return existing;
    }

    const created: IssueEventState = {
      lastOccurredAtMs: 0,
      seenEventIds: new Set<string>(),
    };
    this.issueStates.set(issueKey, created);
    return created;
  }

  private getLastAppliedMs(jiraIssueProperties?: Record<string, string>): number {
    const raw = jiraIssueProperties?.[PROP_LAST_EVENT_AT];
    if (!raw) {
      return 0;
    }

    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private markProcessed(issueState: IssueEventState, event: PullRequestEvent, occurredAtMs: number): void {
    if (event.eventId) {
      issueState.seenEventIds.add(event.eventId);
    }
    if (Number.isFinite(occurredAtMs)) {
      issueState.lastOccurredAtMs = Math.max(issueState.lastOccurredAtMs, occurredAtMs);
    }
  }
}

export const PrJiraPropertyKeys = {
  lastAppliedEventHash: PROP_LAST_EVENT_HASH,
  lastAppliedOccurredAt: PROP_LAST_EVENT_AT,
  lastAppliedAction: PROP_LAST_EVENT_ACTION,
};
