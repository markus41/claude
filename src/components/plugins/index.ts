/**
 * Plugin Components Index
 *
 * Export all plugin marketplace components for use throughout the application.
 */

export { PluginCard } from './PluginCard';
export { PluginSearch } from './PluginSearch';
export { PluginDetails } from './PluginDetails';
export { PluginMarketplace } from './PluginMarketplace';
export { InstalledPlugins } from './InstalledPlugins';

// Re-export types for convenience
export type {
  Plugin,
  PluginInstallation,
  PluginReview,
  PluginMetrics,
  PluginType,
  PluginStatus,
  InstallationStatus,
  PluginSearchFilters,
} from '../../types/plugins';

export { PLUGIN_TYPE_INFO, PLUGIN_CATEGORIES } from '../../types/plugins';
