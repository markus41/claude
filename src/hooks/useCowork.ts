/**
 * Cowork Marketplace Hooks
 *
 * React hooks for interacting with the Cowork marketplace API.
 * Built on TanStack React Query for server state management.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import {
  searchCoworkItems,
  getFeaturedCoworkItems,
  getTrendingCoworkItems,
  getCuratedCollections,
  getCoworkItem,
  getRecommendedItems,
  getInstalledCoworkItems,
  getCoworkInstallation,
  installCoworkItem,
  uninstallCoworkItem,
  updateCoworkConfiguration,
  getActiveSessions,
  getSession,
  startSession,
  pauseSession,
  resumeSession,
  cancelSession,
  getSessionHistory,
  getCoworkReviews,
  submitCoworkReview,
  getCoworkMetrics,
} from '@/lib/api/cowork';
import type {
  CoworkItem,
  CoworkItemType,
  CoworkSearchFilters,
  CoworkMetricsPeriod,
  CoworkSession,
} from '@/types/cowork';

const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return 'Request failed';
};

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------

const coworkKeys = {
  all: ['cowork'] as const,
  marketplace: ['cowork', 'marketplace'] as const,
  search: (filters: CoworkSearchFilters) =>
    ['cowork', 'marketplace', 'search', filters] as const,
  featured: ['cowork', 'featured'] as const,
  trending: (limit: number) => ['cowork', 'trending', limit] as const,
  collections: ['cowork', 'collections'] as const,
  recommended: ['cowork', 'recommended'] as const,
  details: (itemId: string) => ['cowork', 'details', itemId] as const,
  reviews: (itemId: string) => ['cowork', 'reviews', itemId] as const,
  metrics: (itemId: string, period: CoworkMetricsPeriod) =>
    ['cowork', 'metrics', itemId, period] as const,
  installed: ['cowork', 'installed'] as const,
  installedByType: (type?: CoworkItemType) =>
    ['cowork', 'installed', type ?? 'all'] as const,
  installation: (itemId: string) => ['cowork', 'installation', itemId] as const,
  sessions: ['cowork', 'sessions'] as const,
  session: (sessionId: string) => ['cowork', 'sessions', sessionId] as const,
  sessionHistory: (limit: number) =>
    ['cowork', 'sessions', 'history', limit] as const,
};

// ---------------------------------------------------------------------------
// Search & Discovery
// ---------------------------------------------------------------------------

export function useCoworkSearch(initialFilters?: CoworkSearchFilters) {
  const [filters, setFilters] = useState<CoworkSearchFilters>(
    initialFilters || {}
  );

  const query = useQuery({
    queryKey: coworkKeys.search(filters),
    queryFn: () => searchCoworkItems(filters),
  });

  const updateFilters = useCallback(
    (newFilters: Partial<CoworkSearchFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const search = useCallback(
    (newFilters?: CoworkSearchFilters) => {
      if (newFilters) {
        setFilters(newFilters);
        return;
      }
      void query.refetch();
    },
    [query]
  );

  return {
    items: query.data?.items || [],
    total: query.data?.total || 0,
    hasMore: query.data?.hasMore || false,
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    filters,
    setFilters: updateFilters,
    search,
    refresh: query.refetch,
  };
}

export function useFeaturedCowork() {
  const query = useQuery({
    queryKey: coworkKeys.featured,
    queryFn: getFeaturedCoworkItems,
  });

  return {
    items: query.data?.items || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

export function useTrendingCowork(limit = 10) {
  const query = useQuery({
    queryKey: coworkKeys.trending(limit),
    queryFn: () => getTrendingCoworkItems(limit),
  });

  return {
    items: query.data?.items || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

export function useCuratedCollections() {
  const query = useQuery({
    queryKey: coworkKeys.collections,
    queryFn: getCuratedCollections,
  });

  return {
    collections: query.data?.collections || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

export function useRecommendedCowork() {
  const query = useQuery({
    queryKey: coworkKeys.recommended,
    queryFn: getRecommendedItems,
  });

  return {
    items: query.data?.items || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// Item Details
// ---------------------------------------------------------------------------

export function useCoworkItem(itemId: string | null) {
  const query = useQuery({
    queryKey: itemId
      ? coworkKeys.details(itemId)
      : [...coworkKeys.all, 'details', 'none'],
    queryFn: () => getCoworkItem(itemId!),
    enabled: !!itemId,
  });

  return {
    item: query.data || null,
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export function useCoworkReviews(itemId: string | null) {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: itemId
      ? coworkKeys.reviews(itemId)
      : [...coworkKeys.all, 'reviews', 'none'],
    queryFn: async () => {
      const data = await getCoworkReviews(itemId!);
      return data.reviews;
    },
    enabled: !!itemId,
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      rating,
      title,
      content,
      usageContext,
    }: {
      rating: number;
      title?: string;
      content?: string;
      usageContext?: string;
    }) => {
      if (!itemId) return;
      await submitCoworkReview(itemId, { rating, title, content, usageContext });
    },
    onSuccess: async () => {
      if (!itemId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: coworkKeys.reviews(itemId) }),
        queryClient.invalidateQueries({ queryKey: coworkKeys.details(itemId) }),
      ]);
    },
  });

  const submitReview = useCallback(
    async (
      rating: number,
      title?: string,
      content?: string,
      usageContext?: string
    ) => {
      await submitMutation.mutateAsync({
        rating,
        title,
        content,
        usageContext,
      });
    },
    [submitMutation]
  );

  return {
    reviews: reviewsQuery.data || [],
    loading: reviewsQuery.isLoading,
    error: getErrorMessage(reviewsQuery.error || submitMutation.error),
    submitReview,
    submitting: submitMutation.isPending,
    refresh: reviewsQuery.refetch,
  };
}

// ---------------------------------------------------------------------------
// Installation
// ---------------------------------------------------------------------------

export function useInstalledCowork(type?: CoworkItemType) {
  const query = useQuery({
    queryKey: coworkKeys.installedByType(type),
    queryFn: async () => {
      const data = await getInstalledCoworkItems(type);
      return data.installations;
    },
  });

  return {
    installations: query.data || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

export function useCoworkInstallation(itemId: string | null) {
  const queryClient = useQueryClient();

  const installationQuery = useQuery({
    queryKey: itemId
      ? coworkKeys.installation(itemId)
      : [...coworkKeys.all, 'installation', 'none'],
    queryFn: async () => {
      try {
        return await getCoworkInstallation(itemId!);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!itemId,
  });

  const invalidateRelated = useCallback(async () => {
    if (!itemId) return;
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: coworkKeys.installation(itemId),
      }),
      queryClient.invalidateQueries({ queryKey: coworkKeys.installed }),
      queryClient.invalidateQueries({ queryKey: coworkKeys.details(itemId) }),
    ]);
  }, [itemId, queryClient]);

  const installMutation = useMutation({
    mutationFn: async (configuration?: Record<string, unknown>) => {
      if (!itemId) return;
      await installCoworkItem(itemId, configuration);
    },
    onSuccess: invalidateRelated,
  });

  const uninstallMutation = useMutation({
    mutationFn: async () => {
      if (!itemId) return;
      await uninstallCoworkItem(itemId);
    },
    onSuccess: invalidateRelated,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (configuration: Record<string, unknown>) => {
      if (!itemId) return;
      await updateCoworkConfiguration(itemId, configuration);
    },
    onSuccess: invalidateRelated,
  });

  const install = useCallback(
    async (configuration?: Record<string, unknown>) => {
      await installMutation.mutateAsync(configuration);
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

  const actionLoading =
    installMutation.isPending ||
    uninstallMutation.isPending ||
    updateConfigMutation.isPending;

  const actionError =
    installMutation.error ||
    uninstallMutation.error ||
    updateConfigMutation.error;

  return {
    installation: installationQuery.data ?? null,
    isInstalled: !!installationQuery.data,
    loading: installationQuery.isLoading,
    error: getErrorMessage(installationQuery.error || actionError),
    actionLoading,
    install,
    uninstall,
    updateConfig,
    refresh: installationQuery.refetch,
  };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function useCoworkSessions() {
  const queryClient = useQueryClient();

  const activeQuery = useQuery({
    queryKey: coworkKeys.sessions,
    queryFn: async () => {
      const data = await getActiveSessions();
      return data.sessions;
    },
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: async ({
      itemId,
      inputs,
    }: {
      itemId: string;
      inputs?: Record<string, unknown>;
    }) => {
      return startSession(itemId, inputs);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coworkKeys.sessions });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coworkKeys.sessions });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coworkKeys.sessions });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: coworkKeys.sessions });
    },
  });

  const start = useCallback(
    async (itemId: string, inputs?: Record<string, unknown>) => {
      return startMutation.mutateAsync({ itemId, inputs });
    },
    [startMutation]
  );

  const pause = useCallback(
    async (sessionId: string) => {
      await pauseMutation.mutateAsync(sessionId);
    },
    [pauseMutation]
  );

  const resume = useCallback(
    async (sessionId: string) => {
      await resumeMutation.mutateAsync(sessionId);
    },
    [resumeMutation]
  );

  const cancel = useCallback(
    async (sessionId: string) => {
      await cancelMutation.mutateAsync(sessionId);
    },
    [cancelMutation]
  );

  return {
    sessions: activeQuery.data || [],
    loading: activeQuery.isLoading,
    error: getErrorMessage(activeQuery.error),
    start,
    pause,
    resume,
    cancel,
    actionLoading:
      startMutation.isPending ||
      pauseMutation.isPending ||
      resumeMutation.isPending ||
      cancelMutation.isPending,
    refresh: activeQuery.refetch,
  };
}

export function useCoworkSession(sessionId: string | null) {
  const query = useQuery({
    queryKey: sessionId
      ? coworkKeys.session(sessionId)
      : [...coworkKeys.all, 'session', 'none'],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const session = query.state.data as CoworkSession | undefined;
      if (session?.status === 'running') return 3000;
      return false;
    },
  });

  return {
    session: query.data || null,
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

export function useCoworkSessionHistory(limit = 20) {
  const query = useQuery({
    queryKey: coworkKeys.sessionHistory(limit),
    queryFn: async () => {
      const data = await getSessionHistory(limit);
      return data.sessions;
    },
  });

  return {
    sessions: query.data || [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export function useCoworkMetrics(
  itemId: string | null,
  period: CoworkMetricsPeriod = 'week'
) {
  const query = useQuery({
    queryKey: itemId
      ? coworkKeys.metrics(itemId, period)
      : [...coworkKeys.all, 'metrics', 'none', period],
    queryFn: () => getCoworkMetrics(itemId!, period),
    enabled: !!itemId,
  });

  return {
    metrics: query.data || null,
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: query.refetch,
  };
}
