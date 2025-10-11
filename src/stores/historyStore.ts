import { create } from "zustand";
import { useGraphStore } from "./graphStore";
import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from "../types";

/**
 * History Store - Per-Timeline-State Undo/Redo System
 *
 * Each timeline state maintains its own independent history stack with a maximum of 50 actions.
 * Tracks all reversible operations: node add/delete/move, edge add/delete/edit, type changes.
 *
 * IMPORTANT: History is per-timeline-state. Each state in a document's timeline has completely separate undo/redo stacks.
 */

export interface GraphSnapshot {
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
}

export interface HistoryAction {
  description: string; // Human-readable description (e.g., "Add Person Actor", "Delete Collaborates Relation")
  timestamp: number; // When the action occurred
  graphState: GraphSnapshot; // Graph state snapshot (not full document)
}

export interface StateHistory {
  undoStack: HistoryAction[]; // Past states to restore (most recent at end)
  redoStack: HistoryAction[]; // Future states to restore (most recent at end)
}

interface HistoryStore {
  // Map of stateId -> history (each timeline state has its own independent history)
  histories: Map<string, StateHistory>;

  // Max number of actions to keep in history per state
  maxHistorySize: number;
}

interface HistoryActions {
  // Initialize history for a timeline state
  initializeHistory: (stateId: string) => void;

  // Push a new action onto the state's history stack
  pushAction: (stateId: string, action: HistoryAction) => void;

  // Undo the last action for a specific state
  undo: (stateId: string) => GraphSnapshot | null;

  // Redo the last undone action for a specific state
  redo: (stateId: string) => GraphSnapshot | null;

  // Check if undo is available for a state
  canUndo: (stateId: string) => boolean;

  // Check if redo is available for a state
  canRedo: (stateId: string) => boolean;

  // Get the description of the next undo action for a state
  getUndoDescription: (stateId: string) => string | null;

  // Get the description of the next redo action for a state
  getRedoDescription: (stateId: string) => string | null;

  // Clear history for a specific state
  clearHistory: (stateId: string) => void;

  // Remove history for a state (when state is deleted)
  removeHistory: (stateId: string) => void;

  // Get history stats for debugging
  getHistoryStats: (stateId: string) => {
    undoCount: number;
    redoCount: number;
  } | null;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryStore & HistoryActions>(
  (set, get) => ({
    histories: new Map(),
    maxHistorySize: MAX_HISTORY_SIZE,

    initializeHistory: (stateId: string) => {
      set((state) => {
        const newHistories = new Map(state.histories);

        // Only initialize if not already present
        if (!newHistories.has(stateId)) {
          newHistories.set(stateId, {
            undoStack: [],
            redoStack: [],
          });
        }

        return { histories: newHistories };
      });
    },

    pushAction: (stateId: string, action: HistoryAction) => {
      set((state) => {
        const newHistories = new Map(state.histories);
        const history = newHistories.get(stateId);

        if (!history) {
          console.warn(`History not initialized for state ${stateId}`);
          return {};
        }

        console.log("📝 pushAction:", {
          description: action.description,
          actionStateNodes: action.graphState.nodes.length,
          actionStateEdges: action.graphState.edges.length,
          currentUndoStackSize: history.undoStack.length,
        });

        // The action.graphState contains the state BEFORE the action was performed
        // We push this to the undo stack so we can restore it if the user clicks undo
        const newUndoStack = [...history.undoStack];
        newUndoStack.push({
          description: action.description,
          timestamp: action.timestamp,
          graphState: JSON.parse(JSON.stringify(action.graphState)), // Deep copy
        });

        // Trim undo stack if it exceeds max size
        if (newUndoStack.length > state.maxHistorySize) {
          newUndoStack.shift(); // Remove oldest
        }

        // Clear redo stack when a new action is performed (can't redo after new action)
        const newRedoStack: HistoryAction[] = [];

        newHistories.set(stateId, {
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        });

        console.log("📝 after push:", {
          description: action.description,
          newUndoStackSize: newUndoStack.length,
          topOfStackNodes:
            newUndoStack[newUndoStack.length - 1]?.graphState.nodes.length,
          topOfStackEdges:
            newUndoStack[newUndoStack.length - 1]?.graphState.edges.length,
        });

        return { histories: newHistories };
      });
    },

    undo: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);

      if (!history || history.undoStack.length === 0) {
        return null;
      }

      console.log("⏪ undo:", {
        description:
          history.undoStack[history.undoStack.length - 1].description,
        undoStackSize: history.undoStack.length,
      });

      const newHistories = new Map(state.histories);

      // Pop the last action from undo stack - this is the state BEFORE the action
      const lastAction = history.undoStack[history.undoStack.length - 1];
      const newUndoStack = history.undoStack.slice(0, -1);

      // Get current state from graphStore and push it to redo stack
      const currentGraphState = useGraphStore.getState();
      const currentStateSnapshot: GraphSnapshot = {
        nodes: currentGraphState.nodes,
        edges: currentGraphState.edges,
        nodeTypes: currentGraphState.nodeTypes,
        edgeTypes: currentGraphState.edgeTypes,
      };

      const newRedoStack = [...history.redoStack];
      newRedoStack.push({
        description: lastAction.description,
        timestamp: Date.now(),
        graphState: JSON.parse(JSON.stringify(currentStateSnapshot)), // Deep copy
      });

      // Restore the previous state (deep copy)
      const restoredState: GraphSnapshot = JSON.parse(
        JSON.stringify(lastAction.graphState),
      );

      console.log("⏪ after undo:", {
        restoredStateNodes: restoredState.nodes.length,
        restoredStateEdges: restoredState.edges.length,
        undoStackSize: newUndoStack.length,
        redoStackSize: newRedoStack.length,
      });

      newHistories.set(stateId, {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      });

      set({ histories: newHistories });

      return restoredState;
    },

    redo: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);

      if (!history || history.redoStack.length === 0) {
        return null;
      }

      const newHistories = new Map(state.histories);

      // Pop the last action from redo stack
      const lastAction = history.redoStack[history.redoStack.length - 1];
      const newRedoStack = history.redoStack.slice(0, -1);

      // Get current state from graphStore and push it to undo stack
      const currentGraphState = useGraphStore.getState();
      const currentStateSnapshot: GraphSnapshot = {
        nodes: currentGraphState.nodes,
        edges: currentGraphState.edges,
        nodeTypes: currentGraphState.nodeTypes,
        edgeTypes: currentGraphState.edgeTypes,
      };

      const newUndoStack = [...history.undoStack];
      newUndoStack.push({
        description: lastAction.description,
        timestamp: Date.now(),
        graphState: JSON.parse(JSON.stringify(currentStateSnapshot)), // Deep copy
      });

      // Trim if exceeds max size
      if (newUndoStack.length > state.maxHistorySize) {
        newUndoStack.shift(); // Remove oldest
      }

      // Restore the future state (deep copy)
      const restoredState: GraphSnapshot = JSON.parse(
        JSON.stringify(lastAction.graphState),
      );

      newHistories.set(stateId, {
        undoStack: newUndoStack,
        redoStack: newRedoStack,
      });

      set({ histories: newHistories });

      return restoredState;
    },

    canUndo: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);
      return history ? history.undoStack.length > 0 : false;
    },

    canRedo: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);
      return history ? history.redoStack.length > 0 : false;
    },

    getUndoDescription: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);

      if (!history || history.undoStack.length === 0) {
        return null;
      }

      const lastAction = history.undoStack[history.undoStack.length - 1];
      return lastAction.description;
    },

    getRedoDescription: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);

      if (!history || history.redoStack.length === 0) {
        return null;
      }

      const lastAction = history.redoStack[history.redoStack.length - 1];
      return lastAction.description;
    },

    clearHistory: (stateId: string) => {
      set((state) => {
        const newHistories = new Map(state.histories);
        const history = newHistories.get(stateId);

        if (history) {
          newHistories.set(stateId, {
            undoStack: [],
            redoStack: [],
          });
        }

        return { histories: newHistories };
      });
    },

    removeHistory: (stateId: string) => {
      set((state) => {
        const newHistories = new Map(state.histories);
        newHistories.delete(stateId);
        return { histories: newHistories };
      });
    },

    getHistoryStats: (stateId: string) => {
      const state = get();
      const history = state.histories.get(stateId);

      if (!history) {
        return null;
      }

      return {
        undoCount: history.undoStack.length,
        redoCount: history.redoStack.length,
      };
    },
  }),
);
