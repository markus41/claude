#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  DraftPrScaffoldingEngine,
  type CommitProgressEvent,
  type DraftPrScaffoldContext,
  type JiraIssueUpdateEvent,
  type JiraTransitionEvent,
} from '../../lib/draft-pr-scaffolding-engine';

type Payload =
  | { eventType: 'jira-transition'; event: JiraTransitionEvent; context?: DraftPrScaffoldContext }
  | { eventType: 'jira-update'; event: JiraIssueUpdateEvent; context?: DraftPrScaffoldContext }
  | { eventType: 'commit-progress'; event: CommitProgressEvent; context?: DraftPrScaffoldContext };

function readPayload(): Payload {
  const arg = process.argv[2];
  if (arg && arg.trim().startsWith('{')) {
    return JSON.parse(arg) as Payload;
  }

  if (arg) {
    return JSON.parse(readFileSync(arg, 'utf8')) as Payload;
  }

  const raw = readFileSync(0, 'utf8').trim();
  if (!raw) {
    throw new Error('Missing scaffold payload. Provide JSON via arg/file/stdin.');
  }

  return JSON.parse(raw) as Payload;
}

function main(): void {
  const payload = readPayload();
  const engine = new DraftPrScaffoldingEngine();

  if (payload.eventType === 'jira-transition') {
    process.stdout.write(`${JSON.stringify(engine.shouldCreateDraftPr(payload.event, payload.context))}\n`);
    return;
  }

  if (payload.eventType === 'jira-update') {
    process.stdout.write(`${JSON.stringify(engine.shouldSyncChecklist(payload.event, payload.context))}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(engine.appendProgressFromCommit(payload.event, payload.context))}\n`);
}

main();
