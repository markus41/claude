/**
 * Palette Store Tests
 *
 * Comprehensive test suite for palette state management.
 * Validates favorites, recent nodes, search, and category collapse functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePaletteStore } from './paletteStore';

describe('PaletteStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePaletteStore.getState().reset();
  });

  describe('Favorites Management', () => {
    it('should add favorite node type', () => {
      const { addFavorite, isFavorite } = usePaletteStore.getState();

      addFavorite('trigger.epic');

      expect(isFavorite('trigger.epic')).toBe(true);
    });

    it('should remove favorite node type', () => {
      const { addFavorite, removeFavorite, isFavorite } =
        usePaletteStore.getState();

      addFavorite('trigger.epic');
      expect(isFavorite('trigger.epic')).toBe(true);

      removeFavorite('trigger.epic');
      expect(isFavorite('trigger.epic')).toBe(false);
    });

    it('should toggle favorite status', () => {
      const { toggleFavorite, isFavorite } = usePaletteStore.getState();

      // First toggle - add
      toggleFavorite('trigger.epic');
      expect(isFavorite('trigger.epic')).toBe(true);

      // Second toggle - remove
      toggleFavorite('trigger.epic');
      expect(isFavorite('trigger.epic')).toBe(false);
    });

    it('should handle multiple favorites', () => {
      const { addFavorite, favorites } = usePaletteStore.getState();

      addFavorite('trigger.epic');
      addFavorite('phase.explore');
      addFavorite('agent.single');

      expect(favorites.size).toBe(3);
      expect(favorites.has('trigger.epic')).toBe(true);
      expect(favorites.has('phase.explore')).toBe(true);
      expect(favorites.has('agent.single')).toBe(true);
    });
  });

  describe('Recently Used Nodes', () => {
    it('should add recent node', () => {
      const { addRecentNode, recentNodes } = usePaletteStore.getState();

      addRecentNode('trigger.epic');

      expect(recentNodes).toEqual(['trigger.epic']);
    });

    it('should maintain most recent order', () => {
      const { addRecentNode, recentNodes } = usePaletteStore.getState();

      addRecentNode('trigger.epic');
      addRecentNode('phase.explore');
      addRecentNode('agent.single');

      expect(recentNodes).toEqual([
        'agent.single',
        'phase.explore',
        'trigger.epic',
      ]);
    });

    it('should move existing node to front', () => {
      const { addRecentNode, recentNodes } = usePaletteStore.getState();

      addRecentNode('trigger.epic');
      addRecentNode('phase.explore');
      addRecentNode('agent.single');
      addRecentNode('trigger.epic'); // Re-add first node

      expect(recentNodes).toEqual([
        'trigger.epic',
        'agent.single',
        'phase.explore',
      ]);
    });

    it('should limit recent nodes to 5', () => {
      const { addRecentNode, recentNodes } = usePaletteStore.getState();

      addRecentNode('node1');
      addRecentNode('node2');
      addRecentNode('node3');
      addRecentNode('node4');
      addRecentNode('node5');
      addRecentNode('node6');

      expect(recentNodes.length).toBe(5);
      expect(recentNodes).toEqual(['node6', 'node5', 'node4', 'node3', 'node2']);
    });

    it('should clear recent nodes', () => {
      const { addRecentNode, clearRecentNodes, recentNodes } =
        usePaletteStore.getState();

      addRecentNode('trigger.epic');
      addRecentNode('phase.explore');

      clearRecentNodes();

      expect(recentNodes).toEqual([]);
    });
  });

  describe('Search State', () => {
    it('should set search query', () => {
      const { setSearchQuery, searchQuery } = usePaletteStore.getState();

      setSearchQuery('trigger');

      expect(searchQuery).toBe('trigger');
    });

    it('should clear search query', () => {
      const { setSearchQuery, clearSearch, searchQuery } =
        usePaletteStore.getState();

      setSearchQuery('trigger');
      expect(searchQuery).toBe('trigger');

      clearSearch();
      expect(searchQuery).toBe('');
    });

    it('should update search query', () => {
      const { setSearchQuery, searchQuery } = usePaletteStore.getState();

      setSearchQuery('trigger');
      expect(searchQuery).toBe('trigger');

      setSearchQuery('phase');
      expect(searchQuery).toBe('phase');
    });
  });

  describe('Category Collapse State', () => {
    it('should toggle category collapse', () => {
      const { toggleCategory, collapsedCategories } =
        usePaletteStore.getState();

      expect(collapsedCategories.trigger).toBe(false);

      toggleCategory('trigger');
      expect(collapsedCategories.trigger).toBe(true);

      toggleCategory('trigger');
      expect(collapsedCategories.trigger).toBe(false);
    });

    it('should collapse all categories', () => {
      const { collapseAll, collapsedCategories } = usePaletteStore.getState();

      collapseAll();

      expect(collapsedCategories.trigger).toBe(true);
      expect(collapsedCategories.phase).toBe(true);
      expect(collapsedCategories.agent).toBe(true);
      expect(collapsedCategories.control).toBe(true);
      expect(collapsedCategories.action).toBe(true);
      expect(collapsedCategories.terminator).toBe(true);
    });

    it('should expand all categories', () => {
      const { collapseAll, expandAll, collapsedCategories } =
        usePaletteStore.getState();

      collapseAll();
      expandAll();

      expect(collapsedCategories.trigger).toBe(false);
      expect(collapsedCategories.phase).toBe(false);
      expect(collapsedCategories.agent).toBe(false);
      expect(collapsedCategories.control).toBe(false);
      expect(collapsedCategories.action).toBe(false);
      expect(collapsedCategories.terminator).toBe(false);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state', () => {
      const {
        addFavorite,
        addRecentNode,
        setSearchQuery,
        toggleCategory,
        reset,
        favorites,
        recentNodes,
        searchQuery,
        collapsedCategories,
      } = usePaletteStore.getState();

      // Set some state
      addFavorite('trigger.epic');
      addRecentNode('phase.explore');
      setSearchQuery('test');
      toggleCategory('trigger');

      // Reset
      reset();

      // Verify all state is cleared
      expect(favorites.size).toBe(0);
      expect(recentNodes).toEqual([]);
      expect(searchQuery).toBe('');
      expect(collapsedCategories.trigger).toBe(false);
    });
  });
});
