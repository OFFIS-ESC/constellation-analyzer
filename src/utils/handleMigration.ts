import type { SerializedRelation } from '../stores/persistence/types';

/**
 * List of old 4-position handle identifiers that should be migrated
 */
const OLD_HANDLE_POSITIONS = ['top', 'right', 'bottom', 'left'] as const;

/**
 * Migrates a relation from the old 4-position handle system to the new easy-connect handle system.
 * This function ensures backward compatibility with existing constellation files.
 *
 * Old format uses specific position handles: "top", "right", "bottom", "left"
 * New format omits handle fields entirely, allowing floating edges to calculate connection points dynamically
 *
 * @param relation - The relation to migrate
 * @returns The migrated relation
 */
export function migrateRelationHandles(relation: SerializedRelation): SerializedRelation {
  // Check if either handle uses old format
  const hasOldSourceHandle =
    relation.sourceHandle != null && OLD_HANDLE_POSITIONS.includes(relation.sourceHandle as typeof OLD_HANDLE_POSITIONS[number]);
  const hasOldTargetHandle =
    relation.targetHandle != null && OLD_HANDLE_POSITIONS.includes(relation.targetHandle as typeof OLD_HANDLE_POSITIONS[number]);

  // If old format detected, remove handle fields entirely for floating edge pattern
  if (hasOldSourceHandle || hasOldTargetHandle) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sourceHandle, targetHandle, ...relationWithoutHandles } = relation;
    return relationWithoutHandles;
  }

  // Otherwise return unchanged
  return relation;
}

/**
 * Migrates an array of relations.
 *
 * @param relations - Array of relations to migrate
 * @returns Array of migrated relations
 */
export function migrateRelationHandlesArray(relations: SerializedRelation[]): SerializedRelation[] {
  return relations.map(migrateRelationHandles);
}
