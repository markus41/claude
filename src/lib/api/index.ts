/**
 * API Module Exports
 *
 * Centralized exports for all API services and utilities.
 */

export { apiClient, createApiClient, ApiError } from './client';

export type { NodeTypeDefinition, NodeTypesResponse } from './nodeTypes';
export {
  fetchNodeTypes,
  fetchNodeTypesByCategory,
  fetchNodeType,
} from './nodeTypes';

export type { WorkflowListParams } from './workflows';
export {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from './workflows';

export type { TemplateListParams, TemplateInstantiateParams } from './templates';
export {
  listTemplates,
  getTemplate,
  getTemplateBySlug,
  instantiateTemplate,
  getFeaturedTemplates,
  getTemplatesByCategory,
  searchTemplatesByTags,
} from './templates';

export {
  searchMarketplacePlugins,
  getFeaturedPlugins,
  getPopularPlugins,
  getMarketplacePlugin,
  getPluginReviews,
  submitPluginReview,
  getPluginCategories,
  getInstalledPlugins,
  getPluginInstallation,
  installPlugin,
  uninstallPlugin,
  updatePluginConfiguration,
  enablePlugin,
  disablePlugin,
  getPluginMetrics,
} from './plugins';
