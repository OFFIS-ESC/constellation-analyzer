import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import type { ShortcutCategory, KeyboardShortcut } from '../../hooks/useKeyboardShortcutManager';

/**
 * KeyboardShortcutsHelp Component
 *
 * Modal displaying all available keyboard shortcuts grouped by category.
 * Triggered by pressing '?' key.
 */

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const { shortcuts } = useKeyboardShortcuts();

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    'Document Management',
    'Graph Editing',
    'Selection',
    'View',
    'Navigation',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyboardIcon sx={{ fontSize: 28 }} />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {categories.map(category => {
            const categoryShortcuts = shortcuts
              .getShortcutsByCategory(category)
              .filter((s: KeyboardShortcut) => s.enabled !== false);

            if (categoryShortcuts.length === 0) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut: KeyboardShortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded"
                    >
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm min-w-[80px] text-center">
                        {shortcuts.formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">?</kbd> or <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">Escape</kbd> to close this dialog
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
