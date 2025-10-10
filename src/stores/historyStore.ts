import { create } from 'zustand';
import type { ConstellationDocument } from './persistence/types';
import { useGraphStore } from './graphStore';

/**
 * History Store - Per-Document Undo/Redo System
 *
 * Each document maintains its own independent history stack with a maximum of 50 actions.
 * Tracks all reversible operations: node add/delete/move, edge add/delete/edit, type changes.
 *
 * IMPORTANT: History is per-document. Each document has completely separate undo/redo stacks.
 */

export interface HistoryAction {
  description: string;  // Human-readable description (e.g., "Add Person Actor", "Delete Collaborates Relation")
  timestamp: number;    // When the action occurred
  documentState: ConstellationDocument;  // Complete document state after this action
}

export interface DocumentHistory {
  undoStack: HistoryAction[];  // Past states to restore (most recent at end)
  redoStack: HistoryAction[];  // Future states to restore (most recent at end)
}

interface HistoryStore {
  // Map of documentId -> history (each document has its own independent history)
  histories: Map<string, DocumentHistory>;

  // Max number of actions to keep in history per document
  maxHistorySize: number;
}

interface HistoryActions {
  // Initialize history for a document
  initializeHistory: (documentId: string, initialState: ConstellationDocument) => void;

  // Push a new action onto the document's history stack
  pushAction: (documentId: string, action: HistoryAction) => void;

  // Undo the last action for a specific document
  undo: (documentId: string) => ConstellationDocument | null;

  // Redo the last undone action for a specific document
  redo: (documentId: string) => ConstellationDocument | null;

  // Check if undo is available for a document
  canUndo: (documentId: string) => boolean;

  // Check if redo is available for a document
  canRedo: (documentId: string) => boolean;

  // Get the description of the next undo action for a document
  getUndoDescription: (documentId: string) => string | null;

  // Get the description of the next redo action for a document
  getRedoDescription: (documentId: string) => string | null;

  // Clear history for a specific document
  clearHistory: (documentId: string) => void;

  // Remove history for a document (when document is deleted)
  removeHistory: (documentId: string) => void;

  // Get history stats for debugging
  getHistoryStats: (documentId: string) => {
    undoCount: number;
    redoCount: number;
  } | null;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryStore & HistoryActions>((set, get) => ({
  histories: new Map(),
  maxHistorySize: MAX_HISTORY_SIZE,

  initializeHistory: (documentId: string, _initialState: ConstellationDocument) => {
    set((state) => {
      const newHistories = new Map(state.histories);

      // Only initialize if not already present
      if (!newHistories.has(documentId)) {
        newHistories.set(documentId, {
          undoStack: [],
          redoStack: [],
        });
      }

      return { histories: newHistories };
    });
  },

  pushAction: (documentId: string, action: HistoryAction) => {
    set((state) => {
      const newHistories = new Map(state.histories);
      const history = newHistories.get(documentId);

      if (!history) {
        console.warn(`History not initialized for document ${documentId}`);
        return {};
      }

      console.log('📝 pushAction:', {
        description: action.description,
        actionStateNodes: action.documentState.graph.nodes.length,
        actionStateEdges: action.documentState.graph.edges.length,
        currentUndoStackSize: history.undoStack.length,
      });

      // The action.documentState contains the state BEFORE the action was performed
      // We push this to the undo stack so we can restore it if the user clicks undo
      const newUndoStack = [...history.undoStack];
      newUndoStack.push({
        description: action.description,
        timestamp: action.timestamp,
        documentState: JSON.parse(JSON.stringify(action.documentState)), // Deep copy
      });

      // Trim undo stack if it exceeds max size
      if (newUndoStack.length > state.maxHistorySize) {
        newUndoStack.shift(); // Remove oldest
      }

      // Clear redo stack when a new action is performed (can't redo after new action)
      const newRedoStack: HistoryAction[] = [];

      newHistories.set(documentId, {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      });

      console.log('📝 after push:', {
        description: action.description,
        newUndoStackSize: newUndoStack.length,
        topOfStackNodes: newUndoStack[newUndoStack.length - 1]?.documentState.graph.nodes.length,
        topOfStackEdges: newUndoStack[newUndoStack.length - 1]?.documentState.graph.edges.length,
      });

      return { histories: newHistories };
    });
  },

  undo: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);

    if (!history || history.undoStack.length === 0) {
      return null;
    }

    console.log('⏪ undo:', {
      description: history.undoStack[history.undoStack.length - 1].description,
      undoStackSize: history.undoStack.length,
    });

    const newHistories = new Map(state.histories);

    // Pop the last action from undo stack - this is the state BEFORE the action
    const lastAction = history.undoStack[history.undoStack.length - 1];
    const newUndoStack = history.undoStack.slice(0, -1);

    // Get current state from graphStore and push it to redo stack
    const currentGraphState = useGraphStore.getState();
    const currentStateSnapshot = {
      graph: {
        nodes: currentGraphState.nodes,
        edges: currentGraphState.edges,
        nodeTypes: currentGraphState.nodeTypes,
        edgeTypes: currentGraphState.edgeTypes,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      version: '1.0' as const,
    };

    const newRedoStack = [...history.redoStack];
    newRedoStack.push({
      description: lastAction.description,
      timestamp: Date.now(),
      documentState: JSON.parse(JSON.stringify(currentStateSnapshot)), // Deep copy
    });

    // Restore the previous state (deep copy)
    const restoredState = JSON.parse(JSON.stringify(lastAction.documentState));

    console.log('⏪ after undo:', {
      restoredStateNodes: restoredState.graph.nodes.length,
      restoredStateEdges: restoredState.graph.edges.length,
      undoStackSize: newUndoStack.length,
      redoStackSize: newRedoStack.length,
    });

    newHistories.set(documentId, {
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });

    set({ histories: newHistories });

    return restoredState;
  },

  redo: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);

    if (!history || history.redoStack.length === 0) {
      return null;
    }

    const newHistories = new Map(state.histories);

    // Pop the last action from redo stack
    const lastAction = history.redoStack[history.redoStack.length - 1];
    const newRedoStack = history.redoStack.slice(0, -1);

    // Get current state from graphStore and push it to undo stack
    const currentGraphState = useGraphStore.getState();
    const currentStateSnapshot = {
      graph: {
        nodes: currentGraphState.nodes,
        edges: currentGraphState.edges,
        nodeTypes: currentGraphState.nodeTypes,
        edgeTypes: currentGraphState.edgeTypes,
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      version: '1.0' as const,
    };

    const newUndoStack = [...history.undoStack];
    newUndoStack.push({
      description: lastAction.description,
      timestamp: Date.now(),
      documentState: JSON.parse(JSON.stringify(currentStateSnapshot)), // Deep copy
    });

    // Trim if exceeds max size
    if (newUndoStack.length > state.maxHistorySize) {
      newUndoStack.shift(); // Remove oldest
    }

    // Restore the future state (deep copy)
    const restoredState = JSON.parse(JSON.stringify(lastAction.documentState));

    newHistories.set(documentId, {
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    });

    set({ histories: newHistories });

    return restoredState;
  },

  canUndo: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);
    return history ? history.undoStack.length > 0 : false;
  },

  canRedo: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);
    return history ? history.redoStack.length > 0 : false;
  },

  getUndoDescription: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);

    if (!history || history.undoStack.length === 0) {
      return null;
    }

    const lastAction = history.undoStack[history.undoStack.length - 1];
    return lastAction.description;
  },

  getRedoDescription: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);

    if (!history || history.redoStack.length === 0) {
      return null;
    }

    const lastAction = history.redoStack[history.redoStack.length - 1];
    return lastAction.description;
  },

  clearHistory: (documentId: string) => {
    set((state) => {
      const newHistories = new Map(state.histories);
      const history = newHistories.get(documentId);

      if (history) {
        newHistories.set(documentId, {
          undoStack: [],
          redoStack: [],
        });
      }

      return { histories: newHistories };
    });
  },

  removeHistory: (documentId: string) => {
    set((state) => {
      const newHistories = new Map(state.histories);
      newHistories.delete(documentId);
      return { histories: newHistories };
    });
  },

  getHistoryStats: (documentId: string) => {
    const state = get();
    const history = state.histories.get(documentId);

    if (!history) {
      return null;
    }

    return {
      undoCount: history.undoStack.length,
      redoCount: history.redoStack.length,
    };
  },
}));
