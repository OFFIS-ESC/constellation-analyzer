import { create } from 'zustand';

/**
 * SearchStore - Manages search and filter state
 *
 * Features:
 * - Search text for filtering nodes by label, description, or type
 * - Filter by actor types (show/hide specific node types)
 * - Filter by relation types (show/hide specific edge types)
 * - Results tracking
 */

interface SearchStore {
  // Search text
  searchText: string;
  setSearchText: (text: string) => void;

  // Filter visibility by actor types (nodeTypeId -> visible)
  visibleActorTypes: Record<string, boolean>;
  setActorTypeVisible: (typeId: string, visible: boolean) => void;
  toggleActorType: (typeId: string) => void;
  setAllActorTypesVisible: (visible: boolean) => void;

  // Filter visibility by relation types (edgeTypeId -> visible)
  visibleRelationTypes: Record<string, boolean>;
  setRelationTypeVisible: (typeId: string, visible: boolean) => void;
  toggleRelationType: (typeId: string) => void;
  setAllRelationTypesVisible: (visible: boolean) => void;

  // Clear all filters
  clearFilters: () => void;

  // Check if any filters are active
  hasActiveFilters: () => boolean;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchText: '',
  visibleActorTypes: {},
  visibleRelationTypes: {},

  setSearchText: (text: string) =>
    set({ searchText: text }),

  setActorTypeVisible: (typeId: string, visible: boolean) =>
    set((state) => ({
      visibleActorTypes: {
        ...state.visibleActorTypes,
        [typeId]: visible,
      },
    })),

  toggleActorType: (typeId: string) =>
    set((state) => ({
      visibleActorTypes: {
        ...state.visibleActorTypes,
        [typeId]: !state.visibleActorTypes[typeId],
      },
    })),

  setAllActorTypesVisible: (visible: boolean) =>
    set((state) => {
      const updated: Record<string, boolean> = {};
      Object.keys(state.visibleActorTypes).forEach((typeId) => {
        updated[typeId] = visible;
      });
      return { visibleActorTypes: updated };
    }),

  setRelationTypeVisible: (typeId: string, visible: boolean) =>
    set((state) => ({
      visibleRelationTypes: {
        ...state.visibleRelationTypes,
        [typeId]: visible,
      },
    })),

  toggleRelationType: (typeId: string) =>
    set((state) => ({
      visibleRelationTypes: {
        ...state.visibleRelationTypes,
        [typeId]: !state.visibleRelationTypes[typeId],
      },
    })),

  setAllRelationTypesVisible: (visible: boolean) =>
    set((state) => {
      const updated: Record<string, boolean> = {};
      Object.keys(state.visibleRelationTypes).forEach((typeId) => {
        updated[typeId] = visible;
      });
      return { visibleRelationTypes: updated };
    }),

  clearFilters: () =>
    set((state) => {
      // Reset all actor types to visible
      const resetActorTypes: Record<string, boolean> = {};
      Object.keys(state.visibleActorTypes).forEach((typeId) => {
        resetActorTypes[typeId] = true;
      });

      // Reset all relation types to visible
      const resetRelationTypes: Record<string, boolean> = {};
      Object.keys(state.visibleRelationTypes).forEach((typeId) => {
        resetRelationTypes[typeId] = true;
      });

      return {
        searchText: '',
        visibleActorTypes: resetActorTypes,
        visibleRelationTypes: resetRelationTypes,
      };
    }),

  hasActiveFilters: () => {
    const state = get();

    // Check if search text is present
    if (state.searchText.trim() !== '') {
      return true;
    }

    // Check if any actor type is hidden
    const hasHiddenActorType = Object.values(state.visibleActorTypes).some(
      (visible) => !visible
    );
    if (hasHiddenActorType) {
      return true;
    }

    // Check if any relation type is hidden
    const hasHiddenRelationType = Object.values(state.visibleRelationTypes).some(
      (visible) => !visible
    );
    if (hasHiddenRelationType) {
      return true;
    }

    return false;
  },
}));
