import type { ConstellationDocument, SerializedActor, SerializedRelation, SerializedGroup } from './types';
import type { Actor, Relation, Group, NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../../types';
import { STORAGE_KEYS, SCHEMA_VERSION, APP_NAME } from './constants';
import { safeStringify } from '../../utils/safeStringify';

/**
 * Saver - Handles serialization and saving to localStorage
 */

// Serialize actors for storage (strip React Flow internals)
export function serializeActors(actors: Actor[]): SerializedActor[] {
  return actors.map(actor => {
    const actorWithParent = actor as Actor & { parentId?: string; extent?: 'parent' };
    return {
      id: actor.id,
      type: actor.type || 'custom', // Default to 'custom' if undefined
      position: actor.position,
      data: actor.data,
      ...(actorWithParent.parentId && { parentNode: actorWithParent.parentId }),
      ...(actorWithParent.extent && { extent: actorWithParent.extent }),
    };
  });
}

// Serialize relations for storage (strip React Flow internals)
export function serializeRelations(relations: Relation[]): SerializedRelation[] {
  return relations.map(relation => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    type: relation.type,
    data: relation.data,
    sourceHandle: relation.sourceHandle,
    targetHandle: relation.targetHandle,
  }));
}

// Serialize groups for storage (strip React Flow internals)
export function serializeGroups(groups: Group[]): SerializedGroup[] {
  return groups.map(group => ({
    id: group.id,
    type: 'group' as const,
    position: group.position,
    data: group.data,
    width: group.width ?? undefined,
    height: group.height ?? undefined,
  }));
}

// Generate unique state ID
function generateStateId(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a complete document from graph data
// Creates a document with a single initial timeline state containing the provided graph
export function createDocument(
  nodes: SerializedActor[],
  edges: SerializedRelation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[],
  labels?: LabelConfig[],
  existingDocument?: ConstellationDocument
): ConstellationDocument {
  const now = new Date().toISOString();
  const rootStateId = generateStateId();

  // Create the initial timeline state with the provided graph (nodes and edges only)
  const initialState = {
    id: rootStateId,
    label: 'Initial State',
    parentStateId: undefined,
    graph: {
      nodes,
      edges,
    },
    createdAt: now,
    updatedAt: now,
  };

  // Create document with global types, labels, and timeline containing the initial state
  return {
    metadata: {
      version: SCHEMA_VERSION,
      appName: APP_NAME,
      createdAt: existingDocument?.metadata?.createdAt || now,
      updatedAt: now,
      lastSavedBy: 'browser',
    },
    nodeTypes,
    edgeTypes,
    labels: labels || [],
    timeline: {
      states: {
        [rootStateId]: initialState,
      },
      currentStateId: rootStateId,
      rootStateId: rootStateId,
    },
  };
}

// Save document to localStorage (legacy function for old single-document system)
// NOTE: This is only used for migration purposes. Workspace documents are saved
// via workspace/persistence.ts
export function saveDocument(document: ConstellationDocument): boolean {
  try {
    const json = safeStringify(document);
    localStorage.setItem(STORAGE_KEYS.GRAPH_STATE, json);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, document.metadata.updatedAt);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
    } else {
      console.error('Failed to save document:', error);
    }
    return false;
  }
}

// NOTE: clearSavedState() has been removed
// It was part of the legacy single-document system and is no longer needed
// Workspace clearing is now handled by clearWorkspaceStorage() in workspace/persistence.ts
