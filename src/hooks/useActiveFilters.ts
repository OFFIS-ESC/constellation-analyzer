import { useMemo } from 'react';
import { useSearchStore } from '../stores/searchStore';
import { useTuioStore } from '../stores/tuioStore';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Hook to get the currently active filters based on mode.
 *
 * - In editing mode: Returns filters from searchStore
 * - In presentation mode: Returns filters from tuioStore.presentationFilters
 *
 * This ensures that presentation mode and editing mode have separate filter states.
 */
export function useActiveFilters() {
  const { presentationMode } = useSettingsStore();

  // Editing mode filters (searchStore)
  const {
    searchText: editSearchText,
    selectedLabels: editSelectedLabels,
    selectedActorTypes: editSelectedActorTypes,
    selectedRelationTypes: editSelectedRelationTypes,
  } = useSearchStore();

  // Presentation mode filters (tuioStore)
  const presentationFilters = useTuioStore((state) => state.presentationFilters);

  return useMemo(() => {
    if (presentationMode) {
      // Use presentation filters from tangibles
      return {
        searchText: '', // Search text not supported in presentation mode
        selectedLabels: presentationFilters.labels,
        selectedActorTypes: presentationFilters.actorTypes,
        selectedRelationTypes: presentationFilters.relationTypes,
        combineMode: presentationFilters.combineMode,
      };
    } else {
      // Use editing mode filters
      return {
        searchText: editSearchText,
        selectedLabels: editSelectedLabels,
        selectedActorTypes: editSelectedActorTypes,
        selectedRelationTypes: editSelectedRelationTypes,
        combineMode: 'AND' as const, // Editing mode always uses AND
      };
    }
  }, [
    presentationMode,
    editSearchText,
    editSelectedLabels,
    editSelectedActorTypes,
    editSelectedRelationTypes,
    presentationFilters,
  ]);
}

/**
 * Check if a node matches the active filters.
 *
 * @param nodeType - The node's type ID
 * @param nodeLabels - The node's label IDs
 * @param nodeName - The node's name/label for text search
 * @param nodeDescription - The node's description for text search
 * @param nodeTypeName - The node type's display name for text search
 * @param filters - The active filters from useActiveFilters()
 * @returns true if the node matches the filters
 */
export function nodeMatchesFilters(
  nodeType: string,
  nodeLabels: string[],
  nodeName: string,
  nodeDescription: string,
  nodeTypeName: string,
  filters: ReturnType<typeof useActiveFilters>
): boolean {
  const {
    searchText,
    selectedLabels,
    selectedActorTypes,
    combineMode,
  } = filters;

  // Check if any filters are active
  const hasTypeFilter = selectedActorTypes.length > 0;
  const hasLabelFilter = selectedLabels.length > 0;
  const hasSearchText = searchText.trim() !== '';

  // If no filters active, show all nodes
  if (!hasTypeFilter && !hasLabelFilter && !hasSearchText) {
    return true;
  }

  // Check type filter match
  const typeMatches = !hasTypeFilter || selectedActorTypes.includes(nodeType);

  // Check label filter match
  const labelMatches = !hasLabelFilter || nodeLabels.some((labelId) => selectedLabels.includes(labelId));

  // Check search text match
  const searchLower = searchText.toLowerCase().trim();
  const textMatches = !hasSearchText ||
    nodeName.toLowerCase().includes(searchLower) ||
    nodeDescription.toLowerCase().includes(searchLower) ||
    nodeTypeName.toLowerCase().includes(searchLower);

  // Apply combine mode logic
  if (combineMode === 'OR') {
    // OR: Show if matches ANY filter category
    return (
      (hasTypeFilter && typeMatches) ||
      (hasLabelFilter && labelMatches) ||
      (hasSearchText && textMatches)
    );
  } else {
    // AND: Show only if matches ALL active filter categories
    return (
      (!hasTypeFilter || typeMatches) &&
      (!hasLabelFilter || labelMatches) &&
      (!hasSearchText || textMatches)
    );
  }
}

/**
 * Check if an edge matches the active filters.
 *
 * @param edgeType - The edge's type ID
 * @param edgeLabels - The edge's label IDs
 * @param edgeName - The edge's name/label for text search
 * @param edgeTypeName - The edge type's display name for text search
 * @param filters - The active filters from useActiveFilters()
 * @returns true if the edge matches the filters
 */
export function edgeMatchesFilters(
  edgeType: string,
  edgeLabels: string[],
  edgeName: string,
  edgeTypeName: string,
  filters: ReturnType<typeof useActiveFilters>
): boolean {
  const {
    searchText,
    selectedLabels,
    selectedRelationTypes,
    combineMode,
  } = filters;

  // Check if any filters are active
  const hasTypeFilter = selectedRelationTypes.length > 0;
  const hasLabelFilter = selectedLabels.length > 0;
  const hasSearchText = searchText.trim() !== '';

  // If no filters active, show all edges
  if (!hasTypeFilter && !hasLabelFilter && !hasSearchText) {
    return true;
  }

  // Check type filter match
  const typeMatches = !hasTypeFilter || selectedRelationTypes.includes(edgeType);

  // Check label filter match
  const labelMatches = !hasLabelFilter || edgeLabels.some((labelId) => selectedLabels.includes(labelId));

  // Check search text match
  const searchLower = searchText.toLowerCase().trim();
  const textMatches = !hasSearchText ||
    edgeName.toLowerCase().includes(searchLower) ||
    edgeTypeName.toLowerCase().includes(searchLower);

  // Apply combine mode logic
  if (combineMode === 'OR') {
    // OR: Show if matches ANY filter category
    return (
      (hasTypeFilter && typeMatches) ||
      (hasLabelFilter && labelMatches) ||
      (hasSearchText && textMatches)
    );
  } else {
    // AND: Show only if matches ALL active filter categories
    return (
      (!hasTypeFilter || typeMatches) &&
      (!hasLabelFilter || labelMatches) &&
      (!hasSearchText || textMatches)
    );
  }
}
