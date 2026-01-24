/**
 * Plugin Hooks
 *
 * React hooks for interacting with the plugin marketplace API.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Plugin,
  PluginInstallation,
  PluginReview,
  PluginMetrics,
  PluginSearchFilters,
  PluginSearchResult,
  PluginType,
} from '../types/plugins';

const API_BASE = '/api/v1';

// ============================================================================
// API Helpers
// ============================================================================

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Search Hooks
// ============================================================================

export function usePluginSearch(initialFilters?: PluginSearchFilters) {
  const [filters, setFilters] = useState<PluginSearchFilters>(initialFilters || {});
  const [result, setResult] = useState<PluginSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (newFilters?: PluginSearchFilters) => {
    const searchFilters = newFilters || filters;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchFilters.query) params.set('query', searchFilters.query);
      if (searchFilters.type) params.set('type', searchFilters.type);
      if (searchFilters.category) params.set('category', searchFilters.category);
      if (searchFilters.tags?.length) params.set('tags', searchFilters.tags.join(','));
      if (searchFilters.isVerified) params.set('is_verified', 'true');
      if (searchFilters.isOfficial) params.set('is_official', 'true');
      if (searchFilters.minRating) params.set('min_rating', String(searchFilters.minRating));
      if (searchFilters.sortBy) params.set('sort_by', searchFilters.sortBy);

      const data = await fetchApi<PluginSearchResult>(
        `/marketplace/plugins?${params.toString()}`
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<PluginSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    search();
  }, []);

  return {
    plugins: result?.plugins || [],
    total: result?.total || 0,
    hasMore: result?.hasMore || false,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    search,
    refresh: () => search(),
  };
}

// ============================================================================
// Featured Plugins Hook
// ============================================================================

export function useFeaturedPlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<{ plugins: Plugin[] }>('/marketplace/featured')
      .then((data) => setPlugins(data.plugins))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { plugins, loading, error };
}

// ============================================================================
// Popular Plugins Hook
// ============================================================================

export function usePopularPlugins(limit: number = 10) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<{ plugins: Plugin[] }>(`/marketplace/popular?limit=${limit}`)
      .then((data) => setPlugins(data.plugins))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [limit]);

  return { plugins, loading, error };
}

// ============================================================================
// Plugin Details Hook
// ============================================================================

export function usePlugin(pluginId: string | null) {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pluginId) {
      setPlugin(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchApi<Plugin>(`/marketplace/plugins/${pluginId}`)
      .then(setPlugin)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pluginId]);

  return { plugin, loading, error };
}

// ============================================================================
// Plugin Reviews Hook
// ============================================================================

export function usePluginReviews(pluginId: string | null) {
  const [reviews, setReviews] = useState<PluginReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!pluginId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<{ reviews: PluginReview[] }>(
        `/marketplace/plugins/${pluginId}/reviews`
      );
      setReviews(data.reviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [pluginId]);

  const submitReview = useCallback(async (
    rating: number,
    title?: string,
    content?: string
  ) => {
    if (!pluginId) return;

    await fetchApi(`/marketplace/plugins/${pluginId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, title, content }),
    });

    await fetchReviews();
  }, [pluginId, fetchReviews]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, submitReview, refresh: fetchReviews };
}

// ============================================================================
// Installed Plugins Hook
// ============================================================================

export function useInstalledPlugins(type?: PluginType) {
  const [installations, setInstallations] = useState<PluginInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstallations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = type ? `?type=${type}` : '';
      const data = await fetchApi<{ installations: PluginInstallation[] }>(
        `/plugins/installed${params}`
      );
      setInstallations(data.installations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load installations');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  return {
    installations,
    loading,
    error,
    refresh: fetchInstallations,
  };
}

// ============================================================================
// Plugin Installation Hook
// ============================================================================

export function usePluginInstallation(pluginId: string | null) {
  const [installation, setInstallation] = useState<PluginInstallation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInstallation = useCallback(async () => {
    if (!pluginId) {
      setInstallation(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<PluginInstallation | null>(
        `/plugins/${pluginId}/installation`
      );
      setInstallation(data);
    } catch (err) {
      // 404 means not installed
      if (err instanceof Error && err.message.includes('404')) {
        setInstallation(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to check installation');
      }
    } finally {
      setLoading(false);
    }
  }, [pluginId]);

  const install = useCallback(async (
    configuration?: Record<string, unknown>,
    grantPermissions?: string[]
  ) => {
    if (!pluginId) return;

    setActionLoading(true);
    setError(null);

    try {
      const data = await fetchApi<PluginInstallation>(`/plugins/${pluginId}/install`, {
        method: 'POST',
        body: JSON.stringify({ configuration, grant_permissions: grantPermissions }),
      });
      setInstallation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [pluginId]);

  const uninstall = useCallback(async () => {
    if (!pluginId) return;

    setActionLoading(true);
    setError(null);

    try {
      await fetchApi(`/plugins/${pluginId}/uninstall`, { method: 'POST' });
      setInstallation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uninstallation failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [pluginId]);

  const updateConfig = useCallback(async (configuration: Record<string, unknown>) => {
    if (!pluginId) return;

    setActionLoading(true);
    setError(null);

    try {
      const data = await fetchApi<PluginInstallation>(`/plugins/${pluginId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ configuration }),
      });
      setInstallation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Configuration update failed');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [pluginId]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (!pluginId) return;

    setActionLoading(true);
    setError(null);

    try {
      const endpoint = enabled ? 'enable' : 'disable';
      const data = await fetchApi<PluginInstallation>(`/plugins/${pluginId}/${endpoint}`, {
        method: 'POST',
      });
      setInstallation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plugin state');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [pluginId]);

  useEffect(() => {
    fetchInstallation();
  }, [fetchInstallation]);

  return {
    installation,
    isInstalled: !!installation,
    loading,
    error,
    actionLoading,
    install,
    uninstall,
    updateConfig,
    setEnabled,
    refresh: fetchInstallation,
  };
}

// ============================================================================
// Plugin Metrics Hook
// ============================================================================

export function usePluginMetrics(pluginId: string | null, period: 'day' | 'week' | 'month' = 'week') {
  const [metrics, setMetrics] = useState<PluginMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pluginId) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetchApi<PluginMetrics>(`/plugins/${pluginId}/metrics?period=${period}`)
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [pluginId, period]);

  return { metrics, loading, error };
}

// ============================================================================
// Plugin Categories Hook
// ============================================================================

export function usePluginCategories(type?: PluginType) {
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = type ? `?type=${type}` : '';
    fetchApi<{ categories: Array<{ name: string; count: number }> }>(
      `/marketplace/categories${params}`
    )
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type]);

  return { categories, loading, error };
}
