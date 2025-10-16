import { useState } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import NodeTypeForm from './NodeTypeForm';
import { useConfirm } from '../../hooks/useConfirm';
import type { NodeTypeConfig } from '../../types';

/**
 * NodeTypeConfig - Modal for managing actor/node types
 *
 * Features:
 * - Add new node types with custom name and color
 * - Edit existing node types
 * - Delete node types
 * - Color picker for visual customization
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NodeTypeConfigModal = ({ isOpen, onClose }: Props) => {
  const { nodeTypes, addNodeType, updateNodeType, deleteNodeType } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6366f1');
  const [newTypeShape, setNewTypeShape] = useState<import('../../types').NodeShape>('rectangle');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editShape, setEditShape] = useState<import('../../types').NodeShape>('rectangle');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleAddType = () => {
    if (!newTypeName.trim()) {
      alert('Please enter a name for the node type');
      return;
    }

    const id = newTypeName.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists
    if (nodeTypes.some(nt => nt.id === id)) {
      alert('A node type with this name already exists');
      return;
    }

    const newType: NodeTypeConfig = {
      id,
      label: newTypeName.trim(),
      color: newTypeColor,
      shape: newTypeShape,
      icon: newTypeIcon || undefined,
      description: newTypeDescription.trim() || undefined,
    };

    addNodeType(newType);

    // Reset form
    setNewTypeName('');
    setNewTypeColor('#6366f1');
    setNewTypeShape('rectangle');
    setNewTypeDescription('');
    setNewTypeIcon('');
  };

  const handleDeleteType = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Actor Type',
      message: 'Are you sure you want to delete this actor type? This action cannot be undone.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });
    if (confirmed) {
      deleteNodeType(id);
    }
  };

  const handleEditType = (type: NodeTypeConfig) => {
    setEditingId(type.id);
    setEditLabel(type.label);
    setEditColor(type.color);
    setEditShape(type.shape || 'rectangle');
    setEditIcon(type.icon || '');
    setEditDescription(type.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editLabel.trim()) return;

    updateNodeType(editingId, {
      label: editLabel.trim(),
      color: editColor,
      shape: editShape,
      icon: editIcon || undefined,
      description: editDescription.trim() || undefined,
    });

    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configure Actor Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the types of actors that can be added to your constellation
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Type Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Actor Type</h3>
            <NodeTypeForm
              name={newTypeName}
              color={newTypeColor}
              shape={newTypeShape}
              icon={newTypeIcon}
              description={newTypeDescription}
              onNameChange={setNewTypeName}
              onColorChange={setNewTypeColor}
              onShapeChange={setNewTypeShape}
              onIconChange={setNewTypeIcon}
              onDescriptionChange={setNewTypeDescription}
            />
            <button
              onClick={handleAddType}
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Actor Type
            </button>
          </div>

          {/* Existing Types List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Actor Types</h3>
            <div className="space-y-2">
              {nodeTypes.map((type) => (
                <div
                  key={type.id}
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  {editingId === type.id ? (
                    // Edit mode
                    <div className="bg-blue-50 p-4">
                      <NodeTypeForm
                        name={editLabel}
                        color={editColor}
                        shape={editShape}
                        icon={editIcon}
                        description={editDescription}
                        onNameChange={setEditLabel}
                        onColorChange={setEditColor}
                        onShapeChange={setEditShape}
                        onIconChange={setEditIcon}
                        onDescriptionChange={setEditDescription}
                      />
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: type.color }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {type.label}
                          </div>
                          {type.description && (
                            <div className="text-xs text-gray-500">{type.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditType(type)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteType(type.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
};

export default NodeTypeConfigModal;
