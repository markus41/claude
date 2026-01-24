/**
 * TerminatorNode Component
 *
 * Specialized node component for workflow terminator nodes.
 * Extends BaseNode with terminator-specific styling (no output handles).
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const TerminatorNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  return (
    <BaseNode
      {...props}
      category={NodeCategory.TERMINATOR}
      icon={metadata?.icon || 'circle-stop'}
      supportsMultipleInputs={false}
      supportsMultipleOutputs={false}
    />
  );
});

TerminatorNode.displayName = 'TerminatorNode';

export default TerminatorNode;
