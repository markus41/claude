export interface JiraIssueContext {
  issueKey: string;
  summary: string;
  description?: string;
  labels?: string[];
  acceptanceCriteria?: string[];
  status?: string;
}

export interface JiraTransitionEvent {
  issue: JiraIssueContext;
  fromStatus?: string;
  toStatus: string;
  occurredAt: string;
}

export interface JiraIssueUpdateEvent {
  issue: JiraIssueContext;
  changedFields: string[];
  occurredAt: string;
}

export interface CommitProgressEvent {
  issueKey: string;
  commitSha: string;
  commitMessage: string;
  author?: string;
  occurredAt: string;
}

export interface DraftPrScaffoldContext {
  draftPrNumber?: number;
  draftPrBody?: string;
}

export interface DraftPrAction {
  type: 'create_draft_pr' | 'sync_checklist' | 'append_progress_note' | 'noop';
  issueKey: string;
  reason?: string;
  title?: string;
  body?: string;
  bodyUpdateMode?: 'replace' | 'append';
  sourceCommands?: string[];
}

const OPT_OUT_LABEL = 'no-draft-pr';
const KEY_UPDATE_FIELDS = new Set(['summary', 'description', 'acceptanceCriteria', 'status']);

export class DraftPrScaffoldingEngine {
  shouldCreateDraftPr(event: JiraTransitionEvent, context: DraftPrScaffoldContext = {}): DraftPrAction {
    const labels = event.issue.labels ?? [];
    if (labels.some((label) => label.toLowerCase() === OPT_OUT_LABEL)) {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'opted_out_by_label' };
    }

    if (context.draftPrNumber) {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'draft_pr_already_exists' };
    }

    if (event.toStatus !== 'In Progress') {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'not_in_progress_transition' };
    }

    return {
      type: 'create_draft_pr',
      issueKey: event.issue.issueKey,
      title: `[DRAFT] ${event.issue.issueKey}: ${event.issue.summary}`,
      body: this.renderDraftBody(event.issue),
      bodyUpdateMode: 'replace',
      sourceCommands: ['plugins/jira-orchestrator/commands/work.md', 'plugins/jira-orchestrator/commands/pr.md'],
    };
  }

  shouldSyncChecklist(event: JiraIssueUpdateEvent, context: DraftPrScaffoldContext = {}): DraftPrAction {
    if (!context.draftPrNumber) {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'no_draft_pr' };
    }

    const labels = event.issue.labels ?? [];
    if (labels.some((label) => label.toLowerCase() === OPT_OUT_LABEL)) {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'opted_out_by_label' };
    }

    const hasKeyUpdate = event.changedFields.some((field) => KEY_UPDATE_FIELDS.has(field));
    if (!hasKeyUpdate) {
      return { type: 'noop', issueKey: event.issue.issueKey, reason: 'no_key_fields_changed' };
    }

    return {
      type: 'sync_checklist',
      issueKey: event.issue.issueKey,
      body: this.renderChecklist(event.issue),
      bodyUpdateMode: 'replace',
      reason: 'jira_context_updated',
    };
  }

  appendProgressFromCommit(event: CommitProgressEvent, context: DraftPrScaffoldContext = {}): DraftPrAction {
    if (!context.draftPrNumber) {
      return { type: 'noop', issueKey: event.issueKey, reason: 'no_draft_pr' };
    }

    return {
      type: 'append_progress_note',
      issueKey: event.issueKey,
      bodyUpdateMode: 'append',
      body: `\n- ${event.occurredAt}: ${event.commitSha.slice(0, 8)} — ${event.commitMessage}${event.author ? ` (by ${event.author})` : ''}`,
      reason: 'commit_progress',
    };
  }

  private renderDraftBody(issue: JiraIssueContext): string {
    const checklist = this.renderChecklist(issue);
    return `## Jira Context\n- Issue: ${issue.issueKey}\n- Summary: ${issue.summary}\n- Status: ${issue.status ?? 'In Progress'}\n\n## Description\n${issue.description?.trim() || '_No description provided._'}\n\n${checklist}\n\n## Progress Notes\n- Draft PR scaffolding created from /jira:work transition to In Progress.`;
  }

  private renderChecklist(issue: JiraIssueContext): string {
    const criteria = issue.acceptanceCriteria?.length
      ? issue.acceptanceCriteria
      : ['Clarify acceptance criteria in Jira issue'];

    const lines = criteria.map((criterion, index) => `- [ ] AC${index + 1}: ${criterion}`);
    return `## Initial Checklist\n${lines.join('\n')}`;
  }
}

export const DraftPrScaffoldingConstants = {
  optOutLabel: OPT_OUT_LABEL,
};
