/**
 * Cowork Details Component
 *
 * Full details view for a cowork marketplace item including description,
 * trust score breakdown, dependencies, reviews, metrics, and session controls.
 */

import React, { useState } from 'react';
import type {
  CoworkItem,
  CoworkInstallation,
  CoworkReview,
  CoworkMetrics,
} from '../../types/cowork';
import {
  COWORK_ITEM_TYPE_INFO,
  COWORK_DIFFICULTY_INFO,
  TRUST_GRADE_INFO,
} from '../../types/cowork';

interface CoworkDetailsProps {
  item: CoworkItem;
  installation?: CoworkInstallation | null;
  reviews?: CoworkReview[];
  metrics?: CoworkMetrics | null;
  onInstall?: () => void;
  onUninstall?: () => void;
  onLaunch?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

type Tab = 'overview' | 'trust' | 'dependencies' | 'reviews' | 'metrics';

export function CoworkDetails({
  item,
  installation,
  reviews = [],
  metrics,
  onInstall,
  onUninstall,
  onLaunch,
  onClose,
  loading = false,
}: CoworkDetailsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const typeInfo = COWORK_ITEM_TYPE_INFO[item.type];
  const difficultyInfo = COWORK_DIFFICULTY_INFO[item.difficulty];
  const trustInfo = TRUST_GRADE_INFO[item.trustScore.grade];
  const isInstalled = !!installation;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={i}
          className={
            i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
          }
        >
          ★
        </span>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // -------------------------------------------------------------------------
  // Tab Renderers
  // -------------------------------------------------------------------------

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Description
        </h3>
        <p className="text-gray-600 whitespace-pre-wrap">
          {item.longDescription || item.description}
        </p>
      </div>

      {/* Capabilities */}
      {item.capabilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Capabilities
          </h3>
          <div className="space-y-3">
            {item.capabilities.map((cap, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="font-medium text-gray-900">{cap.name}</div>
                <p className="text-sm text-gray-600 mt-1">
                  {cap.description}
                </p>
                {cap.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cap.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Session Info
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {item.estimatedDuration && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="font-medium text-gray-900">
                ~{item.estimatedDuration}
              </div>
            </div>
          )}
          {item.maxParallelAgents && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Parallel Agents</div>
              <div className="font-medium text-gray-900">
                Up to {item.maxParallelAgents}
              </div>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="font-medium text-gray-900">
              {Math.round(item.completionRate * 100)}%
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Avg Session</div>
            <div className="font-medium text-gray-900">
              {item.avgSessionMinutes} min
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
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
          {item.repositoryUrl && (
            <a
              href={item.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              Repository
            </a>
          )}
          {item.documentationUrl && (
            <a
              href={item.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              Documentation
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const renderTrustTab = () => {
    const factors = [
      {
        label: 'Cryptographic Signature',
        value: item.trustScore.signed,
        weight: '25%',
      },
      {
        label: 'Author Reputation',
        value: item.trustScore.reputation,
        weight: '20%',
      },
      {
        label: 'Code Analysis',
        value: item.trustScore.codeAnalysis,
        weight: '25%',
      },
      {
        label: 'Community Score',
        value: item.trustScore.community,
        weight: '15%',
      },
      {
        label: 'Freshness',
        value: item.trustScore.freshness,
        weight: '15%',
      },
    ];

    return (
      <div className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg">
          <div
            className={`w-20 h-20 rounded-full bg-${trustInfo.color}-100 flex items-center justify-center`}
          >
            <span
              className={`text-3xl font-bold text-${trustInfo.color}-700`}
            >
              {item.trustScore.grade}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {item.trustScore.overall}/100
            </div>
            <div className={`text-${trustInfo.color}-600 font-medium`}>
              {trustInfo.label} Trust
            </div>
          </div>
        </div>

        {/* Factor Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Score Breakdown
          </h3>
          <div className="space-y-3">
            {factors.map((factor) => (
              <div key={factor.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{factor.label}</span>
                  <span className="text-gray-500">
                    {factor.value}/100 (weight: {factor.weight})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      factor.value >= 80
                        ? 'bg-green-500'
                        : factor.value >= 60
                          ? 'bg-yellow-500'
                          : factor.value >= 40
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${factor.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Verification Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  item.isVerified
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {item.isVerified ? '✓' : '−'}
              </span>
              <span className="text-sm text-gray-700">
                Author Verified
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  item.isOfficial
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {item.isOfficial ? '✓' : '−'}
              </span>
              <span className="text-sm text-gray-700">
                Official Item
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  item.isCurated
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {item.isCurated ? '✓' : '−'}
              </span>
              <span className="text-sm text-gray-700">
                Curated Collection
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDependenciesTab = () => (
    <div className="space-y-6">
      {item.dependencies.length > 0 ? (
        <div className="space-y-3">
          {item.dependencies.map((dep, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border ${
                dep.optional
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {dep.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                    {dep.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    v{dep.version}
                  </span>
                  {dep.optional && (
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      Optional
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          This item has no external dependencies.
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
            {item.averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mt-1">
            {renderRating(item.averageRating)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {item.ratingCount} reviews
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {review.userAvatarUrl && (
                  <img
                    src={review.userAvatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="font-medium text-gray-900">
                  {review.userName}
                </span>
                {review.isVerifiedUser && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                    Verified User
                  </span>
                )}
              </div>
              {renderRating(review.rating)}
            </div>
            {review.title && (
              <h4 className="font-medium text-gray-900 mb-1">
                {review.title}
              </h4>
            )}
            {review.content && (
              <p className="text-gray-600 text-sm">{review.content}</p>
            )}
            {review.usageContext && (
              <div className="mt-2 text-xs text-gray-400">
                Used for: {review.usageContext}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400">
              {formatDate(review.createdAt)}
              {review.helpfulCount > 0 && (
                <span className="ml-3">
                  {review.helpfulCount} found helpful
                </span>
              )}
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>
    </div>
  );

  const renderMetricsTab = () => {
    if (!metrics) {
      return (
        <p className="text-gray-500 text-center py-8">
          Metrics are only available for installed items with session history.
        </p>
      );
    }

    const completionRate =
      metrics.totalSessions > 0
        ? (
            (metrics.completedSessions / metrics.totalSessions) *
            100
          ).toFixed(1)
        : '0';

    return (
      <div className="space-y-6">
        {/* Session Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(metrics.totalSessions)}
            </div>
            <div className="text-sm text-gray-500">Total Sessions</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">
              {metrics.avgDurationMinutes.toFixed(0)}min
            </div>
            <div className="text-sm text-gray-500">Avg Duration</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              ${metrics.estimatedTotalCost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Est. Total Cost</div>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Performance
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg Agents Used</span>
              <span className="font-medium">
                {metrics.avgAgentsUsed.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Tokens</span>
              <span className="font-medium">
                {formatNumber(metrics.totalTokensUsed)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">User Satisfaction</span>
              <span className="font-medium">
                {(metrics.userSatisfaction * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}
            >
              {item.iconUrl ? (
                <img src={item.iconUrl} alt="" className="w-10 h-10" />
              ) : (
                <span
                  className={`text-${typeInfo.color}-600 text-2xl font-bold`}
                >
                  {item.displayName[0]}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  {item.displayName}
                </h2>
                {item.isOfficial && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                    Official
                  </span>
                )}
                {item.isVerified && !item.isOfficial && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                    Verified
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 text-xs font-bold bg-${trustInfo.color}-100 text-${trustInfo.color}-700 rounded`}
                >
                  Trust: {item.trustScore.grade}
                </span>
              </div>
              <div className="text-gray-500 mt-1">
                by {item.author.name} | v{item.version} |{' '}
                <span
                  className={`text-${difficultyInfo.color}-600 font-medium`}
                >
                  {difficultyInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  {renderRating(item.averageRating)}
                  <span className="text-sm text-gray-500">
                    ({item.ratingCount})
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatNumber(item.installCount)} installs
                </span>
                <span className="text-sm text-gray-500">
                  {formatNumber(item.activeUsers)} active
                </span>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          {isInstalled ? (
            <>
              {onLaunch && (
                <button
                  onClick={onLaunch}
                  className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Launch Session'}
                </button>
              )}
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
              className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Installing...' : 'Install'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 px-6">
          {(
            ['overview', 'trust', 'dependencies', 'reviews', 'metrics'] as Tab[]
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
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
        {activeTab === 'trust' && renderTrustTab()}
        {activeTab === 'dependencies' && renderDependenciesTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </div>
    </div>
  );
}

export default CoworkDetails;
