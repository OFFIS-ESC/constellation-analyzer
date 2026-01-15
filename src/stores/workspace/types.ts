import type { ConstellationDocument } from '../persistence/types';
import type { NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../../types';

/**
 * Workspace Types
 *
 * Type definitions for multi-document workspace management
 */

// Document metadata (lightweight, for quick loading)
export interface DocumentMetadata {
  id: string;
  title: string;
  isDirty: boolean;
  lastModified: string;  // ISO timestamp
  fileName?: string;     // If loaded from file
  color?: string;        // Tab color identifier
  viewport?: {           // React Flow viewport state
    x: number;
    y: number;
    zoom: number;
  };
  preferPresentationMode?: boolean;  // Whether document should open in presentation mode
}

// Recent file entry
export interface RecentFile {
  path: string;
  title: string;
  lastOpened: string;
  thumbnail?: string;
}

// Workspace settings
export interface WorkspaceSettings {
  maxOpenDocuments: number;
  autoSaveEnabled: boolean;
  defaultNodeTypes: NodeTypeConfig[];
  defaultEdgeTypes: EdgeTypeConfig[];
  recentFiles: RecentFile[];
}

// Workspace state (what gets saved to localStorage)
export interface WorkspaceState {
  workspaceId: string;
  workspaceName: string;
  documentOrder: string[];          // Order of tabs
  activeDocumentId: string | null;  // Currently visible document
  settings: WorkspaceSettings;
}

// Full workspace (in-memory state)
export interface Workspace extends WorkspaceState {
  documents: Map<string, ConstellationDocument>;     // Loaded documents
  documentMetadata: Map<string, DocumentMetadata>;   // All document metadata
}

// Workspace actions
export interface WorkspaceActions {
  // Document management
  createDocument: (title?: string) => string;
  createDocumentFromTemplate: (sourceDocumentId: string, title?: string) => string;
  loadDocument: (documentId: string) => Promise<void>;
  unloadDocument: (documentId: string) => void;
  closeDocument: (documentId: string) => boolean;
  deleteDocument: (documentId: string) => boolean;
  renameDocument: (documentId: string, newTitle: string) => void;
  duplicateDocument: (documentId: string) => string;

  // Navigation
  switchToDocument: (documentId: string) => void;
  reorderDocuments: (newOrder: string[]) => void;

  // File operations
  importDocumentFromFile: () => Promise<string | null>;
  exportDocument: (documentId: string) => void;
  exportAllDocumentsAsZip: () => Promise<void>;

  // Workspace operations
  saveWorkspace: () => void;
  loadWorkspace: () => void;
  clearWorkspace: () => void;
  exportWorkspace: () => Promise<void>;
  importWorkspace: () => Promise<void>;

  // Graph operations (delegates to active document's graph store)
  getActiveDocument: () => ConstellationDocument | null;
  markDocumentDirty: (documentId: string) => void;
  saveDocument: (documentId: string) => void;

  // Type management (document-level)
  addNodeTypeToDocument: (documentId: string, nodeType: NodeTypeConfig) => void;
  updateNodeTypeInDocument: (documentId: string, typeId: string, updates: Partial<Omit<NodeTypeConfig, 'id'>>) => void;
  deleteNodeTypeFromDocument: (documentId: string, typeId: string) => void;
  addEdgeTypeToDocument: (documentId: string, edgeType: EdgeTypeConfig) => void;
  updateEdgeTypeInDocument: (documentId: string, typeId: string, updates: Partial<Omit<EdgeTypeConfig, 'id'>>) => void;
  deleteEdgeTypeFromDocument: (documentId: string, typeId: string) => void;

  // Label management (document-level)
  addLabelToDocument: (documentId: string, label: LabelConfig) => void;
  updateLabelInDocument: (documentId: string, labelId: string, updates: Partial<Omit<LabelConfig, 'id'>>) => void;
  deleteLabelFromDocument: (documentId: string, labelId: string) => void;

  // Viewport operations
  saveViewport: (documentId: string, viewport: { x: number; y: number; zoom: number }) => void;
  getViewport: (documentId: string) => { x: number; y: number; zoom: number } | undefined;

  // Presentation mode operations
  setDocumentPresentationPreference: (documentId: string, enabled: boolean) => void;

  // Transaction helper (internal utility for atomic operations)
  executeTypeTransaction: <T>(
    operation: () => T,
    rollback: () => void,
    operationName: string
  ) => T | null;
}
