import { useState, useEffect } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import { useTimelineStore } from '../../stores/timelineStore';
import { useTuioConnection } from '../../hooks/useTuioConnection';
import QuickAddTangibleForm from './QuickAddTangibleForm';
import TangibleManagementList from './TangibleManagementList';
import EditTangibleInline from './EditTangibleInline';
import ScopeBadge from '../Help/ScopeBadge';
import ConceptButton from '../Help/ConceptButton';
import type { TangibleConfig as TangibleConfigType, TangibleMode } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialEditingTangibleId?: string | null;
}

const TangibleConfigModal = ({ isOpen, onClose, initialEditingTangibleId }: Props) => {
  const { tangibles, labels, nodeTypes, edgeTypes, addTangible, updateTangible, deleteTangible } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Connect to TUIO when dialog is open
  useTuioConnection(isOpen);

  const [editingTangible, setEditingTangible] = useState<TangibleConfigType | null>(null);

  // Get all available states for state mode
  // Use Zustand selector to properly subscribe to state changes
  const availableStates = useTimelineStore((state) => {
    const { activeDocumentId } = state;
    if (!activeDocumentId) return [];
    const timeline = state.timelines.get(activeDocumentId);
    if (!timeline) return [];
    return Array.from(timeline.states.values());
  });

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

  // Mode-specific validation lives in the forms, which can show it next to the
  // offending field. What is left here is the document-wide hardware ID check,
  // which only the store can make; its message is passed back for the form to
  // render inline.
  const handleAddTangible = (tangible: {
    name: string;
    mode: TangibleMode;
    description: string;
    hardwareId?: string;
    filters?: import('../../types').FilterConfig;
    stateId?: string;
  }) => {
    const newTangible: Omit<TangibleConfigType, 'id'> = {
      name: tangible.name,
      mode: tangible.mode,
      description: tangible.description || undefined,
      hardwareId: tangible.hardwareId,
      filters: tangible.filters,
      stateId: tangible.stateId,
    };

    return addTangible(newTangible as TangibleConfigType);
  };

  const handleDeleteTangible = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Tangible',
      message: 'Are you sure you want to delete this tangible? This action cannot be undone.',
      confirmLabel: 'Delete',
      severity: 'danger',
    });

    if (confirmed) {
      deleteTangible(id);
    }
  };

  const handleEditTangible = (tangible: TangibleConfigType) => {
    setEditingTangible(tangible);
  };

  const handleSaveEdit = (
    id: string,
    updates: { name: string; mode: TangibleMode; description?: string; hardwareId?: string; filters?: import('../../types').FilterConfig; stateId?: string }
  ) => {
    const error = updateTangible(id, updates);
    if (error) return error;

    setEditingTangible(null);
    return null;
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
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">Configure Tangibles</h2>
              <ConceptButton concept="tangibles-presentation" placement="bottom" />
              <ScopeBadge scope="document" />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Physical tokens placed on a TUIO table can filter the graph or jump between states.
              Tangibles do nothing in the editor — they act only in presentation mode, with hardware connected.
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
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
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
                      nodeTypes={nodeTypes}
                      edgeTypes={edgeTypes}
                      states={availableStates}
                      onAdd={handleAddTangible}
                    />
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
