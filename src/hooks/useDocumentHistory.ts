import { useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useHistoryStore } from '../stores/historyStore';
import { useGraphStore } from '../stores/graphStore';
import { useTimelineStore } from '../stores/timelineStore';
import type { GraphSnapshot } from '../stores/historyStore';

/**
 * useDocumentHistory Hook
 *
 * Provides undo/redo functionality for the active timeline state.
 * Each timeline state has its own independent history stack (max 50 actions).
 *
 * IMPORTANT: History is per-timeline-state. Each state in a document's timeline has completely separate undo/redo stacks.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo, pushToHistory } = useDocumentHistory();
 */
export function useDocumentHistory() {
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const markDocumentDirty = useWorkspaceStore((state) => state.markDocumentDirty);

  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const setNodeTypes = useGraphStore((state) => state.setNodeTypes);
  const setEdgeTypes = useGraphStore((state) => state.setEdgeTypes);

  const historyStore = useHistoryStore();

  // Get current timeline state ID
  const currentStateId = useTimelineStore((state) => {
    if (!activeDocumentId) return null;
    const timeline = state.timelines.get(activeDocumentId);
    return timeline?.currentStateId || null;
  });

  // Initialize history for active timeline state
  useEffect(() => {
    if (!currentStateId) return;

    const history = historyStore.histories.get(currentStateId);
    if (!history) {
      historyStore.initializeHistory(currentStateId);
    }
  }, [currentStateId, historyStore]);

  /**
   * Push current graph state to history
   */
  const pushToHistory = useCallback(
    (description: string) => {
      if (!currentStateId) {
        console.warn('No active timeline state to record action');
        return;
      }

      // Read current state directly from store (not from React hooks which might be stale)
      const currentState = useGraphStore.getState();

      // Create a snapshot of the current graph state
      const snapshot: GraphSnapshot = {
        nodes: currentState.nodes,
        edges: currentState.edges,
        nodeTypes: currentState.nodeTypes,
        edgeTypes: currentState.edgeTypes,
      };

      // Push to history
      historyStore.pushAction(currentStateId, {
        description,
        timestamp: Date.now(),
        graphState: snapshot,
      });
    },
    [currentStateId, historyStore]
  );

  /**
   * Undo the last action for the active timeline state
   */
  const undo = useCallback(() => {
    if (!currentStateId || !activeDocumentId) {
      console.warn('No active timeline state to undo');
      return;
    }

    const restoredState = historyStore.undo(currentStateId);
    if (restoredState) {
      // Update graph store with restored state
      setNodes(restoredState.nodes as never[]);
      setEdges(restoredState.edges as never[]);
      setNodeTypes(restoredState.nodeTypes as never[]);
      setEdgeTypes(restoredState.edgeTypes as never[]);

      // Update the timeline's current state with the restored graph (nodes and edges only)
      useTimelineStore.getState().saveCurrentGraph({
        nodes: restoredState.nodes as never[],
        edges: restoredState.edges as never[],
      });

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      const { saveDocument } = useWorkspaceStore.getState();
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [currentStateId, activeDocumentId, historyStore, setNodes, setEdges, setNodeTypes, setEdgeTypes, markDocumentDirty]);

  /**
   * Redo the last undone action for the active timeline state
   */
  const redo = useCallback(() => {
    if (!currentStateId || !activeDocumentId) {
      console.warn('No active timeline state to redo');
      return;
    }

    const restoredState = historyStore.redo(currentStateId);
    if (restoredState) {
      // Update graph store with restored state
      setNodes(restoredState.nodes as never[]);
      setEdges(restoredState.edges as never[]);
      setNodeTypes(restoredState.nodeTypes as never[]);
      setEdgeTypes(restoredState.edgeTypes as never[]);

      // Update the timeline's current state with the restored graph (nodes and edges only)
      useTimelineStore.getState().saveCurrentGraph({
        nodes: restoredState.nodes as never[],
        edges: restoredState.edges as never[],
      });

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      const { saveDocument } = useWorkspaceStore.getState();
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [currentStateId, activeDocumentId, historyStore, setNodes, setEdges, setNodeTypes, setEdgeTypes, markDocumentDirty]);

  /**
   * Check if undo is available for the active timeline state
   */
  const canUndo = currentStateId ? historyStore.canUndo(currentStateId) : false;

  /**
   * Check if redo is available for the active timeline state
   */
  const canRedo = currentStateId ? historyStore.canRedo(currentStateId) : false;

  /**
   * Get the description of the next undo action
   */
  const undoDescription = currentStateId
    ? historyStore.getUndoDescription(currentStateId)
    : null;

  /**
   * Get the description of the next redo action
   */
  const redoDescription = currentStateId
    ? historyStore.getRedoDescription(currentStateId)
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
