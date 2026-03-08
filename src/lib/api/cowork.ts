/**
 * Cowork Marketplace API
 *
 * API functions for the Claude Cowork marketplace: searching, installing,
 * managing sessions, and tracking metrics for cowork items.
 */

import { apiClient } from './client';
import type {
  CoworkItem,
  CoworkInstallation,
  CoworkSession,
  CoworkSearchFilters,
  CoworkSearchResult,
  CoworkReview,
  CoworkReviewSubmission,
  CoworkMetrics,
  CoworkMetricsPeriod,
  CoworkItemType,
  CoworkCategory,
} from '@/types/cowork';

// ---------------------------------------------------------------------------
// Search & Discovery
// ---------------------------------------------------------------------------

function buildCoworkSearchParams(filters: CoworkSearchFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters.isVerified) params.set('is_verified', 'true');
  if (filters.isOfficial) params.set('is_official', 'true');
  if (filters.isCurated) params.set('is_curated', 'true');
  if (filters.minRating) params.set('min_rating', String(filters.minRating));
  if (filters.minTrustGrade) params.set('min_trust_grade', filters.minTrustGrade);
  if (filters.maxDuration) params.set('max_duration', filters.maxDuration);
  if (filters.sortBy) params.set('sort_by', filters.sortBy);

  return params.toString();
}

export async function searchCoworkItems(
  filters: CoworkSearchFilters = {}
): Promise<CoworkSearchResult> {
  const query = buildCoworkSearchParams(filters);
  const endpoint = query
    ? `/v1/cowork/marketplace?${query}`
    : '/v1/cowork/marketplace';

  return apiClient.get<CoworkSearchResult>(endpoint);
}

export async function getFeaturedCoworkItems(): Promise<{ items: CoworkItem[] }> {
  return apiClient.get<{ items: CoworkItem[] }>('/v1/cowork/marketplace/featured');
}

export async function getTrendingCoworkItems(limit = 10): Promise<{ items: CoworkItem[] }> {
  return apiClient.get<{ items: CoworkItem[] }>(
    `/v1/cowork/marketplace/trending?limit=${limit}`
  );
}

export async function getCuratedCollections(): Promise<{
  collections: Array<{
    id: string;
    name: string;
    description: string;
    items: CoworkItem[];
  }>;
}> {
  return apiClient.get('/v1/cowork/marketplace/collections');
}

export async function getCoworkItem(itemId: string): Promise<CoworkItem> {
  return apiClient.get<CoworkItem>(`/v1/cowork/marketplace/${itemId}`);
}

export async function getRecommendedItems(): Promise<{ items: CoworkItem[] }> {
  return apiClient.get<{ items: CoworkItem[] }>('/v1/cowork/marketplace/recommended');
}

export async function getCoworkCategories(
  type?: CoworkItemType
): Promise<{ categories: Array<{ name: CoworkCategory; count: number }> }> {
  const query = type ? `?type=${type}` : '';
  return apiClient.get(`/v1/cowork/marketplace/categories${query}`);
}

// ---------------------------------------------------------------------------
// Installation & Management
// ---------------------------------------------------------------------------

export async function getInstalledCoworkItems(
  type?: CoworkItemType
): Promise<{ installations: CoworkInstallation[] }> {
  const query = type ? `?type=${type}` : '';
  return apiClient.get<{ installations: CoworkInstallation[] }>(
    `/v1/cowork/installed${query}`
  );
}

export async function getCoworkInstallation(
  itemId: string
): Promise<CoworkInstallation | null> {
  return apiClient.get<CoworkInstallation | null>(
    `/v1/cowork/${itemId}/installation`
  );
}

export async function installCoworkItem(
  itemId: string,
  configuration?: Record<string, unknown>
): Promise<CoworkInstallation> {
  return apiClient.post<CoworkInstallation>(
    `/v1/cowork/${itemId}/install`,
    { configuration }
  );
}

export async function uninstallCoworkItem(itemId: string): Promise<void> {
  await apiClient.post<void>(`/v1/cowork/${itemId}/uninstall`);
}

export async function updateCoworkConfiguration(
  itemId: string,
  configuration: Record<string, unknown>
): Promise<CoworkInstallation> {
  return apiClient.put<CoworkInstallation>(
    `/v1/cowork/${itemId}/config`,
    { configuration }
  );
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getActiveSessions(): Promise<{ sessions: CoworkSession[] }> {
  return apiClient.get<{ sessions: CoworkSession[] }>('/v1/cowork/sessions');
}

export async function getSession(sessionId: string): Promise<CoworkSession> {
  return apiClient.get<CoworkSession>(`/v1/cowork/sessions/${sessionId}`);
}

export async function startSession(
  itemId: string,
  inputs?: Record<string, unknown>
): Promise<CoworkSession> {
  return apiClient.post<CoworkSession>('/v1/cowork/sessions', {
    itemId,
    inputs,
  });
}

export async function pauseSession(sessionId: string): Promise<CoworkSession> {
  return apiClient.post<CoworkSession>(
    `/v1/cowork/sessions/${sessionId}/pause`
  );
}

export async function resumeSession(sessionId: string): Promise<CoworkSession> {
  return apiClient.post<CoworkSession>(
    `/v1/cowork/sessions/${sessionId}/resume`
  );
}

export async function cancelSession(sessionId: string): Promise<void> {
  await apiClient.post<void>(`/v1/cowork/sessions/${sessionId}/cancel`);
}

export async function getSessionHistory(
  limit = 20
): Promise<{ sessions: CoworkSession[] }> {
  return apiClient.get<{ sessions: CoworkSession[] }>(
    `/v1/cowork/sessions/history?limit=${limit}`
  );
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function getCoworkReviews(
  itemId: string
): Promise<{ reviews: CoworkReview[] }> {
  return apiClient.get<{ reviews: CoworkReview[] }>(
    `/v1/cowork/marketplace/${itemId}/reviews`
  );
}

export async function submitCoworkReview(
  itemId: string,
  review: CoworkReviewSubmission
): Promise<void> {
  await apiClient.post<void>(
    `/v1/cowork/marketplace/${itemId}/reviews`,
    review
  );
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export async function getCoworkMetrics(
  itemId: string,
  period: CoworkMetricsPeriod = 'week'
): Promise<CoworkMetrics> {
  return apiClient.get<CoworkMetrics>(
    `/v1/cowork/${itemId}/metrics?period=${period}`
  );
}
