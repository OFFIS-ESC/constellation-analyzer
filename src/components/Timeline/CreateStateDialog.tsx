import React, { useState, useEffect, useRef } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useTimelineStore } from '../../stores/timelineStore';

interface CreateStateDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog for creating a new constellation state
 */
const CreateStateDialog: React.FC<CreateStateDialogProps> = ({ open, onClose }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [cloneFromCurrent, setCloneFromCurrent] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const { createState } = useTimelineStore();

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const handleCreate = () => {
    if (!label.trim()) return;

    createState(label.trim(), description.trim() || undefined, cloneFromCurrent);

    // Reset form
    setLabel('');
    setDescription('');
    setCloneFromCurrent(true);
    onClose();
  };

  const handleClose = () => {
    // Reset form on cancel
    setLabel('');
    setDescription('');
    setCloneFromCurrent(true);
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCreate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, label, description, cloneFromCurrent]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
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
              <AddCircleIcon className="text-blue-600" sx={{ fontSize: 48 }} />
            </div>

            {/* Text Content */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create New State
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a new timeline state to capture a different version of your graph
              </p>

              {/* Form Fields */}
              <div className="space-y-3">
                {/* State Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State Label
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., 'January 2024' or 'Strategy A'"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Give this state a descriptive name
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional notes about this state..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Clone Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cloneFromCurrent"
                    checked={cloneFromCurrent}
                    onChange={(e) => setCloneFromCurrent(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="cloneFromCurrent"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Clone current graph (uncheck for empty state)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!label.trim()}
            className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !label.trim()
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            Create State
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStateDialog;
