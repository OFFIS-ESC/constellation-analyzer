/**
 * UnsavedChangesDialog Component
 *
 * Modal dialog shown when closing a document with unsaved changes
 * Currently using browser confirm() but this provides a foundation
 * for a custom dialog in the future
 */

interface UnsavedChangesDialogProps {
  documentTitle: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

const UnsavedChangesDialog = ({
  documentTitle,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Unsaved Changes
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          The document <span className="font-semibold">&quot;{documentTitle}&quot;</span> has unsaved changes.
          Do you want to save before closing?
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;
