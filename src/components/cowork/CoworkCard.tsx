/**
 * Cowork Card Component
 *
 * Displays a cowork marketplace item in a card format with trust score,
 * difficulty badge, session stats, and quick actions.
 */

import React from 'react';
import type { CoworkItem } from '../../types/cowork';
import {
  COWORK_ITEM_TYPE_INFO,
  COWORK_DIFFICULTY_INFO,
  TRUST_GRADE_INFO,
} from '../../types/cowork';

interface CoworkCardProps {
  item: CoworkItem;
  onClick?: (item: CoworkItem) => void;
  onInstall?: (item: CoworkItem) => void;
  onLaunch?: (item: CoworkItem) => void;
  isInstalled?: boolean;
  compact?: boolean;
}

export function CoworkCard({
  item,
  onClick,
  onInstall,
  onLaunch,
  isInstalled = false,
  compact = false,
}: CoworkCardProps) {
  const typeInfo = COWORK_ITEM_TYPE_INFO[item.type];
  const difficultyInfo = COWORK_DIFFICULTY_INFO[item.difficulty];
  const trustInfo = TRUST_GRADE_INFO[item.trustScore.grade];

  const handleClick = () => onClick?.(item);

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall?.(item);
  };

  const handleLaunch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLaunch?.(item);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  const renderRating = () => {
    const stars = [];
    const fullStars = Math.floor(item.averageRating);
    const hasHalfStar = item.averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ★
          </span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">
            ☆
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300">
            ☆
          </span>
        );
      }
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-500">({item.ratingCount})</span>
      </div>
    );
  };

  const renderTrustBadge = () => (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-bold rounded bg-${trustInfo.color}-100 text-${trustInfo.color}-700`}
      title={`Trust Score: ${item.trustScore.overall}/100 (${trustInfo.label})`}
    >
      {item.trustScore.grade}
    </span>
  );

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
        onClick={handleClick}
      >
        <div
          className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}
        >
          {item.iconUrl ? (
            <img src={item.iconUrl} alt="" className="w-6 h-6" />
          ) : (
            <span className={`text-${typeInfo.color}-600 text-lg`}>
              {item.displayName[0]}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {item.displayName}
            </span>
            {renderTrustBadge()}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {item.description}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-gray-900">
            {formatNumber(item.installCount)}
          </div>
          <div className="text-xs text-gray-500">installs</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all overflow-hidden group"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}
          >
            {item.iconUrl ? (
              <img src={item.iconUrl} alt="" className="w-8 h-8" />
            ) : (
              <span
                className={`text-${typeInfo.color}-600 text-xl font-bold`}
              >
                {item.displayName[0]}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.displayName}
              </h3>
              {item.isOfficial && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                  Official
                </span>
              )}
              {item.isVerified && !item.isOfficial && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                  Verified
                </span>
              )}
              {item.isFeatured && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                  Featured
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              by {item.author.name}
              {item.author.organization && (
                <span className="text-gray-400">
                  {' '}
                  ({item.author.organization})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Tags Row */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          <span
            className={`px-2 py-0.5 text-xs font-medium bg-${typeInfo.color}-50 text-${typeInfo.color}-700 rounded-full`}
          >
            {typeInfo.label}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium bg-${difficultyInfo.color}-50 text-${difficultyInfo.color}-700 rounded-full`}
          >
            {difficultyInfo.label}
          </span>
          {renderTrustBadge()}
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        {item.estimatedDuration && (
          <span title="Estimated duration">~{item.estimatedDuration}</span>
        )}
        {item.maxParallelAgents && (
          <span title="Max parallel agents">
            {item.maxParallelAgents} agents
          </span>
        )}
        {item.completionRate > 0 && (
          <span title="Completion rate">
            {Math.round(item.completionRate * 100)}% success
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {renderRating()}
          <span className="text-sm text-gray-500">
            {formatNumber(item.installCount)} installs
          </span>
        </div>

        <div className="flex gap-2">
          {isInstalled && onLaunch && (
            <button
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              onClick={handleLaunch}
            >
              Launch
            </button>
          )}
          {onInstall && (
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isInstalled
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              onClick={handleInstall}
            >
              {isInstalled ? 'Installed' : 'Install'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoworkCard;
