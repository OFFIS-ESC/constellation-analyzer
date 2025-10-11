import { useEffect, useState, useRef } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * InputDialog - Input prompt dialog
 *
 * A modal dialog component for getting text input from the user.
 *
 * Features:
 * - Customizable title and message
 * - Optional placeholder text
 * - Input validation
 * - Keyboard support (Enter to confirm, Escape to cancel)
 * - Auto-focus on input field
 * - Backdrop click to cancel
 */

export type InputDialogSeverity = 'info' | 'error';

interface Props {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: InputDialogSeverity;
  validateInput?: (value: string) => string | null; // Returns error message or null if valid
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputDialog = ({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  severity = 'info',
  validateInput,
  onConfirm,
  onCancel,
}: Props) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value and error when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
      // Focus input field after a short delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    // Validate input if validator provided
    if (validateInput) {
      const validationError = validateInput(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(value);
  };

  const handleCancel = () => {
    setError(null);
    onCancel();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // Severity-based styling
  const severityConfig = {
    info: {
      icon: <InfoIcon className="text-blue-600" sx={{ fontSize: 48 }} />,
      confirmClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    error: {
      icon: <ErrorIcon className="text-red-600" sx={{ fontSize: 48 }} />,
      confirmClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
  };

  const config = severityConfig[severity];

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
            <div className="flex-shrink-0">{config.icon}</div>

            {/* Text Content */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              {message && (
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
                  {message}
                </p>
              )}

              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(null); // Clear error on change
                }}
                placeholder={placeholder}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  error
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />

              {/* Error Message */}
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputDialog;
