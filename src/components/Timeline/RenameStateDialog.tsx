import React, { useState, useEffect, useRef } from 'react';
import EditIcon from '@mui/icons-material/Edit';

interface RenameStateDialogProps {
  open: boolean;
  currentLabel: string;
  onClose: () => void;
  onRename: (newLabel: string) => void;
}

/**
 * RenameStateDialog - Dialog for renaming timeline states
 */
const RenameStateDialog: React.FC<RenameStateDialogProps> = ({
  open,
  currentLabel,
  onClose,
  onRename,
}) => {
  const [label, setLabel] = useState(currentLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update label when currentLabel changes
  useEffect(() => {
    setLabel(currentLabel);
  }, [currentLabel]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open]);

  const handleRename = () => {
    if (label.trim()) {
      onRename(label.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    setLabel(currentLabel); // Reset to original
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, label]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <EditIcon className="text-blue-600" sx={{ fontSize: 48 }} />
            </div>

            {/* Text Content */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Rename State
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter a new name for this timeline state
              </p>

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Enter state label"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleRename}
            disabled={!label.trim()}
            className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !label.trim()
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameStateDialog;
