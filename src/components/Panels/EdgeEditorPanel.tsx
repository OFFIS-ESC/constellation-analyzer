import { useState, useEffect, useRef, useCallback } from 'react';
import { IconButton, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { useFlushOnLeave } from '../../hooks/useFlushOnLeave';
import { useGraphStore } from '../../stores/graphStore';
import { useConfirm } from '../../hooks/useConfirm';
import ConnectionDisplay from '../Common/ConnectionDisplay';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import LabelConfigModal from '../Config/LabelConfig';
import BibliographyConfigModal from '../Config/BibliographyConfig';
import AutocompleteLabelSelector from '../Common/AutocompleteLabelSelector';
import CitationSelector from '../Common/CitationSelector';
import MarkdownField from '../Common/MarkdownField';
import FieldHint from '../Help/FieldHint';
import { useTypeUsage, describeTypeUsage } from '../../hooks/useTypeUsage';
import type { Relation, RelationData, EdgeDirectionality } from '../../types';

interface EdgeEditorPanelProps {
  selectedEdge: Relation;
  onClose: () => void;
}

// Every save is an undo step, so longer text waits for a real pause in typing.
const FIELD_SAVE_DELAY = 500;
const TEXT_SAVE_DELAY = 2000;

const EdgeEditorPanel = ({ selectedEdge, onClose }: EdgeEditorPanelProps) => {
  const { nodes, edges, nodeTypes, edgeTypes, updateEdge, deleteEdge, setEdges } = useGraphWithHistory();
  const { pushToHistory } = useDocumentHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Edge property states
  const [relationType, setRelationType] = useState('');
  const [relationLabel, setRelationLabel] = useState('');
  const [relationLabels, setRelationLabels] = useState<string[]>([]);
  const [relationCitations, setRelationCitations] = useState<string[]>([]);
  const [relationDescription, setRelationDescription] = useState('');
  const [relationShowDescription, setRelationShowDescription] = useState(false);
  const [relationDirectionality, setRelationDirectionality] = useState<EdgeDirectionality>('directed');

  // Track if user has made changes
  const [hasEdgeChanges, setHasEdgeChanges] = useState(false);
  const saveDelayRef = useRef(FIELD_SAVE_DELAY);

  // Relation type modal state
  const [showRelationTypeModal, setShowRelationTypeModal] = useState(false);
  const [editingRelationTypeId, setEditingRelationTypeId] = useState<string | null>(null);

  // Label modal state
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Bibliography modal state
  const [showBibliographyModal, setShowBibliographyModal] = useState(false);

  // The `selectedEdge` prop is captured at selection time and does not update
  // when the store changes (e.g. via undo/redo), so we read the canonical data
  // from the live `edges` array exposed by useGraphWithHistory.
  const sourceData =
    edges.find((e) => e.id === selectedEdge.id)?.data ?? selectedEdge.data;

  // Sync local form state from the live store data, unless the user has
  // unsaved edits in flight (in which case we'd clobber what they typed).
  useEffect(() => {
    if (hasEdgeChanges || !sourceData) return;
    const edgeTypeConfig = edgeTypes.find((et) => et.id === sourceData.type);
    setRelationType(sourceData.type || '');
    const hasCustomLabel = sourceData.label && sourceData.label !== edgeTypeConfig?.label;
    setRelationLabel((hasCustomLabel && sourceData.label) || '');
    setRelationLabels(sourceData.labels || []);
    setRelationCitations(sourceData.citations || []);
    setRelationDescription(sourceData.description || '');
    setRelationShowDescription(sourceData.showDescription ?? false);
    setRelationDirectionality(sourceData.directionality || edgeTypeConfig?.defaultDirectionality || 'directed');
  }, [sourceData, edgeTypes, hasEdgeChanges]);

  // Reset the dirty flag when the user picks a different relation.
  useEffect(() => {
    setHasEdgeChanges(false);
  }, [selectedEdge.id]);

  // The full form state as an update, shared by the debounced save and the
  // controls that apply instantly, so those also carry pending text edits.
  const buildEdgeUpdate = useCallback((overrides: Partial<RelationData> = {}): Partial<RelationData> => ({
    type: relationType,
    label: relationLabel.trim() || undefined,
    directionality: relationDirectionality,
    labels: relationLabels.length > 0 ? relationLabels : undefined,
    citations: relationCitations.length > 0 ? relationCitations : undefined,
    description: relationDescription.trim() ? relationDescription : undefined,
    showDescription: relationShowDescription || undefined,
    ...overrides,
  }), [relationType, relationLabel, relationDirectionality, relationLabels, relationCitations, relationDescription, relationShowDescription]);

  // Live update edge properties (debounced)
  const updateEdgeProperties = useCallback(() => {
    if (!hasEdgeChanges) return;
    updateEdge(selectedEdge.id, buildEdgeUpdate());
    setHasEdgeChanges(false);
  }, [selectedEdge.id, buildEdgeUpdate, hasEdgeChanges, updateEdge]);

  // Debounce live updates
  useEffect(() => {
    if (!hasEdgeChanges) saveDelayRef.current = FIELD_SAVE_DELAY;
    const timeoutId = setTimeout(() => {
      if (hasEdgeChanges) {
        updateEdgeProperties();
      }
    }, saveDelayRef.current);

    return () => clearTimeout(timeoutId);
  }, [hasEdgeChanges, updateEdgeProperties]);

  // Save pending edits when the user selects something else, unless the
  // relation itself is gone (deleted, or a different document was opened).
  useFlushOnLeave(selectedEdge.id, () => {
    if (useGraphStore.getState().edges.some((e) => e.id === selectedEdge.id)) {
      updateEdgeProperties();
    }
  });

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

  // Relation types are global to the document - see useTypeUsage.
  const typeUsage = useTypeUsage('relation', relationType);

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
            <Tooltip title={`Edit this relation type — ${describeTypeUsage('relation', typeUsage).toLowerCase()}`}>
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
              updateEdge(selectedEdge.id, buildEdgeUpdate({ type: newType }));
              setHasEdgeChanges(false);
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
          <FieldHint className="mt-1">
            Switching type only affects this relation
          </FieldHint>
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

        {/* Citations */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Citations (optional)
          </label>
          <CitationSelector
            value={relationCitations}
            onChange={(newCitations) => {
              setRelationCitations(newCitations);
              setHasEdgeChanges(true);
            }}
            onOpenBibliography={() => setShowBibliographyModal(true)}
          />
        </div>

        {/* Description */}
        <div>
          <MarkdownField
            label="Description / Interview quotes (optional)"
            value={relationDescription}
            onChange={(value) => {
              setRelationDescription(value);
              saveDelayRef.current = TEXT_SAVE_DELAY;
              setHasEdgeChanges(true);
            }}
            onCommit={updateEdgeProperties}
            placeholder={'## Heading\nYour interpretation, with **bold** and *italic*.\n\n> A quote from an interview\n> — Interview 3, line 42'}
          />
          <label className={`mt-2 flex items-center gap-2 text-xs select-none ${relationDescription.trim() ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}>
            <input
              type="checkbox"
              checked={relationShowDescription}
              disabled={!relationDescription.trim()}
              onChange={(e) => {
                const checked = e.target.checked;
                setRelationShowDescription(checked);
                // Commit the toggle instantly (no debounce) and flush any
                // pending text edits along with it so they aren't lost.
                updateEdge(selectedEdge.id, buildEdgeUpdate({ showDescription: checked || undefined }));
                setHasEdgeChanges(false);
              }}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show description</span>
          </label>
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
                updateEdge(selectedEdge.id, buildEdgeUpdate({ directionality: newValue }));
                setHasEdgeChanges(false);
              }
            }}
            size="small"
            fullWidth
            aria-label="relationship directionality"
          >
            <ToggleButton value="directed" aria-label="directed relationship">
              <Tooltip title="One-way: the first actor acts on the second">
                <div className="flex items-center space-x-1">
                  <ArrowForwardIcon fontSize="small" />
                  <span className="text-xs">One-way</span>
                </div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="bidirectional" aria-label="bidirectional relationship">
              <Tooltip title="Two-way: both actors act on each other">
                <div className="flex items-center space-x-1">
                  <SyncAltIcon fontSize="small" />
                  <span className="text-xs">Two-way</span>
                </div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="undirected" aria-label="undirected relationship">
              <Tooltip title="Mutual: direction is not meaningful for this relation">
                <div className="flex items-center space-x-1">
                  <RemoveIcon fontSize="small" />
                  <span className="text-xs">Mutual</span>
                </div>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <FieldHint className="mt-1.5">
            Pick “Mutual” when direction genuinely doesn’t apply, not when it’s unknown
          </FieldHint>
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
      <BibliographyConfigModal
        isOpen={showBibliographyModal}
        onClose={() => setShowBibliographyModal(false)}
      />
    </>
  );
};

export default EdgeEditorPanel;
