/**
 * AgentNode Component
 *
 * Specialized node component for AI agent nodes.
 * Extends BaseNode with agent-specific styling and behavior.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const AgentNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  return (
    <BaseNode
      {...props}
      category={NodeCategory.AGENT}
      icon={metadata?.icon || 'user'}
      supportsMultipleInputs={false}
      supportsMultipleOutputs={false}
    />
  );
});

AgentNode.displayName = 'AgentNode';

export default AgentNode;
