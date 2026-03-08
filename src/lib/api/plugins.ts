import { apiClient } from './client';
import type {
  Plugin,
  PluginCategory,
  PluginInstallation,
  PluginInstallationRequest,
  PluginMetrics,
  PluginMetricsPeriod,
  PluginReview,
  PluginReviewSubmission,
  PluginSearchFilters,
  PluginSearchResult,
  PluginType,
  PluginUpdateConfigurationRequest,
} from '@/types/plugins';

function buildSearchParams(filters: PluginSearchFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters.isVerified) params.set('is_verified', 'true');
  if (filters.isOfficial) params.set('is_official', 'true');
  if (filters.minRating) params.set('min_rating', String(filters.minRating));
  if (filters.sortBy) params.set('sort_by', filters.sortBy);

  return params.toString();
}

export async function searchMarketplacePlugins(
  filters: PluginSearchFilters = {}
): Promise<PluginSearchResult> {
  const query = buildSearchParams(filters);
  const endpoint = query
    ? `/v1/marketplace/plugins?${query}`
    : '/v1/marketplace/plugins';

  return apiClient.get<PluginSearchResult>(endpoint);
}

export async function getFeaturedPlugins(): Promise<{ plugins: Plugin[] }> {
  return apiClient.get<{ plugins: Plugin[] }>('/v1/marketplace/featured');
}

export async function getPopularPlugins(limit = 10): Promise<{ plugins: Plugin[] }> {
  return apiClient.get<{ plugins: Plugin[] }>(`/v1/marketplace/popular?limit=${limit}`);
}

export async function getMarketplacePlugin(pluginId: string): Promise<Plugin> {
  return apiClient.get<Plugin>(`/v1/marketplace/plugins/${pluginId}`);
}

export async function getPluginReviews(pluginId: string): Promise<{ reviews: PluginReview[] }> {
  return apiClient.get<{ reviews: PluginReview[] }>(`/v1/marketplace/plugins/${pluginId}/reviews`);
}

export async function submitPluginReview(
  pluginId: string,
  review: PluginReviewSubmission
): Promise<void> {
  await apiClient.post<void>(`/v1/marketplace/plugins/${pluginId}/reviews`, review);
}

export async function getPluginCategories(
  type?: PluginType
): Promise<{ categories: PluginCategory[] }> {
  const query = type ? `?type=${type}` : '';
  return apiClient.get<{ categories: PluginCategory[] }>(`/v1/marketplace/categories${query}`);
}

export async function getInstalledPlugins(
  type?: PluginType
): Promise<{ installations: PluginInstallation[] }> {
  const query = type ? `?type=${type}` : '';
  return apiClient.get<{ installations: PluginInstallation[] }>(`/v1/plugins/installed${query}`);
}

export async function getPluginInstallation(
  pluginId: string
): Promise<PluginInstallation | null> {
  return apiClient.get<PluginInstallation | null>(`/v1/plugins/${pluginId}/installation`);
}

export async function installPlugin(
  pluginId: string,
  payload: PluginInstallationRequest = {}
): Promise<PluginInstallation> {
  return apiClient.post<PluginInstallation>(`/v1/plugins/${pluginId}/install`, payload);
}

export async function uninstallPlugin(pluginId: string): Promise<void> {
  await apiClient.post<void>(`/v1/plugins/${pluginId}/uninstall`);
}

export async function updatePluginConfiguration(
  pluginId: string,
  payload: PluginUpdateConfigurationRequest
): Promise<PluginInstallation> {
  return apiClient.put<PluginInstallation>(`/v1/plugins/${pluginId}/config`, payload);
}

export async function enablePlugin(pluginId: string): Promise<PluginInstallation> {
  return apiClient.post<PluginInstallation>(`/v1/plugins/${pluginId}/enable`);
}

export async function disablePlugin(pluginId: string): Promise<PluginInstallation> {
  return apiClient.post<PluginInstallation>(`/v1/plugins/${pluginId}/disable`);
}

export async function getPluginMetrics(
  pluginId: string,
  period: PluginMetricsPeriod = 'week'
): Promise<PluginMetrics> {
  return apiClient.get<PluginMetrics>(`/v1/plugins/${pluginId}/metrics?period=${period}`);
}
