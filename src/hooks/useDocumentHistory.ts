import { useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useHistoryStore } from '../stores/historyStore';
import { useGraphStore } from '../stores/graphStore';
import type { ConstellationDocument } from '../stores/persistence/types';
import { createDocument } from '../stores/persistence/saver';

/**
 * useDocumentHistory Hook
 *
 * Provides undo/redo functionality for the active document.
 * Each document has its own independent history stack (max 50 actions).
 *
 * IMPORTANT: History is per-document. Switching documents maintains separate undo/redo stacks.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo, pushToHistory } = useDocumentHistory();
 */
export function useDocumentHistory() {
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const getActiveDocument = useWorkspaceStore((state) => state.getActiveDocument);
  const markDocumentDirty = useWorkspaceStore((state) => state.markDocumentDirty);

  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const setNodeTypes = useGraphStore((state) => state.setNodeTypes);
  const setEdgeTypes = useGraphStore((state) => state.setEdgeTypes);

  const historyStore = useHistoryStore();

  // Initialize history for active document
  useEffect(() => {
    if (!activeDocumentId) return;

    const history = historyStore.histories.get(activeDocumentId);
    if (!history) {
      const currentDoc = getActiveDocument();
      if (currentDoc) {
        historyStore.initializeHistory(activeDocumentId, currentDoc);
      }
    }
  }, [activeDocumentId, historyStore, getActiveDocument]);

  /**
   * Push current graph state to history
   */
  const pushToHistory = useCallback(
    (description: string) => {
      if (!activeDocumentId) {
        console.warn('No active document to record action');
        return;
      }

      // Read current state directly from store (not from React hooks which might be stale)
      const currentState = useGraphStore.getState();

      const currentDoc = getActiveDocument();
      if (!currentDoc) {
        console.warn('Active document not loaded, attempting to use current graph state');
        // If document isn't loaded yet, create a minimal snapshot from current state
        const snapshot: ConstellationDocument = createDocument(
          currentState.nodes as never[],
          currentState.edges as never[],
          currentState.nodeTypes,
          currentState.edgeTypes
        );

        // Use minimal metadata
        snapshot.metadata = {
          documentId: activeDocumentId,
          title: 'Untitled',
          version: '1.0.0',
          appName: 'Constellation Analyzer',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSavedBy: 'user',
        };

        // Push to history
        historyStore.pushAction(activeDocumentId, {
          description,
          timestamp: Date.now(),
          documentState: snapshot,
        });
        return;
      }

      // Create a snapshot of the current state
      const snapshot: ConstellationDocument = createDocument(
        currentState.nodes as never[],
        currentState.edges as never[],
        currentState.nodeTypes,
        currentState.edgeTypes
      );

      // Copy metadata from current document
      snapshot.metadata = {
        ...currentDoc.metadata,
        updatedAt: new Date().toISOString(),
      };

      // Push to history
      historyStore.pushAction(activeDocumentId, {
        description,
        timestamp: Date.now(),
        documentState: snapshot,
      });
    },
    [activeDocumentId, historyStore, getActiveDocument]
  );

  /**
   * Undo the last action for the active document
   */
  const undo = useCallback(() => {
    if (!activeDocumentId) {
      console.warn('No active document to undo');
      return;
    }

    const restoredState = historyStore.undo(activeDocumentId);
    if (restoredState) {
      // Update graph store with restored state
      setNodes(restoredState.graph.nodes as never[]);
      setEdges(restoredState.graph.edges as never[]);
      setNodeTypes(restoredState.graph.nodeTypes);
      setEdgeTypes(restoredState.graph.edgeTypes);

      // Update workspace document
      const { documents, saveDocument } = useWorkspaceStore.getState();
      const newDocuments = new Map(documents);
      newDocuments.set(activeDocumentId, restoredState);
      useWorkspaceStore.setState({ documents: newDocuments });

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [activeDocumentId, historyStore, setNodes, setEdges, setNodeTypes, setEdgeTypes, markDocumentDirty]);

  /**
   * Redo the last undone action for the active document
   */
  const redo = useCallback(() => {
    if (!activeDocumentId) {
      console.warn('No active document to redo');
      return;
    }

    const restoredState = historyStore.redo(activeDocumentId);
    if (restoredState) {
      // Update graph store with restored state
      setNodes(restoredState.graph.nodes as never[]);
      setEdges(restoredState.graph.edges as never[]);
      setNodeTypes(restoredState.graph.nodeTypes);
      setEdgeTypes(restoredState.graph.edgeTypes);

      // Update workspace document
      const { documents, saveDocument } = useWorkspaceStore.getState();
      const newDocuments = new Map(documents);
      newDocuments.set(activeDocumentId, restoredState);
      useWorkspaceStore.setState({ documents: newDocuments });

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [activeDocumentId, historyStore, setNodes, setEdges, setNodeTypes, setEdgeTypes, markDocumentDirty]);

  /**
   * Check if undo is available for the active document
   */
  const canUndo = activeDocumentId ? historyStore.canUndo(activeDocumentId) : false;

  /**
   * Check if redo is available for the active document
   */
  const canRedo = activeDocumentId ? historyStore.canRedo(activeDocumentId) : false;

  /**
   * Get the description of the next undo action
   */
  const undoDescription = activeDocumentId
    ? historyStore.getUndoDescription(activeDocumentId)
    : null;

  /**
   * Get the description of the next redo action
   */
  const redoDescription = activeDocumentId
    ? historyStore.getRedoDescription(activeDocumentId)
    : null;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    pushToHistory,
  };
}
