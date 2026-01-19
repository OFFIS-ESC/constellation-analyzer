import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActiveFilters, nodeMatchesFilters, edgeMatchesFilters } from './useActiveFilters';
import { useSearchStore } from '../stores/searchStore';
import { useTuioStore } from '../stores/tuioStore';
import { useSettingsStore } from '../stores/settingsStore';

describe('useActiveFilters', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    useSearchStore.setState({
      searchText: '',
      selectedActorTypes: [],
      selectedRelationTypes: [],
      selectedLabels: [],
    });

    useTuioStore.setState({
      presentationFilters: {
        labels: [],
        actorTypes: [],
        relationTypes: [],
        combineMode: 'OR',
      },
      activeTangibles: new Map(),
      activeStateTangibles: [],
      connectionState: { connected: false, error: null },
      websocketUrl: 'ws://localhost:3333',
      protocolVersion: '1.1',
    });

    useSettingsStore.setState({
      presentationMode: false,
      autoZoomEnabled: true,
      fullscreenMode: false,
    });
  });

  describe('useActiveFilters hook', () => {
    it('should return editing mode filters when not in presentation mode', () => {
      // Set up editing mode filters
      useSearchStore.setState({
        searchText: 'test search',
        selectedActorTypes: ['person'],
        selectedRelationTypes: ['knows'],
        selectedLabels: ['urgent'],
      });

      const { result } = renderHook(() => useActiveFilters());

      expect(result.current).toEqual({
        searchText: 'test search',
        selectedLabels: ['urgent'],
        selectedActorTypes: ['person'],
        selectedRelationTypes: ['knows'],
        combineMode: 'AND',
      });
    });

    it('should return presentation mode filters when in presentation mode', () => {
      // Enable presentation mode
      useSettingsStore.setState({ presentationMode: true });

      // Set up presentation filters
      useTuioStore.setState({
        presentationFilters: {
          labels: ['critical'],
          actorTypes: ['organization'],
          relationTypes: ['employs'],
          combineMode: 'OR',
        },
        activeTangibles: new Map(),
        activeStateTangibles: [],
        connectionState: { connected: false, error: null },
        websocketUrl: 'ws://localhost:3333',
        protocolVersion: '1.1',
      });

      const { result } = renderHook(() => useActiveFilters());

      expect(result.current).toEqual({
        searchText: '',
        selectedLabels: ['critical'],
        selectedActorTypes: ['organization'],
        selectedRelationTypes: ['employs'],
        combineMode: 'OR',
      });
    });

    it('should always use AND mode for editing mode', () => {
      useSettingsStore.setState({ presentationMode: false });

      const { result } = renderHook(() => useActiveFilters());

      expect(result.current.combineMode).toBe('AND');
    });

    it('should not include search text in presentation mode', () => {
      useSettingsStore.setState({ presentationMode: true });
      useSearchStore.setState({ searchText: 'should be ignored' });

      const { result } = renderHook(() => useActiveFilters());

      expect(result.current.searchText).toBe('');
    });
  });

  describe('nodeMatchesFilters', () => {
    describe('No filters active', () => {
      it('should match all nodes when no filters are active', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', 'A person', 'Person', filters);

        expect(result).toBe(true);
      });
    });

    describe('Type filters', () => {
      it('should match when node type is in selected types', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: ['person', 'organization'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should not match when node type is not in selected types', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: ['organization'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });
    });

    describe('Label filters', () => {
      it('should match when node has at least one selected label', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent', 'critical'],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['urgent', 'other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should not match when node has no selected labels', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });

      it('should not match when node has no labels at all', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });
    });

    describe('Search text filters', () => {
      it('should match when search text is in node name', () => {
        const filters = {
          searchText: 'john',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should match when search text is in node description', () => {
        const filters = {
          searchText: 'developer',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'Jane', 'A skilled developer', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should match when search text is in node type name', () => {
        const filters = {
          searchText: 'person',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'Jane', '', 'Person Type', filters);

        expect(result).toBe(true);
      });

      it('should be case insensitive', () => {
        const filters = {
          searchText: 'JOHN',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'john doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should not match when search text is not found', () => {
        const filters = {
          searchText: 'xyz',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', 'A person', 'Person', filters);

        expect(result).toBe(false);
      });

      it('should handle whitespace in search text', () => {
        const filters = {
          searchText: '  john  ',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });
    });

    describe('Combine mode: AND', () => {
      it('should match when all filter categories match', () => {
        const filters = {
          searchText: 'john',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['person'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['urgent'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should not match when type matches but label does not', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['person'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });

      it('should not match when label matches but type does not', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['organization'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['urgent'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });

      it('should not match when search text does not match but others do', () => {
        const filters = {
          searchText: 'xyz',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['person'],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = nodeMatchesFilters('person', ['urgent'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });
    });

    describe('Combine mode: OR', () => {
      it('should match when any filter category matches', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['organization'],
          selectedRelationTypes: [],
          combineMode: 'OR' as const,
        };

        // Matches because label matches (even though type doesn't)
        const result = nodeMatchesFilters('person', ['urgent'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should match when only type matches', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['person'],
          selectedRelationTypes: [],
          combineMode: 'OR' as const,
        };

        const result = nodeMatchesFilters('person', ['other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should match when only search text matches', () => {
        const filters = {
          searchText: 'john',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['organization'],
          selectedRelationTypes: [],
          combineMode: 'OR' as const,
        };

        const result = nodeMatchesFilters('person', ['other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });

      it('should not match when no filter categories match', () => {
        const filters = {
          searchText: 'xyz',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['organization'],
          selectedRelationTypes: [],
          combineMode: 'OR' as const,
        };

        const result = nodeMatchesFilters('person', ['other'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(false);
      });

      it('should match when all categories match', () => {
        const filters = {
          searchText: 'john',
          selectedLabels: ['urgent'],
          selectedActorTypes: ['person'],
          selectedRelationTypes: [],
          combineMode: 'OR' as const,
        };

        const result = nodeMatchesFilters('person', ['urgent'], 'John Doe', '', 'Person', filters);

        expect(result).toBe(true);
      });
    });
  });

  describe('edgeMatchesFilters', () => {
    describe('No filters active', () => {
      it('should match all edges when no filters are active', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], 'custom label', 'Knows', filters);

        expect(result).toBe(true);
      });
    });

    describe('Type filters', () => {
      it('should match when edge type is in selected types', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: ['knows', 'employs'],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], '', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should not match when edge type is not in selected types', () => {
        const filters = {
          searchText: '',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: ['employs'],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], '', 'Knows', filters);

        expect(result).toBe(false);
      });
    });

    describe('Label filters', () => {
      it('should match when edge has at least one selected label', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified', 'important'],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', ['verified', 'other'], '', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should not match when edge has no selected labels', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', ['other'], '', 'Knows', filters);

        expect(result).toBe(false);
      });
    });

    describe('Search text filters', () => {
      it('should match when search text is in edge custom label', () => {
        const filters = {
          searchText: 'custom',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], 'custom relationship', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should match when search text is in edge type name', () => {
        const filters = {
          searchText: 'knows',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], '', 'Knows About', filters);

        expect(result).toBe(true);
      });

      it('should be case insensitive', () => {
        const filters = {
          searchText: 'KNOWS',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], '', 'knows about', filters);

        expect(result).toBe(true);
      });

      it('should not match when search text is not found', () => {
        const filters = {
          searchText: 'xyz',
          selectedLabels: [],
          selectedActorTypes: [],
          selectedRelationTypes: [],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', [], '', 'Knows', filters);

        expect(result).toBe(false);
      });
    });

    describe('Combine mode: AND', () => {
      it('should match when all filter categories match', () => {
        const filters = {
          searchText: 'custom',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['knows'],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', ['verified'], 'custom label', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should not match when type matches but label does not', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['knows'],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', ['other'], '', 'Knows', filters);

        expect(result).toBe(false);
      });

      it('should not match when label matches but type does not', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['employs'],
          combineMode: 'AND' as const,
        };

        const result = edgeMatchesFilters('knows', ['verified'], '', 'Knows', filters);

        expect(result).toBe(false);
      });
    });

    describe('Combine mode: OR', () => {
      it('should match when any filter category matches', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['employs'],
          combineMode: 'OR' as const,
        };

        // Matches because label matches (even though type doesn't)
        const result = edgeMatchesFilters('knows', ['verified'], '', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should match when only type matches', () => {
        const filters = {
          searchText: '',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['knows'],
          combineMode: 'OR' as const,
        };

        const result = edgeMatchesFilters('knows', ['other'], '', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should match when only search text matches', () => {
        const filters = {
          searchText: 'custom',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['employs'],
          combineMode: 'OR' as const,
        };

        const result = edgeMatchesFilters('knows', ['other'], 'custom label', 'Knows', filters);

        expect(result).toBe(true);
      });

      it('should not match when no filter categories match', () => {
        const filters = {
          searchText: 'xyz',
          selectedLabels: ['verified'],
          selectedActorTypes: [],
          selectedRelationTypes: ['employs'],
          combineMode: 'OR' as const,
        };

        const result = edgeMatchesFilters('knows', ['other'], '', 'Knows', filters);

        expect(result).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings in node data', () => {
      const filters = {
        searchText: 'test',
        selectedLabels: [],
        selectedActorTypes: [],
        selectedRelationTypes: [],
        combineMode: 'AND' as const,
      };

      const result = nodeMatchesFilters('', [], '', '', '', filters);

      expect(result).toBe(false);
    });

    it('should handle undefined label arrays', () => {
      const filters = {
        searchText: '',
        selectedLabels: ['urgent'],
        selectedActorTypes: [],
        selectedRelationTypes: [],
        combineMode: 'AND' as const,
      };

      const result = nodeMatchesFilters('person', [], 'John', '', 'Person', filters);

      expect(result).toBe(false);
    });

    it('should trim leading and trailing whitespace in search text', () => {
      const filters = {
        searchText: '   john   ',
        selectedLabels: [],
        selectedActorTypes: [],
        selectedRelationTypes: [],
        combineMode: 'AND' as const,
      };

      const result = nodeMatchesFilters('person', [], 'John Doe', '', 'Person', filters);

      expect(result).toBe(true);
    });
  });
});
