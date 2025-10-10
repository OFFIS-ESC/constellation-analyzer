import { useState, useCallback, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Tab Component
 *
 * Individual tab for a document with:
 * - Active/inactive states
 * - Dirty indicator (unsaved changes)
 * - Close button
 * - Double-click to rename
 * - Context menu support
 * - Programmatic rename trigger
 */

interface TabProps {
  id: string;
  title: string;
  isActive: boolean;
  isDirty: boolean;
  color?: string;
  onClick: () => void;
  onClose: () => void;
  onRename?: (newTitle: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  triggerRename?: boolean; // NEW: Trigger rename mode from outside
  onRenameDone?: () => void; // NEW: Notify when rename is complete
}

const Tab = ({
  title,
  isActive,
  isDirty,
  color,
  onClick,
  onClose,
  onRename,
  onContextMenu,
  triggerRename,
  onRenameDone,
}: TabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

  // Trigger edit mode when requested from outside
  useEffect(() => {
    if (triggerRename && onRename) {
      setEditValue(title);
      setIsEditing(true);
      onRenameDone?.(); // Clear the trigger
    }
  }, [triggerRename, onRename, title, onRenameDone]);

  const handleDoubleClick = useCallback(() => {
    if (onRename) {
      setEditValue(title);
      setIsEditing(true);
    }
  }, [title, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (editValue.trim()) {
          onRename?.(editValue.trim());
        }
        setIsEditing(false);
      } else if (e.key === 'Escape') {
        setEditValue(title);
        setIsEditing(false);
      }
    },
    [editValue, title, onRename]
  );

  const handleBlur = useCallback(() => {
    if (editValue.trim()) {
      onRename?.(editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, onRename]);

  const handleCloseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onContextMenu?.(e);
    },
    [onContextMenu]
  );

  return (
    <div
      className={`
        group relative flex items-center gap-2 px-4 py-2 min-w-[120px] max-w-[200px]
        border-r border-gray-200 cursor-pointer select-none
        transition-colors duration-150
        ${isActive
          ? 'bg-white border-b-2 border-b-blue-500'
          : 'bg-gray-50 hover:bg-gray-100'
        }
      `}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      style={color ? { borderLeftWidth: '3px', borderLeftColor: color } : undefined}
    >
      {/* Dirty indicator */}
      {isDirty && (
        <div
          className="w-2 h-2 rounded-full bg-orange-500"
          title="Unsaved changes"
        />
      )}

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className="flex-1 min-w-0 px-1 py-0 text-sm bg-white border border-blue-500 rounded outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className={`
            flex-1 min-w-0 text-sm truncate
            ${isActive ? 'font-semibold text-gray-900' : 'text-gray-600'}
          `}
          title={title}
        >
          {title}
        </span>
      )}

      {/* Close button */}
      <button
        onClick={handleCloseClick}
        className={`
          p-0.5 rounded hover:bg-gray-200 transition-opacity
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        title="Close tab"
      >
        <CloseIcon sx={{ fontSize: 16 }} className="text-gray-500" />
      </button>
    </div>
  );
};

export default Tab;
