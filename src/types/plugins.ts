/**
 * Plugin Type Definitions for Frontend
 *
 * Types for the plugin marketplace UI components.
 */

export type PluginType = 'node' | 'integration' | 'agent' | 'quality_gate';
export type PluginStatus = 'draft' | 'review' | 'approved' | 'published' | 'deprecated' | 'removed';
export type InstallationStatus = 'pending' | 'installing' | 'installed' | 'updating' | 'failed' | 'uninstalling' | 'disabled';

export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}

export interface PluginPermission {
  scope: string;
  reason: string;
  optional?: boolean;
}

export interface ResourceLimits {
  memory_mb: number;
  cpu_cores: number;
  timeout_seconds: number;
  max_network_requests?: number;
  max_network_mb?: number;
  max_storage_mb?: number;
}

export interface Plugin {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  type: PluginType;
  category: string;
  tags: string[];
  author: PluginAuthor;
  status: PluginStatus;

  // Statistics
  installCount: number;
  activeInstallations: number;
  averageRating: number;
  ratingCount: number;

  // Verification
  isOfficial: boolean;
  isVerified: boolean;
  verificationBadge?: string;
  isFeatured: boolean;

  // URLs
  repositoryUrl?: string;
  documentationUrl?: string;
  iconUrl?: string;

  // Permissions
  permissions: PluginPermission[];
  resourceLimits?: ResourceLimits;

  // Timestamps
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PluginInstallation {
  id: string;
  pluginId: string;
  plugin: Plugin;
  installedVersion: string;
  status: InstallationStatus;
  enabled: boolean;
  configuration: Record<string, unknown>;
  grantedPermissions: string[];
  autoUpdate: boolean;
  lastUsedAt?: string;
  usageCount: number;
  errorCount: number;
  installedAt: string;
  updatedAt: string;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  content?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface PluginMetrics {
  pluginId: string;
  executionCount: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDurationMs: number;
  p95DurationMs: number;
  totalTokensUsed: number;
  estimatedCostUsd: number;
  periodStart: string;
  periodEnd: string;
}

export interface PluginSearchFilters {
  query?: string;
  type?: PluginType;
  category?: string;
  tags?: string[];
  isVerified?: boolean;
  isOfficial?: boolean;
  minRating?: number;
  sortBy?: 'relevance' | 'popularity' | 'rating' | 'newest';
}

export interface PluginSearchResult {
  plugins: Plugin[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Plugin type metadata
export const PLUGIN_TYPE_INFO: Record<PluginType, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  node: {
    label: 'Workflow Node',
    description: 'Custom nodes for the Visual Flow Builder',
    icon: 'GitBranch',
    color: 'blue',
  },
  integration: {
    label: 'Integration',
    description: 'External service connectors',
    icon: 'Plug',
    color: 'green',
  },
  agent: {
    label: 'Agent',
    description: 'Custom AI agents',
    icon: 'Bot',
    color: 'purple',
  },
  quality_gate: {
    label: 'Quality Gate',
    description: 'Validation and quality checks',
    icon: 'ShieldCheck',
    color: 'orange',
  },
};

// Categories by plugin type
export const PLUGIN_CATEGORIES: Record<PluginType, string[]> = {
  node: ['Data Processing', 'Text Processing', 'File Processing', 'API', 'Logic', 'Utility'],
  integration: ['Communication', 'Storage', 'Database', 'CRM', 'Analytics', 'DevOps', 'AI/ML'],
  agent: ['Research', 'Writing', 'Analysis', 'Customer Support', 'Development', 'Data'],
  quality_gate: ['Security', 'Compliance', 'Data Quality', 'Performance', 'Accessibility', 'Custom'],
};
