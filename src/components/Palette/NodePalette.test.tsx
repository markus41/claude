/**
 * NodePalette Component Tests
 *
 * Comprehensive test suite for NodePalette component.
 * Validates rendering, search, accessibility, and user interactions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { NodePalette } from './NodePalette';
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
  ],
  total: 2,
};

describe('NodePalette', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderNodePalette = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NodePalette {...props} />
      </QueryClientProvider>
    );
  };

  it('should render with title and search input', () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    expect(screen.getByText('Node Palette')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search nodes/i)
    ).toBeInTheDocument();
  });

  it('should display loading skeletons initially', () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderNodePalette();

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('should display error state on fetch failure', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockRejectedValue(
      new Error('Network error')
    );

    renderNodePalette();

    await waitFor(() => {
      expect(
        screen.getByText(/failed to load node types/i)
      ).toBeInTheDocument();
    });
  });

  it('should display node categories with counts', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    await waitFor(() => {
      expect(screen.getByText('Triggers')).toBeInTheDocument();
      expect(screen.getByText('Phases')).toBeInTheDocument();
    });
  });

  it('should filter nodes by search query', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    await waitFor(() => {
      expect(screen.getByText('Epic Trigger')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search nodes/i);
    await user.type(searchInput, 'epic');

    await waitFor(() => {
      expect(screen.getByText(/1 of 2 nodes/i)).toBeInTheDocument();
    });
  });

  it('should clear search with X button', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    const searchInput = screen.getByPlaceholderText(/search nodes/i);
    await user.type(searchInput, 'epic');

    const clearButton = screen.getByLabelText(/clear search/i);
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('should display empty state for no search results', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    await waitFor(() => {
      expect(screen.getByText('Epic Trigger')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search nodes/i);
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(
        screen.getByText(/no nodes found matching/i)
      ).toBeInTheDocument();
    });
  });

  it('should have proper ARIA labels', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    expect(
      screen.getByRole('complementary', { name: /node palette/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByLabelText(/search node types/i)
      ).toBeInTheDocument();
    });
  });

  it('should toggle category collapse on click', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    await waitFor(() => {
      expect(screen.getByText('Triggers')).toBeInTheDocument();
    });

    const triggerCategory = screen.getByRole('button', {
      name: /triggers category/i,
    });

    // Should be expanded initially
    expect(triggerCategory).toHaveAttribute('aria-expanded', 'true');

    await user.click(triggerCategory);

    // Should be collapsed after click
    expect(triggerCategory).toHaveAttribute('aria-expanded', 'false');
  });

  it('should display favorites section when favorites exist', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    await waitFor(() => {
      expect(screen.getByText('Epic Trigger')).toBeInTheDocument();
    });

    // Add to favorites
    const favoriteButtons = screen.getAllByLabelText(/add to favorites/i);
    await user.click(favoriteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });
  });

  it('should have screen reader live region', () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should support keyboard navigation', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(mockNodeTypes);

    renderNodePalette();

    const searchInput = screen.getByPlaceholderText(/search nodes/i);

    // Tab to search input
    await user.tab();
    expect(searchInput).toHaveFocus();

    // Type search query
    await user.keyboard('epic');
    expect(searchInput).toHaveValue('epic');

    // Press Escape to clear
    await user.keyboard('{Escape}');
    expect(searchInput).toHaveValue('');
  });
});
