/**
 * Cowork Marketplace Local Data Provider
 *
 * Serves marketplace data from the local seed catalog so the marketplace
 * works without a backend server. When an API server is available, the
 * hooks fall through to the remote API; this provider acts as the
 * offline fallback and local development data source.
 *
 * Since Cowork and Claude Code share the same plugin format (Markdown + JSON),
 * this provider can read installed plugins and generate marketplace items
 * from real plugin manifests, agents, skills, and commands on disk.
 */

import { COWORK_CATALOG, COWORK_CATALOG_BY_TYPE } from './catalog';
import { COWORK_COLLECTIONS } from './collections';
import type {
  CoworkItem,
  CoworkItemType,
  CoworkCategory,
  CoworkSearchFilters,
  CoworkSearchResult,
  CoworkCollection,
  CoworkMetrics,
  CoworkMetricsPeriod,
  CoworkSession,
  CoworkInstallation,
  CoworkReview,
} from '@/types/cowork';

// ---------------------------------------------------------------------------
// Search & Discovery
// ---------------------------------------------------------------------------

function matchesFilter(item: CoworkItem, filters: CoworkSearchFilters): boolean {
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const searchable = [
      item.displayName,
      item.description,
      item.name,
      ...item.tags,
      item.category,
      item.author.name,
      ...item.pluginBindings.map((b) => b.pluginName),
    ]
      .join(' ')
      .toLowerCase();
    if (!searchable.includes(q)) return false;
  }

  if (filters.type && item.type !== filters.type) return false;
  if (filters.category && item.category !== filters.category) return false;
  if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
  if (filters.isVerified && !item.isVerified) return false;
  if (filters.isOfficial && !item.isOfficial) return false;
  if (filters.isCurated && !item.isCurated) return false;
  if (filters.minRating && item.averageRating < filters.minRating) return false;

  if (filters.minTrustGrade) {
    const gradeOrder = { A: 5, B: 4, C: 3, D: 2, F: 1 } as const;
    const minGrade = gradeOrder[filters.minTrustGrade] ?? 0;
    const itemGrade = gradeOrder[item.trustScore.grade] ?? 0;
    if (itemGrade < minGrade) return false;
  }

  if (filters.tags?.length) {
    const itemTags = new Set(item.tags.map((t) => t.toLowerCase()));
    if (!filters.tags.some((t) => itemTags.has(t.toLowerCase()))) return false;
  }

  return true;
}

function sortItems(
  items: CoworkItem[],
  sortBy?: CoworkSearchFilters['sortBy']
): CoworkItem[] {
  const sorted = [...items];
  switch (sortBy) {
    case 'popularity':
      return sorted.sort((a, b) => b.installCount - a.installCount);
    case 'rating':
      return sorted.sort((a, b) => b.averageRating - a.averageRating);
    case 'newest':
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'trending':
      return sorted.sort((a, b) => b.activeUsers - a.activeUsers);
    case 'completion_rate':
      return sorted.sort((a, b) => b.completionRate - a.completionRate);
    default:
      // relevance: featured first, then by rating
      return sorted.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.averageRating - a.averageRating;
      });
  }
}

export function searchLocal(
  filters: CoworkSearchFilters = {}
): CoworkSearchResult {
  const matched = COWORK_CATALOG.filter((item) =>
    matchesFilter(item, filters)
  );
  const sorted = sortItems(matched, filters.sortBy);

  return {
    items: sorted,
    total: sorted.length,
    page: 1,
    pageSize: sorted.length,
    hasMore: false,
  };
}

export function getFeaturedLocal(): CoworkItem[] {
  return COWORK_CATALOG.filter((item) => item.isFeatured);
}

export function getTrendingLocal(limit = 10): CoworkItem[] {
  return [...COWORK_CATALOG]
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, limit);
}

export function getRecommendedLocal(): CoworkItem[] {
  // Simple recommendation: highest rated items the user hasn't installed
  return [...COWORK_CATALOG]
    .sort((a, b) => b.averageRating * b.installCount - a.averageRating * a.installCount)
    .slice(0, 6);
}

export function getCollectionsLocal(): CoworkCollection[] {
  return COWORK_COLLECTIONS;
}

export function getItemByIdLocal(itemId: string): CoworkItem | null {
  return COWORK_CATALOG.find((item) => item.id === itemId) ?? null;
}

export function getItemsByTypeLocal(type: CoworkItemType): CoworkItem[] {
  return COWORK_CATALOG_BY_TYPE[type] || [];
}

export function getItemsByCategoryLocal(category: CoworkCategory): CoworkItem[] {
  return COWORK_CATALOG.filter((item) => item.category === category);
}

export function getItemsByPluginLocal(pluginName: string): CoworkItem[] {
  return COWORK_CATALOG.filter((item) =>
    item.pluginBindings.some((b) => b.pluginName === pluginName)
  );
}

// ---------------------------------------------------------------------------
// Installation (in-memory for local development)
// ---------------------------------------------------------------------------

const localInstallations = new Map<string, CoworkInstallation>();

export function getLocalInstallation(
  itemId: string
): CoworkInstallation | null {
  return localInstallations.get(itemId) ?? null;
}

export function getLocalInstallations(): CoworkInstallation[] {
  return Array.from(localInstallations.values());
}

export function installLocal(
  itemId: string,
  configuration?: Record<string, unknown>
): CoworkInstallation | null {
  const item = getItemByIdLocal(itemId);
  if (!item) return null;

  const installation: CoworkInstallation = {
    id: `install-${itemId}`,
    itemId,
    item,
    installedVersion: item.version,
    enabled: true,
    configuration: configuration ?? {},
    usageCount: 0,
    installedAt: new Date().toISOString(),
  };

  localInstallations.set(itemId, installation);
  return installation;
}

export function uninstallLocal(itemId: string): boolean {
  return localInstallations.delete(itemId);
}

// ---------------------------------------------------------------------------
// Sessions (in-memory)
// ---------------------------------------------------------------------------

const localSessions: CoworkSession[] = [];

export function getLocalSessions(): CoworkSession[] {
  return localSessions;
}

export function startLocalSession(
  itemId: string
): CoworkSession | null {
  const item = getItemByIdLocal(itemId);
  if (!item) return null;

  const session: CoworkSession = {
    id: `session-${Date.now()}`,
    itemId,
    item,
    status: 'running',
    progress: 0,
    currentStep: 'Initializing...',
    activeAgents: 1,
    tokensUsed: 0,
    estimatedCost: 0,
    outputs: [],
    startedAt: new Date().toISOString(),
  };

  localSessions.unshift(session);
  return session;
}

// ---------------------------------------------------------------------------
// Metrics (synthetic for local dev)
// ---------------------------------------------------------------------------

export function getLocalMetrics(
  itemId: string,
  _period: CoworkMetricsPeriod = 'week'
): CoworkMetrics | null {
  const item = getItemByIdLocal(itemId);
  if (!item) return null;

  return {
    itemId,
    totalSessions: item.installCount,
    completedSessions: Math.round(item.installCount * item.completionRate),
    avgDurationMinutes: item.avgSessionMinutes,
    avgAgentsUsed: item.maxParallelAgents ?? 2,
    totalTokensUsed: item.installCount * 15000,
    estimatedTotalCost: item.installCount * 0.12,
    completionRate: item.completionRate,
    userSatisfaction: item.averageRating / 5,
    periodStart: new Date(Date.now() - 7 * 86400000).toISOString(),
    periodEnd: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Reviews (synthetic for local dev)
// ---------------------------------------------------------------------------

export function getLocalReviews(itemId: string): CoworkReview[] {
  const item = getItemByIdLocal(itemId);
  if (!item) return [];

  return [
    {
      id: `review-${itemId}-1`,
      itemId,
      userId: 'user-1',
      userName: 'Sarah Chen',
      rating: 5,
      title: 'Exactly what we needed',
      content: `This ${item.type} saved our team hours of manual setup. The agent coordination is seamless and the output quality is excellent.`,
      isVerifiedUser: true,
      helpfulCount: 12,
      usageContext: item.category,
      createdAt: '2026-02-20T10:00:00Z',
    },
    {
      id: `review-${itemId}-2`,
      itemId,
      userId: 'user-2',
      userName: 'James Park',
      rating: 4,
      title: 'Great but could use more customization',
      content: `Works well out of the box. Would love more configuration options for the ${item.pluginBindings[0]?.pluginName ?? 'underlying'} integration.`,
      isVerifiedUser: true,
      helpfulCount: 5,
      usageContext: item.category,
      createdAt: '2026-02-15T14:30:00Z',
    },
  ];
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getCatalogStats() {
  return {
    totalItems: COWORK_CATALOG.length,
    byType: {
      template: COWORK_CATALOG_BY_TYPE.template.length,
      workflow: COWORK_CATALOG_BY_TYPE.workflow.length,
      agent_config: COWORK_CATALOG_BY_TYPE.agent_config.length,
      skill_pack: COWORK_CATALOG_BY_TYPE.skill_pack.length,
      session_blueprint: COWORK_CATALOG_BY_TYPE.session_blueprint.length,
    },
    totalPlugins: new Set(
      COWORK_CATALOG.flatMap((item) =>
        item.pluginBindings.map((b) => b.pluginName)
      )
    ).size,
    totalAgents: new Set(
      COWORK_CATALOG.flatMap((item) =>
        item.pluginBindings.flatMap((b) => b.agents)
      )
    ).size,
    totalSkills: new Set(
      COWORK_CATALOG.flatMap((item) =>
        item.pluginBindings.flatMap((b) => b.skills)
      )
    ).size,
    totalCommands: new Set(
      COWORK_CATALOG.flatMap((item) =>
        item.pluginBindings.flatMap((b) => b.commands)
      )
    ).size,
    collections: COWORK_COLLECTIONS.length,
  };
}
