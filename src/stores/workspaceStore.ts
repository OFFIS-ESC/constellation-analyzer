import { create } from 'zustand';
import type { ConstellationDocument } from './persistence/types';
import type { Workspace, WorkspaceActions, DocumentMetadata, WorkspaceSettings } from './workspace/types';
import { createDocument as createDocumentHelper } from './persistence/saver';
import { selectFileForImport, exportGraphToFile } from './persistence/fileIO';
import {
  generateWorkspaceId,
  generateDocumentId,
  saveWorkspaceState,
  loadWorkspaceState,
  saveDocumentToStorage,
  loadDocumentFromStorage,
  deleteDocumentFromStorage,
  saveDocumentMetadata,
  loadDocumentMetadata,
  loadAllDocumentMetadata,
  clearWorkspaceStorage,
} from './workspace/persistence';
import { migrateToWorkspace, needsMigration } from './workspace/migration';
import {
  exportAllDocumentsAsZip,
  exportWorkspace as exportWorkspaceToZip,
  selectWorkspaceZipForImport,
} from './workspace/workspaceIO';

/**
 * Workspace Store
 *
 * Manages multiple documents, tabs, and workspace-level settings
 */

// Default workspace settings
const defaultSettings: WorkspaceSettings = {
  maxOpenDocuments: 10,
  autoSaveEnabled: true,
  defaultNodeTypes: [
    { id: 'person', label: 'Person', color: '#3b82f6', icon: 'Person', description: 'Individual person' },
    { id: 'organization', label: 'Organization', color: '#10b981', icon: 'Business', description: 'Company or group' },
    { id: 'system', label: 'System', color: '#f59e0b', icon: 'Computer', description: 'Technical system' },
    { id: 'concept', label: 'Concept', color: '#8b5cf6', icon: 'Lightbulb', description: 'Abstract concept' },
  ],
  defaultEdgeTypes: [
    { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid' },
    { id: 'reports-to', label: 'Reports To', color: '#10b981', style: 'solid' },
    { id: 'depends-on', label: 'Depends On', color: '#f59e0b', style: 'dashed' },
    { id: 'influences', label: 'Influences', color: '#8b5cf6', style: 'dotted' },
  ],
  recentFiles: [],
};

// Initialize workspace
function initializeWorkspace(): Workspace {
  // Check if migration is needed
  if (needsMigration()) {
    console.log('Migration needed, migrating legacy data...');
    const migratedState = migrateToWorkspace();
    if (migratedState) {
      // Load migrated document
      const docId = migratedState.activeDocumentId!;
      const doc = loadDocumentFromStorage(docId);
      const meta = loadDocumentMetadata(docId);

      return {
        ...migratedState,
        documents: doc ? new Map([[docId, doc]]) : new Map(),
        documentMetadata: meta ? new Map([[docId, meta]]) : new Map(),
      };
    }
  }

  // Try to load existing workspace
  const savedState = loadWorkspaceState();
  if (savedState) {
    // Load all document metadata
    const metadata = loadAllDocumentMetadata();

    // Load active document if exists
    const documents = new Map<string, ConstellationDocument>();
    if (savedState.activeDocumentId) {
      const doc = loadDocumentFromStorage(savedState.activeDocumentId);
      if (doc) {
        documents.set(savedState.activeDocumentId, doc);
      }
    }

    return {
      ...savedState,
      documents,
      documentMetadata: metadata,
    };
  }

  // Create new workspace with no documents (start with empty state)
  const workspaceId = generateWorkspaceId();

  // Save initial state
  const initialState = {
    workspaceId,
    workspaceName: 'My Workspace',
    documentOrder: [],
    activeDocumentId: null,
    settings: defaultSettings,
  };

  saveWorkspaceState(initialState);

  return {
    ...initialState,
    documents: new Map(),
    documentMetadata: new Map(),
  };
}

export const useWorkspaceStore = create<Workspace & WorkspaceActions>((set, get) => ({
  ...initializeWorkspace(),

  // Create new document
  createDocument: (title = 'Untitled Analysis') => {
    const state = get();
    const documentId = generateDocumentId();
    const now = new Date().toISOString();

    // Create copies of the default types using spread to avoid any circular references from store
    const nodeTypes = state.settings.defaultNodeTypes.map(nt => ({ ...nt }));
    const edgeTypes = state.settings.defaultEdgeTypes.map(et => ({ ...et }));

    const newDoc = createDocumentHelper(
      [],
      [],
      nodeTypes,
      edgeTypes
    );
    newDoc.metadata.documentId = documentId;
    newDoc.metadata.title = title;

    const metadata: DocumentMetadata = {
      id: documentId,
      title,
      isDirty: false,
      lastModified: now,
    };

    // Save document
    saveDocumentToStorage(documentId, newDoc);
    saveDocumentMetadata(documentId, metadata);

    // Update workspace
    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.set(documentId, newDoc);

      const newMetadata = new Map(state.documentMetadata);
      newMetadata.set(documentId, metadata);

      const newOrder = [...state.documentOrder, documentId];

      const newState = {
        documents: newDocuments,
        documentMetadata: newMetadata,
        documentOrder: newOrder,
        activeDocumentId: documentId,
      };

      // Save workspace state
      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: documentId,
        settings: state.settings,
      });

      return newState;
    });

    return documentId;
  },

  // Create new document from existing document's types (template)
  createDocumentFromTemplate: (sourceDocumentId: string, title = 'Untitled Analysis') => {
    const state = get();
    const sourceDoc = state.documents.get(sourceDocumentId);

    if (!sourceDoc) {
      console.error(`Source document ${sourceDocumentId} not found`);
      return '';
    }

    const documentId = generateDocumentId();
    const now = new Date().toISOString();

    // Create new document with the same node and edge types, but no actors/relations
    const newDoc = createDocumentHelper(
      [],
      [],
      sourceDoc.graph.nodeTypes,
      sourceDoc.graph.edgeTypes
    );
    newDoc.metadata.documentId = documentId;
    newDoc.metadata.title = title;

    const metadata: DocumentMetadata = {
      id: documentId,
      title,
      isDirty: false,
      lastModified: now,
    };

    // Save document
    saveDocumentToStorage(documentId, newDoc);
    saveDocumentMetadata(documentId, metadata);

    // Update workspace
    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.set(documentId, newDoc);

      const newMetadata = new Map(state.documentMetadata);
      newMetadata.set(documentId, metadata);

      const newOrder = [...state.documentOrder, documentId];

      const newState = {
        documents: newDocuments,
        documentMetadata: newMetadata,
        documentOrder: newOrder,
        activeDocumentId: documentId,
      };

      // Save workspace state
      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: documentId,
        settings: state.settings,
      });

      return newState;
    });

    return documentId;
  },

  // Load document from storage (if not already loaded)
  loadDocument: async (documentId: string) => {
    const state = get();

    // Check if already loaded
    if (state.documents.has(documentId)) {
      return;
    }

    // Load from storage
    const doc = loadDocumentFromStorage(documentId);
    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.set(documentId, doc);

      return { documents: newDocuments };
    });
  },

  // Unload document from memory (but keep in storage and tab list)
  unloadDocument: (documentId: string) => {
    const state = get();

    // Don't unload if it's the active document
    if (documentId === state.activeDocumentId) {
      console.warn('Cannot unload active document');
      return;
    }

    // Don't unload if document has unsaved changes
    const metadata = state.documentMetadata.get(documentId);
    if (metadata?.isDirty) {
      console.warn(`Cannot unload document with unsaved changes: ${documentId}`);
      return;
    }

    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.delete(documentId);

      return { documents: newDocuments };
    });
  },

  // Close document (unload from memory, but keep in storage)
  closeDocument: (documentId: string) => {
    const state = get();

    // Check for unsaved changes
    const metadata = state.documentMetadata.get(documentId);
    if (metadata?.isDirty) {
      const confirmed = window.confirm(
        `"${metadata.title}" has unsaved changes. Close anyway?`
      );
      if (!confirmed) return false;
    }

    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.delete(documentId);

      const newOrder = state.documentOrder.filter(id => id !== documentId);
      const newActiveId = state.activeDocumentId === documentId
        ? (newOrder[0] || null)
        : state.activeDocumentId;

      // Save workspace state
      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: newActiveId,
        settings: state.settings,
      });

      return {
        documents: newDocuments,
        documentOrder: newOrder,
        activeDocumentId: newActiveId,
      };
    });

    return true;
  },

  // Delete document (remove from storage)
  deleteDocument: (documentId: string) => {
    const state = get();

    const metadata = state.documentMetadata.get(documentId);
    const confirmed = window.confirm(
      `Are you sure you want to delete "${metadata?.title}"? This cannot be undone.`
    );
    if (!confirmed) return false;

    // Delete from storage
    deleteDocumentFromStorage(documentId);

    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.delete(documentId);

      const newMetadata = new Map(state.documentMetadata);
      newMetadata.delete(documentId);

      const newOrder = state.documentOrder.filter(id => id !== documentId);
      const newActiveId = state.activeDocumentId === documentId
        ? (newOrder[0] || null)
        : state.activeDocumentId;

      // Save workspace state
      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: newActiveId,
        settings: state.settings,
      });

      return {
        documents: newDocuments,
        documentMetadata: newMetadata,
        documentOrder: newOrder,
        activeDocumentId: newActiveId,
      };
    });

    return true;
  },

  // Rename document
  renameDocument: (documentId: string, newTitle: string) => {
    set((state) => {
      const doc = state.documents.get(documentId);
      if (doc) {
        doc.metadata.title = newTitle;
        saveDocumentToStorage(documentId, doc);
      }

      const metadata = state.documentMetadata.get(documentId);
      if (metadata) {
        metadata.title = newTitle;
        metadata.lastModified = new Date().toISOString();
        saveDocumentMetadata(documentId, metadata);

        const newMetadata = new Map(state.documentMetadata);
        newMetadata.set(documentId, metadata);

        return { documentMetadata: newMetadata };
      }

      return {};
    });
  },

  // Duplicate document
  duplicateDocument: (documentId: string) => {
    const state = get();
    const sourceDoc = state.documents.get(documentId);
    if (!sourceDoc) {
      console.error(`Document ${documentId} not found`);
      return '';
    }

    const newDocumentId = generateDocumentId();
    const sourceMeta = state.documentMetadata.get(documentId);
    const newTitle = `${sourceMeta?.title || 'Untitled'} (Copy)`;

    const duplicatedDoc: ConstellationDocument = {
      ...sourceDoc,
      metadata: {
        ...sourceDoc.metadata,
        documentId: newDocumentId,
        title: newTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    const metadata: DocumentMetadata = {
      id: newDocumentId,
      title: newTitle,
      isDirty: false,
      lastModified: new Date().toISOString(),
    };

    // Save
    saveDocumentToStorage(newDocumentId, duplicatedDoc);
    saveDocumentMetadata(newDocumentId, metadata);

    // Update workspace
    set((state) => {
      const newDocuments = new Map(state.documents);
      newDocuments.set(newDocumentId, duplicatedDoc);

      const newMetadata = new Map(state.documentMetadata);
      newMetadata.set(newDocumentId, metadata);

      const newOrder = [...state.documentOrder, newDocumentId];

      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: state.activeDocumentId,
        settings: state.settings,
      });

      return {
        documents: newDocuments,
        documentMetadata: newMetadata,
        documentOrder: newOrder,
      };
    });

    return newDocumentId;
  },

  // Switch active document (opens it as a tab if not already open)
  switchToDocument: (documentId: string) => {
    get().loadDocument(documentId).then(() => {
      set((state) => {
        // Add to documentOrder if not already there (reopen closed document)
        const newOrder = state.documentOrder.includes(documentId)
          ? state.documentOrder
          : [...state.documentOrder, documentId];

        saveWorkspaceState({
          workspaceId: state.workspaceId,
          workspaceName: state.workspaceName,
          documentOrder: newOrder,
          activeDocumentId: documentId,
          settings: state.settings,
        });

        return {
          documentOrder: newOrder,
          activeDocumentId: documentId,
        };
      });
    });
  },

  // Reorder documents
  reorderDocuments: (newOrder: string[]) => {
    set((state) => {
      saveWorkspaceState({
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: newOrder,
        activeDocumentId: state.activeDocumentId,
        settings: state.settings,
      });

      return { documentOrder: newOrder };
    });
  },

  // Import document from file
  importDocumentFromFile: async () => {
    return new Promise((resolve) => {
      selectFileForImport(
        (data) => {
          const documentId = generateDocumentId();
          const now = new Date().toISOString();

          const importedDoc = createDocumentHelper(
            data.nodes,
            data.edges,
            data.nodeTypes,
            data.edgeTypes
          );
          importedDoc.metadata.documentId = documentId;
          importedDoc.metadata.title = 'Imported Analysis';

          const metadata: DocumentMetadata = {
            id: documentId,
            title: 'Imported Analysis',
            isDirty: false,
            lastModified: now,
          };

          saveDocumentToStorage(documentId, importedDoc);
          saveDocumentMetadata(documentId, metadata);

          set((state) => {
            const newDocuments = new Map(state.documents);
            newDocuments.set(documentId, importedDoc);

            const newMetadata = new Map(state.documentMetadata);
            newMetadata.set(documentId, metadata);

            const newOrder = [...state.documentOrder, documentId];

            saveWorkspaceState({
              workspaceId: state.workspaceId,
              workspaceName: state.workspaceName,
              documentOrder: newOrder,
              activeDocumentId: documentId,
              settings: state.settings,
            });

            return {
              documents: newDocuments,
              documentMetadata: newMetadata,
              documentOrder: newOrder,
              activeDocumentId: documentId,
            };
          });

          resolve(documentId);
        },
        (error) => {
          alert(`Failed to import file: ${error}`);
          resolve(null);
        }
      );
    });
  },

  // Export document to file
  exportDocument: (documentId: string) => {
    const doc = get().documents.get(documentId);
    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    exportGraphToFile(
      doc.graph.nodes,
      doc.graph.edges,
      doc.graph.nodeTypes,
      doc.graph.edgeTypes
    );
  },

  // Save workspace
  saveWorkspace: () => {
    const state = get();
    saveWorkspaceState({
      workspaceId: state.workspaceId,
      workspaceName: state.workspaceName,
      documentOrder: state.documentOrder,
      activeDocumentId: state.activeDocumentId,
      settings: state.settings,
    });
  },

  // Load workspace
  loadWorkspace: () => {
    const loadedState = loadWorkspaceState();
    if (loadedState) {
      const metadata = loadAllDocumentMetadata();
      set({
        ...loadedState,
        documentMetadata: metadata,
        documents: new Map(), // Documents loaded on demand
      });
    }
  },

  // Clear workspace
  clearWorkspace: () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear the entire workspace? This will delete all documents and cannot be undone.'
    );
    if (!confirmed) return;

    clearWorkspaceStorage();

    // Re-initialize with fresh workspace
    const newState = initializeWorkspace();
    set(newState);
  },

  // Get active document
  getActiveDocument: () => {
    const state = get();
    if (!state.activeDocumentId) return null;
    return state.documents.get(state.activeDocumentId) || null;
  },

  // Mark document as dirty
  markDocumentDirty: (documentId: string) => {
    set((state) => {
      const metadata = state.documentMetadata.get(documentId);
      if (metadata && !metadata.isDirty) {
        metadata.isDirty = true;
        const newMetadata = new Map(state.documentMetadata);
        newMetadata.set(documentId, metadata);
        saveDocumentMetadata(documentId, metadata);
        return { documentMetadata: newMetadata };
      }
      return {};
    });
  },

  // Save document
  saveDocument: (documentId: string) => {
    const state = get();
    const doc = state.documents.get(documentId);
    if (doc) {
      doc.metadata.updatedAt = new Date().toISOString();
      saveDocumentToStorage(documentId, doc);

      const metadata = state.documentMetadata.get(documentId);
      if (metadata) {
        metadata.isDirty = false;
        metadata.lastModified = doc.metadata.updatedAt;
        saveDocumentMetadata(documentId, metadata);

        set((state) => {
          const newMetadata = new Map(state.documentMetadata);
          newMetadata.set(documentId, metadata);
          return { documentMetadata: newMetadata };
        });
      }
    }
  },

  // Export all documents as ZIP
  exportAllDocumentsAsZip: async () => {
    const state = get();

    // Ensure all documents are loaded
    const allDocs = new Map<string, ConstellationDocument>();
    for (const docId of state.documentOrder) {
      let doc = state.documents.get(docId);
      if (!doc) {
        const loadedDoc = loadDocumentFromStorage(docId);
        if (loadedDoc) {
          doc = loadedDoc;
        }
      }
      if (doc) {
        allDocs.set(docId, doc);
      }
    }

    await exportAllDocumentsAsZip(allDocs, state.workspaceName);
  },

  // Export workspace
  exportWorkspace: async () => {
    const state = get();

    const loadDoc = async (id: string): Promise<ConstellationDocument | null> => {
      return loadDocumentFromStorage(id);
    };

    await exportWorkspaceToZip(
      {
        workspaceId: state.workspaceId,
        workspaceName: state.workspaceName,
        documentOrder: state.documentOrder,
        activeDocumentId: state.activeDocumentId,
        settings: state.settings,
      },
      state.documents,
      state.documentOrder,
      loadDoc
    );
  },

  // Import workspace
  importWorkspace: async () => {
    return new Promise((resolve) => {
      selectWorkspaceZipForImport(
        (data) => {
          const { workspaceState, documents } = data;

          // Save workspace state
          saveWorkspaceState(workspaceState);

          // Save all documents
          documents.forEach((doc, docId) => {
            saveDocumentToStorage(docId, doc);

            const metadata = {
              id: docId,
              title: doc.metadata.title || 'Untitled',
              isDirty: false,
              lastModified: doc.metadata.updatedAt || new Date().toISOString(),
            };
            saveDocumentMetadata(docId, metadata);
          });

          // Load metadata for all documents
          const allMetadata = loadAllDocumentMetadata();

          // Load active document
          const activeDoc = workspaceState.activeDocumentId
            ? documents.get(workspaceState.activeDocumentId)
            : null;

          set({
            ...workspaceState,
            documents: activeDoc && workspaceState.activeDocumentId
              ? new Map([[workspaceState.activeDocumentId, activeDoc]])
              : new Map(),
            documentMetadata: allMetadata,
          });

          alert('Workspace imported successfully!');
          resolve();
        },
        (error) => {
          alert(`Failed to import workspace: ${error}`);
          resolve();
        }
      );
    });
  },

  // Save viewport state for a document
  saveViewport: (documentId: string, viewport: { x: number; y: number; zoom: number }) => {
    set((state) => {
      const metadata = state.documentMetadata.get(documentId);
      if (metadata) {
        metadata.viewport = viewport;
        const newMetadata = new Map(state.documentMetadata);
        newMetadata.set(documentId, metadata);
        saveDocumentMetadata(documentId, metadata);
        return { documentMetadata: newMetadata };
      }
      return {};
    });
  },

  // Get viewport state for a document
  getViewport: (documentId: string) => {
    const state = get();
    const metadata = state.documentMetadata.get(documentId);
    return metadata?.viewport;
  },
}));
