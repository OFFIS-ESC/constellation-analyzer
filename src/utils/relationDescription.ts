import type { RelationData } from '../types';

export type RelationDescriptionDisplay = 'hidden' | 'expanded';

/**
 * How a relation's description box appears on the canvas.
 *
 * Aggregated edges stand in for several relations but carry the data of the
 * first one, so showing its text would attribute it to all of them.
 */
export function getRelationDescriptionDisplay(
  data: (Partial<RelationData> & { aggregatedCount?: number }) | undefined,
): RelationDescriptionDisplay {
  if (!data?.description?.trim() || !data.showDescription || data.aggregatedCount) {
    return 'hidden';
  }
  return 'expanded';
}
