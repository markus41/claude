/**
 * Type Definitions Export Hub
 *
 * Centralized exports for all TypeScript type definitions.
 * Establishes single source of truth for visual workflow types.
 */

// Re-export all workflow types
export type {
  NodePosition,
  VisualWorkflowNode,
  VisualWorkflowEdge,
  CanvasSettings,
  VisualWorkflowDefinition,
  VisualWorkflow,
  VisualWorkflowListResponse,
  VisualWorkflowUpdate,
  NodeSchema,
  NodeSchemaProperty,
  NodeTypeDefinition,
  NodeTypeCategory,
  WorkflowTemplate,
  WorkflowTemplateListResponse,
  WorkflowExecution,
  NodeExecutionState,
} from './workflow';

export {
  NodeCategory,
  WorkflowExecutionStatus,
  NodeExecutionStatus,
  TemplateVisibility,
} from './workflow';

// Re-export all node types
export type {
  NodeType,
  BaseNodeData,
  EpicTriggerData,
  TaskTriggerData,
  WebhookTriggerData,
  ScheduledTriggerData,
  ManualTriggerData,
  ExplorePhaseData,
  PlanPhaseData,
  CodePhaseData,
  TestPhaseData,
  FixPhaseData,
  DocumentPhaseData,
  SingleAgentData,
  MultiAgentData,
  SpecialistAgentData,
  ConditionData,
  LoopData,
  ParallelData,
  WaitData,
  MergeData,
  ApiCallData,
  FileOperationData,
  GitOperationData,
  NotificationData,
  SuccessTerminatorData,
  FailureTerminatorData,
  CancelTerminatorData,
  EscalateTerminatorData,
  NodeData,
  TypedWorkflowNode,
  NodeMetadata,
} from './nodes';

export { NODE_CATEGORY_COLORS, NODE_METADATA } from './nodes';
