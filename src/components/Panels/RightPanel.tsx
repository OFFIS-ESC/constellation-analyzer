import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { useConfirm } from '../../hooks/useConfirm';
import GraphMetrics from '../Common/GraphMetrics';
import ConnectionDisplay from '../Common/ConnectionDisplay';
import NodeTypeConfigModal from '../Config/NodeTypeConfig';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import type { Actor, Relation, EdgeDirectionality } from '../../types';

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

const RightPanel = ({ selectedNode, selectedEdge, onClose }: Props) => {

  const {
    rightPanelCollapsed,
    rightPanelWidth,
    collapseRightPanel,
    expandRightPanel,
  } = usePanelStore();

  const { nodes, edges, nodeTypes, edgeTypes, updateNode, updateEdge, deleteNode, deleteEdge, setEdges } = useGraphWithHistory();
  const { pushToHistory } = useDocumentHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Node property states
  const [actorType, setActorType] = useState('');
  const [actorLabel, setActorLabel] = useState('');
  const [actorDescription, setActorDescription] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Edge property states
  const [relationType, setRelationType] = useState('');
  const [relationLabel, setRelationLabel] = useState('');
  const [relationDirectionality, setRelationDirectionality] = useState<EdgeDirectionality>('directed');

  // Track if user has made changes
  const [hasNodeChanges, setHasNodeChanges] = useState(false);
  const [hasEdgeChanges, setHasEdgeChanges] = useState(false);

  // Actor type modal state
  const [showActorTypeModal, setShowActorTypeModal] = useState(false);
  const [editingActorTypeId, setEditingActorTypeId] = useState<string | null>(null);

  // Relation type modal state
  const [showRelationTypeModal, setShowRelationTypeModal] = useState(false);
  const [editingRelationTypeId, setEditingRelationTypeId] = useState<string | null>(null);

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
      const edgeTypeConfig = edgeTypes.find((et) => et.id === selectedEdge.data?.type);
      setRelationDirectionality(selectedEdge.data.directionality || edgeTypeConfig?.defaultDirectionality || 'directed');
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
      directionality: relationDirectionality,
    });
    setHasEdgeChanges(false);
  }, [selectedEdge, relationType, relationLabel, relationDirectionality, hasEdgeChanges, updateEdge]);

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

  // Handle reverse direction
  const handleReverseDirection = () => {
    if (!selectedEdge) return;

    // Push to history BEFORE mutation
    pushToHistory('Reverse Relation Direction');

    // Update the edges array with the reversed edge
    const updatedEdges = edges.map(edge => {
      if (edge.id === selectedEdge.id) {
        return {
          ...edge,
          source: edge.target,
          target: edge.source,
          sourceHandle: edge.targetHandle,
          targetHandle: edge.sourceHandle,
        };
      }
      return edge;
    });

    // Apply the update (setEdges is a pass-through without history tracking)
    setEdges(updatedEdges);
  };

  // Handle edit actor type
  const handleEditActorType = () => {
    if (!actorType) return;
    setEditingActorTypeId(actorType);
    setShowActorTypeModal(true);
  };

  // Handle close actor type modal
  const handleCloseActorTypeModal = () => {
    setShowActorTypeModal(false);
    setEditingActorTypeId(null);
  };

  // Handle edit relation type
  const handleEditRelationType = () => {
    if (!relationType) return;
    setEditingRelationTypeId(relationType);
    setShowRelationTypeModal(true);
  };

  // Handle close relation type modal
  const handleCloseRelationTypeModal = () => {
    setShowRelationTypeModal(false);
    setEditingRelationTypeId(null);
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
        <Tooltip title="Expand Properties Panel" placement="left">
          <IconButton size="small" onClick={expandRightPanel}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {ConfirmDialogComponent}
        <NodeTypeConfigModal
          isOpen={showActorTypeModal}
          onClose={handleCloseActorTypeModal}
          initialEditingTypeId={editingActorTypeId}
        />
        <EdgeTypeConfigModal
          isOpen={showRelationTypeModal}
          onClose={handleCloseRelationTypeModal}
          initialEditingTypeId={editingRelationTypeId}
        />
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
        <PanelHeader title="Graph Analysis" onCollapse={collapseRightPanel} />
        <GraphMetrics nodes={nodes} edges={edges} />
        {ConfirmDialogComponent}
        <NodeTypeConfigModal
          isOpen={showActorTypeModal}
          onClose={handleCloseActorTypeModal}
          initialEditingTypeId={editingActorTypeId}
        />
        <EdgeTypeConfigModal
          isOpen={showRelationTypeModal}
          onClose={handleCloseRelationTypeModal}
          initialEditingTypeId={editingRelationTypeId}
        />
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
        <PanelHeader title="Actor Properties" onCollapse={collapseRightPanel} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
          {/* Actor Type */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Actor Type
              </label>
              <Tooltip title="Edit Actor Type">
                <IconButton
                  size="small"
                  onClick={handleEditActorType}
                  sx={{ padding: '2px' }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </div>
            <select
              value={actorType}
              onChange={(e) => {
                const newType = e.target.value;
                setActorType(newType);
                // Apply actor type change instantly (no debounce)
                if (selectedNode) {
                  updateNode(selectedNode.id, {
                    data: {
                      type: newType,
                      label: actorLabel,
                      description: actorDescription || undefined,
                    },
                  });
                }
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
              <div className="space-y-3">
                {connections.map((edge) => {
                  const edgeConfig = edgeTypes.find((et) => et.id === edge.data?.type);
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  const edgeDirectionality = edge.data?.directionality || edgeConfig?.defaultDirectionality || 'directed';

                  return (
                    <div key={edge.id} className="space-y-1">
                      {/* Edge Type Badge */}
                      <div className="flex items-center space-x-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: edgeConfig?.color || '#6b7280' }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {edgeConfig?.label || 'Unknown'}
                        </span>
                        {edge.data?.label && edge.data.label !== edgeConfig?.label && (
                          <span className="text-xs text-gray-500">
                            ({edge.data.label})
                          </span>
                        )}
                      </div>
                      {/* Connection Display */}
                      <ConnectionDisplay
                        sourceNode={sourceNode}
                        targetNode={targetNode}
                        nodeTypes={nodeTypes}
                        directionality={edgeDirectionality}
                      />
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
        <NodeTypeConfigModal
          isOpen={showActorTypeModal}
          onClose={handleCloseActorTypeModal}
          initialEditingTypeId={editingActorTypeId}
        />
        <EdgeTypeConfigModal
          isOpen={showRelationTypeModal}
          onClose={handleCloseRelationTypeModal}
          initialEditingTypeId={editingRelationTypeId}
        />
      </div>
    );
  }

  // Edge properties view
  if (selectedEdge) {
    // Get the current edge data from the store (to reflect live updates)
    const currentEdge = edges.find(e => e.id === selectedEdge.id) || selectedEdge;

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
        <PanelHeader title="Relation Properties" onCollapse={collapseRightPanel} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
          {/* Relation Type */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Relation Type
              </label>
              <Tooltip title="Edit Relation Type">
                <IconButton
                  size="small"
                  onClick={handleEditRelationType}
                  sx={{ padding: '2px' }}
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </div>
            <select
              value={relationType}
              onChange={(e) => {
                const newType = e.target.value;
                setRelationType(newType);
                // Apply relation type change instantly (no debounce)
                if (selectedEdge) {
                  updateEdge(selectedEdge.id, {
                    type: newType,
                    label: relationLabel.trim() || undefined,
                    directionality: relationDirectionality,
                  });
                }
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

          {/* Directionality */}
          <div className="pt-3 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Directionality
            </label>
            <ToggleButtonGroup
              value={relationDirectionality}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null && selectedEdge) {
                  setRelationDirectionality(newValue);
                  // Apply directionality change instantly (no debounce)
                  updateEdge(selectedEdge.id, {
                    type: relationType,
                    label: relationLabel.trim() || undefined,
                    directionality: newValue,
                  });
                }
              }}
              size="small"
              fullWidth
              aria-label="relationship directionality"
            >
              <ToggleButton value="directed" aria-label="directed relationship">
                <Tooltip title="Directed (one-way)">
                  <div className="flex items-center space-x-1">
                    <ArrowForwardIcon fontSize="small" />
                    <span className="text-xs">Directed</span>
                  </div>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="bidirectional" aria-label="bidirectional relationship">
                <Tooltip title="Bidirectional (two-way)">
                  <div className="flex items-center space-x-1">
                    <SyncAltIcon fontSize="small" />
                    <span className="text-xs">Both</span>
                  </div>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="undirected" aria-label="undirected relationship">
                <Tooltip title="Undirected (no direction)">
                  <div className="flex items-center space-x-1">
                    <RemoveIcon fontSize="small" />
                    <span className="text-xs">None</span>
                  </div>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </div>

          {/* Connection Info with Reverse Direction */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">
                Connection
              </label>
              {relationDirectionality === 'directed' && (
                <Tooltip title="Reverse Direction">
                  <IconButton size="small" onClick={handleReverseDirection}>
                    <SwapHorizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </div>
            <ConnectionDisplay
              sourceNode={nodes.find(n => n.id === currentEdge.source)}
              targetNode={nodes.find(n => n.id === currentEdge.target)}
              nodeTypes={nodeTypes}
              directionality={relationDirectionality}
            />
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
        <EdgeTypeConfigModal
          isOpen={showRelationTypeModal}
          onClose={handleCloseRelationTypeModal}
          initialEditingTypeId={editingRelationTypeId}
        />
      </div>
    );
  }

  return (
    <>
      {ConfirmDialogComponent}
      <NodeTypeConfigModal
        isOpen={showActorTypeModal}
        onClose={handleCloseActorTypeModal}
        initialEditingTypeId={editingActorTypeId}
      />
      <EdgeTypeConfigModal
        isOpen={showRelationTypeModal}
        onClose={handleCloseRelationTypeModal}
        initialEditingTypeId={editingRelationTypeId}
      />
    </>
  );
};

export default RightPanel;
