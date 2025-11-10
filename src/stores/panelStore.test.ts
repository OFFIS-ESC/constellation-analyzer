import { describe, it, expect, beforeEach } from 'vitest';
import { usePanelStore, PANEL_CONSTANTS } from './panelStore';

describe('panelStore', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset store to initial state
    usePanelStore.setState({
      leftPanelVisible: true,
      leftPanelWidth: PANEL_CONSTANTS.DEFAULT_LEFT_WIDTH,
      leftPanelCollapsed: false,
      leftPanelSections: {
        history: true,
        addActors: true,
        relations: true,
        labels: false,
        layout: false,
        view: false,
        search: false,
      },
      rightPanelVisible: true,
      rightPanelWidth: PANEL_CONSTANTS.DEFAULT_RIGHT_WIDTH,
      rightPanelCollapsed: false,
      bottomPanelVisible: true,
      bottomPanelHeight: PANEL_CONSTANTS.DEFAULT_BOTTOM_HEIGHT,
      bottomPanelCollapsed: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct default panel states', () => {
      const state = usePanelStore.getState();

      expect(state.leftPanelVisible).toBe(true);
      expect(state.leftPanelWidth).toBe(280);
      expect(state.leftPanelCollapsed).toBe(false);

      expect(state.rightPanelVisible).toBe(true);
      expect(state.rightPanelWidth).toBe(320);
      expect(state.rightPanelCollapsed).toBe(false);

      expect(state.bottomPanelVisible).toBe(true);
      expect(state.bottomPanelHeight).toBe(200);
      expect(state.bottomPanelCollapsed).toBe(false);
    });

    it('should have correct default section states', () => {
      const state = usePanelStore.getState();

      expect(state.leftPanelSections.history).toBe(true);
      expect(state.leftPanelSections.addActors).toBe(true);
      expect(state.leftPanelSections.relations).toBe(true);
      expect(state.leftPanelSections.labels).toBe(false);
      expect(state.leftPanelSections.layout).toBe(false);
      expect(state.leftPanelSections.view).toBe(false);
      expect(state.leftPanelSections.search).toBe(false);
    });
  });

  describe('Panel Visibility', () => {
    describe('toggleLeftPanel', () => {
      it('should toggle left panel visibility', () => {
        const { toggleLeftPanel } = usePanelStore.getState();

        toggleLeftPanel();
        expect(usePanelStore.getState().leftPanelVisible).toBe(false);

        toggleLeftPanel();
        expect(usePanelStore.getState().leftPanelVisible).toBe(true);
      });
    });

    describe('toggleRightPanel', () => {
      it('should toggle right panel visibility', () => {
        const { toggleRightPanel } = usePanelStore.getState();

        toggleRightPanel();
        expect(usePanelStore.getState().rightPanelVisible).toBe(false);

        toggleRightPanel();
        expect(usePanelStore.getState().rightPanelVisible).toBe(true);
      });
    });
  });

  describe('Panel Width/Height', () => {
    describe('setLeftPanelWidth', () => {
      it('should set left panel width within bounds', () => {
        const { setLeftPanelWidth } = usePanelStore.getState();

        setLeftPanelWidth(300);
        expect(usePanelStore.getState().leftPanelWidth).toBe(300);
      });

      it('should clamp width to minimum', () => {
        const { setLeftPanelWidth } = usePanelStore.getState();

        setLeftPanelWidth(100); // Below MIN_LEFT_WIDTH (240)
        expect(usePanelStore.getState().leftPanelWidth).toBe(240);
      });

      it('should clamp width to maximum', () => {
        const { setLeftPanelWidth } = usePanelStore.getState();

        setLeftPanelWidth(500); // Above MAX_LEFT_WIDTH (400)
        expect(usePanelStore.getState().leftPanelWidth).toBe(400);
      });
    });

    describe('setRightPanelWidth', () => {
      it('should set right panel width within bounds', () => {
        const { setRightPanelWidth } = usePanelStore.getState();

        setRightPanelWidth(350);
        expect(usePanelStore.getState().rightPanelWidth).toBe(350);
      });

      it('should clamp width to minimum', () => {
        const { setRightPanelWidth } = usePanelStore.getState();

        setRightPanelWidth(200); // Below MIN_RIGHT_WIDTH (280)
        expect(usePanelStore.getState().rightPanelWidth).toBe(280);
      });

      it('should clamp width to maximum', () => {
        const { setRightPanelWidth } = usePanelStore.getState();

        setRightPanelWidth(600); // Above MAX_RIGHT_WIDTH (500)
        expect(usePanelStore.getState().rightPanelWidth).toBe(500);
      });
    });

    describe('setBottomPanelHeight', () => {
      it('should set bottom panel height within bounds', () => {
        const { setBottomPanelHeight } = usePanelStore.getState();

        setBottomPanelHeight(250);
        expect(usePanelStore.getState().bottomPanelHeight).toBe(250);
      });

      it('should clamp height to minimum', () => {
        const { setBottomPanelHeight } = usePanelStore.getState();

        setBottomPanelHeight(100); // Below MIN_BOTTOM_HEIGHT (150)
        expect(usePanelStore.getState().bottomPanelHeight).toBe(150);
      });

      it('should clamp height to maximum', () => {
        const { setBottomPanelHeight } = usePanelStore.getState();

        setBottomPanelHeight(600); // Above MAX_BOTTOM_HEIGHT (500)
        expect(usePanelStore.getState().bottomPanelHeight).toBe(500);
      });
    });
  });

  describe('Panel Collapse/Expand', () => {
    describe('Left Panel', () => {
      it('should collapse left panel', () => {
        const { collapseLeftPanel } = usePanelStore.getState();

        collapseLeftPanel();
        expect(usePanelStore.getState().leftPanelCollapsed).toBe(true);
      });

      it('should expand left panel', () => {
        const { collapseLeftPanel, expandLeftPanel } = usePanelStore.getState();

        collapseLeftPanel();
        expandLeftPanel();
        expect(usePanelStore.getState().leftPanelCollapsed).toBe(false);
      });
    });

    describe('Right Panel', () => {
      it('should collapse right panel', () => {
        const { collapseRightPanel } = usePanelStore.getState();

        collapseRightPanel();
        expect(usePanelStore.getState().rightPanelCollapsed).toBe(true);
      });

      it('should expand right panel', () => {
        const { collapseRightPanel, expandRightPanel } = usePanelStore.getState();

        collapseRightPanel();
        expandRightPanel();
        expect(usePanelStore.getState().rightPanelCollapsed).toBe(false);
      });
    });

    describe('Bottom Panel', () => {
      it('should collapse bottom panel', () => {
        const { collapseBottomPanel } = usePanelStore.getState();

        collapseBottomPanel();
        expect(usePanelStore.getState().bottomPanelCollapsed).toBe(true);
      });

      it('should expand bottom panel', () => {
        const { collapseBottomPanel, expandBottomPanel } = usePanelStore.getState();

        collapseBottomPanel();
        expandBottomPanel();
        expect(usePanelStore.getState().bottomPanelCollapsed).toBe(false);
      });
    });
  });

  describe('Section Toggle', () => {
    it('should toggle individual section', () => {
      const { toggleLeftPanelSection } = usePanelStore.getState();

      expect(usePanelStore.getState().leftPanelSections.labels).toBe(false);

      toggleLeftPanelSection('labels');
      expect(usePanelStore.getState().leftPanelSections.labels).toBe(true);

      toggleLeftPanelSection('labels');
      expect(usePanelStore.getState().leftPanelSections.labels).toBe(false);
    });

    it('should toggle multiple sections independently', () => {
      const { toggleLeftPanelSection } = usePanelStore.getState();

      toggleLeftPanelSection('layout');
      toggleLeftPanelSection('view');

      const state = usePanelStore.getState();
      expect(state.leftPanelSections.layout).toBe(true);
      expect(state.leftPanelSections.view).toBe(true);
      expect(state.leftPanelSections.labels).toBe(false); // Unchanged
    });

    it('should not affect other sections when toggling', () => {
      const { toggleLeftPanelSection } = usePanelStore.getState();

      const initialState = usePanelStore.getState().leftPanelSections;

      toggleLeftPanelSection('search');

      const newState = usePanelStore.getState().leftPanelSections;
      expect(newState.history).toBe(initialState.history);
      expect(newState.addActors).toBe(initialState.addActors);
      expect(newState.relations).toBe(initialState.relations);
      expect(newState.search).toBe(!initialState.search);
    });
  });

  describe('Persistence', () => {
    it('should persist panel state to localStorage', () => {
      const { toggleLeftPanel, setLeftPanelWidth } = usePanelStore.getState();

      toggleLeftPanel();
      setLeftPanelWidth(350);

      const stored = localStorage.getItem('constellation-panel-state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.leftPanelVisible).toBe(false);
      expect(parsed.state.leftPanelWidth).toBe(350);
    });
  });

  describe('PANEL_CONSTANTS Export', () => {
    it('should export all panel constants', () => {
      expect(PANEL_CONSTANTS.DEFAULT_LEFT_WIDTH).toBe(280);
      expect(PANEL_CONSTANTS.DEFAULT_RIGHT_WIDTH).toBe(320);
      expect(PANEL_CONSTANTS.DEFAULT_BOTTOM_HEIGHT).toBe(200);
      expect(PANEL_CONSTANTS.MIN_LEFT_WIDTH).toBe(240);
      expect(PANEL_CONSTANTS.MAX_LEFT_WIDTH).toBe(400);
      expect(PANEL_CONSTANTS.MIN_RIGHT_WIDTH).toBe(280);
      expect(PANEL_CONSTANTS.MAX_RIGHT_WIDTH).toBe(500);
      expect(PANEL_CONSTANTS.MIN_BOTTOM_HEIGHT).toBe(150);
      expect(PANEL_CONSTANTS.MAX_BOTTOM_HEIGHT).toBe(500);
      expect(PANEL_CONSTANTS.COLLAPSED_LEFT_WIDTH).toBe(40);
      expect(PANEL_CONSTANTS.COLLAPSED_BOTTOM_HEIGHT).toBe(48);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large width values', () => {
      const { setLeftPanelWidth } = usePanelStore.getState();

      setLeftPanelWidth(10000);
      expect(usePanelStore.getState().leftPanelWidth).toBe(400); // Clamped to max
    });

    it('should handle negative width values', () => {
      const { setLeftPanelWidth } = usePanelStore.getState();

      setLeftPanelWidth(-100);
      expect(usePanelStore.getState().leftPanelWidth).toBe(240); // Clamped to min
    });

    it('should handle rapid consecutive panel toggles', () => {
      const { toggleLeftPanel } = usePanelStore.getState();

      for (let i = 0; i < 100; i++) {
        toggleLeftPanel();
      }

      // After even number of toggles, should be back to true
      expect(usePanelStore.getState().leftPanelVisible).toBe(true);
    });

    it('should handle rapid section toggles', () => {
      const { toggleLeftPanelSection } = usePanelStore.getState();

      const initialState = usePanelStore.getState().leftPanelSections.labels;

      for (let i = 0; i < 100; i++) {
        toggleLeftPanelSection('labels');
      }

      // After even number of toggles, should be back to initial
      expect(usePanelStore.getState().leftPanelSections.labels).toBe(initialState);
    });
  });
});
