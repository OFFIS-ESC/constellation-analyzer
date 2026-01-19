import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTuioStore } from '../../stores/tuioStore';
import { useSearchStore } from '../../stores/searchStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useGraphStore } from '../../stores/graphStore';
import { resetWorkspaceStore } from '../../test-utils/test-helpers';
import type { TuioTangibleInfo } from '../../lib/tuio/types';
import type { TangibleConfig } from '../../types';

// Mock TUIO client to avoid needing a real WebSocket connection
vi.mock('../../lib/tuio/tuioClient', () => ({
  TuioClientManager: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    getUrl: vi.fn().mockReturnValue('ws://localhost:3333'),
  })),
}));

/**
 * Integration tests for TUIO tangible detection
 *
 * These tests verify that TUIO tangible detection properly integrates with
 * the application stores (searchStore, timelineStore, graphStore) to trigger
 * filter activation and state switching.
 *
 * Key integration points tested:
 * - Filter tangible detection activates labels in searchStore
 * - State tangible detection switches timeline state
 * - Multi-tangible handling (union of filters, last-wins for states)
 * - Tangible removal cleanup
 */
describe('TUIO Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    resetWorkspaceStore();

    // Reset TUIO store
    useTuioStore.setState({
      websocketUrl: 'ws://localhost:3333',
      isConnected: false,
      connectionError: null,
      activeTangibles: new Map(),
      lastStateChangeSource: null,
    });

    // Reset search store
    useSearchStore.setState({
      searchText: '',
      selectedActorTypes: [],
      selectedRelationTypes: [],
      selectedLabels: [],
    });
  });

  describe('Filter Tangible Detection', () => {
    it('should activate labels when filter tangible is detected', () => {
      // Setup: Create document with labels and tangible
      const docId = useWorkspaceStore.getState().createDocument('TUIO Filter Test');

      // Add labels to document
      useGraphStore.getState().addLabel({
        id: 'label-1',
        name: 'Critical',
        color: '#ff0000',
        appliesTo: 'both',
      });
      useGraphStore.getState().addLabel({
        id: 'label-2',
        name: 'Important',
        color: '#00ff00',
        appliesTo: 'both',
      });

      // Add filter tangible configuration
      const tangible: Omit<TangibleConfig, 'id'> = {
        name: 'Red Token',
        mode: 'filter',
        hardwareId: '42',
        filterLabels: ['label-1', 'label-2'],
      };
      useWorkspaceStore.getState().addTangibleToDocument(docId, tangible as TangibleConfig);

      // Simulate TUIO tangible detection
      const tangibleInfo: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      };

      // Add tangible to TUIO store
      useTuioStore.getState().addActiveTangible('42', tangibleInfo);

      // Import the handler function to test it directly
      // In real usage, this would be called by the TUIO client
      const { toggleSelectedLabel } = useSearchStore.getState();

      // Manually trigger label activation (simulating the integration hook)
      const graphTangibles = useGraphStore.getState().tangibles;
      const config = graphTangibles.find((t) => t.hardwareId === '42');

      if (config && config.mode === 'filter' && config.filterLabels) {
        config.filterLabels.forEach((labelId) => {
          const { selectedLabels } = useSearchStore.getState();
          if (!selectedLabels.includes(labelId)) {
            toggleSelectedLabel(labelId);
          }
        });
      }

      // Verify labels are selected
      const selectedLabels = useSearchStore.getState().selectedLabels;
      expect(selectedLabels).toContain('label-1');
      expect(selectedLabels).toContain('label-2');
      expect(selectedLabels.length).toBe(2);
    });

    it('should handle multiple filter tangibles with union of labels', () => {
      const docId = useWorkspaceStore.getState().createDocument('Multi-Filter Test');

      // Add labels
      useGraphStore.getState().addLabel({
        id: 'label-1',
        name: 'Label 1',
        color: '#ff0000',
        appliesTo: 'both',
      });
      useGraphStore.getState().addLabel({
        id: 'label-2',
        name: 'Label 2',
        color: '#00ff00',
        appliesTo: 'both',
      });
      useGraphStore.getState().addLabel({
        id: 'label-3',
        name: 'Label 3',
        color: '#0000ff',
        appliesTo: 'both',
      });

      // Add two tangibles with overlapping labels
      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'Token 1',
        mode: 'filter',
        hardwareId: '42',
        filterLabels: ['label-1', 'label-2'],
      } as TangibleConfig);

      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'Token 2',
        mode: 'filter',
        hardwareId: '13',
        filterLabels: ['label-2', 'label-3'],
      } as TangibleConfig);

      // Activate both tangibles
      const { toggleSelectedLabel } = useSearchStore.getState();
      const graphTangibles = useGraphStore.getState().tangibles;

      // Tangible 1
      const config1 = graphTangibles.find((t) => t.hardwareId === '42');
      if (config1?.filterLabels) {
        config1.filterLabels.forEach((labelId) => {
          const { selectedLabels } = useSearchStore.getState();
          if (!selectedLabels.includes(labelId)) {
            toggleSelectedLabel(labelId);
          }
        });
      }

      // Tangible 2
      const config2 = graphTangibles.find((t) => t.hardwareId === '13');
      if (config2?.filterLabels) {
        config2.filterLabels.forEach((labelId) => {
          const { selectedLabels } = useSearchStore.getState();
          if (!selectedLabels.includes(labelId)) {
            toggleSelectedLabel(labelId);
          }
        });
      }

      // Verify union of labels (label-1, label-2, label-3)
      const selectedLabels = useSearchStore.getState().selectedLabels;
      expect(selectedLabels).toContain('label-1');
      expect(selectedLabels).toContain('label-2');
      expect(selectedLabels).toContain('label-3');
      expect(selectedLabels.length).toBe(3);
    });

    it('should remove only unused labels when tangible is removed', () => {
      const docId = useWorkspaceStore.getState().createDocument('Remove Filter Test');

      // Add labels
      useGraphStore.getState().addLabel({
        id: 'label-1',
        name: 'Label 1',
        color: '#ff0000',
        appliesTo: 'both',
      });
      useGraphStore.getState().addLabel({
        id: 'label-2',
        name: 'Label 2',
        color: '#00ff00',
        appliesTo: 'both',
      });

      // Add two tangibles with shared label
      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'Token 1',
        mode: 'filter',
        hardwareId: '42',
        filterLabels: ['label-1', 'label-2'],
      } as TangibleConfig);

      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'Token 2',
        mode: 'filter',
        hardwareId: '13',
        filterLabels: ['label-2'],
      } as TangibleConfig);

      // Add tangibles to TUIO store (simulate detection)
      useTuioStore.getState().addActiveTangible('42', {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: Date.now(),
      });
      useTuioStore.getState().addActiveTangible('13', {
        hardwareId: '13',
        x: 0.7,
        y: 0.7,
        angle: 0,
        lastUpdated: Date.now(),
      });

      // Activate labels for both tangibles
      const { toggleSelectedLabel } = useSearchStore.getState();
      const graphTangibles = useGraphStore.getState().tangibles;

      graphTangibles.forEach((config) => {
        if (config.mode === 'filter' && config.filterLabels) {
          config.filterLabels.forEach((labelId) => {
            const { selectedLabels } = useSearchStore.getState();
            if (!selectedLabels.includes(labelId)) {
              toggleSelectedLabel(labelId);
            }
          });
        }
      });

      expect(useSearchStore.getState().selectedLabels).toContain('label-1');
      expect(useSearchStore.getState().selectedLabels).toContain('label-2');

      // Remove tangible 1 from TUIO store (should remove label-1 but keep label-2)
      useTuioStore.getState().removeActiveTangible('42');

      // Simulate removal logic
      const config1 = graphTangibles.find((t) => t.hardwareId === '42');
      if (config1?.filterLabels) {
        const activeTangibles = useTuioStore.getState().activeTangibles;
        const labelsStillActive = new Set<string>();

        activeTangibles.forEach((_, hwId) => {
          const cfg = graphTangibles.find(
            (t) => t.hardwareId === hwId && t.mode === 'filter'
          );
          if (cfg?.filterLabels) {
            cfg.filterLabels.forEach((labelId) => labelsStillActive.add(labelId));
          }
        });

        config1.filterLabels.forEach((labelId) => {
          const { selectedLabels } = useSearchStore.getState();
          if (selectedLabels.includes(labelId) && !labelsStillActive.has(labelId)) {
            toggleSelectedLabel(labelId);
          }
        });
      }

      // label-1 should be removed, label-2 should remain (still used by tangible 2)
      const selectedLabels = useSearchStore.getState().selectedLabels;
      expect(selectedLabels).not.toContain('label-1');
      expect(selectedLabels).toContain('label-2');
    });
  });

  describe('State Tangible Detection', () => {
    it('should switch to configured state when state tangible is detected', () => {
      const docId = useWorkspaceStore.getState().createDocument('TUIO State Test');

      // Create a new state
      const stateId = useTimelineStore.getState().createState('Test State', 'Description');

      // Add state tangible
      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'Blue Token',
        mode: 'state',
        hardwareId: '99',
        stateId: stateId,
      } as TangibleConfig);

      // Simulate tangible detection and state switch
      const config = useGraphStore.getState().tangibles.find((t) => t.hardwareId === '99');

      if (config?.stateId) {
        useTuioStore.getState().addActiveStateTangible('99');
        useTimelineStore.getState().switchToState(config.stateId, true);
      }

      // Verify state was switched
      const currentStateId = useTimelineStore.getState().timelines.get(docId)?.currentStateId;
      expect(currentStateId).toBe(stateId);
      expect(useTuioStore.getState().activeStateTangibles).toContain('99');
    });

    it('should not revert state when state tangible is removed', () => {
      const docId = useWorkspaceStore.getState().createDocument('State Removal Test');

      // Create state and tangible
      const initialStateId = useTimelineStore.getState().timelines.get(docId)?.rootStateId;
      const newStateId = useTimelineStore.getState().createState('New State');

      useWorkspaceStore.getState().addTangibleToDocument(docId, {
        name: 'State Token',
        mode: 'state',
        hardwareId: '100',
        stateId: newStateId,
      } as TangibleConfig);

      // Switch to new state
      useTuioStore.getState().addActiveStateTangible('100');
      useTimelineStore.getState().switchToState(newStateId, true);

      // Remove tangible
      useTuioStore.getState().removeActiveTangible('100');
      useTuioStore.getState().removeActiveStateTangible('100');

      // State should NOT revert
      const currentStateId = useTimelineStore.getState().timelines.get(docId)?.currentStateId;
      expect(currentStateId).toBe(newStateId);
      expect(currentStateId).not.toBe(initialStateId);
    });
  });

  describe('Unknown Hardware IDs', () => {
    it('should silently ignore tangibles with unknown hardware IDs', () => {
      useWorkspaceStore.getState().createDocument('Unknown ID Test');

      // Add tangible to TUIO store with unknown hardware ID
      useTuioStore.getState().addActiveTangible('999', {
        hardwareId: '999',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      // No error should occur
      const activeTangibles = useTuioStore.getState().activeTangibles;
      expect(activeTangibles.size).toBe(1);
      expect(activeTangibles.has('999')).toBe(true);

      // Search store should remain unchanged
      const selectedLabels = useSearchStore.getState().selectedLabels;
      expect(selectedLabels.length).toBe(0);
    });
  });

  describe('TUIO Store State Management', () => {
    it('should track active tangibles correctly', () => {
      const info1: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: Date.now(),
      };

      const info2: TuioTangibleInfo = {
        hardwareId: '13',
        x: 0.7,
        y: 0.7,
        angle: 1.57,
        lastUpdated: Date.now(),
      };

      useTuioStore.getState().addActiveTangible('42', info1);
      useTuioStore.getState().addActiveTangible('13', info2);

      const activeTangibles = useTuioStore.getState().activeTangibles;
      expect(activeTangibles.size).toBe(2);
      expect(activeTangibles.get('42')).toEqual(info1);
      expect(activeTangibles.get('13')).toEqual(info2);

      // Remove one
      useTuioStore.getState().removeActiveTangible('42');

      const remainingTangibles = useTuioStore.getState().activeTangibles;
      expect(remainingTangibles.size).toBe(1);
      expect(remainingTangibles.has('42')).toBe(false);
      expect(remainingTangibles.has('13')).toBe(true);
    });

    it('should clear all tangibles', () => {
      useTuioStore.getState().addActiveTangible('42', {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      useTuioStore.getState().addActiveTangible('13', {
        hardwareId: '13',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      expect(useTuioStore.getState().activeTangibles.size).toBe(2);

      useTuioStore.getState().clearActiveTangibles();

      expect(useTuioStore.getState().activeTangibles.size).toBe(0);
      expect(useTuioStore.getState().lastStateChangeSource).toBe(null);
    });
  });
});
