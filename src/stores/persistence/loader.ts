import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import type { ConstellationDocument, SerializedActor, SerializedRelation } from './types';
import { STORAGE_KEYS, SCHEMA_VERSION, APP_NAME } from './constants';

/**
 * Loader - Handles loading and validating data from localStorage
 */

// Validate document structure
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

// Deserialize actors (add back React Flow properties and initialize transient UI state)
function deserializeActors(serializedActors: SerializedActor[]): Actor[] {
  return serializedActors.map(node => ({
    ...node,
    // Initialize transient UI state (not persisted)
    selected: false,
    dragging: false,
  })) as Actor[];
}

// Deserialize relations (add back React Flow properties)
function deserializeRelations(serializedRelations: SerializedRelation[]): Relation[] {
  return serializedRelations.map(edge => ({
    ...edge,
  })) as Relation[];
}

// Load document from localStorage
export function loadDocument(): ConstellationDocument | null {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.GRAPH_STATE);

    if (!json) {
      console.log('No saved state found');
      return null;
    }

    const parsed = JSON.parse(json);

    if (!validateDocument(parsed)) {
      console.error('Invalid document structure');
      return null;
    }

    // Check version compatibility
    if (parsed.metadata.version !== SCHEMA_VERSION) {
      console.warn(`Version mismatch: ${parsed.metadata.version} vs ${SCHEMA_VERSION}`);
      // TODO: Implement migration in Phase 3
      // For now, we'll try to load it anyway
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load document:', error);
    return null;
  }
}

// Get the current graph from a document's timeline
export function getCurrentGraphFromDocument(document: ConstellationDocument): {
  nodes: SerializedActor[];
  edges: SerializedRelation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
} | null {
  try {
    const { timeline, nodeTypes, edgeTypes } = document;
    const currentState = timeline.states[timeline.currentStateId];

    if (!currentState || !currentState.graph) {
      console.error('Current state or graph not found in timeline');
      return null;
    }

    // Combine state graph with document types
    return {
      nodes: currentState.graph.nodes,
      edges: currentState.graph.edges,
      nodeTypes,
      edgeTypes,
    };
  } catch (error) {
    console.error('Failed to get current graph from document:', error);
    return null;
  }
}

// Deserialize graph state from a document
export function deserializeGraphState(document: ConstellationDocument): {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
} | null {
  try {
    const currentGraph = getCurrentGraphFromDocument(document);
    if (!currentGraph) {
      return null;
    }

    const nodes = deserializeActors(currentGraph.nodes);
    const edges = deserializeRelations(currentGraph.edges);

    return {
      nodes,
      edges,
      nodeTypes: currentGraph.nodeTypes,
      edgeTypes: currentGraph.edgeTypes,
    };
  } catch (error) {
    console.error('Failed to deserialize graph state:', error);
    return null;
  }
}

// Load and hydrate graph state
export function loadGraphState(): {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
} | null {
  const document = loadDocument();

  if (!document) {
    return null;
  }

  return deserializeGraphState(document);
}

// Check if saved state exists
export function hasSavedState(): boolean {
  return localStorage.getItem(STORAGE_KEYS.GRAPH_STATE) !== null;
}

// Get last saved timestamp
export function getLastSavedTimestamp(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
}
