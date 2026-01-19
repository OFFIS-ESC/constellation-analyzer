import { TangibleConfig } from '../types';

/**
 * Validates a tangible configuration.
 * For filter mode: requires at least one filter (labels, actorTypes, or relationTypes)
 * For state/stateDial mode: requires stateId
 * Supports both old (filterLabels) and new (filters) formats.
 *
 * @param tangible - The tangible configuration to validate
 * @returns true if valid, false otherwise
 */
export function validateTangibleConfig(tangible: TangibleConfig): boolean {
  if (tangible.mode === 'filter') {
    // Check new format first
    if (tangible.filters) {
      const hasLabels = !!(tangible.filters.labels && tangible.filters.labels.length > 0);
      const hasActorTypes = !!(tangible.filters.actorTypes && tangible.filters.actorTypes.length > 0);
      const hasRelationTypes = !!(tangible.filters.relationTypes && tangible.filters.relationTypes.length > 0);

      return hasLabels || hasActorTypes || hasRelationTypes;
    }

    // Fallback to old format for backward compatibility
    if (tangible.filterLabels && tangible.filterLabels.length > 0) {
      return true;
    }

    return false;
  }

  if (tangible.mode === 'state' || tangible.mode === 'stateDial') {
    return !!tangible.stateId;
  }

  return false;
}

/**
 * Gets validation error message for a tangible configuration.
 *
 * @param tangible - The tangible configuration to validate
 * @returns Error message if invalid, null if valid
 */
export function getTangibleValidationError(tangible: TangibleConfig): string | null {
  if (tangible.mode === 'filter') {
    const hasNewFilters = tangible.filters && (
      (tangible.filters.labels && tangible.filters.labels.length > 0) ||
      (tangible.filters.actorTypes && tangible.filters.actorTypes.length > 0) ||
      (tangible.filters.relationTypes && tangible.filters.relationTypes.length > 0)
    );

    const hasOldFilters = tangible.filterLabels && tangible.filterLabels.length > 0;

    if (!hasNewFilters && !hasOldFilters) {
      return 'At least one filter must be selected (labels, actor types, or relation types)';
    }
  }

  if (tangible.mode === 'state' || tangible.mode === 'stateDial') {
    if (!tangible.stateId) {
      return 'A constellation state must be selected';
    }
  }

  return null;
}
