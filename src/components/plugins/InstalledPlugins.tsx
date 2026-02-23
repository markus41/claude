/**
 * Installed Plugins Component
 *
 * Displays and manages plugins installed in the current workspace.
 */

import React, { useState, useCallback } from 'react';
import { PluginDetails } from './PluginDetails';
import { PluginConfigurationModal } from './PluginConfigurationModal';
import {
  useInstalledPlugins,
  usePluginInstallation,
  usePluginReviews,
  usePluginMetrics,
} from '../../hooks/usePlugins';
import type { PluginInstallation, PluginType } from '../../types/plugins';
import { PLUGIN_TYPE_INFO } from '../../types/plugins';

interface InstalledPluginsProps {
  onNavigateToMarketplace?: () => void;
}

export function InstalledPlugins({
  onNavigateToMarketplace,
}: InstalledPluginsProps) {
  const [selectedInstallation, setSelectedInstallation] = useState<PluginInstallation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [activeType, setActiveType] = useState<PluginType | 'all'>('all');

  // Installed plugins
  const {
    installations,
    loading,
    error,
    refresh,
  } = useInstalledPlugins(activeType === 'all' ? undefined : activeType);

  // Selected plugin details
  const {
    actionLoading,
    uninstall,
    setEnabled,
    updateConfig,
  } = usePluginInstallation(selectedInstallation?.pluginId || null);

  const { reviews } = usePluginReviews(selectedInstallation?.pluginId || null);
  const { metrics } = usePluginMetrics(selectedInstallation?.pluginId || null);

  const handlePluginClick = useCallback((installation: PluginInstallation) => {
    setSelectedInstallation(installation);
    setShowDetails(true);
  }, []);

  const handleUninstall = useCallback(async () => {
    if (window.confirm('Are you sure you want to uninstall this plugin?')) {
      try {
        await uninstall();
        setShowDetails(false);
        setSelectedInstallation(null);
        refresh();
      } catch (error) {
        // Error is handled in the hook
      }
    }
  }, [uninstall, refresh]);

  const handleToggleEnabled = useCallback(async (installation: PluginInstallation) => {
    try {
      await setEnabled(!installation.enabled);
      refresh();
    } catch (error) {
      // Error is handled in the hook
    }
  }, [setEnabled, refresh]);

  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    setSelectedInstallation(null);
  }, []);

  const handleOpenConfigure = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const handleCloseConfigure = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  const handleSaveConfiguration = useCallback(async (configuration: Record<string, unknown>) => {
    if (!selectedInstallation) return;

    await updateConfig(configuration);
    setSelectedInstallation((prev) => (
      prev ? { ...prev, configuration } : prev
    ));
    await refresh();
  }, [refresh, selectedInstallation, updateConfig]);

  const groupedInstallations = installations.reduce((groups, installation) => {
    const type = installation.plugin.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(installation);
    return groups;
  }, {} as Record<PluginType, PluginInstallation[]>);

  const typeCounts = Object.entries(groupedInstallations).reduce(
    (counts, [type, list]) => {
      counts[type as PluginType] = list.length;
      return counts;
    },
    {} as Record<PluginType, number>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Installed Plugins
              </h1>
              <p className="text-gray-600">
                {installations.length} plugin{installations.length !== 1 ? 's' : ''} installed
              </p>
            </div>
            {onNavigateToMarketplace && (
              <button
                onClick={onNavigateToMarketplace}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveType('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({installations.length})
            </button>
            {(Object.keys(PLUGIN_TYPE_INFO) as PluginType[]).map((type) => {
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              const info = PLUGIN_TYPE_INFO[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeType === type
                      ? `bg-${info.color}-100 text-${info.color}-700`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : installations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No plugins installed
            </h3>
            <p className="text-gray-500 mb-6">
              Browse the marketplace to find plugins for your workflows
            </p>
            {onNavigateToMarketplace && (
              <button
                onClick={onNavigateToMarketplace}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {activeType === 'all' ? (
              // Grouped by type
              Object.entries(groupedInstallations).map(([type, typeInstallations]) => {
                const info = PLUGIN_TYPE_INFO[type as PluginType];
                return (
                  <section key={type}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg bg-${info.color}-100 flex items-center justify-center`}>
                        {type === 'node' && '🔧'}
                        {type === 'integration' && '🔌'}
                        {type === 'agent' && '🤖'}
                        {type === 'quality_gate' && '✅'}
                      </span>
                      {info.label}s ({typeInstallations.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeInstallations.map((installation) => (
                        <InstallationCard
                          key={installation.id}
                          installation={installation}
                          onClick={() => handlePluginClick(installation)}
                          onToggleEnabled={() => handleToggleEnabled(installation)}
                          actionLoading={
                            selectedInstallation?.id === installation.id && actionLoading
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              // Flat list for filtered type
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {installations.map((installation) => (
                  <InstallationCard
                    key={installation.id}
                    installation={installation}
                    onClick={() => handlePluginClick(installation)}
                    onToggleEnabled={() => handleToggleEnabled(installation)}
                    actionLoading={
                      selectedInstallation?.id === installation.id && actionLoading
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plugin Details Modal */}
      {showDetails && selectedInstallation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PluginDetails
            plugin={selectedInstallation.plugin}
            installation={selectedInstallation}
            reviews={reviews}
            metrics={metrics}
            onUninstall={handleUninstall}
            onConfigure={handleOpenConfigure}
            onClose={handleCloseDetails}
            loading={actionLoading}
          />
        </div>
      )}

      {showConfigModal && selectedInstallation && (
        <PluginConfigurationModal
          plugin={selectedInstallation.plugin}
          installation={selectedInstallation}
          onSave={handleSaveConfiguration}
          onClose={handleCloseConfigure}
        />
      )}
    </div>
  );
}

// Installation Card Component
interface InstallationCardProps {
  installation: PluginInstallation;
  onClick: () => void;
  onToggleEnabled: () => void;
  actionLoading?: boolean;
}

function InstallationCard({
  installation,
  onClick,
  onToggleEnabled,
  actionLoading,
}: InstallationCardProps) {
  const { plugin } = installation;
  const typeInfo = PLUGIN_TYPE_INFO[plugin.type];

  const statusColors = {
    installed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    installing: 'bg-blue-100 text-blue-700',
    updating: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    disabled: 'bg-gray-100 text-gray-600',
    uninstalling: 'bg-red-100 text-red-700',
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleEnabled();
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all p-4 ${
        !installation.enabled ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
          {plugin.iconUrl ? (
            <img src={plugin.iconUrl} alt="" className="w-6 h-6" />
          ) : (
            <span className={`text-${typeInfo.color}-600 text-lg font-bold`}>
              {plugin.displayName[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {plugin.displayName}
            </h3>
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${statusColors[installation.status]}`}>
              {installation.status}
            </span>
          </div>
          <div className="text-sm text-gray-500">v{installation.installedVersion}</div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={actionLoading}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            installation.enabled ? 'bg-blue-600' : 'bg-gray-300'
          } ${actionLoading ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              installation.enabled ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
        <span>{installation.usageCount} executions</span>
        {installation.errorCount > 0 && (
          <span className="text-red-500">{installation.errorCount} errors</span>
        )}
      </div>
    </div>
  );
}

export default InstalledPlugins;
