import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from './searchStore';

describe('searchStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSearchStore.setState({
      searchText: '',
      selectedActorTypes: [],
      selectedRelationTypes: [],
      selectedLabels: [],
    });
  });

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const state = useSearchStore.getState();

      expect(state.searchText).toBe('');
      expect(state.selectedActorTypes).toEqual([]);
      expect(state.selectedRelationTypes).toEqual([]);
      expect(state.selectedLabels).toEqual([]);
    });
  });

  describe('Search Text', () => {
    describe('setSearchText', () => {
      it('should set search text', () => {
        const { setSearchText } = useSearchStore.getState();

        setSearchText('test query');

        expect(useSearchStore.getState().searchText).toBe('test query');
      });

      it('should handle empty string', () => {
        const { setSearchText } = useSearchStore.getState();

        setSearchText('test');
        setSearchText('');

        expect(useSearchStore.getState().searchText).toBe('');
      });

      it('should handle special characters', () => {
        const { setSearchText } = useSearchStore.getState();

        setSearchText('test@#$%^&*()');

        expect(useSearchStore.getState().searchText).toBe('test@#$%^&*()');
      });

      it('should overwrite previous search text', () => {
        const { setSearchText } = useSearchStore.getState();

        setSearchText('first');
        setSearchText('second');

        expect(useSearchStore.getState().searchText).toBe('second');
      });
    });
  });

  describe('Actor Type Filters', () => {
    describe('toggleSelectedActorType', () => {
      it('should add actor type to selection', () => {
        const { toggleSelectedActorType } = useSearchStore.getState();

        toggleSelectedActorType('person');

        expect(useSearchStore.getState().selectedActorTypes).toEqual(['person']);
      });

      it('should remove actor type from selection when already selected', () => {
        const { toggleSelectedActorType } = useSearchStore.getState();

        toggleSelectedActorType('person');
        toggleSelectedActorType('person');

        expect(useSearchStore.getState().selectedActorTypes).toEqual([]);
      });

      it('should handle multiple actor types', () => {
        const { toggleSelectedActorType } = useSearchStore.getState();

        toggleSelectedActorType('person');
        toggleSelectedActorType('organization');
        toggleSelectedActorType('system');

        expect(useSearchStore.getState().selectedActorTypes).toEqual([
          'person',
          'organization',
          'system',
        ]);
      });

      it('should remove specific actor type from multiple selections', () => {
        const { toggleSelectedActorType } = useSearchStore.getState();

        toggleSelectedActorType('person');
        toggleSelectedActorType('organization');
        toggleSelectedActorType('person'); // Remove person

        expect(useSearchStore.getState().selectedActorTypes).toEqual(['organization']);
      });
    });

    describe('clearSelectedActorTypes', () => {
      it('should clear all selected actor types', () => {
        const { toggleSelectedActorType, clearSelectedActorTypes } = useSearchStore.getState();

        toggleSelectedActorType('person');
        toggleSelectedActorType('organization');
        clearSelectedActorTypes();

        expect(useSearchStore.getState().selectedActorTypes).toEqual([]);
      });

      it('should handle clearing empty selection', () => {
        const { clearSelectedActorTypes } = useSearchStore.getState();

        clearSelectedActorTypes();

        expect(useSearchStore.getState().selectedActorTypes).toEqual([]);
      });
    });
  });

  describe('Relation Type Filters', () => {
    describe('toggleSelectedRelationType', () => {
      it('should add relation type to selection', () => {
        const { toggleSelectedRelationType } = useSearchStore.getState();

        toggleSelectedRelationType('collaborates');

        expect(useSearchStore.getState().selectedRelationTypes).toEqual(['collaborates']);
      });

      it('should remove relation type from selection when already selected', () => {
        const { toggleSelectedRelationType } = useSearchStore.getState();

        toggleSelectedRelationType('collaborates');
        toggleSelectedRelationType('collaborates');

        expect(useSearchStore.getState().selectedRelationTypes).toEqual([]);
      });

      it('should handle multiple relation types', () => {
        const { toggleSelectedRelationType } = useSearchStore.getState();

        toggleSelectedRelationType('collaborates');
        toggleSelectedRelationType('reports-to');
        toggleSelectedRelationType('depends-on');

        expect(useSearchStore.getState().selectedRelationTypes).toEqual([
          'collaborates',
          'reports-to',
          'depends-on',
        ]);
      });
    });

    describe('clearSelectedRelationTypes', () => {
      it('should clear all selected relation types', () => {
        const { toggleSelectedRelationType, clearSelectedRelationTypes } = useSearchStore.getState();

        toggleSelectedRelationType('collaborates');
        toggleSelectedRelationType('reports-to');
        clearSelectedRelationTypes();

        expect(useSearchStore.getState().selectedRelationTypes).toEqual([]);
      });
    });
  });

  describe('Label Filters', () => {
    describe('toggleSelectedLabel', () => {
      it('should add label to selection', () => {
        const { toggleSelectedLabel } = useSearchStore.getState();

        toggleSelectedLabel('label-1');

        expect(useSearchStore.getState().selectedLabels).toEqual(['label-1']);
      });

      it('should remove label from selection when already selected', () => {
        const { toggleSelectedLabel } = useSearchStore.getState();

        toggleSelectedLabel('label-1');
        toggleSelectedLabel('label-1');

        expect(useSearchStore.getState().selectedLabels).toEqual([]);
      });

      it('should handle multiple labels', () => {
        const { toggleSelectedLabel } = useSearchStore.getState();

        toggleSelectedLabel('label-1');
        toggleSelectedLabel('label-2');
        toggleSelectedLabel('label-3');

        expect(useSearchStore.getState().selectedLabels).toEqual([
          'label-1',
          'label-2',
          'label-3',
        ]);
      });
    });

    describe('clearSelectedLabels', () => {
      it('should clear all selected labels', () => {
        const { toggleSelectedLabel, clearSelectedLabels } = useSearchStore.getState();

        toggleSelectedLabel('label-1');
        toggleSelectedLabel('label-2');
        clearSelectedLabels();

        expect(useSearchStore.getState().selectedLabels).toEqual([]);
      });
    });
  });

  describe('Clear All Filters', () => {
    describe('clearFilters', () => {
      it('should clear all filters at once', () => {
        const {
          setSearchText,
          toggleSelectedActorType,
          toggleSelectedRelationType,
          toggleSelectedLabel,
          clearFilters,
        } = useSearchStore.getState();

        // Set all filters
        setSearchText('test');
        toggleSelectedActorType('person');
        toggleSelectedRelationType('collaborates');
        toggleSelectedLabel('label-1');

        // Clear all
        clearFilters();

        const state = useSearchStore.getState();
        expect(state.searchText).toBe('');
        expect(state.selectedActorTypes).toEqual([]);
        expect(state.selectedRelationTypes).toEqual([]);
        expect(state.selectedLabels).toEqual([]);
      });

      it('should handle clearing when no filters are active', () => {
        const { clearFilters } = useSearchStore.getState();

        clearFilters();

        const state = useSearchStore.getState();
        expect(state.searchText).toBe('');
        expect(state.selectedActorTypes).toEqual([]);
        expect(state.selectedRelationTypes).toEqual([]);
        expect(state.selectedLabels).toEqual([]);
      });
    });
  });

  describe('Has Active Filters', () => {
    describe('hasActiveFilters', () => {
      it('should return false when no filters are active', () => {
        const { hasActiveFilters } = useSearchStore.getState();

        expect(hasActiveFilters()).toBe(false);
      });

      it('should return true when search text is present', () => {
        const { setSearchText, hasActiveFilters } = useSearchStore.getState();

        setSearchText('test');

        expect(hasActiveFilters()).toBe(true);
      });

      it('should return false for whitespace-only search text', () => {
        const { setSearchText, hasActiveFilters } = useSearchStore.getState();

        setSearchText('   ');

        expect(hasActiveFilters()).toBe(false);
      });

      it('should return true when actor types are selected', () => {
        const { toggleSelectedActorType, hasActiveFilters } = useSearchStore.getState();

        toggleSelectedActorType('person');

        expect(hasActiveFilters()).toBe(true);
      });

      it('should return true when relation types are selected', () => {
        const { toggleSelectedRelationType, hasActiveFilters } = useSearchStore.getState();

        toggleSelectedRelationType('collaborates');

        expect(hasActiveFilters()).toBe(true);
      });

      it('should return true when labels are selected', () => {
        const { toggleSelectedLabel, hasActiveFilters } = useSearchStore.getState();

        toggleSelectedLabel('label-1');

        expect(hasActiveFilters()).toBe(true);
      });

      it('should return true when any combination of filters is active', () => {
        const {
          setSearchText,
          toggleSelectedActorType,
          hasActiveFilters,
        } = useSearchStore.getState();

        setSearchText('test');
        toggleSelectedActorType('person');

        expect(hasActiveFilters()).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle duplicate type selections gracefully', () => {
      const { toggleSelectedActorType } = useSearchStore.getState();

      // Toggle same type twice (on then off)
      toggleSelectedActorType('person');
      toggleSelectedActorType('person');

      expect(useSearchStore.getState().selectedActorTypes).toEqual([]);
    });

    it('should handle very long search text', () => {
      const { setSearchText } = useSearchStore.getState();
      const longText = 'a'.repeat(10000);

      setSearchText(longText);

      expect(useSearchStore.getState().searchText).toBe(longText);
    });

    it('should handle rapid filter changes', () => {
      const { toggleSelectedActorType, clearFilters } = useSearchStore.getState();

      for (let i = 0; i < 100; i++) {
        toggleSelectedActorType('person');
        toggleSelectedActorType('organization');
        clearFilters();
      }

      const state = useSearchStore.getState();
      expect(state.selectedActorTypes).toEqual([]);
    });

    it('should maintain filter independence', () => {
      const {
        setSearchText,
        toggleSelectedActorType,
        toggleSelectedRelationType,
        clearSelectedActorTypes,
      } = useSearchStore.getState();

      setSearchText('test');
      toggleSelectedActorType('person');
      toggleSelectedRelationType('collaborates');

      clearSelectedActorTypes();

      const state = useSearchStore.getState();
      expect(state.searchText).toBe('test');
      expect(state.selectedActorTypes).toEqual([]);
      expect(state.selectedRelationTypes).toEqual(['collaborates']);
    });
  });
});
