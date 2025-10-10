import { ReactNode } from 'react';
import { useConfirm } from '../../hooks/useConfirm';

/**
 * PropertyPanel - Base component for property editing panels
 *
 * Features:
 * - Consistent layout and styling
 * - Header with title and close button
 * - Content area for custom fields (via children)
 * - Action buttons (Save & Delete)
 * - Positioned absolutely for overlay display
 *
 * Usage: Wrap custom form fields as children
 */

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  deleteConfirmMessage?: string;
  deleteButtonLabel?: string;
  children: ReactNode;
}

const PropertyPanel = ({
  isOpen,
  title,
  onClose,
  onSave,
  onDelete,
  deleteConfirmMessage = 'Are you sure you want to delete this item?',
  deleteButtonLabel = 'Delete',
  children,
}: Props) => {
  const { confirm, ConfirmDialogComponent } = useConfirm();

  if (!isOpen) return null;

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: deleteConfirmMessage,
      confirmLabel: deleteButtonLabel,
      severity: 'danger',
    });
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div className="absolute top-20 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - custom fields provided by children */}
      <div className="p-4 space-y-4">
        {children}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex space-x-2">
        <button
          onClick={onSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-md hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {deleteButtonLabel}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
};

export default PropertyPanel;
