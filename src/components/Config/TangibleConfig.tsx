import { useState, useEffect, useMemo } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import { useToastStore } from '../../stores/toastStore';
import { useTimelineStore } from '../../stores/timelineStore';
import QuickAddTangibleForm from './QuickAddTangibleForm';
import TangibleManagementList from './TangibleManagementList';
import EditTangibleInline from './EditTangibleInline';
import type { TangibleConfig as TangibleConfigType, TangibleMode } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEditingTangibleId?: string | null;
}

const TangibleConfigModal = ({ isOpen, onClose, initialEditingTangibleId }: Props) => {
  const { tangibles, labels, addTangible, updateTangible, deleteTangible } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const { showToast } = useToastStore();
  const { getAllStates } = useTimelineStore();

  const [editingTangible, setEditingTangible] = useState<TangibleConfigType | null>(null);

  // Get all available states for state mode
  const availableStates = useMemo(() => getAllStates(), [getAllStates]);

  // Set editing tangible when initialEditingTangibleId changes
  useEffect(() => {
    if (initialEditingTangibleId && isOpen) {
      const tangibleToEdit = tangibles.find((t) => t.id === initialEditingTangibleId);
      if (tangibleToEdit) {
        setEditingTangible(tangibleToEdit);
      }
    } else if (!isOpen) {
      setEditingTangible(null);
    }
  }, [initialEditingTangibleId, isOpen, tangibles]);

  const handleAddTangible = (tangible: {
    name: string;
    mode: TangibleMode;
    description: string;
    hardwareId?: string;
    filterLabels?: string[];
    stateId?: string;
  }) => {
    // Validate mode-specific fields
    if (tangible.mode === 'filter' && (!tangible.filterLabels || tangible.filterLabels.length === 0)) {
      showToast('Filter mode requires at least one label', 'error');
      return;
    }
    if ((tangible.mode === 'state' || tangible.mode === 'stateDial') && !tangible.stateId) {
      showToast('State mode requires a state selection', 'error');
      return;
    }

    const newTangible: Omit<TangibleConfigType, 'id'> = {
      name: tangible.name,
      mode: tangible.mode,
      description: tangible.description || undefined,
      hardwareId: tangible.hardwareId,
      filterLabels: tangible.filterLabels,
      stateId: tangible.stateId,
    };

    addTangible(newTangible as TangibleConfigType);
    showToast(`Tangible "${tangible.name}" created`, 'success');
  };

  const handleDeleteTangible = async (id: string) => {
    const tangible = tangibles.find((t) => t.id === id);

    const confirmed = await confirm({
      title: 'Delete Tangible',
      message: 'Are you sure you want to delete this tangible? This action cannot be undone.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });

    if (confirmed) {
      deleteTangible(id);
      showToast(`Tangible "${tangible?.name}" deleted`, 'success');
    }
  };

  const handleEditTangible = (tangible: TangibleConfigType) => {
    setEditingTangible(tangible);
  };

  const handleSaveEdit = (
    id: string,
    updates: { name: string; mode: TangibleMode; description?: string; hardwareId?: string; filterLabels?: string[]; stateId?: string }
  ) => {
    updateTangible(id, updates);
    setEditingTangible(null);
    showToast(`Tangible "${updates.name}" updated`, 'success');
  };

  const handleCancelEdit = () => {
    setEditingTangible(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Configure Tangibles</h2>
            <p className="text-sm text-gray-600 mt-1">
              Set up physical objects for presentation mode interactions
            </p>
          </div>

          {/* Content - Two-Column or Full-Width Edit */}
          <div className="flex-1 overflow-hidden flex">
            {editingTangible ? (
              /* Full-Width Edit Mode */
              <div className="w-full p-6 overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <EditTangibleInline
                    tangible={editingTangible}
                    labels={labels}
                    states={availableStates}
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
                      Quick Add Tangible
                    </h3>
                    <QuickAddTangibleForm
                      labels={labels}
                      states={availableStates}
                      onAdd={handleAddTangible}
                    />
                  </div>

                  {/* Helper Text */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">About Tangibles</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• Tangibles are physical objects used in presentation mode</li>
                      <li>• Filter mode: activates filters on selected labels</li>
                      <li>• State mode: switches to a specific timeline state</li>
                      <li>• Internal IDs are auto-generated from names</li>
                      <li>• Hardware IDs map configurations to physical tokens/devices</li>
                      <li>• You can change hardware IDs to swap physical tokens</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column - Management (40%) */}
                <div className="w-2/5 p-6 overflow-y-auto bg-gray-50">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Tangibles ({tangibles.length})
                      </h3>
                    </div>
                    <TangibleManagementList
                      tangibles={tangibles}
                      labels={labels}
                      states={availableStates}
                      onEdit={handleEditTangible}
                      onDelete={handleDeleteTangible}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Hidden when editing */}
          {!editingTangible && (
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

export default TangibleConfigModal;
