import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Panel Store - Manages state of collapsible side panels
 *
 * Features:
 * - Left panel (tools) visibility and width
 * - Right panel (properties) visibility and width
 * - Panel state persistence to localStorage
 * - Collapsed section state within panels
 */

interface PanelState {
  // Left Panel
  leftPanelVisible: boolean;
  leftPanelWidth: number;
  leftPanelCollapsed: boolean;
  leftPanelSections: {
    history: boolean;
    addActors: boolean;
    relations: boolean;
    layout: boolean;
    view: boolean;
    search: boolean;
  };

  // Right Panel
  rightPanelVisible: boolean;
  rightPanelWidth: number;
  rightPanelCollapsed: boolean;

  // Bottom Panel (Timeline)
  bottomPanelVisible: boolean;
  bottomPanelHeight: number;
  bottomPanelCollapsed: boolean;

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleLeftPanelSection: (section: keyof PanelState['leftPanelSections']) => void;
  collapseLeftPanel: () => void;
  expandLeftPanel: () => void;
  collapseRightPanel: () => void;
  expandRightPanel: () => void;
  collapseBottomPanel: () => void;
  expandBottomPanel: () => void;
}

const DEFAULT_LEFT_WIDTH = 280;
const DEFAULT_RIGHT_WIDTH = 320;
const DEFAULT_BOTTOM_HEIGHT = 200;
const MIN_LEFT_WIDTH = 240;
const MAX_LEFT_WIDTH = 400;
const MIN_RIGHT_WIDTH = 280;
const MAX_RIGHT_WIDTH = 500;
const MIN_BOTTOM_HEIGHT = 150;
const MAX_BOTTOM_HEIGHT = 500;
const COLLAPSED_LEFT_WIDTH = 40;
const COLLAPSED_BOTTOM_HEIGHT = 48;

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      // Initial state
      leftPanelVisible: true,
      leftPanelWidth: DEFAULT_LEFT_WIDTH,
      leftPanelCollapsed: false,
      leftPanelSections: {
        history: true,
        addActors: true,
        relations: true,
        layout: false,
        view: false,
        search: false,
      },

      rightPanelVisible: true,
      rightPanelWidth: DEFAULT_RIGHT_WIDTH,
      rightPanelCollapsed: false,

      bottomPanelVisible: true, // Timeline panel is always visible (can be collapsed but not hidden)
      bottomPanelHeight: DEFAULT_BOTTOM_HEIGHT,
      bottomPanelCollapsed: false,

      // Actions
      toggleLeftPanel: () =>
        set((state) => ({
          leftPanelVisible: !state.leftPanelVisible,
        })),

      toggleRightPanel: () =>
        set((state) => ({
          rightPanelVisible: !state.rightPanelVisible,
        })),

      setLeftPanelWidth: (width: number) =>
        set(() => ({
          leftPanelWidth: Math.max(MIN_LEFT_WIDTH, Math.min(MAX_LEFT_WIDTH, width)),
        })),

      setRightPanelWidth: (width: number) =>
        set(() => ({
          rightPanelWidth: Math.max(MIN_RIGHT_WIDTH, Math.min(MAX_RIGHT_WIDTH, width)),
        })),

      setBottomPanelHeight: (height: number) =>
        set(() => ({
          bottomPanelHeight: Math.max(MIN_BOTTOM_HEIGHT, Math.min(MAX_BOTTOM_HEIGHT, height)),
        })),

      toggleLeftPanelSection: (section) =>
        set((state) => ({
          leftPanelSections: {
            ...state.leftPanelSections,
            [section]: !state.leftPanelSections[section],
          },
        })),

      collapseLeftPanel: () =>
        set(() => ({
          leftPanelCollapsed: true,
        })),

      expandLeftPanel: () =>
        set(() => ({
          leftPanelCollapsed: false,
        })),

      collapseRightPanel: () =>
        set(() => ({
          rightPanelCollapsed: true,
        })),

      expandRightPanel: () =>
        set(() => ({
          rightPanelCollapsed: false,
        })),

      collapseBottomPanel: () =>
        set(() => ({
          bottomPanelCollapsed: true,
        })),

      expandBottomPanel: () =>
        set(() => ({
          bottomPanelCollapsed: false,
        })),
    }),
    {
      name: 'constellation-panel-state',
    }
  )
);

// Export constants for use in components
export const PANEL_CONSTANTS = {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  DEFAULT_BOTTOM_HEIGHT,
  MIN_LEFT_WIDTH,
  MAX_LEFT_WIDTH,
  MIN_RIGHT_WIDTH,
  MAX_RIGHT_WIDTH,
  MIN_BOTTOM_HEIGHT,
  MAX_BOTTOM_HEIGHT,
  COLLAPSED_LEFT_WIDTH,
  COLLAPSED_BOTTOM_HEIGHT,
};
