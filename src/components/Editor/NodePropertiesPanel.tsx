import { useState, useEffect, useRef } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import PropertyPanel from '../Common/PropertyPanel';
import type { Actor } from '../../types';

/**
 * NodePropertiesPanel - Side panel for editing node/actor properties
 *
 * Features:
 * - Change actor type
 * - Edit actor label
 * - Edit description
 * - Delete actor
 * - Visual color preview
 */

interface Props {
  selectedNode: Actor | null;
  onClose: () => void;
}

const NodePropertiesPanel = ({ selectedNode, onClose }: Props) => {
  const { nodeTypes, updateNode, deleteNode } = useGraphWithHistory();
  const [actorType, setActorType] = useState('');
  const [actorLabel, setActorLabel] = useState('');
  const [actorDescription, setActorDescription] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedNode) {
      setActorType(selectedNode.data?.type || '');
      setActorLabel(selectedNode.data?.label || '');
      setActorDescription(selectedNode.data?.description || '');

      // Focus and select the label input when panel opens
      setTimeout(() => {
        if (labelInputRef.current) {
          labelInputRef.current.focus();
          labelInputRef.current.select();
        }
      }, 100); // Small delay to ensure panel animation completes
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode) return;
    updateNode(selectedNode.id, {
      data: {
        type: actorType,
        label: actorLabel,
        description: actorDescription || undefined,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (!selectedNode) return;
    deleteNode(selectedNode.id);
    onClose();
  };

  const selectedNodeTypeConfig = nodeTypes.find((nt) => nt.id === actorType);

  return (
    <PropertyPanel
      isOpen={!!selectedNode}
      title="Actor Properties"
      onClose={onClose}
      onSave={handleSave}
      onDelete={handleDelete}
      deleteConfirmMessage="Are you sure you want to delete this actor? All connected relations will also be deleted."
      deleteButtonLabel="Delete"
    >
      {/* Actor Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Actor Type
        </label>
        <select
          value={actorType}
          onChange={(e) => setActorType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Color Preview
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
          onChange={(e) => setActorLabel(e.target.value)}
          placeholder="Enter actor name"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={actorDescription}
          onChange={(e) => setActorDescription(e.target.value)}
          placeholder="Add a description"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Node Info */}
      {selectedNode && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Node ID:</span> {selectedNode.id}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Position:</span> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
          </p>
        </div>
      )}
    </PropertyPanel>
  );
};

export default NodePropertiesPanel;
