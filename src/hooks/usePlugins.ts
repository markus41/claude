/**
 * Plugin Hooks
 *
 * React hooks for interacting with the plugin marketplace API.
 */

import { useState, useEffect, useCallback } from 'react';
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
  PluginReview,
  PluginMetrics,
  PluginMetricsPeriod,
  PluginSearchFilters,
  PluginSearchResult,
  PluginType,
} from '../types/plugins';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

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
      const data = await searchMarketplacePlugins(searchFilters);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Search failed'));
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
    getFeaturedPlugins()
      .then((data) => setPlugins(data.plugins))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load featured plugins')))
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
    getPopularPlugins(limit)
      .then((data) => setPlugins(data.plugins))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load popular plugins')))
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

    getMarketplacePlugin(pluginId)
      .then(setPlugin)
      .catch((err) => setError(getErrorMessage(err, 'Failed to load plugin')))
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
      const data = await getPluginReviews(pluginId);
      setReviews(data.reviews);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load reviews'));
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

    await submitPluginReview(pluginId, { rating, title, content });

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
      const data = await getInstalledPlugins(type);
      setInstallations(data.installations);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load installations'));
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
      const data = await getPluginInstallation(pluginId);
      setInstallation(data);
    } catch (err) {
      // 404 means not installed
      if (err instanceof ApiError && err.status === 404) {
        setInstallation(null);
      } else {
        setError(getErrorMessage(err, 'Failed to check installation'));
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
      const data = await installPlugin(pluginId, {
        configuration,
        grant_permissions: grantPermissions,
      });
      setInstallation(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Installation failed'));
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
      await uninstallPlugin(pluginId);
      setInstallation(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Uninstallation failed'));
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
      const data = await updatePluginConfiguration(pluginId, { configuration });
      setInstallation(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Configuration update failed'));
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
      const data = enabled
        ? await enablePlugin(pluginId)
        : await disablePlugin(pluginId);
      setInstallation(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update plugin state'));
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

export function usePluginMetrics(
  pluginId: string | null,
  period: PluginMetricsPeriod = 'week'
) {
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

    getPluginMetrics(pluginId, period)
      .then(setMetrics)
      .catch((err) => setError(getErrorMessage(err, 'Failed to load metrics')))
      .finally(() => setLoading(false));
  }, [pluginId, period]);

  return { metrics, loading, error };
}

// ============================================================================
// Plugin Categories Hook
// ============================================================================

export function usePluginCategories(type?: PluginType) {
  const [categories, setCategories] = useState<PluginCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPluginCategories(type)
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(getErrorMessage(err, 'Failed to load categories')))
      .finally(() => setLoading(false));
  }, [type]);

  return { categories, loading, error };
}
