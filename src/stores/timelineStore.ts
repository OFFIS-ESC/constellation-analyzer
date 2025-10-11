import { create } from "zustand";
import type {
  Timeline,
  ConstellationState,
  StateId,
  TimelineActions,
} from "../types/timeline";
import type { Actor, Relation } from "../types";
import type { SerializedActor, SerializedRelation } from "./persistence/types";
import { useGraphStore } from "./graphStore";
import { useWorkspaceStore } from "./workspaceStore";
import { useToastStore } from "./toastStore";
import { useHistoryStore } from "./historyStore";
import type { DocumentSnapshot } from "./historyStore";

/**
 * Timeline Store
 *
 * Manages multiple constellation states within a document.
 * Each document can have its own timeline with branching states.
 */

interface TimelineStore {
  // Map of documentId -> Timeline
  timelines: Map<string, Timeline>;

  // Currently active document's timeline
  activeDocumentId: string | null;
}

// Generate unique state ID
function generateStateId(): StateId {
  return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to push document state to history
function pushDocumentHistory(documentId: string, description: string) {
  const historyStore = useHistoryStore.getState();
  const timelineStore = useTimelineStore.getState();
  const graphStore = useGraphStore.getState();

  const timeline = timelineStore.timelines.get(documentId);
  if (!timeline) {
    console.warn('No timeline found for document');
    return;
  }

  const snapshot: DocumentSnapshot = {
    timeline: {
      states: new Map(timeline.states), // Clone the Map
      currentStateId: timeline.currentStateId,
      rootStateId: timeline.rootStateId,
    },
    nodeTypes: graphStore.nodeTypes,
    edgeTypes: graphStore.edgeTypes,
  };

  historyStore.pushAction(documentId, {
    description,
    timestamp: Date.now(),
    documentState: snapshot,
  });
}

export const useTimelineStore = create<TimelineStore & TimelineActions>(
  (set, get) => ({
    timelines: new Map(),
    activeDocumentId: null,

    initializeTimeline: (
      documentId: string,
      initialGraph: ConstellationState["graph"],
    ) => {
      const state = get();

      // Don't re-initialize if already exists
      if (state.timelines.has(documentId)) {
        console.warn(`Timeline already initialized for document ${documentId}`);
        return;
      }

      const rootStateId = generateStateId();
      const now = new Date().toISOString();

      const rootState: ConstellationState = {
        id: rootStateId,
        label: "Initial State",
        parentStateId: undefined,
        graph: JSON.parse(JSON.stringify(initialGraph)), // Deep copy
        createdAt: now,
        updatedAt: now,
      };

      const timeline: Timeline = {
        states: new Map([[rootStateId, rootState]]),
        currentStateId: rootStateId,
        rootStateId: rootStateId,
      };

      set((state) => {
        const newTimelines = new Map(state.timelines);
        newTimelines.set(documentId, timeline);
        return {
          timelines: newTimelines,
          activeDocumentId: documentId,
        };
      });

      console.log(`Timeline initialized for document ${documentId}`);
    },

    loadTimeline: (documentId: string, timeline: Timeline) => {
      set((state) => {
        const newTimelines = new Map(state.timelines);

        // Convert plain objects back to Maps if needed
        const statesMap =
          timeline.states instanceof Map
            ? timeline.states
            : new Map(
                Object.entries(timeline.states) as [
                  string,
                  ConstellationState,
                ][],
              );

        newTimelines.set(documentId, {
          ...timeline,
          states: statesMap,
        });

        return {
          timelines: newTimelines,
          activeDocumentId: documentId,
        };
      });
    },

    createState: (
      label: string,
      description?: string,
      cloneFromCurrent: boolean = true,
    ) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) {
        console.error("No active document");
        useToastStore.getState().showToast("No active document", "error");
        return "";
      }

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) {
        console.error("No timeline for active document");
        useToastStore.getState().showToast("Timeline not initialized", "error");
        return "";
      }

      // Push to history BEFORE making changes
      pushDocumentHistory(activeDocumentId, `Create State: ${label}`);

      const newStateId = generateStateId();
      const now = new Date().toISOString();

      // Get graph to clone (nodes and edges only, types are global)
      let graphToClone: ConstellationState["graph"];
      if (cloneFromCurrent) {
        // Clone from current graph state (nodes and edges only)
        const graphStore = useGraphStore.getState();
        graphToClone = {
          nodes: graphStore.nodes as unknown as SerializedActor[],
          edges: graphStore.edges as unknown as SerializedRelation[],
        };
      } else {
        // Empty graph
        graphToClone = {
          nodes: [],
          edges: [],
        };
      }

      const newState: ConstellationState = {
        id: newStateId,
        label,
        description,
        parentStateId: timeline.currentStateId, // Branch from current
        graph: JSON.parse(JSON.stringify(graphToClone)), // Deep copy
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;

        const newStates = new Map(timeline.states);
        newStates.set(newStateId, newState);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
          currentStateId: newStateId, // Switch to new state
        });

        return { timelines: newTimelines };
      });

      // Load new state's graph into graph store
      // Types come from the document and are already in the graph store
      useGraphStore.setState({
        nodes: newState.graph.nodes,
        edges: newState.graph.edges,
        // nodeTypes and edgeTypes remain unchanged (they're global per document)
      });

      // Mark document as dirty
      useWorkspaceStore.getState().markDocumentDirty(activeDocumentId);

      useToastStore.getState().showToast(`State "${label}" created`, "success");

      return newStateId;
    },

    switchToState: (stateId: StateId) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) {
        console.error("No active document");
        return;
      }

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) {
        console.error("No timeline for active document");
        return;
      }

      const targetState = timeline.states.get(stateId);
      if (!targetState) {
        console.error(`State ${stateId} not found`);
        useToastStore.getState().showToast("State not found", "error");
        return;
      }

      // Don't push history if already on this state
      if (timeline.currentStateId !== stateId) {
        // Push to history BEFORE making changes
        pushDocumentHistory(activeDocumentId, `Switch to State: ${targetState.label}`);
      }

      // Save current graph state to current state before switching (nodes and edges only)
      const currentState = timeline.states.get(timeline.currentStateId);
      if (currentState) {
        const graphStore = useGraphStore.getState();
        currentState.graph = {
          nodes: graphStore.nodes as unknown as SerializedActor[],
          edges: graphStore.edges as unknown as SerializedRelation[],
        };
        currentState.updatedAt = new Date().toISOString();
      }

      // Switch to target state
      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;

        newTimelines.set(activeDocumentId, {
          ...timeline,
          currentStateId: stateId,
        });

        return { timelines: newTimelines };
      });

      // Load target state's graph (nodes and edges only, types are global)
      useGraphStore.setState({
        nodes: targetState.graph.nodes as unknown as Actor[],
        edges: targetState.graph.edges as unknown as Relation[],
        // nodeTypes and edgeTypes remain unchanged (they're global per document)
      });
    },

    updateState: (
      stateId: StateId,
      updates: Partial<
        Pick<ConstellationState, "label" | "description" | "metadata">
      >,
    ) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return;

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return;

      const stateToUpdate = timeline.states.get(stateId);
      if (!stateToUpdate) {
        console.error(`State ${stateId} not found`);
        return;
      }

      // Push to history BEFORE making changes (only if label changed)
      if (updates.label && updates.label !== stateToUpdate.label) {
        pushDocumentHistory(activeDocumentId, `Rename State: ${stateToUpdate.label} → ${updates.label}`);
      } else if (updates.description || updates.metadata) {
        pushDocumentHistory(activeDocumentId, `Update State: ${stateToUpdate.label}`);
      }

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;
        const newStates = new Map(timeline.states);

        const updatedState = {
          ...stateToUpdate,
          ...updates,
          metadata: updates.metadata
            ? { ...stateToUpdate.metadata, ...updates.metadata }
            : stateToUpdate.metadata,
          updatedAt: new Date().toISOString(),
        };

        newStates.set(stateId, updatedState);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
        });

        return { timelines: newTimelines };
      });

      // Mark document as dirty
      useWorkspaceStore.getState().markDocumentDirty(activeDocumentId);
    },

    deleteState: (stateId: StateId) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return false;

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return false;

      // Can't delete root state
      if (stateId === timeline.rootStateId) {
        useToastStore.getState().showToast("Cannot delete root state", "error");
        return false;
      }

      // Can't delete current state
      if (stateId === timeline.currentStateId) {
        useToastStore
          .getState()
          .showToast(
            "Cannot delete current state. Switch to another state first.",
            "error",
          );
        return false;
      }

      // Check if state has children
      const children = get().getChildStates(stateId);
      if (children.length > 0) {
        const confirmed = window.confirm(
          `This state has ${children.length} child state(s). Delete anyway? Children will be orphaned.`,
        );
        if (!confirmed) return false;
      }

      const stateToDelete = timeline.states.get(stateId);
      const stateName = stateToDelete?.label || "Unknown";

      // Push to history BEFORE making changes
      pushDocumentHistory(activeDocumentId, `Delete State: ${stateName}`);

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;
        const newStates = new Map(timeline.states);

        newStates.delete(stateId);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
        });

        return { timelines: newTimelines };
      });

      // Mark document as dirty
      useWorkspaceStore.getState().markDocumentDirty(activeDocumentId);

      useToastStore
        .getState()
        .showToast(`State "${stateName}" deleted`, "info");

      return true;
    },

    duplicateState: (stateId: StateId, newLabel?: string) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) {
        console.error("No active document");
        return "";
      }

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) {
        console.error("No timeline for active document");
        return "";
      }

      const stateToDuplicate = timeline.states.get(stateId);
      if (!stateToDuplicate) {
        console.error(`State ${stateId} not found`);
        useToastStore.getState().showToast("State not found", "error");
        return "";
      }

      const newStateId = generateStateId();
      const now = new Date().toISOString();
      const label = newLabel || `${stateToDuplicate.label} (Copy)`;

      // Push to history BEFORE making changes
      pushDocumentHistory(activeDocumentId, `Duplicate State: ${label}`);

      const duplicatedState: ConstellationState = {
        ...stateToDuplicate,
        id: newStateId,
        label,
        parentStateId: stateToDuplicate.parentStateId, // Same parent as original (parallel)
        graph: JSON.parse(JSON.stringify(stateToDuplicate.graph)), // Deep copy
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;

        const newStates = new Map(timeline.states);
        newStates.set(newStateId, duplicatedState);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
        });

        return { timelines: newTimelines };
      });

      // Mark document as dirty
      useWorkspaceStore.getState().markDocumentDirty(activeDocumentId);

      useToastStore
        .getState()
        .showToast(`State "${label}" created`, "success");

      return newStateId;
    },

    duplicateStateAsChild: (stateId: StateId, newLabel?: string) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) {
        console.error("No active document");
        return "";
      }

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) {
        console.error("No timeline for active document");
        return "";
      }

      const stateToDuplicate = timeline.states.get(stateId);
      if (!stateToDuplicate) {
        console.error(`State ${stateId} not found`);
        useToastStore.getState().showToast("State not found", "error");
        return "";
      }

      const newStateId = generateStateId();
      const now = new Date().toISOString();
      const label = newLabel || `${stateToDuplicate.label} (Copy)`;

      // Push to history BEFORE making changes
      pushDocumentHistory(activeDocumentId, `Duplicate State as Child: ${label}`);

      const duplicatedState: ConstellationState = {
        ...stateToDuplicate,
        id: newStateId,
        label,
        parentStateId: stateId, // Original state becomes parent (series)
        graph: JSON.parse(JSON.stringify(stateToDuplicate.graph)), // Deep copy
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;

        const newStates = new Map(timeline.states);
        newStates.set(newStateId, duplicatedState);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
        });

        return { timelines: newTimelines };
      });

      // Mark document as dirty
      useWorkspaceStore.getState().markDocumentDirty(activeDocumentId);

      useToastStore
        .getState()
        .showToast(`State "${label}" created`, "success");

      return newStateId;
    },

    getState: (stateId: StateId) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return null;

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return null;

      return timeline.states.get(stateId) || null;
    },

    getChildStates: (stateId: StateId) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return [];

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return [];

      const children: ConstellationState[] = [];
      timeline.states.forEach((state) => {
        if (state.parentStateId === stateId) {
          children.push(state);
        }
      });

      return children;
    },

    getAllStates: () => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return [];

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return [];

      return Array.from(timeline.states.values());
    },

    saveCurrentGraph: (graph: ConstellationState["graph"]) => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return;

      const timeline = state.timelines.get(activeDocumentId);
      if (!timeline) return;

      const currentState = timeline.states.get(timeline.currentStateId);
      if (!currentState) return;

      set((state) => {
        const newTimelines = new Map(state.timelines);
        const timeline = newTimelines.get(activeDocumentId)!;
        const newStates = new Map(timeline.states);

        const updatedState = {
          ...currentState,
          graph: JSON.parse(JSON.stringify(graph)), // Deep copy
          updatedAt: new Date().toISOString(),
        };

        newStates.set(timeline.currentStateId, updatedState);

        newTimelines.set(activeDocumentId, {
          ...timeline,
          states: newStates,
        });

        return { timelines: newTimelines };
      });
    },

    clearTimeline: () => {
      const state = get();
      const { activeDocumentId } = state;

      if (!activeDocumentId) return;

      set((state) => {
        const newTimelines = new Map(state.timelines);
        newTimelines.delete(activeDocumentId);
        return { timelines: newTimelines };
      });
    },
  }),
);
