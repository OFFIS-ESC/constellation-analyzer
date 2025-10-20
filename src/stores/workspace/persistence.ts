import type { ConstellationDocument } from '../persistence/types';
import type { WorkspaceState, DocumentMetadata } from './types';
import { validateDocument } from './documentUtils';
import { safeStringify, safeParse } from '../../utils/safeStringify';

/**
 * Workspace Persistence
 *
 * Handles saving/loading workspace and documents to/from localStorage
 */

// Storage keys for workspace
export const WORKSPACE_STORAGE_KEYS = {
  WORKSPACE_STATE: 'constellation:workspace:v1',
  WORKSPACE_SETTINGS: 'constellation:workspace:settings:v1',
  DOCUMENT_PREFIX: 'constellation:document:v1:',
  DOCUMENT_METADATA_PREFIX: 'constellation:meta:v1:',
} as const;

// Generate unique workspace ID
export function generateWorkspaceId(): string {
  return `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique document ID
export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Save workspace state to localStorage
export function saveWorkspaceState(state: WorkspaceState): boolean {
  try {
    localStorage.setItem(
      WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE,
      safeStringify(state)
    );
    return true;
  } catch (error) {
    console.error('Failed to save workspace state:', error);
    return false;
  }
}

// Load workspace state from localStorage
export function loadWorkspaceState(): WorkspaceState | null {
  try {
    const json = localStorage.getItem(WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE);
    if (!json) return null;

    const state = safeParse<WorkspaceState>(json);
    return state;
  } catch (error) {
    console.error('Failed to load workspace state:', error);
    return null;
  }
}

// Save document to localStorage
export function saveDocumentToStorage(
  documentId: string,
  document: ConstellationDocument
): boolean {
  try {
    const key = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX}${documentId}`;
    localStorage.setItem(key, safeStringify(document));
    return true;
  } catch (error) {
    console.error(`Failed to save document ${documentId}:`, error);
    return false;
  }
}

// Load document from localStorage
export function loadDocumentFromStorage(documentId: string): ConstellationDocument | null {
  try {
    const key = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX}${documentId}`;
    const json = localStorage.getItem(key);
    if (!json) return null;

    const doc = safeParse(json);

    // Validate document structure
    if (!validateDocument(doc)) {
      console.error(`Invalid document structure for ${documentId}`);
      return null;
    }

    return doc as ConstellationDocument;
  } catch (error) {
    console.error(`Failed to load document ${documentId}:`, error);
    return null;
  }
}

// Delete document from localStorage
export function deleteDocumentFromStorage(documentId: string): boolean {
  try {
    const docKey = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX}${documentId}`;
    const metaKey = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX}${documentId}`;

    localStorage.removeItem(docKey);
    localStorage.removeItem(metaKey);
    return true;
  } catch (error) {
    console.error(`Failed to delete document ${documentId}:`, error);
    return false;
  }
}

// Save document metadata
export function saveDocumentMetadata(
  documentId: string,
  metadata: DocumentMetadata
): boolean {
  try {
    const key = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX}${documentId}`;
    localStorage.setItem(key, safeStringify(metadata));
    return true;
  } catch (error) {
    console.error(`Failed to save metadata for ${documentId}:`, error);
    return false;
  }
}

// Load document metadata
export function loadDocumentMetadata(documentId: string): DocumentMetadata | null {
  try {
    const key = `${WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX}${documentId}`;
    const json = localStorage.getItem(key);
    if (!json) return null;

    return safeParse<DocumentMetadata>(json);
  } catch (error) {
    console.error(`Failed to load metadata for ${documentId}:`, error);
    return null;
  }
}

// Load all document metadata (for workspace initialization)
export function loadAllDocumentMetadata(): Map<string, DocumentMetadata> {
  const metadataMap = new Map<string, DocumentMetadata>();

  try {
    // Iterate through localStorage to find all metadata entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX)) {
        const documentId = key.replace(WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX, '');
        const metadata = loadDocumentMetadata(documentId);
        if (metadata) {
          metadataMap.set(documentId, metadata);
        }
      }
    }
  } catch (error) {
    console.error('Failed to load document metadata:', error);
  }

  return metadataMap;
}

// Clear all workspace data (for reset)
export function clearWorkspaceStorage(): void {
  // Remove workspace state
  localStorage.removeItem(WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE);
  localStorage.removeItem(WORKSPACE_STORAGE_KEYS.WORKSPACE_SETTINGS);

  // Remove all documents and metadata
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_PREFIX) ||
      key.startsWith(WORKSPACE_STORAGE_KEYS.DOCUMENT_METADATA_PREFIX)
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
}
