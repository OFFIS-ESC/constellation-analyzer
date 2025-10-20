import { create } from 'zustand';
import type { ConstellationDocument } from './persistence/types';
import type { Workspace, WorkspaceActions, DocumentMetadata, WorkspaceSettings } from './workspace/types';
import type { Actor, Relation } from '../types';
import { createDocument as createDocumentHelper } from './workspace/documentUtils';
import { selectFileForImport, exportDocumentToFile } from './persistence/fileIO';
import {
  generateWorkspaceId,
  generateDocumentId,
  saveWorkspaceState,
  loadWorkspaceState,
  saveDocumentToStorage,
  loadDocumentFromStorage,
  deleteDocumentFromStorage,
  saveDocumentMetadata,
  loadAllDocumentMetadata,
  clearWorkspaceStorage,
} from './workspace/persistence';
import {
  exportAllDocumentsAsZip,
  exportWorkspace as exportWorkspaceToZip,
  selectWorkspaceZipForImport,
} from './workspace/workspaceIO';
import { useToastStore } from './toastStore';
import { useTimelineStore } from './timelineStore';
import { useGraphStore } from './graphStore';
import { useBibliographyStore } from './bibliographyStore';
import type { ConstellationState, Timeline } from '../types/timeline';
import { getCurrentGraphFromDocument } from './workspace/documentUtils';
// @ts-expect-error - citation.js doesn't have TypeScript definitions
import { Cite } from '@citation-js/core';
import type { CSLReference } from '../types/bibliography';
import { needsStorageCleanup, cleanupAllStorage } from '../utils/cleanupStorage';

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
    { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'Individual person' },
    { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'Company or group' },
    { id: 'system', label: 'System', color: '#f59e0b', shape: 'roundedRectangle', icon: 'Computer', description: 'Technical system' },
    { id: 'concept', label: 'Concept', color: '#8b5cf6', shape: 'roundedRectangle', icon: 'Lightbulb', description: 'Abstract concept' },
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
  // Check if storage cleanup is needed (remove __proto__ attributes)
  if (needsStorageCleanup()) {
    console.log('[Security] Cleaning up localStorage to remove __proto__ attributes...');
    const { cleaned, errors } = cleanupAllStorage();
    if (cleaned > 0) {
      console.log(`[Security] ✓ Cleaned ${cleaned} items in localStorage`);
    }
    if (errors > 0) {
      console.error(`[Security] ✗ ${errors} errors during cleanup`);
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

        // Load timeline if it exists
        if (doc.timeline) {
          useTimelineStore.getState().loadTimeline(savedState.activeDocumentId, doc.timeline as unknown as Timeline);
        }

        // Load bibliography into bibliographyStore
        const bibliographyStore = useBibliographyStore.getState();
        if (doc.bibliography) {
          bibliographyStore.citeInstance = new Cite(doc.bibliography.references);
          bibliographyStore.appMetadata = doc.bibliography.metadata;
          bibliographyStore.settings = doc.bibliography.settings;
        } else {
          // Initialize empty bibliography if not present (backward compatibility)
          bibliographyStore.citeInstance = new Cite([]);
          bibliographyStore.appMetadata = {};
          bibliographyStore.settings = { defaultStyle: 'apa', sortOrder: 'author' };
        }
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
    newDoc.labels = [];  // Initialize with empty labels
    newDoc.bibliography = {  // Initialize with empty bibliography
      references: [],
      metadata: {},
      settings: { defaultStyle: 'apa', sortOrder: 'author' },
    };

    const metadata: DocumentMetadata = {
      id: documentId,
      title,
      isDirty: false,
      lastModified: now,
    };

    // Save document
    saveDocumentToStorage(documentId, newDoc);
    saveDocumentMetadata(documentId, metadata);

    // Load the timeline from the newly created document into timelineStore
    useTimelineStore.getState().loadTimeline(documentId, newDoc.timeline as unknown as Timeline);

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

    useToastStore.getState().showToast(`Document "${title}" created`, 'success');

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

    // Get node and edge types from source document's current graph
    const sourceGraph = getCurrentGraphFromDocument(sourceDoc);
    if (!sourceGraph) {
      console.error('Failed to get graph from source document');
      return '';
    }

    // Create new document with the same node and edge types, but no actors/relations
    const newDoc = createDocumentHelper(
      [],
      [],
      sourceGraph.nodeTypes,
      sourceGraph.edgeTypes
    );
    newDoc.metadata.documentId = documentId;
    newDoc.metadata.title = title;
    newDoc.labels = sourceDoc.labels || [];  // Copy labels from source document
    newDoc.bibliography = {  // Initialize with empty bibliography (don't copy bibliography from template)
      references: [],
      metadata: {},
      settings: sourceDoc.bibliography?.settings || { defaultStyle: 'apa', sortOrder: 'author' },
    };

    const metadata: DocumentMetadata = {
      id: documentId,
      title,
      isDirty: false,
      lastModified: now,
    };

    // Save document
    saveDocumentToStorage(documentId, newDoc);
    saveDocumentMetadata(documentId, metadata);

    // Load the timeline from the newly created document into timelineStore
    useTimelineStore.getState().loadTimeline(documentId, newDoc.timeline as unknown as Timeline);

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

    // Load timeline if it exists
    if (doc.timeline) {
      useTimelineStore.getState().loadTimeline(documentId, doc.timeline as unknown as Timeline);
    }

    // Load bibliography into bibliographyStore
    const bibliographyStore = useBibliographyStore.getState();
    if (doc.bibliography) {
      bibliographyStore.citeInstance = new Cite(doc.bibliography.references);
      bibliographyStore.appMetadata = doc.bibliography.metadata;
      bibliographyStore.settings = doc.bibliography.settings;
    } else {
      // Initialize empty bibliography if not present (backward compatibility)
      bibliographyStore.citeInstance = new Cite([]);
      bibliographyStore.appMetadata = {};
      bibliographyStore.settings = { defaultStyle: 'apa', sortOrder: 'author' };
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
    const docTitle = metadata?.title || 'Untitled';

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

    useToastStore.getState().showToast(`Document "${docTitle}" deleted`, 'info');

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

    useToastStore.getState().showToast(`Document renamed to "${newTitle}"`, 'success');
  },

  // Duplicate document
  duplicateDocument: (documentId: string) => {
    const state = get();
    const sourceDoc = state.documents.get(documentId);
    if (!sourceDoc) {
      console.error(`Document ${documentId} not found`);
      useToastStore.getState().showToast('Failed to duplicate: Document not found', 'error');
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
      // Deep copy bibliography to avoid shared references
      bibliography: sourceDoc.bibliography ? {
        references: JSON.parse(JSON.stringify(sourceDoc.bibliography.references)),
        metadata: JSON.parse(JSON.stringify(sourceDoc.bibliography.metadata)),
        settings: { ...sourceDoc.bibliography.settings },
      } : {
        references: [],
        metadata: {},
        settings: { defaultStyle: 'apa', sortOrder: 'author' },
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

    // Initialize timeline for duplicated document - always copy the timeline
    // since all documents now have timelines
    useTimelineStore.getState().loadTimeline(newDocumentId, duplicatedDoc.timeline as unknown as Timeline);

    useToastStore.getState().showToast(`Document duplicated as "${newTitle}"`, 'success');

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
        (importedDoc) => {
          const documentId = generateDocumentId();
          const now = new Date().toISOString();

          // Use the imported document as-is, preserving the complete timeline structure
          // Just update the IDs and metadata for the new workspace context
          importedDoc.metadata.documentId = documentId;
          importedDoc.metadata.title = importedDoc.metadata.title || 'Imported Analysis';
          importedDoc.metadata.updatedAt = now;

          const metadata: DocumentMetadata = {
            id: documentId,
            title: importedDoc.metadata.title || 'Imported Analysis',
            isDirty: false,
            lastModified: now,
          };

          saveDocumentToStorage(documentId, importedDoc);
          saveDocumentMetadata(documentId, metadata);

          // Load the timeline from the imported document into timelineStore
          // This preserves all timeline states, not just the current one
          useTimelineStore.getState().loadTimeline(documentId, importedDoc.timeline as unknown as Timeline);

          // Load bibliography into bibliographyStore
          const bibliographyStore = useBibliographyStore.getState();
          if (importedDoc.bibliography) {
            bibliographyStore.citeInstance = new Cite(importedDoc.bibliography.references);
            bibliographyStore.appMetadata = importedDoc.bibliography.metadata;
            bibliographyStore.settings = importedDoc.bibliography.settings;
          } else {
            // Initialize empty bibliography if not present (backward compatibility)
            bibliographyStore.citeInstance = new Cite([]);
            bibliographyStore.appMetadata = {};
            bibliographyStore.settings = { defaultStyle: 'apa', sortOrder: 'author' };
          }

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

          // Show success toast
          useToastStore.getState().showToast('Document imported successfully', 'success');

          resolve(documentId);
        },
        (error) => {
          // Show error toast
          useToastStore.getState().showToast(`Failed to import file: ${error}`, 'error', 5000);
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
      useToastStore.getState().showToast('Failed to export: Document not found', 'error');
      return;
    }

    try {
      // Ensure timeline is up-to-date before exporting (similar to saveDocument)
      const timelineState = useTimelineStore.getState();
      const timeline = timelineState.timelines.get(documentId);

      if (timeline) {
        // Serialize timeline (convert Map to object)
        const serializedStates: Record<string, ConstellationState> = {};
        timeline.states.forEach((state: ConstellationState, id: string) => {
          serializedStates[id] = state;
        });

        doc.timeline = {
          states: serializedStates,
          currentStateId: timeline.currentStateId,
          rootStateId: timeline.rootStateId,
        };
      }

      // Ensure bibliography is up-to-date before exporting
      const bibliographyStore = useBibliographyStore.getState();
      doc.bibliography = {
        references: bibliographyStore.citeInstance.data as CSLReference[],
        metadata: bibliographyStore.appMetadata,
        settings: bibliographyStore.settings,
      };

      // Export the complete document with all timeline states
      exportDocumentToFile(doc);
      useToastStore.getState().showToast('Document exported successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      useToastStore.getState().showToast(`Failed to export document: ${message}`, 'error', 5000);
    }
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

      // NOTE: nodeTypes and edgeTypes are already part of the document structure
      // and are managed via workspaceStore's type management actions.
      // We do NOT copy them from graphStore because the document is the source of truth.

      /**
       * ═══════════════════════════════════════════════════════════════════════════
       * SYNC POINT 3: timeline → document
       * ═══════════════════════════════════════════════════════════════════════════
       *
       * When: Document save (auto-save or manual)
       * What: Serializes entire timeline (all states) to document.timeline
       * Source of Truth: timelineStore (transient working copy)
       * Direction: timelineStore → document.timeline → localStorage
       *
       * This persists the complete timeline structure to storage. The timeline's
       * current state has already been updated by SYNC POINT 2, so we're saving
       * the latest graph data along with all historical timeline branches.
       */
      const timelineState = useTimelineStore.getState();
      const timeline = timelineState.timelines.get(documentId);

      if (timeline) {
        // Serialize timeline (convert Map to object)
        const serializedStates: Record<string, ConstellationState> = {};
        timeline.states.forEach((state: ConstellationState, id: string) => {
          serializedStates[id] = state;
        });

        doc.timeline = {
          states: serializedStates,
          currentStateId: timeline.currentStateId,
          rootStateId: timeline.rootStateId,
        };
      }

      // Save bibliography from bibliographyStore
      const bibliographyStore = useBibliographyStore.getState();
      doc.bibliography = {
        references: bibliographyStore.citeInstance.data as CSLReference[],
        metadata: bibliographyStore.appMetadata,
        settings: bibliographyStore.settings,
      };

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

    try {
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
      useToastStore.getState().showToast('All documents exported successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      useToastStore.getState().showToast(`Failed to export documents: ${message}`, 'error', 5000);
    }
  },

  // Export workspace
  exportWorkspace: async () => {
    const state = get();

    try {
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
      useToastStore.getState().showToast('Workspace exported successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      useToastStore.getState().showToast(`Failed to export workspace: ${message}`, 'error', 5000);
    }
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

          useToastStore.getState().showToast('Workspace imported successfully', 'success');
          resolve();
        },
        (error) => {
          useToastStore.getState().showToast(`Failed to import workspace: ${error}`, 'error', 5000);
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

  // ============================================================================
  // TYPE MANAGEMENT - DOCUMENT-LEVEL OPERATIONS WITH TRANSACTIONS
  // ============================================================================

  /**
   * Execute a type operation with transaction semantics and automatic rollback
   *
   * This ensures type operations are atomic: either all steps succeed or all are rolled back.
   * Handles errors gracefully (e.g., localStorage quota exceeded) with automatic rollback.
   *
   * @param operation - Function that performs the operation (can throw)
   * @param rollback - Function to rollback changes on failure
   * @param operationName - Human-readable name for error messages
   * @returns Operation result or null on failure
   */
  executeTypeTransaction: <T>(
    operation: () => T,
    rollback: () => void,
    operationName: string
  ): T | null => {
    try {
      const result = operation();
      return result;
    } catch (error) {
      console.error(`${operationName} failed:`, error);

      // Rollback changes
      try {
        rollback();
        console.log(`Rolled back ${operationName}`);
      } catch (rollbackError) {
        console.error(`Rollback failed for ${operationName}:`, rollbackError);
      }

      // Show user-friendly error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      useToastStore.getState().showToast(
        `Failed to ${operationName}: ${errorMessage}`,
        'error'
      );

      return null;
    }
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SYNC POINT 4: document types → graphStore
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * When: Type management operations (add/update/delete node/edge types, labels)
   * What: Updates document types/labels and syncs to graphStore if document is active
   * Source of Truth: ConstellationDocument (document.nodeTypes, document.edgeTypes, document.labels)
   * Direction: document → graphStore (if active document)
   *
   * Type configurations are document-level properties. When modified, changes
   * are persisted to the document first, then synced to graphStore if this is
   * the currently active document. This ensures the editor always displays the
   * correct types for the current document.
   *
   * All type operations use atomic transactions with rollback (Phase 3.1).
   */
  addNodeTypeToDocument: (documentId: string, nodeType) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalNodeTypes = [...doc.nodeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        // 1. Update document in memory
        doc.nodeTypes = [...doc.nodeTypes, nodeType];

        // 2. Save to storage (can throw QuotaExceededError)
        saveDocumentToStorage(documentId, doc);

        // 3. Mark as dirty
        get().markDocumentDirty(documentId);

        // 4. Sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      () => {
        // Rollback on failure
        doc.nodeTypes = originalNodeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        // Re-sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      'add node type'
    );
  },

  updateNodeTypeInDocument: (documentId: string, typeId: string, updates) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalNodeTypes = [...doc.nodeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        // 1. Update document in memory
        doc.nodeTypes = doc.nodeTypes.map((type) =>
          type.id === typeId ? { ...type, ...updates } : type
        );

        // 2. Save to storage (can throw QuotaExceededError)
        saveDocumentToStorage(documentId, doc);

        // 3. Mark as dirty
        get().markDocumentDirty(documentId);

        // 4. Sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      () => {
        // Rollback on failure
        doc.nodeTypes = originalNodeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        // Re-sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      'update node type'
    );
  },

  deleteNodeTypeFromDocument: (documentId: string, typeId: string) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalNodeTypes = [...doc.nodeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        // 1. Update document in memory
        doc.nodeTypes = doc.nodeTypes.filter((type) => type.id !== typeId);

        // 2. Save to storage (can throw QuotaExceededError)
        saveDocumentToStorage(documentId, doc);

        // 3. Mark as dirty
        get().markDocumentDirty(documentId);

        // 4. Sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      () => {
        // Rollback on failure
        doc.nodeTypes = originalNodeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        // Re-sync to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setNodeTypes(doc.nodeTypes);
        }
      },
      'delete node type'
    );
  },

  addEdgeTypeToDocument: (documentId: string, edgeType) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalEdgeTypes = [...doc.edgeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        doc.edgeTypes = [...doc.edgeTypes, edgeType];
        saveDocumentToStorage(documentId, doc);
        get().markDocumentDirty(documentId);
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      () => {
        doc.edgeTypes = originalEdgeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      'add edge type'
    );
  },

  updateEdgeTypeInDocument: (documentId: string, typeId: string, updates) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalEdgeTypes = [...doc.edgeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        doc.edgeTypes = doc.edgeTypes.map((type) =>
          type.id === typeId ? { ...type, ...updates } : type
        );
        saveDocumentToStorage(documentId, doc);
        get().markDocumentDirty(documentId);
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      () => {
        doc.edgeTypes = originalEdgeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      'update edge type'
    );
  },

  deleteEdgeTypeFromDocument: (documentId: string, typeId: string) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Capture original state for rollback
    const originalEdgeTypes = [...doc.edgeTypes];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        doc.edgeTypes = doc.edgeTypes.filter((type) => type.id !== typeId);
        saveDocumentToStorage(documentId, doc);
        get().markDocumentDirty(documentId);
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      () => {
        doc.edgeTypes = originalEdgeTypes;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setEdgeTypes(doc.edgeTypes);
        }
      },
      'delete edge type'
    );
  },

  // Label management - document-level operations
  addLabelToDocument: (documentId: string, label) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Initialize labels array if it doesn't exist (backward compatibility)
    if (!doc.labels) {
      doc.labels = [];
    }

    // Capture original state for rollback
    const originalLabels = [...doc.labels];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        doc.labels = [...(doc.labels || []), label];
        saveDocumentToStorage(documentId, doc);
        get().markDocumentDirty(documentId);
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      () => {
        doc.labels = originalLabels;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      'add label'
    );
  },

  updateLabelInDocument: (documentId: string, labelId: string, updates) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Initialize labels array if it doesn't exist (backward compatibility)
    if (!doc.labels) {
      doc.labels = [];
    }

    // Capture original state for rollback
    const originalLabels = [...doc.labels];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    get().executeTypeTransaction(
      () => {
        doc.labels = (doc.labels || []).map((label) =>
          label.id === labelId ? { ...label, ...updates } : label
        );
        saveDocumentToStorage(documentId, doc);
        get().markDocumentDirty(documentId);
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      () => {
        doc.labels = originalLabels;
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      'update label'
    );
  },

  deleteLabelFromDocument: (documentId: string, labelId: string) => {
    const state = get();
    const doc = state.documents.get(documentId);

    if (!doc) {
      console.error(`Document ${documentId} not found`);
      return;
    }

    // Initialize labels array if it doesn't exist (backward compatibility)
    if (!doc.labels) {
      doc.labels = [];
    }

    // Capture original state for rollback
    const originalLabels = [...doc.labels];
    const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

    // Capture original timeline for rollback (shallow copy of the entire timeline)
    const timelineStore = useTimelineStore.getState();
    const timeline = timelineStore.timelines.get(documentId);
    const originalTimeline = timeline ? { ...timeline, states: new Map(timeline.states) } : null;

    get().executeTypeTransaction(
      () => {
        // 1. Remove from document's labels
        doc.labels = (doc.labels || []).filter((label) => label.id !== labelId);

        // 2. Remove label from all nodes and edges in all timeline states (IMMUTABLE)
        if (timeline) {
          // ✅ Build new states Map with cleaned labels (immutable update)
          const newStates = new Map();
          let hasChanges = false;

          timeline.states.forEach((constellationState, stateId) => {
            // Create new state with cleaned labels
            const cleanedState = {
              ...constellationState,
              graph: {
                ...constellationState.graph,
                nodes: constellationState.graph.nodes.map((node) => {
                  const nodeData = node.data as { labels?: string[] };
                  if (nodeData?.labels?.includes(labelId)) {
                    hasChanges = true;
                    return {
                      ...node,
                      data: {
                        ...nodeData,
                        labels: nodeData.labels.filter((id: string) => id !== labelId),
                      },
                    };
                  }
                  return node;
                }),
                edges: constellationState.graph.edges.map((edge) => {
                  const edgeData = edge.data as { labels?: string[] };
                  if (edgeData?.labels?.includes(labelId)) {
                    hasChanges = true;
                    return {
                      ...edge,
                      data: {
                        ...edgeData,
                        labels: edgeData.labels.filter((id: string) => id !== labelId),
                      },
                    };
                  }
                  return edge;
                }),
              },
            };
            newStates.set(stateId, cleanedState);
          });

          // ✅ Atomic swap - replace entire timeline at once
          if (hasChanges) {
            const newTimeline = {
              ...timeline,
              states: newStates,
            };
            timelineStore.timelines.set(documentId, newTimeline);

            // Sync to graphStore if active
            if (documentId === state.activeDocumentId) {
              const currentState = newStates.get(timeline.currentStateId);
              if (currentState) {
                useGraphStore.setState({
                  nodes: currentState.graph.nodes as Actor[],
                  edges: currentState.graph.edges as Relation[],
                });
              }
            }
          }
        }

        // 3. Save document to storage (can throw QuotaExceededError)
        saveDocumentToStorage(documentId, doc);

        // 4. Mark as dirty
        get().markDocumentDirty(documentId);

        // 5. If this is the active document, sync to graphStore
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      () => {
        // Rollback on failure
        doc.labels = originalLabels;

        // Restore entire timeline (atomic rollback)
        if (originalTimeline) {
          timelineStore.timelines.set(documentId, originalTimeline);

          // Sync restored state to graphStore if active
          if (documentId === state.activeDocumentId) {
            const currentState = originalTimeline.states.get(originalTimeline.currentStateId);
            if (currentState) {
              useGraphStore.setState({
                nodes: currentState.graph.nodes as Actor[],
                edges: currentState.graph.edges as Relation[],
              });
            }
          }
        }

        // Restore isDirty flag
        const metadata = state.documentMetadata.get(documentId);
        if (metadata && originalIsDirty !== undefined) {
          metadata.isDirty = originalIsDirty;
        }

        // Sync labels to graphStore if active
        if (documentId === state.activeDocumentId) {
          useGraphStore.getState().setLabels(doc.labels);
        }
      },
      'delete label'
    );
  },
}));
