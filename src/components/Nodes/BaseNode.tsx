/**
 * BaseNode Component
 *
 * Establishes foundational React Flow node component with category-based styling
 * and execution state visualization. Supports all 6 node categories with dynamic
 * handle configuration and connection validation.
 *
 * Best for: Creating custom workflow nodes with consistent styling, accessibility,
 * and performance optimization for large-scale workflow applications.
 *
 * @example
 * ```tsx
 * <BaseNode
 *   id="node-1"
 *   type="phase.code"
 *   data={{ label: "Code Phase", status: "running" }}
 *   category={NodeCategory.PHASE}
 *   supportsMultipleInputs={false}
 *   supportsMultipleOutputs={true}
 * />
 * ```
 */

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, Connection } from 'reactflow';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { NodeCategory, NODE_CATEGORY_COLORS } from '../../types/nodes';
import type { BaseNodeData } from '../../types/nodes';
import { cn } from '../../lib/utils';

/**
 * Node variant configuration using class-variance-authority
 * Defines visual states and category-specific styling
 */
const nodeVariants = cva(
  'relative min-w-[200px] rounded-lg border-2 shadow-md transition-all duration-200',
  {
    variants: {
      category: {
        [NodeCategory.TRIGGER]: 'bg-blue-50 border-blue-500 dark:bg-blue-950',
        [NodeCategory.PHASE]: 'bg-green-50 border-green-500 dark:bg-green-950',
        [NodeCategory.AGENT]: 'bg-purple-50 border-purple-500 dark:bg-purple-950',
        [NodeCategory.CONTROL]: 'bg-orange-50 border-orange-500 dark:bg-orange-950',
        [NodeCategory.ACTION]: 'bg-teal-50 border-teal-500 dark:bg-teal-950',
        [NodeCategory.TERMINATOR]: 'bg-red-50 border-red-500 dark:bg-red-950',
      },
      status: {
        idle: 'opacity-100',
        running: 'ring-4 ring-blue-400 ring-opacity-50 animate-pulse',
        success: 'ring-4 ring-green-400 ring-opacity-50',
        failed: 'ring-4 ring-red-400 ring-opacity-50',
        skipped: 'opacity-60',
        waiting: 'opacity-80 ring-2 ring-yellow-400',
      },
      selected: {
        true: 'ring-4 ring-blue-600 ring-opacity-30 shadow-lg scale-105',
        false: 'hover:shadow-lg hover:scale-102',
      },
    },
    defaultVariants: {
      status: 'idle',
      selected: false,
    },
  }
);

/**
 * Badge component for displaying errors and warnings
 */
const Badge: React.FC<{ count: number; type: 'error' | 'warning' }> = ({ count, type }) => {
  if (count === 0) return null;

  const Icon = type === 'error' ? LucideIcons.AlertCircle : LucideIcons.AlertTriangle;
  const colorClass = type === 'error' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-gray-900';

  return (
    <div
      className={cn(
        'absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
        colorClass
      )}
      role="status"
      aria-label={`${count} ${type}${count > 1 ? 's' : ''}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{count}</span>
    </div>
  );
};

/**
 * Status indicator component
 */
const StatusIndicator: React.FC<{ status: BaseNodeData['status'] }> = ({ status }) => {
  if (!status || status === 'idle') return null;

  const statusConfig: Record<NonNullable<BaseNodeData['status']>, { icon: keyof typeof LucideIcons; color: string; label: string }> = {
    idle: { icon: 'Circle', color: 'text-gray-400', label: 'Idle' },
    running: { icon: 'Loader2', color: 'text-blue-500 animate-spin', label: 'Running' },
    success: { icon: 'CheckCircle2', color: 'text-green-500', label: 'Success' },
    failed: { icon: 'XCircle', color: 'text-red-500', label: 'Failed' },
    skipped: { icon: 'MinusCircle', color: 'text-gray-400', label: 'Skipped' },
  };

  const config = statusConfig[status];
  const Icon = LucideIcons[config.icon] as React.ComponentType<{ className?: string }>;

  return (
    <div className="absolute -top-3 -left-3 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md" role="status" aria-label={config.label}>
      <Icon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
    </div>
  );
};

/**
 * Custom handle component with improved accessibility
 */
const CustomHandle: React.FC<{
  type: 'source' | 'target';
  position: Position;
  id?: string;
  category: NodeCategory;
  isConnectable: boolean;
}> = ({ type, position, id, category, isConnectable }) => {
  const colors = NODE_CATEGORY_COLORS[category];

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      isConnectable={isConnectable}
      className={cn(
        'w-3 h-3 border-2 transition-all duration-200',
        'hover:scale-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      )}
      style={{
        borderColor: colors.border,
        backgroundColor: '#fff',
      }}
      aria-label={`${type === 'source' ? 'Output' : 'Input'} connection handle${id ? ` ${id}` : ''}`}
    />
  );
};

/**
 * BaseNode Props Interface
 */
export interface BaseNodeProps extends Omit<NodeProps, 'data'> {
  /** Node data conforming to BaseNodeData structure */
  data: BaseNodeData;
  /** Node category for styling */
  category: NodeCategory;
  /** Icon name from lucide-react */
  icon?: string;
  /** Whether node accepts multiple inputs */
  supportsMultipleInputs?: boolean;
  /** Whether node produces multiple outputs */
  supportsMultipleOutputs?: boolean;
  /** Custom content to render in node body */
  children?: React.ReactNode;
  /** Connection validation function */
  isValidConnection?: (connection: Connection) => boolean;
}

/**
 * BaseNode Component
 *
 * Provides foundational node rendering with category-based styling,
 * execution status visualization, error/warning badges, and accessible
 * connection handles. Optimized for performance with React.memo.
 */
export const BaseNode = memo<BaseNodeProps>(
  ({
    id,
    data,
    category,
    icon = 'Box',
    supportsMultipleInputs = false,
    supportsMultipleOutputs = false,
    selected = false,
    isConnectable = true,
    children,
    isValidConnection,
  }) => {
    const colors = NODE_CATEGORY_COLORS[category];
    const Icon = (LucideIcons[icon as keyof typeof LucideIcons] || LucideIcons.Box) as React.ComponentType<{ className?: string }>;

    const errorCount = data.errors?.length || 0;
    const warningCount = data.warnings?.length || 0;

    // Connection validation handler
    const handleIsValidConnection = useCallback(
      (connection: Connection) => {
        if (isValidConnection) {
          return isValidConnection(connection);
        }
        return true;
      },
      [isValidConnection]
    );

    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        role="article"
        aria-label={`${data.label} node`}
        aria-describedby={`node-${id}-description`}
      >
        {/* Input Handle */}
        {supportsMultipleInputs ? (
          <>
            <CustomHandle type="target" position={Position.Top} id="input-1" category={category} isConnectable={isConnectable} />
            <CustomHandle type="target" position={Position.Left} id="input-2" category={category} isConnectable={isConnectable} />
          </>
        ) : (
          <CustomHandle type="target" position={Position.Top} category={category} isConnectable={isConnectable} />
        )}

        {/* Node Container */}
        <div
          className={cn(
            nodeVariants({
              category,
              status: data.status,
              selected: selected ? true : false,
            })
          )}
          tabIndex={0}
          aria-selected={selected}
        >
          {/* Status Indicator */}
          <StatusIndicator status={data.status} />

          {/* Error/Warning Badges */}
          {errorCount > 0 && <Badge count={errorCount} type="error" />}
          {warningCount > 0 && <Badge count={warningCount} type="warning" />}

          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Icon className="h-5 w-5 flex-shrink-0" style={{ color: colors.text }} aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                {data.label}
              </h3>
              {data.description && (
                <p id={`node-${id}-description`} className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {data.description}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          {children && (
            <div className="px-4 py-3 bg-white dark:bg-gray-900">
              {children}
            </div>
          )}
        </div>

        {/* Output Handle */}
        {supportsMultipleOutputs ? (
          <>
            <CustomHandle type="source" position={Position.Bottom} id="output-1" category={category} isConnectable={isConnectable} />
            <CustomHandle type="source" position={Position.Right} id="output-2" category={category} isConnectable={isConnectable} />
          </>
        ) : (
          <CustomHandle type="source" position={Position.Bottom} category={category} isConnectable={isConnectable} />
        )}
      </motion.div>
    );
  },
  // Custom comparison function for React.memo optimization
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.data === nextProps.data &&
      prevProps.isConnectable === nextProps.isConnectable
    );
  }
);

BaseNode.displayName = 'BaseNode';

export default BaseNode;
