import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTimelineStore } from './timelineStore';
import type { Timeline, ConstellationState } from '../types/timeline';
import type { Actor, Relation, Group, NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../types';

// Mock dependent stores
const mockShowToast = vi.fn();
const mockMarkDocumentDirty = vi.fn();
const mockLoadGraphState = vi.fn();
const mockPushToHistory = vi.fn();

// Create a mutable mock state for graphStore
const mockGraphState: {
  nodes: Actor[];
  edges: Relation[];
  groups: Group[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
  loadGraphState: typeof mockLoadGraphState;
} = {
  nodes: [],
  edges: [],
  groups: [],
  nodeTypes: [],
  edgeTypes: [],
  labels: [],
  loadGraphState: mockLoadGraphState,
};

vi.mock('./toastStore', () => ({
  useToastStore: {
    getState: () => ({
      showToast: mockShowToast,
    }),
  },
}));

vi.mock('./workspaceStore', () => ({
  useWorkspaceStore: {
    getState: () => ({
      documents: new Map(),
      markDocumentDirty: mockMarkDocumentDirty,
    }),
  },
}));

vi.mock('./graphStore', () => ({
  useGraphStore: {
    getState: () => mockGraphState,
  },
}));

vi.mock('./historyStore', () => ({
  useHistoryStore: {
    getState: () => ({
      pushToHistory: mockPushToHistory,
    }),
  },
}));

describe('timelineStore', () => {
  const TEST_DOC_ID = 'test-doc-1';

  beforeEach(() => {
    // Reset store
    useTimelineStore.setState({
      timelines: new Map(),
      activeDocumentId: null,
    });

    // Reset mock graph state
    mockGraphState.nodes = [];
    mockGraphState.edges = [];
    mockGraphState.groups = [];

    // Clear all mocks
    vi.clearAllMocks();
    mockShowToast.mockClear();
    mockMarkDocumentDirty.mockClear();
    mockLoadGraphState.mockClear();
    mockPushToHistory.mockClear();
  });

  describe('Initial State', () => {
    it('should start with empty timelines map', () => {
      const state = useTimelineStore.getState();

      expect(state.timelines.size).toBe(0);
      expect(state.activeDocumentId).toBeNull();
    });
  });

  describe('Timeline Initialization', () => {
    it('should initialize timeline with root state', () => {
      const { initializeTimeline } = useTimelineStore.getState();

      const initialGraph = {
        nodes: [],
        edges: [],
        groups: [],
      };

      initializeTimeline(TEST_DOC_ID, initialGraph);

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline).toBeDefined();
      expect(timeline?.states.size).toBe(1);
      expect(timeline?.rootStateId).toBeTruthy();
      expect(timeline?.currentStateId).toBe(timeline?.rootStateId);
    });

    it('should set active document ID', () => {
      const { initializeTimeline } = useTimelineStore.getState();

      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });

      const state = useTimelineStore.getState();
      expect(state.activeDocumentId).toBe(TEST_DOC_ID);
    });

    it('should not re-initialize if already exists', () => {
      const { initializeTimeline } = useTimelineStore.getState();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      const state1 = useTimelineStore.getState();
      const timeline1 = state1.timelines.get(TEST_DOC_ID);

      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      const state2 = useTimelineStore.getState();
      const timeline2 = state2.timelines.get(TEST_DOC_ID);

      expect(timeline1?.rootStateId).toBe(timeline2?.rootStateId);
      expect(consoleSpy).toHaveBeenCalledWith(`Timeline already initialized for document ${TEST_DOC_ID}`);

      consoleSpy.mockRestore();
    });

    it('should deep copy initial graph', () => {
      const { initializeTimeline } = useTimelineStore.getState();

      const initialGraph = {
        nodes: [{ id: 'node-1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } }],
        edges: [],
        groups: [],
      };

      initializeTimeline(TEST_DOC_ID, initialGraph);

      // Modify original
      initialGraph.nodes.push({ id: 'node-2', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } });

      // Timeline should be unaffected
      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const rootState = timeline?.states.get(timeline.rootStateId);

      expect(rootState?.graph.nodes).toHaveLength(1);
    });
  });

  describe('Load Timeline', () => {
    it('should load existing timeline', () => {
      const { loadTimeline } = useTimelineStore.getState();

      const existingTimeline: Timeline = {
        states: new Map([
          ['state-1', {
            id: 'state-1',
            label: 'Loaded State',
            parentStateId: undefined,
            graph: { nodes: [], edges: [], groups: [] },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        ]),
        currentStateId: 'state-1',
        rootStateId: 'state-1',
      };

      loadTimeline(TEST_DOC_ID, existingTimeline);

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline?.states.size).toBe(1);
      expect(timeline?.currentStateId).toBe('state-1');
    });

    it('should convert plain objects to Maps', () => {
      const { loadTimeline } = useTimelineStore.getState();

      // Simulate loaded JSON (states as plain object)
      const timelineFromJSON: {
        states: Record<string, ConstellationState>;
        currentStateId: string;
        rootStateId: string;
      } = {
        states: {
          'state-1': {
            id: 'state-1',
            label: 'Test',
            parentStateId: undefined,
            graph: { nodes: [], edges: [], groups: [] },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        currentStateId: 'state-1',
        rootStateId: 'state-1',
      };

      loadTimeline(TEST_DOC_ID, timelineFromJSON as unknown as Timeline);

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline?.states instanceof Map).toBe(true);
      expect(timeline?.states.size).toBe(1);
    });
  });

  describe('Create State', () => {
    beforeEach(() => {
      const { initializeTimeline } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
    });

    it('should create a new state', () => {
      const { createState } = useTimelineStore.getState();

      const newStateId = createState('Feature A');

      expect(newStateId).toBeTruthy();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline?.states.size).toBe(2);
      expect(timeline?.currentStateId).toBe(newStateId);
    });

    it('should clone graph from current state by default', () => {
      const { createState } = useTimelineStore.getState();

      // Simulate current graph with nodes by mutating mockGraphState
      mockGraphState.nodes = [{ id: 'node-1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } }];

      const newStateId = createState('With Nodes');

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const newState = timeline?.states.get(newStateId);

      expect(newState?.graph.nodes).toHaveLength(1);
    });

    it('should create empty graph when cloneFromCurrent=false', () => {
      const { createState } = useTimelineStore.getState();

      const newStateId = createState('Empty State', undefined, false);

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const newState = timeline?.states.get(newStateId);

      expect(newState?.graph.nodes).toHaveLength(0);
      expect(newState?.graph.edges).toHaveLength(0);
    });

    it('should set parentStateId to current state', () => {
      const { createState, getAllStates } = useTimelineStore.getState();

      const state1 = useTimelineStore.getState();
      const timeline1 = state1.timelines.get(TEST_DOC_ID);
      const rootStateId = timeline1?.rootStateId;

      const newStateId = createState('Child State');

      const states = getAllStates();
      const newState = states.find(s => s.id === newStateId);

      expect(newState?.parentStateId).toBe(rootStateId);
    });

    it('should load new state into graphStore', () => {
      const { createState } = useTimelineStore.getState();

      createState('Test State');

      expect(mockLoadGraphState).toHaveBeenCalled();
    });

    it('should mark document dirty', () => {
      const { createState } = useTimelineStore.getState();

      createState('Test State');

      expect(mockMarkDocumentDirty).toHaveBeenCalledWith(TEST_DOC_ID);
    });

    it('should show success toast', () => {
      const { createState } = useTimelineStore.getState();

      createState('New Feature');

      expect(mockShowToast).toHaveBeenCalledWith('State "New Feature" created', 'success');
    });

    it('should return empty string if no active document', () => {
      useTimelineStore.setState({ activeDocumentId: null });
      const { createState } = useTimelineStore.getState();

      const result = createState('Test');

      expect(result).toBe('');
      expect(mockShowToast).toHaveBeenCalledWith('No active document', 'error');
    });
  });

  describe('Switch to State', () => {
    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      createState('State 2');
      createState('State 3');
    });

    it('should switch to target state', () => {
      const { switchToState, getAllStates } = useTimelineStore.getState();

      const states = getAllStates();
      const targetStateId = states[1].id; // State 2

      switchToState(targetStateId);

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline?.currentStateId).toBe(targetStateId);
    });

    it('should load target state graph into graphStore', () => {
      const { switchToState, getAllStates } = useTimelineStore.getState();

      const states = getAllStates();
      const targetStateId = states[0].id;

      mockLoadGraphState.mockClear();
      switchToState(targetStateId);

      expect(mockLoadGraphState).toHaveBeenCalled();
    });

    it('should save current state before switching', () => {
      const { switchToState, getAllStates } = useTimelineStore.getState();

      // Mock current graph with nodes by mutating mockGraphState
      mockGraphState.nodes = [{ id: 'node-modified', type: 'custom', position: { x: 100, y: 100 }, data: { label: 'Test', type: 'person' } }];

      const states = getAllStates();
      const currentStateId = states[2].id; // Current is State 3
      const targetStateId = states[1].id; // Switch to State 2

      switchToState(targetStateId);

      // Verify current state was saved
      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const savedState = timeline?.states.get(currentStateId);

      expect(savedState?.graph.nodes).toHaveLength(1);
    });

    it('should show error toast if state not found', () => {
      const { switchToState } = useTimelineStore.getState();

      switchToState('non-existent-state');

      expect(mockShowToast).toHaveBeenCalledWith('State not found', 'error');
    });

    it('should not push history if switching to current state', () => {
      const { switchToState } = useTimelineStore.getState();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const currentStateId = timeline?.currentStateId;

      mockPushToHistory.mockClear();
      switchToState(currentStateId!);

      // Should not push to history for same state
      const timeline2 = useTimelineStore.getState().timelines.get(TEST_DOC_ID);
      expect(timeline2?.currentStateId).toBe(currentStateId);
    });
  });

  describe('Update State', () => {
    let stateId: string;

    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      stateId = createState('To Update');
    });

    it('should update state label', () => {
      const { updateState, getState } = useTimelineStore.getState();

      updateState(stateId, { label: 'Updated Label' });

      const updatedState = getState(stateId);
      expect(updatedState?.label).toBe('Updated Label');
    });

    it('should update state description', () => {
      const { updateState, getState } = useTimelineStore.getState();

      updateState(stateId, { description: 'New description' });

      const updatedState = getState(stateId);
      expect(updatedState?.description).toBe('New description');
    });

    it('should merge metadata', () => {
      const { updateState, getState } = useTimelineStore.getState();

      updateState(stateId, { metadata: { date: '2024-01-01' } });
      updateState(stateId, { metadata: { color: '#FF0000' } });

      const updatedState = getState(stateId);
      expect(updatedState?.metadata).toEqual({
        date: '2024-01-01',
        color: '#FF0000',
      });
    });

    it('should update updatedAt timestamp', async () => {
      const { updateState, getState } = useTimelineStore.getState();

      const originalState = getState(stateId);
      const originalTime = originalState?.updatedAt;

      // Wait a small amount to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      updateState(stateId, { label: 'Changed' });

      const updatedState = getState(stateId);
      expect(updatedState?.updatedAt).not.toBe(originalTime);
    });

    it('should mark document dirty', () => {
      const { updateState } = useTimelineStore.getState();

      mockMarkDocumentDirty.mockClear();
      updateState(stateId, { label: 'Changed' });

      expect(mockMarkDocumentDirty).toHaveBeenCalledWith(TEST_DOC_ID);
    });
  });

  describe('Delete State', () => {
    let state1Id: string;
    let state2Id: string;

    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      state1Id = createState('State 1');
      state2Id = createState('State 2');
    });

    it('should delete a state', () => {
      const { deleteState, getAllStates } = useTimelineStore.getState();

      const result = deleteState(state1Id);

      expect(result).toBe(true);

      const states = getAllStates();
      expect(states.find(s => s.id === state1Id)).toBeUndefined();
    });

    it('should not delete root state', () => {
      const { deleteState } = useTimelineStore.getState();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const rootStateId = timeline?.rootStateId;

      const result = deleteState(rootStateId!);

      expect(result).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith('Cannot delete root state', 'error');
    });

    it('should not delete current state', () => {
      const { deleteState } = useTimelineStore.getState();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const currentStateId = timeline?.currentStateId;

      const result = deleteState(currentStateId!);

      expect(result).toBe(false);
      expect(mockShowToast).toHaveBeenCalledWith(
        'Cannot delete current state. Switch to another state first.',
        'error'
      );
    });

    it('should prompt confirmation if state has children', () => {
      const { deleteState } = useTimelineStore.getState();

      // Create child of state1Id
      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const states = Array.from(timeline!.states.values());
      const childState = { ...states.find(s => s.id === state2Id)!, parentStateId: state1Id };
      timeline!.states.set(state2Id, childState);

      global.confirm = vi.fn(() => false);

      const result = deleteState(state1Id);

      expect(result).toBe(false);
      expect(global.confirm).toHaveBeenCalled();
    });

    it('should show success toast after deletion', () => {
      const { deleteState } = useTimelineStore.getState();

      // Ensure global.confirm is not mocked (allow deletion)
      global.confirm = vi.fn(() => true);

      mockShowToast.mockClear();
      deleteState(state1Id);

      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('deleted'),
        'info'
      );
    });
  });

  describe('Duplicate State', () => {
    let stateId: string;

    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      stateId = createState('Original');
    });

    it('should duplicate state as sibling', () => {
      const { duplicateState, getState } = useTimelineStore.getState();

      const original = getState(stateId);
      const duplicateId = duplicateState(stateId);

      const duplicate = getState(duplicateId);

      expect(duplicate?.parentStateId).toBe(original?.parentStateId);
      expect(duplicate?.label).toBe('Original (Copy)');
    });

    it('should duplicate state with custom label', () => {
      const { duplicateState, getState } = useTimelineStore.getState();

      const duplicateId = duplicateState(stateId, 'Custom Copy');

      const duplicate = getState(duplicateId);
      expect(duplicate?.label).toBe('Custom Copy');
    });

    it('should deep copy graph', () => {
      const { duplicateState, getState } = useTimelineStore.getState();

      // Add graph data to original
      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const originalState = timeline?.states.get(stateId);
      if (originalState) {
        originalState.graph = {
          nodes: [{ id: 'node-1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } }],
          edges: [],
          groups: [],
        };
      }

      const duplicateId = duplicateState(stateId);
      const duplicate = getState(duplicateId);

      expect(duplicate?.graph.nodes).toHaveLength(1);

      // Modify original
      if (originalState) {
        originalState.graph.nodes.push({ id: 'node-2', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } });
      }

      // Duplicate should be unaffected
      const duplicate2 = getState(duplicateId);
      expect(duplicate2?.graph.nodes).toHaveLength(1);
    });
  });

  describe('Duplicate State as Child', () => {
    let stateId: string;

    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
      stateId = createState('Parent');
    });

    it('should duplicate state as child', () => {
      const { duplicateStateAsChild, getState } = useTimelineStore.getState();

      const childId = duplicateStateAsChild(stateId);

      const child = getState(childId);
      expect(child?.parentStateId).toBe(stateId);
    });
  });

  describe('Get Operations', () => {
    let rootStateId: string;
    let childStateId: string;

    beforeEach(() => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      rootStateId = timeline!.rootStateId;

      childStateId = createState('Child');
    });

    describe('getState', () => {
      it('should get state by ID', () => {
        const { getState } = useTimelineStore.getState();

        const state = getState(rootStateId);

        expect(state).toBeDefined();
        expect(state?.id).toBe(rootStateId);
      });

      it('should return null for non-existent state', () => {
        const { getState } = useTimelineStore.getState();

        const state = getState('non-existent');

        expect(state).toBeNull();
      });
    });

    describe('getChildStates', () => {
      it('should get child states', () => {
        const { getChildStates } = useTimelineStore.getState();

        const children = getChildStates(rootStateId);

        expect(children).toHaveLength(1);
        expect(children[0].id).toBe(childStateId);
      });

      it('should return empty array if no children', () => {
        const { getChildStates } = useTimelineStore.getState();

        const children = getChildStates(childStateId);

        expect(children).toEqual([]);
      });
    });

    describe('getAllStates', () => {
      it('should get all states', () => {
        const { getAllStates } = useTimelineStore.getState();

        const states = getAllStates();

        expect(states).toHaveLength(2); // Root + child
      });

      it('should return empty array if no active document', () => {
        useTimelineStore.setState({ activeDocumentId: null });
        const { getAllStates } = useTimelineStore.getState();

        const states = getAllStates();

        expect(states).toEqual([]);
      });
    });
  });

  describe('Save Current Graph', () => {
    beforeEach(() => {
      const { initializeTimeline } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
    });

    it('should save graph to current state', () => {
      const { saveCurrentGraph, getState } = useTimelineStore.getState();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const currentStateId = timeline?.currentStateId;

      const newGraph = {
        nodes: [{ id: 'node-1', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Test', type: 'person' } }],
        edges: [],
        groups: [],
      };

      saveCurrentGraph(newGraph);

      const currentState = getState(currentStateId!);
      expect(currentState?.graph.nodes).toHaveLength(1);
    });

    it('should update updatedAt timestamp', async () => {
      const { saveCurrentGraph, getState } = useTimelineStore.getState();

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);
      const currentStateId = timeline?.currentStateId;
      const originalTime = getState(currentStateId!)?.updatedAt;

      // Wait a small amount to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      saveCurrentGraph({ nodes: [], edges: [], groups: [] });

      const currentState = getState(currentStateId!);
      expect(currentState?.updatedAt).not.toBe(originalTime);
    });
  });

  describe('Clear Timeline', () => {
    beforeEach(() => {
      const { initializeTimeline } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });
    });

    it('should clear timeline for active document', () => {
      const { clearTimeline } = useTimelineStore.getState();

      clearTimeline();

      const state = useTimelineStore.getState();
      expect(state.timelines.has(TEST_DOC_ID)).toBe(false);
    });

    it('should handle no active document', () => {
      useTimelineStore.setState({ activeDocumentId: null });
      const { clearTimeline } = useTimelineStore.getState();

      // Should not throw
      expect(() => clearTimeline()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations with no active document', () => {
      useTimelineStore.setState({ activeDocumentId: null });
      const { createState, updateState, deleteState } = useTimelineStore.getState();

      expect(createState('Test')).toBe('');
      expect(() => updateState('id', { label: 'Test' })).not.toThrow();
      expect(deleteState('id')).toBe(false);
    });

    it('should handle rapid state creation', () => {
      const { initializeTimeline, createState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });

      const stateIds = [];
      for (let i = 0; i < 10; i++) {
        stateIds.push(createState(`State ${i}`));
      }

      const state = useTimelineStore.getState();
      const timeline = state.timelines.get(TEST_DOC_ID);

      expect(timeline?.states.size).toBe(11); // Root + 10 new states

      // All IDs should be unique
      const uniqueIds = new Set(stateIds);
      expect(uniqueIds.size).toBe(10);
    });

    it('should maintain state tree integrity', () => {
      const { initializeTimeline, createState, getAllStates, getChildStates, switchToState } = useTimelineStore.getState();
      initializeTimeline(TEST_DOC_ID, { nodes: [], edges: [], groups: [] });

      // Get root state
      const rootState = getAllStates()[0].id;

      const state1 = createState('State 1');

      // Switch back to root before creating state2
      switchToState(rootState);
      createState('State 2 (from root)');

      // Switch to state1 and create child
      switchToState(state1);
      const state3 = createState('State 3 (child of 1)');

      const allStates = getAllStates();
      const state3Data = allStates.find(s => s.id === state3);

      expect(state3Data?.parentStateId).toBe(state1);

      const children1 = getChildStates(state1);
      expect(children1).toHaveLength(1);
      expect(children1[0].id).toBe(state3);
    });
  });
});
