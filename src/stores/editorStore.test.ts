import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState({
      snapToGrid: false,
      showGrid: true,
      gridSize: 15,
      panOnDrag: true,
      zoomOnScroll: true,
      selectedRelationType: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct default settings', () => {
      const state = useEditorStore.getState();

      expect(state.snapToGrid).toBe(false);
      expect(state.showGrid).toBe(true);
      expect(state.gridSize).toBe(15);
      expect(state.panOnDrag).toBe(true);
      expect(state.zoomOnScroll).toBe(true);
      expect(state.selectedRelationType).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update single setting', () => {
      const { updateSettings } = useEditorStore.getState();

      updateSettings({ snapToGrid: true });

      expect(useEditorStore.getState().snapToGrid).toBe(true);
      expect(useEditorStore.getState().showGrid).toBe(true); // Other settings unchanged
    });

    it('should update multiple settings at once', () => {
      const { updateSettings } = useEditorStore.getState();

      updateSettings({
        snapToGrid: true,
        gridSize: 20,
        showGrid: false,
      });

      const state = useEditorStore.getState();
      expect(state.snapToGrid).toBe(true);
      expect(state.gridSize).toBe(20);
      expect(state.showGrid).toBe(false);
    });

    it('should handle partial updates without affecting other settings', () => {
      const { updateSettings } = useEditorStore.getState();

      // Initial update
      updateSettings({ panOnDrag: false });
      expect(useEditorStore.getState().panOnDrag).toBe(false);

      // Second update should not reset first
      updateSettings({ zoomOnScroll: false });
      const state = useEditorStore.getState();
      expect(state.panOnDrag).toBe(false);
      expect(state.zoomOnScroll).toBe(false);
    });

    it('should handle empty updates', () => {
      const initialState = useEditorStore.getState();
      const { updateSettings } = initialState;

      updateSettings({});

      const newState = useEditorStore.getState();
      expect(newState).toEqual(initialState);
    });
  });

  describe('setSelectedRelationType', () => {
    it('should set selected relation type', () => {
      const { setSelectedRelationType } = useEditorStore.getState();

      setSelectedRelationType('collaborates');

      expect(useEditorStore.getState().selectedRelationType).toBe('collaborates');
    });

    it('should allow changing relation type', () => {
      const { setSelectedRelationType } = useEditorStore.getState();

      setSelectedRelationType('collaborates');
      expect(useEditorStore.getState().selectedRelationType).toBe('collaborates');

      setSelectedRelationType('reports-to');
      expect(useEditorStore.getState().selectedRelationType).toBe('reports-to');
    });

    it('should handle empty string', () => {
      const { setSelectedRelationType } = useEditorStore.getState();

      setSelectedRelationType('');

      expect(useEditorStore.getState().selectedRelationType).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative gridSize', () => {
      const { updateSettings } = useEditorStore.getState();

      updateSettings({ gridSize: -5 });

      // Store allows it (validation should be in UI layer)
      expect(useEditorStore.getState().gridSize).toBe(-5);
    });

    it('should handle very large gridSize', () => {
      const { updateSettings } = useEditorStore.getState();

      updateSettings({ gridSize: 1000 });

      expect(useEditorStore.getState().gridSize).toBe(1000);
    });

    it('should handle rapid consecutive updates', () => {
      const { updateSettings } = useEditorStore.getState();

      updateSettings({ gridSize: 10 });
      updateSettings({ gridSize: 20 });
      updateSettings({ gridSize: 30 });

      expect(useEditorStore.getState().gridSize).toBe(30);
    });
  });
});
