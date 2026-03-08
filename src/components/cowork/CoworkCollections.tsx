/**
 * Cowork Collections Component
 *
 * Displays curated collections of cowork items grouped by domain/use case.
 * Each collection is a horizontal scrollable row of cards with a header
 * showing the collection name, description, and tag list.
 */

import React, { useState } from 'react';
import type { CoworkCollection, CoworkItem } from '../../types/cowork';
import { CoworkCard } from './CoworkCard';

interface CoworkCollectionsProps {
  collections: CoworkCollection[];
  loading?: boolean;
  onItemClick?: (item: CoworkItem) => void;
  onCollectionClick?: (collection: CoworkCollection) => void;
  maxCollections?: number;
}

function CollectionRow({
  collection,
  onItemClick,
  onCollectionClick,
}: {
  collection: CoworkCollection;
  onItemClick?: (item: CoworkItem) => void;
  onCollectionClick?: (collection: CoworkCollection) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll
    ? collection.items
    : collection.items.slice(0, 4);

  if (collection.items.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Collection Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={collection.name}>
            {collection.iconEmoji}
          </span>
          <div>
            <button
              onClick={() => onCollectionClick?.(collection)}
              className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-left"
            >
              {collection.name}
            </button>
            <p className="text-sm text-gray-500 mt-0.5 max-w-2xl">
              {collection.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {collection.items.length} item
            {collection.items.length !== 1 ? 's' : ''}
          </span>
          {collection.items.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              {showAll ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {collection.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayItems.map((item) => (
          <CoworkCard
            key={item.id}
            item={item}
            compact
            onClick={onItemClick}
            onInstall={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

export function CoworkCollections({
  collections,
  loading = false,
  onItemClick,
  onCollectionClick,
  maxCollections,
}: CoworkCollectionsProps) {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((__, j) => (
                <div
                  key={j}
                  className="h-48 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-400 text-4xl mb-3">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No collections available
        </h3>
        <p className="text-gray-500 text-sm">
          Curated collections will appear here once items are published.
        </p>
      </div>
    );
  }

  const limit = maxCollections ?? (showAll ? collections.length : 5);
  const visible = collections.slice(0, limit);
  const hasMore = collections.length > (maxCollections ?? 5);

  return (
    <div className="space-y-10">
      {visible.map((collection) => (
        <CollectionRow
          key={collection.id}
          collection={collection}
          onItemClick={onItemClick}
          onCollectionClick={onCollectionClick}
        />
      ))}

      {hasMore && !maxCollections && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            {showAll
              ? 'Show Fewer Collections'
              : `Show All ${collections.length} Collections`}
          </button>
        </div>
      )}
    </div>
  );
}

export default CoworkCollections;
