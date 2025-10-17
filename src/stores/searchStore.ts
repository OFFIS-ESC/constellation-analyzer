import { create } from 'zustand';

/**
 * SearchStore - Manages search and filter state
 *
 * Features:
 * - Search text for filtering both actors (by label, description, or type) and relations (by label or type)
 * - POSITIVE FILTERS (empty = show all, selected = show only selected):
 *   - Filter by actor types
 *   - Filter by relation types
 *   - Filter by labels
 * - Results tracking
 */

interface SearchStore {
  // Search text (applies to both actors and edges)
  searchText: string;
  setSearchText: (text: string) => void;

  // POSITIVE actor type filter: selected type IDs to show (empty = show all)
  selectedActorTypes: string[];
  toggleSelectedActorType: (typeId: string) => void;
  clearSelectedActorTypes: () => void;

  // POSITIVE relation type filter: selected type IDs to show (empty = show all)
  selectedRelationTypes: string[];
  toggleSelectedRelationType: (typeId: string) => void;
  clearSelectedRelationTypes: () => void;

  // POSITIVE label filter: selected label IDs to show (empty = show all)
  selectedLabels: string[];
  toggleSelectedLabel: (labelId: string) => void;
  clearSelectedLabels: () => void;

  // Clear all filters
  clearFilters: () => void;

  // Check if any filters are active
  hasActiveFilters: () => boolean;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchText: '',
  selectedActorTypes: [],
  selectedRelationTypes: [],
  selectedLabels: [],

  setSearchText: (text: string) =>
    set({ searchText: text }),

  toggleSelectedActorType: (typeId: string) =>
    set((state) => {
      const isSelected = state.selectedActorTypes.includes(typeId);
      return {
        selectedActorTypes: isSelected
          ? state.selectedActorTypes.filter((id) => id !== typeId)
          : [...state.selectedActorTypes, typeId],
      };
    }),

  clearSelectedActorTypes: () =>
    set({ selectedActorTypes: [] }),

  toggleSelectedRelationType: (typeId: string) =>
    set((state) => {
      const isSelected = state.selectedRelationTypes.includes(typeId);
      return {
        selectedRelationTypes: isSelected
          ? state.selectedRelationTypes.filter((id) => id !== typeId)
          : [...state.selectedRelationTypes, typeId],
      };
    }),

  clearSelectedRelationTypes: () =>
    set({ selectedRelationTypes: [] }),

  toggleSelectedLabel: (labelId: string) =>
    set((state) => {
      const isSelected = state.selectedLabels.includes(labelId);
      return {
        selectedLabels: isSelected
          ? state.selectedLabels.filter((id) => id !== labelId)
          : [...state.selectedLabels, labelId],
      };
    }),

  clearSelectedLabels: () =>
    set({ selectedLabels: [] }),

  clearFilters: () =>
    set({
      searchText: '',
      selectedActorTypes: [],
      selectedRelationTypes: [],
      selectedLabels: [],
    }),

  hasActiveFilters: () => {
    const state = get();

    // Check if search text is present
    if (state.searchText.trim() !== '') {
      return true;
    }

    // Check if any actor types are selected (positive filter)
    if (state.selectedActorTypes.length > 0) {
      return true;
    }

    // Check if any relation types are selected (positive filter)
    if (state.selectedRelationTypes.length > 0) {
      return true;
    }

    // Check if any labels are selected (positive filter)
    if (state.selectedLabels.length > 0) {
      return true;
    }

    return false;
  },
}));
