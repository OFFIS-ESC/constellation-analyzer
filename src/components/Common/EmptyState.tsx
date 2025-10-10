import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';

/**
 * EmptyState Component
 *
 * Displayed when no document is open in the workspace.
 * Provides helpful actions and guidance to get started.
 */

interface EmptyStateProps {
  onNewDocument: () => void;
  onOpenDocumentManager: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  onNewDocument,
  onOpenDocumentManager,
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-8 py-12 text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 text-blue-600">
            <DescriptionIcon sx={{ fontSize: 48 }} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          No Document Open
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
          Start your constellation analysis by creating a new document or opening an existing one.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={onNewDocument}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium"
          >
            <AddIcon />
            New Document
          </button>
          <button
            onClick={onOpenDocumentManager}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <FolderOpenIcon />
            Open Document
          </button>
        </div>

        {/* Helpful Tips */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Quick Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-blue-600 font-semibold mb-2">Keyboard Shortcuts</div>
              <div className="text-sm text-gray-600">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+N</kbd> to create a new document
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-blue-600 font-semibold mb-2">Document Manager</div>
              <div className="text-sm text-gray-600">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+O</kbd> to open the document manager
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-blue-600 font-semibold mb-2">Get Help</div>
              <div className="text-sm text-gray-600">
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd> to see all keyboard shortcuts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
