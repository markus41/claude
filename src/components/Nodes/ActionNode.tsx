/**
 * ActionNode Component
 *
 * Specialized node component for workflow action nodes (API calls, file ops, etc.).
 * Extends BaseNode with action-specific styling and behavior.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const ActionNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  return (
    <BaseNode
      {...props}
      category={NodeCategory.ACTION}
      icon={metadata?.icon || 'zap'}
      supportsMultipleInputs={false}
      supportsMultipleOutputs={false}
    />
  );
});

ActionNode.displayName = 'ActionNode';

export default ActionNode;
