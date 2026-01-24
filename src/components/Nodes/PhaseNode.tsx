/**
 * PhaseNode Component
 *
 * Specialized node component for workflow phase nodes.
 * Extends BaseNode with phase-specific styling and behavior.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const PhaseNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  return (
    <BaseNode
      {...props}
      category={NodeCategory.PHASE}
      icon={metadata?.icon || 'layers'}
      supportsMultipleInputs={false}
      supportsMultipleOutputs={false}
    />
  );
});

PhaseNode.displayName = 'PhaseNode';

export default PhaseNode;
