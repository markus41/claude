/**
 * Plugin Hooks
 *
 * React hooks for interacting with the plugin marketplace API.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import {
  disablePlugin,
  enablePlugin,
  getFeaturedPlugins,
  getInstalledPlugins,
  getMarketplacePlugin,
  getPluginCategories,
  getPluginInstallation,
  getPluginMetrics,
  getPluginReviews,
  getPopularPlugins,
  installPlugin,
  searchMarketplacePlugins,
  submitPluginReview,
  uninstallPlugin,
  updatePluginConfiguration,
} from '@/lib/api/plugins';
import type {
  Plugin,
  PluginCategory,
  PluginInstallation,
  PluginMetrics,
  PluginMetricsPeriod,
  PluginReview,
  PluginSearchFilters,
  PluginType,
} from '../types/plugins';

const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return 'Request failed';
};

const pluginQueryKeys = {
  all: ['plugins'] as const,
  marketplace: ['plugins', 'marketplace'] as const,
  search: (filters: PluginSearchFilters) =>
    ['plugins', 'marketplace', 'search', filters] as const,
  featured: ['plugins', 'featured'] as const,
  popular: (limit: number) => ['plugins', 'popular', limit] as const,
  details: (pluginId: string) => ['plugins', 'details', pluginId] as const,
  reviews: (pluginId: string) => ['plugins', 'reviews', pluginId] as const,
  metrics: (pluginId: string, period: PluginMetricsPeriod) =>
    ['plugins', 'metrics', pluginId, period] as const,
  installed: ['plugins', 'installed'] as const,
  installedByType: (type?: PluginType) => ['plugins', 'installed', type ?? 'all'] as const,
  installation: (pluginId: string) => ['plugins', 'installation', pluginId] as const,
  categories: (type?: PluginType) => ['plugins', 'categories', type ?? 'all'] as const,
};

// ============================================================================
// Search Hooks
// ============================================================================

export function usePluginSearch(initialFilters?: PluginSearchFilters) {
  const [filters, setFilters] = useState<PluginSearchFilters>(initialFilters || {});

  const query = useQuery({
    queryKey: pluginQueryKeys.search(filters),
    queryFn: () => searchMarketplacePlugins(filters),
  });

  const updateFilters = useCallback((newFilters: Partial<PluginSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const search = useCallback((newFilters?: PluginSearchFilters) => {
    if (newFilters) {
      setFilters(newFilters);
      return;
    }

    void query.refetch();
  }, [query]);

  return {
    plugins: query.data?.plugins || [],
    total: query.data?.total || 0,
    hasMore: query.data?.hasMore || false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    filters,
    setFilters: updateFilters,
    search,
    refresh: query.refetch,
  };
}

// ============================================================================
// Featured Plugins Hook
// ============================================================================

export function useFeaturedPlugins() {
  const query = useQuery({
    queryKey: pluginQueryKeys.featured,
    queryFn: getFeaturedPlugins,
  });

  return {
    plugins: query.data?.plugins || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}

// ============================================================================
// Popular Plugins Hook
// ============================================================================

export function usePopularPlugins(limit: number = 10) {
  const query = useQuery({
    queryKey: pluginQueryKeys.popular(limit),
    queryFn: () => getPopularPlugins(limit),
  });

  return {
    plugins: query.data?.plugins || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}

// ============================================================================
// Plugin Details Hook
// ============================================================================

export function usePlugin(pluginId: string | null) {
  const query = useQuery({
    queryKey: pluginId ? pluginQueryKeys.details(pluginId) : [...pluginQueryKeys.all, 'details', 'none'],
    queryFn: () => getMarketplacePlugin(pluginId!),
    enabled: !!pluginId,
  });

  return {
    plugin: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}

// ============================================================================
// Plugin Reviews Hook
// ============================================================================

export function usePluginReviews(pluginId: string | null) {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: pluginId
      ? pluginQueryKeys.reviews(pluginId)
      : [...pluginQueryKeys.all, 'reviews', 'none'],
    queryFn: async () => {
      const data = await getPluginReviews(pluginId!);
      return data.reviews;
    },
    enabled: !!pluginId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({
      rating,
      title,
      content,
    }: {
      rating: number;
      title?: string;
      content?: string;
    }) => {
      if (!pluginId) return;
      await submitPluginReview(pluginId, { rating, title, content });
    },
    onSuccess: async () => {
      if (!pluginId) return;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pluginQueryKeys.reviews(pluginId) }),
        queryClient.invalidateQueries({ queryKey: pluginQueryKeys.details(pluginId) }),
      ]);
    },
  });

  const submitReview = useCallback(
    async (rating: number, title?: string, content?: string) => {
      await submitReviewMutation.mutateAsync({ rating, title, content });
    },
    [submitReviewMutation]
  );

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    isError: reviewsQuery.isError,
    error: getErrorMessage(reviewsQuery.error || submitReviewMutation.error),
    loading: reviewsQuery.isLoading,
    submitReview,
    submittingReview: submitReviewMutation.isPending,
    refresh: reviewsQuery.refetch,
  };
}

// ============================================================================
// Installed Plugins Hook
// ============================================================================

export function useInstalledPlugins(type?: PluginType) {
  const query = useQuery({
    queryKey: pluginQueryKeys.installedByType(type),
    queryFn: async () => {
      const data = await getInstalledPlugins(type);
      return data.installations;
    },
  });

  return {
    installations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}

// ============================================================================
// Plugin Installation Hook
// ============================================================================

export function usePluginInstallation(pluginId: string | null) {
  const queryClient = useQueryClient();

  const installationQuery = useQuery({
    queryKey: pluginId
      ? pluginQueryKeys.installation(pluginId)
      : [...pluginQueryKeys.all, 'installation', 'none'],
    queryFn: async () => {
      try {
        return await getPluginInstallation(pluginId!);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!pluginId,
  });

  const invalidateInstallationRelatedQueries = useCallback(async () => {
    if (!pluginId) return;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pluginQueryKeys.installation(pluginId) }),
      queryClient.invalidateQueries({ queryKey: pluginQueryKeys.installed }),
      queryClient.invalidateQueries({ queryKey: pluginQueryKeys.details(pluginId) }),
    ]);
  }, [pluginId, queryClient]);

  const installMutation = useMutation({
    mutationFn: async ({
      configuration,
      grantPermissions,
    }: {
      configuration?: Record<string, unknown>;
      grantPermissions?: string[];
    }) => {
      if (!pluginId) return;
      await installPlugin(pluginId, {
        configuration,
        grant_permissions: grantPermissions,
      });
    },
    onSuccess: invalidateInstallationRelatedQueries,
  });

  const uninstallMutation = useMutation({
    mutationFn: async () => {
      if (!pluginId) return;
      await uninstallPlugin(pluginId);
    },
    onSuccess: invalidateInstallationRelatedQueries,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (configuration: Record<string, unknown>) => {
      if (!pluginId) return;
      await updatePluginConfiguration(pluginId, { configuration });
    },
    onSuccess: invalidateInstallationRelatedQueries,
  });

  const setEnabledMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!pluginId) return;
      if (enabled) {
        await enablePlugin(pluginId);
        return;
      }

      await disablePlugin(pluginId);
    },
    onSuccess: invalidateInstallationRelatedQueries,
  });

  const install = useCallback(
    async (configuration?: Record<string, unknown>, grantPermissions?: string[]) => {
      await installMutation.mutateAsync({ configuration, grantPermissions });
    },
    [installMutation]
  );

  const uninstall = useCallback(async () => {
    await uninstallMutation.mutateAsync();
  }, [uninstallMutation]);

  const updateConfig = useCallback(
    async (configuration: Record<string, unknown>) => {
      await updateConfigMutation.mutateAsync(configuration);
    },
    [updateConfigMutation]
  );

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      await setEnabledMutation.mutateAsync(enabled);
    },
    [setEnabledMutation]
  );

  const actionError =
    installMutation.error ||
    uninstallMutation.error ||
    updateConfigMutation.error ||
    setEnabledMutation.error;

  const actionLoading =
    installMutation.isPending ||
    uninstallMutation.isPending ||
    updateConfigMutation.isPending ||
    setEnabledMutation.isPending;

  return {
    installation: installationQuery.data ?? null,
    isInstalled: !!installationQuery.data,
    isLoading: installationQuery.isLoading,
    isError: installationQuery.isError,
    error: getErrorMessage(installationQuery.error || actionError),
    loading: installationQuery.isLoading,
    actionLoading,
    install,
    uninstall,
    updateConfig,
    setEnabled,
    refresh: installationQuery.refetch,
  };
}

// ============================================================================
// Plugin Metrics Hook
// ============================================================================

export function usePluginMetrics(
  pluginId: string | null,
  period: PluginMetricsPeriod = 'week'
) {
  const query = useQuery({
    queryKey: pluginId
      ? pluginQueryKeys.metrics(pluginId, period)
      : [...pluginQueryKeys.all, 'metrics', 'none', period],
    queryFn: () => getPluginMetrics(pluginId!, period),
    enabled: !!pluginId,
  });

  return {
    metrics: (query.data as PluginMetrics | null) || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}

// ============================================================================
// Plugin Categories Hook
// ============================================================================

export function usePluginCategories(type?: PluginType) {
  const query = useQuery({
    queryKey: pluginQueryKeys.categories(type),
    queryFn: async () => {
      const data = await getPluginCategories(type);
      return data.categories;
    },
  });

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: getErrorMessage(query.error),
    loading: query.isLoading,
    refresh: query.refetch,
  };
}
