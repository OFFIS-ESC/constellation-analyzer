import type { ConstellationDocument } from '../persistence/types';
import type { WorkspaceState, WorkspaceSettings, DocumentMetadata } from './types';
import { loadDocument } from '../persistence/loader';
import {
  WORKSPACE_STORAGE_KEYS,
  generateWorkspaceId,
  generateDocumentId,
  saveWorkspaceState,
  saveDocumentToStorage,
  saveDocumentMetadata,
} from './persistence';

/**
 * Migration from Single-Document to Multi-Document Workspace
 *
 * Converts legacy single-document format to new workspace format
 */

export function migrateToWorkspace(): WorkspaceState | null {
  console.log('Checking for legacy data to migrate...');

  // Check for legacy data
  const legacyDoc = loadDocument();
  if (!legacyDoc) {
    console.log('No legacy data found');
    return null;
  }

  console.log('Legacy data found, migrating to workspace format...');

  try {
    // Generate IDs
    const workspaceId = generateWorkspaceId();
    const documentId = generateDocumentId();

    // Create document with new metadata
    const migratedDoc: ConstellationDocument = {
      ...legacyDoc,
      metadata: {
        ...legacyDoc.metadata,
        documentId,
        title: 'Imported Analysis',
      },
    };

    // Create document metadata
    const metadata: DocumentMetadata = {
      id: documentId,
      title: 'Imported Analysis',
      isDirty: false,
      lastModified: new Date().toISOString(),
    };

    // Create workspace settings from legacy document
    // Node and edge types are now global per document
    const settings: WorkspaceSettings = {
      maxOpenDocuments: 10,
      autoSaveEnabled: true,
      defaultNodeTypes: legacyDoc.nodeTypes || [],
      defaultEdgeTypes: legacyDoc.edgeTypes || [],
      recentFiles: [],
    };

    // Create workspace state
    const workspace: WorkspaceState = {
      workspaceId,
      workspaceName: 'My Workspace',
      documentOrder: [documentId],
      activeDocumentId: documentId,
      settings,
    };

    // Save to new format
    saveWorkspaceState(workspace);
    saveDocumentToStorage(documentId, migratedDoc);
    saveDocumentMetadata(documentId, metadata);

    // Remove legacy data
    localStorage.removeItem(WORKSPACE_STORAGE_KEYS.LEGACY_GRAPH_STATE);
    localStorage.removeItem('constellation:lastSaved'); // Old timestamp key

    console.log('Migration completed successfully');
    return workspace;
  } catch (error) {
    console.error('Migration failed:', error);
    return null;
  }
}

// Check if migration is needed
export function needsMigration(): boolean {
  const hasWorkspace = localStorage.getItem(WORKSPACE_STORAGE_KEYS.WORKSPACE_STATE) !== null;
  const hasLegacyData = localStorage.getItem(WORKSPACE_STORAGE_KEYS.LEGACY_GRAPH_STATE) !== null;

  return !hasWorkspace && hasLegacyData;
}
