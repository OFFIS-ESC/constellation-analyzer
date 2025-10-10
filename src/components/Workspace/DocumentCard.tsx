import { useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { DocumentMetadata } from '../../stores/workspace/types';

/**
 * DocumentCard Component
 *
 * Card displaying a document in the document manager grid
 * Features:
 * - Document title and metadata
 * - Last modified timestamp
 * - Click to open
 * - Actions menu (duplicate, export, delete)
 */

interface DocumentCardProps {
  metadata: DocumentMetadata;
  isOpen?: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
}

const DocumentCard = ({
  metadata,
  isOpen = false,
  onClick,
  onDuplicate,
  onExport,
  onDelete,
}: DocumentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`relative bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow group ${
        isOpen ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Open indicator badge */}
      {isOpen && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">
          Open
        </div>
      )}

      {/* Dirty indicator */}
      {metadata.isDirty && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"
          title="Unsaved changes"
        />
      )}

      {/* Actions menu button */}
      <button
        onClick={handleMenuClick}
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
        title="More actions"
      >
        <MoreVertIcon sx={{ fontSize: 18 }} className="text-gray-500" />
      </button>

      {/* Actions menu dropdown */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />

          {/* Menu */}
          <div className="absolute top-8 right-2 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]">
            <button
              onClick={(e) => handleAction(e, onDuplicate)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileCopyIcon sx={{ fontSize: 16 }} className="text-gray-500" />
              Duplicate
            </button>
            <button
              onClick={(e) => handleAction(e, onExport)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileDownloadIcon sx={{ fontSize: 16 }} className="text-gray-500" />
              Export
            </button>
            <hr className="my-1 border-gray-200" />
            <button
              onClick={(e) => handleAction(e, onDelete)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Color indicator */}
      {metadata.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: metadata.color }}
        />
      )}

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 pr-6 truncate">
        {metadata.title}
      </h3>

      {/* Metadata */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Modified: {formatDate(metadata.lastModified)}</div>
        {metadata.fileName && (
          <div className="truncate" title={metadata.fileName}>
            File: {metadata.fileName}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
