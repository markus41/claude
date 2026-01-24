/**
 * Node Type Definitions
 *
 * Establishes type-safe definitions for all 27 node types in the visual workflow system.
 * Uses discriminated unions for comprehensive type checking and autocompletion.
 *
 * Best for: Type-safe node rendering and configuration with category-based organization.
 */

import { NodeCategory, VisualWorkflowNode } from './workflow';

/**
 * Node type identifiers for all 27 supported node types
 */
export type NodeType =
  // Triggers (5 types)
  | 'trigger.epic'
  | 'trigger.task'
  | 'trigger.webhook'
  | 'trigger.scheduled'
  | 'trigger.manual'
  // Phases (6 types)
  | 'phase.explore'
  | 'phase.plan'
  | 'phase.code'
  | 'phase.test'
  | 'phase.fix'
  | 'phase.document'
  // Agents (3 types)
  | 'agent.single'
  | 'agent.multi'
  | 'agent.specialist'
  // Control (5 types)
  | 'control.condition'
  | 'control.loop'
  | 'control.parallel'
  | 'control.wait'
  | 'control.merge'
  // Actions (4 types)
  | 'action.api_call'
  | 'action.file_operation'
  | 'action.git_operation'
  | 'action.notification'
  // Terminators (4 types)
  | 'terminator.success'
  | 'terminator.failure'
  | 'terminator.cancel'
  | 'terminator.escalate';

/**
 * Node category color schemes for visual distinction
 */
export const NODE_CATEGORY_COLORS: Record<NodeCategory, { border: string; background: string; text: string }> = {
  [NodeCategory.TRIGGER]: {
    border: '#3b82f6', // blue-500
    background: '#eff6ff', // blue-50
    text: '#1e40af', // blue-800
  },
  [NodeCategory.PHASE]: {
    border: '#10b981', // green-500
    background: '#f0fdf4', // green-50
    text: '#065f46', // green-800
  },
  [NodeCategory.AGENT]: {
    border: '#8b5cf6', // purple-500
    background: '#faf5ff', // purple-50
    text: '#6b21a8', // purple-800
  },
  [NodeCategory.CONTROL]: {
    border: '#f59e0b', // orange-500
    background: '#fffbeb', // orange-50
    text: '#92400e', // orange-800
  },
  [NodeCategory.ACTION]: {
    border: '#14b8a6', // teal-500
    background: '#f0fdfa', // teal-50
    text: '#115e59', // teal-800
  },
  [NodeCategory.TERMINATOR]: {
    border: '#ef4444', // red-500
    background: '#fef2f2', // red-50
    text: '#991b1b', // red-800
  },
};

/**
 * Base node data shared by all node types
 */
export interface BaseNodeData {
  /** Display label */
  label: string;
  /** Description (optional) */
  description?: string;
  /** Execution status */
  status?: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  /** Validation errors */
  errors?: string[];
  /** Validation warnings */
  warnings?: string[];
}

// =================== TRIGGER NODE DATA ===================

export interface EpicTriggerData extends BaseNodeData {
  /** Jira Epic ID or key */
  epicId: string;
  /** Filter by epic status */
  statusFilter?: string[];
}

export interface TaskTriggerData extends BaseNodeData {
  /** Jira Task ID or key */
  taskId: string;
  /** Task event type */
  eventType: 'created' | 'updated' | 'completed' | 'assigned';
}

export interface WebhookTriggerData extends BaseNodeData {
  /** Webhook URL endpoint */
  webhookUrl: string;
  /** Expected webhook secret */
  secret?: string;
  /** Payload validation schema */
  payloadSchema?: Record<string, unknown>;
}

export interface ScheduledTriggerData extends BaseNodeData {
  /** Cron expression */
  cronExpression: string;
  /** Timezone */
  timezone?: string;
}

export interface ManualTriggerData extends BaseNodeData {
  /** Require confirmation before start */
  requireConfirmation?: boolean;
}

// =================== PHASE NODE DATA ===================

export interface ExplorePhaseData extends BaseNodeData {
  /** Files/directories to explore */
  targetPaths: string[];
  /** Search patterns */
  searchPatterns?: string[];
  /** Max depth */
  maxDepth?: number;
}

export interface PlanPhaseData extends BaseNodeData {
  /** Planning output format */
  outputFormat: 'markdown' | 'json' | 'yaml';
  /** Include task breakdown */
  includeTaskBreakdown?: boolean;
}

export interface CodePhaseData extends BaseNodeData {
  /** Programming language */
  language: string;
  /** Files to modify */
  targetFiles: string[];
  /** Code style guide */
  styleGuide?: string;
}

export interface TestPhaseData extends BaseNodeData {
  /** Test framework */
  testFramework: string;
  /** Test command */
  testCommand: string;
  /** Coverage threshold */
  coverageThreshold?: number;
}

export interface FixPhaseData extends BaseNodeData {
  /** Max fix attempts */
  maxAttempts: number;
  /** Auto-commit fixes */
  autoCommit?: boolean;
}

export interface DocumentPhaseData extends BaseNodeData {
  /** Documentation format */
  format: 'markdown' | 'rst' | 'html';
  /** Output directory */
  outputDir: string;
  /** Include API docs */
  includeApiDocs?: boolean;
}

// =================== AGENT NODE DATA ===================

export interface SingleAgentData extends BaseNodeData {
  /** Agent type/role */
  agentType: string;
  /** Model to use */
  model: 'sonnet-4.5' | 'opus-4.5' | 'haiku';
  /** System prompt */
  systemPrompt?: string;
  /** Temperature */
  temperature?: number;
}

export interface MultiAgentData extends BaseNodeData {
  /** Agent configurations */
  agents: Array<{
    id: string;
    type: string;
    model: string;
  }>;
  /** Orchestration strategy */
  orchestrationStrategy: 'sequential' | 'parallel' | 'debate';
}

export interface SpecialistAgentData extends BaseNodeData {
  /** Specialist domain */
  specialization: string;
  /** Agent configuration */
  agentConfig: Record<string, unknown>;
}

// =================== CONTROL NODE DATA ===================

export interface ConditionData extends BaseNodeData {
  /** Condition expression */
  condition: string;
  /** Output handle for true branch */
  trueHandle: string;
  /** Output handle for false branch */
  falseHandle: string;
}

export interface LoopData extends BaseNodeData {
  /** Loop type */
  loopType: 'for' | 'while' | 'foreach';
  /** Iteration variable */
  iterationVar: string;
  /** Collection to iterate (for foreach) */
  collection?: string;
  /** Condition expression (for while) */
  condition?: string;
  /** Max iterations */
  maxIterations?: number;
}

export interface ParallelData extends BaseNodeData {
  /** Parallel branches */
  branches: Array<{
    id: string;
    label: string;
  }>;
  /** Wait for all branches */
  waitForAll: boolean;
}

export interface WaitData extends BaseNodeData {
  /** Wait duration in seconds */
  durationSeconds?: number;
  /** Wait for condition */
  waitCondition?: string;
  /** Timeout in seconds */
  timeoutSeconds?: number;
}

export interface MergeData extends BaseNodeData {
  /** Merge strategy */
  mergeStrategy: 'first' | 'all' | 'majority';
  /** Min required inputs */
  minInputs?: number;
}

// =================== ACTION NODE DATA ===================

export interface ApiCallData extends BaseNodeData {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** API endpoint URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: string;
  /** Timeout in seconds */
  timeout?: number;
}

export interface FileOperationData extends BaseNodeData {
  /** Operation type */
  operation: 'read' | 'write' | 'delete' | 'copy' | 'move';
  /** Source file path */
  sourcePath: string;
  /** Destination path (for copy/move) */
  destinationPath?: string;
  /** File content (for write) */
  content?: string;
}

export interface GitOperationData extends BaseNodeData {
  /** Git operation */
  operation: 'commit' | 'push' | 'pull' | 'branch' | 'merge' | 'tag';
  /** Commit message (for commit) */
  commitMessage?: string;
  /** Branch name (for branch/merge) */
  branchName?: string;
  /** Remote name (for push/pull) */
  remoteName?: string;
}

export interface NotificationData extends BaseNodeData {
  /** Notification channel */
  channel: 'email' | 'slack' | 'teams' | 'webhook';
  /** Recipient */
  recipient: string;
  /** Message content */
  message: string;
  /** Priority */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// =================== TERMINATOR NODE DATA ===================

export interface SuccessTerminatorData extends BaseNodeData {
  /** Success message */
  message?: string;
  /** Output data to return */
  outputData?: Record<string, unknown>;
}

export interface FailureTerminatorData extends BaseNodeData {
  /** Failure reason */
  reason: string;
  /** Should retry */
  shouldRetry?: boolean;
}

export interface CancelTerminatorData extends BaseNodeData {
  /** Cancellation reason */
  reason: string;
}

export interface EscalateTerminatorData extends BaseNodeData {
  /** Escalation reason */
  reason: string;
  /** Escalate to user/team */
  escalateTo: string;
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// =================== TYPE UNIONS ===================

/**
 * Discriminated union of all node data types
 */
export type NodeData =
  | EpicTriggerData
  | TaskTriggerData
  | WebhookTriggerData
  | ScheduledTriggerData
  | ManualTriggerData
  | ExplorePhaseData
  | PlanPhaseData
  | CodePhaseData
  | TestPhaseData
  | FixPhaseData
  | DocumentPhaseData
  | SingleAgentData
  | MultiAgentData
  | SpecialistAgentData
  | ConditionData
  | LoopData
  | ParallelData
  | WaitData
  | MergeData
  | ApiCallData
  | FileOperationData
  | GitOperationData
  | NotificationData
  | SuccessTerminatorData
  | FailureTerminatorData
  | CancelTerminatorData
  | EscalateTerminatorData;

/**
 * Typed workflow node with specific node data
 */
export type TypedWorkflowNode<T extends NodeData = NodeData> = Omit<VisualWorkflowNode, 'data'> & {
  data: T;
};

/**
 * Node metadata for palette rendering
 */
export interface NodeMetadata {
  /** Node type identifier */
  type: NodeType;
  /** Display name */
  displayName: string;
  /** Category */
  category: NodeCategory;
  /** Icon name (lucide-react) */
  icon: string;
  /** Description */
  description: string;
  /** Color scheme */
  colors: {
    border: string;
    background: string;
    text: string;
  };
}

/**
 * Node metadata registry for all 27 node types
 */
export const NODE_METADATA: Record<NodeType, NodeMetadata> = {
  // Triggers
  'trigger.epic': {
    type: 'trigger.epic',
    displayName: 'Epic Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'flag',
    description: 'Trigger workflow from Jira Epic events',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TRIGGER],
  },
  'trigger.task': {
    type: 'trigger.task',
    displayName: 'Task Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'check-square',
    description: 'Trigger workflow from Jira Task events',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TRIGGER],
  },
  'trigger.webhook': {
    type: 'trigger.webhook',
    displayName: 'Webhook Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'webhook',
    description: 'Trigger workflow from external webhook',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TRIGGER],
  },
  'trigger.scheduled': {
    type: 'trigger.scheduled',
    displayName: 'Scheduled Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'clock',
    description: 'Trigger workflow on schedule (cron)',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TRIGGER],
  },
  'trigger.manual': {
    type: 'trigger.manual',
    displayName: 'Manual Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'play',
    description: 'Manually start workflow execution',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TRIGGER],
  },
  // Phases
  'phase.explore': {
    type: 'phase.explore',
    displayName: 'Explore Phase',
    category: NodeCategory.PHASE,
    icon: 'search',
    description: 'Explore codebase and gather context',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  'phase.plan': {
    type: 'phase.plan',
    displayName: 'Plan Phase',
    category: NodeCategory.PHASE,
    icon: 'clipboard-list',
    description: 'Create implementation plan',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  'phase.code': {
    type: 'phase.code',
    displayName: 'Code Phase',
    category: NodeCategory.PHASE,
    icon: 'code',
    description: 'Implement code changes',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  'phase.test': {
    type: 'phase.test',
    displayName: 'Test Phase',
    category: NodeCategory.PHASE,
    icon: 'test-tube',
    description: 'Run tests and verify quality',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  'phase.fix': {
    type: 'phase.fix',
    displayName: 'Fix Phase',
    category: NodeCategory.PHASE,
    icon: 'wrench',
    description: 'Fix issues and errors',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  'phase.document': {
    type: 'phase.document',
    displayName: 'Document Phase',
    category: NodeCategory.PHASE,
    icon: 'file-text',
    description: 'Generate documentation',
    colors: NODE_CATEGORY_COLORS[NodeCategory.PHASE],
  },
  // Agents
  'agent.single': {
    type: 'agent.single',
    displayName: 'Single Agent',
    category: NodeCategory.AGENT,
    icon: 'user',
    description: 'Execute task with single AI agent',
    colors: NODE_CATEGORY_COLORS[NodeCategory.AGENT],
  },
  'agent.multi': {
    type: 'agent.multi',
    displayName: 'Multi-Agent',
    category: NodeCategory.AGENT,
    icon: 'users',
    description: 'Coordinate multiple AI agents',
    colors: NODE_CATEGORY_COLORS[NodeCategory.AGENT],
  },
  'agent.specialist': {
    type: 'agent.specialist',
    displayName: 'Specialist Agent',
    category: NodeCategory.AGENT,
    icon: 'graduation-cap',
    description: 'Execute with specialized agent',
    colors: NODE_CATEGORY_COLORS[NodeCategory.AGENT],
  },
  // Control
  'control.condition': {
    type: 'control.condition',
    displayName: 'Condition',
    category: NodeCategory.CONTROL,
    icon: 'git-branch',
    description: 'Branch based on condition',
    colors: NODE_CATEGORY_COLORS[NodeCategory.CONTROL],
  },
  'control.loop': {
    type: 'control.loop',
    displayName: 'Loop',
    category: NodeCategory.CONTROL,
    icon: 'repeat',
    description: 'Repeat nodes in loop',
    colors: NODE_CATEGORY_COLORS[NodeCategory.CONTROL],
  },
  'control.parallel': {
    type: 'control.parallel',
    displayName: 'Parallel',
    category: NodeCategory.CONTROL,
    icon: 'shuffle',
    description: 'Execute branches in parallel',
    colors: NODE_CATEGORY_COLORS[NodeCategory.CONTROL],
  },
  'control.wait': {
    type: 'control.wait',
    displayName: 'Wait',
    category: NodeCategory.CONTROL,
    icon: 'pause',
    description: 'Wait for duration or condition',
    colors: NODE_CATEGORY_COLORS[NodeCategory.CONTROL],
  },
  'control.merge': {
    type: 'control.merge',
    displayName: 'Merge',
    category: NodeCategory.CONTROL,
    icon: 'merge',
    description: 'Merge multiple branches',
    colors: NODE_CATEGORY_COLORS[NodeCategory.CONTROL],
  },
  // Actions
  'action.api_call': {
    type: 'action.api_call',
    displayName: 'API Call',
    category: NodeCategory.ACTION,
    icon: 'globe',
    description: 'Make HTTP API request',
    colors: NODE_CATEGORY_COLORS[NodeCategory.ACTION],
  },
  'action.file_operation': {
    type: 'action.file_operation',
    displayName: 'File Operation',
    category: NodeCategory.ACTION,
    icon: 'file',
    description: 'Perform file operation',
    colors: NODE_CATEGORY_COLORS[NodeCategory.ACTION],
  },
  'action.git_operation': {
    type: 'action.git_operation',
    displayName: 'Git Operation',
    category: NodeCategory.ACTION,
    icon: 'git-branch',
    description: 'Perform git operation',
    colors: NODE_CATEGORY_COLORS[NodeCategory.ACTION],
  },
  'action.notification': {
    type: 'action.notification',
    displayName: 'Notification',
    category: NodeCategory.ACTION,
    icon: 'bell',
    description: 'Send notification',
    colors: NODE_CATEGORY_COLORS[NodeCategory.ACTION],
  },
  // Terminators
  'terminator.success': {
    type: 'terminator.success',
    displayName: 'Success',
    category: NodeCategory.TERMINATOR,
    icon: 'check-circle',
    description: 'Workflow completed successfully',
    colors: { ...NODE_CATEGORY_COLORS[NodeCategory.TERMINATOR], border: '#10b981', background: '#f0fdf4' },
  },
  'terminator.failure': {
    type: 'terminator.failure',
    displayName: 'Failure',
    category: NodeCategory.TERMINATOR,
    icon: 'x-circle',
    description: 'Workflow failed',
    colors: NODE_CATEGORY_COLORS[NodeCategory.TERMINATOR],
  },
  'terminator.cancel': {
    type: 'terminator.cancel',
    displayName: 'Cancel',
    category: NodeCategory.TERMINATOR,
    icon: 'circle-slash',
    description: 'Cancel workflow execution',
    colors: { ...NODE_CATEGORY_COLORS[NodeCategory.TERMINATOR], border: '#f59e0b', background: '#fffbeb' },
  },
  'terminator.escalate': {
    type: 'terminator.escalate',
    displayName: 'Escalate',
    category: NodeCategory.TERMINATOR,
    icon: 'alert-triangle',
    description: 'Escalate to human',
    colors: { ...NODE_CATEGORY_COLORS[NodeCategory.TERMINATOR], border: '#f59e0b', background: '#fffbeb' },
  },
};
