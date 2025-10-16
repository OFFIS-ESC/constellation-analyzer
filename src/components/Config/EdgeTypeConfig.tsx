import { useState, useEffect } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import { useToastStore } from '../../stores/toastStore';
import QuickAddEdgeTypeForm from './QuickAddEdgeTypeForm';
import EdgeTypeManagementList from './EdgeTypeManagementList';
import EditEdgeTypeInline from './EditEdgeTypeInline';
import type { EdgeTypeConfig, EdgeDirectionality } from '../../types';

/**
 * EdgeTypeConfig - Modal for managing relation/edge types
 *
 * Features:
 * - Two-column layout: quick add (left) + management/edit (right)
 * - Inline editing replaces right column
 * - Compact card-based management list
 * - Toast notifications for actions
 * - Full keyboard accessibility
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEditingTypeId?: string | null;
}

const EdgeTypeConfigModal = ({ isOpen, onClose, initialEditingTypeId }: Props) => {
  const { edgeTypes, addEdgeType, updateEdgeType, deleteEdgeType } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const { showToast } = useToastStore();

  const [editingType, setEditingType] = useState<EdgeTypeConfig | null>(null);

  // Set editing type when initialEditingTypeId changes
  useEffect(() => {
    if (initialEditingTypeId && isOpen) {
      const typeToEdit = edgeTypes.find(t => t.id === initialEditingTypeId);
      if (typeToEdit) {
        setEditingType(typeToEdit);
      }
    } else if (!isOpen) {
      // Clear editing type when modal closes
      setEditingType(null);
    }
  }, [initialEditingTypeId, isOpen, edgeTypes]);

  const handleAddType = (type: {
    label: string;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
    defaultDirectionality: EdgeDirectionality;
  }) => {
    const id = type.label.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists
    if (edgeTypes.some(et => et.id === id)) {
      showToast('A relation type with this name already exists', 'error');
      return;
    }

    const newType: EdgeTypeConfig = {
      id,
      label: type.label,
      color: type.color,
      style: type.style,
      defaultDirectionality: type.defaultDirectionality,
    };

    addEdgeType(newType);
    showToast(`Relation type "${type.label}" created`, 'success');
  };

  const handleDeleteType = async (id: string) => {
    const type = edgeTypes.find(t => t.id === id);
    const confirmed = await confirm({
      title: 'Delete Relation Type',
      message: 'Are you sure you want to delete this relation type? This action cannot be undone.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });
    if (confirmed) {
      deleteEdgeType(id);
      showToast(`Relation type "${type?.label}" deleted`, 'success');
    }
  };

  const handleEditType = (type: EdgeTypeConfig) => {
    setEditingType(type);
  };

  const handleSaveEdit = (
    id: string,
    updates: {
      label: string;
      color: string;
      style: 'solid' | 'dashed' | 'dotted';
      defaultDirectionality: EdgeDirectionality;
    }
  ) => {
    updateEdgeType(id, updates);
    setEditingType(null);
    showToast(`Relation type "${updates.label}" updated`, 'success');
  };

  const handleCancelEdit = () => {
    setEditingType(null);
  };

  const handleDuplicateType = (type: EdgeTypeConfig) => {
    // Generate a unique ID for the duplicate
    let suffix = 2;
    let newId = `${type.id}-copy`;
    let newLabel = `${type.label} (Copy)`;

    while (edgeTypes.some(et => et.id === newId)) {
      newId = `${type.id}-copy-${suffix}`;
      newLabel = `${type.label} (Copy ${suffix})`;
      suffix++;
    }

    const duplicatedType: EdgeTypeConfig = {
      id: newId,
      label: newLabel,
      color: type.color,
      style: type.style,
      defaultDirectionality: type.defaultDirectionality,
    };

    addEdgeType(duplicatedType);
    showToast(`Relation type duplicated as "${newLabel}"`, 'success');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Configure Relation Types</h2>
            <p className="text-sm text-gray-600 mt-1">
              Quickly add and manage the types of relations that can connect actors
            </p>
          </div>

          {/* Content - Two-Column or Full-Width Edit */}
          <div className="flex-1 overflow-hidden flex">
            {editingType ? (
              /* Full-Width Edit Mode */
              <div className="w-full p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <EditEdgeTypeInline
                    type={editingType}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Left Column - Quick Add (60%) */}
                <div className="w-3/5 border-r border-gray-200 p-6 overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Quick Add Relation Type
                    </h3>
                    <QuickAddEdgeTypeForm onAdd={handleAddType} />
                  </div>

                  {/* Helper Text */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Pro Tips</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Press <kbd className="px-1 py-0.5 bg-white border border-blue-300 rounded text-xs">Enter</kbd> to quickly add a type</li>
                      <li>• Choose meaningful names like "Supervises" or "Reports To"</li>
                      <li>• Use different line styles to distinguish relation types visually</li>
                      <li>• Click any type on the right to edit it</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column - Management (40%) */}
                <div className="w-2/5 p-6 overflow-y-auto bg-gray-50">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Relation Types ({edgeTypes.length})
                      </h3>
                    </div>
                    <EdgeTypeManagementList
                      types={edgeTypes}
                      onEdit={handleEditType}
                      onDelete={handleDeleteType}
                      onDuplicate={handleDuplicateType}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Hidden when editing */}
          {!editingType && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
};

export default EdgeTypeConfigModal;
