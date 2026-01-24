/**
 * Plugin Card Component
 *
 * Displays a plugin in a card format for marketplace browsing.
 * Shows key information, ratings, and quick actions.
 */

import React from 'react';
import type { Plugin } from '../../types/plugins';
import { PLUGIN_TYPE_INFO } from '../../types/plugins';

interface PluginCardProps {
  plugin: Plugin;
  onClick?: (plugin: Plugin) => void;
  onInstall?: (plugin: Plugin) => void;
  isInstalled?: boolean;
  compact?: boolean;
}

export function PluginCard({
  plugin,
  onClick,
  onInstall,
  isInstalled = false,
  compact = false,
}: PluginCardProps) {
  const typeInfo = PLUGIN_TYPE_INFO[plugin.type];

  const handleClick = () => {
    onClick?.(plugin);
  };

  const handleInstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall?.(plugin);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return String(num);
  };

  const renderRating = () => {
    const stars = [];
    const fullStars = Math.floor(plugin.averageRating);
    const hasHalfStar = plugin.averageRating % 1 >= 0.5;

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
        <span className="text-sm text-gray-500">
          ({plugin.ratingCount})
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
        onClick={handleClick}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}>
          {plugin.iconUrl ? (
            <img src={plugin.iconUrl} alt="" className="w-6 h-6" />
          ) : (
            <span className={`text-${typeInfo.color}-600 text-lg`}>
              {plugin.displayName[0]}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {plugin.displayName}
            </span>
            {plugin.isVerified && (
              <span className="text-blue-500" title="Verified">
                ✓
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {plugin.description}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            {formatNumber(plugin.installCount)}
          </div>
          <div className="text-xs text-gray-500">installs</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all overflow-hidden"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
            {plugin.iconUrl ? (
              <img src={plugin.iconUrl} alt="" className="w-8 h-8" />
            ) : (
              <span className={`text-${typeInfo.color}-600 text-xl font-bold`}>
                {plugin.displayName[0]}
              </span>
            )}
          </div>

          {/* Title & Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {plugin.displayName}
              </h3>
              {plugin.isOfficial && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  Official
                </span>
              )}
              {plugin.isVerified && !plugin.isOfficial && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                  Verified
                </span>
              )}
              {plugin.isFeatured && (
                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                  Featured
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              by {plugin.author.name}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {plugin.description}
        </p>
      </div>

      {/* Tags */}
      <div className="px-4 pb-3">
        <div className="flex flex-wrap gap-1">
          <span className={`px-2 py-0.5 text-xs font-medium bg-${typeInfo.color}-50 text-${typeInfo.color}-700 rounded-full`}>
            {typeInfo.label}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {plugin.category}
          </span>
          {plugin.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {/* Rating & Stats */}
        <div className="flex items-center gap-4">
          {renderRating()}
          <span className="text-sm text-gray-500">
            {formatNumber(plugin.installCount)} installs
          </span>
        </div>

        {/* Action */}
        {onInstall && (
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isInstalled
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleInstall}
          >
            {isInstalled ? 'Installed' : 'Install'}
          </button>
        )}
      </div>
    </div>
  );
}

export default PluginCard;
