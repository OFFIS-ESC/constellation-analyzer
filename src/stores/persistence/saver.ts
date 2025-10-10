import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import type { ConstellationDocument, SerializedActor, SerializedRelation } from './types';
import { STORAGE_KEYS, SCHEMA_VERSION, APP_NAME } from './constants';

/**
 * Saver - Handles serialization and saving to localStorage
 */

// Serialize a single actor (node) for storage
// Excludes transient UI state like selected and dragging
function serializeActor(actor: Actor): SerializedActor {
  return {
    id: actor.id,
    type: actor.type ?? 'default',
    position: actor.position,
    data: actor.data,
  };
}

// Serialize a single relation (edge) for storage
function serializeRelation(relation: Relation): SerializedRelation {
  return {
    id: relation.id,
    source: relation.source,
    target: relation.target,
    type: relation.type,
    data: relation.data,
    sourceHandle: relation.sourceHandle,
    targetHandle: relation.targetHandle,
  };
}

// Create a complete document from current state
export function createDocument(
  nodes: Actor[],
  edges: Relation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[],
  existingDocument?: ConstellationDocument
): ConstellationDocument {
  const now = new Date().toISOString();

  return {
    metadata: {
      version: SCHEMA_VERSION,
      appName: APP_NAME,
      createdAt: existingDocument?.metadata.createdAt || now,
      updatedAt: now,
      lastSavedBy: 'browser',
    },
    graph: {
      nodes: nodes.map(serializeActor),
      edges: edges.map(serializeRelation),
      nodeTypes,
      edgeTypes,
    },
  };
}

// Save document to localStorage
export function saveDocument(document: ConstellationDocument): boolean {
  try {
    const json = JSON.stringify(document);
    localStorage.setItem(STORAGE_KEYS.GRAPH_STATE, json);
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED, document.metadata.updatedAt);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      // TODO: Handle quota exceeded error in Phase 2
    } else {
      console.error('Failed to save document:', error);
    }
    return false;
  }
}

// Save current graph state
export function saveGraphState(
  nodes: Actor[],
  edges: Relation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[]
): boolean {
  try {
    // Try to load existing document to preserve createdAt timestamp
    const existingJson = localStorage.getItem(STORAGE_KEYS.GRAPH_STATE);
    let existingDocument: ConstellationDocument | undefined;

    if (existingJson) {
      try {
        existingDocument = JSON.parse(existingJson);
      } catch {
        // Ignore parse errors, we'll create a new document
      }
    }

    const document = createDocument(nodes, edges, nodeTypes, edgeTypes, existingDocument);
    return saveDocument(document);
  } catch (error) {
    console.error('Failed to save graph state:', error);
    return false;
  }
}

// Create a debounced save function
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSaveTime = 0;

export function debouncedSave(
  nodes: Actor[],
  edges: Relation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[],
  delay: number = 1000,
  maxWait: number = 5000
): void {
  const now = Date.now();

  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Force save if max wait time exceeded
  if (now - lastSaveTime >= maxWait) {
    saveGraphState(nodes, edges, nodeTypes, edgeTypes);
    lastSaveTime = now;
    return;
  }

  // Schedule debounced save
  saveTimeout = setTimeout(() => {
    saveGraphState(nodes, edges, nodeTypes, edgeTypes);
    lastSaveTime = now;
    saveTimeout = null;
  }, delay);
}

// Clear saved state
export function clearSavedState(): void {
  localStorage.removeItem(STORAGE_KEYS.GRAPH_STATE);
  localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
}
