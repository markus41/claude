/**
 * Cowork Search Component
 *
 * Search bar with filters for finding cowork items in the marketplace.
 * Supports filtering by type, category, difficulty, trust grade, and more.
 */

import React, { useState, useCallback } from 'react';
import type {
  CoworkItemType,
  CoworkCategory,
  CoworkDifficulty,
  TrustGrade,
  CoworkSearchFilters,
} from '../../types/cowork';
import {
  COWORK_ITEM_TYPE_INFO,
  COWORK_CATEGORIES,
  COWORK_DIFFICULTY_INFO,
  TRUST_GRADE_INFO,
} from '../../types/cowork';

interface CoworkSearchProps {
  filters: CoworkSearchFilters;
  onFiltersChange: (filters: Partial<CoworkSearchFilters>) => void;
  onSearch: () => void;
  showFilters?: boolean;
}

export function CoworkSearch({
  filters,
  onFiltersChange,
  onSearch,
  showFilters = true,
}: CoworkSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localQuery, setLocalQuery] = useState(filters.query || '');

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFiltersChange({ query: localQuery });
      onSearch();
    },
    [localQuery, onFiltersChange, onSearch]
  );

  const handleTypeChange = useCallback(
    (type: CoworkItemType | '') => {
      onFiltersChange({ type: type || undefined, category: undefined });
    },
    [onFiltersChange]
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      onFiltersChange({
        category: (category as CoworkCategory) || undefined,
      });
    },
    [onFiltersChange]
  );

  const handleDifficultyChange = useCallback(
    (difficulty: string) => {
      onFiltersChange({
        difficulty: (difficulty as CoworkDifficulty) || undefined,
      });
    },
    [onFiltersChange]
  );

  const handleSortChange = useCallback(
    (sortBy: string) => {
      onFiltersChange({
        sortBy:
          (sortBy as CoworkSearchFilters['sortBy']) || undefined,
      });
    },
    [onFiltersChange]
  );

  const handleTrustGradeChange = useCallback(
    (grade: string) => {
      onFiltersChange({
        minTrustGrade: (grade as TrustGrade) || undefined,
      });
    },
    [onFiltersChange]
  );

  const handleVerifiedChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ isVerified: checked || undefined });
    },
    [onFiltersChange]
  );

  const handleCuratedChange = useCallback(
    (checked: boolean) => {
      onFiltersChange({ isCurated: checked || undefined });
    },
    [onFiltersChange]
  );

  const handleRatingChange = useCallback(
    (rating: string) => {
      onFiltersChange({
        minRating: rating ? Number(rating) : undefined,
      });
    },
    [onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setLocalQuery('');
    onFiltersChange({
      query: undefined,
      type: undefined,
      category: undefined,
      difficulty: undefined,
      tags: undefined,
      isVerified: undefined,
      isOfficial: undefined,
      isCurated: undefined,
      minRating: undefined,
      minTrustGrade: undefined,
      maxDuration: undefined,
      sortBy: undefined,
    });
  }, [onFiltersChange]);

  const hasActiveFilters = !!(
    filters.type ||
    filters.category ||
    filters.difficulty ||
    filters.isVerified ||
    filters.isCurated ||
    filters.minRating ||
    filters.minTrustGrade ||
    filters.sortBy
  );

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
              placeholder="Search cowork templates, workflows, agents..."
              className="w-full px-4 py-3 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
            className="px-6 py-3 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {showFilters && (
        <>
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Item Type */}
            <select
              value={filters.type || ''}
              onChange={(e) =>
                handleTypeChange(e.target.value as CoworkItemType | '')
              }
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              {(
                Object.keys(COWORK_ITEM_TYPE_INFO) as CoworkItemType[]
              ).map((type) => (
                <option key={type} value={type}>
                  {COWORK_ITEM_TYPE_INFO[type].label}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={filters.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {(
                Object.keys(COWORK_CATEGORIES) as CoworkCategory[]
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {COWORK_CATEGORIES[cat].label}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={filters.difficulty || ''}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Levels</option>
              {(
                Object.keys(COWORK_DIFFICULTY_INFO) as CoworkDifficulty[]
              ).map((d) => (
                <option key={d} value={d}>
                  {COWORK_DIFFICULTY_INFO[d].label}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy || ''}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Best Match</option>
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="trending">Trending</option>
              <option value="completion_rate">Best Completion Rate</option>
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
                {/* Trust & Verification */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Trust & Verification
                  </span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isVerified || false}
                      onChange={(e) =>
                        handleVerifiedChange(e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">
                      Verified Only
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.isCurated || false}
                      onChange={(e) =>
                        handleCuratedChange(e.target.checked)
                      }
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">
                      Curated Only
                    </span>
                  </label>
                </div>

                {/* Min Trust Grade */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Minimum Trust Grade
                  </span>
                  <select
                    value={filters.minTrustGrade || ''}
                    onChange={(e) =>
                      handleTrustGradeChange(e.target.value)
                    }
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Any Grade</option>
                    {(
                      Object.keys(TRUST_GRADE_INFO) as TrustGrade[]
                    ).map((grade) => (
                      <option key={grade} value={grade}>
                        {grade} - {TRUST_GRADE_INFO[grade].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Rating */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Minimum Rating
                  </span>
                  <select
                    value={filters.minRating || ''}
                    onChange={(e) =>
                      handleRatingChange(e.target.value)
                    }
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

export default CoworkSearch;
