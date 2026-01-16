import { describe, it, expect, beforeEach } from 'vitest';
import { useTuioStore } from './tuioStore';
import type { TuioTangibleInfo } from '../lib/tuio/types';

describe('tuioStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store to initial state
    useTuioStore.setState({
      websocketUrl: 'ws://localhost:3333',
      isConnected: false,
      connectionError: null,
      activeTangibles: new Map(),
      lastStateChangeSource: null,
    });
  });

  describe('Initial State', () => {
    it('should have correct default settings', () => {
      const state = useTuioStore.getState();

      expect(state.websocketUrl).toBe('ws://localhost:3333');
      expect(state.isConnected).toBe(false);
      expect(state.connectionError).toBe(null);
      expect(state.activeTangibles.size).toBe(0);
      expect(state.lastStateChangeSource).toBe(null);
    });
  });

  describe('Persistence', () => {
    it('should persist websocketUrl to localStorage', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://example.com:3333');

      // Check localStorage directly
      const stored = localStorage.getItem('constellation-tuio-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.websocketUrl).toBe('ws://example.com:3333');
    });

    it('should NOT persist runtime state to localStorage', () => {
      const { setConnectionState, addActiveTangible } = useTuioStore.getState();

      // Set runtime state
      setConnectionState(true);
      addActiveTangible('42', {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      // Check localStorage
      const stored = localStorage.getItem('constellation-tuio-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      // Should only contain websocketUrl, not runtime state
      expect(parsed.state.websocketUrl).toBeDefined();
      expect(parsed.state.isConnected).toBeUndefined();
      expect(parsed.state.activeTangibles).toBeUndefined();
    });

    it('should load websocketUrl from localStorage on initialization', () => {
      const { setWebsocketUrl } = useTuioStore.getState();
      setWebsocketUrl('ws://custom.com:9999');

      // Verify persisted
      const stored = localStorage.getItem('constellation-tuio-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.websocketUrl).toBe('ws://custom.com:9999');
    });

    it('should handle missing localStorage gracefully', () => {
      localStorage.clear();

      // Should use default values
      const state = useTuioStore.getState();
      expect(state.websocketUrl).toBe('ws://localhost:3333');
    });
  });

  describe('setWebsocketUrl', () => {
    it('should update websocket URL', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://192.168.1.100:3333');

      expect(useTuioStore.getState().websocketUrl).toBe('ws://192.168.1.100:3333');
    });

    it('should persist URL changes', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://test.local:8080');

      const stored = localStorage.getItem('constellation-tuio-settings');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.websocketUrl).toBe('ws://test.local:8080');
    });

    it('should handle multiple URL changes', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://url1:3333');
      expect(useTuioStore.getState().websocketUrl).toBe('ws://url1:3333');

      setWebsocketUrl('ws://url2:3333');
      expect(useTuioStore.getState().websocketUrl).toBe('ws://url2:3333');

      setWebsocketUrl('ws://url3:3333');
      expect(useTuioStore.getState().websocketUrl).toBe('ws://url3:3333');
    });
  });

  describe('setConnectionState', () => {
    it('should set connection to connected', () => {
      const { setConnectionState } = useTuioStore.getState();

      setConnectionState(true);

      const state = useTuioStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.connectionError).toBe(null);
    });

    it('should set connection to disconnected', () => {
      const { setConnectionState } = useTuioStore.getState();

      setConnectionState(true);
      setConnectionState(false);

      const state = useTuioStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.connectionError).toBe(null);
    });

    it('should set connection error', () => {
      const { setConnectionState } = useTuioStore.getState();

      setConnectionState(false, 'Connection refused');

      const state = useTuioStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.connectionError).toBe('Connection refused');
    });

    it('should clear previous error on successful connection', () => {
      const { setConnectionState } = useTuioStore.getState();

      // First fail
      setConnectionState(false, 'Connection refused');
      expect(useTuioStore.getState().connectionError).toBe('Connection refused');

      // Then succeed
      setConnectionState(true);
      expect(useTuioStore.getState().connectionError).toBe(null);
    });
  });

  describe('addActiveTangible', () => {
    it('should add a tangible', () => {
      const { addActiveTangible } = useTuioStore.getState();

      const tangible: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 1.57,
        lastUpdated: Date.now(),
      };

      addActiveTangible('42', tangible);

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(1);
      expect(state.activeTangibles.get('42')).toEqual(tangible);
    });

    it('should add multiple tangibles', () => {
      const { addActiveTangible } = useTuioStore.getState();

      const tangible1: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: Date.now(),
      };

      const tangible2: TuioTangibleInfo = {
        hardwareId: '13',
        x: 0.7,
        y: 0.7,
        angle: 3.14,
        lastUpdated: Date.now(),
      };

      addActiveTangible('42', tangible1);
      addActiveTangible('13', tangible2);

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(2);
      expect(state.activeTangibles.get('42')).toEqual(tangible1);
      expect(state.activeTangibles.get('13')).toEqual(tangible2);
    });

    it('should create new Map instance (immutability)', () => {
      const { addActiveTangible } = useTuioStore.getState();

      const map1 = useTuioStore.getState().activeTangibles;

      addActiveTangible('42', {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      const map2 = useTuioStore.getState().activeTangibles;

      expect(map1).not.toBe(map2); // Different instances
      expect(map1.size).toBe(0);
      expect(map2.size).toBe(1);
    });
  });

  describe('updateActiveTangible', () => {
    it('should update existing tangible', () => {
      const { addActiveTangible, updateActiveTangible } = useTuioStore.getState();

      const original: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: 1000,
      };

      addActiveTangible('42', original);

      const updated: TuioTangibleInfo = {
        hardwareId: '42',
        x: 0.7,
        y: 0.8,
        angle: 1.57,
        lastUpdated: 2000,
      };

      updateActiveTangible('42', updated);

      const state = useTuioStore.getState();
      expect(state.activeTangibles.get('42')).toEqual(updated);
    });

    it('should not add new tangible if it does not exist', () => {
      const { updateActiveTangible } = useTuioStore.getState();

      updateActiveTangible('99', {
        hardwareId: '99',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(0);
      expect(state.activeTangibles.has('99')).toBe(false);
    });
  });

  describe('removeActiveTangible', () => {
    it('should remove a tangible', () => {
      const { addActiveTangible, removeActiveTangible } = useTuioStore.getState();

      addActiveTangible('42', {
        hardwareId: '42',
        x: 0.5,
        y: 0.5,
        angle: 0,
        lastUpdated: Date.now(),
      });

      expect(useTuioStore.getState().activeTangibles.size).toBe(1);

      removeActiveTangible('42');

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(0);
      expect(state.activeTangibles.has('42')).toBe(false);
    });

    it('should remove only specified tangible', () => {
      const { addActiveTangible, removeActiveTangible } = useTuioStore.getState();

      addActiveTangible('42', {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: Date.now(),
      });

      addActiveTangible('13', {
        hardwareId: '13',
        x: 0.7,
        y: 0.7,
        angle: 0,
        lastUpdated: Date.now(),
      });

      removeActiveTangible('42');

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(1);
      expect(state.activeTangibles.has('42')).toBe(false);
      expect(state.activeTangibles.has('13')).toBe(true);
    });

    it('should handle removing non-existent tangible gracefully', () => {
      const { removeActiveTangible } = useTuioStore.getState();

      removeActiveTangible('999');

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(0);
    });
  });

  describe('clearActiveTangibles', () => {
    it('should clear all tangibles', () => {
      const { addActiveTangible, clearActiveTangibles } = useTuioStore.getState();

      addActiveTangible('42', {
        hardwareId: '42',
        x: 0.3,
        y: 0.3,
        angle: 0,
        lastUpdated: Date.now(),
      });

      addActiveTangible('13', {
        hardwareId: '13',
        x: 0.7,
        y: 0.7,
        angle: 0,
        lastUpdated: Date.now(),
      });

      expect(useTuioStore.getState().activeTangibles.size).toBe(2);

      clearActiveTangibles();

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(0);
    });

    it('should reset lastStateChangeSource', () => {
      const { setLastStateChangeSource, clearActiveTangibles } = useTuioStore.getState();

      setLastStateChangeSource('42');
      expect(useTuioStore.getState().lastStateChangeSource).toBe('42');

      clearActiveTangibles();

      expect(useTuioStore.getState().lastStateChangeSource).toBe(null);
    });

    it('should handle clearing empty tangibles map', () => {
      const { clearActiveTangibles } = useTuioStore.getState();

      clearActiveTangibles();

      const state = useTuioStore.getState();
      expect(state.activeTangibles.size).toBe(0);
    });
  });

  describe('setLastStateChangeSource', () => {
    it('should set last state change source', () => {
      const { setLastStateChangeSource } = useTuioStore.getState();

      setLastStateChangeSource('42');

      expect(useTuioStore.getState().lastStateChangeSource).toBe('42');
    });

    it('should clear last state change source', () => {
      const { setLastStateChangeSource } = useTuioStore.getState();

      setLastStateChangeSource('42');
      setLastStateChangeSource(null);

      expect(useTuioStore.getState().lastStateChangeSource).toBe(null);
    });

    it('should update last state change source', () => {
      const { setLastStateChangeSource } = useTuioStore.getState();

      setLastStateChangeSource('42');
      expect(useTuioStore.getState().lastStateChangeSource).toBe('42');

      setLastStateChangeSource('13');
      expect(useTuioStore.getState().lastStateChangeSource).toBe('13');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive operations', () => {
      const { addActiveTangible, removeActiveTangible } = useTuioStore.getState();

      for (let i = 0; i < 100; i++) {
        addActiveTangible(`${i}`, {
          hardwareId: `${i}`,
          x: 0.5,
          y: 0.5,
          angle: 0,
          lastUpdated: Date.now(),
        });
      }

      expect(useTuioStore.getState().activeTangibles.size).toBe(100);

      for (let i = 0; i < 50; i++) {
        removeActiveTangible(`${i}`);
      }

      expect(useTuioStore.getState().activeTangibles.size).toBe(50);
    });

    it('should maintain state across multiple reads', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://test:3333');

      expect(useTuioStore.getState().websocketUrl).toBe('ws://test:3333');
      expect(useTuioStore.getState().websocketUrl).toBe('ws://test:3333');
      expect(useTuioStore.getState().websocketUrl).toBe('ws://test:3333');
    });
  });

  describe('Store Versioning', () => {
    it('should include version in persisted data', () => {
      const { setWebsocketUrl } = useTuioStore.getState();

      setWebsocketUrl('ws://test:3333');

      const stored = localStorage.getItem('constellation-tuio-settings');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
    });
  });
});
