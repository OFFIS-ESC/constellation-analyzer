import { useState, useEffect } from 'react';
import { useBibliographyStore } from '../../stores/bibliographyStore';
import { useBibliographyWithHistory } from '../../hooks/useBibliographyWithHistory';
import QuickAddReferenceForm from './QuickAddReferenceForm';
import ReferenceManagementList from './ReferenceManagementList';
import EditReferenceInline from './EditReferenceInline';

interface BibliographyConfigProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditingReferenceId?: string | null;
}

const BibliographyConfig = ({ isOpen, onClose, initialEditingReferenceId = null }: BibliographyConfigProps) => {
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(initialEditingReferenceId);
  const { getReferences } = useBibliographyStore();
  const { deleteReference: deleteReferenceWithHistory } = useBibliographyWithHistory();

  const references = getReferences();

  // Handle initial editing reference if provided
  useEffect(() => {
    if (isOpen && initialEditingReferenceId) {
      setEditingReferenceId(initialEditingReferenceId);
    }
  }, [isOpen, initialEditingReferenceId]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (editingReferenceId) {
          setEditingReferenceId(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, editingReferenceId]);

  const handleEditReference = (id: string) => {
    setEditingReferenceId(id);
  };

  const handleCancelEdit = () => {
    setEditingReferenceId(null);
  };

  const handleDeleteReference = (id: string) => {
    deleteReferenceWithHistory(id);
  };

  const handleDone = () => {
    setEditingReferenceId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleDone}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Bibliography Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add and manage references for your constellation analysis. Import from DOI, URL, BibTeX, or enter manually.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex min-h-0">
          {editingReferenceId ? (
            // Edit mode - full width
            <EditReferenceInline
              referenceId={editingReferenceId}
              onCancel={handleCancelEdit}
            />
          ) : (
            // Two-column layout
            <>
              {/* Left Column - Quick Add */}
              <div className="w-3/5 border-r border-gray-200 p-6 overflow-y-auto">
                <QuickAddReferenceForm />
              </div>

              {/* Right Column - Reference List */}
              <div className="w-2/5 p-6 overflow-y-auto bg-gray-50">
                <ReferenceManagementList
                  references={references}
                  onEdit={handleEditReference}
                  onDelete={handleDeleteReference}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BibliographyConfig;
