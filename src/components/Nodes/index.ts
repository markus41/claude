/**
 * Node Components Export Hub
 *
 * Centralized exports for all workflow node components.
 */

export { BaseNode } from './BaseNode';
export type { BaseNodeProps } from './BaseNode';

export { TriggerNode } from './TriggerNode';
export { PhaseNode } from './PhaseNode';
export { AgentNode } from './AgentNode';
export { ControlNode } from './ControlNode';
export { ActionNode } from './ActionNode';
export { TerminatorNode } from './TerminatorNode';

/**
 * Node type registry for React Flow
 * Maps node type patterns to component implementations
 */
export const nodeTypeComponents = {
  // Triggers
  'trigger.epic': 'TriggerNode',
  'trigger.task': 'TriggerNode',
  'trigger.webhook': 'TriggerNode',
  'trigger.scheduled': 'TriggerNode',
  'trigger.manual': 'TriggerNode',

  // Phases
  'phase.explore': 'PhaseNode',
  'phase.plan': 'PhaseNode',
  'phase.code': 'PhaseNode',
  'phase.test': 'PhaseNode',
  'phase.fix': 'PhaseNode',
  'phase.document': 'PhaseNode',

  // Agents
  'agent.single': 'AgentNode',
  'agent.multi': 'AgentNode',
  'agent.specialist': 'AgentNode',

  // Control
  'control.condition': 'ControlNode',
  'control.loop': 'ControlNode',
  'control.parallel': 'ControlNode',
  'control.wait': 'ControlNode',
  'control.merge': 'ControlNode',

  // Actions
  'action.api_call': 'ActionNode',
  'action.file_operation': 'ActionNode',
  'action.git_operation': 'ActionNode',
  'action.notification': 'ActionNode',

  // Terminators
  'terminator.success': 'TerminatorNode',
  'terminator.failure': 'TerminatorNode',
  'terminator.cancel': 'TerminatorNode',
  'terminator.escalate': 'TerminatorNode',
} as const;
