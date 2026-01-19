import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TuioTangibleInfo } from '../lib/tuio/types';

/**
 * TUIO Store - Manages TUIO protocol connection and tangible detection
 *
 * Features:
 * - WebSocket URL configuration (persisted)
 * - TUIO protocol version selection (persisted)
 * - Connection state management (runtime only)
 * - Active tangibles tracking (runtime only)
 * - Auto-save configuration to localStorage
 */

export type TuioProtocolVersion = '1.1' | '2.0';

interface TuioState {
  // Configuration (persisted)
  websocketUrl: string;
  setWebsocketUrl: (url: string) => void;
  protocolVersion: TuioProtocolVersion;
  setProtocolVersion: (version: TuioProtocolVersion) => void;

  // Connection state (runtime only - not persisted)
  isConnected: boolean;
  connectionError: string | null;
  setConnectionState: (connected: boolean, error?: string) => void;

  // Active tangibles (runtime only - not persisted)
  activeTangibles: Map<string, TuioTangibleInfo>;
  activeStateTangibles: string[]; // Hardware IDs of active state tangibles in order
  addActiveTangible: (hardwareId: string, info: TuioTangibleInfo) => void;
  updateActiveTangible: (hardwareId: string, info: TuioTangibleInfo) => void;
  removeActiveTangible: (hardwareId: string) => void;
  clearActiveTangibles: () => void;
  addActiveStateTangible: (hardwareId: string) => void;
  removeActiveStateTangible: (hardwareId: string) => void;
  clearActiveStateTangibles: () => void;

  // Presentation mode filters (runtime only - separate from editing mode filters)
  presentationFilters: {
    labels: string[];
    actorTypes: string[];
    relationTypes: string[];
    combineMode: 'AND' | 'OR';
  };
  setPresentationFilters: (filters: {
    labels: string[];
    actorTypes: string[];
    relationTypes: string[];
    combineMode: 'AND' | 'OR';
  }) => void;
  clearPresentationFilters: () => void;
}

const DEFAULT_WEBSOCKET_URL = 'ws://localhost:3333';
const DEFAULT_PROTOCOL_VERSION: TuioProtocolVersion = '2.0';

export const useTuioStore = create<TuioState>()(
  persist(
    (set) => ({
      // Configuration
      websocketUrl: DEFAULT_WEBSOCKET_URL,
      setWebsocketUrl: (url: string) => set({ websocketUrl: url }),
      protocolVersion: DEFAULT_PROTOCOL_VERSION,
      setProtocolVersion: (version: TuioProtocolVersion) => set({ protocolVersion: version }),

      // Connection state
      isConnected: false,
      connectionError: null,
      setConnectionState: (connected: boolean, error?: string) =>
        set({
          isConnected: connected,
          connectionError: error || null,
        }),

      // Active tangibles
      activeTangibles: new Map(),
      activeStateTangibles: [],

      addActiveTangible: (hardwareId: string, info: TuioTangibleInfo) =>
        set((state) => {
          const newMap = new Map(state.activeTangibles);
          newMap.set(hardwareId, info);
          return { activeTangibles: newMap };
        }),

      updateActiveTangible: (hardwareId: string, info: TuioTangibleInfo) =>
        set((state) => {
          const newMap = new Map(state.activeTangibles);
          if (newMap.has(hardwareId)) {
            newMap.set(hardwareId, info);
          }
          return { activeTangibles: newMap };
        }),

      removeActiveTangible: (hardwareId: string) =>
        set((state) => {
          const newMap = new Map(state.activeTangibles);
          newMap.delete(hardwareId);
          return { activeTangibles: newMap };
        }),

      clearActiveTangibles: () =>
        set({
          activeTangibles: new Map(),
          activeStateTangibles: [],
        }),

      addActiveStateTangible: (hardwareId: string) =>
        set((state) => {
          // Add to end of list if not already present
          if (!state.activeStateTangibles.includes(hardwareId)) {
            return { activeStateTangibles: [...state.activeStateTangibles, hardwareId] };
          }
          return state;
        }),

      removeActiveStateTangible: (hardwareId: string) =>
        set((state) => {
          return {
            activeStateTangibles: state.activeStateTangibles.filter((id) => id !== hardwareId),
          };
        }),

      clearActiveStateTangibles: () =>
        set({ activeStateTangibles: [] }),

      // Presentation mode filters
      presentationFilters: {
        labels: [],
        actorTypes: [],
        relationTypes: [],
        combineMode: 'OR', // Default to OR for presentation mode
      },

      setPresentationFilters: (filters) =>
        set({ presentationFilters: filters }),

      clearPresentationFilters: () =>
        set({
          presentationFilters: {
            labels: [],
            actorTypes: [],
            relationTypes: [],
            combineMode: 'OR',
          },
        }),
    }),
    {
      name: 'constellation-tuio-settings',
      version: 1,
      // Only persist configuration, not runtime state
      partialize: (state) => ({
        websocketUrl: state.websocketUrl,
        protocolVersion: state.protocolVersion,
      }),
    }
  )
);
