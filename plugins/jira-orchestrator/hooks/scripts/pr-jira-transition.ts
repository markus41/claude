#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { PrJiraTransitionEngine } from '../../lib/pr-jira-transition-engine';

interface HookPayload {
  issueKey: string;
  pullRequestId: string;
  pullRequestNumber: number;
  action: 'opened' | 'ready-for-review' | 'approved' | 'merged' | 'closed';
  occurredAt: string;
  eventId?: string;
  merged?: boolean;
  isDraft?: boolean;
  repository?: string;
  actor?: string;
  jiraCurrentState?: string;
  jiraIssueProperties?: Record<string, string>;
}

function readPayload(): HookPayload {
  const arg = process.argv[2];
  if (arg && arg.trim().startsWith('{')) {
    return JSON.parse(arg) as HookPayload;
  }

  if (arg) {
    return JSON.parse(readFileSync(arg, 'utf8')) as HookPayload;
  }

  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) {
    throw new Error('Missing PR event payload. Provide JSON via arg/file/stdin.');
  }

  return JSON.parse(raw) as HookPayload;
}

function main(): void {
  const payload = readPayload();
  const engine = new PrJiraTransitionEngine();

  const decision = engine.decide(
    {
      issueKey: payload.issueKey,
      pullRequestId: payload.pullRequestId,
      pullRequestNumber: payload.pullRequestNumber,
      action: payload.action,
      occurredAt: payload.occurredAt,
      eventId: payload.eventId,
      merged: payload.merged,
      isDraft: payload.isDraft,
      repository: payload.repository,
      actor: payload.actor,
    },
    {
      jiraCurrentState: payload.jiraCurrentState,
      jiraIssueProperties: payload.jiraIssueProperties,
    },
  );

  process.stdout.write(`${JSON.stringify(decision)}\n`);
}

main();
