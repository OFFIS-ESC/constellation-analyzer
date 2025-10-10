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

  // Check graph structure
  if (!document.graph ||
      typeof document.graph !== 'object' ||
      document.graph === null) {
    return false;
  }

  const graph = document.graph as Record<string, unknown>;

  if (!Array.isArray(graph.nodes) ||
      !Array.isArray(graph.edges) ||
      !Array.isArray(graph.nodeTypes) ||
      !Array.isArray(graph.edgeTypes)) {
    return false;
  }

  // Validate nodes
  for (const node of graph.nodes) {
    if (!node || typeof node !== 'object') {
      return false;
    }
    const n = node as Record<string, unknown>;
    if (!n.id || !n.type || !n.position || !n.data) {
      return false;
    }
    const pos = n.position as Record<string, unknown>;
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      return false;
    }
  }

  // Validate edges
  for (const edge of graph.edges) {
    if (!edge || typeof edge !== 'object') {
      return false;
    }
    const e = edge as Record<string, unknown>;
    if (!e.id || !e.source || !e.target) {
      return false;
    }
  }

  // Validate node types
  for (const nodeType of graph.nodeTypes) {
    if (!nodeType || typeof nodeType !== 'object') {
      return false;
    }
    const nt = nodeType as Record<string, unknown>;
    if (!nt.id || !nt.label || !nt.color) {
      return false;
    }
  }

  // Validate edge types
  for (const edgeType of graph.edgeTypes) {
    if (!edgeType || typeof edgeType !== 'object') {
      return false;
    }
    const et = edgeType as Record<string, unknown>;
    if (!et.id || !et.label || !et.color) {
      return false;
    }
  }

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

// Deserialize graph state from a document
export function deserializeGraphState(document: ConstellationDocument): {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
} | null {
  try {
    const nodes = deserializeActors(document.graph.nodes);
    const edges = deserializeRelations(document.graph.edges);

    return {
      nodes,
      edges,
      nodeTypes: document.graph.nodeTypes,
      edgeTypes: document.graph.edgeTypes,
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
