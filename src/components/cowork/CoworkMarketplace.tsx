/**
 * Cowork Marketplace Component
 *
 * Main marketplace view for discovering, installing, and launching
 * cowork templates, workflows, agent configs, skill packs, and
 * session blueprints. Includes featured items, curated collections,
 * category browsing, active session monitoring, and search.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { CoworkCard } from './CoworkCard';
import { CoworkSearch } from './CoworkSearch';
import { CoworkDetails } from './CoworkDetails';
import { CoworkSessionPanel } from './CoworkSessionPanel';
import { CoworkCollections } from './CoworkCollections';
import {
  useCoworkSearch,
  useFeaturedCowork,
  useTrendingCowork,
  useRecommendedCowork,
  useCuratedCollections,
  useCoworkInstallation,
  useCoworkReviews,
  useCoworkMetrics,
  useCoworkSessions,
} from '../../hooks/useCowork';
import type { CoworkItem, CoworkItemType } from '../../types/cowork';
import { COWORK_ITEM_TYPE_INFO, COWORK_CATEGORIES } from '../../types/cowork';
import type { CoworkCategory } from '../../types/cowork';
import { getCatalogStats } from '../../lib/cowork/provider';

interface CoworkMarketplaceProps {
  initialType?: CoworkItemType;
  onItemSelect?: (item: CoworkItem) => void;
}

type View = 'browse' | 'sessions';

export function CoworkMarketplace({
  initialType,
  onItemSelect,
}: CoworkMarketplaceProps) {
  const [activeView, setActiveView] = useState<View>('browse');
  const [selectedItem, setSelectedItem] = useState<CoworkItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Data hooks
  const {
    items: searchResults,
    total,
    loading: searchLoading,
    error: searchError,
    filters,
    setFilters,
    search,
  } = useCoworkSearch(initialType ? { type: initialType } : {});

  const { items: featuredItems, loading: featuredLoading } =
    useFeaturedCowork();
  const { items: trendingItems, loading: trendingLoading } =
    useTrendingCowork(6);
  const { items: recommendedItems, loading: recommendedLoading } =
    useRecommendedCowork();
  const { collections, loading: collectionsLoading } =
    useCuratedCollections();

  const catalogStats = useMemo(() => getCatalogStats(), []);

  // Selected item hooks
  const {
    installation,
    loading: installLoading,
    actionLoading,
    install,
    uninstall,
  } = useCoworkInstallation(selectedItem?.id || null);
  const { reviews } = useCoworkReviews(selectedItem?.id || null);
  const { metrics } = useCoworkMetrics(selectedItem?.id || null);

  // Session management
  const {
    sessions,
    loading: sessionsLoading,
    start: startSession,
    pause: pauseSession,
    resume: resumeSession,
    cancel: cancelSession,
  } = useCoworkSessions();

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleItemClick = useCallback(
    (item: CoworkItem) => {
      setSelectedItem(item);
      setShowDetails(true);
      onItemSelect?.(item);
    },
    [onItemSelect]
  );

  const handleInstall = useCallback(async () => {
    try {
      await install();
    } catch {
      // Error handled in hook
    }
  }, [install]);

  const handleUninstall = useCallback(async () => {
    if (window.confirm('Are you sure you want to uninstall this item?')) {
      try {
        await uninstall();
        setShowDetails(false);
      } catch {
        // Error handled in hook
      }
    }
  }, [uninstall]);

  const handleLaunch = useCallback(async () => {
    if (!selectedItem) return;
    try {
      await startSession(selectedItem.id);
      setShowDetails(false);
      setActiveView('sessions');
    } catch {
      // Error handled in hook
    }
  }, [selectedItem, startSession]);

  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    setSelectedItem(null);
  }, []);

  const handleCancelSession = useCallback(
    async (sessionId: string) => {
      if (window.confirm('Cancel this cowork session?')) {
        await cancelSession(sessionId);
      }
    },
    [cancelSession]
  );

  const hasSearchQuery = !!(
    filters.query ||
    filters.type ||
    filters.category ||
    filters.difficulty
  );

  const activeSessions = sessions.filter(
    (s) => s.status === 'running' || s.status === 'paused'
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Cowork Marketplace
            </h1>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('browse')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeView === 'browse'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveView('sessions')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
                  activeView === 'sessions'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sessions
                {activeSessions.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {activeSessions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-4">
            Discover templates, workflows, and agent configurations for Claude
            Cowork sessions
          </p>

          {/* Catalog Stats */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {catalogStats.totalItems} items
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              {catalogStats.totalPlugins} plugins
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {catalogStats.totalAgents} agents
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {catalogStats.totalSkills} skills
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              {catalogStats.totalCommands} commands
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {catalogStats.collections} collections
            </span>
          </div>

          {activeView === 'browse' && (
            <CoworkSearch
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={search}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {searchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {searchError}
          </div>
        )}

        {/* ---- Sessions View ---- */}
        {activeView === 'sessions' && (
          <div className="space-y-8">
            {/* Active Sessions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Active Sessions
              </h2>
              <CoworkSessionPanel
                sessions={activeSessions}
                loading={sessionsLoading}
                onPause={pauseSession}
                onResume={resumeSession}
                onCancel={handleCancelSession}
              />
            </section>

            {/* Recent Sessions */}
            {sessions.filter(
              (s) =>
                s.status === 'completed' || s.status === 'failed'
            ).length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Recent Sessions
                </h2>
                <CoworkSessionPanel
                  sessions={sessions.filter(
                    (s) =>
                      s.status === 'completed' ||
                      s.status === 'failed'
                  )}
                />
              </section>
            )}
          </div>
        )}

        {/* ---- Browse View ---- */}
        {activeView === 'browse' && (
          <>
            {hasSearchQuery ? (
              /* Search Results */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {searchLoading
                      ? 'Searching...'
                      : `${total} results`}
                  </h2>
                </div>

                {searchLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-72 bg-gray-200 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchResults.map((item) => (
                      <CoworkCard
                        key={item.id}
                        item={item}
                        onClick={handleItemClick}
                        onInstall={handleItemClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-5xl mb-4">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No items found
                    </h3>
                    <p className="text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Default Browse View */
              <div className="space-y-12">
                {/* Active Sessions Banner */}
                {activeSessions.length > 0 && (
                  <section className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                        </span>
                        <span className="font-medium text-indigo-900">
                          {activeSessions.length} active cowork session
                          {activeSessions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveView('sessions')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View Sessions
                      </button>
                    </div>
                  </section>
                )}

                {/* Featured Items */}
                {featuredItems.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Featured
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {featuredLoading
                        ? [...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="h-72 bg-gray-200 rounded-xl animate-pulse"
                            />
                          ))
                        : featuredItems
                            .slice(0, 3)
                            .map((item) => (
                              <CoworkCard
                                key={item.id}
                                item={item}
                                onClick={handleItemClick}
                                onInstall={handleItemClick}
                              />
                            ))}
                    </div>
                  </section>
                )}

                {/* Curated Collections */}
                {collections.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Curated Collections
                    </h2>
                    <CoworkCollections
                      collections={collections}
                      loading={collectionsLoading}
                      onItemClick={handleItemClick}
                      maxCollections={3}
                    />
                  </section>
                )}

                {/* Browse by Type */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Browse by Type
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {(
                      Object.entries(COWORK_ITEM_TYPE_INFO) as [
                        CoworkItemType,
                        (typeof COWORK_ITEM_TYPE_INFO)[CoworkItemType],
                      ][]
                    ).map(([type, info]) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilters({ type });
                          search({ type });
                        }}
                        className={`p-5 bg-white rounded-xl border border-gray-200 hover:border-${info.color}-300 hover:shadow-md transition-all text-left`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-${info.color}-100 flex items-center justify-center mb-3`}
                        >
                          <span
                            className={`text-${info.color}-600 text-xl`}
                          >
                            {type === 'template' && '📄'}
                            {type === 'workflow' && '🔀'}
                            {type === 'agent_config' && '🤖'}
                            {type === 'skill_pack' && '📦'}
                            {type === 'session_blueprint' && '🗺'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {info.label}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {info.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Browse by Category */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Browse by Category
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(
                      Object.entries(COWORK_CATEGORIES) as [
                        CoworkCategory,
                        (typeof COWORK_CATEGORIES)[CoworkCategory],
                      ][]
                    ).map(([cat, info]) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setFilters({ category: cat });
                          search({ category: cat });
                        }}
                        className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                      >
                        <h3 className="font-medium text-gray-900 text-sm">
                          {info.label}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {info.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Recommended for You */}
                {recommendedItems.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Recommended for You
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedLoading
                        ? [...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="h-72 bg-gray-200 rounded-xl animate-pulse"
                            />
                          ))
                        : recommendedItems
                            .slice(0, 3)
                            .map((item) => (
                              <CoworkCard
                                key={item.id}
                                item={item}
                                onClick={handleItemClick}
                                onInstall={handleItemClick}
                              />
                            ))}
                    </div>
                  </section>
                )}

                {/* Trending */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Trending
                    </h2>
                    <button
                      onClick={() => {
                        setFilters({ sortBy: 'trending' });
                        search({ sortBy: 'trending' });
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingLoading
                      ? [...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="h-72 bg-gray-200 rounded-xl animate-pulse"
                          />
                        ))
                      : trendingItems.map((item) => (
                          <CoworkCard
                            key={item.id}
                            item={item}
                            onClick={handleItemClick}
                            onInstall={handleItemClick}
                          />
                        ))}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <CoworkDetails
            item={selectedItem}
            installation={installation}
            reviews={reviews}
            metrics={metrics}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onLaunch={installation ? handleLaunch : undefined}
            onClose={handleCloseDetails}
            loading={installLoading || actionLoading}
          />
        </div>
      )}
    </div>
  );
}

export default CoworkMarketplace;
