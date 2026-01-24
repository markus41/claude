/**
 * DraggableNodeItem Component
 *
 * Establishes draggable node palette item with favorite toggle and drag preview.
 * Integrates with React Flow for seamless drag-and-drop to canvas.
 *
 * Best for: Node palette items requiring drag-and-drop functionality with
 * visual feedback, favorites management, and accessibility support.
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { usePaletteStore } from '@/stores/paletteStore';
import { useWorkflowStore } from '@/stores/workflowStore';
import type { NodeTypeDefinition } from '@/lib/api';
import { NODE_METADATA } from '@/types/nodes';
import type { VisualWorkflowNode } from '@/types/workflow';

/**
 * DraggableNodeItem Props Interface
 */
export interface DraggableNodeItemProps {
  /** Node type definition from API */
  nodeType: NodeTypeDefinition;
  /** Whether item is from search results (for highlighting) */
  isSearchResult?: boolean;
  /** Search query for text highlighting */
  searchQuery?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Highlight text matching search query
 */
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-800 text-inherit"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * DraggableNodeItem Component
 *
 * Renders draggable node type item with icon, name, description, and favorite button.
 * Supports drag-and-drop to canvas, keyboard navigation, and screen reader announcements.
 *
 * @example
 * ```tsx
 * <DraggableNodeItem
 *   nodeType={triggerEpicNodeType}
 *   searchQuery="epic"
 * />
 * ```
 */
export const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({
  nodeType,
  isSearchResult = false,
  searchQuery = '',
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isFavorite = usePaletteStore((state) =>
    state.isFavorite(nodeType.type_name)
  );
  const toggleFavorite = usePaletteStore((state) => state.toggleFavorite);
  const addRecentNode = usePaletteStore((state) => state.addRecentNode);
  const addNode = useWorkflowStore((state) => state.addNode);

  // Get metadata for styling
  const metadata = NODE_METADATA[nodeType.type_name as keyof typeof NODE_METADATA];

  /**
   * Handle drag start
   */
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);

    // Set drag data for React Flow
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/reactflow', nodeType.type_name);
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: nodeType.type_name,
        displayName: nodeType.display_name,
        category: nodeType.category,
      })
    );

    // Add to recent nodes
    addRecentNode(nodeType.type_name);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  /**
   * Handle favorite toggle
   */
  const handleFavoriteClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(nodeType.type_name);
  };

  /**
   * Handle keyboard interaction for drag
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Allow Enter or Space to add node to center of canvas
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      const newNode: VisualWorkflowNode = {
        id: `node-${Date.now()}`,
        type: nodeType.type_name,
        position: { x: 250, y: 250 }, // Center-ish position
        data: {
          label: nodeType.display_name,
          ...nodeType.default_config,
        },
      };

      addNode(newNode);
      addRecentNode(nodeType.type_name);

      // Announce to screen reader
      const announcement = `Added ${nodeType.display_name} node to canvas`;
      const liveRegion = document.getElementById('palette-live-region');
      if (liveRegion) {
        liveRegion.textContent = announcement;
      }
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${nodeType.display_name} - ${nodeType.description}. Press Enter or Space to add to canvas, or drag to position.${isFavorite ? ' Favorited.' : ''}`}
      className={`
        group relative px-3 py-2 rounded-lg border transition-all
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        bg-white dark:bg-gray-800
        border-gray-200 dark:border-gray-700
        hover:border-gray-300 dark:hover:border-gray-600
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Node Icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
          style={{
            backgroundColor: metadata?.colors.background,
            color: metadata?.colors.text,
          }}
          aria-hidden="true"
        >
          <span className="text-sm font-semibold">
            {nodeType.icon || nodeType.display_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Node Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {highlightText(nodeType.display_name, searchQuery)}
            </h4>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {highlightText(nodeType.description, searchQuery)}
          </p>
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={`
            flex-shrink-0 p-1 rounded transition-colors
            ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Star
            className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Drag hint (visible on hover) */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Drag to canvas
        </span>
      </div>
    </div>
  );
};

DraggableNodeItem.displayName = 'DraggableNodeItem';

export default DraggableNodeItem;
