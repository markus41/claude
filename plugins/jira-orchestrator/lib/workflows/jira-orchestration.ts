/**
 * ============================================================================
 * JIRA ORCHESTRATOR - 6-PHASE WORKFLOW
 * ============================================================================
 * Temporal workflow implementing the EXPLORE > PLAN > CODE > TEST > FIX > DOCUMENT
 * protocol with durable execution, automatic retries, and state management.
 *
 * Features:
 * - Durable execution (survives crashes/restarts)
 * - Automatic retries with exponential backoff
 * - Pause/resume capability via signals
 * - Query support for state inspection
 * - Time-travel debugging via Temporal UI
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  sleep,
  ApplicationFailure,
} from '@temporalio/workflow';

import type * as activities from '../activities';

// ============================================================================
// ACTIVITY PROXIES
// ============================================================================

const {
  // Phase activities
  exploreIssue,
  planImplementation,
  executeCode,
  runTests,
  fixIssues,
  documentWork,
  // Jira activities
  updateJiraStatus,
  addJiraComment,
  transitionJiraIssue,
  // Notification activities
  notifyStakeholders,
  // Database activities
  recordOrchestrationEvent,
  updateOrchestrationPhase,
  completeOrchestration,
  saveCheckpoint,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 hours',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
    maximumInterval: '5 minutes',
    nonRetryableErrorTypes: ['ValidationError', 'AuthenticationError'],
  },
});

// ============================================================================
// SIGNALS & QUERIES
// ============================================================================

/**
 * Signal to proceed to next phase (for manual approval gates)
 */
export const proceedSignal = defineSignal('proceed');

/**
 * Signal to pause workflow execution
 */
export const pauseSignal = defineSignal('pause');

/**
 * Signal to resume paused workflow
 */
export const resumeSignal = defineSignal('resume');

/**
 * Signal to skip current phase and move to next
 */
export const skipPhaseSignal = defineSignal<[string]>('skipPhase');

/**
 * Query current workflow state
 */
export const getStateQuery = defineQuery<WorkflowState>('getState');

/**
 * Query current phase details
 */
export const getPhaseQuery = defineQuery<PhaseState>('getPhase');

// ============================================================================
// TYPES
// ============================================================================

export type Phase = 'EXPLORE' | 'PLAN' | 'CODE' | 'TEST' | 'FIX' | 'DOCUMENT';

export interface WorkflowInput {
  issueKey: string;
  projectKey?: string;
  createdBy?: string;
  autoProceed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WorkflowState {
  issueKey: string;
  projectKey?: string;
  currentPhase: Phase;
  status: 'running' | 'paused' | 'completed' | 'failed';
  startedAt: string;
  phaseResults: Record<Phase, PhaseResult | undefined>;
  error?: string;
}

export interface PhaseState {
  phase: Phase;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  result?: PhaseResult;
}

export interface PhaseResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface WorkflowOutput {
  success: boolean;
  issueKey: string;
  phases: Record<Phase, PhaseResult | undefined>;
  totalDurationMs: number;
  error?: string;
}

// ============================================================================
// WORKFLOW IMPLEMENTATION
// ============================================================================

/**
 * Main Jira Orchestration Workflow
 *
 * Implements the 6-phase protocol:
 * 1. EXPLORE - Analyze issue, gather context
 * 2. PLAN - Create implementation plan
 * 3. CODE - Execute the implementation
 * 4. TEST - Run tests and validate
 * 5. FIX - Fix any issues found (conditional)
 * 6. DOCUMENT - Update documentation
 */
export async function jiraOrchestrationWorkflow(
  input: WorkflowInput
): Promise<WorkflowOutput> {
  const { issueKey, projectKey, createdBy, autoProceed = false, metadata } = input;

  // ========================================
  // WORKFLOW STATE
  // ========================================

  const state: WorkflowState = {
    issueKey,
    projectKey,
    currentPhase: 'EXPLORE',
    status: 'running',
    startedAt: new Date().toISOString(),
    phaseResults: {
      EXPLORE: undefined,
      PLAN: undefined,
      CODE: undefined,
      TEST: undefined,
      FIX: undefined,
      DOCUMENT: undefined,
    },
  };

  let isPaused = false;
  let proceedRequested = false;
  const skippedPhases = new Set<Phase>();

  const startTime = Date.now();

  // ========================================
  // SIGNAL HANDLERS
  // ========================================

  setHandler(proceedSignal, () => {
    proceedRequested = true;
  });

  setHandler(pauseSignal, () => {
    isPaused = true;
    state.status = 'paused';
  });

  setHandler(resumeSignal, () => {
    isPaused = false;
    state.status = 'running';
  });

  setHandler(skipPhaseSignal, (phase: string) => {
    skippedPhases.add(phase as Phase);
  });

  // ========================================
  // QUERY HANDLERS
  // ========================================

  setHandler(getStateQuery, () => state);

  setHandler(getPhaseQuery, () => ({
    phase: state.currentPhase,
    status: state.status === 'paused' ? 'pending' : 'running',
    startedAt: state.startedAt,
    result: state.phaseResults[state.currentPhase],
  }));

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Wait for proceed signal if not auto-proceeding
   */
  async function waitForApproval(phase: Phase): Promise<void> {
    if (autoProceed) return;

    proceedRequested = false;
    await addJiraComment(issueKey, `⏸️ **${phase} phase complete.** Waiting for approval to proceed.`);

    // Wait up to 7 days for approval
    const approved = await condition(() => proceedRequested, '7 days');

    if (!approved) {
      throw ApplicationFailure.create({
        message: `Approval timeout for phase ${phase}`,
        type: 'ApprovalTimeout',
      });
    }
  }

  /**
   * Check if workflow is paused and wait
   */
  async function checkPaused(): Promise<void> {
    if (isPaused) {
      await condition(() => !isPaused, '30 days'); // Wait up to 30 days
    }
  }

  /**
   * Execute a phase with error handling
   */
  async function executePhase<T>(
    phase: Phase,
    executor: () => Promise<T>
  ): Promise<PhaseResult> {
    if (skippedPhases.has(phase)) {
      return { success: true, output: { skipped: true } };
    }

    const phaseStart = Date.now();
    state.currentPhase = phase;

    try {
      await checkPaused();

      // Update Jira and database
      await Promise.all([
        updateJiraStatus(issueKey, 'In Progress', phase),
        updateOrchestrationPhase(issueKey, phase),
        recordOrchestrationEvent(issueKey, 'PhaseStarted', { phase }),
      ]);

      // Execute the phase
      const output = await executor();

      const result: PhaseResult = {
        success: true,
        output: output as Record<string, unknown>,
        durationMs: Date.now() - phaseStart,
      };

      state.phaseResults[phase] = result;

      // Record completion
      await recordOrchestrationEvent(issueKey, 'PhaseCompleted', {
        phase,
        durationMs: result.durationMs,
      });

      // Save checkpoint
      await saveCheckpoint(issueKey, phase, state);

      return result;
    } catch (error) {
      const result: PhaseResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - phaseStart,
      };

      state.phaseResults[phase] = result;

      await recordOrchestrationEvent(issueKey, 'PhaseFailed', {
        phase,
        error: result.error,
      });

      throw error;
    }
  }

  // ========================================
  // MAIN WORKFLOW EXECUTION
  // ========================================

  try {
    // Record workflow start
    await recordOrchestrationEvent(issueKey, 'OrchestrationStarted', {
      createdBy,
      metadata,
    });

    await addJiraComment(issueKey, `🚀 **Orchestration started** by ${createdBy || 'system'}`);

    // ----------------------------------------
    // PHASE 1: EXPLORE
    // ----------------------------------------
    const exploreResult = await executePhase('EXPLORE', async () => {
      return exploreIssue(issueKey);
    });

    if (!autoProceed) {
      await waitForApproval('EXPLORE');
    }

    // ----------------------------------------
    // PHASE 2: PLAN
    // ----------------------------------------
    const planResult = await executePhase('PLAN', async () => {
      return planImplementation(issueKey, exploreResult.output);
    });

    if (!autoProceed) {
      await waitForApproval('PLAN');
    }

    // ----------------------------------------
    // PHASE 3: CODE
    // ----------------------------------------
    const codeResult = await executePhase('CODE', async () => {
      return executeCode(issueKey, planResult.output);
    });

    // ----------------------------------------
    // PHASE 4: TEST
    // ----------------------------------------
    let testResult = await executePhase('TEST', async () => {
      return runTests(issueKey, codeResult.output);
    });

    // ----------------------------------------
    // PHASE 5: FIX (Conditional)
    // ----------------------------------------
    const testOutput = testResult.output as { passed?: boolean } | undefined;
    let fixAttempts = 0;
    const maxFixAttempts = 3;

    while (!testOutput?.passed && fixAttempts < maxFixAttempts) {
      await executePhase('FIX', async () => {
        return fixIssues(issueKey, testResult.output);
      });

      // Re-run tests
      testResult = await executePhase('TEST', async () => {
        return runTests(issueKey, codeResult.output);
      });

      fixAttempts++;
    }

    if (!testOutput?.passed) {
      throw ApplicationFailure.create({
        message: `Tests failed after ${maxFixAttempts} fix attempts`,
        type: 'TestsFailedError',
      });
    }

    // ----------------------------------------
    // PHASE 6: DOCUMENT
    // ----------------------------------------
    await executePhase('DOCUMENT', async () => {
      return documentWork(issueKey, {
        exploration: exploreResult.output,
        plan: planResult.output,
        code: codeResult.output,
        tests: testResult.output,
      });
    });

    // ========================================
    // WORKFLOW COMPLETION
    // ========================================

    state.status = 'completed';
    const totalDurationMs = Date.now() - startTime;

    await Promise.all([
      completeOrchestration(issueKey, 'COMPLETED'),
      transitionJiraIssue(issueKey, 'Done'),
      addJiraComment(issueKey, `✅ **Orchestration complete** in ${Math.round(totalDurationMs / 1000)}s`),
      notifyStakeholders(issueKey, 'completed', { durationMs: totalDurationMs }),
    ]);

    return {
      success: true,
      issueKey,
      phases: state.phaseResults,
      totalDurationMs,
    };

  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================

    state.status = 'failed';
    state.error = error instanceof Error ? error.message : String(error);
    const totalDurationMs = Date.now() - startTime;

    await Promise.all([
      completeOrchestration(issueKey, 'FAILED'),
      updateJiraStatus(issueKey, 'Blocked', state.currentPhase),
      addJiraComment(issueKey, `❌ **Orchestration failed** at ${state.currentPhase}: ${state.error}`),
      notifyStakeholders(issueKey, 'failed', {
        phase: state.currentPhase,
        error: state.error,
      }),
    ]);

    return {
      success: false,
      issueKey,
      phases: state.phaseResults,
      totalDurationMs,
      error: state.error,
    };
  }
}
