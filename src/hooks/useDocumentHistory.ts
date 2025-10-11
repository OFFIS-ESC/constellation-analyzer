import { useCallback, useEffect } from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useHistoryStore } from '../stores/historyStore';
import { useGraphStore } from '../stores/graphStore';
import { useTimelineStore } from '../stores/timelineStore';
import type { DocumentSnapshot } from '../stores/historyStore';

/**
 * useDocumentHistory Hook
 *
 * Provides undo/redo functionality for the active document.
 * Each document has its own independent history stack (max 50 actions).
 *
 * IMPORTANT: History is per-document. All operations (graph changes, timeline operations)
 * are tracked in a single unified history stack for the entire document.
 *
 * Usage:
 *   const { undo, redo, canUndo, canRedo, pushToHistory } = useDocumentHistory();
 */
export function useDocumentHistory() {
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const markDocumentDirty = useWorkspaceStore((state) => state.markDocumentDirty);

  const setNodeTypes = useGraphStore((state) => state.setNodeTypes);
  const setEdgeTypes = useGraphStore((state) => state.setEdgeTypes);

  const historyStore = useHistoryStore();

  // Initialize history for active document
  useEffect(() => {
    if (!activeDocumentId) return;

    const history = historyStore.histories.get(activeDocumentId);
    if (!history) {
      historyStore.initializeHistory(activeDocumentId);
    }
  }, [activeDocumentId, historyStore]);

  /**
   * Push current document state to history (timeline + types)
   */
  const pushToHistory = useCallback(
    (description: string) => {
      if (!activeDocumentId) {
        console.warn('No active document to record action');
        return;
      }

      // Get current state from stores
      const graphStore = useGraphStore.getState();
      const timelineStore = useTimelineStore.getState();
      const timeline = timelineStore.timelines.get(activeDocumentId);

      if (!timeline) {
        console.warn('No timeline found for active document');
        return;
      }

      // Create a snapshot of the complete document state
      const snapshot: DocumentSnapshot = {
        timeline: {
          states: new Map(timeline.states), // Clone the Map
          currentStateId: timeline.currentStateId,
          rootStateId: timeline.rootStateId,
        },
        nodeTypes: graphStore.nodeTypes,
        edgeTypes: graphStore.edgeTypes,
      };

      // Push to history
      historyStore.pushAction(activeDocumentId, {
        description,
        timestamp: Date.now(),
        documentState: snapshot,
      });
    },
    [activeDocumentId, historyStore]
  );

  /**
   * Undo the last action for the active document
   */
  const undo = useCallback(() => {
    if (!activeDocumentId) {
      console.warn('No active document to undo');
      return;
    }

    // Capture current state BEFORE undoing
    const graphStore = useGraphStore.getState();
    const timelineStore = useTimelineStore.getState();
    const timeline = timelineStore.timelines.get(activeDocumentId);

    if (!timeline) {
      console.warn('No timeline found for active document');
      return;
    }

    const currentSnapshot: DocumentSnapshot = {
      timeline: {
        states: new Map(timeline.states),
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      },
      nodeTypes: graphStore.nodeTypes,
      edgeTypes: graphStore.edgeTypes,
    };

    const restoredState = historyStore.undo(activeDocumentId, currentSnapshot);
    if (restoredState) {

      // Restore complete document state (timeline + types)
      timelineStore.loadTimeline(activeDocumentId, restoredState.timeline);

      // Update graph store types
      setNodeTypes(restoredState.nodeTypes);
      setEdgeTypes(restoredState.edgeTypes);

      // Load the current state's graph from the restored timeline
      const currentState = restoredState.timeline.states.get(restoredState.timeline.currentStateId);
      if (currentState) {
        useGraphStore.setState({
          nodes: currentState.graph.nodes,
          edges: currentState.graph.edges,
        });
      }

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      const { saveDocument } = useWorkspaceStore.getState();
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [activeDocumentId, historyStore, setNodeTypes, setEdgeTypes, markDocumentDirty]);

  /**
   * Redo the last undone action for the active document
   */
  const redo = useCallback(() => {
    if (!activeDocumentId) {
      console.warn('No active document to redo');
      return;
    }

    // Capture current state BEFORE redoing
    const graphStore = useGraphStore.getState();
    const timelineStore = useTimelineStore.getState();
    const timeline = timelineStore.timelines.get(activeDocumentId);

    if (!timeline) {
      console.warn('No timeline found for active document');
      return;
    }

    const currentSnapshot: DocumentSnapshot = {
      timeline: {
        states: new Map(timeline.states),
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      },
      nodeTypes: graphStore.nodeTypes,
      edgeTypes: graphStore.edgeTypes,
    };

    const restoredState = historyStore.redo(activeDocumentId, currentSnapshot);
    if (restoredState) {

      // Restore complete document state (timeline + types)
      timelineStore.loadTimeline(activeDocumentId, restoredState.timeline);

      // Update graph store types
      setNodeTypes(restoredState.nodeTypes);
      setEdgeTypes(restoredState.edgeTypes);

      // Load the current state's graph from the restored timeline
      const currentState = restoredState.timeline.states.get(restoredState.timeline.currentStateId);
      if (currentState) {
        useGraphStore.setState({
          nodes: currentState.graph.nodes,
          edges: currentState.graph.edges,
        });
      }

      // Mark document as dirty and trigger auto-save
      markDocumentDirty(activeDocumentId);

      // Auto-save after a short delay
      const { saveDocument } = useWorkspaceStore.getState();
      setTimeout(() => {
        saveDocument(activeDocumentId);
      }, 1000);
    }
  }, [activeDocumentId, historyStore, setNodeTypes, setEdgeTypes, markDocumentDirty]);

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
