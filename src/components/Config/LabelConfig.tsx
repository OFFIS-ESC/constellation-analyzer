import { useState, useEffect, useMemo } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import { useToastStore } from '../../stores/toastStore';
import QuickAddLabelForm from './QuickAddLabelForm';
import LabelManagementList from './LabelManagementList';
import EditLabelInline from './EditLabelInline';
import type { LabelConfig as LabelConfigType, LabelScope } from '../../types';

/**
 * LabelConfig - Modal for managing labels
 *
 * Features:
 * - Two-column layout: quick add (left) + management/edit (right)
 * - Inline editing replaces right column
 * - Usage count calculation
 * - Toast notifications for actions
 * - Full keyboard accessibility
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEditingLabelId?: string | null;
}

const LabelConfigModal = ({ isOpen, onClose, initialEditingLabelId }: Props) => {
  const { labels, nodes, edges, addLabel, updateLabel, deleteLabel } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const { showToast } = useToastStore();

  const [editingLabel, setEditingLabel] = useState<LabelConfigType | null>(null);

  // Calculate usage counts for each label
  const usageCounts = useMemo(() => {
    const counts: Record<string, { actors: number; relations: number }> = {};

    // Initialize counts
    labels.forEach((label) => {
      counts[label.id] = { actors: 0, relations: 0 };
    });

    // Count actor usage
    nodes.forEach((node) => {
      node.data.labels?.forEach((labelId) => {
        if (counts[labelId]) {
          counts[labelId].actors++;
        }
      });
    });

    // Count relation usage
    edges.forEach((edge) => {
      edge.data?.labels?.forEach((labelId) => {
        if (counts[labelId]) {
          counts[labelId].relations++;
        }
      });
    });

    return counts;
  }, [labels, nodes, edges]);

  // Set editing label when initialEditingLabelId changes
  useEffect(() => {
    if (initialEditingLabelId && isOpen) {
      const labelToEdit = labels.find((l) => l.id === initialEditingLabelId);
      if (labelToEdit) {
        setEditingLabel(labelToEdit);
      }
    } else if (!isOpen) {
      // Clear editing label when modal closes
      setEditingLabel(null);
    }
  }, [initialEditingLabelId, isOpen, labels]);

  const handleAddLabel = (label: {
    name: string;
    color: string;
    appliesTo: LabelScope;
    description: string;
  }) => {
    const id = label.name.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists (case-insensitive)
    if (labels.some((l) => l.id === id)) {
      showToast('A label with this name already exists', 'error');
      return;
    }

    const newLabel: LabelConfigType = {
      id,
      name: label.name,
      color: label.color,
      appliesTo: label.appliesTo,
      description: label.description || undefined,
    };

    addLabel(newLabel);
    showToast(`Label "${label.name}" created`, 'success');
  };

  const handleDeleteLabel = async (id: string) => {
    const label = labels.find((l) => l.id === id);
    const usage = usageCounts[id] || { actors: 0, relations: 0 };
    const totalUsage = usage.actors + usage.relations;

    let message = 'Are you sure you want to delete this label?';
    if (totalUsage > 0) {
      message = `This label is used by ${totalUsage} item${totalUsage !== 1 ? 's' : ''}. Deleting it will remove it from all actors and relations. This action cannot be undone.`;
    }

    const confirmed = await confirm({
      title: 'Delete Label',
      message,
      confirmLabel: 'Delete',
      severity: 'danger',
    });

    if (confirmed) {
      deleteLabel(id);
      showToast(`Label "${label?.name}" deleted`, 'success');
    }
  };

  const handleEditLabel = (label: LabelConfigType) => {
    setEditingLabel(label);
  };

  const handleSaveEdit = (
    id: string,
    updates: { name: string; color: string; appliesTo: LabelScope; description?: string }
  ) => {
    updateLabel(id, updates);
    setEditingLabel(null);
    showToast(`Label "${updates.name}" updated`, 'success');
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Configure Labels</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage labels to categorize actors and relations
            </p>
          </div>

          {/* Content - Two-Column or Full-Width Edit */}
          <div className="flex-1 overflow-hidden flex">
            {editingLabel ? (
              /* Full-Width Edit Mode */
              <div className="w-full p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <EditLabelInline
                    label={editingLabel}
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
                      Quick Add Label
                    </h3>
                    <QuickAddLabelForm onAdd={handleAddLabel} />
                  </div>

                  {/* Helper Text */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">About Labels</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Labels help you categorize and filter actors and relations</li>
                      <li>• Apply multiple labels to any item for flexible organization</li>
                      <li>• Labels can apply to actors only, relations only, or both</li>
                      <li>• Use the filter panel to show/hide items by label</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column - Management (40%) */}
                <div className="w-2/5 p-6 overflow-y-auto bg-gray-50">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Labels ({labels.length})
                      </h3>
                    </div>
                    <LabelManagementList
                      labels={labels}
                      usageCounts={usageCounts}
                      onEdit={handleEditLabel}
                      onDelete={handleDeleteLabel}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Hidden when editing */}
          {!editingLabel && (
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

export default LabelConfigModal;
