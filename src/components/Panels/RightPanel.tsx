import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import NodeEditorPanel from './NodeEditorPanel';
import EdgeEditorPanel from './EdgeEditorPanel';
import GroupEditorPanel from './GroupEditorPanel';
import GraphAnalysisPanel from './GraphAnalysisPanel';
import type { Actor, Relation, Group } from '../../types';

/**
 * RightPanel - Context-aware properties panel on the right side
 *
 * Features:
 * - Shows properties of selected node(s) or edge(s)
 * - Live property updates (no save button)
 * - Connection information for actors
 * - Multi-selection support
 * - Non-modal design (doesn't block graph view)
 * - Collapsible
 */

interface Props {
  selectedNode: Actor | null;
  selectedEdge: Relation | null;
  selectedGroup: Group | null;
  onClose: () => void;
}

/**
 * PanelHeader - Reusable header component for right panel views
 */
interface PanelHeaderProps {
  title: string;
  onCollapse: () => void;
}

const PanelHeader = ({ title, onCollapse }: PanelHeaderProps) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
    <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
    <Tooltip title="Collapse Panel">
      <IconButton size="small" onClick={onCollapse}>
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </div>
);

const RightPanel = ({ selectedNode, selectedEdge, selectedGroup, onClose }: Props) => {
  const {
    rightPanelCollapsed,
    rightPanelWidth,
    collapseRightPanel,
    expandRightPanel,
  } = usePanelStore();

  const { nodes, edges } = useGraphWithHistory();

  // Collapsed view
  if (rightPanelCollapsed) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col items-center py-2" style={{ width: '40px' }}>
        <Tooltip title="Expand Properties Panel" placement="left">
          <IconButton size="small" onClick={expandRightPanel}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  // Group properties view (priority over node/edge if group selected)
  if (selectedGroup) {
    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <PanelHeader title="Group Properties" onCollapse={collapseRightPanel} />
        <GroupEditorPanel selectedGroup={selectedGroup} onClose={onClose} />
      </div>
    );
  }

  // Node properties view
  if (selectedNode) {
    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <PanelHeader title="Actor Properties" onCollapse={collapseRightPanel} />
        <NodeEditorPanel selectedNode={selectedNode} onClose={onClose} />
      </div>
    );
  }

  // Edge properties view
  if (selectedEdge) {
    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <PanelHeader title="Relation Properties" onCollapse={collapseRightPanel} />
        <EdgeEditorPanel selectedEdge={selectedEdge} onClose={onClose} />
      </div>
    );
  }

  // No selection state - show graph metrics
  return (
    <div
      className="h-full bg-white border-l border-gray-200 flex flex-col"
      style={{ width: `${rightPanelWidth}px` }}
    >
      <PanelHeader title="Graph Analysis" onCollapse={collapseRightPanel} />
      <GraphAnalysisPanel nodes={nodes} edges={edges} />
    </div>
  );
};

export default RightPanel;
