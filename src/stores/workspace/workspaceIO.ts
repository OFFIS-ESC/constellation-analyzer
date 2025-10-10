import JSZip from 'jszip';
import type { ConstellationDocument } from '../persistence/types';
import type { WorkspaceState } from './types';

/**
 * Workspace Import/Export
 *
 * Functions for exporting and importing entire workspaces
 * - Export all documents as ZIP
 * - Export workspace state
 * - Import workspace from ZIP
 */

/**
 * Export all documents as a ZIP file
 */
export async function exportAllDocumentsAsZip(
  documents: Map<string, ConstellationDocument>,
  workspaceName: string
): Promise<void> {
  const zip = new JSZip();

  // Add each document as a JSON file
  documents.forEach((doc, docId) => {
    const filename = `${doc.metadata.title || docId}.json`;
    zip.file(filename, JSON.stringify(doc, null, 2));
  });

  // Generate ZIP and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspaceName}-documents.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export complete workspace (state + all documents) as ZIP
 */
export async function exportWorkspace(
  workspaceState: WorkspaceState,
  documents: Map<string, ConstellationDocument>,
  allDocumentIds: string[],
  loadDocument: (id: string) => Promise<ConstellationDocument | null>
): Promise<void> {
  const zip = new JSZip();

  // Add workspace state
  zip.file('workspace.json', JSON.stringify(workspaceState, null, 2));

  // Add all documents (load them if needed)
  const documentsFolder = zip.folder('documents');
  if (!documentsFolder) return;

  for (const docId of allDocumentIds) {
    let doc = documents.get(docId);

    // Load document if not in memory
    if (!doc) {
      const loadedDoc = await loadDocument(docId);
      if (loadedDoc) {
        doc = loadedDoc;
      }
    }

    if (doc) {
      const filename = `${docId}.json`;
      documentsFolder.file(filename, JSON.stringify(doc, null, 2));
    }
  }

  // Generate ZIP and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workspaceState.workspaceName}-workspace.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import workspace from ZIP file
 */
export async function importWorkspaceFromZip(
  file: File
): Promise<{
  workspaceState: WorkspaceState;
  documents: Map<string, ConstellationDocument>;
} | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Load workspace state
    const workspaceFile = zip.file('workspace.json');
    if (!workspaceFile) {
      throw new Error('Invalid workspace file: workspace.json not found');
    }

    const workspaceStateText = await workspaceFile.async('text');
    const workspaceState: WorkspaceState = JSON.parse(workspaceStateText);

    // Load all documents
    const documents = new Map<string, ConstellationDocument>();
    const documentsFolder = zip.folder('documents');

    if (documentsFolder) {
      const documentFiles = Object.keys(zip.files).filter(name =>
        name.startsWith('documents/') && name.endsWith('.json')
      );

      for (const filename of documentFiles) {
        const file = zip.file(filename);
        if (file) {
          const content = await file.async('text');
          const doc: ConstellationDocument = JSON.parse(content);
          if (doc.metadata?.documentId) {
            documents.set(doc.metadata.documentId, doc);
          }
        }
      }
    }

    return { workspaceState, documents };
  } catch (error) {
    console.error('Failed to import workspace:', error);
    return null;
  }
}

/**
 * Select and import workspace ZIP file
 */
export function selectWorkspaceZipForImport(
  onSuccess: (data: {
    workspaceState: WorkspaceState;
    documents: Map<string, ConstellationDocument>;
  }) => void,
  onError: (error: string) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.zip';

  input.onchange = async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target?.files?.[0];

    if (!file) {
      onError('No file selected');
      return;
    }

    const result = await importWorkspaceFromZip(file);

    if (result) {
      onSuccess(result);
    } else {
      onError('Failed to parse workspace ZIP file');
    }
  };

  input.click();
}
