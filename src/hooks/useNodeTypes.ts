/**
 * Node Types Data Hook
 *
 * Establishes React Query integration for node type catalog fetching.
 * Provides search, filtering, and category grouping with optimized caching.
 *
 * Best for: Component-level node type data access with automatic refetching,
 * error handling, and loading state management.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchNodeTypes, type NodeTypeDefinition } from '@/lib/api';
import type { NodeCategory } from '@/types/workflow';

/**
 * Grouped node types by category
 */
export interface GroupedNodeTypes {
  category: NodeCategory;
  displayName: string;
  description: string;
  nodeTypes: NodeTypeDefinition[];
  count: number;
}

/**
 * Category display metadata
 */
const CATEGORY_METADATA: Record<
  NodeCategory,
  { displayName: string; description: string; order: number }
> = {
  trigger: {
    displayName: 'Triggers',
    description: 'Start workflow execution',
    order: 1,
  },
  phase: {
    displayName: 'Phases',
    description: 'Structured workflow phases',
    order: 2,
  },
  agent: {
    displayName: 'Agents',
    description: 'AI agent execution',
    order: 3,
  },
  control: {
    displayName: 'Control Flow',
    description: 'Flow control and logic',
    order: 4,
  },
  action: {
    displayName: 'Actions',
    description: 'External integrations',
    order: 5,
  },
  terminator: {
    displayName: 'Terminators',
    description: 'Workflow completion',
    order: 6,
  },
};

/**
 * Node types query options
 */
export interface UseNodeTypesOptions {
  /** Search query to filter node types */
  searchQuery?: string;
  /** Category to filter by */
  category?: NodeCategory;
  /** Enable query (default: true) */
  enabled?: boolean;
}

/**
 * Search node types by query string
 *
 * Searches across node type name and description.
 *
 * @param nodeTypes - Node types to search
 * @param query - Search query
 * @returns Filtered node types
 */
function searchNodeTypes(
  nodeTypes: NodeTypeDefinition[],
  query: string
): NodeTypeDefinition[] {
  if (!query.trim()) return nodeTypes;

  const lowerQuery = query.toLowerCase().trim();
  return nodeTypes.filter(
    (node) =>
      node.display_name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.type_name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Group node types by category
 *
 * @param nodeTypes - Node types to group
 * @returns Grouped node types sorted by category order
 */
function groupNodeTypesByCategory(
  nodeTypes: NodeTypeDefinition[]
): GroupedNodeTypes[] {
  const grouped = new Map<NodeCategory, NodeTypeDefinition[]>();

  // Group by category
  nodeTypes.forEach((nodeType) => {
    const category = nodeType.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(nodeType);
  });

  // Convert to array with metadata
  const result: GroupedNodeTypes[] = Array.from(grouped.entries()).map(
    ([category, types]) => ({
      category,
      displayName: CATEGORY_METADATA[category].displayName,
      description: CATEGORY_METADATA[category].description,
      nodeTypes: types,
      count: types.length,
    })
  );

  // Sort by category order
  result.sort(
    (a, b) =>
      CATEGORY_METADATA[a.category].order -
      CATEGORY_METADATA[b.category].order
  );

  return result;
}

/**
 * Fetch and filter node types with React Query
 *
 * Provides node type catalog with search and category filtering.
 * Implements 5-minute stale time for optimal performance.
 *
 * @param options - Query options
 * @returns Query result with node types data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useNodeTypes({
 *   searchQuery: 'trigger',
 *   category: 'trigger'
 * });
 * ```
 */
export function useNodeTypes(options: UseNodeTypesOptions = {}) {
  const { searchQuery = '', category, enabled = true } = options;

  // Fetch node types from API
  const query = useQuery({
    queryKey: ['nodeTypes'],
    queryFn: fetchNodeTypes,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized filtered and grouped node types
  const processedData = useMemo(() => {
    if (!query.data?.node_types) return null;

    let nodeTypes = query.data.node_types;

    // Filter by category if specified
    if (category) {
      nodeTypes = nodeTypes.filter((node) => node.category === category);
    }

    // Filter by search query
    const searchedNodeTypes = searchNodeTypes(nodeTypes, searchQuery);

    // Group by category
    const grouped = groupNodeTypesByCategory(searchedNodeTypes);

    return {
      all: searchedNodeTypes,
      grouped,
      total: query.data.total,
      filtered: searchedNodeTypes.length,
    };
  }, [query.data, category, searchQuery]);

  return {
    ...query,
    nodeTypes: processedData?.all || [],
    groupedNodeTypes: processedData?.grouped || [],
    totalCount: processedData?.total || 0,
    filteredCount: processedData?.filtered || 0,
  };
}

/**
 * Get single node type by name
 *
 * @param typeName - Node type identifier
 * @returns Node type definition or undefined
 *
 * @example
 * ```tsx
 * const { data: nodeType } = useNodeType('trigger.epic');
 * ```
 */
export function useNodeType(typeName: string) {
  const { nodeTypes, ...query } = useNodeTypes();

  const nodeType = useMemo(
    () => nodeTypes.find((node) => node.type_name === typeName),
    [nodeTypes, typeName]
  );

  return {
    ...query,
    nodeType,
  };
}
