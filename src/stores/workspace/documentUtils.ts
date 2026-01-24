import type { Actor, Relation, Group, NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../../types';
import type { ConstellationDocument, SerializedActor, SerializedRelation, SerializedGroup } from '../persistence/types';
import type { DocumentSnapshot } from '../historyStore';
import type { Timeline } from '../../types/timeline';
import { SCHEMA_VERSION, APP_NAME } from '../persistence/constants';

/**
 * Document Utilities
 *
 * Utilities for working with ConstellationDocument structures.
 * Extracted from legacy loader.ts and saver.ts files.
 */

// ============================================================================
// DOCUMENT VALIDATION
// ============================================================================

/**
 * Validate document structure
 *
 * Type guard to ensure a document has the correct structure.
 *
 * @param doc - Document to validate
 * @returns True if document is valid
 */
export function validateDocument(doc: unknown): doc is ConstellationDocument {
  // Type guard: ensure doc is an object
  if (!doc || typeof doc !== 'object') {
    return false;
  }

  const document = doc as Record<string, unknown>;

  // Check metadata
  if (!document.metadata ||
      typeof document.metadata !== 'object' ||
      document.metadata === null) {
    return false;
  }

  const metadata = document.metadata as Record<string, unknown>;

  if (typeof metadata.version !== 'string' ||
      typeof metadata.appName !== 'string' ||
      typeof metadata.createdAt !== 'string' ||
      typeof metadata.updatedAt !== 'string') {
    return false;
  }

  // Check app name
  if (metadata.appName !== APP_NAME) {
    console.warn('Document from different app:', metadata.appName);
    return false;
  }

  // Check for global node and edge types
  if (!Array.isArray(document.nodeTypes) || !Array.isArray(document.edgeTypes)) {
    return false;
  }

  // Check timeline structure
  if (!document.timeline ||
      typeof document.timeline !== 'object' ||
      document.timeline === null) {
    return false;
  }

  const timeline = document.timeline as Record<string, unknown>;

  if (!timeline.states ||
      typeof timeline.states !== 'object' ||
      typeof timeline.currentStateId !== 'string' ||
      typeof timeline.rootStateId !== 'string') {
    return false;
  }

  // Timeline validation is sufficient - we'll validate the current state's graph
  // when we actually load it
  return true;
}

// ============================================================================
// DOCUMENT EXTRACTION
// ============================================================================

/**
 * Get the current graph from a document's timeline
 *
 * Extracts the active state's graph data along with document-level types and labels.
 *
 * @param document - The constellation document
 * @returns The current graph data, or null if extraction fails
 */
export function getCurrentGraphFromDocument(document: ConstellationDocument): {
  nodes: SerializedActor[];
  edges: SerializedRelation[];
  groups: SerializedGroup[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
} | null {
  try {
    const { timeline, nodeTypes, edgeTypes, labels } = document;
    const currentState = timeline.states[timeline.currentStateId];

    if (!currentState || !currentState.graph) {
      console.error('Current state or graph not found in timeline');
      return null;
    }

    // Combine state graph with document types and labels
    return {
      nodes: currentState.graph.nodes,
      edges: currentState.graph.edges,
      groups: currentState.graph.groups || [],
      nodeTypes,
      edgeTypes,
      labels: labels || [],
    };
  } catch (error) {
    console.error('Failed to get current graph from document:', error);
    return null;
  }
}

// ============================================================================
// DESERIALIZATION (Storage → Runtime)
// ============================================================================

/**
 * Deserialize actors (add back React Flow properties and initialize transient UI state)
 */
function deserializeActors(serializedActors: SerializedActor[]): Actor[] {
  return serializedActors.map(node => ({
    ...node,
    // Initialize transient UI state (not persisted)
    selected: false,
    dragging: false,
  })) as Actor[];
}

/**
 * Deserialize relations (add back React Flow properties)
 */
function deserializeRelations(serializedRelations: SerializedRelation[]): Relation[] {
  return serializedRelations.map(edge => ({
    ...edge,
  })) as Relation[];
}

/**
 * Deserialize groups (add back React Flow properties and initialize transient UI state)
 */
function deserializeGroups(serializedGroups: SerializedGroup[]): Group[] {
  return serializedGroups.map(group => ({
    ...group,
    // Initialize transient UI state (not persisted)
    selected: false,
    dragging: false,
  })) as Group[];
}

/**
 * Deserialize graph state from a document
 *
 * Converts serialized graph data to runtime format with React Flow properties.
 *
 * @param document - The constellation document
 * @returns Deserialized graph state, or null if deserialization fails
 */
export function deserializeGraphState(document: ConstellationDocument): {
  nodes: Actor[];
  edges: Relation[];
  groups: Group[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
} | null {
  try {
    const currentGraph = getCurrentGraphFromDocument(document);
    if (!currentGraph) {
      return null;
    }

    const nodes = deserializeActors(currentGraph.nodes);
    const edges = deserializeRelations(currentGraph.edges);
    const groups = deserializeGroups(currentGraph.groups);

    return {
      nodes,
      edges,
      groups,
      nodeTypes: currentGraph.nodeTypes,
      edgeTypes: currentGraph.edgeTypes,
      labels: currentGraph.labels || [],
    };
  } catch (error) {
    console.error('Failed to deserialize graph state:', error);
    return null;
  }
}

// ============================================================================
// SERIALIZATION (Runtime → Storage)
// ============================================================================

/**
 * Serialize actors for storage (strip React Flow internals)
 */
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

/**
 * Serialize relations for storage (strip React Flow internals)
 */
export function serializeRelations(relations: Relation[]): SerializedRelation[] {
  return relations.map(relation => {
    // Omit handle fields entirely - edges use floating calculations
    // The handle IDs (like "top-source", "right-target") are only for defining
    // clickable areas and should not be persisted
    return {
      id: relation.id,
      source: relation.source,
      target: relation.target,
      type: relation.type,
      data: relation.data,
    };
  });
}

/**
 * Serialize groups for storage (strip React Flow internals)
 */
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

// ============================================================================
// DOCUMENT CREATION
// ============================================================================

/**
 * Generate unique state ID for timeline states
 */
function generateStateId(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a complete document from graph data
 *
 * Creates a document with a single initial timeline state containing the provided graph.
 *
 * @param nodes - Serialized actor nodes
 * @param edges - Serialized relation edges
 * @param nodeTypes - Node type configurations
 * @param edgeTypes - Edge type configurations
 * @param labels - Optional label configurations
 * @param existingDocument - Optional existing document (preserves creation date)
 * @returns A new ConstellationDocument
 */
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

// ============================================================================
// HISTORY SNAPSHOT CREATION
// ============================================================================

/**
 * Create a snapshot of the complete document state for history tracking
 *
 * This is the single source of truth for snapshot creation. Both useDocumentHistory
 * and timelineStore use this function to ensure consistent snapshot behavior.
 *
 * IMPORTANT: This function syncs the timeline's current state with graphStore BEFORE
 * creating the snapshot. This ensures the timeline is up-to-date with any pending
 * graph changes.
 *
 * @param documentId - ID of the document to snapshot
 * @param document - The document to snapshot (source of truth for types/labels)
 * @param timeline - The timeline to snapshot
 * @param graphStore - The graph store (for syncing current state)
 * @returns DocumentSnapshot or null if prerequisites not met
 */
export function createDocumentSnapshot(
  _documentId: string,
  document: ConstellationDocument,
  timeline: Timeline,
  graphStore: { nodes: Actor[]; edges: Relation[]; groups: Group[] }
): DocumentSnapshot | null {
  if (!timeline || !document) {
    console.warn('Cannot create snapshot: missing timeline or document');
    return null;
  }

  // CRITICAL: Sync timeline's current state with graphStore FIRST
  // This ensures the snapshot includes the latest graph changes
  const currentState = timeline.states.get(timeline.currentStateId);
  if (currentState) {
    currentState.graph = {
      nodes: graphStore.nodes as unknown as SerializedActor[],
      edges: graphStore.edges as unknown as SerializedRelation[],
      groups: graphStore.groups as unknown as SerializedGroup[],
    };
  }

  // Create snapshot with document as source of truth for types/labels
  return {
    timeline: {
      states: new Map(timeline.states), // Deep clone the Map
      currentStateId: timeline.currentStateId,
      rootStateId: timeline.rootStateId,
    },
    // ✅ Read from document (source of truth), NOT from graphStore
    nodeTypes: document.nodeTypes,
    edgeTypes: document.edgeTypes,
    labels: document.labels || [],
  };
}
