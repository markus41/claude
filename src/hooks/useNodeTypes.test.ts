/**
 * useNodeTypes Hook Tests
 *
 * Comprehensive test suite for node types data hook.
 * Validates data fetching, search, filtering, and grouping functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNodeTypes } from './useNodeTypes';
import * as nodeTypesApi from '@/lib/api/nodeTypes';

// Mock API
vi.mock('@/lib/api/nodeTypes');

const mockNodeTypes = {
  node_types: [
    {
      type_name: 'trigger.epic',
      display_name: 'Epic Trigger',
      category: 'trigger' as const,
      description: 'Trigger workflow from Jira Epic events',
      icon: 'flag',
      color_scheme: '#3b82f6',
      input_schemas: {},
      output_schemas: {},
      config_schema: {},
    },
    {
      type_name: 'phase.explore',
      display_name: 'Explore Phase',
      category: 'phase' as const,
      description: 'Explore codebase and gather context',
      icon: 'search',
      color_scheme: '#10b981',
      input_schemas: {},
      output_schemas: {},
      config_schema: {},
    },
    {
      type_name: 'agent.single',
      display_name: 'Single Agent',
      category: 'agent' as const,
      description: 'Execute task with single AI agent',
      icon: 'user',
      color_scheme: '#8b5cf6',
      input_schemas: {},
      output_schemas: {},
      config_schema: {},
    },
  ],
  total: 3,
};

describe('useNodeTypes', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch and return node types', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(() => useNodeTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.nodeTypes).toHaveLength(3);
    expect(result.current.totalCount).toBe(3);
  });

  it('should group node types by category', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(() => useNodeTypes(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.groupedNodeTypes).toHaveLength(3);
    expect(result.current.groupedNodeTypes[0].category).toBe('trigger');
    expect(result.current.groupedNodeTypes[1].category).toBe('phase');
    expect(result.current.groupedNodeTypes[2].category).toBe('agent');
  });

  it('should filter by search query', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(
      () => useNodeTypes({ searchQuery: 'epic' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.nodeTypes).toHaveLength(1);
    expect(result.current.nodeTypes[0].type_name).toBe('trigger.epic');
    expect(result.current.filteredCount).toBe(1);
  });

  it('should filter by category', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(
      () => useNodeTypes({ category: 'trigger' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.nodeTypes).toHaveLength(1);
    expect(result.current.nodeTypes[0].category).toBe('trigger');
  });

  it('should handle empty search results', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(
      () => useNodeTypes({ searchQuery: 'nonexistent' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.nodeTypes).toHaveLength(0);
    expect(result.current.filteredCount).toBe(0);
  });

  it('should handle loading state', () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useNodeTypes(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.nodeTypes).toEqual([]);
  });

  it('should handle error state', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockRejectedValue(error);

    const { result } = renderHook(() => useNodeTypes(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.nodeTypes).toEqual([]);
  });

  it('should respect enabled option', () => {
    const { result } = renderHook(() => useNodeTypes({ enabled: false }), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });

  it('should search across name and description', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    const { result } = renderHook(
      () => useNodeTypes({ searchQuery: 'codebase' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should find "Explore Phase" via description "Explore codebase..."
    expect(result.current.nodeTypes).toHaveLength(1);
    expect(result.current.nodeTypes[0].type_name).toBe('phase.explore');
  });
});
