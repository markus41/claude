/**
 * Palette State Management Store
 *
 * Establishes centralized state management for node palette functionality.
 * Manages favorites, recently used nodes, search state, and category collapse state.
 * Persists user preferences to localStorage for cross-session continuity.
 *
 * Best for: Visual workflow editors requiring personalized node palette
 * with search functionality and user preference persistence.
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * Palette store state interface
 */
interface PaletteState {
  // Favorites management
  /** Set of favorited node type names */
  favorites: Set<string>;
  /** Add node type to favorites */
  addFavorite: (nodeType: string) => void;
  /** Remove node type from favorites */
  removeFavorite: (nodeType: string) => void;
  /** Toggle favorite status */
  toggleFavorite: (nodeType: string) => void;
  /** Check if node type is favorited */
  isFavorite: (nodeType: string) => boolean;

  // Recently used nodes
  /** Recently used node type names (max 5) */
  recentNodes: string[];
  /** Add node to recently used list */
  addRecentNode: (nodeType: string) => void;
  /** Clear recently used nodes */
  clearRecentNodes: () => void;

  // Search state
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Clear search query */
  clearSearch: () => void;

  // Category collapse state
  /** Map of category to collapsed state */
  collapsedCategories: Record<string, boolean>;
  /** Toggle category collapse state */
  toggleCategory: (category: string) => void;
  /** Collapse all categories */
  collapseAll: () => void;
  /** Expand all categories */
  expandAll: () => void;

  // Utility
  /** Reset all palette state */
  reset: () => void;
}

/**
 * Default collapsed state for categories
 * All categories expanded by default for better discoverability
 */
const DEFAULT_COLLAPSED_CATEGORIES: Record<string, boolean> = {
  trigger: false,
  phase: false,
  agent: false,
  control: false,
  action: false,
  terminator: false,
};

/**
 * Maximum number of recently used nodes to track
 */
const MAX_RECENT_NODES = 5;

/**
 * Create palette store with persistence
 *
 * Persists favorites, recent nodes, and collapse state to localStorage.
 * Search query is session-only (not persisted).
 */
export const usePaletteStore = create<PaletteState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          favorites: new Set<string>(),
          recentNodes: [],
          searchQuery: '',
          collapsedCategories: { ...DEFAULT_COLLAPSED_CATEGORIES },

          // Favorites operations
          addFavorite: (nodeType) => {
            set((state) => {
              state.favorites.add(nodeType);
            });
          },

          removeFavorite: (nodeType) => {
            set((state) => {
              state.favorites.delete(nodeType);
            });
          },

          toggleFavorite: (nodeType) => {
            const state = get();
            if (state.favorites.has(nodeType)) {
              state.removeFavorite(nodeType);
            } else {
              state.addFavorite(nodeType);
            }
          },

          isFavorite: (nodeType) => {
            return get().favorites.has(nodeType);
          },

          // Recently used operations
          addRecentNode: (nodeType) => {
            set((state) => {
              // Remove nodeType if already exists
              state.recentNodes = state.recentNodes.filter(
                (n) => n !== nodeType
              );

              // Add to front
              state.recentNodes.unshift(nodeType);

              // Limit to MAX_RECENT_NODES
              if (state.recentNodes.length > MAX_RECENT_NODES) {
                state.recentNodes = state.recentNodes.slice(0, MAX_RECENT_NODES);
              }
            });
          },

          clearRecentNodes: () => {
            set((state) => {
              state.recentNodes = [];
            });
          },

          // Search operations
          setSearchQuery: (query) => {
            set((state) => {
              state.searchQuery = query;
            });
          },

          clearSearch: () => {
            set((state) => {
              state.searchQuery = '';
            });
          },

          // Category collapse operations
          toggleCategory: (category) => {
            set((state) => {
              state.collapsedCategories[category] =
                !state.collapsedCategories[category];
            });
          },

          collapseAll: () => {
            set((state) => {
              Object.keys(state.collapsedCategories).forEach((category) => {
                state.collapsedCategories[category] = true;
              });
            });
          },

          expandAll: () => {
            set((state) => {
              Object.keys(state.collapsedCategories).forEach((category) => {
                state.collapsedCategories[category] = false;
              });
            });
          },

          // Reset
          reset: () => {
            set({
              favorites: new Set<string>(),
              recentNodes: [],
              searchQuery: '',
              collapsedCategories: { ...DEFAULT_COLLAPSED_CATEGORIES },
            });
          },
        }))
      ),
      {
        name: 'palette-storage',
        // Only persist favorites, recent nodes, and collapse state
        partialize: (state) => ({
          favorites: Array.from(state.favorites), // Convert Set to Array for JSON
          recentNodes: state.recentNodes,
          collapsedCategories: state.collapsedCategories,
        }),
        // Custom merge to handle Set serialization
        merge: (persistedState, currentState) => {
          const persisted = persistedState as {
            favorites?: string[];
            recentNodes?: string[];
            collapsedCategories?: Record<string, boolean>;
          };

          return {
            ...currentState,
            favorites: new Set(persisted.favorites || []),
            recentNodes: persisted.recentNodes || [],
            collapsedCategories: {
              ...DEFAULT_COLLAPSED_CATEGORIES,
              ...(persisted.collapsedCategories || {}),
            },
          };
        },
      }
    ),
    { name: 'PaletteStore' }
  )
);
