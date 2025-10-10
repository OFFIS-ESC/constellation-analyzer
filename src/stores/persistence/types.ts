import type { ActorData, RelationData, NodeTypeConfig, EdgeTypeConfig } from '../../types';

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
export interface ConstellationDocument {
  metadata: {
    version: string;           // Schema version (e.g., "1.0.0")
    appName: string;           // "constellation-analyzer"
    createdAt: string;         // ISO timestamp
    updatedAt: string;         // ISO timestamp
    lastSavedBy: string;       // Browser fingerprint or "unknown"
    documentId?: string;       // NEW: Unique document ID (for workspace)
    title?: string;            // NEW: Document title (for workspace)
  };
  graph: {
    nodes: SerializedActor[];
    edges: SerializedRelation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
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
