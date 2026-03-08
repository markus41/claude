import { describe, expect, it } from 'vitest';
import { PrJiraPropertyKeys, PrJiraTransitionEngine } from '../../lib/pr-jira-transition-engine';

describe('pr jira transition engine', () => {
  it('maps PR lifecycle events into Jira transitions', () => {
    const engine = new PrJiraTransitionEngine();

    const opened = engine.decide({
      issueKey: 'PROJ-101',
      pullRequestId: 'pr-1',
      pullRequestNumber: 12,
      action: 'opened',
      isDraft: true,
      occurredAt: '2026-01-01T09:00:00.000Z',
    });

    const ready = engine.decide({
      issueKey: 'PROJ-101',
      pullRequestId: 'pr-1',
      pullRequestNumber: 12,
      action: 'ready-for-review',
      occurredAt: '2026-01-01T09:10:00.000Z',
    });

    const approved = engine.decide({
      issueKey: 'PROJ-101',
      pullRequestId: 'pr-1',
      pullRequestNumber: 12,
      action: 'approved',
      occurredAt: '2026-01-01T09:20:00.000Z',
    });

    const merged = engine.decide({
      issueKey: 'PROJ-101',
      pullRequestId: 'pr-1',
      pullRequestNumber: 12,
      action: 'merged',
      merged: true,
      occurredAt: '2026-01-01T09:30:00.000Z',
    });

    expect(opened.action?.transition).toBe('In Progress');
    expect(ready.action?.transition).toBe('In Review');
    expect(approved.action?.transition).toBe('Approved');
    expect(merged.action?.transition).toBe('Done');
  });

  it('uses Jira issue property hash to prevent duplicate webhook processing', () => {
    const engine = new PrJiraTransitionEngine();
    const event = {
      issueKey: 'PROJ-102',
      pullRequestId: 'pr-2',
      pullRequestNumber: 44,
      action: 'approved' as const,
      occurredAt: '2026-01-01T10:00:00.000Z',
    };

    const first = engine.decide(event);
    const second = engine.decide(event, { jiraIssueProperties: first.propertyUpdates });

    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('duplicate_event_hash');
  });

  it('skips out-of-order events using Jira persisted occurredAt property', () => {
    const engine = new PrJiraTransitionEngine();

    const stale = engine.decide(
      {
        issueKey: 'PROJ-103',
        pullRequestId: 'pr-3',
        pullRequestNumber: 99,
        action: 'opened',
        occurredAt: '2026-01-01T09:59:00.000Z',
      },
      {
        jiraIssueProperties: {
          [PrJiraPropertyKeys.lastAppliedOccurredAt]: '2026-01-01T10:00:00.000Z',
        },
      },
    );

    expect(stale.skipped).toBe(true);
    expect(stale.reason).toBe('out_of_order_event');
  });

  it('applies compensation when PR is closed without merge and supports reopen', () => {
    const engine = new PrJiraTransitionEngine();

    const closed = engine.decide({
      issueKey: 'PROJ-104',
      pullRequestId: 'pr-4',
      pullRequestNumber: 101,
      action: 'closed',
      merged: false,
      occurredAt: '2026-01-01T10:10:00.000Z',
    });

    const reopened = engine.decide(
      {
        issueKey: 'PROJ-104',
        pullRequestId: 'pr-4',
        pullRequestNumber: 101,
        action: 'opened',
        isDraft: false,
        occurredAt: '2026-01-01T10:20:00.000Z',
      },
      {
        jiraIssueProperties: {
          ...closed.propertyUpdates,
          [PrJiraPropertyKeys.lastAppliedAction]: 'closed',
        },
      },
    );

    expect(closed.action?.transition).toBe('In Progress');
    expect(closed.action?.comment).toContain('closed without merge');
    expect(reopened.action?.transition).toBe('In Review');
    expect(reopened.action?.comment).toContain('reopened');
  });
});
