import React, { useCallback, useState, useEffect } from 'react';
import { usePanelStore, PANEL_CONSTANTS } from '../../stores/panelStore';
import { IconButton, Tooltip, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import TimelineView from './TimelineView';
import CreateStateDialog from './CreateStateDialog';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTimelineStore } from '../../stores/timelineStore';

/**
 * BottomPanel - Timeline visualization and state management
 */
const BottomPanel: React.FC = () => {
  const {
    bottomPanelHeight,
    bottomPanelCollapsed,
    setBottomPanelHeight,
    collapseBottomPanel,
    expandBottomPanel,
  } = usePanelStore();

  const { activeDocumentId } = useWorkspaceStore();
  const { timelines, getAllStates } = useTimelineStore();

  const [isResizing, setIsResizing] = useState(false);
  const [showCreateState, setShowCreateState] = useState(false);

  const hasTimeline = activeDocumentId ? timelines.has(activeDocumentId) : false;
  const currentState = hasTimeline ? getAllStates().find(s => {
    const timeline = timelines.get(activeDocumentId!);
    return timeline && s.id === timeline.currentStateId;
  }) : null;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;

      const clampedHeight = Math.max(
        PANEL_CONSTANTS.MIN_BOTTOM_HEIGHT,
        Math.min(PANEL_CONSTANTS.MAX_BOTTOM_HEIGHT, newHeight)
      );

      setBottomPanelHeight(clampedHeight);
    },
    [isResizing, setBottomPanelHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const displayHeight = bottomPanelCollapsed
    ? PANEL_CONSTANTS.COLLAPSED_BOTTOM_HEIGHT
    : bottomPanelHeight;

  return (
    <div
      className="bg-white border-t border-gray-300 relative flex flex-col"
      style={{ height: `${displayHeight}px` }}
    >
      {/* Resize Handle */}
      {!bottomPanelCollapsed && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 z-10 transition-colors"
          onMouseDown={handleMouseDown}
          style={{ cursor: isResizing ? 'ns-resize' : 'ns-resize' }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Timeline</h3>

          {/* Current State Indicator */}
          {currentState && !bottomPanelCollapsed && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                <span className="text-xs font-medium text-blue-700">Current:</span>
                <span className="text-sm font-semibold text-blue-900">{currentState.label}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Timeline Controls - Only show when expanded */}
          {!bottomPanelCollapsed && activeDocumentId && hasTimeline && (
            <>
              <Tooltip title="Create New State" arrow>
                <IconButton onClick={() => setShowCreateState(true)} size="small">
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
          )}

          {/* Collapse/Expand Button */}
          <Tooltip title={bottomPanelCollapsed ? 'Expand Timeline' : 'Collapse Timeline'} arrow>
            <IconButton
              size="small"
              onClick={bottomPanelCollapsed ? expandBottomPanel : collapseBottomPanel}
            >
              {bottomPanelCollapsed ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Create State Dialog */}
      <CreateStateDialog
        open={showCreateState}
        onClose={() => setShowCreateState(false)}
      />

      {/* Content - Only show when not collapsed */}
      {!bottomPanelCollapsed && (
        <div className="flex-1 overflow-hidden">
          <TimelineView />
        </div>
      )}
    </div>
  );
};

export default BottomPanel;
