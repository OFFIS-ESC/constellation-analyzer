import type { Relation, RelationData } from '../types';

type DescribableData = (Partial<RelationData> & { aggregatedCount?: number }) | undefined;

/**
 * Whether a relation has a description that can be shown.
 *
 * Aggregated edges stand in for several relations but carry the data of the
 * first one, so showing its text would attribute it to all of them.
 */
export function hasRelationDescription(data: DescribableData): boolean {
  return !!data?.description?.trim() && !data.aggregatedCount;
}

/**
 * Whether a relation's description box is on the canvas.
 *
 * @param visibilityOverride - A temporary choice made while presenting, which wins over the saved state
 */
export function isRelationDescriptionVisible(data: DescribableData, visibilityOverride?: boolean): boolean {
  return hasRelationDescription(data) && !!(visibilityOverride ?? data?.showDescription);
}

/**
 * What the "all descriptions" button should do next: the relations it applies
 * to, and whether to show them. Any open box means hide; only when none is open
 * does the button offer to show.
 */
export function getToggleAllDescriptionsAction(
  edges: Relation[],
  visibilityOverrides: Record<string, boolean>,
): { ids: string[]; show: boolean } {
  const described = edges.filter((edge) => hasRelationDescription(edge.data));
  return {
    ids: described.map((edge) => edge.id),
    show: !described.some((edge) => isRelationDescriptionVisible(edge.data, visibilityOverrides[edge.id])),
  };
}
