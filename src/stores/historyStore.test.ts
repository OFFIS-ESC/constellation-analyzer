import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistoryStore, type DocumentSnapshot, type HistoryAction } from './historyStore';
import { mockNodeTypes, mockEdgeTypes, mockLabels } from '../test/mocks';
import type { ConstellationDocument } from './persistence/types';
import type { Timeline } from '../types/timeline';

// Helper to create a mock snapshot
function createMockSnapshot(stateId: string = 'state_1'): DocumentSnapshot {
  const now = new Date().toISOString();

  return {
    timeline: {
      states: new Map([
        [stateId, {
          id: stateId,
          label: 'Test State',
          parentStateId: undefined,
          graph: {
            nodes: [],
            edges: [],
            groups: [],
          },
          createdAt: now,
          updatedAt: now,
        }],
      ]),
      currentStateId: stateId,
      rootStateId: stateId,
    },
    nodeTypes: [...mockNodeTypes],
    edgeTypes: [...mockEdgeTypes],
    labels: [...mockLabels],
  };
}

// Helper to create a mock document
function createMockDocument(): ConstellationDocument {
  const now = new Date().toISOString();
  const stateId = 'state_1';

  return {
    metadata: {
      version: '1.0.0',
      appName: 'Constellation Analyzer',
      createdAt: now,
      updatedAt: now,
      lastSavedBy: 'browser',
      documentId: 'test-doc',
      title: 'Test Doc',
    },
    nodeTypes: mockNodeTypes,
    edgeTypes: mockEdgeTypes,
    labels: mockLabels,
    timeline: {
      states: {
        [stateId]: {
          id: stateId,
          label: 'Initial State',
          parentStateId: undefined,
          graph: {
            nodes: [],
            edges: [],
            groups: [],
          },
          createdAt: now,
          updatedAt: now,
        },
      },
      currentStateId: stateId,
      rootStateId: stateId,
    },
  };
}

// Helper to create mock timeline
function createMockTimeline(): Timeline {
  const stateId = 'state_1';
  const now = new Date().toISOString();

  return {
    states: new Map([
      [stateId, {
        id: stateId,
        label: 'Initial State',
        parentStateId: undefined,
        graph: {
          nodes: [],
          edges: [],
          groups: [],
        },
        createdAt: now,
        updatedAt: now,
      }],
    ]),
    currentStateId: stateId,
    rootStateId: stateId,
  };
}

describe('historyStore', () => {
  const TEST_DOC_ID = 'test-doc-1';

  beforeEach(() => {
    // Reset store to initial state
    useHistoryStore.setState({
      histories: new Map(),
      maxHistorySize: 50,
    });
  });

  describe('Initial State', () => {
    it('should start with empty histories map', () => {
      const state = useHistoryStore.getState();

      expect(state.histories.size).toBe(0);
      expect(state.maxHistorySize).toBe(50);
    });
  });

  describe('History Initialization', () => {
    it('should initialize history for a document', () => {
      const { initializeHistory } = useHistoryStore.getState();

      initializeHistory(TEST_DOC_ID);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history).toBeDefined();
      expect(history?.undoStack).toEqual([]);
      expect(history?.redoStack).toEqual([]);
    });

    it('should not re-initialize if already exists', () => {
      const { initializeHistory, pushAction } = useHistoryStore.getState();

      initializeHistory(TEST_DOC_ID);

      const mockAction: HistoryAction = {
        description: 'Test Action',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };
      pushAction(TEST_DOC_ID, mockAction);

      initializeHistory(TEST_DOC_ID); // Try to re-initialize

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      // Should still have the action we pushed
      expect(history?.undoStack).toHaveLength(1);
    });

    it('should support multiple documents', () => {
      const { initializeHistory } = useHistoryStore.getState();

      initializeHistory('doc-1');
      initializeHistory('doc-2');
      initializeHistory('doc-3');

      const state = useHistoryStore.getState();
      expect(state.histories.size).toBe(3);
      expect(state.histories.has('doc-1')).toBe(true);
      expect(state.histories.has('doc-2')).toBe(true);
      expect(state.histories.has('doc-3')).toBe(true);
    });
  });

  describe('Push Action', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should push action to undo stack', () => {
      const { pushAction } = useHistoryStore.getState();

      const mockAction: HistoryAction = {
        description: 'Add Node',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };

      pushAction(TEST_DOC_ID, mockAction);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(1);
      expect(history?.undoStack[0].description).toBe('Add Node');
    });

    it('should clear redo stack when new action is pushed', () => {
      const { pushAction, undo } = useHistoryStore.getState();

      // Push initial action
      const action1: HistoryAction = {
        description: 'Action 1',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action1);

      // Undo to create redo stack
      const snapshot1 = createMockSnapshot('state_2');
      undo(TEST_DOC_ID, snapshot1);

      // Verify redo stack has items
      let state = useHistoryStore.getState();
      let history = state.histories.get(TEST_DOC_ID);
      expect(history?.redoStack).toHaveLength(1);

      // Push new action
      const action2: HistoryAction = {
        description: 'Action 2',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_3'),
      };
      pushAction(TEST_DOC_ID, action2);

      // Redo stack should be cleared
      state = useHistoryStore.getState();
      history = state.histories.get(TEST_DOC_ID);
      expect(history?.redoStack).toHaveLength(0);
    });

    it('should deep copy the snapshot', () => {
      const { pushAction } = useHistoryStore.getState();

      const originalSnapshot = createMockSnapshot();
      const mockAction: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: originalSnapshot,
      };

      pushAction(TEST_DOC_ID, mockAction);

      // Modify original
      originalSnapshot.nodeTypes.push({
        id: 'new-type',
        label: 'New',
        color: '#000',
        shape: 'circle',
        icon: 'Test',
        description: 'Test',
      });

      // Stored snapshot should be unaffected
      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);
      expect(history?.undoStack[0].documentState.nodeTypes).toHaveLength(2);
    });

    it('should handle Map serialization correctly', () => {
      const { pushAction } = useHistoryStore.getState();

      const snapshot = createMockSnapshot();
      const mockAction: HistoryAction = {
        description: 'Test Map',
        timestamp: Date.now(),
        documentState: snapshot,
      };

      pushAction(TEST_DOC_ID, mockAction);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);
      const storedSnapshot = history?.undoStack[0].documentState;

      // Should still have the state in the timeline
      expect(storedSnapshot?.timeline.states).toBeDefined();
    });

    it('should warn if history not initialized', () => {
      const { pushAction } = useHistoryStore.getState();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const mockAction: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };

      pushAction('non-existent-doc', mockAction);

      expect(consoleSpy).toHaveBeenCalledWith('History not initialized for document non-existent-doc');
      consoleSpy.mockRestore();
    });
  });

  describe('Push to History (High-Level)', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should create snapshot and push to history', () => {
      const { pushToHistory } = useHistoryStore.getState();

      const document = createMockDocument();
      const timeline = createMockTimeline();
      const graphStore = {
        nodes: [],
        edges: [],
        groups: [],
      };

      pushToHistory(TEST_DOC_ID, 'Test Action', document, timeline, graphStore);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(1);
      expect(history?.undoStack[0].description).toBe('Test Action');
    });

    it('should sync graph state before creating snapshot', () => {
      const { pushToHistory } = useHistoryStore.getState();

      const document = createMockDocument();
      const timeline = createMockTimeline();
      const graphStore = {
        nodes: [
          {
            id: 'node-1',
            type: 'custom',
            position: { x: 100, y: 100 },
            data: { actorType: 'person', name: 'Test' },
          },
        ],
        edges: [],
        groups: [],
      };

      pushToHistory(TEST_DOC_ID, 'Add Node', document, timeline, graphStore);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);
      const snapshot = history?.undoStack[0].documentState;

      // Snapshot is serialized (Map -> object) during pushAction
      // Need to access states as a record object, not a Map
      const states = snapshot?.timeline.states as Record<string, unknown>;
      const currentStateId = snapshot?.timeline.currentStateId;
      const currentState = states[currentStateId] as { graph: { nodes: unknown[] } };

      expect(currentState?.graph.nodes).toHaveLength(1);
    });
  });

  describe('History Stack Limits', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should trim undo stack when exceeding max size', () => {
      const { pushAction } = useHistoryStore.getState();

      // Push 51 actions (max is 50)
      for (let i = 0; i < 51; i++) {
        const mockAction: HistoryAction = {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        };
        pushAction(TEST_DOC_ID, mockAction);
      }

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      // Should have exactly 50 items
      expect(history?.undoStack).toHaveLength(50);

      // First action should be removed (Action 0)
      expect(history?.undoStack[0].description).toBe('Action 1');

      // Last action should be Action 50
      expect(history?.undoStack[49].description).toBe('Action 50');
    });

    it('should trim undo stack in redo operation', () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      // Fill to max
      for (let i = 0; i < 50; i++) {
        const mockAction: HistoryAction = {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        };
        pushAction(TEST_DOC_ID, mockAction);
      }

      // Undo one
      const currentSnapshot = createMockSnapshot('current');
      undo(TEST_DOC_ID, currentSnapshot);

      // Redo - should trim if needed
      redo(TEST_DOC_ID, createMockSnapshot('current2'));

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Undo Operation', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should restore previous state', () => {
      const { pushAction, undo } = useHistoryStore.getState();

      const snapshot1 = createMockSnapshot('state_1');
      const action: HistoryAction = {
        description: 'Change State',
        timestamp: Date.now(),
        documentState: snapshot1,
      };
      pushAction(TEST_DOC_ID, action);

      const currentSnapshot = createMockSnapshot('state_2');
      const restored = undo(TEST_DOC_ID, currentSnapshot);

      expect(restored).toBeDefined();
      expect(restored?.timeline.currentStateId).toBe('state_1');
    });

    it('should move action to redo stack', () => {
      const { pushAction, undo } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Test Action',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);

      undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(0);
      expect(history?.redoStack).toHaveLength(1);
      expect(history?.redoStack[0].description).toBe('Test Action');
    });

    it('should return null if nothing to undo', () => {
      const { undo } = useHistoryStore.getState();

      const result = undo(TEST_DOC_ID, createMockSnapshot());

      expect(result).toBeNull();
    });

    it('should return null for non-existent document', () => {
      const { undo } = useHistoryStore.getState();

      const result = undo('non-existent', createMockSnapshot());

      expect(result).toBeNull();
    });

    it('should reconstruct Map from serialized data', () => {
      const { pushAction, undo } = useHistoryStore.getState();

      const snapshot = createMockSnapshot('state_1');
      const action: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: snapshot,
      };
      pushAction(TEST_DOC_ID, action);

      const restored = undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      expect(restored?.timeline.states instanceof Map).toBe(true);
      expect(restored?.timeline.states.size).toBe(1);
    });
  });

  describe('Redo Operation', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should restore future state', () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      // Push action and undo to create redo stack
      const action: HistoryAction = {
        description: 'Test Action',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);
      undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      // Now redo
      const restored = redo(TEST_DOC_ID, createMockSnapshot('state_1'));

      expect(restored).toBeDefined();
      expect(restored?.timeline.currentStateId).toBe('state_2');
    });

    it('should move action back to undo stack', () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Test Action',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);
      undo(TEST_DOC_ID, createMockSnapshot('state_2'));
      redo(TEST_DOC_ID, createMockSnapshot('state_1'));

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(1);
      expect(history?.redoStack).toHaveLength(0);
    });

    it('should return null if nothing to redo', () => {
      const { redo } = useHistoryStore.getState();

      const result = redo(TEST_DOC_ID, createMockSnapshot());

      expect(result).toBeNull();
    });

    it('should return null for non-existent document', () => {
      const { redo } = useHistoryStore.getState();

      const result = redo('non-existent', createMockSnapshot());

      expect(result).toBeNull();
    });
  });

  describe('Can Undo/Redo', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should return false when no history', () => {
      const { canUndo, canRedo } = useHistoryStore.getState();

      expect(canUndo(TEST_DOC_ID)).toBe(false);
      expect(canRedo(TEST_DOC_ID)).toBe(false);
    });

    it('should return true when undo available', () => {
      const { pushAction, canUndo } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };
      pushAction(TEST_DOC_ID, action);

      expect(canUndo(TEST_DOC_ID)).toBe(true);
    });

    it('should return true when redo available', () => {
      const { pushAction, undo, canRedo } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);
      undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      expect(canRedo(TEST_DOC_ID)).toBe(true);
    });

    it('should return false for non-existent document', () => {
      const { canUndo, canRedo } = useHistoryStore.getState();

      expect(canUndo('non-existent')).toBe(false);
      expect(canRedo('non-existent')).toBe(false);
    });
  });

  describe('Get Descriptions', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should return undo description', () => {
      const { pushAction, getUndoDescription } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Add Person Node',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };
      pushAction(TEST_DOC_ID, action);

      expect(getUndoDescription(TEST_DOC_ID)).toBe('Add Person Node');
    });

    it('should return redo description', () => {
      const { pushAction, undo, getRedoDescription } = useHistoryStore.getState();

      const action: HistoryAction = {
        description: 'Delete Edge',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);
      undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      expect(getRedoDescription(TEST_DOC_ID)).toBe('Delete Edge');
    });

    it('should return null when no undo available', () => {
      const { getUndoDescription } = useHistoryStore.getState();

      expect(getUndoDescription(TEST_DOC_ID)).toBeNull();
    });

    it('should return null when no redo available', () => {
      const { getRedoDescription } = useHistoryStore.getState();

      expect(getRedoDescription(TEST_DOC_ID)).toBeNull();
    });

    it('should return null for non-existent document', () => {
      const { getUndoDescription, getRedoDescription } = useHistoryStore.getState();

      expect(getUndoDescription('non-existent')).toBeNull();
      expect(getRedoDescription('non-existent')).toBeNull();
    });
  });

  describe('Clear History', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should clear both stacks', () => {
      const { pushAction, undo, clearHistory } = useHistoryStore.getState();

      // Create history
      const action: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_1'),
      };
      pushAction(TEST_DOC_ID, action);
      undo(TEST_DOC_ID, createMockSnapshot('state_2'));

      clearHistory(TEST_DOC_ID);

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(0);
      expect(history?.redoStack).toHaveLength(0);
    });

    it('should not affect other documents', () => {
      const { initializeHistory, pushAction, clearHistory } = useHistoryStore.getState();

      initializeHistory('doc-2');

      const action: HistoryAction = {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      };
      pushAction(TEST_DOC_ID, action);
      pushAction('doc-2', action);

      clearHistory(TEST_DOC_ID);

      const state = useHistoryStore.getState();
      expect(state.histories.get(TEST_DOC_ID)?.undoStack).toHaveLength(0);
      expect(state.histories.get('doc-2')?.undoStack).toHaveLength(1);
    });
  });

  describe('Remove History', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should remove document history completely', () => {
      const { removeHistory } = useHistoryStore.getState();

      removeHistory(TEST_DOC_ID);

      const state = useHistoryStore.getState();
      expect(state.histories.has(TEST_DOC_ID)).toBe(false);
    });

    it('should not affect other documents', () => {
      const { initializeHistory, removeHistory } = useHistoryStore.getState();

      initializeHistory('doc-2');
      removeHistory(TEST_DOC_ID);

      const state = useHistoryStore.getState();
      expect(state.histories.has(TEST_DOC_ID)).toBe(false);
      expect(state.histories.has('doc-2')).toBe(true);
    });
  });

  describe('History Stats', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should return correct stats', () => {
      const { pushAction, undo, getHistoryStats } = useHistoryStore.getState();

      // Push 3 actions
      for (let i = 0; i < 3; i++) {
        const action: HistoryAction = {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        };
        pushAction(TEST_DOC_ID, action);
      }

      // Undo 1
      undo(TEST_DOC_ID, createMockSnapshot('current'));

      const stats = getHistoryStats(TEST_DOC_ID);

      expect(stats?.undoCount).toBe(2);
      expect(stats?.redoCount).toBe(1);
    });

    it('should return null for non-existent document', () => {
      const { getHistoryStats } = useHistoryStore.getState();

      const stats = getHistoryStats('non-existent');

      expect(stats).toBeNull();
    });
  });

  describe('Complex Undo/Redo Sequences', () => {
    beforeEach(() => {
      const { initializeHistory } = useHistoryStore.getState();
      initializeHistory(TEST_DOC_ID);
    });

    it('should handle multiple undo/redo cycles', () => {
      const { pushAction, undo, redo } = useHistoryStore.getState();

      // Push 3 actions
      for (let i = 1; i <= 3; i++) {
        const action: HistoryAction = {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        };
        pushAction(TEST_DOC_ID, action);
      }

      // Undo 2, Redo 1, Undo 1
      undo(TEST_DOC_ID, createMockSnapshot('current1'));
      undo(TEST_DOC_ID, createMockSnapshot('current2'));
      redo(TEST_DOC_ID, createMockSnapshot('current3'));
      undo(TEST_DOC_ID, createMockSnapshot('current4'));

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      expect(history?.undoStack).toHaveLength(1);
      expect(history?.redoStack).toHaveLength(2);
    });

    it('should clear redo after new action in middle of history', () => {
      const { pushAction, undo } = useHistoryStore.getState();

      // Push 3 actions
      for (let i = 1; i <= 3; i++) {
        const action: HistoryAction = {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        };
        pushAction(TEST_DOC_ID, action);
      }

      // Undo 2 to create redo stack
      undo(TEST_DOC_ID, createMockSnapshot('current1'));
      undo(TEST_DOC_ID, createMockSnapshot('current2'));

      let state = useHistoryStore.getState();
      let history = state.histories.get(TEST_DOC_ID);
      expect(history?.redoStack).toHaveLength(2);

      // Push new action - should clear redo
      const newAction: HistoryAction = {
        description: 'New Branch',
        timestamp: Date.now(),
        documentState: createMockSnapshot('state_new'),
      };
      pushAction(TEST_DOC_ID, newAction);

      state = useHistoryStore.getState();
      history = state.histories.get(TEST_DOC_ID);
      expect(history?.redoStack).toHaveLength(0);
      expect(history?.undoStack).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations before initialization', () => {
      const { pushAction, undo, redo, canUndo, canRedo } = useHistoryStore.getState();

      // All should handle gracefully
      expect(() => pushAction('uninitialized', {
        description: 'Test',
        timestamp: Date.now(),
        documentState: createMockSnapshot(),
      })).not.toThrow();

      expect(undo('uninitialized', createMockSnapshot())).toBeNull();
      expect(redo('uninitialized', createMockSnapshot())).toBeNull();
      expect(canUndo('uninitialized')).toBe(false);
      expect(canRedo('uninitialized')).toBe(false);
    });

    it('should maintain data integrity with rapid operations', () => {
      const { initializeHistory, pushAction, undo, redo } = useHistoryStore.getState();

      initializeHistory(TEST_DOC_ID);

      // Rapid push/undo/redo sequence
      for (let i = 0; i < 10; i++) {
        pushAction(TEST_DOC_ID, {
          description: `Action ${i}`,
          timestamp: Date.now(),
          documentState: createMockSnapshot(`state_${i}`),
        });
      }

      for (let i = 0; i < 5; i++) {
        undo(TEST_DOC_ID, createMockSnapshot(`undo_${i}`));
      }

      for (let i = 0; i < 3; i++) {
        redo(TEST_DOC_ID, createMockSnapshot(`redo_${i}`));
      }

      const state = useHistoryStore.getState();
      const history = state.histories.get(TEST_DOC_ID);

      // Should have consistent state
      expect(history?.undoStack.length + history?.redoStack.length).toBe(10);
    });

    it('should handle empty snapshots', () => {
      const { initializeHistory, pushAction } = useHistoryStore.getState();

      initializeHistory(TEST_DOC_ID);

      const emptySnapshot: DocumentSnapshot = {
        timeline: {
          states: new Map(),
          currentStateId: '',
          rootStateId: '',
        },
        nodeTypes: [],
        edgeTypes: [],
        labels: [],
      };

      expect(() => pushAction(TEST_DOC_ID, {
        description: 'Empty',
        timestamp: Date.now(),
        documentState: emptySnapshot,
      })).not.toThrow();
    });
  });
});
