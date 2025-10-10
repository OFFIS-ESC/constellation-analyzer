import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import GraphMetrics from '../Common/GraphMetrics';
import type { Actor, Relation } from '../../types';

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
  onClose: () => void;
}

const RightPanel = ({ selectedNode, selectedEdge, onClose }: Props) => {

  const {
    rightPanelCollapsed,
    rightPanelWidth,
    collapseRightPanel,
    expandRightPanel,
  } = usePanelStore();

  const { nodes, edges, nodeTypes, edgeTypes, updateNode, updateEdge, deleteNode, deleteEdge } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Node property states
  const [actorType, setActorType] = useState('');
  const [actorLabel, setActorLabel] = useState('');
  const [actorDescription, setActorDescription] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Edge property states
  const [relationType, setRelationType] = useState('');
  const [relationLabel, setRelationLabel] = useState('');

  // Track if user has made changes
  const [hasNodeChanges, setHasNodeChanges] = useState(false);
  const [hasEdgeChanges, setHasEdgeChanges] = useState(false);

  // Update state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setActorType(selectedNode.data?.type || '');
      setActorLabel(selectedNode.data?.label || '');
      setActorDescription(selectedNode.data?.description || '');
      setHasNodeChanges(false);

      // Focus and select the label input when node is selected
      setTimeout(() => {
        if (labelInputRef.current && !rightPanelCollapsed) {
          labelInputRef.current.focus();
          labelInputRef.current.select();
        }
      }, 100);
    }
  }, [selectedNode, rightPanelCollapsed]);

  // Update state when selected edge changes
  useEffect(() => {
    if (selectedEdge && selectedEdge.data) {
      setRelationType(selectedEdge.data.type || '');
      const typeLabel = edgeTypes.find((et) => et.id === selectedEdge.data?.type)?.label;
      const hasCustomLabel = selectedEdge.data.label && selectedEdge.data.label !== typeLabel;
      setRelationLabel((hasCustomLabel && selectedEdge.data.label) || '');
      setHasEdgeChanges(false);
    }
  }, [selectedEdge, edgeTypes]);

  // Live update node properties (debounced)
  const updateNodeProperties = useCallback(() => {
    if (!selectedNode || !hasNodeChanges) return;
    updateNode(selectedNode.id, {
      data: {
        type: actorType,
        label: actorLabel,
        description: actorDescription || undefined,
      },
    });
    setHasNodeChanges(false);
  }, [selectedNode, actorType, actorLabel, actorDescription, hasNodeChanges, updateNode]);

  // Live update edge properties (debounced)
  const updateEdgeProperties = useCallback(() => {
    if (!selectedEdge || !hasEdgeChanges) return;
    updateEdge(selectedEdge.id, {
      type: relationType,
      label: relationLabel.trim() || undefined,
    });
    setHasEdgeChanges(false);
  }, [selectedEdge, relationType, relationLabel, hasEdgeChanges, updateEdge]);

  // Debounce live updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasNodeChanges) {
        updateNodeProperties();
      }
      if (hasEdgeChanges) {
        updateEdgeProperties();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [hasNodeChanges, hasEdgeChanges, updateNodeProperties, updateEdgeProperties]);

  // Handle node deletion
  const handleDeleteNode = async () => {
    if (!selectedNode) return;
    const confirmed = await confirm({
      title: 'Delete Actor',
      message: 'Are you sure you want to delete this actor? All connected relations will also be deleted.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });
    if (confirmed) {
      deleteNode(selectedNode.id);
      onClose();
    }
  };

  // Handle edge deletion
  const handleDeleteEdge = async () => {
    if (!selectedEdge) return;
    const confirmed = await confirm({
      title: 'Delete Relation',
      message: 'Are you sure you want to delete this relation?',
      confirmLabel: 'Delete',
      severity: 'danger',
    });
    if (confirmed) {
      deleteEdge(selectedEdge.id);
      onClose();
    }
  };

  // Get connections for selected node
  const getNodeConnections = () => {
    if (!selectedNode) return [];
    return edges.filter(
      (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
    );
  };

  const selectedNodeTypeConfig = nodeTypes.find((nt) => nt.id === actorType);
  const selectedEdgeTypeConfig = edgeTypes.find((et) => et.id === relationType);

  // Collapsed view
  if (rightPanelCollapsed) {
    return (
      <div className="h-full bg-gray-50 border-l border-gray-200 flex flex-col items-center py-2" style={{ width: '40px' }}>
        <Tooltip title="Expand Properties Panel (Ctrl+I)" placement="left">
          <IconButton size="small" onClick={expandRightPanel}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {ConfirmDialogComponent}
      </div>
    );
  }

  // No selection state - show graph metrics
  if (!selectedNode && !selectedEdge) {
    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        <GraphMetrics nodes={nodes} edges={edges} />
        {ConfirmDialogComponent}
      </div>
    );
  }

  // Node properties view
  if (selectedNode) {
    const connections = getNodeConnections();

    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Actor Properties</h2>
          <div className="flex items-center space-x-1">
            <Tooltip title="Close (Esc)">
              <IconButton size="small" onClick={onClose}>
                ✕
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse Panel (Ctrl+I)">
              <IconButton size="small" onClick={collapseRightPanel}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
          {/* Actor Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Actor Type
            </label>
            <select
              value={actorType}
              onChange={(e) => {
                setActorType(e.target.value);
                setHasNodeChanges(true);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {nodeTypes.map((nodeType) => (
                <option key={nodeType.id} value={nodeType.id}>
                  {nodeType.label}
                </option>
              ))}
            </select>
            {selectedNodeTypeConfig && (
              <div
                className="mt-2 h-8 rounded border-2 flex items-center justify-center text-xs font-medium text-white"
                style={{
                  backgroundColor: selectedNodeTypeConfig.color,
                  borderColor: selectedNodeTypeConfig.color,
                }}
              >
                {selectedNodeTypeConfig.label}
              </div>
            )}
          </div>

          {/* Actor Label */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Label *
            </label>
            <input
              ref={labelInputRef}
              type="text"
              value={actorLabel}
              onChange={(e) => {
                setActorLabel(e.target.value);
                setHasNodeChanges(true);
              }}
              placeholder="Enter actor name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={actorDescription}
              onChange={(e) => {
                setActorDescription(e.target.value);
                setHasNodeChanges(true);
              }}
              placeholder="Add a description"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Connections */}
          <div className="pt-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">
              Connections ({connections.length})
            </h3>
            {connections.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No connections</p>
            ) : (
              <div className="space-y-1">
                {connections.map((edge) => {
                  const edgeConfig = edgeTypes.find((et) => et.id === edge.data?.type);
                  const isOutgoing = edge.source === selectedNode.id;
                  const otherId = isOutgoing ? edge.target : edge.source;

                  return (
                    <div
                      key={edge.id}
                      className="text-xs text-gray-600 flex items-center space-x-1"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: edgeConfig?.color || '#6b7280' }}
                      />
                      <span className="font-medium">{edgeConfig?.label || 'Unknown'}</span>
                      <span>{isOutgoing ? '→' : '←'}</span>
                      <span className="text-gray-500">{otherId}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Node Info */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Node ID:</span> {selectedNode.id}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Position:</span> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
            </p>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDeleteNode}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <DeleteIcon fontSize="small" />
            <span>Delete Actor</span>
          </button>
          {hasNodeChanges && (
            <p className="text-xs text-gray-500 mt-2 text-center italic">
              Saving changes...
            </p>
          )}
        </div>
        {ConfirmDialogComponent}
      </div>
    );
  }

  // Edge properties view
  if (selectedEdge) {
    const renderStylePreview = () => {
      if (!selectedEdgeTypeConfig) return null;

      const strokeDasharray = {
        solid: '0',
        dashed: '8,4',
        dotted: '2,4',
      }[selectedEdgeTypeConfig.style || 'solid'];

      return (
        <svg width="100%" height="20" className="mt-2">
          <line
            x1="0"
            y1="10"
            x2="100%"
            y2="10"
            stroke={selectedEdgeTypeConfig.color}
            strokeWidth="3"
            strokeDasharray={strokeDasharray}
          />
        </svg>
      );
    };

    return (
      <div
        className="h-full bg-white border-l border-gray-200 flex flex-col"
        style={{ width: `${rightPanelWidth}px` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Relation Properties</h2>
          <div className="flex items-center space-x-1">
            <Tooltip title="Close (Esc)">
              <IconButton size="small" onClick={onClose}>
                ✕
              </IconButton>
            </Tooltip>
            <Tooltip title="Collapse Panel (Ctrl+I)">
              <IconButton size="small" onClick={collapseRightPanel}>
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
          {/* Relation Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Relation Type
            </label>
            <select
              value={relationType}
              onChange={(e) => {
                setRelationType(e.target.value);
                setHasEdgeChanges(true);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {edgeTypes.map((edgeType) => (
                <option key={edgeType.id} value={edgeType.id}>
                  {edgeType.label}
                </option>
              ))}
            </select>
            {renderStylePreview()}
          </div>

          {/* Custom Label */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Custom Label (optional)
            </label>
            <input
              type="text"
              value={relationLabel}
              onChange={(e) => {
                setRelationLabel(e.target.value);
                setHasEdgeChanges(true);
              }}
              placeholder={selectedEdgeTypeConfig?.label || 'Enter label'}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use default type label
            </p>
          </div>

          {/* Connection Info */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">From:</span> {selectedEdge.source}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">To:</span> {selectedEdge.target}
            </p>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDeleteEdge}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            <DeleteIcon fontSize="small" />
            <span>Delete Relation</span>
          </button>
          {hasEdgeChanges && (
            <p className="text-xs text-gray-500 mt-2 text-center italic">
              Saving changes...
            </p>
          )}
        </div>
        {ConfirmDialogComponent}
      </div>
    );
  }

  return null;
};

export default RightPanel;
