import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, type ToastType } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store to initial state
    useToastStore.setState({
      toasts: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty toasts array', () => {
      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
    });
  });

  describe('showToast', () => {
    it('should add a toast with default type and duration', () => {
      const { showToast } = useToastStore.getState();

      showToast('Test message');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('Test message');
      expect(state.toasts[0].type).toBe('info');
      expect(state.toasts[0].duration).toBe(4000);
      expect(state.toasts[0].id).toMatch(/^toast-/);
    });

    it('should add a toast with custom type', () => {
      const { showToast } = useToastStore.getState();
      const types: ToastType[] = ['success', 'error', 'info', 'warning'];

      types.forEach((type) => {
        useToastStore.setState({ toasts: [] }); // Clear between tests
        showToast('Test message', type);

        const state = useToastStore.getState();
        expect(state.toasts[0].type).toBe(type);
      });
    });

    it('should add a toast with custom duration', () => {
      const { showToast } = useToastStore.getState();

      showToast('Test message', 'info', 10000);

      const state = useToastStore.getState();
      expect(state.toasts[0].duration).toBe(10000);
    });

    it('should generate unique IDs for each toast', () => {
      const { showToast } = useToastStore.getState();

      showToast('Message 1');
      showToast('Message 2');
      showToast('Message 3');

      const state = useToastStore.getState();
      const ids = state.toasts.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    it('should limit toasts to MAX_TOASTS (3)', () => {
      const { showToast } = useToastStore.getState();

      showToast('Message 1');
      showToast('Message 2');
      showToast('Message 3');
      showToast('Message 4');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(3);
      expect(state.toasts[0].message).toBe('Message 2'); // FIFO - first was removed
      expect(state.toasts[1].message).toBe('Message 3');
      expect(state.toasts[2].message).toBe('Message 4');
    });

    it('should auto-dismiss toast after duration', () => {
      const { showToast } = useToastStore.getState();

      showToast('Test message', 'info', 1000);

      let state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);

      // Fast-forward time by 1000ms
      vi.advanceTimersByTime(1000);

      state = useToastStore.getState();
      expect(state.toasts).toHaveLength(0);
    });

    it('should handle multiple toasts with different durations', () => {
      const { showToast } = useToastStore.getState();

      showToast('Short', 'info', 1000);
      showToast('Long', 'info', 3000);

      // After 1000ms, first should be gone
      vi.advanceTimersByTime(1000);
      let state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('Long');

      // After another 2000ms, second should be gone
      vi.advanceTimersByTime(2000);
      state = useToastStore.getState();
      expect(state.toasts).toHaveLength(0);
    });
  });

  describe('hideToast', () => {
    it('should remove a specific toast by ID', () => {
      const { showToast, hideToast } = useToastStore.getState();

      showToast('Message 1');
      showToast('Message 2');

      const state = useToastStore.getState();
      const firstToastId = state.toasts[0].id;

      hideToast(firstToastId);

      const newState = useToastStore.getState();
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].message).toBe('Message 2');
    });

    it('should handle removing non-existent toast', () => {
      const { showToast, hideToast } = useToastStore.getState();

      showToast('Message 1');
      const stateBefore = useToastStore.getState();

      hideToast('non-existent-id');

      const stateAfter = useToastStore.getState();
      expect(stateAfter.toasts).toEqual(stateBefore.toasts);
    });

    it('should handle removing from empty array', () => {
      const { hideToast } = useToastStore.getState();

      hideToast('some-id');

      const state = useToastStore.getState();
      expect(state.toasts).toEqual([]);
    });
  });

  describe('clearAllToasts', () => {
    it('should remove all toasts', () => {
      const { showToast, clearAllToasts } = useToastStore.getState();

      showToast('Message 1');
      showToast('Message 2');
      showToast('Message 3');

      expect(useToastStore.getState().toasts).toHaveLength(3);

      clearAllToasts();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should handle clearing empty array', () => {
      const { clearAllToasts } = useToastStore.getState();

      clearAllToasts();

      expect(useToastStore.getState().toasts).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message string', () => {
      const { showToast } = useToastStore.getState();

      showToast('');

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].message).toBe('');
    });

    it('should handle very long message', () => {
      const { showToast } = useToastStore.getState();
      const longMessage = 'A'.repeat(1000);

      showToast(longMessage);

      const state = useToastStore.getState();
      expect(state.toasts[0].message).toBe(longMessage);
    });

    it('should handle zero duration', () => {
      const { showToast } = useToastStore.getState();

      showToast('Test', 'info', 0);

      vi.advanceTimersByTime(0);

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(0);
    });

    it('should handle rapid consecutive toast additions', () => {
      const { showToast } = useToastStore.getState();

      for (let i = 0; i < 10; i++) {
        showToast(`Message ${i}`);
      }

      const state = useToastStore.getState();
      expect(state.toasts).toHaveLength(3); // MAX_TOASTS limit
      expect(state.toasts[0].message).toBe('Message 7');
      expect(state.toasts[1].message).toBe('Message 8');
      expect(state.toasts[2].message).toBe('Message 9');
    });
  });
});
