/**
 * Plugin Search Component
 *
 * Search bar with filters for finding plugins in the marketplace.
 */

import React, { useState, useCallback } from 'react';
import type { PluginType, PluginSearchFilters } from '../../types/plugins';
import { PLUGIN_TYPE_INFO, PLUGIN_CATEGORIES } from '../../types/plugins';

interface PluginSearchProps {
  filters: PluginSearchFilters;
  onFiltersChange: (filters: Partial<PluginSearchFilters>) => void;
  onSearch: () => void;
  showFilters?: boolean;
}

export function PluginSearch({
  filters,
  onFiltersChange,
  onSearch,
  showFilters = true,
}: PluginSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query || '');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ query: localQuery });
    onSearch();
  }, [localQuery, onFiltersChange, onSearch]);

  const handleTypeChange = useCallback((type: PluginType | '') => {
    onFiltersChange({
      type: type || undefined,
      category: undefined, // Reset category when type changes
    });
  }, [onFiltersChange]);

  const handleCategoryChange = useCallback((category: string) => {
    onFiltersChange({ category: category || undefined });
  }, [onFiltersChange]);

  const handleSortChange = useCallback((sortBy: string) => {
    onFiltersChange({
      sortBy: sortBy as PluginSearchFilters['sortBy'] || undefined,
    });
  }, [onFiltersChange]);

  const handleVerifiedChange = useCallback((checked: boolean) => {
    onFiltersChange({ isVerified: checked || undefined });
  }, [onFiltersChange]);

  const handleOfficialChange = useCallback((checked: boolean) => {
    onFiltersChange({ isOfficial: checked || undefined });
  }, [onFiltersChange]);

  const handleRatingChange = useCallback((rating: string) => {
    onFiltersChange({ minRating: rating ? Number(rating) : undefined });
  }, [onFiltersChange]);

  const clearFilters = useCallback(() => {
    setLocalQuery('');
    onFiltersChange({
      query: undefined,
      type: undefined,
      category: undefined,
      tags: undefined,
      isVerified: undefined,
      isOfficial: undefined,
      minRating: undefined,
      sortBy: undefined,
    });
  }, [onFiltersChange]);

  const hasActiveFilters = !!(
    filters.type ||
    filters.category ||
    filters.isVerified ||
    filters.isOfficial ||
    filters.minRating ||
    filters.sortBy
  );

  const categories = filters.type
    ? PLUGIN_CATEGORIES[filters.type]
    : Object.values(PLUGIN_CATEGORIES).flat();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search plugins..."
              className="w-full px-4 py-3 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {showFilters && (
        <>
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Plugin Type */}
            <select
              value={filters.type || ''}
              onChange={(e) => handleTypeChange(e.target.value as PluginType | '')}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {(Object.keys(PLUGIN_TYPE_INFO) as PluginType[]).map((type) => (
                <option key={type} value={type}>
                  {PLUGIN_TYPE_INFO[type].label}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={filters.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {[...new Set(categories)].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy || ''}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Best Match</option>
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>

            {/* Advanced Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? 'Hide' : 'More'} Filters
              <span className="ml-1">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-6">
                {/* Verification */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Trust & Verification
                  </span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isVerified || false}
                      onChange={(e) => handleVerifiedChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Verified Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isOfficial || false}
                      onChange={(e) => handleOfficialChange(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Official Only</span>
                  </label>
                </div>

                {/* Minimum Rating */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Minimum Rating
                  </span>
                  <select
                    value={filters.minRating || ''}
                    onChange={(e) => handleRatingChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PluginSearch;
