import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import NodeEditorPanel from './NodeEditorPanel';
import EdgeEditorPanel from './EdgeEditorPanel';
import GroupEditorPanel from './GroupEditorPanel';
import GraphAnalysisPanel from './GraphAnalysisPanel';
import MultiSelectProperties from './MultiSelectProperties';
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
  selectedActors?: Actor[];
  selectedRelations?: Relation[];
  selectedGroups?: Group[];
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

const RightPanel = ({
  selectedNode,
  selectedEdge,
  selectedGroup,
  selectedActors = [],
  selectedRelations = [],
  selectedGroups = [],
  onClose,
}: Props) => {
  const {
    rightPanelCollapsed,
    rightPanelWidth,
    collapseRightPanel,
    expandRightPanel,
  } = usePanelStore();

  const { nodes, edges } = useGraphWithHistory();

  // Calculate total multi-selection count
  const totalMultiSelect =
    selectedActors.length + selectedRelations.length + selectedGroups.length;
  const hasMultiSelect = totalMultiSelect >= 2;

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

  // Multi-select view (priority over single selections)
  if (hasMultiSelect) {
    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <PanelHeader title="Multi-Select Properties" onCollapse={collapseRightPanel} />
        <MultiSelectProperties
          selectedActors={selectedActors}
          selectedRelations={selectedRelations}
          selectedGroups={selectedGroups}
          onClose={onClose}
        />
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
    // Check if this is an aggregated edge (multiple relations between minimized groups)
    const isAggregated = !!(selectedEdge.data as { aggregatedCount?: number })?.aggregatedCount;

    if (isAggregated) {
      // Show a special view for aggregated edges
      const aggregatedCount = (selectedEdge.data as { aggregatedCount?: number })?.aggregatedCount || 0;
      return (
        <div
          className="h-full bg-white border-l border-gray-200 flex flex-col"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <PanelHeader title="Aggregated Relations" onCollapse={collapseRightPanel} />
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{aggregatedCount} relations</strong> are aggregated between these minimized groups.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Maximize the groups to see and edit individual relations.
              </p>
            </div>
          </div>
        </div>
      );
    }

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
