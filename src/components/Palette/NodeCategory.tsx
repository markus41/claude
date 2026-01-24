/**
 * NodeCategory Component
 *
 * Establishes collapsible category section for node palette organization.
 * Provides category header with icon, count badge, and expand/collapse functionality.
 *
 * Best for: Hierarchical node organization with visual grouping and
 * keyboard-accessible collapsible sections.
 */

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NodeCategory as NodeCategoryType } from '@/types/workflow';
import { usePaletteStore } from '@/stores/paletteStore';

/**
 * Category icon mapping
 */
const CATEGORY_ICONS: Record<NodeCategoryType, React.ReactNode> = {
  trigger: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  phase: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  agent: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
  control: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  action: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  terminator: (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

/**
 * Category color schemes
 */
const CATEGORY_COLORS: Record<
  NodeCategoryType,
  { text: string; bg: string; border: string }
> = {
  trigger: {
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  phase: {
    text: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  agent: {
    text: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-200 dark:border-purple-800',
  },
  control: {
    text: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
  action: {
    text: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950',
    border: 'border-teal-200 dark:border-teal-800',
  },
  terminator: {
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
  },
};

/**
 * NodeCategory Props Interface
 */
export interface NodeCategoryProps {
  /** Category identifier */
  category: NodeCategoryType;
  /** Category display name */
  displayName: string;
  /** Category description */
  description: string;
  /** Number of nodes in category */
  count: number;
  /** Child nodes to render */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * NodeCategory Component
 *
 * Renders collapsible category section with header and node list.
 * Integrates with paletteStore for persistent collapse state.
 *
 * @example
 * ```tsx
 * <NodeCategory
 *   category="trigger"
 *   displayName="Triggers"
 *   description="Start workflow execution"
 *   count={5}
 * >
 *   {nodeItems}
 * </NodeCategory>
 * ```
 */
export const NodeCategory: React.FC<NodeCategoryProps> = ({
  category,
  displayName,
  description,
  count,
  children,
  className = '',
}) => {
  const isCollapsed = usePaletteStore(
    (state) => state.collapsedCategories[category] || false
  );
  const toggleCategory = usePaletteStore((state) => state.toggleCategory);

  const colors = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];

  const handleToggle = () => {
    toggleCategory(category);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {/* Category Header */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-3 py-2 flex items-center justify-between
          rounded-lg border transition-colors
          ${colors.bg} ${colors.border}
          hover:bg-opacity-80 dark:hover:bg-opacity-80
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        aria-expanded={!isCollapsed}
        aria-controls={`category-${category}-content`}
        aria-label={`${displayName} category, ${count} node${count !== 1 ? 's' : ''}, ${isCollapsed ? 'collapsed' : 'expanded'}`}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Expand/Collapse Icon */}
          <span className={colors.text} aria-hidden="true">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>

          {/* Category Icon */}
          <span className={colors.text} aria-hidden="true">
            {icon}
          </span>

          {/* Category Name */}
          <span className={`font-semibold ${colors.text}`}>{displayName}</span>

          {/* Node Count Badge */}
          <span
            className={`
              px-2 py-0.5 text-xs font-medium rounded-full
              ${colors.bg} ${colors.text} ring-1 ring-inset ring-current
            `}
            aria-label={`${count} node${count !== 1 ? 's' : ''}`}
          >
            {count}
          </span>
        </div>

        {/* Description (on larger screens) */}
        <span
          className={`hidden md:block text-xs ${colors.text} opacity-70`}
          aria-hidden="true"
        >
          {description}
        </span>
      </button>

      {/* Category Content */}
      {!isCollapsed && (
        <div
          id={`category-${category}-content`}
          className="mt-2 space-y-1"
          role="region"
          aria-label={`${displayName} nodes`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

NodeCategory.displayName = 'NodeCategory';

export default NodeCategory;
