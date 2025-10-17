import { useState, useEffect } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import PropertyPanel from '../Common/PropertyPanel';
import LabelSelector from '../Common/LabelSelector';
import type { Relation } from '../../types';

/**
 * EdgePropertiesPanel - Side panel for editing edge/relation properties
 *
 * Features:
 * - Change relation type
 * - Edit relation label
 * - Delete relation
 * - Visual preview of line style
 */

interface Props {
  selectedEdge: Relation | null;
  onClose: () => void;
}

const EdgePropertiesPanel = ({ selectedEdge, onClose }: Props) => {
  const { edgeTypes, updateEdge, deleteEdge } = useGraphWithHistory();
  const [relationType, setRelationType] = useState('');
  const [relationLabel, setRelationLabel] = useState('');
  const [relationLabels, setRelationLabels] = useState<string[]>([]);

  useEffect(() => {
    if (selectedEdge && selectedEdge.data) {
      setRelationType(selectedEdge.data.type || '');
      // Only show custom label if it exists and differs from type label
      const typeLabel = edgeTypes.find((et) => et.id === selectedEdge.data?.type)?.label;
      const hasCustomLabel = selectedEdge.data.label && selectedEdge.data.label !== typeLabel;
      setRelationLabel((hasCustomLabel && selectedEdge.data.label) || '');
      setRelationLabels(selectedEdge.data.labels || []);
    }
  }, [selectedEdge, edgeTypes]);

  const handleSave = () => {
    if (!selectedEdge) return;
    updateEdge(selectedEdge.id, {
      type: relationType,
      // Only set label if user provided a custom one (not empty)
      label: relationLabel.trim() || undefined,
      labels: relationLabels.length > 0 ? relationLabels : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!selectedEdge) return;
    deleteEdge(selectedEdge.id);
    onClose();
  };

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
    <PropertyPanel
      isOpen={!!selectedEdge}
      title="Relation Properties"
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirmMessage="Are you sure you want to delete this relation?"
      deleteButtonLabel="Delete"
    >
      {/* Relation Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Relation Type
        </label>
        <select
          value={relationType}
          onChange={(e) => setRelationType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onChange={(e) => setRelationLabel(e.target.value)}
          placeholder={selectedEdgeTypeConfig?.label || 'Enter label'}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use default type label
        </p>
      </div>

      {/* Labels */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Labels (optional)
        </label>
        <LabelSelector
          value={relationLabels}
          onChange={setRelationLabels}
          scope="relations"
        />
      </div>

      {/* Connection Info */}
      {selectedEdge && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-medium">From:</span> {selectedEdge.source}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">To:</span> {selectedEdge.target}
          </p>
        </div>
      )}
    </PropertyPanel>
  );
};

export default EdgePropertiesPanel;
