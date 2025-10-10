import { useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useEditorStore } from '../../stores/editorStore';
import { createNode } from '../../utils/nodeUtils';
import { getIconComponent } from '../../utils/iconUtils';
import { getContrastColor } from '../../utils/colorUtils';

/**
 * LeftPanel - Collapsible tools panel on the left side
 *
 * Features:
 * - Collapsible sections (History, Add Actors, Relations, Layout, View, Search)
 * - Drag-and-drop actor creation
 * - Undo/Redo with descriptions
 * - Relation type selector
 * - Collapse to icon bar (40px)
 * - Resizable width
 */

interface LeftPanelProps {
  onDeselectAll: () => void;
  onAddNode?: (nodeTypeId: string, position?: { x: number; y: number }) => void;
}

const LeftPanel = ({ onDeselectAll, onAddNode }: LeftPanelProps) => {
  const {
    leftPanelCollapsed,
    leftPanelWidth,
    leftPanelSections,
    toggleLeftPanelSection,
    collapseLeftPanel,
    expandLeftPanel,
  } = usePanelStore();

  const { nodeTypes, edgeTypes, addNode } = useGraphWithHistory();
  const { selectedRelationType, setSelectedRelationType } = useEditorStore();

  const handleAddNode = useCallback(
    (nodeTypeId: string) => {
      // Use the shared callback from GraphEditor if available
      if (onAddNode) {
        onAddNode(nodeTypeId);
      } else {
        // Fallback to old behavior (for backwards compatibility)
        onDeselectAll();

        const position = {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        };

        const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeTypeId);
        const newNode = createNode(nodeTypeId, position, nodeTypeConfig);
        newNode.selected = true;

        addNode(newNode);
      }
    },
    [onAddNode, onDeselectAll, addNode, nodeTypes]
  );

  const selectedEdgeTypeConfig = edgeTypes.find(et => et.id === selectedRelationType);

  // Collapsed icon bar view
  if (leftPanelCollapsed) {
    return (
      <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 space-y-2" style={{ width: '40px' }}>
        <Tooltip title="Expand Tools Panel" placement="right">
          <IconButton size="small" onClick={expandLeftPanel}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  // Expanded panel view
  return (
    <div
      className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden"
      style={{ width: `${leftPanelWidth}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Tools</h2>
        <Tooltip title="Collapse Panel">
          <IconButton size="small" onClick={collapseLeftPanel}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Add Actors Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('addActors')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Add Actors</span>
            {leftPanelSections.addActors ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.addActors && (
            <div className="px-3 py-3 space-y-2">
              {nodeTypes.map((nodeType) => {
                const IconComponent = getIconComponent(nodeType.icon);
                const textColor = getContrastColor(nodeType.color);

                return (
                  <button
                    key={nodeType.id}
                    onClick={() => handleAddNode(nodeType.id)}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
                    style={{
                      backgroundColor: nodeType.color,
                      color: textColor
                    }}
                    title={nodeType.description}
                  >
                    {IconComponent ? (
                      <div className="w-5 h-5 flex items-center justify-center" style={{ color: textColor, fontSize: '1.25rem' }}>
                        <IconComponent />
                      </div>
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: nodeType.color,
                          borderColor: textColor
                        }}
                      />
                    )}
                    <span className="flex-1 text-left">{nodeType.label}</span>
                  </button>
                );
              })}
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Click a button to add an actor to the canvas
              </p>
            </div>
          )}
        </div>

        {/* Relations Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('relations')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Relations</span>
            {leftPanelSections.relations ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.relations && (
            <div className="px-3 py-3 space-y-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Active Type
              </label>
              <select
                value={selectedRelationType || ''}
                onChange={(e) => setSelectedRelationType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: selectedEdgeTypeConfig?.color || '#6b7280'
                }}
              >
                {edgeTypes.map((edgeType) => (
                  <option key={edgeType.id} value={edgeType.id}>
                    {edgeType.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 pt-1">
                Drag from actor handles to create relations
              </p>
            </div>
          )}
        </div>

        {/* Layout Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('layout')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Layout</span>
            {leftPanelSections.layout ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.layout && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 italic">
                Auto-layout features coming soon
              </p>
            </div>
          )}
        </div>

        {/* View Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('view')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">View</span>
            {leftPanelSections.view ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.view && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 italic">
                View options coming soon
              </p>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('search')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Search & Filter</span>
            {leftPanelSections.search ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.search && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 italic">
                Search features coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
