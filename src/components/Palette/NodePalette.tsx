/**
 * NodePalette Component
 *
 * Establishes comprehensive node type palette for visual workflow builder.
 * Provides categorized node browsing, search functionality, favorites, and
 * recently used nodes with full accessibility support.
 *
 * Best for: Visual workflow editors requiring discoverable node catalog
 * with personalization features and keyboard-first navigation.
 */

import React, { useEffect, useRef } from 'react';
import { Search, X, Loader2, AlertCircle, Star, Clock } from 'lucide-react';
import { useNodeTypes } from '@/hooks/useNodeTypes';
import { usePaletteStore } from '@/stores/paletteStore';
import { NodeCategory } from './NodeCategory';
import { DraggableNodeItem } from './DraggableNodeItem';
import type { NodeTypeDefinition } from '@/lib/api';

/**
 * NodePalette Props Interface
 */
export interface NodePaletteProps {
  /** Additional CSS classes */
  className?: string;
  /** Callback when node is added to canvas */
  onNodeAdd?: (nodeType: string) => void;
}

/**
 * Empty state component
 */
const EmptyState: React.FC<{ message: string; icon?: React.ReactNode }> = ({
  message,
  icon,
}) => (
  <div
    className="flex flex-col items-center justify-center py-12 px-4 text-center"
    role="status"
  >
    {icon || <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />}
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

/**
 * Loading skeleton for node items
 */
const NodeItemSkeleton: React.FC = () => (
  <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  </div>
);

/**
 * NodePalette Component
 *
 * Renders complete node palette with search, categories, favorites, and recent nodes.
 * Integrates with React Query for data fetching and Zustand for state management.
 *
 * @example
 * ```tsx
 * <NodePalette
 *   onNodeAdd={(nodeType) => console.log('Added:', nodeType)}
 * />
 * ```
 */
export const NodePalette: React.FC<NodePaletteProps> = ({
  className = '',
  onNodeAdd,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Palette store state
  const searchQuery = usePaletteStore((state) => state.searchQuery);
  const setSearchQuery = usePaletteStore((state) => state.setSearchQuery);
  const clearSearch = usePaletteStore((state) => state.clearSearch);
  const recentNodes = usePaletteStore((state) => state.recentNodes);
  const favorites = usePaletteStore((state) => state.favorites);

  // Fetch node types with search
  const {
    groupedNodeTypes,
    nodeTypes,
    isLoading,
    isError,
    error,
    filteredCount,
    totalCount,
  } = useNodeTypes({ searchQuery });

  // Get favorite and recent node definitions
  const favoriteNodeTypes = nodeTypes.filter((node) =>
    favorites.has(node.type_name)
  );
  const recentNodeTypes = nodeTypes.filter((node) =>
    recentNodes.includes(node.type_name)
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  /**
   * Handle search clear
   */
  const handleClearSearch = () => {
    clearSearch();
    searchInputRef.current?.focus();
  };

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search on Ctrl/Cmd + K or P key
      if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === 'k' || event.key === 'p')
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      // Clear search on Escape
      if (event.key === 'Escape' && searchQuery) {
        event.preventDefault();
        clearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, clearSearch]);

  /**
   * Render node list
   */
  const renderNodeList = (
    nodes: NodeTypeDefinition[],
    showSearch = false
  ) => {
    if (nodes.length === 0) return null;

    return (
      <div className="space-y-1">
        {nodes.map((nodeType) => (
          <DraggableNodeItem
            key={nodeType.type_name}
            nodeType={nodeType}
            isSearchResult={showSearch}
            searchQuery={showSearch ? searchQuery : ''}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}
      role="complementary"
      aria-label="Node palette"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Node Palette
        </h2>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              className="w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search nodes... (Ctrl+K)"
            className="
              w-full pl-10 pr-10 py-2 text-sm
              border border-gray-300 dark:border-gray-600
              rounded-lg
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
            aria-label="Search node types"
            aria-describedby="search-results-count"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="
                absolute inset-y-0 right-0 pr-3 flex items-center
                text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                rounded
              "
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {searchQuery && !isLoading && (
          <p
            id="search-results-count"
            className="mt-2 text-xs text-gray-500 dark:text-gray-400"
          >
            {filteredCount} of {totalCount} nodes
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <NodeItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <EmptyState
            message={`Failed to load node types: ${error?.message || 'Unknown error'}`}
            icon={<AlertCircle className="w-12 h-12 text-red-500 mb-3" />}
          />
        )}

        {/* Empty Search Results */}
        {!isLoading &&
          !isError &&
          searchQuery &&
          filteredCount === 0 && (
            <EmptyState
              message={`No nodes found matching "${searchQuery}"`}
            />
          )}

        {/* Node Lists */}
        {!isLoading && !isError && (
          <>
            {/* Favorites Section (only when not searching) */}
            {!searchQuery && favoriteNodeTypes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Favorites
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({favoriteNodeTypes.length})
                  </span>
                </div>
                {renderNodeList(favoriteNodeTypes)}
              </div>
            )}

            {/* Recently Used Section (only when not searching) */}
            {!searchQuery && recentNodeTypes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Recently Used
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({recentNodeTypes.length})
                  </span>
                </div>
                {renderNodeList(recentNodeTypes)}
              </div>
            )}

            {/* Category Sections */}
            {groupedNodeTypes.map((group) => (
              <NodeCategory
                key={group.category}
                category={group.category}
                displayName={group.displayName}
                description={group.description}
                count={group.count}
              >
                {renderNodeList(group.nodeTypes, !!searchQuery)}
              </NodeCategory>
            ))}
          </>
        )}
      </div>

      {/* Screen reader live region for announcements */}
      <div
        id="palette-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
};

NodePalette.displayName = 'NodePalette';

export default NodePalette;
