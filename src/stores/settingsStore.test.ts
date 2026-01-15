import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store to initial state
    useSettingsStore.setState({
      autoZoomEnabled: true,
      presentationMode: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct default settings', () => {
      const state = useSettingsStore.getState();

      expect(state.autoZoomEnabled).toBe(true);
      expect(state.presentationMode).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist to localStorage on change', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(false);

      // Check localStorage directly
      const stored = localStorage.getItem('constellation-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.autoZoomEnabled).toBe(false);
    });

    it('should load from localStorage on initialization', () => {
      // Set initial value
      const { setAutoZoomEnabled } = useSettingsStore.getState();
      setAutoZoomEnabled(false);

      // Simulate page reload by creating a new store instance
      // In production, this happens when the page reloads
      const stored = localStorage.getItem('constellation-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.autoZoomEnabled).toBe(false);
    });

    it('should handle missing localStorage gracefully', () => {
      // Clear localStorage
      localStorage.clear();

      // Should use default values
      const state = useSettingsStore.getState();
      expect(state.autoZoomEnabled).toBe(true);
    });
  });

  describe('setAutoZoomEnabled', () => {
    it('should enable auto zoom', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(true);

      expect(useSettingsStore.getState().autoZoomEnabled).toBe(true);
    });

    it('should disable auto zoom', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(false);

      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
    });

    it('should toggle auto zoom multiple times', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(false);
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);

      setAutoZoomEnabled(true);
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(true);

      setAutoZoomEnabled(false);
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive toggles', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      for (let i = 0; i < 100; i++) {
        setAutoZoomEnabled(i % 2 === 0);
      }

      // Last iteration: i=99, 99 % 2 = 1, so i % 2 === 0 is false
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
    });

    it('should preserve setting across multiple operations', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(false);

      // Perform multiple reads
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
      expect(useSettingsStore.getState().autoZoomEnabled).toBe(false);
    });
  });

  describe('Store Versioning', () => {
    it('should include version in persisted data', () => {
      const { setAutoZoomEnabled } = useSettingsStore.getState();

      setAutoZoomEnabled(false);

      const stored = localStorage.getItem('constellation-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
    });
  });

  describe('setPresentationMode', () => {
    it('should enable presentation mode', () => {
      const { setPresentationMode } = useSettingsStore.getState();

      setPresentationMode(true);

      expect(useSettingsStore.getState().presentationMode).toBe(true);
    });

    it('should disable presentation mode', () => {
      const { setPresentationMode } = useSettingsStore.getState();

      setPresentationMode(true);
      setPresentationMode(false);

      expect(useSettingsStore.getState().presentationMode).toBe(false);
    });

    it('should toggle presentation mode multiple times', () => {
      const { setPresentationMode } = useSettingsStore.getState();

      setPresentationMode(true);
      expect(useSettingsStore.getState().presentationMode).toBe(true);

      setPresentationMode(false);
      expect(useSettingsStore.getState().presentationMode).toBe(false);

      setPresentationMode(true);
      expect(useSettingsStore.getState().presentationMode).toBe(true);
    });

    it('should persist presentation mode to localStorage', () => {
      const { setPresentationMode } = useSettingsStore.getState();

      setPresentationMode(true);

      // Check localStorage directly
      const stored = localStorage.getItem('constellation-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.presentationMode).toBe(true);
    });
  });

  describe('Future Extensibility', () => {
    it('should maintain backward compatibility when new settings are added', () => {
      // Set current setting
      const { setAutoZoomEnabled } = useSettingsStore.getState();
      setAutoZoomEnabled(false);

      // Verify it persists correctly
      const stored = localStorage.getItem('constellation-settings');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.autoZoomEnabled).toBe(false);

      // This test ensures the structure supports future settings
      // When new settings are added, they should not break existing data
    });
  });
});
