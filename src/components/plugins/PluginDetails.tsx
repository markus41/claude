/**
 * Plugin Details Component
 *
 * Full details view for a plugin including description, permissions,
 * reviews, and installation controls.
 */

import React, { useState } from 'react';
import type { Plugin, PluginInstallation, PluginReview, PluginMetrics } from '../../types/plugins';
import { PLUGIN_TYPE_INFO } from '../../types/plugins';

interface PluginDetailsProps {
  plugin: Plugin;
  installation?: PluginInstallation | null;
  reviews?: PluginReview[];
  metrics?: PluginMetrics | null;
  onInstall?: () => void;
  onUninstall?: () => void;
  onConfigure?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

type Tab = 'overview' | 'permissions' | 'reviews' | 'metrics';

export function PluginDetails({
  plugin,
  installation,
  reviews = [],
  metrics,
  onInstall,
  onUninstall,
  onConfigure,
  onClose,
  loading = false,
}: PluginDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const typeInfo = PLUGIN_TYPE_INFO[plugin.type];
  const isInstalled = !!installation;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-600 whitespace-pre-wrap">{plugin.description}</p>
      </div>

      {/* Tags */}
      {plugin.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {plugin.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Links</h3>
        <div className="space-y-2">
          {plugin.repositoryUrl && (
            <a
              href={plugin.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <span>📦</span> Repository
            </a>
          )}
          {plugin.documentationUrl && (
            <a
              href={plugin.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <span>📚</span> Documentation
            </a>
          )}
        </div>
      </div>

      {/* Resource Limits */}
      {plugin.resourceLimits && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Limits</h3>
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm text-gray-500">Memory</span>
              <div className="font-medium">{plugin.resourceLimits.memory_mb} MB</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">CPU</span>
              <div className="font-medium">{plugin.resourceLimits.cpu_cores} cores</div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Timeout</span>
              <div className="font-medium">{plugin.resourceLimits.timeout_seconds}s</div>
            </div>
            {plugin.resourceLimits.max_network_requests && (
              <div>
                <span className="text-sm text-gray-500">Network Requests</span>
                <div className="font-medium">{plugin.resourceLimits.max_network_requests}/min</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-4">
      <p className="text-gray-600">
        This plugin requires the following permissions to function:
      </p>
      <div className="space-y-3">
        {plugin.permissions.map((perm, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              perm.optional
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{perm.scope}</span>
              {perm.optional && (
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                  Optional
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{perm.reason}</p>
          </div>
        ))}
      </div>
      {plugin.permissions.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          This plugin does not require any special permissions.
        </p>
      )}
    </div>
  );

  const renderReviewsTab = () => (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {plugin.averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">{renderRating(plugin.averageRating)}</div>
          <div className="text-sm text-gray-500 mt-1">{plugin.ratingCount} reviews</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{review.userName}</span>
                {review.isVerifiedPurchase && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    Verified User
                  </span>
                )}
              </div>
              {renderRating(review.rating)}
            </div>
            {review.title && (
              <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
            )}
            {review.content && (
              <p className="text-gray-600 text-sm">{review.content}</p>
            )}
            <div className="mt-2 text-xs text-gray-400">
              {formatDate(review.createdAt)}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review this plugin!
          </p>
        )}
      </div>
    </div>
  );

  const renderMetricsTab = () => {
    if (!metrics) {
      return (
        <p className="text-gray-500 text-center py-8">
          Metrics are only available for installed plugins.
        </p>
      );
    }

    const successRate = metrics.executionCount > 0
      ? ((metrics.successfulExecutions / metrics.executionCount) * 100).toFixed(1)
      : '0';

    return (
      <div className="space-y-6">
        {/* Execution Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(metrics.executionCount)}
            </div>
            <div className="text-sm text-gray-500">Total Executions</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.averageDurationMs.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-500">Avg Duration</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${metrics.estimatedCostUsd.toFixed(4)}
            </div>
            <div className="text-sm text-gray-500">Est. Cost</div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">P95 Duration</span>
              <span className="font-medium">{metrics.p95DurationMs.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-500">Tokens Used</span>
              <span className="font-medium">{formatNumber(metrics.totalTokensUsed)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-16 h-16 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
              {plugin.iconUrl ? (
                <img src={plugin.iconUrl} alt="" className="w-10 h-10" />
              ) : (
                <span className={`text-${typeInfo.color}-600 text-2xl font-bold`}>
                  {plugin.displayName[0]}
                </span>
              )}
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  {plugin.displayName}
                </h2>
                {plugin.isOfficial && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    Official
                  </span>
                )}
                {plugin.isVerified && !plugin.isOfficial && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                    Verified
                  </span>
                )}
              </div>
              <div className="text-gray-500 mt-1">
                by {plugin.author.name} • v{plugin.version}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  {renderRating(plugin.averageRating)}
                  <span className="text-sm text-gray-500">
                    ({plugin.ratingCount})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatNumber(plugin.installCount)} installs
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {isInstalled ? (
            <>
              <button
                onClick={onConfigure}
                className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Configure
              </button>
              <button
                onClick={onUninstall}
                className="px-4 py-2 font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                disabled={loading}
              >
                Uninstall
              </button>
            </>
          ) : (
            <button
              onClick={onInstall}
              className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Installing...' : 'Install Plugin'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 px-6">
          {(['overview', 'permissions', 'reviews', 'metrics'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'permissions' && renderPermissionsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </div>
    </div>
  );
}

export default PluginDetails;
