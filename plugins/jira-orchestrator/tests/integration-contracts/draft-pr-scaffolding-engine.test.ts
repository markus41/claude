import { describe, expect, it } from 'vitest';
import { DraftPrScaffoldingConstants, DraftPrScaffoldingEngine } from '../../lib/draft-pr-scaffolding-engine';

describe('draft pr scaffolding engine', () => {
  it('creates draft PR scaffolding exactly when issue transitions to In Progress', () => {
    const engine = new DraftPrScaffoldingEngine();

    const todoTransition = engine.shouldCreateDraftPr({
      issue: {
        issueKey: 'PROJ-201',
        summary: 'Add auto draft PR',
        acceptanceCriteria: ['Draft PR created on work start'],
      },
      fromStatus: 'Backlog',
      toStatus: 'To Do',
      occurredAt: '2026-02-01T10:00:00.000Z',
    });

    const inProgressTransition = engine.shouldCreateDraftPr({
      issue: {
        issueKey: 'PROJ-201',
        summary: 'Add auto draft PR',
        description: 'Scaffold PR body from Jira context',
        acceptanceCriteria: ['Draft PR created on work start', 'Checklist prefilled from Jira'],
      },
      fromStatus: 'To Do',
      toStatus: 'In Progress',
      occurredAt: '2026-02-01T10:05:00.000Z',
    });

    expect(todoTransition.type).toBe('noop');
    expect(todoTransition.reason).toBe('not_in_progress_transition');

    expect(inProgressTransition.type).toBe('create_draft_pr');
    expect(inProgressTransition.title).toContain('PROJ-201');
    expect(inProgressTransition.body).toContain('## Jira Context');
    expect(inProgressTransition.body).toContain('## Initial Checklist');
    expect(inProgressTransition.sourceCommands).toEqual([
      'plugins/jira-orchestrator/commands/work.md',
      'plugins/jira-orchestrator/commands/pr.md',
    ]);
  });

  it('syncs checklist when key Jira fields change and appends commit progress notes', () => {
    const engine = new DraftPrScaffoldingEngine();

    const sync = engine.shouldSyncChecklist(
      {
        issue: {
          issueKey: 'PROJ-202',
          summary: 'Keep checklist in sync',
          acceptanceCriteria: ['Sync on acceptance criteria updates', 'Sync on description updates'],
        },
        changedFields: ['acceptanceCriteria'],
        occurredAt: '2026-02-01T11:00:00.000Z',
      },
      { draftPrNumber: 77 },
    );

    const append = engine.appendProgressFromCommit(
      {
        issueKey: 'PROJ-202',
        commitSha: 'abcdef1234567890',
        commitMessage: 'Add checklist sync handler',
        author: 'Dev User',
        occurredAt: '2026-02-01T11:15:00.000Z',
      },
      { draftPrNumber: 77 },
    );

    expect(sync.type).toBe('sync_checklist');
    expect(sync.bodyUpdateMode).toBe('replace');
    expect(sync.body).toContain('AC1');

    expect(append.type).toBe('append_progress_note');
    expect(append.bodyUpdateMode).toBe('append');
    expect(append.body).toContain('abcdef12');
  });

  it('respects no-draft-pr opt-out label for creation and sync', () => {
    const engine = new DraftPrScaffoldingEngine();

    const create = engine.shouldCreateDraftPr({
      issue: {
        issueKey: 'PROJ-203',
        summary: 'Skip draft PR',
        labels: [DraftPrScaffoldingConstants.optOutLabel],
      },
      fromStatus: 'To Do',
      toStatus: 'In Progress',
      occurredAt: '2026-02-01T12:00:00.000Z',
    });

    const sync = engine.shouldSyncChecklist(
      {
        issue: {
          issueKey: 'PROJ-203',
          summary: 'Skip draft PR',
          labels: [DraftPrScaffoldingConstants.optOutLabel],
        },
        changedFields: ['summary'],
        occurredAt: '2026-02-01T12:05:00.000Z',
      },
      { draftPrNumber: 88 },
    );

    expect(create.type).toBe('noop');
    expect(create.reason).toBe('opted_out_by_label');
    expect(sync.type).toBe('noop');
    expect(sync.reason).toBe('opted_out_by_label');
  });
});
