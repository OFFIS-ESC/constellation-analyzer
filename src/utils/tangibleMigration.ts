import { TangibleConfig, FilterConfig } from '../types';

/**
 * Migrates a tangible configuration from the old filterLabels format to the new filters format.
 * This function ensures backward compatibility with existing configurations.
 *
 * @param tangible - The tangible configuration to migrate
 * @returns The migrated tangible configuration
 */
export function migrateTangibleConfig(tangible: TangibleConfig): TangibleConfig {
  // If tangible already has filters, return as-is (already new format)
  if (tangible.filters) {
    return tangible;
  }

  // If tangible has filterLabels (old format), convert to new format
  if (tangible.filterLabels && tangible.filterLabels.length > 0) {
    const filters: FilterConfig = {
      labels: tangible.filterLabels,
    };

    // Return migrated tangible (keep filterLabels for compatibility during transition)
    return {
      ...tangible,
      filters,
    };
  }

  // Otherwise return unchanged
  return tangible;
}

/**
 * Migrates an array of tangible configurations.
 *
 * @param tangibles - Array of tangible configurations to migrate
 * @returns Array of migrated tangible configurations
 */
export function migrateTangibleConfigs(tangibles: TangibleConfig[]): TangibleConfig[] {
  return tangibles.map(migrateTangibleConfig);
}
