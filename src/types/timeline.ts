import type { SerializedActor, SerializedRelation } from '../stores/persistence/types';

/**
 * Timeline Types
 *
 * Support for multiple constellation states within a single document.
 * States can represent time-based evolution or alternative scenarios.
 */

export type StateId = string;

/**
 * A single constellation state - a snapshot of the graph at a point in time or scenario
 */
export interface ConstellationState {
  id: StateId;
  label: string;              // User-defined label (e.g., "Jan 2024", "Strategy A")
  description?: string;       // Optional detailed description
  parentStateId?: string;     // Parent state (null/undefined = root state)

  // Graph snapshot (nodes and edges only, types are global per document)
  graph: {
    nodes: SerializedActor[];
    edges: SerializedRelation[];
  };

  // Optional metadata - users can use these or ignore them
  metadata?: {
    date?: string;            // Optional ISO date string
    tags?: string[];          // Optional categorization tags
    color?: string;           // Optional color for visualization
    notes?: string;           // Optional presenter notes
  };

  // Timestamps
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

/**
 * Timeline - collection of constellation states with branching structure
 */
export interface Timeline {
  states: Map<StateId, ConstellationState>;  // All states by ID
  currentStateId: StateId;                   // Currently active state
  rootStateId: StateId;                      // Initial/root state
}

/**
 * Edge in the state graph (for visualization)
 */
export interface StateEdge {
  id: string;
  source: StateId;      // Parent state
  target: StateId;      // Child state
}

/**
 * Timeline actions
 */
export interface TimelineActions {
  // Initialize timeline for a document
  initializeTimeline: (documentId: string, initialGraph: ConstellationState['graph']) => void;

  // Load timeline from document
  loadTimeline: (documentId: string, timeline: Timeline) => void;

  // Create new state
  createState: (label: string, description?: string, cloneFromCurrent?: boolean) => StateId;

  // Switch to different state
  switchToState: (stateId: StateId) => void;

  // Update state metadata
  updateState: (stateId: StateId, updates: Partial<Pick<ConstellationState, 'label' | 'description' | 'metadata'>>) => void;

  // Delete state
  deleteState: (stateId: StateId) => boolean;

  // Duplicate state (parallel - same parent as original)
  duplicateState: (stateId: StateId, newLabel?: string) => StateId;

  // Duplicate state as child (series - original becomes parent)
  duplicateStateAsChild: (stateId: StateId, newLabel?: string) => StateId;

  // Get state by ID
  getState: (stateId: StateId) => ConstellationState | null;

  // Get child states
  getChildStates: (stateId: StateId) => ConstellationState[];

  // Get all states
  getAllStates: () => ConstellationState[];

  // Save current graph to current state
  saveCurrentGraph: (graph: ConstellationState['graph']) => void;

  // Clear timeline
  clearTimeline: () => void;
}
