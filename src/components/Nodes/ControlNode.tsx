/**
 * ControlNode Component
 *
 * Specialized node component for workflow control nodes (conditions, loops, etc.).
 * Extends BaseNode with control-specific styling and multi-handle support.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const ControlNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  // Determine if node supports multiple inputs/outputs based on type
  const supportsMultipleInputs = props.type === 'control.merge';
  const supportsMultipleOutputs = ['control.condition', 'control.parallel'].includes(props.type);

  return (
    <BaseNode
      {...props}
      category={NodeCategory.CONTROL}
      icon={metadata?.icon || 'git-branch'}
      supportsMultipleInputs={supportsMultipleInputs}
      supportsMultipleOutputs={supportsMultipleOutputs}
    />
  );
});

ControlNode.displayName = 'ControlNode';

export default ControlNode;
