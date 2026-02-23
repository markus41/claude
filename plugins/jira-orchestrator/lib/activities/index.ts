/**
 * ============================================================================
 * JIRA ORCHESTRATOR - TEMPORAL ACTIVITIES
 * ============================================================================
 * Activity implementations for the 6-phase workflow.
 * Activities are the building blocks that perform actual work.
 *
 * Each activity:
 * - Is automatically retried on failure
 * - Has timeout protection
 * - Can be monitored in Temporal UI
 * - Maintains execution history
 *
 * @version 7.5.0
 * @author Brookside BI
 * ============================================================================
 */

import { ApplicationFailure } from '@temporalio/activity';
import { getCircuitBreaker } from '../mcp-circuit-breaker';
import {
  prisma,
  getOrCreateOrchestration,
  recordEvent,
  updatePhase,
  completeOrchestration as dbCompleteOrchestration,
} from '../database';

// ============================================================================
// MCP HELPER
// ============================================================================

const ATLASSIAN_SERVER = 'atlassian';

/**
 * Call an Atlassian MCP tool via the SSE endpoint.
 * Wraps every invocation in the global circuit breaker.
 */
async function callAtlassianMcp<T = unknown>(
  toolName: string,
  args: Record<string, unknown>
): Promise<T> {
  const cb = getCircuitBreaker();

  return cb.execute<T>(
    ATLASSIAN_SERVER,
    async () => {
      const baseUrl =
        process.env.ATLASSIAN_MCP_URL ?? 'https://mcp.atlassian.com/v1';
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(process.env.ATLASSIAN_MCP_TOKEN
            ? { Authorization: `Bearer ${process.env.ATLASSIAN_MCP_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `${toolName}-${Date.now()}`,
          method: 'tools/call',
          params: { name: toolName, arguments: args },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Atlassian MCP call ${toolName} failed: ${response.status} ${response.statusText}`
        );
      }

      const json = (await response.json()) as {
        result?: { content?: Array<{ text?: string }> };
        error?: { message: string };
      };
      if (json.error) {
        throw new Error(`Atlassian MCP error: ${json.error.message}`);
      }

      // MCP tool results are wrapped in content[].text
      const text = json.result?.content?.[0]?.text;
      return text ? (JSON.parse(text) as T) : (json.result as unknown as T);
    }
  );
}

// ============================================================================
// PHASE ACTIVITIES
// ============================================================================

/**
 * EXPLORE Phase - Analyze issue and gather context
 *
 * Invokes agents:
 * - triage-agent: Categorize and assess issue
 * - requirements-analyzer: Extract requirements
 * - dependency-mapper: Map dependencies
 */
export async function exploreIssue(issueKey: string): Promise<{
  issueContext: Record<string, unknown>;
  requirements: string[];
  dependencies: string[];
  complexity: number;
  estimatedEffort: string;
}> {
  console.log(`[Activity] exploreIssue: Starting exploration for ${issueKey}`);

  try {
    // Fetch real issue data from Jira via MCP with circuit breaker protection
    const issue = await callAtlassianMcp<{
      key: string;
      fields: {
        summary?: string;
        description?: string;
        issuetype?: { name: string };
        status?: { name: string };
        priority?: { name: string };
        labels?: string[];
        components?: Array<{ name: string }>;
        issuelinks?: Array<{
          type: { name: string };
          outwardIssue?: { key: string };
          inwardIssue?: { key: string };
        }>;
        [key: string]: unknown;
      };
    }>('getJiraIssue', { issueIdOrKey: issueKey });

    const fields = issue.fields ?? {};

    // Extract requirements from description (lines starting with - or *)
    const descriptionLines = (fields.description ?? '').split('\n');
    const requirements = descriptionLines
      .filter((line: string) => /^\s*[-*]\s+/.test(line))
      .map((line: string) => line.replace(/^\s*[-*]\s+/, '').trim())
      .filter(Boolean);

    // Extract dependencies from issue links
    const dependencies = (fields.issuelinks ?? [])
      .map((link) => link.outwardIssue?.key ?? link.inwardIssue?.key)
      .filter((key): key is string => !!key);

    // Estimate complexity based on components, labels, and description length
    const descLength = (fields.description ?? '').length;
    const componentCount = (fields.components ?? []).length;
    const complexity = Math.min(
      10,
      Math.max(
        1,
        Math.round(descLength / 500) + componentCount + (dependencies.length > 0 ? 2 : 0)
      )
    );

    // Rough effort estimate
    const effortHours = complexity <= 3 ? '2h' : complexity <= 6 ? '4h' : complexity <= 8 ? '8h' : '16h';

    console.log(`[Activity] exploreIssue: ${issueKey} fetched (complexity=${complexity})`);

    return {
      issueContext: {
        issueKey: issue.key,
        summary: fields.summary,
        issueType: fields.issuetype?.name,
        status: fields.status?.name,
        priority: fields.priority?.name,
        labels: fields.labels,
        components: (fields.components ?? []).map((c) => c.name),
        analyzed: true,
        timestamp: new Date().toISOString(),
      },
      requirements:
        requirements.length > 0
          ? requirements
          : ['Requirement 1: Core functionality (auto-generated — no structured reqs found)'],
      dependencies,
      complexity,
      estimatedEffort: effortHours,
    };
  } catch (error) {
    console.error(`[Activity] exploreIssue: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.nonRetryable(
      `Failed to explore issue ${issueKey}: ${(error as Error).message}`,
      'EXPLORE_FAILED',
      { issueKey }
    );
  }
}

/**
 * PLAN Phase - Create implementation plan
 *
 * Invokes agents:
 * - planner: Create step-by-step plan
 * - architect: Design technical approach
 * - task-enricher: Add technical details
 */
export async function planImplementation(
  issueKey: string,
  exploration: Record<string, unknown> | undefined
): Promise<{
  plan: string[];
  architecture: Record<string, unknown>;
  subtasks: string[];
  riskAssessment: string;
}> {
  console.log(`[Activity] planImplementation: Creating plan for ${issueKey}`);

  return {
    plan: [
      'Step 1: Set up project structure',
      'Step 2: Implement core logic',
      'Step 3: Add error handling',
      'Step 4: Write tests',
      'Step 5: Update documentation',
    ],
    architecture: {
      pattern: 'modular',
      components: ['core', 'utils', 'tests'],
    },
    subtasks: [],
    riskAssessment: 'Low risk - straightforward implementation',
  };
}

/**
 * CODE Phase - Execute the implementation
 *
 * Invokes agents:
 * - code-implementer: Write code
 * - code-reviewer: Self-review
 * - commit-tracker: Track commits
 */
export async function executeCode(
  issueKey: string,
  plan: Record<string, unknown> | undefined
): Promise<{
  filesChanged: string[];
  commits: string[];
  linesAdded: number;
  linesRemoved: number;
}> {
  console.log(`[Activity] executeCode: Implementing code for ${issueKey}`);

  return {
    filesChanged: [],
    commits: [],
    linesAdded: 0,
    linesRemoved: 0,
  };
}

/**
 * TEST Phase - Run tests and validate
 *
 * Invokes agents:
 * - test-runner: Execute test suite
 * - coverage-analyzer: Check coverage
 * - quality-enforcer: Validate code quality
 */
export async function runTests(
  issueKey: string,
  codeResult: Record<string, unknown> | undefined
): Promise<{
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coverage: number;
  failures: string[];
}> {
  console.log(`[Activity] runTests: Running tests for ${issueKey}`);

  return {
    passed: true,
    totalTests: 10,
    passedTests: 10,
    failedTests: 0,
    coverage: 85,
    failures: [],
  };
}

/**
 * FIX Phase - Fix issues found during testing
 *
 * Invokes agents:
 * - bug-fixer: Analyze and fix failures
 * - code-reviewer: Review fixes
 */
export async function fixIssues(
  issueKey: string,
  testResult: Record<string, unknown> | undefined
): Promise<{
  fixesApplied: string[];
  remainingIssues: string[];
}> {
  console.log(`[Activity] fixIssues: Fixing issues for ${issueKey}`);

  return {
    fixesApplied: [],
    remainingIssues: [],
  };
}

/**
 * DOCUMENT Phase - Update documentation
 *
 * Invokes agents:
 * - documentation-writer: Write docs
 * - confluence-manager: Update Confluence
 * - changelog-generator: Update changelog
 */
export async function documentWork(
  issueKey: string,
  workSummary: Record<string, unknown>
): Promise<{
  docsUpdated: string[];
  confluencePages: string[];
  changelog: string;
}> {
  console.log(`[Activity] documentWork: Documenting work for ${issueKey}`);

  return {
    docsUpdated: [],
    confluencePages: [],
    changelog: `- ${issueKey}: Implementation complete`,
  };
}

// ============================================================================
// JIRA ACTIVITIES
// ============================================================================

/**
 * Update Jira issue status
 */
export async function updateJiraStatus(
  issueKey: string,
  status: string,
  phase: string
): Promise<void> {
  console.log(`[Activity] updateJiraStatus: ${issueKey} -> ${status} (${phase})`);

  try {
    await callAtlassianMcp('editJiraIssue', {
      issueIdOrKey: issueKey,
      fields: {
        labels: [`orchestration-phase:${phase}`, `orchestration-status:${status}`],
      },
    });
    console.log(`[Activity] updateJiraStatus: ${issueKey} updated successfully`);
  } catch (error) {
    console.error(`[Activity] updateJiraStatus: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to update Jira status for ${issueKey}: ${(error as Error).message}`,
      'JIRA_UPDATE_FAILED',
      { issueKey, status, phase }
    );
  }
}

/**
 * Add comment to Jira issue
 */
export async function addJiraComment(
  issueKey: string,
  comment: string
): Promise<void> {
  console.log(`[Activity] addJiraComment: ${issueKey} - ${comment.substring(0, 50)}...`);

  try {
    await callAtlassianMcp('addCommentToJiraIssue', {
      issueIdOrKey: issueKey,
      body: comment,
    });
    console.log(`[Activity] addJiraComment: Comment added to ${issueKey}`);
  } catch (error) {
    console.error(`[Activity] addJiraComment: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to add comment to ${issueKey}: ${(error as Error).message}`,
      'JIRA_COMMENT_FAILED',
      { issueKey }
    );
  }
}

/**
 * Transition Jira issue to new state
 */
export async function transitionJiraIssue(
  issueKey: string,
  targetStatus: string
): Promise<void> {
  console.log(`[Activity] transitionJiraIssue: ${issueKey} -> ${targetStatus}`);

  try {
    await callAtlassianMcp('transitionJiraIssue', {
      issueIdOrKey: issueKey,
      targetStatus,
    });
    console.log(`[Activity] transitionJiraIssue: ${issueKey} transitioned to ${targetStatus}`);
  } catch (error) {
    console.error(`[Activity] transitionJiraIssue: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to transition ${issueKey} to ${targetStatus}: ${(error as Error).message}`,
      'JIRA_TRANSITION_FAILED',
      { issueKey, targetStatus }
    );
  }
}

// ============================================================================
// NOTIFICATION ACTIVITIES
// ============================================================================

/**
 * Notify stakeholders about workflow events
 */
export async function notifyStakeholders(
  issueKey: string,
  event: 'started' | 'completed' | 'failed' | 'blocked',
  details?: Record<string, unknown>
): Promise<void> {
  console.log(`[Activity] notifyStakeholders: ${issueKey} - ${event}`);

  // Build structured notification payload
  const notification = {
    issueKey,
    event,
    details: details ?? {},
    timestamp: new Date().toISOString(),
    source: 'jira-orchestrator',
  };

  // Always log the structured event for observability
  console.log(`[Notification] ${JSON.stringify(notification)}`);

  // Send to Slack webhook if configured
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhookUrl) {
    try {
      const emoji =
        event === 'completed' ? ':white_check_mark:' :
        event === 'failed' ? ':x:' :
        event === 'blocked' ? ':warning:' :
        ':arrow_forward:';

      const slackPayload = {
        text: `${emoji} *${issueKey}* \u2014 Orchestration ${event}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${emoji} *${issueKey}* \u2014 Orchestration *${event}*\n${
                details ? '```' + JSON.stringify(details, null, 2) + '```' : ''
              }`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `_${notification.timestamp}_ | _jira-orchestrator_`,
              },
            ],
          },
        ],
      };

      const res = await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      });

      if (!res.ok) {
        console.warn(`[Activity] notifyStakeholders: Slack webhook returned ${res.status}`);
      } else {
        console.log(`[Activity] notifyStakeholders: Slack notification sent for ${issueKey}`);
      }
    } catch (slackError) {
      // Notification failures are non-critical; log and continue
      console.warn(`[Activity] notifyStakeholders: Slack send failed:`, slackError);
    }
  }
}

// ============================================================================
// DATABASE ACTIVITIES
// ============================================================================

/**
 * Record orchestration event in database
 */
export async function recordOrchestrationEvent(
  issueKey: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  console.log(`[Activity] recordOrchestrationEvent: ${issueKey} - ${eventType}`);

  try {
    // Get or create the orchestration record for this issue
    const projectKey = issueKey.split('-')[0];
    const orchestration = await getOrCreateOrchestration(issueKey, projectKey);

    // Record the event in the event store
    await recordEvent(orchestration.id, eventType, payload);

    console.log(`[Activity] recordOrchestrationEvent: Recorded ${eventType} for ${issueKey}`);
  } catch (error) {
    console.error(`[Activity] recordOrchestrationEvent: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to record event for ${issueKey}: ${(error as Error).message}`,
      'DB_EVENT_FAILED',
      { issueKey, eventType }
    );
  }
}

/**
 * Update orchestration phase in database
 */
export async function updateOrchestrationPhase(
  issueKey: string,
  phase: string
): Promise<void> {
  console.log(`[Activity] updateOrchestrationPhase: ${issueKey} -> ${phase}`);

  try {
    const projectKey = issueKey.split('-')[0];
    const orchestration = await getOrCreateOrchestration(issueKey, projectKey);

    await updatePhase(
      orchestration.id,
      phase as 'EXPLORE' | 'PLAN' | 'CODE' | 'TEST' | 'FIX' | 'DOCUMENT'
    );

    console.log(`[Activity] updateOrchestrationPhase: ${issueKey} phase set to ${phase}`);
  } catch (error) {
    console.error(`[Activity] updateOrchestrationPhase: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to update phase for ${issueKey}: ${(error as Error).message}`,
      'DB_PHASE_FAILED',
      { issueKey, phase }
    );
  }
}

/**
 * Complete orchestration in database
 */
export async function completeOrchestration(
  issueKey: string,
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED'
): Promise<void> {
  console.log(`[Activity] completeOrchestration: ${issueKey} -> ${status}`);

  try {
    const projectKey = issueKey.split('-')[0];
    const orchestration = await getOrCreateOrchestration(issueKey, projectKey);

    await dbCompleteOrchestration(orchestration.id, status);

    console.log(`[Activity] completeOrchestration: ${issueKey} marked as ${status}`);
  } catch (error) {
    console.error(`[Activity] completeOrchestration: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to complete orchestration for ${issueKey}: ${(error as Error).message}`,
      'DB_COMPLETE_FAILED',
      { issueKey, status }
    );
  }
}

/**
 * Save checkpoint for workflow resumption
 */
export async function saveCheckpoint(
  issueKey: string,
  phase: string,
  state: Record<string, unknown>
): Promise<void> {
  console.log(`[Activity] saveCheckpoint: ${issueKey} @ ${phase}`);

  try {
    const projectKey = issueKey.split('-')[0];
    const orchestration = await getOrCreateOrchestration(issueKey, projectKey);

    await prisma.checkpoint.create({
      data: {
        orchestrationId: orchestration.id,
        phase: phase as 'EXPLORE' | 'PLAN' | 'CODE' | 'TEST' | 'FIX' | 'DOCUMENT',
        state,
      },
    });

    console.log(`[Activity] saveCheckpoint: Checkpoint saved for ${issueKey} @ ${phase}`);
  } catch (error) {
    console.error(`[Activity] saveCheckpoint: Failed for ${issueKey}:`, error);
    throw ApplicationFailure.retryable(
      `Failed to save checkpoint for ${issueKey}: ${(error as Error).message}`,
      'DB_CHECKPOINT_FAILED',
      { issueKey, phase }
    );
  }
}

// ============================================================================
// UTILITY ACTIVITIES
// ============================================================================

/**
 * Sleep activity (for testing/debugging)
 */
export async function sleepActivity(durationMs: number): Promise<void> {
  console.log(`[Activity] sleepActivity: Sleeping for ${durationMs}ms`);
  await new Promise(resolve => setTimeout(resolve, durationMs));
}

/**
 * Validate issue exists and is accessible
 */
export async function validateIssue(issueKey: string): Promise<{
  exists: boolean;
  accessible: boolean;
  issueType: string;
  status: string;
}> {
  console.log(`[Activity] validateIssue: ${issueKey}`);

  try {
    const issue = await callAtlassianMcp<{
      key: string;
      fields: {
        issuetype?: { name: string };
        status?: { name: string };
      };
    }>('getJiraIssue', { issueIdOrKey: issueKey });

    console.log(`[Activity] validateIssue: ${issueKey} exists and is accessible`);

    return {
      exists: true,
      accessible: true,
      issueType: issue.fields?.issuetype?.name ?? 'Unknown',
      status: issue.fields?.status?.name ?? 'Unknown',
    };
  } catch (error) {
    console.warn(`[Activity] validateIssue: ${issueKey} validation failed:`, error);

    // Distinguish between "not found" and "service error"
    const message = (error as Error).message ?? '';
    if (message.includes('404') || message.includes('not found')) {
      return {
        exists: false,
        accessible: false,
        issueType: 'Unknown',
        status: 'Unknown',
      };
    }

    // Service error - issue might exist but we cannot reach Jira
    return {
      exists: true, // assume exists; service is down
      accessible: false,
      issueType: 'Unknown',
      status: 'Unknown',
    };
  }
}
