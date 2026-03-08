import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface HarnessExecutionEvent {
  executionId: string;
  eventId?: string;
  state: string;
  failureStrategyOutcome?: string;
  occurredAt: string;
}

export interface JiraTransitionAction {
  transition: string;
  comment: string;
  properties: Record<string, string>;
}

interface TransitionRule {
  when: {
    state: string;
    failureStrategyOutcome?: string;
  };
  transition: string;
  comment?: string;
  properties?: Record<string, string>;
}

interface TransitionMapConfig {
  version: string;
  description?: string;
  mappings: TransitionRule[];
}

interface ExecutionState {
  lastOccurredAtMs: number;
  appliedTransitions: Set<string>;
  seenEventIds: Set<string>;
}

export interface TransitionDecision {
  action?: JiraTransitionAction;
  skipped: boolean;
  reason?: 'duplicate_event' | 'out_of_order_event' | 'no_mapping' | 'already_applied' | 'already_in_state';
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultMapPath = path.resolve(dirname, '../config/harness-transition-map.yaml');

export function loadHarnessTransitionMap(mapPath = defaultMapPath): TransitionMapConfig {
  const raw = readFileSync(mapPath, 'utf-8');
  return JSON.parse(raw) as TransitionMapConfig;
}

export class HarnessTransitionEngine {
  private readonly map: TransitionMapConfig;
  private readonly executionStates = new Map<string, ExecutionState>();

  constructor(map: TransitionMapConfig = loadHarnessTransitionMap()) {
    this.map = map;
  }

  decide(event: HarnessExecutionEvent, jiraCurrentState?: string): TransitionDecision {
    const state = this.getExecutionState(event.executionId);

    if (event.eventId && state.seenEventIds.has(event.eventId)) {
      return { skipped: true, reason: 'duplicate_event' };
    }

    const occurredAtMs = Date.parse(event.occurredAt);
    if (Number.isFinite(occurredAtMs) && occurredAtMs < state.lastOccurredAtMs) {
      return { skipped: true, reason: 'out_of_order_event' };
    }

    const rule = this.findRule(event.state, event.failureStrategyOutcome);
    if (!rule) {
      return { skipped: true, reason: 'no_mapping' };
    }

    if (jiraCurrentState && jiraCurrentState === rule.transition) {
      this.markProcessed(state, event, occurredAtMs);
      return { skipped: true, reason: 'already_in_state' };
    }

    if (state.appliedTransitions.has(rule.transition)) {
      this.markProcessed(state, event, occurredAtMs);
      return { skipped: true, reason: 'already_applied' };
    }

    const action: JiraTransitionAction = {
      transition: rule.transition,
      comment: this.renderComment(rule.comment, event),
      properties: {
        harnessExecutionId: event.executionId,
        harnessState: event.state,
        ...(event.failureStrategyOutcome ? { harnessFailureStrategyOutcome: event.failureStrategyOutcome } : {}),
        ...(rule.properties ?? {}),
      },
    };

    state.appliedTransitions.add(rule.transition);
    this.markProcessed(state, event, occurredAtMs);

    return { skipped: false, action };
  }

  private getExecutionState(executionId: string): ExecutionState {
    const current = this.executionStates.get(executionId);
    if (current) {
      return current;
    }

    const created: ExecutionState = {
      lastOccurredAtMs: 0,
      appliedTransitions: new Set<string>(),
      seenEventIds: new Set<string>(),
    };
    this.executionStates.set(executionId, created);
    return created;
  }

  private markProcessed(state: ExecutionState, event: HarnessExecutionEvent, occurredAtMs: number): void {
    if (event.eventId) {
      state.seenEventIds.add(event.eventId);
    }
    if (Number.isFinite(occurredAtMs)) {
      state.lastOccurredAtMs = Math.max(state.lastOccurredAtMs, occurredAtMs);
    }
  }

  private findRule(state: string, failureStrategyOutcome?: string): TransitionRule | undefined {
    return this.map.mappings
      .filter((mapping) => mapping.when.state === state)
      .sort((a, b) => Number(Boolean(b.when.failureStrategyOutcome)) - Number(Boolean(a.when.failureStrategyOutcome)))
      .find((mapping) => {
        if (mapping.when.failureStrategyOutcome) {
          return mapping.when.failureStrategyOutcome === failureStrategyOutcome;
        }
        return true;
      });
  }

  private renderComment(template: string | undefined, event: HarnessExecutionEvent): string {
    if (!template) {
      return `Harness event ${event.state} received for execution ${event.executionId}.`;
    }

    return template.replaceAll('{{executionId}}', event.executionId);
  }
}
