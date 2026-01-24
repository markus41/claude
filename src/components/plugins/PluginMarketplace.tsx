/**
 * Plugin Marketplace Component
 *
 * Main marketplace view showing featured plugins, search results,
 * and plugin categories.
 */

import React, { useState, useCallback } from 'react';
import { PluginCard } from './PluginCard';
import { PluginSearch } from './PluginSearch';
import { PluginDetails } from './PluginDetails';
import {
  usePluginSearch,
  useFeaturedPlugins,
  usePopularPlugins,
  usePluginInstallation,
  usePluginReviews,
  usePluginMetrics,
} from '../../hooks/usePlugins';
import type { Plugin, PluginType } from '../../types/plugins';
import { PLUGIN_TYPE_INFO } from '../../types/plugins';

interface PluginMarketplaceProps {
  initialType?: PluginType;
  onPluginSelect?: (plugin: Plugin) => void;
}

export function PluginMarketplace({
  initialType,
  onPluginSelect,
}: PluginMarketplaceProps) {
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Search
  const {
    plugins: searchResults,
    total,
    loading: searchLoading,
    error: searchError,
    filters,
    setFilters,
    search,
  } = usePluginSearch(initialType ? { type: initialType } : {});

  // Featured plugins
  const { plugins: featuredPlugins, loading: featuredLoading } = useFeaturedPlugins();

  // Popular plugins
  const { plugins: popularPlugins, loading: popularLoading } = usePopularPlugins(6);

  // Selected plugin details
  const {
    installation,
    loading: installLoading,
    actionLoading,
    install,
    uninstall,
  } = usePluginInstallation(selectedPlugin?.id || null);

  const { reviews } = usePluginReviews(selectedPlugin?.id || null);
  const { metrics } = usePluginMetrics(selectedPlugin?.id || null);

  const handlePluginClick = useCallback((plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setShowDetails(true);
    onPluginSelect?.(plugin);
  }, [onPluginSelect]);

  const handleInstall = useCallback(async () => {
    try {
      await install();
    } catch (error) {
      // Error is handled in the hook
    }
  }, [install]);

  const handleUninstall = useCallback(async () => {
    if (window.confirm('Are you sure you want to uninstall this plugin?')) {
      try {
        await uninstall();
        setShowDetails(false);
      } catch (error) {
        // Error is handled in the hook
      }
    }
  }, [uninstall]);

  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    setSelectedPlugin(null);
  }, []);

  const hasSearchQuery = !!(filters.query || filters.type || filters.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Plugin Marketplace
          </h1>
          <p className="text-gray-600 mb-6">
            Extend ACCOS with custom nodes, integrations, agents, and quality gates
          </p>

          {/* Search */}
          <PluginSearch
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={search}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {searchError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {searchError}
          </div>
        )}

        {hasSearchQuery ? (
          // Search Results
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {searchLoading ? 'Searching...' : `${total} results`}
              </h2>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-gray-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    onClick={handlePluginClick}
                    onInstall={handlePluginClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No plugins found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        ) : (
          // Default View
          <div className="space-y-12">
            {/* Featured Plugins */}
            {featuredPlugins.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Featured Plugins
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredLoading
                    ? [...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-64 bg-gray-200 rounded-xl animate-pulse"
                        />
                      ))
                    : featuredPlugins.slice(0, 3).map((plugin) => (
                        <PluginCard
                          key={plugin.id}
                          plugin={plugin}
                          onClick={handlePluginClick}
                          onInstall={handlePluginClick}
                        />
                      ))}
                </div>
              </section>
            )}

            {/* Plugin Types */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Browse by Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(PLUGIN_TYPE_INFO) as [PluginType, typeof PLUGIN_TYPE_INFO[PluginType]][]).map(
                  ([type, info]) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilters({ type });
                        search({ type });
                      }}
                      className={`p-6 bg-white rounded-xl border border-gray-200 hover:border-${info.color}-300 hover:shadow-md transition-all text-left`}
                    >
                      <div className={`w-12 h-12 rounded-lg bg-${info.color}-100 flex items-center justify-center mb-4`}>
                        <span className={`text-${info.color}-600 text-2xl`}>
                          {type === 'node' && '🔧'}
                          {type === 'integration' && '🔌'}
                          {type === 'agent' && '🤖'}
                          {type === 'quality_gate' && '✅'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{info.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                    </button>
                  )
                )}
              </div>
            </section>

            {/* Popular Plugins */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Most Popular
                </h2>
                <button
                  onClick={() => {
                    setFilters({ sortBy: 'popularity' });
                    search({ sortBy: 'popularity' });
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularLoading
                  ? [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-64 bg-gray-200 rounded-xl animate-pulse"
                      />
                    ))
                  : popularPlugins.map((plugin) => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        onClick={handlePluginClick}
                        onInstall={handlePluginClick}
                      />
                    ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Plugin Details Modal */}
      {showDetails && selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PluginDetails
            plugin={selectedPlugin}
            installation={installation}
            reviews={reviews}
            metrics={metrics}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
            onConfigure={() => {/* TODO: Open configuration */}}
            onClose={handleCloseDetails}
            loading={installLoading || actionLoading}
          />
        </div>
      )}
    </div>
  );
}

export default PluginMarketplace;
