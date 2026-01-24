/**
 * TriggerNode Component
 *
 * Specialized node component for workflow trigger nodes.
 * Extends BaseNode with trigger-specific styling and behavior.
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './BaseNode';
import { NodeCategory, NODE_METADATA } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';

export const TriggerNode = memo<NodeProps<BaseNodeData>>((props) => {
  const metadata = NODE_METADATA[props.type as keyof typeof NODE_METADATA];

  return (
    <BaseNode
      {...props}
      category={NodeCategory.TRIGGER}
      icon={metadata?.icon || 'play'}
      supportsMultipleInputs={false}
      supportsMultipleOutputs={false}
    />
  );
});

TriggerNode.displayName = 'TriggerNode';

export default TriggerNode;
