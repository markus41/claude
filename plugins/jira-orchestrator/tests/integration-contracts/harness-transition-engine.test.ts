import { describe, expect, it } from 'vitest';
import { HarnessTransitionEngine, loadHarnessTransitionMap } from '../../lib/harness-transition-engine';

describe('harness transition engine', () => {
  it('maps edge-case Harness outcomes to Jira transitions', () => {
    const engine = new HarnessTransitionEngine(loadHarnessTransitionMap());

    const manualApprovalTimeout = engine.decide({
      executionId: 'exec-edge-1',
      state: 'FAILED',
      failureStrategyOutcome: 'MANUAL_APPROVAL_TIMEOUT',
      occurredAt: '2026-01-01T10:00:00.000Z',
    });
    const abortedDeployment = engine.decide({
      executionId: 'exec-edge-2',
      state: 'ABORTED',
      occurredAt: '2026-01-01T10:01:00.000Z',
    });
    const partialRollback = engine.decide({
      executionId: 'exec-edge-3',
      state: 'ROLLBACK_RUNNING',
      failureStrategyOutcome: 'PARTIAL_ROLLBACK',
      occurredAt: '2026-01-01T10:02:00.000Z',
    });
    const verificationFailure = engine.decide({
      executionId: 'exec-edge-4',
      state: 'VERIFYING',
      failureStrategyOutcome: 'POST_DEPLOY_VERIFICATION_FAILED',
      occurredAt: '2026-01-01T10:03:00.000Z',
    });
    const redeployAfterRollback = engine.decide({
      executionId: 'exec-edge-5',
      state: 'REDEPLOYED',
      failureStrategyOutcome: 'AFTER_ROLLBACK',
      occurredAt: '2026-01-01T10:04:00.000Z',
    });

    expect(manualApprovalTimeout.action?.transition).toBe('Blocked');
    expect(abortedDeployment.action?.transition).toBe('Aborted');
    expect(partialRollback.action?.transition).toBe('Rollback In Progress');
    expect(verificationFailure.action?.transition).toBe('Verification Failed');
    expect(redeployAfterRollback.action?.transition).toBe('Ready for Redeploy Validation');
  });

  it('skips duplicate webhook deliveries idempotently', () => {
    const engine = new HarnessTransitionEngine(loadHarnessTransitionMap());
    const event = {
      executionId: 'exec-dup',
      eventId: 'evt-1',
      state: 'RUNNING',
      occurredAt: '2026-01-01T11:00:00.000Z',
    };

    const first = engine.decide(event);
    const duplicate = engine.decide(event);

    expect(first.skipped).toBe(false);
    expect(duplicate.skipped).toBe(true);
    expect(duplicate.reason).toBe('duplicate_event');
  });

  it('skips out-of-order execution events safely', () => {
    const engine = new HarnessTransitionEngine(loadHarnessTransitionMap());

    const latest = engine.decide({
      executionId: 'exec-order',
      eventId: 'evt-latest',
      state: 'RUNNING',
      occurredAt: '2026-01-01T11:10:00.000Z',
    });

    const stale = engine.decide({
      executionId: 'exec-order',
      eventId: 'evt-stale',
      state: 'QUEUED',
      occurredAt: '2026-01-01T11:09:00.000Z',
    });

    expect(latest.skipped).toBe(false);
    expect(stale.skipped).toBe(true);
    expect(stale.reason).toBe('out_of_order_event');
  });

  it('skips already-applied transitions when webhook retries omit event IDs', () => {
    const engine = new HarnessTransitionEngine(loadHarnessTransitionMap());

    const first = engine.decide({
      executionId: 'exec-idempotent',
      state: 'RUNNING',
      occurredAt: '2026-01-01T12:00:00.000Z',
    });

    const second = engine.decide({
      executionId: 'exec-idempotent',
      state: 'RUNNING',
      occurredAt: '2026-01-01T12:00:01.000Z',
    });

    expect(first.skipped).toBe(false);
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe('already_applied');
  });
});
