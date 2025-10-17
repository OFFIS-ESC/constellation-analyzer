import { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { useConfirm } from '../../hooks/useConfirm';
import ConnectionDisplay from '../Common/ConnectionDisplay';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import LabelConfigModal from '../Config/LabelConfig';
import AutocompleteLabelSelector from '../Common/AutocompleteLabelSelector';
import type { Relation, EdgeDirectionality } from '../../types';

interface EdgeEditorPanelProps {
  selectedEdge: Relation;
  onClose: () => void;
}

const EdgeEditorPanel = ({ selectedEdge, onClose }: EdgeEditorPanelProps) => {
  const { nodes, edges, nodeTypes, edgeTypes, updateEdge, deleteEdge, setEdges } = useGraphWithHistory();
  const { pushToHistory } = useDocumentHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Edge property states
  const [relationType, setRelationType] = useState('');
  const [relationLabel, setRelationLabel] = useState('');
  const [relationLabels, setRelationLabels] = useState<string[]>([]);
  const [relationDirectionality, setRelationDirectionality] = useState<EdgeDirectionality>('directed');

  // Track if user has made changes
  const [hasEdgeChanges, setHasEdgeChanges] = useState(false);

  // Relation type modal state
  const [showRelationTypeModal, setShowRelationTypeModal] = useState(false);
  const [editingRelationTypeId, setEditingRelationTypeId] = useState<string | null>(null);

  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Update state when selected edge changes
  useEffect(() => {
    if (selectedEdge.data) {
      setRelationType(selectedEdge.data.type || '');
      const typeLabel = edgeTypes.find((et) => et.id === selectedEdge.data?.type)?.label;
      const hasCustomLabel = selectedEdge.data.label && selectedEdge.data.label !== typeLabel;
      setRelationLabel((hasCustomLabel && selectedEdge.data.label) || '');
      setRelationLabels(selectedEdge.data.labels || []);
      const edgeTypeConfig = edgeTypes.find((et) => et.id === selectedEdge.data?.type);
      setRelationDirectionality(selectedEdge.data.directionality || edgeTypeConfig?.defaultDirectionality || 'directed');
      setHasEdgeChanges(false);
    }
  }, [selectedEdge, edgeTypes]);

  // Live update edge properties (debounced)
  const updateEdgeProperties = useCallback(() => {
    if (!hasEdgeChanges) return;
    updateEdge(selectedEdge.id, {
      type: relationType,
      label: relationLabel.trim() || undefined,
      directionality: relationDirectionality,
      labels: relationLabels.length > 0 ? relationLabels : undefined,
    });
    setHasEdgeChanges(false);
  }, [selectedEdge.id, relationType, relationLabel, relationDirectionality, relationLabels, hasEdgeChanges, updateEdge]);

  // Debounce live updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasEdgeChanges) {
        updateEdgeProperties();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [hasEdgeChanges, updateEdgeProperties]);

  // Handle edge deletion
  const handleDeleteEdge = async () => {
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

  // Get the current edge data from the store (to reflect live updates)
  const currentEdge = edges.find(e => e.id === selectedEdge.id) || selectedEdge;
  const selectedEdgeTypeConfig = edgeTypes.find((et) => et.id === relationType);

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
    <>
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
              updateEdge(selectedEdge.id, {
                type: newType,
                label: relationLabel.trim() || undefined,
                directionality: relationDirectionality,
                labels: relationLabels.length > 0 ? relationLabels : undefined,
              });
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

        {/* Labels */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">
              Labels (optional)
            </label>
            <Tooltip title="Manage Labels">
              <IconButton
                size="small"
                onClick={() => setShowLabelModal(true)}
                sx={{ padding: '2px' }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </div>
          <AutocompleteLabelSelector
            value={relationLabels}
            onChange={(newLabels) => {
              setRelationLabels(newLabels);
              setHasEdgeChanges(true);
            }}
            scope="relations"
          />
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
              if (newValue !== null) {
                setRelationDirectionality(newValue);
                // Apply directionality change instantly (no debounce)
                updateEdge(selectedEdge.id, {
                  type: relationType,
                  label: relationLabel.trim() || undefined,
                  directionality: newValue,
                  labels: relationLabels.length > 0 ? relationLabels : undefined,
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
      <LabelConfigModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
      />
    </>
  );
};

export default EdgeEditorPanel;
