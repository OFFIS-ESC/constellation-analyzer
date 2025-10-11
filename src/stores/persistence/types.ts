import type { ActorData, RelationData, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import type { ConstellationState } from '../../types/timeline';

/**
 * Persistence Types
 *
 * Type definitions for serializing and deserializing constellation data
 */

// Simplified node structure for storage (without React Flow internals)
export interface SerializedActor {
  id: string;
  type: string;  // React Flow node type (e.g., "custom")
  position: { x: number; y: number };
  data: ActorData;
}

// Simplified edge structure for storage (without React Flow internals)
export interface SerializedRelation {
  id: string;
  source: string;
  target: string;
  type?: string;  // React Flow edge type
  data?: RelationData;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

// Complete document structure for storage
// Every document has a timeline with states. The current graph is always
// derived from the current state in the timeline.
export interface ConstellationDocument {
  metadata: {
    version: string;           // Schema version (e.g., "1.0.0")
    appName: string;           // "constellation-analyzer"
    createdAt: string;         // ISO timestamp
    updatedAt: string;         // ISO timestamp
    lastSavedBy: string;       // Browser fingerprint or "unknown"
    documentId?: string;       // Unique document ID (for workspace)
    title?: string;            // Document title (for workspace)
  };
  // Global node and edge types for the entire document
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  // Timeline with multiple states - every document has this
  // The graph is stored within each state (nodes and edges only, not types)
  timeline: {
    states: Record<string, ConstellationState>;  // Map serialized as object
    currentStateId: string;
    rootStateId: string;
  };
}

// Error types for persistence operations
export enum PersistenceError {
  QUOTA_EXCEEDED = 'quota_exceeded',
  CORRUPTED_DATA = 'corrupted_data',
  VERSION_MISMATCH = 'version_mismatch',
  PARSE_ERROR = 'parse_error',
  STORAGE_UNAVAILABLE = 'storage_unavailable',
}
