import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import ConnectionDisplay from '../Common/ConnectionDisplay';
import NodeTypeConfigModal from '../Config/NodeTypeConfig';
import LabelConfigModal from '../Config/LabelConfig';
import BibliographyConfigModal from '../Config/BibliographyConfig';
import AutocompleteLabelSelector from '../Common/AutocompleteLabelSelector';
import CitationSelector from '../Common/CitationSelector';
import type { Actor } from '../../types';

interface NodeEditorPanelProps {
  selectedNode: Actor;
  onClose: () => void;
}

const NodeEditorPanel = ({ selectedNode, onClose }: NodeEditorPanelProps) => {
  const { nodes, edges, nodeTypes, edgeTypes, updateNode, deleteNode } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Node property states
  const [actorType, setActorType] = useState('');
  const [actorLabel, setActorLabel] = useState('');
  const [actorDescription, setActorDescription] = useState('');
  const [actorLabels, setActorLabels] = useState<string[]>([]);
  const [actorCitations, setActorCitations] = useState<string[]>([]);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Track if user has made changes
  const [hasNodeChanges, setHasNodeChanges] = useState(false);

  // Actor type modal state
  const [showActorTypeModal, setShowActorTypeModal] = useState(false);
  const [editingActorTypeId, setEditingActorTypeId] = useState<string | null>(null);

  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Bibliography modal state
  const [showBibliographyModal, setShowBibliographyModal] = useState(false);

  // Update state when selected node changes
  useEffect(() => {
    setActorType(selectedNode.data?.type || '');
    setActorLabel(selectedNode.data?.label || '');
    setActorDescription(selectedNode.data?.description || '');
    setActorLabels(selectedNode.data?.labels || []);
    setActorCitations(selectedNode.data?.citations || []);
    setHasNodeChanges(false);

    // Focus and select the label input when node is selected
    setTimeout(() => {
      if (labelInputRef.current) {
        labelInputRef.current.focus();
        labelInputRef.current.select();
      }
    }, 100);
  }, [selectedNode]);

  // Live update node properties (debounced)
  const updateNodeProperties = useCallback(() => {
    if (!hasNodeChanges) return;
    updateNode(selectedNode.id, {
      data: {
        type: actorType,
        label: actorLabel,
        description: actorDescription || undefined,
        labels: actorLabels.length > 0 ? actorLabels : undefined,
        citations: actorCitations.length > 0 ? actorCitations : undefined,
      },
    });
    setHasNodeChanges(false);
  }, [selectedNode.id, actorType, actorLabel, actorDescription, actorLabels, actorCitations, hasNodeChanges, updateNode]);

  // Debounce live updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (hasNodeChanges) {
        updateNodeProperties();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [hasNodeChanges, updateNodeProperties]);

  // Handle node deletion
  const handleDeleteNode = async () => {
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

  // Get connections for selected node
  const getNodeConnections = () => {
    return edges.filter(
      (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
    );
  };

  const connections = getNodeConnections();
  const selectedNodeTypeConfig = nodeTypes.find((nt) => nt.id === actorType);

  return (
    <>
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
              updateNode(selectedNode.id, {
                data: {
                  type: newType,
                  label: actorLabel,
                  description: actorDescription || undefined,
                  labels: actorLabels.length > 0 ? actorLabels : undefined,
                  citations: actorCitations.length > 0 ? actorCitations : undefined,
                },
              });
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
            value={actorLabels}
            onChange={(newLabels) => {
              setActorLabels(newLabels);
              setHasNodeChanges(true);
            }}
            scope="actors"
          />
        </div>

        {/* Citations */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Citations (optional)
          </label>
          <CitationSelector
            value={actorCitations}
            onChange={(newCitations) => {
              setActorCitations(newCitations);
              setHasNodeChanges(true);
            }}
            onOpenBibliography={() => setShowBibliographyModal(true)}
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
      <LabelConfigModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
      />
      <BibliographyConfigModal
        isOpen={showBibliographyModal}
        onClose={() => setShowBibliographyModal(false)}
      />
    </>
  );
};

export default NodeEditorPanel;
