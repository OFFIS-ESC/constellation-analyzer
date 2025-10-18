import { useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
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

  const loadGraphState = useGraphStore((state) => state.loadGraphState);

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
      const workspaceStore = useWorkspaceStore.getState();
      const activeDoc = workspaceStore.getActiveDocument();
      const timelineStore = useTimelineStore.getState();
      const timeline = timelineStore.timelines.get(activeDocumentId);

      if (!timeline) {
        console.warn('No timeline found for active document');
        return;
      }

      if (!activeDoc) {
        console.warn('Active document not found');
        return;
      }

      // IMPORTANT: Update timeline's current state with graphStore BEFORE capturing snapshot
      // This ensures the snapshot includes the current groups, nodes, and edges
      const currentState = timeline.states.get(timeline.currentStateId);
      if (currentState) {
        const graphStore = useGraphStore.getState();
        currentState.graph = {
          nodes: graphStore.nodes as any,
          edges: graphStore.edges as any,
          groups: graphStore.groups as any,
        };
      }

      // Create a snapshot of the complete document state
      // NOTE: Read types and labels from the document, not from graphStore
      const snapshot: DocumentSnapshot = {
        timeline: {
          states: new Map(timeline.states), // Clone the Map
          currentStateId: timeline.currentStateId,
          rootStateId: timeline.rootStateId,
        },
        nodeTypes: activeDoc.nodeTypes,
        edgeTypes: activeDoc.edgeTypes,
        labels: activeDoc.labels || [],
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
    const workspaceStore = useWorkspaceStore.getState();
    const activeDoc = workspaceStore.getActiveDocument();
    const timelineStore = useTimelineStore.getState();
    const timeline = timelineStore.timelines.get(activeDocumentId);

    if (!timeline) {
      console.warn('No timeline found for active document');
      return;
    }

    if (!activeDoc) {
      console.warn('Active document not found');
      return;
    }

    // IMPORTANT: Update timeline's current state with graphStore BEFORE capturing snapshot
    // This ensures the snapshot includes the current groups
    const currentState = timeline.states.get(timeline.currentStateId);
    if (currentState) {
      const graphStore = useGraphStore.getState();
      currentState.graph = {
        nodes: graphStore.nodes as any,
        edges: graphStore.edges as any,
        groups: graphStore.groups as any,
      };
    }

    // NOTE: Read types and labels from the document, not from graphStore
    const currentSnapshot: DocumentSnapshot = {
      timeline: {
        states: new Map(timeline.states),
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      },
      nodeTypes: activeDoc.nodeTypes,
      edgeTypes: activeDoc.edgeTypes,
      labels: activeDoc.labels || [],
    };

    const restoredState = historyStore.undo(activeDocumentId, currentSnapshot);
    if (restoredState) {

      // Restore complete document state (timeline + types + labels)
      timelineStore.loadTimeline(activeDocumentId, restoredState.timeline);

      // Update document's types and labels (which will sync to graphStore via workspaceStore)
      activeDoc.nodeTypes = restoredState.nodeTypes;
      activeDoc.edgeTypes = restoredState.edgeTypes;
      activeDoc.labels = restoredState.labels || [];

      // Load the current state's graph from the restored timeline
      const currentState = restoredState.timeline.states.get(restoredState.timeline.currentStateId);
      if (currentState) {
        // IMPORTANT: Use flushSync to force React to process the Zustand update immediately
        // This prevents React Flow from processing stale state before the new state arrives
        flushSync(() => {
          // Use loadGraphState to update ALL graph state atomically in a single Zustand transaction
          // This prevents React Flow from receiving intermediate state where nodes have
          // parentId references but groups don't exist yet (which causes "Parent node not found")
          loadGraphState({
            nodes: currentState.graph.nodes,
            edges: currentState.graph.edges,
            groups: currentState.graph.groups || [],
            nodeTypes: restoredState.nodeTypes,
            edgeTypes: restoredState.edgeTypes,
            labels: restoredState.labels || [],
          });
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
  }, [activeDocumentId, historyStore, loadGraphState, markDocumentDirty]);

  /**
   * Redo the last undone action for the active document
   */
  const redo = useCallback(() => {
    if (!activeDocumentId) {
      console.warn('No active document to redo');
      return;
    }

    // Capture current state BEFORE redoing
    const workspaceStore = useWorkspaceStore.getState();
    const activeDoc = workspaceStore.getActiveDocument();
    const timelineStore = useTimelineStore.getState();
    const timeline = timelineStore.timelines.get(activeDocumentId);

    if (!timeline) {
      console.warn('No timeline found for active document');
      return;
    }

    if (!activeDoc) {
      console.warn('Active document not found');
      return;
    }

    // IMPORTANT: Update timeline's current state with graphStore BEFORE capturing snapshot
    // This ensures the snapshot includes the current groups
    const currentState = timeline.states.get(timeline.currentStateId);
    if (currentState) {
      const graphStore = useGraphStore.getState();
      currentState.graph = {
        nodes: graphStore.nodes as any,
        edges: graphStore.edges as any,
        groups: graphStore.groups as any,
      };
    }

    // NOTE: Read types and labels from the document, not from graphStore
    const currentSnapshot: DocumentSnapshot = {
      timeline: {
        states: new Map(timeline.states),
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      },
      nodeTypes: activeDoc.nodeTypes,
      edgeTypes: activeDoc.edgeTypes,
      labels: activeDoc.labels || [],
    };

    const restoredState = historyStore.redo(activeDocumentId, currentSnapshot);
    if (restoredState) {

      // Restore complete document state (timeline + types + labels)
      timelineStore.loadTimeline(activeDocumentId, restoredState.timeline);

      // Update document's types and labels (which will sync to graphStore via workspaceStore)
      activeDoc.nodeTypes = restoredState.nodeTypes;
      activeDoc.edgeTypes = restoredState.edgeTypes;
      activeDoc.labels = restoredState.labels || [];

      // Load the current state's graph from the restored timeline
      const currentState = restoredState.timeline.states.get(restoredState.timeline.currentStateId);
      if (currentState) {
        // IMPORTANT: Use flushSync to force React to process the Zustand update immediately
        // This prevents React Flow from processing stale state before the new state arrives
        flushSync(() => {
          // Use loadGraphState to update ALL graph state atomically in a single Zustand transaction
          // This prevents React Flow from receiving intermediate state where nodes have
          // parentId references but groups don't exist yet (which causes "Parent node not found")
          loadGraphState({
            nodes: currentState.graph.nodes,
            edges: currentState.graph.edges,
            groups: currentState.graph.groups || [],
            nodeTypes: restoredState.nodeTypes,
            edgeTypes: restoredState.edgeTypes,
            labels: restoredState.labels || [],
          });
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
  }, [activeDocumentId, historyStore, loadGraphState, markDocumentDirty]);

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
