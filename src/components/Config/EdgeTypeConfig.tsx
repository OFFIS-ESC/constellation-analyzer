import { useState } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import EdgeTypeForm from './EdgeTypeForm';
import { useConfirm } from '../../hooks/useConfirm';
import type { EdgeTypeConfig, EdgeDirectionality } from '../../types';

/**
 * EdgeTypeConfig - Modal for managing relation/edge types
 *
 * Features:
 * - Add new edge types with custom name, color, and style
 * - Edit existing edge types
 * - Delete edge types
 * - Style selector (solid, dashed, dotted)
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EdgeTypeConfigModal = ({ isOpen, onClose }: Props) => {
  const { edgeTypes, addEdgeType, updateEdgeType, deleteEdgeType } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6366f1');
  const [newTypeStyle, setNewTypeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [newTypeDirectionality, setNewTypeDirectionality] = useState<EdgeDirectionality>('directed');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editStyle, setEditStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [editDirectionality, setEditDirectionality] = useState<EdgeDirectionality>('directed');

  const handleAddType = () => {
    if (!newTypeName.trim()) {
      alert('Please enter a name for the relation type');
      return;
    }

    const id = newTypeName.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists
    if (edgeTypes.some(et => et.id === id)) {
      alert('A relation type with this name already exists');
      return;
    }

    const newType: EdgeTypeConfig = {
      id,
      label: newTypeName.trim(),
      color: newTypeColor,
      style: newTypeStyle,
      defaultDirectionality: newTypeDirectionality,
    };

    addEdgeType(newType);

    // Reset form
    setNewTypeName('');
    setNewTypeColor('#6366f1');
    setNewTypeStyle('solid');
    setNewTypeDirectionality('directed');
  };

  const handleDeleteType = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Relation Type',
      message: 'Are you sure you want to delete this relation type? This action cannot be undone.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });
    if (confirmed) {
      deleteEdgeType(id);
    }
  };

  const handleEditType = (type: EdgeTypeConfig) => {
    setEditingId(type.id);
    setEditLabel(type.label);
    setEditColor(type.color);
    setEditStyle(type.style || 'solid');
    setEditDirectionality(type.defaultDirectionality || 'directed');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editLabel.trim()) return;

    updateEdgeType(editingId, {
      label: editLabel.trim(),
      color: editColor,
      style: editStyle,
      defaultDirectionality: editDirectionality,
    });

    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const renderStylePreview = (style: 'solid' | 'dashed' | 'dotted', color: string) => {
    const strokeDasharray = {
      solid: '0',
      dashed: '8,4',
      dotted: '2,4',
    }[style];

    return (
      <svg width="100%" height="20" className="mt-1">
        <line
          x1="0"
          y1="10"
          x2="100%"
          y2="10"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
        />
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Configure Relation Types</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the types of relations that can connect actors
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Type Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Relation Type</h3>
            <EdgeTypeForm
              name={newTypeName}
              color={newTypeColor}
              style={newTypeStyle}
              defaultDirectionality={newTypeDirectionality}
              onNameChange={setNewTypeName}
              onColorChange={setNewTypeColor}
              onStyleChange={setNewTypeStyle}
              onDefaultDirectionalityChange={setNewTypeDirectionality}
            />
            <button
              onClick={handleAddType}
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Relation Type
            </button>
          </div>

          {/* Existing Types List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Relation Types</h3>
            <div className="space-y-2">
              {edgeTypes.map((type) => (
                <div
                  key={type.id}
                  className="border border-gray-200 rounded-md overflow-hidden"
                >
                  {editingId === type.id ? (
                    // Edit mode
                    <div className="bg-blue-50 p-4">
                      <EdgeTypeForm
                        name={editLabel}
                        color={editColor}
                        style={editStyle}
                        defaultDirectionality={editDirectionality}
                        onNameChange={setEditLabel}
                        onColorChange={setEditColor}
                        onStyleChange={setEditStyle}
                        onDefaultDirectionalityChange={setEditDirectionality}
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
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {type.label}
                        </div>
                        <div className="w-full max-w-xs">
                          {renderStylePreview(type.style || 'solid', type.color)}
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

export default EdgeTypeConfigModal;
